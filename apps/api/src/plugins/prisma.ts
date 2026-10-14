import fp from "fastify-plugin";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../generated/prisma/client.js";
import { env } from "../config/env.js";
import type { FastifyPluginAsync } from "fastify";

declare module "fastify" {
  interface FastifyInstance {
    prisma: PrismaClient;
  }
}

const prismaPlugin: FastifyPluginAsync = async (fastify) => {
  const adapter = new PrismaMariaDb({
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    connectionLimit: 10,
  });

  const prisma = new PrismaClient({
    adapter,
    log: env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

  try {
    await prisma.$connect();
    fastify.log.info(" Connected to MySQL database via Prisma 7");
  } catch (err) {
    fastify.log.error(err, "⚠️ Failed to connect to database during startup");
  }

  fastify.decorate("prisma", prisma);

  fastify.addHook("onClose", async (instance) => {
    instance.log.info("Disconnecting Prisma Client...");
    await instance.prisma.$disconnect();
  });
};

export default fp(prismaPlugin, {
  name: "prisma",
});
