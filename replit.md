# Nearbuy - Local Commerce Platform

## Overview

Nearbuy is a comprehensive local commerce platform that connects customers, shopkeepers, delivery partners (couriers), and administrators in a unified ecosystem. The application facilitates local shopping, product management, order processing, and delivery coordination through a modern web interface with real-time communication capabilities.

**Status:** Successfully migrated from Bolt to Replit environment (June 19, 2025)

## Demo Credentials

### Admin Account
- **Email:** admin@nearbuy.com
- **Password:** admin123
- **Role:** Full platform administration, approve shops and users

### Test Shopkeeper Account  
- **Email:** shop@test.com
- **Password:** shop123
- **Role:** Manage shop, products, and orders

### Demo Shop
- **Name:** रमेश किराना स्टोर (Ramesh Kirana Store)
- **Location:** Gandhi Market, Delhi
- **Products:** 6 Indian grocery items with Hindi/English names
- **Status:** Approved and active

## System Architecture

The application follows a full-stack architecture with clear separation between frontend and backend components:

- **Frontend**: React-based single-page application with TypeScript
- **Backend**: Express.js REST API server with TypeScript
- **Database**: PostgreSQL with Drizzle ORM for data persistence
- **Real-time Communication**: Socket.io for live updates and notifications
- **Authentication**: JWT-based authentication system
- **Development Environment**: Vite for fast development and hot module replacement

## Key Components

### Frontend Architecture
- **React 18** with TypeScript for type-safe component development
- **React Router** for client-side routing and navigation
- **Context API** for state management (Auth, Language, Socket contexts)
- **Tailwind CSS** with shadcn/ui components for consistent styling
- **TanStack Query** for efficient server state management
- **React Hook Form** with Zod validation for form handling

### Backend Architecture
- **Express.js** server with TypeScript support
- **Modular routing** system with dedicated route handlers
- **Storage abstraction** layer with in-memory implementation (ready for database migration)
- **Middleware** for request logging, authentication, and error handling
- **Development-specific** Vite integration for seamless full-stack development

### Database Schema
- **Users table** with role-based access (customer, shopkeeper, courier, admin)
- **Drizzle ORM** for type-safe database operations
- **PostgreSQL** as the production database (configured but not yet implemented)
- **Schema validation** using Drizzle-Zod for runtime type checking

### Authentication System
- **Role-based access control** with four distinct user types
- **JWT token** authentication for secure API access
- **Protected routes** with role-specific access restrictions
- **Registration approval** workflow for shopkeepers and couriers

### Real-time Features
- **Socket.io** integration for live order updates
- **Room-based** communication for user-specific notifications
- **Real-time order tracking** and status updates
- **Live chat** capabilities between users

## Recent Changes

### June 19, 2025 - Bolt to Replit Migration Complete
- ✓ Migrated complete codebase from Bolt to Replit environment
- ✓ Set up PostgreSQL database with comprehensive schema
- ✓ Implemented full backend API with authentication and authorization
- ✓ Fixed all API endpoints to work with Replit's routing system
- ✓ Created barcode scanner component with camera integration
- ✓ Added demo shop with Indian grocery products
- ✓ Established admin and shopkeeper test accounts
- ✓ Verified customer can browse shops and products
- ✓ Real-time Socket.IO integration working

## Data Flow

### User Registration and Authentication
1. Users register with role selection (customer, shopkeeper, courier, admin)
2. Shopkeepers and couriers require admin approval before activation
3. JWT tokens are issued upon successful authentication
4. Role-based routing directs users to appropriate dashboards

### Order Management Flow
1. Customers browse products from nearby shops
2. Orders are placed and immediately available to assigned couriers
3. Real-time updates track order status through fulfillment
4. Socket connections ensure all parties receive live notifications

### Shop and Product Management
1. Shopkeepers set up their shops with location data
2. Products are managed with barcode scanning capabilities
3. Inventory tracking with real-time stock updates
4. Order fulfillment workflow with status management

## External Dependencies

### Core Technologies
- **@neondatabase/serverless**: Serverless PostgreSQL connection
- **drizzle-orm**: Type-safe ORM for database operations
- **express**: Web application framework
- **socket.io**: Real-time bidirectional communication
- **jsonwebtoken**: JWT authentication implementation

### Frontend Libraries
- **@radix-ui/react-***: Accessible UI component primitives
- **@tanstack/react-query**: Server state management
- **react-router-dom**: Client-side routing
- **tailwindcss**: Utility-first CSS framework
- **date-fns**: Date manipulation utilities

### Development Tools
- **vite**: Fast build tool and development server
- **typescript**: Static type checking
- **tsx**: TypeScript execution engine
- **esbuild**: Fast JavaScript bundler

## Deployment Strategy

### Development Environment
- **Replit-optimized** configuration with auto-reload
- **Hot module replacement** via Vite integration
- **Multi-service** setup (Node.js, PostgreSQL)
- **Environment variables** for database configuration

### Production Build
- **Vite build** for optimized frontend bundle
- **esbuild** for efficient server-side bundling
- **Static file serving** from Express server
- **Autoscale deployment** target for dynamic scaling

### Database Strategy
- **Drizzle migrations** for schema management
- **Environment-based** configuration switching
- **Connection pooling** via Neon serverless PostgreSQL
- **Type-safe** database operations throughout

## Windows Development Setup

For Windows users experiencing `'NODE_ENV' is not recognized` error:

**Option 1 (Windows Batch File):**
```bash
start-dev.bat
```

**Option 2 (Cross-env - if available):**
```bash
npx cross-env NODE_ENV=development tsx server/index.ts
```

**Option 3 (Manual Windows):**
```cmd
set NODE_ENV=development && tsx server/index.ts
```

**Option 4 (Linux/Mac):**
```bash
./start-dev.sh
```

## Troubleshooting Common Issues

1. **"NODE_ENV not recognized"** - Use the commands above
2. **Port 5000 in use** - Kill process: `netstat -ano | findstr :5000` then `taskkill /PID <PID> /F`
3. **Database connection issues** - Ensure PostgreSQL is running on port 5432
4. **Shop registration errors** - Check user doesn't already have a shop registered

## Changelog
- June 19, 2025. Initial setup
- June 19, 2025. Fixed Windows NODE_ENV compatibility issue

## User Preferences

Preferred communication style: Simple, everyday language.