import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { createApp } from "../../server/app";
import type { Express } from "express";
import { buildLoginPayload } from "../helpers/factories";

let app: Express;

beforeAll(async () => {
  const result = await createApp();
  app = result.app;
});

describe("P0-AUTH: Authentication Endpoints", () => {
  describe("POST /api/auth/login (P0-AUTH-1)", () => {
    it("returns 200 with valid credentials", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send(buildLoginPayload());

      expect(res.status).toBe(200);
      expect(res.body.user).toBeDefined();
      expect(res.body.user.username).toBe("testadmin");
      expect(res.body.user.isAdmin).toBe(true);
    });

    it("returns 400 VALIDATION_ERROR when username missing", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ password: "testpassword123" });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
      expect(Array.isArray(res.body.error.details)).toBe(true);
      expect(res.body.error.details.some((d: { path: string }) => d.path === "username")).toBe(true);
    });

    it("returns 400 VALIDATION_ERROR when password missing", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ username: "testadmin" });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
      expect(Array.isArray(res.body.error.details)).toBe(true);
      expect(res.body.error.details.some((d: { path: string }) => d.path === "password")).toBe(true);
    });

    it("returns 400 VALIDATION_ERROR for extra unknown fields (strict schema)", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ ...buildLoginPayload(), unknownField: "test" });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 401 for invalid password", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send(buildLoginPayload({ password: "wrongpassword" }));

      expect(res.status).toBe(401);
      expect(res.body.error).toBe("Invalid username or password");
    });
  });

  describe("POST /api/auth/logout (P0-AUTH-2)", () => {
    it("returns 200 and clears session", async () => {
      const agent = request.agent(app);

      await agent
        .post("/api/auth/login")
        .send(buildLoginPayload())
        .expect(200);

      const logoutRes = await agent.post("/api/auth/logout");
      expect(logoutRes.status).toBe(200);
      expect(logoutRes.body.success).toBe(true);

      const sessionRes = await agent.get("/api/auth/session");
      expect(sessionRes.body.authenticated).toBe(false);
    });
  });

  describe("GET /api/auth/session (P0-AUTH-3)", () => {
    it("returns authenticated:false when not logged in", async () => {
      const res = await request(app).get("/api/auth/session");

      expect(res.status).toBe(200);
      expect(res.body.authenticated).toBe(false);
    });

    it("returns authenticated:true after login", async () => {
      const agent = request.agent(app);

      await agent
        .post("/api/auth/login")
        .send(buildLoginPayload())
        .expect(200);

      const res = await agent.get("/api/auth/session");
      expect(res.status).toBe(200);
      expect(res.body.authenticated).toBe(true);
      expect(res.body.isAdmin).toBe(true);
    });
  });
});
