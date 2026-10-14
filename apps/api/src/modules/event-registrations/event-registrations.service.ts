import type { PrismaClient } from "../../generated/prisma/client.js";
import type { Prisma } from "../../generated/prisma/client.js";
import type { Role, RegistrationStatus } from "../../generated/prisma/enums.js";
import {
  BadRequestError,
  NotFoundError,
  ConflictError,
  ForbiddenError,
} from "../../common/errors/index.js";
import type { ListParticipantsQuery } from "./event-registrations.schema.js";

export class EventRegistrationsService {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Register authenticated user for an event using database transaction
   */
  async registerForEvent(userId: string, eventId: string) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Fetch event details
      const event = await tx.event.findUnique({
        where: { id: eventId },
      });

      if (!event) {
        throw new NotFoundError("Event not found");
      }

      if (event.status !== "PUBLISHED") {
        throw new BadRequestError(`Cannot register for an event with status: ${event.status}`);
      }

      const now = new Date();
      if (now > event.registrationDeadline) {
        throw new BadRequestError("Registration deadline for this event has passed");
      }

      // 2. Check existing registration
      const existing = await tx.eventRegistration.findUnique({
        where: {
          eventId_userId: {
            eventId,
            userId,
          },
        },
      });

      if (existing && (existing.status === "REGISTERED" || existing.status === "ATTENDED")) {
        throw new ConflictError("You are already registered for this event");
      }

      // 3. Check capacity (count active registrations)
      const activeCount = await tx.eventRegistration.count({
        where: {
          eventId,
          status: { in: ["REGISTERED", "ATTENDED"] },
        },
      });

      if (activeCount >= event.capacity) {
        throw new ConflictError("Event has reached maximum capacity");
      }

      // 4. Upsert or update registration
      let registration;
      if (existing) {
        registration = await tx.eventRegistration.update({
          where: { id: existing.id },
          data: {
            status: "REGISTERED",
            registeredAt: now,
            attendedAt: null,
          },
          include: {
            event: true,
          },
        });
      } else {
        registration = await tx.eventRegistration.create({
          data: {
            eventId,
            userId,
            status: "REGISTERED",
            registeredAt: now,
          },
          include: {
            event: true,
          },
        });
      }

      // 5. Create in-app notification
      await tx.notification.create({
        data: {
          userId,
          type: "EVENT_REGISTRATION",
          title: "Event Registration Confirmed",
          message: `You have successfully registered for "${event.title}". We look forward to seeing you at ${event.venue}!`,
          link: `/events/${event.id}`,
        },
      });

      return registration;
    });
  }

  /**
   * Cancel an active registration
   */
  async cancelRegistration(userId: string, eventId: string) {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.eventRegistration.findUnique({
        where: {
          eventId_userId: {
            eventId,
            userId,
          },
        },
        include: { event: true },
      });

      if (!existing || existing.status === "CANCELLED") {
        throw new NotFoundError("No active registration found for this event");
      }

      const updated = await tx.eventRegistration.update({
        where: { id: existing.id },
        data: {
          status: "CANCELLED",
        },
      });

      // Create notification
      await tx.notification.create({
        data: {
          userId,
          type: "EVENT_CANCELLED",
          title: "Registration Cancelled",
          message: `Your registration for "${existing.event.title}" has been cancelled.`,
          link: `/events/${eventId}`,
        },
      });

      return updated;
    });
  }

  /**
   * Check if user is registered for an event
   */
  async getRegistrationStatus(userId: string, eventId: string) {
    const registration = await this.prisma.eventRegistration.findUnique({
      where: {
        eventId_userId: {
          eventId,
          userId,
        },
      },
    });

    const isRegistered = !!registration && (registration.status === "REGISTERED" || registration.status === "ATTENDED");
    return {
      isRegistered,
      registration,
    };
  }

  /**
   * Get all registrations for a student
   */
  async getMyRegistrations(userId: string) {
    const registrations = await this.prisma.eventRegistration.findMany({
      where: { userId },
      orderBy: { registeredAt: "desc" },
      include: {
        event: {
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
        },
      },
    });

    return registrations;
  }

  /**
   * Get event participants (restricted to Organizer or Admin)
   */
  async getEventParticipants(
    eventId: string,
    currentUserId: string,
    currentUserRole: Role,
    query: ListParticipantsQuery
  ) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundError("Event not found");
    }

    // Authorization guard
    if (currentUserRole !== "ADMIN" && event.organizerId !== currentUserId) {
      throw new ForbiddenError("You are not authorized to view the participant roster for this event");
    }

    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.EventRegistrationWhereInput = {
      eventId,
    };

    if (query.status) {
      where.status = query.status;
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

    const [participants, total] = await Promise.all([
      this.prisma.eventRegistration.findMany({
        where,
        orderBy: { registeredAt: "asc" },
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
              department: true,
              yearOfStudy: true,
            },
          },
        },
      }),
      this.prisma.eventRegistration.count({ where }),
    ]);

    return {
      participants,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Track / update participant attendance (Organizer or Admin)
   */
  async updateAttendance(
    eventId: string,
    targetUserId: string,
    currentUserId: string,
    currentUserRole: Role,
    status: RegistrationStatus
  ) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundError("Event not found");
    }

    if (currentUserRole !== "ADMIN" && event.organizerId !== currentUserId) {
      throw new ForbiddenError("You are not authorized to update attendance for this event");
    }

    const existing = await this.prisma.eventRegistration.findUnique({
      where: {
        eventId_userId: {
          eventId,
          userId: targetUserId,
        },
      },
    });

    if (!existing) {
      throw new NotFoundError("Registration record for this user was not found");
    }

    const updated = await this.prisma.eventRegistration.update({
      where: { id: existing.id },
      data: {
        status,
        attendedAt: status === "ATTENDED" ? new Date() : null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return updated;
  }
}
