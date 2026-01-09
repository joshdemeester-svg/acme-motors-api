import { describe, it, expect } from "vitest";
import request from "supertest";
import express from "express";

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:5000";

describe("Health Endpoint", () => {
  it("GET /api/health returns 200 and status ok", async () => {
    const res = await request(BASE_URL).get("/api/health");
    
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("status");
    expect(res.body).toHaveProperty("timestamp");
    expect(res.body).toHaveProperty("database");
    expect(res.body.database.status).toBe("ok");
  });
});
