# Overview

This is a multi-tenant AI chat platform built with React, Express, and TypeScript. The application provides workspace-based organization where users can create conversations and interact with AI assistants. It features real-time chat interfaces, user authentication through Replit Auth, and a modern UI built with shadcn/ui components.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite for fast development
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query for server state management with optimistic updates
- **UI Components**: shadcn/ui component library with Radix UI primitives and Tailwind CSS
- **Layout**: Three-panel layout with collapsible sidebar, main chat area, and right sidebar for conversation metadata

## Backend Architecture
- **Server**: Express.js with TypeScript running in ESM mode
- **API Design**: RESTful API with structured error handling and request logging middleware
- **Authentication**: Replit OpenID Connect (OIDC) authentication with Passport.js
- **Session Management**: Express sessions stored in PostgreSQL with connect-pg-simple
- **Storage Pattern**: Repository pattern with interface-based storage abstraction for testability

## Database Architecture
- **ORM**: Drizzle ORM with PostgreSQL dialect for type-safe database operations
- **Schema**: Multi-tenant design with workspaces, users, conversations, and messages
- **Migrations**: Drizzle Kit for schema migrations and database management
- **Relations**: Proper foreign key relationships between users, workspaces, conversations, and messages

## Authentication & Authorization
- **Provider**: Replit OIDC for seamless integration with Replit environment
- **Sessions**: Server-side sessions with PostgreSQL storage for security
- **Middleware**: Authentication middleware protecting API routes
- **Multi-tenancy**: Workspace-based access control with user membership management

# External Dependencies

## Database
- **PostgreSQL**: Primary database using Neon serverless PostgreSQL with connection pooling
- **Drizzle ORM**: Type-safe database queries and schema management

## Authentication
- **Replit Auth**: OIDC-based authentication integrated with Replit platform
- **OpenID Client**: For handling OIDC authentication flow

## UI & Styling
- **Tailwind CSS**: Utility-first CSS framework with custom design tokens
- **Radix UI**: Headless UI components for accessibility and customization
- **Lucide React**: Modern icon library for consistent iconography

## Development Tools
- **Vite**: Fast build tool with HMR and development server
- **TypeScript**: Static typing for both frontend and backend
- **ESBuild**: Fast bundling for production builds