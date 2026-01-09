# Quality Gate Report - Phase 1: Inventory and Test Plan

**Generated:** January 2026  
**Project:** Prestige Auto Consignment  
**Stack:** React 18 + Express.js + PostgreSQL (Drizzle ORM)

---

## 1. Project Architecture Overview

### Development Setup

| Command | Purpose |
|---------|---------|
| `npm run dev` | Starts Express server with tsx (serves API + proxies Vite client) |
| `npm run dev:client` | Starts Vite dev server standalone on port 5000 |
| `npm run build` | Builds client (Vite) and server (esbuild) for production |
| `npm run start` | Runs production build |

**Architecture:** In development, Express serves the API and Vite handles client HMR. In production, Express serves the built Vite client as static files.

---

## 2. Frontend Route Inventory (Wouter)

### Public Routes (15 routes)

| Route | Component | Primary User Actions |
|-------|-----------|---------------------|
| `/` | Home | Browse featured vehicles, view hero section, see testimonials, navigate to inventory |
| `/inventory` | Inventory | Search/filter vehicles by make/model/price, view listings grid, sort results |
| `/inventory/make/:make` | Inventory | Browse vehicles filtered by specific make |
| `/inventory/make/:make/model/:model` | Inventory | Browse vehicles filtered by make and model |
| `/inventory/:slug` | VehicleDetails | View photos, specs, pricing; submit inquiry form; save vehicle; add to compare |
| `/vehicle/:id` | VehicleDetails | Legacy URL redirect to new `/inventory/:slug` format |
| `/consign` | Consign | Multi-step form: vehicle info → condition → contact → photos → verification → submit |
| `/trade-in` | TradeIn | Submit trade-in valuation request form |
| `/get-approved` | CreditApp | Submit credit application with personal/financial info |
| `/appointments` | Appointments | Book test drive or viewing appointment |
| `/compare` | Compare | Side-by-side comparison of saved vehicles |
| `/saved` | SavedVehicles | View list of saved/favorited vehicles |
| `/seller-portal` | SellerPortal | Phone login via SMS code; view consignment status, history, documents, payout estimate |
| `/location/:slug` | LocationPage | Location-specific landing page for local SEO |
| `/privacy` | Privacy | Display privacy policy content |
| `/terms` | Terms | Display terms of service content |

### Admin Routes (12 routes, require session auth)

| Route | Component | Primary User Actions |
|-------|-----------|---------------------|
| `/admin` | AdminDashboard | View dashboard metrics, recent activity, lead counts |
| `/admin/inventory` | AdminInventory | Create/edit/delete vehicles; upload photos; VIN decode; CSV bulk import |
| `/admin/leads` | AdminLeads | Manage inquiries, trade-ins, credit apps; CRM pipeline view; assign salespeople |
| `/admin/consignments` | AdminConsignments | Review submissions; change status; convert to inventory; manage overrides |
| `/admin/settings` | AdminSettings | Configure branding, colors, SEO, SMS templates, GHL credentials |
| `/admin/users` | AdminUsers | Manage admin users (master admin only); create/delete users; change roles |
| `/admin/sms` | AdminSmsConversations | Two-way SMS conversations with leads/sellers |
| `/admin/notifications` | AdminPushNotifications | Manage push subscriptions; send notifications; view vehicle alerts |
| `/admin/integrations` | AdminIntegrations | Configure GoHighLevel CRM connection; test integration |
| `/admin/seo-tools` | AdminSeoTools | Manage target locations; citation tracking; NAP consistency check |
| `/admin/system-check` | AdminSystemCheck | System diagnostics; database health; environment check |
| `/admin/roadmap` | AdminRoadmap | View feature roadmap and development plans |
| `/admin-legacy` | Admin | Legacy admin interface (deprecated) |

**Total Frontend Routes: 28**

---

## 3. Backend API Route Inventory (Express)

**Total API Endpoints: 136**

### 3.1 Health & System (3 routes)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/health` | - | Health check: DB connectivity, env vars |
| GET | `/api/system-check` | master | Full system diagnostics |
| GET | `/api/system-check/history` | master | System check history |

### 3.2 Admin Authentication (8 routes)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/api/auth/login` | - | Admin login with username/password |
| POST | `/api/auth/logout` | session | Destroy admin session |
| GET | `/api/auth/session` | session | Get current session info |
| GET | `/api/auth/has-admin` | - | Check if any admin exists |
| POST | `/api/auth/setup` | - | Initial admin account setup |
| POST | `/api/create-admin-now` | - | Emergency admin creation |
| GET | `/api/create-admin-now` | - | Emergency admin creation (GET) |
| POST | `/api/verify/send` | - | Send verification code |
| POST | `/api/verify/check` | - | Verify code |

### 3.3 User Management (5 routes)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/users` | master | List all admin users |
| POST | `/api/users` | master | Create new admin user |
| DELETE | `/api/users/:id` | master | Delete admin user |
| PATCH | `/api/users/:id/role` | master | Update user role |
| PATCH | `/api/users/:id/password` | master | Update user password |

### 3.4 Seller Portal Authentication (5 routes)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/api/seller/send-code` | - | Send SMS verification code to seller |
| POST | `/api/seller/verify` | - | Verify seller phone code |
| GET | `/api/seller/session` | seller | Get seller session info |
| POST | `/api/seller/logout` | seller | Seller logout |
| GET | `/api/seller/consignments` | seller | Get seller's consignments |

### 3.5 Seller Portal Features (5 routes)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/seller/consignments/:id/history` | seller | Consignment status history |
| GET | `/api/seller/consignments/:id/notes` | seller | Consignment notes (seller view) |
| GET | `/api/seller/consignments/:id/documents` | seller | Consignment documents |
| POST | `/api/seller/consignments/:id/documents` | seller | Upload document |
| GET | `/api/seller/consignments/:id/payout` | seller | Get payout estimate |

### 3.6 Consignments (13 routes)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/api/consignments` | - | Submit new consignment |
| GET | `/api/consignments` | - | List all consignments |
| GET | `/api/consignments/:id` | - | Get consignment details |
| PATCH | `/api/consignments/:id/status` | admin | Update consignment status |
| GET | `/api/consignments/:id/history` | admin | Status change history |
| PATCH | `/api/consignments/:id/photos` | - | Update consignment photos |
| POST | `/api/consignments/:id/notes` | admin | Add admin note |
| GET | `/api/consignments/:id/notes` | admin | Get admin notes |
| GET | `/api/consignments/:id/documents` | admin | Get documents |
| PATCH | `/api/documents/:id/status` | admin | Update document status |
| PATCH | `/api/consignments/:id/overrides` | admin | Override payout settings |
| POST | `/api/consignments/:id/approve` | admin | Approve and convert to inventory |

### 3.7 Inventory (13 routes)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/inventory` | - | List available vehicles |
| GET | `/api/inventory/sold` | - | List sold vehicles |
| GET | `/api/inventory/all` | - | All vehicles (including drafts) |
| GET | `/api/inventory/by-slug/:slug` | - | Get vehicle by SEO slug |
| GET | `/api/inventory/:id` | - | Get vehicle by ID |
| POST | `/api/inventory` | - | Create new vehicle |
| POST | `/api/inventory/backfill-slugs` | admin | Regenerate SEO slugs |
| POST | `/api/inventory/bulk` | admin | Bulk CSV import |
| PATCH | `/api/inventory/:id/status` | admin | Update vehicle status |
| PATCH | `/api/inventory/:id` | admin | Update vehicle details |
| DELETE | `/api/inventory/:id` | admin | Delete vehicle |
| GET | `/api/vin-decode/:vin` | - | Decode VIN via NHTSA API |
| GET | `/api/vehicle-makes` | - | List all vehicle makes |
| GET | `/api/vehicle-models/:make/:year` | - | List models for make/year |

### 3.8 Vehicle Inquiries (6 routes)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/api/vehicle-inquiry` | - | Submit vehicle inquiry |
| GET | `/api/inquiries` | admin | List all inquiries |
| GET | `/api/inquiries/vehicle/:vehicleId` | - | Inquiries for specific vehicle |
| PATCH | `/api/inquiries/:id/status` | admin | Update inquiry status |
| PATCH | `/api/inquiries/:id/pipeline` | admin | Move in CRM pipeline |
| PATCH | `/api/inquiries/:id/assignment` | admin | Assign salesperson |

### 3.9 Trade-In Requests (1 route)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/api/trade-in` | - | Submit trade-in valuation request |

### 3.10 Appointments (1 route)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/api/appointments` | - | Book appointment |

### 3.11 Credit Applications (6 routes)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/api/credit-applications` | - | Submit credit application |
| GET | `/api/credit-applications` | admin | List all applications |
| GET | `/api/credit-applications/:id` | admin | Get application details |
| PATCH | `/api/credit-applications/:id/status` | admin | Update status |
| PATCH | `/api/credit-applications/:id/notes` | admin | Update notes |
| PATCH | `/api/credit-applications/:id/assignment` | admin | Assign salesperson |

### 3.12 Lead Notes & Activity (5 routes)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/api/leads/:type/:id/notes` | admin | Add note to any lead type |
| GET | `/api/leads/:type/:id/notes` | admin | Get notes for lead |
| PATCH | `/api/leads/notes/:noteId` | admin | Update note |
| DELETE | `/api/leads/notes/:noteId` | admin | Delete note |
| GET | `/api/leads/:type/:id/activity` | admin | Activity timeline |

### 3.13 Settings (5 routes)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/settings` | - | Get site settings |
| PATCH | `/api/settings` | admin | Update settings |
| POST | `/api/settings/test-ghl` | admin | Test GHL connection |
| GET | `/api/admin/db-schema-check` | admin | Check database schema |
| POST | `/api/settings/resync` | admin | Resync settings from env |

### 3.14 Demo Mode (2 routes)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/api/demo/enable` | master | Populate demo data |
| POST | `/api/demo/disable` | master | Clear demo data |

### 3.15 Vehicle Alerts (4 routes)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/api/vehicle-alerts` | - | Create alert subscription |
| GET | `/api/vehicle-alerts` | admin | List all alerts |
| PATCH | `/api/vehicle-alerts/:id/status` | admin | Update alert status |
| DELETE | `/api/vehicle-alerts/:id` | admin | Delete alert |

### 3.16 Price Alerts (4 routes)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/api/price-alerts` | - | Create price drop alert |
| GET | `/api/price-alerts/vehicle/:vehicleId` | admin | Alerts for vehicle |
| GET | `/api/price-alerts/my` | - | User's price alerts |
| DELETE | `/api/price-alerts/:id` | - | Delete price alert |

### 3.17 Testimonials (5 routes)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/testimonials` | - | List all testimonials |
| GET | `/api/testimonials/featured` | - | Featured testimonials only |
| GET | `/api/testimonials/all` | admin | All testimonials (admin) |
| POST | `/api/testimonials` | admin | Create testimonial |
| PATCH | `/api/testimonials/:id` | admin | Update testimonial |
| DELETE | `/api/testimonials/:id` | admin | Delete testimonial |

### 3.18 Vehicle Documents (4 routes)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/vehicles/:id/documents` | admin | Get vehicle documents |
| POST | `/api/vehicles/:id/documents` | admin | Upload document |
| DELETE | `/api/documents/:id` | admin | Delete document |

### 3.19 Vehicle Views & Saves (4 routes)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/api/vehicles/:id/view` | - | Record vehicle view |
| GET | `/api/vehicles/:id/views` | admin | Get view analytics |
| POST | `/api/vehicles/:id/save` | - | Save/unsave vehicle |
| GET | `/api/saved-vehicles` | - | Get saved vehicles |

### 3.20 SMS & Messaging (7 routes)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/api/sms/blast` | admin | Send bulk SMS |
| GET | `/api/sms/conversations` | admin | List SMS conversations |
| POST | `/api/sms/send` | admin | Send SMS message |
| POST | `/api/sms/mark-read` | admin | Mark conversation read |
| GET | `/api/sms/recent` | admin | Recent messages |
| PUT | `/api/sms/contacts/:id` | admin | Update contact |
| POST | `/api/sms/contacts/:id/notes` | admin | Add contact note |
| GET | `/api/sms/contacts/:id` | admin | Get contact details |

### 3.21 Webhooks (1 route)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/api/webhooks/ghl/sms` | webhook | Inbound SMS from GHL |

### 3.22 Analytics (1 route)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/analytics` | admin | Dashboard analytics data |

### 3.23 Locations & Local SEO (6 routes)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/locations` | - | List all locations |
| GET | `/api/locations/active` | - | Active locations only |
| GET | `/api/locations/:slug` | - | Get location by slug |
| POST | `/api/locations` | admin | Create location |
| PUT | `/api/locations/:id` | admin | Update location |
| DELETE | `/api/locations/:id` | admin | Delete location |

### 3.24 Citations (6 routes)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/citations/directories` | - | List directories |
| GET | `/api/citations/directories/aggregators` | - | Aggregator directories |
| GET | `/api/citations/submissions` | admin | List submissions |
| GET | `/api/citations/stats` | admin | Submission statistics |
| POST | `/api/citations/submissions` | admin | Create submission |
| PUT | `/api/citations/submissions/:id` | admin | Update submission |
| GET | `/api/citations/nap-check` | admin | NAP consistency check |
| GET | `/api/citations/export` | admin | Export citations |

### 3.25 Push Notifications (9 routes)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/push/vapid-key` | - | Get VAPID public key |
| POST | `/api/push/subscribe` | - | Subscribe to push notifications |
| POST | `/api/push/unsubscribe` | - | Unsubscribe |
| GET | `/api/push/stats` | admin | Push subscription stats |
| GET | `/api/push/subscriptions` | admin | List subscriptions |
| GET | `/api/push/notifications` | admin | List sent notifications |
| POST | `/api/push/send` | admin | Send push notification |
| POST | `/api/push/test` | admin | Send test notification |
| GET | `/api/push/diagnostics` | admin | Push system diagnostics |

### 3.26 SEO & Static (3 routes)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/robots.txt` | - | Dynamic robots.txt |
| GET | `/sitemap.xml` | - | Dynamic sitemap |
| GET | `/api/vehicle/canonical/:idOrSlug` | - | Get canonical URL |

---

## 4. P0 Flows (Must Test)

These flows are critical to core business functionality. Failure would directly impact revenue or user experience.

### 4.1 Authentication Flows

| ID | Flow | Justification |
|----|------|---------------|
| P0-AUTH-1 | **Admin Login** | Core access control. Admin cannot manage business without login. |
| P0-AUTH-2 | **Admin Logout** | Security requirement. Session must properly terminate. |
| P0-AUTH-3 | **Session Persistence** | UX critical. Admin shouldn't re-login on every page refresh. |
| P0-AUTH-4 | **Seller Portal Phone Login** | Core seller feature. Sellers must access their consignment status. |

### 4.2 Public Form Submissions

| ID | Flow | Justification |
|----|------|---------------|
| P0-FORM-1 | **Consignment Submission** | Primary revenue driver. Multi-step form with photo uploads and phone verification. |
| P0-FORM-2 | **Vehicle Inquiry** | Lead generation. Direct correlation to sales. |
| P0-FORM-3 | **Trade-In Request** | Lead generation. Captures trade-in valuation leads. |
| P0-FORM-4 | **Credit Application** | Lead generation. Captures finance-ready buyers. |
| P0-FORM-5 | **Appointment Booking** | Lead generation. Captures serious buyers ready to visit. |

### 4.3 Admin CRUD Operations

| ID | Flow | Justification |
|----|------|---------------|
| P0-CRUD-1 | **Create Vehicle** | Core inventory management. Business cannot operate without vehicle listings. |
| P0-CRUD-2 | **Edit Vehicle** | Inventory accuracy. Price/status changes are daily operations. |
| P0-CRUD-3 | **Delete Vehicle** | Inventory management. Remove sold or withdrawn vehicles. |
| P0-CRUD-4 | **Consignment Status Change** | Workflow critical. Moves consignments through pipeline. |
| P0-CRUD-5 | **Convert Consignment to Inventory** | Business critical. Approved consignments become sellable inventory. |

### 4.4 Access Control

| ID | Flow | Justification |
|----|------|---------------|
| P0-ACL-1 | **Protected Routes Return 401/403** | Security. Unauthenticated users must not access admin data. |
| P0-ACL-2 | **Master-Only Routes Enforce Role** | Security. Regular admins must not access user management. |
| P0-ACL-3 | **Seller Portal Scoped to Phone** | Security. Sellers must only see their own consignments. |

### 4.5 Core Public Features

| ID | Flow | Justification |
|----|------|---------------|
| P0-PUB-1 | **Inventory Listing** | Core product display. Users must browse vehicles. |
| P0-PUB-2 | **Vehicle Details View** | Core product display. Users must see vehicle info before inquiring. |
| P0-PUB-3 | **Settings Load** | UX critical. Site branding/config affects entire frontend. |

---

## 5. P1 Flows (Nice to Have)

These flows enhance the product but are not critical to core operations.

| ID | Flow | Reason for P1 |
|----|------|---------------|
| P1-1 | Vehicle comparison | Enhancement, not required for sales |
| P1-2 | Saved vehicles | Enhancement, not required for sales |
| P1-3 | Push notification subscription | Marketing, not transactional |
| P1-4 | Vehicle/price alerts | Marketing, not transactional |
| P1-5 | SMS blast messaging | Admin efficiency, not critical |
| P1-6 | Location landing pages | SEO enhancement |
| P1-7 | Citation management | SEO enhancement |
| P1-8 | Demo mode toggle | Admin convenience |
| P1-9 | Photo reordering | UX polish |
| P1-10 | VIN decode auto-fill | UX convenience |
| P1-11 | Analytics dashboard | Reporting, not operational |
| P1-12 | System check diagnostics | Admin tooling |

---

## 6. Coverage Map

This map shows which tests will cover each P0 flow.

### Legend
- **API Test**: Vitest + Supertest integration test
- **E2E Test**: Playwright browser test

| P0 Flow | API Test File | E2E Test File | Notes |
|---------|--------------|---------------|-------|
| P0-AUTH-1: Admin Login | `auth.test.ts` | `auth.spec.ts` | Test valid/invalid credentials, session cookie |
| P0-AUTH-2: Admin Logout | `auth.test.ts` | `auth.spec.ts` | Test session destruction |
| P0-AUTH-3: Session Persistence | `auth.test.ts` | `auth.spec.ts` | Test session survives page reload |
| P0-AUTH-4: Seller Portal Login | `seller-auth.test.ts` | `seller-portal.spec.ts` | Test phone code flow |
| P0-FORM-1: Consignment Submission | `consignment.test.ts` | `consignment.spec.ts` | Multi-step form, validation, success |
| P0-FORM-2: Vehicle Inquiry | `inquiry.test.ts` | `vehicle-inquiry.spec.ts` | Form submission, required fields |
| P0-FORM-3: Trade-In Request | `trade-in.test.ts` | `trade-in.spec.ts` | Form submission, validation |
| P0-FORM-4: Credit Application | `credit-app.test.ts` | `credit-app.spec.ts` | Long form, validation |
| P0-FORM-5: Appointment Booking | `appointment.test.ts` | `appointment.spec.ts` | Date/time selection, submission |
| P0-CRUD-1: Create Vehicle | `inventory.test.ts` | `admin-inventory.spec.ts` | Requires auth, valid payload |
| P0-CRUD-2: Edit Vehicle | `inventory.test.ts` | `admin-inventory.spec.ts` | PATCH with auth |
| P0-CRUD-3: Delete Vehicle | `inventory.test.ts` | `admin-inventory.spec.ts` | DELETE with auth |
| P0-CRUD-4: Consignment Status | `consignment.test.ts` | `admin-consignments.spec.ts` | Status workflow |
| P0-CRUD-5: Convert to Inventory | `consignment.test.ts` | `admin-consignments.spec.ts` | Approve flow |
| P0-ACL-1: Protected Routes 401/403 | `auth.test.ts` | - | API-only test sufficient |
| P0-ACL-2: Master-Only Enforcement | `auth.test.ts` | - | API-only test sufficient |
| P0-ACL-3: Seller Scoping | `seller-auth.test.ts` | - | API-only test sufficient |
| P0-PUB-1: Inventory Listing | `inventory.test.ts` | `public-pages.spec.ts` | Public endpoint |
| P0-PUB-2: Vehicle Details | `inventory.test.ts` | `public-pages.spec.ts` | Public endpoint |
| P0-PUB-3: Settings Load | `settings.test.ts` | `public-pages.spec.ts` | Public endpoint |

---

## 7. Test File Summary

### API Integration Tests (Vitest + Supertest)

| File | Purpose | P0 Flows Covered |
|------|---------|------------------|
| `health.test.ts` | Health endpoint, DB connectivity | - |
| `auth.test.ts` | Admin auth, session, protected routes | AUTH-1,2,3, ACL-1,2 |
| `seller-auth.test.ts` | Seller portal phone auth | AUTH-4, ACL-3 |
| `inventory.test.ts` | Vehicle CRUD, listing | CRUD-1,2,3, PUB-1,2 |
| `consignment.test.ts` | Consignment submission, status, convert | FORM-1, CRUD-4,5 |
| `inquiry.test.ts` | Vehicle inquiry submission | FORM-2 |
| `trade-in.test.ts` | Trade-in form | FORM-3 |
| `credit-app.test.ts` | Credit application | FORM-4 |
| `appointment.test.ts` | Appointment booking | FORM-5 |
| `settings.test.ts` | Site settings | PUB-3 |

### E2E Tests (Playwright)

| File | Purpose | P0 Flows Covered |
|------|---------|------------------|
| `auth.spec.ts` | Admin login/logout UI | AUTH-1,2,3 |
| `seller-portal.spec.ts` | Seller login, consignment view | AUTH-4 |
| `public-pages.spec.ts` | Homepage, inventory, vehicle details | PUB-1,2,3 |
| `consignment.spec.ts` | Multi-step consignment form | FORM-1 |
| `vehicle-inquiry.spec.ts` | Inquiry form on vehicle page | FORM-2 |
| `trade-in.spec.ts` | Trade-in form | FORM-3 |
| `credit-app.spec.ts` | Credit application form | FORM-4 |
| `appointment.spec.ts` | Appointment booking form | FORM-5 |
| `admin-inventory.spec.ts` | Inventory CRUD in admin | CRUD-1,2,3 |
| `admin-consignments.spec.ts` | Consignment management | CRUD-4,5 |
| `navigation.spec.ts` | Site navigation, routing | - |

---

## 8. External Service Dependencies

These external integrations require mocking or test adapters:

| Service | Used For | Test Strategy |
|---------|----------|---------------|
| GoHighLevel CRM | SMS sending, contact creation | Mock adapter with in-memory outbox |
| NHTSA VIN API | VIN decode | Mock response for known test VINs |
| Object Storage (GCS) | Photo uploads | Mock or skip in unit tests |
| Web Push | Browser notifications | Mock web-push library |

---

## 9. Data Seeding Requirements

Tests require deterministic data:

| Data | Purpose | Seed Strategy |
|------|---------|---------------|
| Admin user "Josh" | Authentication tests | Auto-seeded on server startup |
| Sample vehicles | Inventory tests | Demo mode or test fixtures |
| Sample consignments | Consignment tests | Test fixtures |
| Site settings | Settings tests | Auto-seeded on startup |

---

## 10. Next Steps (Phases 2-8)

**Phase 2**: Tooling and Standards
- ESLint configured for TS + React
- Prettier for formatting
- TypeScript strict mode verification
- npm audit integration

**Phase 3**: Shared Validation
- Verify Zod schemas cover all P0 forms
- Add validation middleware to Express routes
- Standardize error response format

**Phase 4**: Backend Integration Tests
- Implement Vitest + Supertest tests per coverage map
- Database setup/teardown
- Session persistence with Supertest agent

**Phase 5**: Frontend E2E Tests
- Implement Playwright specs per coverage map
- Add data-testid attributes to forms
- Configure webServer for test startup

**Phase 6**: Observability
- Health endpoint (done)
- Request ID middleware
- Structured error logging

**Phase 7**: Quality Gate Script
- `npm run quality` command
- Deterministic execution order

**Phase 8**: CI Pipeline
- GitHub Actions workflow
- Postgres service container
- Artifact collection

---

*End of Phase 1 Report*
