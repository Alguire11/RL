# Enoíkio - Rent Credit Building Platform

## Overview

Enoíkio is a comprehensive rent credit building platform that helps tenants automatically track on-time rent payments and build a credit portfolio. The application uses a modern full-stack TypeScript architecture with React frontend, Express backend, and PostgreSQL database.

## User Preferences

Preferred communication style: Simple, everyday language.

## Admin Access System

The application now includes a comprehensive admin access system with role-based authentication:

### Demo Credentials
- **Admin Access**: username: `admin`, password: `admin123`
- **User Access**: username: `user`, password: `user123`  
- **Landlord Access**: username: `landlord`, password: `landlord123`

### Routes
- `/admin-login` - Admin login page with demo credentials
- `/admin` - Admin dashboard (requires admin role)
- `/landlord-dashboard` - Landlord dashboard (requires landlord role)
- `/dashboard` - Regular user dashboard (requires user role)

### Authentication Flow
1. Users visit `/admin-login` to access the admin system
2. Upon successful login, users are redirected based on their role
3. Session is stored in localStorage for demo purposes
4. Each dashboard checks for appropriate role access

## Recent Changes

✓ Fixed critical authentication 404 issues by implementing proper custom auth system
✓ Created functional login/signup forms with proper validation and error handling
✓ Removed all placeholder data (John, Doe, john@example.com) from forms
✓ Fixed navigation component DOM nesting warnings
✓ Implemented proper logout functionality with API calls
✓ Enhanced button visibility with better blue color contrast
✓ Created comprehensive admin login system with dummy credentials
✓ Built role-based access control (admin, user, landlord)
✓ Enhanced all missing pages (help center, contact, status, privacy, terms)
✓ Fixed Terms and Privacy Policy links throughout the application
✓ Authentication system now fully functional with session management
✓ Added landlord access routes to main login/signup page (/auth)
✓ Implemented fully functional Quick Actions in landlord dashboard
✓ Created working dialogs for Add Property, Manage Tenants, Send Notice, and Schedule Inspection
✓ Enhanced landlord dashboard with comprehensive property and tenant management features
✓ Comprehensive Help Center with detailed FAQs covering Getting Started, Credit Building, and Account & Billing sections
✓ Enhanced live chat system with smart escalation to customer service email (support@enoikio.co.uk) for complex queries
✓ Added searchable knowledge base with categorized content and improved user experience
✓ Fixed navbar transparency issues - changed to solid white background for better readability across all pages
✓ Implemented admin user management: subscription plan updates with full backend API integration and database persistence
✓ Added password reset UI for admins (demo system - production would require password hashing and email notifications)
✓ Enhanced landlord dashboard with visible analytics section showing key performance metrics
✓ Implemented subscription-based feature restrictions (Free: 1 property, Standard: 3 properties, Premium: unlimited)
✓ Added landlord welcome section explaining platform features and benefits
✓ Created upgrade prompts and feature gates for free tier landlords with clear pricing CTAs
✓ Added subscription plan switcher in landlord dashboard header for demo testing
✓ Enhanced mobile responsiveness for all landlord dashboard sections
✓ Aligned landlord/tenant UI with landing page brand colors (clean white backgrounds, blue-purple gradients)
✓ Made stats cards clickable (Properties, Active Tenants, Verifications, Pending Requests)
✓ Enhanced button visibility and contrast across all dashboards (brand blue-purple gradients)
✓ Created subscription upgrade page (/subscribe) with Stripe Elements supporting Apple Pay and Google Pay
✓ Added Stripe payment intent endpoint (requires VITE_STRIPE_PUBLIC_KEY and STRIPE_SECRET_KEY to function)
✓ Linked all upgrade buttons to subscription page with clear pricing tiers

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query for server state and caching
- **Styling**: Tailwind CSS with custom design system
- **UI Components**: Radix UI primitives with custom shadcn/ui components
- **Build Tool**: Vite for fast development and optimized builds

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM with PostgreSQL dialect
- **Authentication**: Replit OAuth integration with session management
- **API Design**: RESTful API with proper error handling

### Database Architecture
- **Primary Database**: PostgreSQL (using Neon serverless)
- **ORM**: Drizzle ORM with type-safe queries
- **Migrations**: Drizzle Kit for schema management
- **Session Storage**: PostgreSQL-backed session store using connect-pg-simple

## Key Components

### Authentication System
- **Provider**: Replit OAuth with OpenID Connect
- **Session Management**: Express sessions with PostgreSQL storage
- **Security**: HTTPS-only cookies, secure session handling
- **User Management**: Automatic user creation and profile management

### Database Schema
- **Users**: Profile information, onboarding status, contact details
- **Properties**: Rental property details, landlord information
- **Rent Payments**: Payment tracking with status and verification
- **Bank Connections**: Secure bank account linking for payment verification
- **Credit Reports**: Generated credit reports with sharing capabilities
- **Report Shares**: Shared report access and permissions
- **Landlord Verifications**: Landlord verification system

### Frontend Features
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Component Library**: Comprehensive UI components using Radix UI
- **State Management**: TanStack Query for API state management
- **Real-time Updates**: Optimistic updates with proper error handling
- **Form Handling**: React Hook Form with Zod validation

### Backend Features
- **API Routes**: RESTful endpoints for all major operations
- **Error Handling**: Centralized error handling with proper HTTP status codes
- **Logging**: Request/response logging for debugging
- **Data Validation**: Zod schemas for request/response validation
- **Storage Layer**: Abstracted storage interface for database operations

## Data Flow

1. **User Authentication**: Users authenticate via Replit OAuth
2. **Profile Setup**: Users complete onboarding with property and payment details
3. **Payment Tracking**: System tracks rent payments and generates credit history
4. **Report Generation**: Credit reports are generated based on payment history
5. **Report Sharing**: Users can share reports with landlords, lenders, or agencies

## External Dependencies

### Authentication
- **Replit OAuth**: Primary authentication provider
- **OpenID Connect**: Standard OAuth flow implementation

### Database
- **Neon Database**: Serverless PostgreSQL hosting
- **Connection Pooling**: Efficient database connections

### Development Tools
- **Vite**: Fast development server and build tool
- **TypeScript**: Type safety across the entire stack
- **Tailwind CSS**: Utility-first CSS framework
- **ESBuild**: Fast JavaScript bundler for production

### UI/UX
- **Radix UI**: Accessible component primitives
- **Lucide React**: Icon library
- **TanStack Query**: Server state management

## Deployment Strategy

### Development Environment
- **Hot Module Replacement**: Vite HMR for fast development
- **Development Server**: Express with Vite middleware integration
- **Environment Variables**: Secure configuration management

### Production Build
- **Frontend**: Vite build process generating optimized static assets
- **Backend**: ESBuild bundling for Node.js production deployment
- **Database**: Migrations via Drizzle Kit push command

### Environment Configuration
- **Database URL**: PostgreSQL connection string
- **Session Secret**: Secure session signing
- **OAuth Configuration**: Replit OAuth credentials
- **REPL Configuration**: Replit-specific environment variables

The application follows a modern full-stack architecture with proper separation of concerns, type safety throughout, and a focus on developer experience and maintainability.