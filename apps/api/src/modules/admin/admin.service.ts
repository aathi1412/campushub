import type { PrismaClient, Prisma } from "../../generated/prisma/client.js";
import type { Role, AccountStatus } from "../../generated/prisma/enums.js";
import { BadRequestError, NotFoundError } from "../../common/errors/index.js";

export interface AdminUsersQuery {
  search?: string;
  role?: Role;
  status?: AccountStatus;
  page?: number;
  limit?: number;
}

export class AdminService {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * System-wide telemetry & aggregation statistics
   */
  async getAnalytics() {
    const [
      // Users
      totalUsers,
      studentsCount,
      clubLeadersCount,
      adminsCount,
      activeUsersCount,
      suspendedUsersCount,
      pendingUsersCount,

      // Events
      totalEvents,
      publishedEvents,
      draftEvents,
      completedEvents,
      cancelledEvents,
      totalRegistrations,
      attendedRegistrations,

      // Clubs
      totalClubs,
      activeClubs,
      totalMemberships,

      // Projects
      totalProjects,
      planningProjects,
      inProgressProjects,
      completedProjects,
      archivedProjects,
      totalTasks,

      // Community
      totalPosts,
      announcementsCount,
      lostFoundCount,
      activePolls,
      totalPollVotes,

      // Recent Activity
      recentUsers,
      recentEvents,
    ] = await Promise.all([
      // Users counts
      this.prisma.user.count(),
      this.prisma.user.count({ where: { role: "STUDENT" } }),
      this.prisma.user.count({ where: { role: "CLUB_LEADER" } }),
      this.prisma.user.count({ where: { role: "ADMIN" } }),
      this.prisma.user.count({ where: { status: "ACTIVE" } }),
      this.prisma.user.count({ where: { status: "SUSPENDED" } }),
      this.prisma.user.count({ where: { status: "PENDING" } }),

      // Events counts
      this.prisma.event.count(),
      this.prisma.event.count({ where: { status: "PUBLISHED" } }),
      this.prisma.event.count({ where: { status: "DRAFT" } }),
      this.prisma.event.count({ where: { status: "COMPLETED" } }),
      this.prisma.event.count({ where: { status: "CANCELLED" } }),
      this.prisma.eventRegistration.count(),
      this.prisma.eventRegistration.count({ where: { status: "ATTENDED" } }),

      // Clubs counts
      this.prisma.club.count(),
      this.prisma.club.count({ where: { isActive: true } }),
      this.prisma.clubMembership.count({ where: { status: "APPROVED" } }),

      // Projects counts
      this.prisma.project.count(),
      this.prisma.project.count({ where: { status: "PLANNING" } }),
      this.prisma.project.count({ where: { status: "IN_PROGRESS" } }),
      this.prisma.project.count({ where: { status: "COMPLETED" } }),
      this.prisma.project.count({ where: { status: "ARCHIVED" } }),
      this.prisma.projectTask.count(),

      // Community counts
      this.prisma.communityPost.count(),
      this.prisma.communityPost.count({ where: { type: "ANNOUNCEMENT" } }),
      this.prisma.communityPost.count({ where: { type: "LOST_AND_FOUND" } }),
      this.prisma.poll.count({ where: { expiresAt: { gt: new Date() } } }),
      this.prisma.pollVote.count(),

      // Recent items
      this.prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
          department: true,
          createdAt: true,
        },
      }),
      this.prisma.event.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          status: true,
          category: true,
          startTime: true,
          createdAt: true,
        },
      }),
    ]);

    const attendanceRatePercent =
      totalRegistrations > 0
        ? Math.round((attendedRegistrations / totalRegistrations) * 100)
        : 0;

    return {
      users: {
        total: totalUsers,
        students: studentsCount,
        clubLeaders: clubLeadersCount,
        admins: adminsCount,
        active: activeUsersCount,
        suspended: suspendedUsersCount,
        pending: pendingUsersCount,
      },
      events: {
        total: totalEvents,
        published: publishedEvents,
        draft: draftEvents,
        completed: completedEvents,
        cancelled: cancelledEvents,
        totalRegistrations,
        attendedRegistrations,
        attendanceRatePercent,
      },
      clubs: {
        total: totalClubs,
        active: activeClubs,
        totalMemberships,
      },
      projects: {
        total: totalProjects,
        planning: planningProjects,
        inProgress: inProgressProjects,
        completed: completedProjects,
        archived: archivedProjects,
        totalTasks,
      },
      community: {
        totalPosts,
        announcements: announcementsCount,
        lostAndFound: lostFoundCount,
        activePolls,
        totalPollVotes,
      },
      recentUsers,
      recentEvents,
    };
  }

  /**
   * List users with search, filtering, and role/membership statistics
   */
  async listUsers(query: AdminUsersQuery) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const andConditions: Prisma.UserWhereInput[] = [];

    if (query.role) {
      andConditions.push({ role: query.role });
    }

    if (query.status) {
      andConditions.push({ status: query.status });
    }

    if (query.search && query.search.trim()) {
      const q = query.search.trim();
      andConditions.push({
        OR: [
          { name: { contains: q } },
          { email: { contains: q } },
          { department: { contains: q } },
        ],
      });
    }

    const where: Prisma.UserWhereInput =
      andConditions.length > 0 ? { AND: andConditions } : {};

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
          department: true,
          yearOfStudy: true,
          bio: true,
          avatarUrl: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              ledClubs: true,
              clubMemberships: true,
              eventRegistrations: true,
              ownedProjects: true,
            },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      users,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Update user role (Admins cannot change their own role)
   */
  async updateUserRole(adminId: string, targetUserId: string, role: Role) {
    if (adminId === targetUserId) {
      throw new BadRequestError("Administrators cannot alter their own role");
    }

    const user = await this.prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!user) {
      throw new NotFoundError("Target user not found");
    }

    const updated = await this.prisma.user.update({
      where: { id: targetUserId },
      data: { role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        department: true,
        updatedAt: true,
      },
    });

    return updated;
  }

  /**
   * Update user account status (Admins cannot suspend their own account)
   */
  async updateUserStatus(
    adminId: string,
    targetUserId: string,
    status: AccountStatus
  ) {
    if (adminId === targetUserId) {
      throw new BadRequestError("Administrators cannot modify their own account status");
    }

    const user = await this.prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!user) {
      throw new NotFoundError("Target user not found");
    }

    // If suspending user, revoke all active refresh tokens immediately
    if (status === "SUSPENDED") {
      await this.prisma.refreshToken.deleteMany({
        where: { userId: targetUserId },
      });
    }

    const updated = await this.prisma.user.update({
      where: { id: targetUserId },
      data: { status },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        department: true,
        updatedAt: true,
      },
    });

    return updated;
  }

  /**
   * Moderate community post
   */
  async moderatePost(postId: string, isModerated: boolean) {
    const post = await this.prisma.communityPost.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundError("Post not found");
    }

    return this.prisma.communityPost.update({
      where: { id: postId },
      data: { isModerated },
    });
  }

  /**
   * Pin / Unpin community post
   */
  async pinPost(postId: string, isPinned: boolean) {
    const post = await this.prisma.communityPost.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundError("Post not found");
    }

    return this.prisma.communityPost.update({
      where: { id: postId },
      data: { isPinned },
    });
  }
}
