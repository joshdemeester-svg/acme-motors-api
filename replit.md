# Prestige Auto Consignment

## Overview
Prestige Auto Consignment is a premium platform for selling luxury and exotic vehicles. It features a public website for vehicle submissions and browsing, and an admin panel for managing consignment requests and inventory. The platform automates the consignment process, from submission and photo uploads to admin review, pricing, and inventory management, aiming to streamline high-end vehicle sales.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
- **Styling**: Tailwind CSS v4 with shadcn/ui (New York style) for a modern aesthetic.
- **Animations**: Framer Motion for smooth user interactions.
- **SEO**: Dynamic Meta Tags, Open Graph, Twitter Cards, Schema.org Structured Data, and dynamic `robots.txt`/`sitemap.xml` for comprehensive search engine optimization.

### Technical Implementations
- **Frontend**: React 18 with TypeScript, Wouter for routing, TanStack React Query for state management, React Hook Form with Zod for form handling.
- **Backend**: Express.js with TypeScript, RESTful JSON APIs.
- **Database**: PostgreSQL with Drizzle ORM.
- **Authentication**:
    - **Admin**: Session-based using `express-session`, PBKDF2 for password hashing, `requireAdmin` middleware.
    - **Seller Portal**: Phone-based authentication with SMS verification.
- **File Uploads**: Uppy client with presigned URL uploads to Replit Object Storage (Google Cloud Storage).
- **Build System**: Vite for development and client production, esbuild for server production.
- **Database Seeding**: Automatic seeding of site settings, admin credentials, and branding on server startup.
- **Key Features**: Comprehensive admin panel for inventory, lead, and consignment management; multi-step consignment form with phone verification; vehicle comparison and payment calculator for public users.

### Feature Specifications (High-Level)
- **Admin & Authentication**: Admin login, two-tier roles, user management, seller portal with phone login.
- **Demo Mode**: Master admin toggle to populate/clear sample luxury vehicles, leads, consignments, and testimonials for client presentations. Demo data is tagged with `isDemo: true` and displayed with an amber banner when active.
- **Branding & Site Settings**: Customizable logo, colors, menus, footer, social links, legal pages, and favicon.
- **Inventory Management**: Add, edit, delete vehicles; photo uploads with drag-and-drop reordering; CSV bulk import; VIN API auto-fill.
- **Lead Management**: Buyer inquiries, trade-in requests, credit applications; visual CRM pipeline; lead notes and activity timeline; salesperson assignment.
- **Consignments**: Multi-step submission form, phone verification, status tracking, conversion to inventory, SMS confirmations and admin notifications.
- **Public Website**: Homepage, inventory listings, vehicle details, comparison, payment calculator, trade-in form, contact page, testimonials display.

## SEO System

### URL Structure
- **Canonical Vehicle URLs**: `/vehicle/{year}-{make}-{model}-{trim}-{city}-{state}-{id}`
  - Format: slugified lowercase, hyphens replace spaces/punctuation
  - Trim is optional (omitted if empty)
  - City/State from Admin SEO Settings > Dealer Location
  - UUID always included at end for uniqueness
  - Example: `/vehicle/2023-rolls-royce-cullinan-black-badge-navarre-fl-cbd18aa4-4480-4c06-a2cc-d5254ed6b90e`

### Where to Manage SEO Settings
- **Admin Panel > Settings > SEO Tab** contains all SEO controls:
  - Social Sharing (OG title, description, image, Twitter handle)
  - Dealer Location (city, state, address, hours, Google Map URL, base URL)
  - Vehicle URL Settings (toggle trim/location in slugs)
  - Sold Vehicle Behavior (keep live, redirect, or noindex after X days)

### How Slugs Are Generated
1. New vehicles automatically get canonical slugs when created via API
2. Existing vehicles can be backfilled via `POST /api/inventory/backfill-slugs` (admin only)
3. Slug format: `{year}-{make}-{model}[-{trim}][-{city}-{state}]-{uuid}`
4. All parts are slugified (lowercase, hyphens, no special chars)

### Endpoints
- **robots.txt**: `GET /robots.txt` - Dynamic, allows indexing of public pages, blocks admin/API
- **sitemap.xml**: `GET /sitemap.xml` - Dynamic, includes all available vehicles, inventory pages, location pages
- **Canonical URL API**: `GET /api/vehicle/canonical/:idOrSlug` - Returns canonical URL for any vehicle

### Structured Data
- Vehicle pages include JSON-LD with Vehicle/Product schema
- Includes: name, brand, model, year, mileage, VIN, price, condition, images, seller info

### Backward Compatibility
- Legacy UUID-only URLs (`/vehicle/{uuid}`) still work
- SEO data injection handles both slug and UUID lookups

## External Dependencies

- **Database**: PostgreSQL.
- **Cloud Storage**: Replit Object Storage (Google Cloud Storage backend).
- **UI Libraries**: shadcn/ui (Radix UI), Lucide React, Embla Carousel, Uppy.
- **Fonts**: Inter, Playfair Display (Google Fonts CDN).
- **CRM Integration**: GoHighLevel CRM for contact creation, SMS verification, and admin notifications (using API v2 with Private Integration Token).