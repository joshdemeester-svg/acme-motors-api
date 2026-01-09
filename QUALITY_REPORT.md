# Quality Gate Report

Generated: January 2026

## Project Overview

- **Stack**: React 18 + Express.js (single package.json, collocated folders)
- **Frontend**: Vite, TypeScript, Tailwind CSS v4, shadcn/ui, Wouter, TanStack Query
- **Backend**: Express.js, TypeScript, Drizzle ORM
- **Database**: PostgreSQL
- **Shared**: Zod schemas in `shared/schema.ts`

## Development Setup

| Command | Purpose |
|---------|---------|
| `npm run dev` | Starts Express with tsx (serves API + proxies Vite) |
| `npm run dev:client` | Starts Vite dev server on port 5000 |
| `npm run build` | Builds client (Vite) and server (esbuild) |
| `npm run start` | Runs production build |

**Architecture**: Express serves the Vite-built client in production. In dev, Express serves API and Vite handles HMR.

---

## Frontend Route Inventory

### Public Routes

| Route | Page Component | Primary User Actions |
|-------|---------------|---------------------|
| `/` | Home | Browse featured vehicles, view testimonials |
| `/inventory` | Inventory | Filter/search vehicles, view listings |
| `/inventory/make/:make` | Inventory | Filter by make |
| `/inventory/make/:make/model/:model` | Inventory | Filter by make and model |
| `/inventory/:slug` | VehicleDetails | View details, submit inquiry form, compare, save |
| `/vehicle/:id` | VehicleDetails | Legacy redirect to /inventory/:slug |
| `/consign` | Consign | Multi-step consignment form with phone verification |
| `/trade-in` | TradeIn | Trade-in valuation form |
| `/get-approved` | CreditApp | Credit application form |
| `/appointments` | Appointments | Book appointment form |
| `/compare` | Compare | Compare saved vehicles |
| `/saved` | SavedVehicles | View saved vehicles |
| `/seller-portal` | SellerPortal | Phone login, view consignment status |
| `/location/:slug` | LocationPage | Location-specific landing page |
| `/privacy` | Privacy | Privacy policy display |
| `/terms` | Terms | Terms of service display |

### Admin Routes (require session auth)

| Route | Page Component | Primary User Actions |
|-------|---------------|---------------------|
| `/admin` | AdminDashboard | View dashboard metrics |
| `/admin/inventory` | AdminInventory | CRUD vehicles, upload photos, VIN decode |
| `/admin/leads` | AdminLeads | Manage inquiries, trade-ins, credit apps |
| `/admin/consignments` | AdminConsignments | Review consignments, change status, convert to inventory |
| `/admin/settings` | AdminSettings | Site branding, SEO, SMS templates |
| `/admin/users` | AdminUsers | Manage admin users (master only) |
| `/admin/sms` | AdminSmsConversations | Two-way SMS conversations |
| `/admin/notifications` | AdminPushNotifications | Manage push notifications, vehicle alerts |
| `/admin/integrations` | AdminIntegrations | Configure GoHighLevel CRM |
| `/admin/seo-tools` | AdminSeoTools | Target locations, citations, NAP check |
| `/admin/system-check` | AdminSystemCheck | System diagnostics |
| `/admin/roadmap` | AdminRoadmap | Feature roadmap display |

---

## Backend API Route Inventory

### Authentication & Users

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| POST | `/api/auth/login` | - | - | Admin login |
| POST | `/api/auth/logout` | session | - | Admin logout |
| GET | `/api/auth/session` | session | - | Get current session |
| GET | `/api/auth/has-admin` | - | - | Check if admin exists |
| POST | `/api/auth/setup` | - | - | Initial admin setup |
| GET | `/api/users` | session | master | List admin users |
| POST | `/api/users` | session | master | Create admin user |
| DELETE | `/api/users/:id` | session | master | Delete admin user |
| PATCH | `/api/users/:id/role` | session | master | Update user role |
| PATCH | `/api/users/:id/password` | session | master | Update user password |

### Seller Portal Auth

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| POST | `/api/seller/send-code` | - | - | Send SMS verification code |
| POST | `/api/seller/verify` | - | - | Verify phone code |
| GET | `/api/seller/session` | seller | - | Get seller session |
| POST | `/api/seller/logout` | seller | - | Seller logout |
| GET | `/api/seller/consignments` | seller | - | Get seller's consignments |
| GET | `/api/seller/consignments/:id/history` | seller | - | Consignment status history |
| GET | `/api/seller/consignments/:id/notes` | seller | - | Consignment notes |
| GET | `/api/seller/consignments/:id/documents` | seller | - | Consignment documents |
| POST | `/api/seller/consignments/:id/documents` | seller | - | Upload document |
| GET | `/api/seller/consignments/:id/payout` | seller | - | Payout estimate |

### Consignments

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| POST | `/api/consignments` | - | - | Submit consignment |
| GET | `/api/consignments` | - | - | List consignments |
| GET | `/api/consignments/:id` | - | - | Get consignment |
| PATCH | `/api/consignments/:id/status` | session | admin | Update status |
| GET | `/api/consignments/:id/history` | session | admin | Status history |
| PATCH | `/api/consignments/:id/photos` | - | - | Update photos |
| POST | `/api/consignments/:id/notes` | session | admin | Add note |
| GET | `/api/consignments/:id/notes` | session | admin | Get notes |
| GET | `/api/consignments/:id/documents` | session | admin | Get documents |
| PATCH | `/api/consignments/:id/overrides` | session | admin | Override payout |
| PATCH | `/api/documents/:id/status` | session | admin | Update doc status |

### Inventory

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | `/api/inventory` | - | - | List available vehicles |
| GET | `/api/inventory/sold` | - | - | List sold vehicles |
| GET | `/api/inventory/all` | session | admin | All vehicles including drafts |
| POST | `/api/inventory` | session | admin | Create vehicle |
| GET | `/api/inventory/:id` | - | - | Get vehicle details |
| PATCH | `/api/inventory/:id` | session | admin | Update vehicle |
| DELETE | `/api/inventory/:id` | session | admin | Delete vehicle |
| GET | `/api/vin-decode/:vin` | - | - | Decode VIN |
| GET | `/api/vehicle-makes` | - | - | List makes |
| GET | `/api/vehicle-models/:make/:year` | - | - | List models |

### Leads (Inquiries, Trade-ins, Credit Apps)

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| POST | `/api/vehicle-inquiry` | - | - | Submit vehicle inquiry |
| GET | `/api/inquiries` | session | admin | List inquiries |
| GET | `/api/inquiries/vehicle/:vehicleId` | - | - | Inquiries for vehicle |
| PATCH | `/api/inquiries/:id/status` | session | admin | Update inquiry status |
| PATCH | `/api/inquiries/:id/pipeline` | session | admin | Move in pipeline |
| PATCH | `/api/inquiries/:id/assignment` | session | admin | Assign salesperson |
| POST | `/api/trade-in` | - | - | Submit trade-in |
| POST | `/api/appointments` | - | - | Book appointment |
| POST | `/api/credit-applications` | - | - | Submit credit app |
| GET | `/api/credit-applications` | session | admin | List credit apps |
| GET | `/api/credit-applications/:id` | session | admin | Get credit app |
| PATCH | `/api/credit-applications/:id/status` | session | admin | Update status |
| PATCH | `/api/credit-applications/:id/notes` | session | admin | Update notes |
| PATCH | `/api/credit-applications/:id/assignment` | session | admin | Assign |

### Lead Notes & Activity

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| POST | `/api/leads/:type/:id/notes` | session | admin | Add note |
| GET | `/api/leads/:type/:id/notes` | session | admin | Get notes |
| PATCH | `/api/leads/notes/:noteId` | session | admin | Update note |
| DELETE | `/api/leads/notes/:noteId` | session | admin | Delete note |
| GET | `/api/leads/:type/:id/activity` | session | admin | Activity timeline |

### Settings

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | `/api/settings` | - | - | Get site settings |
| PATCH | `/api/settings` | session | admin | Update settings |
| POST | `/api/settings/test-ghl` | session | admin | Test GHL connection |

### Testimonials

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | `/api/testimonials/featured` | - | - | Featured testimonials |
| GET | `/api/testimonials/all` | session | admin | All testimonials |
| POST | `/api/testimonials` | session | admin | Create testimonial |
| PATCH | `/api/testimonials/:id` | session | admin | Update testimonial |
| DELETE | `/api/testimonials/:id` | session | admin | Delete testimonial |

### Push Notifications

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | `/api/push/vapid-key` | - | - | Get VAPID public key |
| POST | `/api/push/subscribe` | - | - | Subscribe to push |
| POST | `/api/push/unsubscribe` | - | - | Unsubscribe |
| GET | `/api/push/stats` | session | admin | Push statistics |
| GET | `/api/push/subscriptions` | session | admin | List subscriptions |
| GET | `/api/push/notifications` | session | admin | List notifications |
| POST | `/api/push/send` | session | admin | Send notification |
| POST | `/api/push/test` | session | admin | Send test |
| GET | `/api/push/diagnostics` | session | admin | System diagnostics |

### Vehicle Alerts

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| POST | `/api/vehicle-alerts` | - | - | Create alert subscription |
| GET | `/api/vehicle-alerts` | session | admin | List all alerts |
| DELETE | `/api/vehicle-alerts/:id` | session | admin | Delete alert |

### Locations & SEO

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | `/api/locations` | - | - | List locations |
| GET | `/api/locations/active` | - | - | Active locations only |
| GET | `/api/locations/:slug` | - | - | Get location by slug |
| POST | `/api/locations` | session | admin | Create location |
| PUT | `/api/locations/:id` | session | admin | Update location |
| DELETE | `/api/locations/:id` | session | admin | Delete location |
| GET | `/api/citations/directories` | - | - | Citation directories |
| GET | `/api/citations/submissions` | session | admin | Citation submissions |
| POST | `/api/citations/submissions` | session | admin | Create submission |
| PUT | `/api/citations/submissions/:id` | session | admin | Update submission |
| GET | `/api/citations/nap-check` | session | admin | NAP consistency check |
| GET | `/api/citations/export` | session | admin | Export citations |

### SMS & Conversations

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | `/api/sms/conversations` | session | admin | List SMS conversations |
| POST | `/api/sms/send` | session | admin | Send SMS |
| POST | `/api/sms/blast` | session | admin | Bulk SMS blast |
| POST | `/api/webhooks/sms/inbound` | webhook | - | Inbound SMS webhook |

### Analytics & Demo

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | `/api/analytics` | session | admin | Dashboard analytics |
| POST | `/api/demo/populate` | session | master | Populate demo data |
| POST | `/api/demo/clear` | session | master | Clear demo data |

### SEO & Static

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | `/robots.txt` | - | - | Dynamic robots.txt |
| GET | `/sitemap.xml` | - | - | Dynamic sitemap |
| GET | `/api/vehicle/canonical/:idOrSlug` | - | - | Canonical URL lookup |

---

## P0 Flows (Must Test)

### Authentication
1. **Admin Login** - Login with username/password, session persists on refresh
2. **Admin Logout** - Session destroyed, protected routes blocked
3. **Seller Portal Login** - Phone verification flow (send code → verify)

### Public Form Submissions
4. **Consignment Form** - Multi-step form with phone verification, photos upload
5. **Vehicle Inquiry** - Contact form on vehicle details page
6. **Trade-In Form** - Submit trade-in valuation request
7. **Credit Application** - Submit credit app with personal/financial info
8. **Appointment Booking** - Book test drive appointment

### Admin CRUD
9. **Inventory Management** - Create, edit, delete vehicles
10. **Lead Pipeline** - Move leads through pipeline stages
11. **Consignment Review** - Change consignment status, convert to inventory

### Access Control
12. **Protected Routes Return 401** - Unauthenticated API calls blocked
13. **Master-Only Routes Return 403** - Non-master admin blocked from user management
14. **Role-Based UI** - Admin sees admin routes, master sees user management

### Push Notifications
15. **Push Subscription** - Subscribe to browser push notifications
16. **Vehicle Alert Subscription** - Create make/model/price alert

---

## P1 Flows (Nice to Have)

- Vehicle comparison feature
- Saved vehicles persistence
- SMS blast functionality
- Location landing pages
- Citation management
- Demo mode toggle
- Photo reordering in inventory
- VIN decode auto-fill
- Analytics dashboard accuracy

---

## Coverage Map

| P0 Flow | API Integration Test | Playwright E2E Test |
|---------|---------------------|---------------------|
| Admin Login | `auth.test.ts` | `auth.spec.ts` |
| Admin Logout | `auth.test.ts` | `auth.spec.ts` |
| Seller Portal Login | `seller-auth.test.ts` | `seller-portal.spec.ts` |
| Consignment Form | `consignment.test.ts` | `consignment.spec.ts` |
| Vehicle Inquiry | `inquiry.test.ts` | `vehicle-inquiry.spec.ts` |
| Trade-In Form | `trade-in.test.ts` | `trade-in.spec.ts` |
| Credit Application | `credit-app.test.ts` | `credit-app.spec.ts` |
| Appointment Booking | `appointment.test.ts` | `appointment.spec.ts` |
| Inventory CRUD | `inventory.test.ts` | `admin-inventory.spec.ts` |
| Lead Pipeline | `leads.test.ts` | `admin-leads.spec.ts` |
| Consignment Review | `consignment.test.ts` | `admin-consignments.spec.ts` |
| 401 on Unauth | `auth.test.ts` | - |
| 403 on Non-Master | `auth.test.ts` | - |
| Role-Based UI | - | `admin-access.spec.ts` |
| Push Subscription | `push.test.ts` | `push-notifications.spec.ts` |
| Vehicle Alert | `vehicle-alerts.test.ts` | `vehicle-alerts.spec.ts` |

---

## Known Gaps

1. **No existing test infrastructure** - Need to add Vitest, Playwright from scratch
2. **External service mocking needed** - GoHighLevel CRM calls need adapter pattern
3. **SMS/Push external calls** - Need test outbox for verification
4. **File uploads** - Object storage integration needs mocking in tests
5. **Session-based auth in tests** - Need Supertest agent for cookie persistence

---

## Shared Schema Coverage

The following Zod schemas exist in `shared/schema.ts`:

| Schema | Used For |
|--------|----------|
| `insertUserSchema` | Admin user creation |
| `insertConsignmentSchema` | Consignment submission |
| `insertInventoryCarSchema` | Vehicle creation |
| `insertVehicleInquirySchema` | Vehicle inquiries |
| `insertTradeInRequestSchema` | Trade-in requests |
| `insertCreditApplicationSchema` | Credit applications |
| `insertAppointmentSchema` | Appointments |
| `insertTestimonialSchema` | Testimonials |
| `insertVehicleAlertSchema` | Vehicle alerts |
| `insertPushSubscriptionSchema` | Push subscriptions |
| `insertTargetLocationSchema` | Location pages |

**Gap**: Some API routes don't validate request bodies with Zod. Will add validation middleware.

---

## Implementation Priority

1. **Phase 2**: Tooling (ESLint, Prettier, TypeScript strict)
2. **Phase 3**: Add validation middleware to P0 endpoints
3. **Phase 4**: API integration tests (auth, CRUD, validation)
4. **Phase 5**: Playwright E2E (auth, forms, admin access)
5. **Phase 6**: Health endpoint
6. **Phase 7**: `npm run quality` script
7. **Phase 8**: GitHub Actions CI
