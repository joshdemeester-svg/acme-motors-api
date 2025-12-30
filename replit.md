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
- **Branding & Site Settings**: Customizable logo, colors, menus, footer, social links, legal pages, and favicon.
- **Inventory Management**: Add, edit, delete vehicles; photo uploads with drag-and-drop reordering; CSV bulk import; VIN API auto-fill.
- **Lead Management**: Buyer inquiries, trade-in requests, credit applications; visual CRM pipeline; lead notes and activity timeline; salesperson assignment.
- **Consignments**: Multi-step submission form, phone verification, status tracking, conversion to inventory, SMS confirmations and admin notifications.
- **Public Website**: Homepage, inventory listings, vehicle details, comparison, payment calculator, trade-in form, contact page, testimonials display.

## External Dependencies

- **Database**: PostgreSQL.
- **Cloud Storage**: Replit Object Storage (Google Cloud Storage backend).
- **UI Libraries**: shadcn/ui (Radix UI), Lucide React, Embla Carousel, Uppy.
- **Fonts**: Inter, Playfair Display (Google Fonts CDN).
- **CRM Integration**: GoHighLevel CRM for contact creation, SMS verification, and admin notifications (using API v2 with Private Integration Token).