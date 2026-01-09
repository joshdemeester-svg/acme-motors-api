import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { createApp } from "../../server/app";
import type { Express } from "express";
import { buildSellerSendCodePayload, buildSellerVerifyPayload } from "../helpers/factories";

let app: Express;

beforeAll(async () => {
  const result = await createApp();
  app = result.app;
});

describe("P0-AUTH-4: Seller Portal Phone Authentication", () => {
  describe("POST /api/seller/send-code", () => {
    it("returns 200 with valid phone number", async () => {
      const res = await request(app)
        .post("/api/seller/send-code")
        .send(buildSellerSendCodePayload());

      expect(res.status).toBe(200);
      expect(res.body.message).toBeDefined();
    });

    it("returns 400 VALIDATION_ERROR when phone missing", async () => {
      const res = await request(app)
        .post("/api/seller/send-code")
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
      expect(Array.isArray(res.body.error.details)).toBe(true);
      expect(res.body.error.details.some((d: { path: string }) => d.path === "phone")).toBe(true);
    });

    it("returns 400 VALIDATION_ERROR when phone too short", async () => {
      const res = await request(app)
        .post("/api/seller/send-code")
        .send({ phone: "123" });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 400 VALIDATION_ERROR for extra unknown fields (strict schema)", async () => {
      const res = await request(app)
        .post("/api/seller/send-code")
        .send({ ...buildSellerSendCodePayload(), extraField: "value" });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("POST /api/seller/verify", () => {
    it("returns 400 VALIDATION_ERROR when phone missing", async () => {
      const res = await request(app)
        .post("/api/seller/verify")
        .send({ code: "123456" });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
      expect(Array.isArray(res.body.error.details)).toBe(true);
    });

    it("returns 400 VALIDATION_ERROR when code missing", async () => {
      const res = await request(app)
        .post("/api/seller/verify")
        .send({ phone: "5551234567" });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 400 VALIDATION_ERROR when code is wrong length", async () => {
      const res = await request(app)
        .post("/api/seller/verify")
        .send({ phone: "5551234567", code: "123" });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 400 VALIDATION_ERROR for extra unknown fields (strict schema)", async () => {
      const res = await request(app)
        .post("/api/seller/verify")
        .send({ ...buildSellerVerifyPayload(), unknownField: "test" });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });
  });
});
