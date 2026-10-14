import crypto from "node:crypto";
import argon2 from "argon2";
import type { PrismaClient } from "../../generated/prisma/client.js";
import {
  ConflictError,
  UnauthorizedError,
  NotFoundError,
  BadRequestError,
} from "../../common/errors/index.js";
import type {
  RegisterBody,
  LoginBody,
  ChangePasswordBody,
  UpdateProfileBody,
} from "./auth.schema.js";

export class AuthService {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Register a new student account with Argon2id hashed password
   */
  async register(data: RegisterBody) {
    const normalizedEmail = data.email.trim().toLowerCase();

    // Check if email already registered
    const existing = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      throw new ConflictError("A user with this email address already exists");
    }

    // Hash password with Argon2id
    const hashedPassword = await argon2.hash(data.password, {
      type: argon2.argon2id,
    });

    // Create user (Public registration defaults to STUDENT and ACTIVE)
    const user = await this.prisma.user.create({
      data: {
        email: normalizedEmail,
        name: data.name.trim(),
        password: hashedPassword,
        role: "STUDENT",
        status: "ACTIVE",
        department: data.department?.trim() || null,
        yearOfStudy: data.yearOfStudy || null,
        bio: data.bio?.trim() || null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        department: true,
        yearOfStudy: true,
        bio: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  }

  /**
   * Authenticate user credentials and create a persisted refresh token
   */
  async login(data: LoginBody) {
    const normalizedEmail = data.email.trim().toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    // Uniform 401 response to avoid user enumeration
    if (!user) {
      throw new UnauthorizedError("Invalid email or password");
    }

    if (user.status === "SUSPENDED") {
      throw new UnauthorizedError("Your account has been suspended. Please contact campus administration.");
    }

    const isPasswordValid = await argon2.verify(user.password, data.password);
    if (!isPasswordValid) {
      throw new UnauthorizedError("Invalid email or password");
    }

    // Generate secure random refresh token string
    const refreshTokenString = crypto.randomBytes(40).toString("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await this.prisma.refreshToken.create({
      data: {
        token: refreshTokenString,
        userId: user.id,
        expiresAt,
      },
    });

    const safeUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
      avatarUrl: user.avatarUrl,
      department: user.department,
      yearOfStudy: user.yearOfStudy,
    };

    return {
      user: safeUser,
      refreshToken: refreshTokenString,
      refreshTokenExpiresAt: expiresAt,
    };
  }

  /**
   * Rotate refresh token and return updated session
   */
  async refresh(tokenString: string) {
    if (!tokenString) {
      throw new UnauthorizedError("Refresh token missing");
    }

    const tokenRecord = await this.prisma.refreshToken.findUnique({
      where: { token: tokenString },
      include: { user: true },
    });

    if (!tokenRecord || tokenRecord.revokedAt || new Date() > tokenRecord.expiresAt) {
      throw new UnauthorizedError("Invalid or expired refresh token");
    }

    if (tokenRecord.user.status === "SUSPENDED") {
      throw new UnauthorizedError("Account suspended");
    }

    // Rotate: Revoke the old token
    await this.prisma.refreshToken.update({
      where: { id: tokenRecord.id },
      data: { revokedAt: new Date() },
    });

    // Create new refresh token
    const newRefreshTokenString = crypto.randomBytes(40).toString("hex");
    const newExpiresAt = new Date();
    newExpiresAt.setDate(newExpiresAt.getDate() + 7);

    await this.prisma.refreshToken.create({
      data: {
        token: newRefreshTokenString,
        userId: tokenRecord.userId,
        expiresAt: newExpiresAt,
      },
    });

    const safeUser = {
      id: tokenRecord.user.id,
      email: tokenRecord.user.email,
      name: tokenRecord.user.name,
      role: tokenRecord.user.role,
      status: tokenRecord.user.status,
      avatarUrl: tokenRecord.user.avatarUrl,
      department: tokenRecord.user.department,
      yearOfStudy: tokenRecord.user.yearOfStudy,
    };

    return {
      user: safeUser,
      newRefreshToken: newRefreshTokenString,
      refreshTokenExpiresAt: newExpiresAt,
    };
  }

  /**
   * Revoke refresh token on logout
   */
  async logout(tokenString?: string) {
    if (!tokenString) return;

    await this.prisma.refreshToken.updateMany({
      where: { token: tokenString, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  /**
   * Get user profile by ID
   */
  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        department: true,
        yearOfStudy: true,
        bio: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    return user;
  }

  /**
   * Update profile details
   */
  async updateProfile(userId: string, data: UpdateProfileBody) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.name ? { name: data.name.trim() } : {}),
        ...(data.department !== undefined ? { department: data.department?.trim() || null } : {}),
        ...(data.yearOfStudy !== undefined ? { yearOfStudy: data.yearOfStudy } : {}),
        ...(data.bio !== undefined ? { bio: data.bio?.trim() || null } : {}),
        ...(data.avatarUrl !== undefined ? { avatarUrl: data.avatarUrl?.trim() || null } : {}),
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        department: true,
        yearOfStudy: true,
        bio: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  }

  /**
   * Change password: verify existing with Argon2id, hash new with Argon2id, revoke tokens
   */
  async changePassword(userId: string, data: ChangePasswordBody) {
    if (data.currentPassword === data.newPassword) {
      throw new BadRequestError("New password must be different from current password");
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    const isValid = await argon2.verify(user.password, data.currentPassword);
    if (!isValid) {
      throw new UnauthorizedError("Current password is incorrect");
    }

    const newHashedPassword = await argon2.hash(data.newPassword, {
      type: argon2.argon2id,
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: { password: newHashedPassword },
    });

    // Security practice: Invalidate all active refresh tokens on password change
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}
