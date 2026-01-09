import { beforeAll, afterAll, beforeEach, afterEach } from "vitest";
import { truncateTables, seedAdmin } from "./helpers/db";

beforeAll(async () => {
  process.env.NODE_ENV = "test";
  await seedAdmin();
});

beforeEach(async () => {
  await truncateTables();
  await seedAdmin();
});

afterEach(async () => {
});

afterAll(async () => {
  await truncateTables();
});
