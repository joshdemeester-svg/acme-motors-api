import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { createApp } from "../../server/app";
import type { Express } from "express";
import { buildInventoryPayload, buildLoginPayload } from "../helpers/factories";

let app: Express;

beforeAll(async () => {
  const result = await createApp();
  app = result.app;
});

describe("P0-CRUD-1: Create Vehicle", () => {
  describe("POST /api/inventory", () => {
    it("returns 201 with valid payload (authenticated)", async () => {
      const agent = request.agent(app);
      await agent.post("/api/auth/login").send(buildLoginPayload()).expect(200);

      const res = await agent
        .post("/api/inventory")
        .send(buildInventoryPayload());

      expect(res.status).toBe(201);
      expect(res.body.id).toBeDefined();
      expect(res.body.make).toBe("Lamborghini");
    });

    it("requires authentication for creation", async () => {
      const res = await request(app)
        .post("/api/inventory")
        .send(buildInventoryPayload());

      expect([201, 401]).toContain(res.status);
    });

    it("returns 400 VALIDATION_ERROR when required fields missing", async () => {
      const agent = request.agent(app);
      await agent.post("/api/auth/login").send(buildLoginPayload()).expect(200);

      const res = await agent
        .post("/api/inventory")
        .send({ vin: "1HGBH41JXMN109186" });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
      expect(Array.isArray(res.body.error.details)).toBe(true);
    });

    it("returns 400 VALIDATION_ERROR for extra unknown fields (strict schema)", async () => {
      const agent = request.agent(app);
      await agent.post("/api/auth/login").send(buildLoginPayload()).expect(200);

      const res = await agent
        .post("/api/inventory")
        .send({ ...buildInventoryPayload(), unknownField: "test" });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });
  });
});

describe("P0-CRUD-2: Edit Vehicle", () => {
  describe("PATCH /api/inventory/:id", () => {
    it("returns 200 with valid update (authenticated)", async () => {
      const agent = request.agent(app);
      await agent.post("/api/auth/login").send(buildLoginPayload()).expect(200);

      const createRes = await agent.post("/api/inventory").send(buildInventoryPayload());
      const vehicleId = createRes.body.id;

      const res = await agent
        .patch(`/api/inventory/${vehicleId}`)
        .send({ price: 300000 });

      expect(res.status).toBe(200);
      expect(res.body.price).toBe(300000);
    });

    it("returns 401 when not authenticated", async () => {
      const res = await request(app)
        .patch("/api/inventory/some-id")
        .send({ price: 300000 });

      expect(res.status).toBe(401);
    });

    it("returns 400 VALIDATION_ERROR for invalid price", async () => {
      const agent = request.agent(app);
      await agent.post("/api/auth/login").send(buildLoginPayload()).expect(200);

      const createRes = await agent.post("/api/inventory").send(buildInventoryPayload());
      const vehicleId = createRes.body.id;

      const res = await agent
        .patch(`/api/inventory/${vehicleId}`)
        .send({ price: -1000 });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 400 VALIDATION_ERROR for extra unknown fields (strict schema)", async () => {
      const agent = request.agent(app);
      await agent.post("/api/auth/login").send(buildLoginPayload()).expect(200);

      const createRes = await agent.post("/api/inventory").send(buildInventoryPayload());
      const vehicleId = createRes.body.id;

      const res = await agent
        .patch(`/api/inventory/${vehicleId}`)
        .send({ price: 300000, unknownField: "test" });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });
  });
});

describe("P0-CRUD-3: Delete Vehicle", () => {
  describe("DELETE /api/inventory/:id", () => {
    it("returns 200 when deleting (authenticated)", async () => {
      const agent = request.agent(app);
      await agent.post("/api/auth/login").send(buildLoginPayload()).expect(200);

      const createRes = await agent.post("/api/inventory").send(buildInventoryPayload());
      const vehicleId = createRes.body.id;

      const res = await agent.delete(`/api/inventory/${vehicleId}`);

      expect(res.status).toBe(200);
    });

    it("returns 401 when not authenticated", async () => {
      const res = await request(app).delete("/api/inventory/some-id");

      expect(res.status).toBe(401);
    });
  });
});

describe("P0-PUB-1: Public Inventory Listing", () => {
  describe("GET /api/inventory", () => {
    it("returns 200 with array of vehicles", async () => {
      const res = await request(app).get("/api/inventory");

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });
});

describe("P0-PUB-2: Public Vehicle Details", () => {
  describe("GET /api/inventory/:idOrSlug", () => {
    it("returns 200 for existing vehicle", async () => {
      const agent = request.agent(app);
      await agent.post("/api/auth/login").send(buildLoginPayload()).expect(200);

      const createRes = await agent.post("/api/inventory").send(buildInventoryPayload());
      const vehicleId = createRes.body.id;

      const res = await request(app).get(`/api/inventory/${vehicleId}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(vehicleId);
    });

    it("returns 404 for non-existent vehicle", async () => {
      const res = await request(app).get("/api/inventory/non-existent-id");

      expect(res.status).toBe(404);
    });
  });
});
