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