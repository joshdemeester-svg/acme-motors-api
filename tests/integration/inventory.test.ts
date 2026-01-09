import { describe, it, expect } from "vitest";
import request from "supertest";

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:5000";

describe("Inventory API", () => {
  describe("GET /api/inventory", () => {
    it("returns 200 and array of vehicles", async () => {
      const res = await request(BASE_URL).get("/api/inventory");
      
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it("returns vehicles with expected fields", async () => {
      const res = await request(BASE_URL).get("/api/inventory");
      
      expect(res.status).toBe(200);
      if (res.body.length > 0) {
        const vehicle = res.body[0];
        expect(vehicle).toHaveProperty("id");
        expect(vehicle).toHaveProperty("year");
        expect(vehicle).toHaveProperty("make");
        expect(vehicle).toHaveProperty("model");
        expect(vehicle).toHaveProperty("price");
        expect(vehicle).toHaveProperty("status");
      }
    });

    it("filters by status=available", async () => {
      const res = await request(BASE_URL).get("/api/inventory");
      
      expect(res.status).toBe(200);
      res.body.forEach((vehicle: any) => {
        expect(vehicle.status).toBe("available");
      });
    });
  });

  describe("GET /api/inventory/sold", () => {
    it("returns 200 and array of sold vehicles", async () => {
      const res = await request(BASE_URL).get("/api/inventory/sold");
      
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe("GET /api/vehicle-makes", () => {
    it("returns 200 and array of makes", async () => {
      const res = await request(BASE_URL).get("/api/vehicle-makes");
      
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });
});
