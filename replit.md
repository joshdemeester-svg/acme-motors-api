# Prestige Auto Consignment

## Overview
Prestige Auto Consignment is a premium platform for selling luxury and exotic vehicles. It provides a public website for vehicle submissions and browsing, alongside an admin panel for managing consignment requests and inventory. The platform automates the entire consignment process, from submission and photo uploads to admin review, pricing, and inventory management.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter
- **State Management**: TanStack React Query
- **Styling**: Tailwind CSS v4 with shadcn/ui (New York style)
- **Animations**: Framer Motion
- **Form Handling**: React Hook Form with Zod validation
- **Structure**: Component-based, with dedicated sections for public pages, admin pages, UI primitives, and layout components.

### Backend
- **Framework**: Express.js with TypeScript
- **Database ORM**: Drizzle ORM with PostgreSQL
- **API Pattern**: RESTful JSON APIs
- **File Uploads**: Uppy client with presigned URL uploads to Google Cloud Storage (via Replit Object Storage)

### Authentication
- **Admin**: Session-based using `express-session`, PBKDF2 for password hashing, `requireAdmin` middleware for protection. Initial setup via `/api/auth/setup`.
- **Seller Portal**: Phone-based authentication with SMS verification (GoHighLevel SMS), rate limiting, and secure session management. Sellers can track consignment status.

### Data Storage
- PostgreSQL database managed with Drizzle ORM.
- Key tables: `users`, `consignment_submissions`, `inventory_cars`, `buyer_inquiries`, `site_settings`.

### File Storage
- Replit's Object Storage integration (Google Cloud Storage backend) using presigned URLs for direct client-to-storage uploads.

### Build System
- **Development**: Vite with HMR.
- **Production**: Vite for client, esbuild for server.
- **Database Migrations**: `drizzle-kit push`.

### SEO Optimization
- Dynamic Meta Tags using `useSEO` hook, including Open Graph and Twitter Card.
- Schema.org Structured Data (Vehicle, AutoDealer/Organization).
- Dynamic `robots.txt` and `sitemap.xml` for comprehensive indexing.

### Database Seeding
- Automatic seeding of site settings, admin credentials, and branding on server startup if the database is uninitialized.

## External Dependencies

- **Database**: PostgreSQL (configured via `DATABASE_URL`).
- **Cloud Storage**: Google Cloud Storage via Replit Object Storage integration (`http://127.0.0.1:1106`).
- **UI Libraries**: shadcn/ui (Radix UI), Lucide React icons, Embla Carousel, Uppy.
- **Fonts**: Inter, Playfair Display (from Google Fonts CDN).
- **CRM Integration**: GoHighLevel CRM for contact creation, SMS verification for consignments, and admin notifications. Configurable via admin panel or environment variables (`GHL_LOCATION_ID`, `GHL_API_TOKEN`). Uses GoHighLevel API v2 with Private Integration Token authentication.

---

## Master Feature Checklist

**IMPORTANT: Check this list before implementing any feature to avoid duplicate work!**

### Admin & Authentication
| Feature | Status | Location | Notes |
|---------|--------|----------|-------|
| Admin login (username/password) | ✅ Done | `LoginModal.tsx` | Session-based auth with PBKDF2 |
| Two-tier roles (master/admin) | ✅ Done | `shared/schema.ts` | Josh hardcoded as master on startup |
| User management (CRUD) | ✅ Done | `Settings.tsx` → Users tab | List, add, edit role, reset password, delete |
| Master admin protection | ✅ Done | `server/routes.ts` | Josh auto-upgraded to master on every server start |
| Mobile logout button | ✅ Done | `AdminLayout.tsx` | Top-right corner on mobile header |
| Seller portal (phone login) | ✅ Done | `SellerPortal.tsx` | Phone verification via GoHighLevel SMS |

### Branding & Site Settings
| Feature | Status | Location | Notes |
|---------|--------|----------|-------|
| Logo upload/URL | ✅ Done | Settings → Branding | Supports desktop & mobile widths |
| Desktop logo width slider | ✅ Done | Settings → Branding | 60-300px range |
| Mobile logo width slider | ✅ Done | Settings → Branding | 40-200px range, separate setting |
| Primary/background colors | ✅ Done | Settings → Branding | Multiple color pickers |
| Menu customization | ✅ Done | Settings → Menus | Labels, font size, all caps toggle |
| Footer tagline | ✅ Done | Settings → Branding | Markdown supported |
| Social media links | ✅ Done | Settings → Contact | Facebook, Instagram, Twitter, YouTube, TikTok |
| Privacy policy/Terms | ✅ Done | Settings → Legal | Markdown editor, renders at /privacy & /terms |
| Favicon URL | ✅ Done | Settings → Branding | Custom browser tab icon |

### Inventory Management
| Feature | Status | Location | Notes |
|---------|--------|----------|-------|
| Add vehicle | ✅ Done | Admin → Inventory | Dialog with full form |
| Edit vehicle | ✅ Done | Admin → Inventory | Same dialog, prefilled |
| Delete vehicle | ✅ Done | Admin → Inventory | Confirmation dialog |
| Photo upload | ✅ Done | Inventory dialog | Object storage integration via Uppy |
| Drag-and-drop photo reorder | ✅ Done | Inventory dialog | Uses @dnd-kit library |
| Photo deletion | ✅ Done | Inventory dialog | Persists on save |
| CSV bulk import | ✅ Done | Admin → Inventory | Upload CSV to add multiple vehicles |
| Days on lot tracking | ✅ Done | Inventory cards | Calculated from createdAt |
| Featured vehicles toggle | ✅ Done | Inventory dialog | Shows on homepage carousel |
| VIN API auto-fill | ✅ Done | `server/routes.ts` | NHTSA API decodes VIN → year/make/model |

### Lead Management
| Feature | Status | Location | Notes |
|---------|--------|----------|-------|
| Buyer inquiries list | ✅ Done | Admin → Leads | Tabbed view with filters |
| Trade-in requests | ✅ Done | Admin → Leads | Separate tab |
| Credit applications | ✅ Done | Admin → Leads | No SSN required |
| Lead status updates | ✅ Done | Lead cards | Dropdown to change status |
| Inquiry count per vehicle | ✅ Done | Inventory cards | Shows lead metrics |
| Visual CRM pipeline | ✅ Done | `PipelineBoard.tsx` | Drag-and-drop stages: New→Contacted→Qualified→Negotiating→Sold/Lost |
| Lead notes | ✅ Done | `LeadDetailDialog.tsx` | Add notes to any lead, persisted to database |
| Activity timeline | ✅ Done | `LeadDetailDialog.tsx` | Shows lead activity history |
| Salesperson assignment | ✅ Done | `LeadDetailDialog.tsx` | Assign leads to admin users |

### Consignments
| Feature | Status | Location | Notes |
|---------|--------|----------|-------|
| Multi-step consignment form | ✅ Done | `/consign` page | Vehicle info, photos, owner details |
| Phone verification | ✅ Done | Consignment form | Required before submission, via GHL SMS |
| Status tracking | ✅ Done | Admin → Consignments | Pending, approved, listed, sold, rejected |
| Convert to inventory | ✅ Done | Consignment detail | Creates inventory entry from consignment |
| SMS confirmation | ✅ Done | Consignment submit | Via GoHighLevel |
| Admin SMS notifications | ✅ Done | Settings → Alerts | Up to 2 phone numbers for new submissions |

### Public Website
| Feature | Status | Location | Notes |
|---------|--------|----------|-------|
| Homepage | ✅ Done | `/` | Hero, featured vehicles, testimonials |
| Inventory listing | ✅ Done | `/inventory` | Grid view with filters |
| Vehicle details | ✅ Done | `/vehicles/:id` | Full specs, photos, inquiry form |
| Vehicle comparison | ✅ Done | `/compare` | Compare up to 3 vehicles side-by-side |
| Payment calculator | ✅ Done | Vehicle details | Monthly payment estimator |
| Trade-in form | ✅ Done | `/trade-in` | Submit trade-in request |
| Contact page | ✅ Done | `/contact` | Contact form with location info |
| Testimonials display | ✅ Done | Homepage | Customer reviews from admin |

### SEO & Technical
| Feature | Status | Location | Notes |
|---------|--------|----------|-------|
| Dynamic meta tags | ✅ Done | `useSEO` hook | Per-page titles and descriptions |
| Schema.org markup | ✅ Done | Vehicle pages | Vehicle and Organization schemas |
| Sitemap.xml | ✅ Done | `/sitemap.xml` | Dynamic generation with all vehicles |
| Robots.txt | ✅ Done | `/robots.txt` | Blocks admin/api routes |
| Open Graph tags | ✅ Done | All pages | Social sharing support |

### Integrations
| Feature | Status | Location | Notes |
|---------|--------|----------|-------|
| GoHighLevel CRM | ✅ Done | Settings → Integrations | Contact creation on consignment, SMS verification, admin notifications |
| GoHighLevel SMS | ✅ Done | `server/routes.ts` | Phone verification, confirmation messages |
| Object Storage | ✅ Done | Replit integration | Photo uploads to GCS |
| PostgreSQL Database | ✅ Done | Drizzle ORM | All data persistence |

### Testimonials Management
| Feature | Status | Location | Notes |
|---------|--------|----------|-------|
| Add testimonials | ✅ Done | Settings → Reviews | Customer name, location, vehicle, rating, content |
| Edit testimonials | ✅ Done | Settings → Reviews | Update existing reviews |
| Delete testimonials | ✅ Done | Settings → Reviews | Remove reviews |
| Featured toggle | ✅ Done | Settings → Reviews | Show on homepage |

---

## Known Issues & Workarounds

| Issue | Workaround |
|-------|------------|
| Users tab not visible after role change | Log out and log back in to refresh session |
| Production vs Dev databases are separate | Changes in dev don't affect production |
| Session doesn't auto-update on role change | Must re-authenticate to get new role |

---

## After Publishing Checklist

When testing changes in production:
1. Wait for deployment to complete
2. Log OUT of admin
3. Log back IN as Josh
4. Verify session has correct role (Users tab visible in Settings)
5. Test feature changes

---

## File Locations Quick Reference

| Component | Path |
|-----------|------|
| Admin Layout | `client/src/components/admin/AdminLayout.tsx` |
| Settings Page | `client/src/pages/admin/Settings.tsx` |
| Inventory Page | `client/src/pages/admin/Inventory.tsx` |
| Leads Page | `client/src/pages/admin/Leads.tsx` |
| Pipeline Board | `client/src/components/admin/PipelineBoard.tsx` |
| Lead Detail Dialog | `client/src/components/admin/LeadDetailDialog.tsx` |
| Login Modal | `client/src/components/auth/LoginModal.tsx` |
| API Routes | `server/routes.ts` |
| Database Schema | `shared/schema.ts` |
| Storage Interface | `server/storage.ts` |
| Navbar | `client/src/components/layout/Navbar.tsx` |
| Footer | `client/src/components/layout/Footer.tsx` |

---

## Future Enhancements (Not Yet Built)

| Feature | Priority | Description |
|---------|----------|-------------|
| Email notifications | Low | Send email confirmations in addition to SMS |
| Analytics dashboard | Medium | Charts showing leads, sales, inventory trends |
| Appointment scheduling | Low | Calendar integration for test drives |
| Multi-location support | Low | Support multiple dealership locations |
| Custom report builder | Low | Generate custom reports on leads/inventory |

---

## API Endpoints Reference

### Authentication
- `POST /api/auth/login` - Admin login
- `POST /api/auth/logout` - Admin logout
- `GET /api/auth/session` - Check session status

### Users (Master Admin only)
- `GET /api/users` - List all users
- `POST /api/users` - Create user
- `DELETE /api/users/:id` - Delete user
- `PATCH /api/users/:id/role` - Update user role
- `PATCH /api/users/:id/password` - Reset password

### Inventory
- `GET /api/inventory` - List vehicles
- `POST /api/inventory` - Add vehicle
- `PATCH /api/inventory/:id` - Update vehicle
- `DELETE /api/inventory/:id` - Delete vehicle

### Leads
- `GET /api/inquiries` - List buyer inquiries
- `PATCH /api/inquiries/:id/status` - Update inquiry status
- `PATCH /api/inquiries/:id/stage` - Update pipeline stage
- `PATCH /api/inquiries/:id/assignment` - Assign to salesperson

### Consignments
- `GET /api/consignments` - List consignments
- `POST /api/consignments` - Submit consignment
- `PATCH /api/consignments/:id/status` - Update status

### Settings
- `GET /api/settings` - Get site settings
- `PATCH /api/settings` - Update settings (admin only)