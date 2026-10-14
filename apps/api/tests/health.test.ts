import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../src/app.js";

describe("Module 1: Backend Foundation Tests", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  }, 20000);

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it("should return 200 and standard success response for /health", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/health",
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.success).toBe(true);
    expect(body.data.status).toBe("ok");
    expect(body.message).toBe("Service is healthy");
  });

  it("should return 200 or 503 and system metrics for /api/v1/health", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/v1/health",
    });

    expect([200, 503]).toContain(res.statusCode);
    const body = JSON.parse(res.payload);
    expect(body.success).toBe(true);
    expect(body.data).toHaveProperty("status");
    expect(body.data).toHaveProperty("uptime");
    expect(body.data).toHaveProperty("services");
    expect(body.data.services).toHaveProperty("database");
    expect(body.data).toHaveProperty("system");
    expect(body.data.system).toHaveProperty("memory");
  });

  it("should return standardized 404 response for unknown routes", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/v1/non-existent-path",
    });

    expect(res.statusCode).toBe(404);
    const body = JSON.parse(res.payload);
    expect(body.success).toBe(false);
    expect(body.error).toBeDefined();
    expect(body.error.code).toBe("NOT_FOUND");
    expect(body.error.message).toContain("GET /api/v1/non-existent-path not found");
  });
});
