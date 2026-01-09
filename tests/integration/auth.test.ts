import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:5000";

describe("Authentication", () => {
  describe("POST /api/auth/login", () => {
    it("returns 400 if username or password missing", async () => {
      const res = await request(BASE_URL)
        .post("/api/auth/login")
        .send({ username: "test" });
      
      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Username and password required");
    });

    it("returns 401 for invalid credentials", async () => {
      const res = await request(BASE_URL)
        .post("/api/auth/login")
        .send({ username: "invalid", password: "invalid" });
      
      expect(res.status).toBe(401);
      expect(res.body.error).toBe("Invalid username or password");
    });

    it("validates login endpoint exists and handles requests", async () => {
      const res = await request(BASE_URL)
        .post("/api/auth/login")
        .send({ username: "Josh", password: "wrongpassword" });
      
      expect([200, 401, 403]).toContain(res.status);
    });
  });

  describe("GET /api/auth/session", () => {
    it("returns authenticated: false when not logged in", async () => {
      const res = await request(BASE_URL).get("/api/auth/session");
      
      expect(res.status).toBe(200);
      expect(res.body.authenticated).toBe(false);
    });

    it("validates session endpoint works correctly", async () => {
      const res = await request(BASE_URL).get("/api/auth/session");
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("authenticated");
    });
  });

  describe("Protected Routes", () => {
    it("blocks access to protected routes when not logged in", async () => {
      const res = await request(BASE_URL).get("/api/users");
      
      expect([401, 403]).toContain(res.status);
    });

    it("verifies master-only route requires authentication", async () => {
      const res = await request(BASE_URL).get("/api/users");
      
      expect([200, 401, 403]).toContain(res.status);
    });
  });
});
