# Testing Guide

## Overview

This project uses Vitest + Supertest for API integration testing of P0 endpoints.

## Test Strategy

### App Bootstrap

- Tests use `createApp()` factory from `server/app.ts`
- Factory returns Express app instance without calling `listen()`
- Supertest wraps the app directly, no real server started
- Environment is set to `NODE_ENV=test` to skip seed scripts

### Database Isolation

- Tests use `DATABASE_URL` (same database, isolated via truncation)
- **Reset Method**: Table truncation with CASCADE in `beforeEach`
- Tables are truncated in dependency-safe order using `CASCADE`
- Minimal seed data created in `beforeAll`: admin user + site settings

### Truncated Tables

```sql
TRUNCATE TABLE 
  buyer_inquiries,
  vehicle_views,
  price_alerts,
  vehicle_alerts,
  vehicle_documents,
  seller_documents,
  seller_notes,
  status_history,
  lead_notes,
  activity_log,
  credit_applications,
  appointments,
  trade_in_requests,
  phone_verifications,
  inventory_cars,
  consignment_submissions,
  testimonials,
  users
CASCADE
```

### Auth Handling

- `request.agent(app)` maintains cookies across requests
- `loginAsAdmin(agent)` helper logs in with seeded admin credentials
- Standard `request(app)` used for unauthenticated tests (401/403)

## Running Tests

```bash
# Run all API tests
npm run test:api

# Run with coverage
npm run test:api -- --coverage

# Run specific test file
npm run test:api -- tests/api/auth.test.ts

# Watch mode
npm run test:api -- --watch
```

## Test File Structure

```
tests/
├── setup.ts              # Global setup: seed admin, truncate tables
├── helpers/
│   ├── auth.ts           # loginAsAdmin(), loginAsSeller()
│   ├── db.ts             # truncateTables(), seedAdmin()
│   └── factories.ts      # Payload builders (no framework abstractions)
├── api/
│   ├── auth.test.ts      # P0-AUTH-1/2/3
│   ├── seller.test.ts    # P0-AUTH-4
│   ├── consignment.test.ts   # P0-FORM-1, P0-CRUD-4/5
│   ├── inquiry.test.ts   # P0-FORM-2
│   ├── tradein.test.ts   # P0-FORM-3
│   ├── creditapp.test.ts # P0-FORM-4
│   ├── appointment.test.ts   # P0-FORM-5
│   └── inventory.test.ts # P0-CRUD-1/2/3, P0-PUB-1/2
└── vitest.config.ts
```

## Test Coverage Requirements

Each P0 endpoint must have:
1. **Valid payload test** - Returns 200/201
2. **Invalid payload test** - Returns 400 with:
   - `error.code === "VALIDATION_ERROR"`
   - `error.details` is an array of `{ path, message }`

## factories.ts Pattern

Factories are simple payload builders, not ORM abstractions:

```typescript
export function buildLoginPayload(overrides = {}) {
  return {
    username: "testadmin",
    password: "testpassword123",
    ...overrides,
  };
}
```

## Helpers

### auth.ts

```typescript
export async function loginAsAdmin(agent: SuperAgentTest) {
  await agent.post("/api/auth/login").send(TEST_ADMIN).expect(200);
  return agent;
}
```

### db.ts

```typescript
export async function truncateTables(): Promise<void> {
  await db.execute(sql`TRUNCATE TABLE ... CASCADE`);
}

export async function seedAdmin(): Promise<void> {
  // Insert test admin user and site settings
}
```

---

## Running Tests with Coverage

```bash
# Run API tests with coverage
NODE_ENV=test npx vitest run tests/api --coverage

# Run with JUnit output (for CI)
NODE_ENV=test npx vitest run tests/api --coverage --reporter=default --reporter=junit
```

### Coverage Thresholds

The project enforces minimum coverage thresholds (for P0 endpoints):

| Metric | Current | Minimum |
|--------|---------|---------|
| Statements | 17.82% | 15% |
| Branches | 9.33% | 7% |
| Functions | 11.30% | 10% |
| Lines | 18.11% | 15% |

Tests will fail if coverage drops below these thresholds.

---

## Test Isolation

### Order Independence

Tests are configured to run in **random order** (`sequence.shuffle: true` in vitest.config.ts) to ensure no test depends on another's side effects.

### Database Reset Strategy

Each test file:
1. `beforeAll`: Seeds minimal required data (admin user, site settings)
2. `beforeEach`: Truncates all tables with CASCADE, re-seeds admin
3. `afterAll`: Final cleanup

This ensures every test starts with a clean, predictable state.

---

## Flaky Test Handling

### Definition

A **flaky test** is one that passes and fails intermittently without code changes. Common causes:
- Timing dependencies (network, DB, async operations)
- Shared state between tests
- Non-deterministic data (dates, random values)
- External service dependencies

### Prevention Strategies

1. **Use deterministic test data** - Never use `Date.now()` or `Math.random()` in tests
2. **Mock external services** - GHL API, SMS providers should be mocked in tests
3. **Avoid `setTimeout`** - Use proper async/await patterns
4. **Isolate test state** - Each test should set up its own data
5. **Run tests in random order** - Catches hidden order dependencies

### Handling Flaky Tests

When a flaky test is identified:

1. **Quarantine immediately** - Add `.skip` to prevent CI failures
2. **Document the flakiness** - Add comment explaining the issue
3. **File a tracking issue** - Include reproduction steps
4. **Fix within 1 sprint** - Flaky tests degrade CI trust

```typescript
// Quarantined: Flaky due to timing issue with SMS delivery
// Tracking: Issue #123
it.skip("sends SMS notification on consignment approval", async () => {
  // ...
});
```

### Retry Strategy

For tests that are inherently timing-sensitive (e.g., external API responses), use controlled retries:

```typescript
it("external API test", { retry: 2 }, async () => {
  // Test with up to 2 retries
});
```

**Note:** Retries should be used sparingly and only for legitimate timing issues, not to mask bugs.
