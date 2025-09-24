# Nexus AI Hub

## Overview

Nexus AI Hub is a comprehensive AI platform that enables users to build, deploy, and manage intelligent AI agents. The platform supports multiple agent types (web chatbots, WhatsApp bots, voice agents) with a visual flow builder for creating conversational experiences. It features a multi-tenant architecture with workspace-based organization, contact management, and integration capabilities with external AI services.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript running on Vite for fast development and building
- **UI Components**: Comprehensive component library built on Radix UI primitives with shadcn/ui styling
- **Styling**: Tailwind CSS with custom CSS variables for theming, supporting dark theme design
- **State Management**: TanStack Query for server state management and caching
- **Routing**: React Router for client-side navigation
- **Authentication**: JWT-based authentication with Google OAuth integration via @react-oauth/google

### Backend Architecture  
- **Framework**: Python Flask with Blueprint-based modular routing
- **Database ORM**: Drizzle ORM configured for PostgreSQL with migration support
- **Session Management**: Flask-Session with PostgreSQL backend for scalable session storage
- **Authentication**: JWT tokens with 48-hour expiry, bcrypt for password hashing
- **API Design**: RESTful API structure with versioned endpoints (/api/*)

### Data Storage Solutions
- **Primary Database**: PostgreSQL with Neon Database serverless hosting
- **Schema Management**: Drizzle ORM with TypeScript schema definitions in shared/schema.ts
- **Fallback Storage**: MongoDB support for business information with PostgreSQL fallback
- **Session Storage**: Database-backed sessions for scalability

### Authentication and Authorization
- **Multi-Provider Auth**: Supports both email/password and Google OAuth authentication
- **JWT Implementation**: Secure token-based authentication with configurable expiry
- **Email Verification**: SendGrid integration for account verification and password reset
- **Authorization Middleware**: Python decorators for route protection (@require_auth)

### External Dependencies
- **Email Service**: SendGrid for transactional emails (verification, password reset, welcome)
- **Database**: Neon Database (serverless PostgreSQL) for primary data storage
- **Cloud Storage**: Google Cloud Storage integration for file uploads and assets
- **OAuth Provider**: Google OAuth 2.0 for social authentication
- **AI/ML Services**: OpenRouter API integration for multiple LLM access
- **Frontend Build**: Vite with React plugins and Replit-specific development tools
- **Development**: Hot reload, error overlays, and development proxy configuration

### Key Design Patterns
- **Monorepo Structure**: Unified codebase with client/, server/, and shared/ directories
- **Blueprint Architecture**: Modular Flask backend with separate route files for different features
- **Component-Based UI**: Reusable React components with consistent design system
- **Type Safety**: Shared TypeScript interfaces between frontend and backend
- **Environment-Based Config**: Flexible configuration for development and production environments