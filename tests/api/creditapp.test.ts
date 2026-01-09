import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { createApp } from "../../server/app";
import type { Express } from "express";
import { buildCreditApplicationPayload } from "../helpers/factories";

let app: Express;

beforeAll(async () => {
  const result = await createApp();
  app = result.app;
});

describe("P0-FORM-4: Credit Application", () => {
  describe("POST /api/credit-applications", () => {
    it("returns 201 with valid payload", async () => {
      const res = await request(app)
        .post("/api/credit-applications")
        .send(buildCreditApplicationPayload());

      expect(res.status).toBe(201);
      expect(res.body.id).toBeDefined();
    });

    it("returns 400 VALIDATION_ERROR when required fields missing", async () => {
      const res = await request(app)
        .post("/api/credit-applications")
        .send({ firstName: "Sarah" });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
      expect(Array.isArray(res.body.error.details)).toBe(true);
    });

    it("returns 400 VALIDATION_ERROR when email invalid", async () => {
      const res = await request(app)
        .post("/api/credit-applications")
        .send(buildCreditApplicationPayload({ email: "not-valid" }));

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
      expect(res.body.error.details.some((d: { path: string }) => d.path === "email")).toBe(true);
    });

    it("returns 400 VALIDATION_ERROR when monthlyIncome is negative", async () => {
      const res = await request(app)
        .post("/api/credit-applications")
        .send(buildCreditApplicationPayload({ monthlyIncome: -1000 }));

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 400 VALIDATION_ERROR for extra unknown fields (strict schema)", async () => {
      const res = await request(app)
        .post("/api/credit-applications")
        .send({ ...buildCreditApplicationPayload(), hackerField: "malicious" });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });
  });
});
