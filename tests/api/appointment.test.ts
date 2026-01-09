import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { createApp } from "../../server/app";
import type { Express } from "express";
import { buildAppointmentPayload } from "../helpers/factories";

let app: Express;

beforeAll(async () => {
  const result = await createApp();
  app = result.app;
});

describe("P0-FORM-5: Appointment Booking", () => {
  describe("POST /api/appointments", () => {
    it("returns 200/201 with valid payload", async () => {
      const res = await request(app)
        .post("/api/appointments")
        .send(buildAppointmentPayload());

      expect([200, 201]).toContain(res.status);
    });

    it("returns 400 VALIDATION_ERROR when required fields missing", async () => {
      const res = await request(app)
        .post("/api/appointments")
        .send({ firstName: "Robert" });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
      expect(Array.isArray(res.body.error.details)).toBe(true);
    });

    it("returns 400 VALIDATION_ERROR when appointmentType invalid", async () => {
      const res = await request(app)
        .post("/api/appointments")
        .send(buildAppointmentPayload({ appointmentType: "invalid_type" }));

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
      expect(res.body.error.details.some((d: { path: string }) => d.path === "appointmentType")).toBe(true);
    });

    it("returns 400 VALIDATION_ERROR when email invalid", async () => {
      const res = await request(app)
        .post("/api/appointments")
        .send(buildAppointmentPayload({ email: "bad-email" }));

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 400 VALIDATION_ERROR for extra unknown fields (strict schema)", async () => {
      const res = await request(app)
        .post("/api/appointments")
        .send({ ...buildAppointmentPayload(), unknownField: "test" });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });
  });
});
