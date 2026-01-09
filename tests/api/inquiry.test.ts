import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { createApp } from "../../server/app";
import type { Express } from "express";
import { buildVehicleInquiryPayload, buildInventoryPayload, buildLoginPayload } from "../helpers/factories";

let app: Express;

beforeAll(async () => {
  const result = await createApp();
  app = result.app;
});

describe("P0-FORM-2: Vehicle Inquiry", () => {
  describe("POST /api/vehicle-inquiry", () => {
    it("returns 201 with valid payload", async () => {
      const agent = request.agent(app);
      await agent.post("/api/auth/login").send(buildLoginPayload()).expect(200);
      const vehicleRes = await agent.post("/api/inventory").send(buildInventoryPayload());
      const vehicleId = vehicleRes.body.id;

      const res = await request(app)
        .post("/api/vehicle-inquiry")
        .send(buildVehicleInquiryPayload(vehicleId));

      expect(res.status).toBe(201);
      expect(res.body.id).toBeDefined();
    });

    it("returns 400 VALIDATION_ERROR when buyerEmail invalid", async () => {
      const res = await request(app)
        .post("/api/vehicle-inquiry")
        .send(buildVehicleInquiryPayload("test-id", { buyerEmail: "not-an-email" }));

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
      expect(Array.isArray(res.body.error.details)).toBe(true);
      expect(res.body.error.details.some((d: { path: string }) => d.path === "buyerEmail")).toBe(true);
    });

    it("returns 400 VALIDATION_ERROR when required fields missing", async () => {
      const res = await request(app)
        .post("/api/vehicle-inquiry")
        .send({ vehicleId: "test" });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 400 VALIDATION_ERROR for extra unknown fields (strict schema)", async () => {
      const agent = request.agent(app);
      await agent.post("/api/auth/login").send(buildLoginPayload()).expect(200);
      const vehicleRes = await agent.post("/api/inventory").send(buildInventoryPayload());
      const vehicleId = vehicleRes.body.id;

      const res = await request(app)
        .post("/api/vehicle-inquiry")
        .send({ ...buildVehicleInquiryPayload(vehicleId), unknownField: "test" });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });
  });
});
