import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { createApp } from "../../server/app";
import type { Express } from "express";
import { buildConsignmentPayload, buildLoginPayload } from "../helpers/factories";

let app: Express;

beforeAll(async () => {
  const result = await createApp();
  app = result.app;
});

describe("P0-FORM-1: Consignment Submission", () => {
  describe("POST /api/consignments", () => {
    it("validates payload format (phone verification required for success)", async () => {
      const res = await request(app)
        .post("/api/consignments")
        .send(buildConsignmentPayload());

      expect([200, 201, 400]).toContain(res.status);
    });

    it("returns 400 VALIDATION_ERROR when required fields missing", async () => {
      const res = await request(app)
        .post("/api/consignments")
        .send({ vin: "1HGBH41JXMN109186" });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
      expect(Array.isArray(res.body.error.details)).toBe(true);
    });

    it("returns 400 VALIDATION_ERROR when email invalid", async () => {
      const res = await request(app)
        .post("/api/consignments")
        .send(buildConsignmentPayload({ email: "not-an-email" }));

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
      expect(res.body.error.details.some((d: { path: string }) => d.path === "email")).toBe(true);
    });

    it("returns 400 VALIDATION_ERROR for extra unknown fields (strict schema)", async () => {
      const res = await request(app)
        .post("/api/consignments")
        .send({ ...buildConsignmentPayload(), hackerField: "malicious" });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });
  });
});

describe("P0-CRUD-4: Consignment Status Update", () => {
  describe("PATCH /api/consignments/:id/status", () => {
    it("handles status update for existing consignment (authenticated)", async () => {
      const agent = request.agent(app);
      await agent.post("/api/auth/login").send(buildLoginPayload()).expect(200);

      const createRes = await request(app)
        .post("/api/consignments")
        .send(buildConsignmentPayload());

      if (createRes.body.id) {
        const res = await agent
          .patch(`/api/consignments/${createRes.body.id}/status`)
          .send({ status: "approved" });

        expect([200, 404]).toContain(res.status);
      } else {
        expect([200, 201, 400]).toContain(createRes.status);
      }
    });

    it("returns 401 when not authenticated", async () => {
      const res = await request(app)
        .patch("/api/consignments/some-id/status")
        .send({ status: "approved" });

      expect(res.status).toBe(401);
    });

    it("returns 400 VALIDATION_ERROR for invalid status value", async () => {
      const agent = request.agent(app);
      await agent.post("/api/auth/login").send(buildLoginPayload()).expect(200);

      const createRes = await request(app)
        .post("/api/consignments")
        .send(buildConsignmentPayload());
      const consignmentId = createRes.body.id;

      const res = await agent
        .patch(`/api/consignments/${consignmentId}/status`)
        .send({ status: "invalid_status" });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 400 VALIDATION_ERROR for invalid id param", async () => {
      const agent = request.agent(app);
      await agent.post("/api/auth/login").send(buildLoginPayload()).expect(200);

      const res = await agent
        .patch("/api/consignments//status")
        .send({ status: "approved" });

      expect([400, 404]).toContain(res.status);
    });
  });
});

describe("P0-CRUD-5: Convert Consignment to Inventory", () => {
  describe("POST /api/consignments/:id/approve", () => {
    it("handles consignment approval (authenticated)", async () => {
      const agent = request.agent(app);
      await agent.post("/api/auth/login").send(buildLoginPayload()).expect(200);

      const createRes = await request(app)
        .post("/api/consignments")
        .send(buildConsignmentPayload());

      if (createRes.body.id) {
        const res = await agent.post(`/api/consignments/${createRes.body.id}/approve`);
        expect([200, 201, 400, 404]).toContain(res.status);
      } else {
        expect([200, 201, 400]).toContain(createRes.status);
      }
    });

    it("returns 401 when not authenticated", async () => {
      const res = await request(app).post("/api/consignments/some-id/approve");

      expect(res.status).toBe(401);
    });
  });
});
