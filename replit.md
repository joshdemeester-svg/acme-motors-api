# Prestige Auto Consignment

## Overview

Prestige Auto Consignment is a premium automotive consignment platform that enables users to submit their luxury and exotic vehicles for professional sale. The application provides a public-facing website for vehicle submissions and inventory browsing, along with an admin panel for managing consignment requests and inventory.

The platform handles the complete consignment workflow: vehicle submission with photo uploads, admin review and approval, pricing, and inventory management.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight client-side routing)
- **State Management**: TanStack React Query for server state
- **Styling**: Tailwind CSS v4 with shadcn/ui component library (New York style)
- **Animations**: Framer Motion for page transitions and UI interactions
- **Form Handling**: React Hook Form with Zod validation

The frontend follows a component-based architecture with:
- `/pages` - Route-level components (Home, Inventory, Consign, VehicleDetails, etc.)
- `/pages/admin` - New modular admin pages with sidebar layout:
  - `Dashboard.tsx` - Overview with stats, recent activity, upcoming appointments
  - `Inventory.tsx` - Vehicle inventory management with search/filtering
  - `Leads.tsx` - Tabbed view for inquiries, trade-ins, and appointments
  - `Consignments.tsx` - Seller consignment submissions management
  - `Settings.tsx` - Multi-tab settings (branding, contact, notifications, legal, integrations, users)
- `/components/ui` - Reusable shadcn/ui primitives
- `/components/layout` - Navbar and Footer
- `/components/admin` - Admin-specific components:
  - `AdminLayout.tsx` - Sidebar navigation with auth protection
- `/components/home` - Hero section
- `/components/consignment` - Multi-step consignment form

### Backend Architecture

- **Framework**: Express.js with TypeScript
- **Database ORM**: Drizzle ORM with PostgreSQL
- **API Pattern**: RESTful JSON APIs under `/api/*` prefix
- **File Uploads**: Uppy client with presigned URL uploads to Google Cloud Storage (via Replit Object Storage integration)

Key API endpoints:
- `POST /api/consignments` - Create new consignment submission
- `GET /api/consignments` - List all consignments (admin)
- `PATCH /api/consignments/:id/status` - Update consignment status
- `GET /api/inventory` - List available vehicles
- `POST /api/uploads/request-url` - Get presigned upload URL
- `POST /api/auth/login` - Admin login
- `POST /api/auth/logout` - Admin logout
- `GET /api/auth/session` - Check session status
- `POST /api/auth/setup` - Create initial admin account
- `GET /api/settings` - Get site settings (public)
- `PATCH /api/settings` - Update site settings (admin only)
- `POST /api/inquiries` - Submit buyer inquiry with pre-qualification data
- `GET /api/inquiries` - List all buyer inquiries (admin)
- `PATCH /api/inquiries/:id/status` - Update inquiry status (admin)
- `GET /api/vehicles/:id/inquiries` - Get inquiries for a specific vehicle

### Authentication

Session-based authentication using express-session with memorystore:
- Secure password hashing using PBKDF2 with per-password salt (100,000 iterations, SHA-512)
- Admin-only route protection via `requireAdmin` middleware
- First-time admin setup via `/api/auth/setup` endpoint
- **Unified Login Modal**: Single modal with two paths - Vehicle Owner (phone verification) and Staff (username/password)

### Seller Portal

Vehicle owners can log in to track their consignment status:
- **Phone-based authentication**: Sellers log in using their phone number (same as used during consignment)
- **SMS verification**: 6-digit code sent via GoHighLevel SMS
- **Security features**:
  - Rate limiting (3 requests per 5 minutes per phone)
  - Session regeneration after authentication (prevents session fixation)
  - Generic error messages (prevents phone enumeration)
- **Portal features**: View all submitted vehicles, track status (pending, approved, listed, sold, rejected)
- **Routes**:
  - `POST /api/seller/send-code` - Send verification code to phone
  - `POST /api/seller/verify` - Verify code and create session
  - `GET /api/seller/session` - Check seller session status
  - `POST /api/seller/logout` - End seller session
  - `GET /api/seller/consignments` - Get seller's vehicles

### Data Storage

PostgreSQL database with Drizzle ORM. Core tables:
- `users` - Admin authentication (username, hashed password, isAdmin flag)
- `consignment_submissions` - Vehicle submission data with status tracking
- `inventory_cars` - Approved vehicles listed for sale
- `buyer_inquiries` - Buyer interest tracking with pre-qualification data
- `site_settings` - Customizable site branding and contact info:
  - Branding: primary color, logo URL, site name
  - Contact: address lines, phone, email
  - Social media: Facebook, Instagram, Twitter, YouTube, TikTok URLs
  - Legal: privacyPolicy and termsOfService (markdown content)

### File Storage

Uses Replit's Object Storage integration (Google Cloud Storage backend):
- Presigned URL upload flow for security
- Direct client-to-storage uploads
- Custom upload hooks and components provided

### Build System

- **Development**: Vite dev server with HMR
- **Production**: Vite builds client to `dist/public`, esbuild bundles server to `dist/index.cjs`
- **Database Migrations**: `drizzle-kit push` for schema synchronization

## External Dependencies

### Database
- PostgreSQL (required, configured via `DATABASE_URL` environment variable)
- Drizzle ORM for type-safe database operations

### Cloud Storage
- Google Cloud Storage via Replit Object Storage integration
- Accessed through Replit sidecar service at `http://127.0.0.1:1106`

### UI Libraries
- shadcn/ui components (Radix UI primitives)
- Lucide React icons
- Embla Carousel for image carousels
- Uppy for file upload management

### Fonts
- Inter (sans-serif body text)
- Playfair Display (serif headings)
- Loaded from Google Fonts CDN

### GoHighLevel CRM Integration
- Automatically creates contacts in GoHighLevel when consignment forms are submitted
- Syncs customer name, email, phone, and vehicle details
- Tags leads with "Consignment Lead" and vehicle info
- **Phone Verification via SMS**: Users must verify their cell phone before submitting the consignment form
  - Sends 6-digit verification code via GoHighLevel SMS
  - Codes expire after 10 minutes
  - Prevents form submission until phone is verified
- **Admin SMS Notifications**: Configurable in admin settings panel
  - Up to 2 phone numbers can receive notifications
  - Notifies when new consignment is submitted (vehicle, owner name, phone)
  - Notifies when buyer inquiry is submitted (vehicle, buyer name, contact info, message)
  - Admin contacts tagged as "Admin Notification" in GoHighLevel
- **Configuration**: Can be configured per-site via the admin panel (Settings → Integrations tab)
  - API Token: Write-only field for security (token is never exposed in API responses)
  - Location ID: Editable in the admin panel
  - Falls back to `GHL_LOCATION_ID` and `GHL_API_TOKEN` environment variables if not configured
- Uses GoHighLevel API v2 with Private Integration Token authentication

### SEO Optimization

Comprehensive SEO implementation for search engine visibility:

**Dynamic Meta Tags** (`client/src/hooks/use-seo.ts`):
- Custom `useSEO` hook updates document title and meta tags per page
- Open Graph and Twitter Card meta tags for social sharing
- Dynamic page titles: "2022 Porsche 911 GT3 for Sale | Navarre Motors"

**Schema.org Structured Data**:
- Vehicle schema on individual vehicle pages (price, mileage, VIN, condition)
- AutoDealer/Organization schema on homepage with contact info from site settings
- Enables rich search results in Google

**SEO Endpoints**:
- `GET /robots.txt` - Dynamically generated robots.txt
  - Allows crawling of public pages
  - Blocks /admin, /seller-portal, and /api/ routes
  - Points to sitemap
- `GET /sitemap.xml` - Dynamic XML sitemap
  - Lists all static pages (home, inventory, consign)
  - Lists all available inventory vehicles
  - Updates automatically when inventory changes

**Per-Page SEO**:
- Home: Organization schema, site description
- Inventory: Collection listing description
- Vehicle Details: Vehicle schema with full specs, first photo as OG image
- Consign: Lead generation focused description

### Database Seeding

Automatic database seeding for consistent deployment between development and production:

**Configuration** (`server/seed-data.ts`):
- Contains all site settings (colors, logo, contact info, commission rates)
- Admin credentials for initial setup
- Centralized configuration that can be updated for new deployments

**How It Works**:
- On server startup, checks if the database needs seeding
- Seeds if site name is empty or set to default value
- Creates admin user and applies all site settings
- Skips seeding if configuration already exists (won't overwrite production data)

**What Gets Seeded**:
- Admin user (Josh with configured password)
- Site branding (logo, colors, fonts)
- Contact information (address, phone, email)
- Commission settings (rate, timeline estimates)

**Note**: Inventory and consignments are NOT seeded - these are dynamic data that accumulate through normal operation. Only the base configuration is seeded to ensure the site is functional on first deployment.

**Security Note**: The default admin password in seed-data.ts should be changed immediately after first login to production. Consider updating the password in the admin panel or updating the seed file with a new password before deployment.