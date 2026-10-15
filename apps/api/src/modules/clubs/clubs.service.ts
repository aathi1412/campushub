import type { PrismaClient, Prisma } from "../../generated/prisma/client.js";
import type { MembershipStatus, ClubMembershipRole } from "../../generated/prisma/enums.js";
import {
  BadRequestError,
  NotFoundError,
  ConflictError,
  ForbiddenError,
} from "../../common/errors/index.js";
import type {
  CreateClubBody,
  UpdateClubBody,
  ListClubsQuery,
  ListClubMembersQuery,
  UpdateMemberStatusRoleBody,
} from "./clubs.schema.js";

export class ClubsService {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Helper: Check if user has manager permissions for a club (Admin, Leader, or Approved Officer)
   */
  private async isClubManager(
    clubId: string,
    userId?: string,
    userRole?: string
  ): Promise<{ isManager: boolean; isLeader: boolean; isOfficer: boolean }> {
    if (!userId) {
      return { isManager: false, isLeader: false, isOfficer: false };
    }

    if (userRole === "ADMIN") {
      return { isManager: true, isLeader: true, isOfficer: true };
    }

    const club = await this.prisma.club.findUnique({
      where: { id: clubId },
      select: { leaderId: true },
    });

    if (!club) {
      return { isManager: false, isLeader: false, isOfficer: false };
    }

    if (club.leaderId === userId) {
      return { isManager: true, isLeader: true, isOfficer: false };
    }

    const membership = await this.prisma.clubMembership.findUnique({
      where: { clubId_userId: { clubId, userId } },
      select: { role: true, status: true },
    });

    const isOfficer =
      membership?.status === "APPROVED" &&
      (membership?.role === "OFFICER" || membership?.role === "LEADER");

    return {
      isManager: isOfficer,
      isLeader: false,
      isOfficer,
    };
  }

  /**
   * List clubs with search, category filtering, and member counts
   */
  async listClubs(
    query: ListClubsQuery,
    currentUserId?: string,
    currentUserRole?: string
  ) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 12));
    const skip = (page - 1) * limit;

    const where: Prisma.ClubWhereInput = {};

    // Active status filter: default to active for students/public
    if (currentUserRole === "ADMIN" && typeof query.isActive === "boolean") {
      where.isActive = query.isActive;
    } else {
      where.isActive = true;
    }

    // Category filter
    if (query.category) {
      where.category = query.category;
    }

    // Search filter across name and description
    if (query.search?.trim()) {
      const searchTerm = query.search.trim();
      where.OR = [
        { name: { contains: searchTerm } },
        { description: { contains: searchTerm } },
      ];
    }

    const sortBy = query.sortBy || "name";
    const sortOrder = query.sortOrder || "asc";
    const orderBy: Prisma.ClubOrderByWithRelationInput = { [sortBy]: sortOrder };

    const [total, clubs] = await Promise.all([
      this.prisma.club.count({ where }),
      this.prisma.club.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          leader: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
              department: true,
            },
          },
          _count: {
            select: {
              memberships: {
                where: { status: "APPROVED" },
              },
              events: true,
            },
          },
        },
      }),
    ]);

    // If user is authenticated, attach user's membership for each club
    const userMembershipsMap = new Map<string, { status: MembershipStatus; role: ClubMembershipRole }>();
    if (currentUserId && clubs.length > 0) {
      const clubIds = clubs.map((c: { id: string }) => c.id);
      const memberships = await this.prisma.clubMembership.findMany({
        where: {
          clubId: { in: clubIds },
          userId: currentUserId,
        },
        select: {
          clubId: true,
          status: true,
          role: true,
        },
      });

      for (const m of memberships) {
        userMembershipsMap.set(m.clubId, { status: m.status, role: m.role });
      }
    }

    const formattedClubs = clubs.map((club: typeof clubs[number]) => ({
      id: club.id,
      name: club.name,
      description: club.description,
      category: club.category,
      logoUrl: club.logoUrl,
      bannerUrl: club.bannerUrl,
      isActive: club.isActive,
      createdAt: club.createdAt,
      updatedAt: club.updatedAt,
      leader: club.leader,
      memberCount: club._count.memberships,
      eventCount: club._count.events,
      userMembership: userMembershipsMap.get(club.id) || null,
    }));

    return {
      clubs: formattedClubs,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Get single club details
   */
  async getClubById(clubId: string, currentUserId?: string) {
    const club = await this.prisma.club.findUnique({
      where: { id: clubId },
      include: {
        leader: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            department: true,
          },
        },
        _count: {
          select: {
            memberships: {
              where: { status: "APPROVED" },
            },
            events: true,
          },
        },
        events: {
          where: { status: "PUBLISHED" },
          take: 6,
          orderBy: { startTime: "asc" },
          select: {
            id: true,
            title: true,
            category: true,
            startTime: true,
            endTime: true,
            venue: true,
            capacity: true,
            bannerUrl: true,
          },
        },
      },
    });

    if (!club) {
      throw new NotFoundError("Club not found");
    }

    let userMembership: any = null;
    if (currentUserId) {
      const membership = await this.prisma.clubMembership.findUnique({
        where: {
          clubId_userId: {
            clubId,
            userId: currentUserId,
          },
        },
        select: {
          id: true,
          status: true,
          role: true,
          joinedAt: true,
          createdAt: true,
        },
      });
      userMembership = membership;
    }

    return {
      id: club.id,
      name: club.name,
      description: club.description,
      category: club.category,
      logoUrl: club.logoUrl,
      bannerUrl: club.bannerUrl,
      isActive: club.isActive,
      createdAt: club.createdAt,
      updatedAt: club.updatedAt,
      leader: club.leader,
      memberCount: club._count.memberships,
      eventCount: club._count.events,
      upcomingEvents: club.events,
      userMembership,
    };
  }

  /**
   * Create a new club (Restricted to CLUB_LEADER or ADMIN)
   */
  async createClub(userId: string, body: CreateClubBody) {
    const trimmedName = body.name.trim();

    // Check unique name
    const existing = await this.prisma.club.findUnique({
      where: { name: trimmedName },
    });

    if (existing) {
      throw new ConflictError("A club with this name already exists");
    }

    // Atomic transaction: create club and assign creator as approved leader
    const club = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const newClub = await tx.club.create({
        data: {
          name: trimmedName,
          description: body.description.trim(),
          category: body.category.trim(),
          logoUrl: body.logoUrl?.trim() || null,
          bannerUrl: body.bannerUrl?.trim() || null,
          leaderId: userId,
          isActive: true,
        },
        include: {
          leader: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
              department: true,
            },
          },
        },
      });

      await tx.clubMembership.create({
        data: {
          clubId: newClub.id,
          userId,
          role: "LEADER",
          status: "APPROVED",
          joinedAt: new Date(),
        },
      });

      return newClub;
    });

    return {
      ...club,
      memberCount: 1,
      userMembership: {
        role: "LEADER",
        status: "APPROVED",
      },
    };
  }

  /**
   * Update club details
   */
  async updateClub(
    clubId: string,
    userId: string,
    userRole: string,
    body: UpdateClubBody
  ) {
    const club = await this.prisma.club.findUnique({
      where: { id: clubId },
    });

    if (!club) {
      throw new NotFoundError("Club not found");
    }

    const { isManager, isLeader } = await this.isClubManager(
      clubId,
      userId,
      userRole
    );

    if (!isManager && !isLeader && userRole !== "ADMIN") {
      throw new ForbiddenError("You do not have permission to update this club");
    }

    // If updating name, verify uniqueness
    if (body.name && body.name.trim() !== club.name) {
      const nameConflict = await this.prisma.club.findUnique({
        where: { name: body.name.trim() },
      });
      if (nameConflict) {
        throw new ConflictError("A club with this name already exists");
      }
    }

    // Only Leader or Admin can toggle isActive
    if (typeof body.isActive === "boolean" && !isLeader && userRole !== "ADMIN") {
      throw new ForbiddenError("Only club leaders or admins can activate/deactivate a club");
    }

    const updated = await this.prisma.club.update({
      where: { id: clubId },
      data: {
        name: body.name ? body.name.trim() : undefined,
        description: body.description ? body.description.trim() : undefined,
        category: body.category ? body.category.trim() : undefined,
        logoUrl: body.logoUrl !== undefined ? body.logoUrl?.trim() || null : undefined,
        bannerUrl: body.bannerUrl !== undefined ? body.bannerUrl?.trim() || null : undefined,
        isActive: body.isActive !== undefined ? body.isActive : undefined,
      },
      include: {
        leader: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            department: true,
          },
        },
        _count: {
          select: {
            memberships: {
              where: { status: "APPROVED" },
            },
          },
        },
      },
    });

    return {
      ...updated,
      memberCount: updated._count.memberships,
    };
  }

  /**
   * Delete or deactivate club
   */
  async deleteClub(clubId: string, userId: string, userRole: string) {
    const club = await this.prisma.club.findUnique({
      where: { id: clubId },
    });

    if (!club) {
      throw new NotFoundError("Club not found");
    }

    if (club.leaderId !== userId && userRole !== "ADMIN") {
      throw new ForbiddenError("Only the club leader or an admin can deactivate this club");
    }

    // Soft delete club
    await this.prisma.club.update({
      where: { id: clubId },
      data: { isActive: false },
    });

    return { message: "Club deactivated successfully" };
  }

  /**
   * Join club request
   */
  async joinClub(clubId: string, userId: string) {
    const club = await this.prisma.club.findUnique({
      where: { id: clubId },
      include: {
        leader: {
          select: { id: true, name: true },
        },
      },
    });

    if (!club) {
      throw new NotFoundError("Club not found");
    }

    if (!club.isActive) {
      throw new BadRequestError("Cannot join an inactive club");
    }

    const existingMembership = await this.prisma.clubMembership.findUnique({
      where: {
        clubId_userId: {
          clubId,
          userId,
        },
      },
    });

    if (existingMembership) {
      if (existingMembership.status === "APPROVED") {
        throw new ConflictError("You are already an active member of this club");
      }
      if (existingMembership.status === "PENDING") {
        throw new ConflictError("Your membership request is already pending review");
      }
    }

    // Fetch user details for notification
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });

    const membership = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const result = await tx.clubMembership.upsert({
        where: {
          clubId_userId: {
            clubId,
            userId,
          },
        },
        update: {
          status: "PENDING",
          role: "MEMBER",
          joinedAt: null,
        },
        create: {
          clubId,
          userId,
          status: "PENDING",
          role: "MEMBER",
        },
      });

      // Send notification to the club leader
      if (club.leaderId !== userId) {
        await tx.notification.create({
          data: {
            userId: club.leaderId,
            type: "CLUB_MEMBERSHIP_UPDATE",
            title: "New Membership Request",
            message: `${user?.name || "A student"} requested to join ${club.name}.`,
            link: `/clubs/${club.id}`,
          },
        });
      }

      return result;
    });

    return {
      membership,
      message: "Membership request submitted successfully and is pending approval",
    };
  }

  /**
   * Leave club
   */
  async leaveClub(clubId: string, userId: string) {
    const club = await this.prisma.club.findUnique({
      where: { id: clubId },
    });

    if (!club) {
      throw new NotFoundError("Club not found");
    }

    if (club.leaderId === userId) {
      throw new BadRequestError(
        "Club leader cannot leave the club. Please transfer leadership or deactivate the club."
      );
    }

    const membership = await this.prisma.clubMembership.findUnique({
      where: {
        clubId_userId: {
          clubId,
          userId,
        },
      },
    });

    if (!membership || membership.status !== "APPROVED") {
      throw new BadRequestError("You are not an active member of this club");
    }

    await this.prisma.clubMembership.update({
      where: {
        clubId_userId: {
          clubId,
          userId,
        },
      },
      data: {
        status: "LEFT",
      },
    });

    return { message: "You have successfully left the club" };
  }

  /**
   * List club members (Public can view approved; leaders/officers/admins can view all statuses)
   */
  async listClubMembers(
    clubId: string,
    query: ListClubMembersQuery,
    userId?: string,
    userRole?: string
  ) {
    const club = await this.prisma.club.findUnique({
      where: { id: clubId },
    });

    if (!club) {
      throw new NotFoundError("Club not found");
    }

    const { isManager } = await this.isClubManager(clubId, userId, userRole);

    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.ClubMembershipWhereInput = { clubId };

    // Permissions: non-managers can ONLY see APPROVED members
    if (isManager && query.status) {
      where.status = query.status;
    } else if (!isManager) {
      where.status = "APPROVED";
    }

    if (query.role) {
      where.role = query.role;
    }

    if (query.search?.trim()) {
      const term = query.search.trim();
      where.user = {
        OR: [
          { name: { contains: term } },
          { email: { contains: term } },
          { department: { contains: term } },
        ],
      };
    }

    const [total, members] = await Promise.all([
      this.prisma.clubMembership.count({ where }),
      this.prisma.clubMembership.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ role: "asc" }, { createdAt: "desc" }],
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
              department: true,
              yearOfStudy: true,
              role: true,
            },
          },
        },
      }),
    ]);

    return {
      members,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Update member status (Approve/Reject) or Role (Member/Officer)
   */
  async updateMember(
    clubId: string,
    targetUserId: string,
    userId: string,
    userRole: string,
    body: UpdateMemberStatusRoleBody
  ) {
    const club = await this.prisma.club.findUnique({
      where: { id: clubId },
    });

    if (!club) {
      throw new NotFoundError("Club not found");
    }

    const { isManager, isLeader } = await this.isClubManager(
      clubId,
      userId,
      userRole
    );

    if (!isManager && userRole !== "ADMIN") {
      throw new ForbiddenError("You do not have permission to manage club members");
    }

    // Protection: Cannot modify the primary club leader
    if (club.leaderId === targetUserId) {
      throw new BadRequestError("Cannot alter the status or role of the primary club leader");
    }

    const targetMembership = await this.prisma.clubMembership.findUnique({
      where: {
        clubId_userId: {
          clubId,
          userId: targetUserId,
        },
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    if (!targetMembership) {
      throw new NotFoundError("Membership record not found");
    }

    // Officers cannot promote to OFFICER or modify existing Officers
    if (!isLeader && userRole !== "ADMIN") {
      if (body.role === "OFFICER" || targetMembership.role === "OFFICER") {
        throw new ForbiddenError("Only club leaders or admins can manage officer roles");
      }
    }

    const updateData: Prisma.ClubMembershipUpdateInput = {};
    let notificationMessage = "";

    if (body.status) {
      updateData.status = body.status;
      if (body.status === "APPROVED") {
        updateData.joinedAt = new Date();
        notificationMessage = `Your membership request for ${club.name} was approved! Welcome aboard.`;
      } else if (body.status === "REJECTED") {
        updateData.joinedAt = null;
        notificationMessage = `Your membership request for ${club.name} was not approved at this time.`;
      }
    }

    if (body.role) {
      updateData.role = body.role;
      if (body.role === "OFFICER") {
        notificationMessage = `Congratulations! You have been appointed as an OFFICER in ${club.name}.`;
      }
    }

    const updated = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const res = await tx.clubMembership.update({
        where: {
          clubId_userId: {
            clubId,
            userId: targetUserId,
          },
        },
        data: updateData,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
              department: true,
            },
          },
        },
      });

      if (notificationMessage) {
        await tx.notification.create({
          data: {
            userId: targetUserId,
            type: "CLUB_MEMBERSHIP_UPDATE",
            title: "Club Membership Updated",
            message: notificationMessage,
            link: `/clubs/${club.id}`,
          },
        });
      }

      return res;
    });

    return updated;
  }

  /**
   * Get clubs that the current user belongs to
   */
  async getUserClubs(userId: string) {
    const memberships = await this.prisma.clubMembership.findMany({
      where: {
        userId,
        status: { in: ["APPROVED", "PENDING"] },
      },
      orderBy: { createdAt: "desc" },
      include: {
        club: {
          include: {
            leader: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
              },
            },
            _count: {
              select: {
                memberships: { where: { status: "APPROVED" } },
                events: true,
              },
            },
          },
        },
      },
    });

    return memberships.map((m: typeof memberships[number]) => ({
      membershipId: m.id,
      status: m.status,
      role: m.role,
      joinedAt: m.joinedAt,
      createdAt: m.createdAt,
      club: {
        id: m.club.id,
        name: m.club.name,
        description: m.club.description,
        category: m.club.category,
        logoUrl: m.club.logoUrl,
        bannerUrl: m.club.bannerUrl,
        isActive: m.club.isActive,
        leader: m.club.leader,
        memberCount: m.club._count.memberships,
        eventCount: m.club._count.events,
      },
    }));
  }
}
