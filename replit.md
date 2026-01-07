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
- **Canonical Vehicle URLs**: `/inventory/{year}-{make}-{model}-{trim?}-{stockId}`
  - Format: slugified lowercase, hyphens replace spaces/punctuation
  - Entity-based format (no city/state in URL)
  - Trim is optional (omitted if empty)
  - Stock ID: Either custom stock number or first 8 characters of UUID
  - Example: `/inventory/2023-rolls-royce-cullinan-black-badge-abc12345`
  - Location info is preserved in structured data (JSON-LD) for local SEO

### Where to Manage SEO Settings
- **Admin Panel > Settings > SEO Tab** contains all SEO controls:
  - Social Sharing (OG title, description, image, Twitter handle)
  - Dealer Location (city, state, address, hours, Google Map URL, base URL)
  - Vehicle URL Settings (toggle trim/stock number in slugs)
  - Sold Vehicle Behavior (keep live, redirect, or noindex after X days)

### How Slugs Are Generated
1. New vehicles automatically get canonical slugs when created via API
2. Existing vehicles are auto-backfilled on server startup (no manual action needed)
3. Slug format: `{year}-{make}-{model}[-{trim}]-{stockId}`
4. All parts are slugified (lowercase, hyphens, no special chars)

### Endpoints
- **robots.txt**: `GET /robots.txt` - Dynamic, allows indexing of public pages, blocks admin/API
- **sitemap.xml**: `GET /sitemap.xml` - Dynamic, includes all available vehicles, inventory pages, location pages
- **Canonical URL API**: `GET /api/vehicle/canonical/:idOrSlug` - Returns canonical URL for any vehicle

### Structured Data
- Vehicle pages include JSON-LD with Vehicle/Product schema
- Includes: name, brand, model, year, mileage, VIN, price, condition, images, seller info
- Location (city, state, address) is included in seller info for local SEO relevance

### Backward Compatibility
- Legacy `/vehicle/{slug}` URLs automatically redirect (301) to `/inventory/{slug}`
- SEO data injection handles both slug and UUID lookups

## Local SEO System

### Location Landing Pages
- **Purpose**: Capture local search traffic from nearby cities within the dealership's service area
- **URL Format**: `/location/{city-state-slug}` (e.g., `/location/miami-fl`, `/location/pensacola-fl`)
- **Database Table**: `target_locations` stores city, state, slug, custom headlines, descriptions, meta tags, and radius
- **Admin UI**: Admin Panel > SEO Tools > Target Locations

### Design Rationale
For a single-location dealership, all location landing pages display the full available inventory rather than filtering by location because:
1. All vehicles are physically at the same dealership location
2. SEO value comes from location-specific content (headlines, descriptions, meta tags, LocalBusiness schema)
3. Customers searching from nearby cities should see the same inventory options
4. Artificial filtering would hide desirable vehicles and reduce conversion opportunities

### Citation Management (Hybrid Option C)
The platform uses a hybrid approach to citation building:
- **Data Aggregators**: 4 major aggregators (Neustar Localeze, Data Axle, Foursquare, Factual) that distribute to 100+ sites
- **Manual Directories**: 16 high-value directories requiring individual submissions
- **NAP Consistency**: Built-in checker verifies Name, Address, Phone consistency before submissions
- **Export Tools**: CSV and JSON export for copy/paste into manual submission forms

### Admin SEO Tools Page
Located at `/admin/seo-tools` with three tabs:
1. **Target Locations**: Create and manage location landing pages
2. **Citations**: Track submission status across all directories
3. **NAP Check**: Verify business info consistency and export data

## External Dependencies

- **Database**: PostgreSQL.
- **Cloud Storage**: Replit Object Storage (Google Cloud Storage backend).
- **UI Libraries**: shadcn/ui (Radix UI), Lucide React, Embla Carousel, Uppy.
- **Fonts**: Inter, Playfair Display (Google Fonts CDN).
- **CRM Integration**: GoHighLevel CRM for contact creation, SMS verification, and admin notifications (using API v2 with Private Integration Token).

## Future Roadmap

### Listing Syndication
- **Facebook Marketplace Feed**: Export vehicle listings to Facebook Marketplace via Business Manager catalog
- **Third-Party Listing Feeds**: Syndicate inventory to AutoTrader, Cars.com, CarGurus, and other marketplaces using XML/CSV feeds or APIs
- **Dealer-to-Dealer Listings**: Share inventory with partner dealerships
- **Wholesale Inventory Option**: Mark vehicles for wholesale distribution

**Implementation Notes**: Most platforms require dealer accounts with contractual relationships, API keys or SFTP credentials, and vehicle data in specific formats (ADF/XML, VehicleXML, or JSON). Consider using an aggregator service or building a syndication module with per-channel adapters.