import fp from "fastify-plugin";
import fastifyJwt from "@fastify/jwt";
import fastifyCookie from "@fastify/cookie";
import type { FastifyPluginAsync, FastifyRequest, FastifyReply } from "fastify";
import { env } from "../config/env.js";
import { UnauthorizedError, ForbiddenError } from "../common/errors/index.js";
import type { Role } from "../generated/prisma/enums.js";

export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
}

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: JwtPayload;
    user: JwtPayload;
  }
}

declare module "fastify" {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    authorize: (allowedRoles: Role[]) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

const authPlugin: FastifyPluginAsync = async (fastify) => {
  // Register Cookie plugin
  await fastify.register(fastifyCookie, {
    secret: env.COOKIE_SECRET,
  });

  // Register JWT plugin
  await fastify.register(fastifyJwt, {
    secret: env.JWT_SECRET,
    sign: {
      expiresIn: env.JWT_EXPIRES_IN,
    },
  });

  // Authentication decorator: verifies Bearer JWT
  fastify.decorate(
    "authenticate",
    async (request: FastifyRequest, _reply: FastifyReply): Promise<void> => {
      try {
        await request.jwtVerify();
      } catch (err: unknown) {
        throw new UnauthorizedError("Authentication required or token expired");
      }
    }
  );

  // Authorization decorator: enforces RBAC roles
  fastify.decorate(
    "authorize",
    (allowedRoles: Role[]) => {
      return async (request: FastifyRequest, _reply: FastifyReply): Promise<void> => {
        // Authenticate first if not already done
        if (!request.user) {
          try {
            await request.jwtVerify();
          } catch {
            throw new UnauthorizedError("Authentication required");
          }
        }

        if (!allowedRoles.includes(request.user.role)) {
          throw new ForbiddenError(
            `Access denied. Requires one of roles: [${allowedRoles.join(", ")}]`
          );
        }
      };
    }
  );
};

export default fp(authPlugin, {
  name: "auth",
  dependencies: ["cors"],
});
