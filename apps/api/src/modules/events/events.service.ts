import type { PrismaClient } from "../../generated/prisma/client.js";
import type { Prisma } from "../../generated/prisma/client.js";
import type { Role } from "../../generated/prisma/enums.js";
import {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
} from "../../common/errors/index.js";
import type {
  CreateEventBody,
  UpdateEventBody,
  ListEventsQuery,
} from "./events.schema.js";

export class EventsService {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Create a new campus event
   */
  async createEvent(organizerId: string, data: CreateEventBody) {
    const start = new Date(data.startTime);
    const end = new Date(data.endTime);
    const deadline = new Date(data.registrationDeadline);

    if (isNaN(start.getTime()) || isNaN(end.getTime()) || isNaN(deadline.getTime())) {
      throw new BadRequestError("Invalid date format provided");
    }

    if (start >= end) {
      throw new BadRequestError("Event start time must be before end time");
    }

    if (deadline > start) {
      throw new BadRequestError("Registration deadline cannot be after the event start time");
    }

    if (data.clubId) {
      const club = await this.prisma.club.findUnique({
        where: { id: data.clubId },
      });
      if (!club) {
        throw new NotFoundError("Specified club not found");
      }
    }

    const event = await this.prisma.event.create({
      data: {
        title: data.title.trim(),
        description: data.description.trim(),
        category: data.category,
        venue: data.venue.trim(),
        startTime: start,
        endTime: end,
        registrationDeadline: deadline,
        capacity: data.capacity,
        bannerUrl: data.bannerUrl?.trim() || null,
        status: data.status || "PUBLISHED",
        organizerId,
        clubId: data.clubId || null,
      },
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        club: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
          },
        },
        _count: {
          select: {
            registrations: true,
          },
        },
      },
    });

    return event;
  }

  /**
   * List events with search, filtering, and pagination
   */
  async listEvents(query: ListEventsQuery, currentUserId?: string, currentUserRole?: Role) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 10));
    const skip = (page - 1) * limit;

    const andConditions: Prisma.EventWhereInput[] = [];
    const now = new Date();

    // 1. Text Search (title, description, venue)
    if (query.search?.trim()) {
      const term = query.search.trim();
      andConditions.push({
        OR: [
          { title: { contains: term } },
          { description: { contains: term } },
          { venue: { contains: term } },
        ],
      });
    }

    // 2. Category Filter
    if (query.category) {
      andConditions.push({ category: query.category });
    }

    // 3. Status Filter & Visibility Rules
    const isStaffOrAdmin = currentUserRole === "ADMIN" || currentUserRole === "CLUB_LEADER";

    if (query.status) {
      // If client requests DRAFT status, only allow if staff/admin or filtering own events
      if (query.status === "DRAFT" && !isStaffOrAdmin && query.organizerId !== currentUserId) {
        throw new ForbiddenError("You cannot view draft events of other organizers");
      }
      andConditions.push({ status: query.status });
    } else if (!isStaffOrAdmin) {
      // By default, exclude DRAFT unless the event belongs to the current user
      andConditions.push({
        OR: [
          { status: { in: ["PUBLISHED", "CANCELLED", "COMPLETED"] } },
          ...(currentUserId ? [{ organizerId: currentUserId, status: "DRAFT" as const }] : []),
        ],
      });
    }

    // 4. Timeframe Filter
    if (query.timeframe === "upcoming") {
      andConditions.push({ startTime: { gte: now } });
    } else if (query.timeframe === "past") {
      andConditions.push({ endTime: { lt: now } });
    }

    // 5. Organizer & Club Filters
    if (query.organizerId) {
      andConditions.push({ organizerId: query.organizerId });
    }
    if (query.clubId) {
      andConditions.push({ clubId: query.clubId });
    }

    const where: Prisma.EventWhereInput =
      andConditions.length > 0 ? { AND: andConditions } : {};

    // 6. Sorting
    const sortBy = query.sortBy || "startTime";
    const sortOrder = query.sortOrder || "asc";
    const orderBy: Prisma.EventOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    const [events, total] = await Promise.all([
      this.prisma.event.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          organizer: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
            },
          },
          club: {
            select: {
              id: true,
              name: true,
              logoUrl: true,
            },
          },
          _count: {
            select: {
              registrations: true,
            },
          },
        },
      }),
      this.prisma.event.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      events,
      meta: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  /**
   * Get single event by ID
   */
  async getEventById(id: string, currentUserId?: string, currentUserRole?: Role) {
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            department: true,
          },
        },
        club: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
          },
        },
        _count: {
          select: {
            registrations: true,
          },
        },
      },
    });

    if (!event) {
      throw new NotFoundError("Event not found");
    }

    // Protect draft events from unauthorized viewers
    if (event.status === "DRAFT") {
      const isOwner = currentUserId && event.organizerId === currentUserId;
      const isAdmin = currentUserRole === "ADMIN";
      if (!isOwner && !isAdmin) {
        throw new NotFoundError("Event not found");
      }
    }

    return event;
  }

  /**
   * Update an existing event
   */
  async updateEvent(id: string, userId: string, userRole: Role, data: UpdateEventBody) {
    const existing = await this.prisma.event.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError("Event not found");
    }

    // Ownership check: Organizer or Admin
    if (userRole !== "ADMIN" && existing.organizerId !== userId) {
      throw new ForbiddenError("You are not authorized to update this event");
    }

    // Validate dates if any were updated
    const start = data.startTime ? new Date(data.startTime) : existing.startTime;
    const end = data.endTime ? new Date(data.endTime) : existing.endTime;
    const deadline = data.registrationDeadline
      ? new Date(data.registrationDeadline)
      : existing.registrationDeadline;

    if (start >= end) {
      throw new BadRequestError("Event start time must be before end time");
    }

    if (deadline > start) {
      throw new BadRequestError("Registration deadline cannot be after start time");
    }

    const updated = await this.prisma.event.update({
      where: { id },
      data: {
        ...(data.title ? { title: data.title.trim() } : {}),
        ...(data.description ? { description: data.description.trim() } : {}),
        ...(data.category ? { category: data.category } : {}),
        ...(data.venue ? { venue: data.venue.trim() } : {}),
        ...(data.startTime ? { startTime: start } : {}),
        ...(data.endTime ? { endTime: end } : {}),
        ...(data.registrationDeadline ? { registrationDeadline: deadline } : {}),
        ...(data.capacity !== undefined ? { capacity: data.capacity } : {}),
        ...(data.bannerUrl !== undefined ? { bannerUrl: data.bannerUrl?.trim() || null } : {}),
        ...(data.status ? { status: data.status } : {}),
        ...(data.clubId !== undefined ? { clubId: data.clubId || null } : {}),
      },
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        club: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
          },
        },
        _count: {
          select: {
            registrations: true,
          },
        },
      },
    });

    return updated;
  }

  /**
   * Delete or cancel an event
   */
  async deleteEvent(id: string, userId: string, userRole: Role) {
    const existing = await this.prisma.event.findUnique({
      where: { id },
      include: {
        _count: {
          select: { registrations: true },
        },
      },
    });

    if (!existing) {
      throw new NotFoundError("Event not found");
    }

    // Ownership check: Organizer or Admin
    if (userRole !== "ADMIN" && existing.organizerId !== userId) {
      throw new ForbiddenError("You are not authorized to delete this event");
    }

    // If event has existing registrations, transition to CANCELLED to preserve history
    if (existing._count.registrations > 0) {
      await this.prisma.event.update({
        where: { id },
        data: { status: "CANCELLED" },
      });
      return { status: "CANCELLED", message: "Event has active registrations and was marked as CANCELLED" };
    }

    // Otherwise, safely hard delete
    await this.prisma.event.delete({
      where: { id },
    });

    return { status: "DELETED", message: "Event deleted successfully" };
  }
}
