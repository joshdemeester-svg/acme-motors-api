import { describe, it, expect } from "vitest";
import request from "supertest";

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:5000";

describe("Settings API", () => {
  describe("GET /api/settings", () => {
    it("returns 200 and site settings object", async () => {
      const res = await request(BASE_URL).get("/api/settings");
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("siteName");
      expect(res.body).toHaveProperty("primaryColor");
    });

    it("returns expected settings fields", async () => {
      const res = await request(BASE_URL).get("/api/settings");
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("contactPhone");
      expect(res.body).toHaveProperty("contactEmail");
      expect(res.body).toHaveProperty("dealerCity");
      expect(res.body).toHaveProperty("dealerState");
    });
  });

  describe("PATCH /api/settings (protected)", () => {
    it("returns 401 when not authenticated", async () => {
      const res = await request(BASE_URL)
        .patch("/api/settings")
        .send({ siteName: "Test Name" });
      
      expect(res.status).toBe(401);
    });
  });
});
