# Overview

This is a comprehensive multi-tenant Nexus AI platform built with React TypeScript frontend and Python Flask backend. The application provides workspace-based organization where users can create conversations and interact with AI assistants. It features dark-themed UI matching Nexus AI Hub branding, comprehensive authentication with forgot password functionality, business information collection for user onboarding, email verification with HTML templates, Google OAuth integration, PostgreSQL database storage with MongoDB fallback support, static landing pages recreated from nexusaihub.co.in, a comprehensive contacts management system with custom properties, and a complete agent creation and customization system.

**Last Updated**: August 20, 2025 - Added comprehensive "Create Agent" feature with modal-based selection for Web, WhatsApp, and Voice agents, complete Agent database model with workspace relationships, full backend API endpoints for agent CRUD operations, customizable agent interface with live preview functionality, and a complete Flow Builder powered by React Flow with drag-and-drop nodes, visual connections, Bot Knowledge management, and JSON flow persistence.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite for fast development
- **Routing**: Wouter for lightweight client-side routing with static landing page routes
- **State Management**: TanStack Query for server state management with optimistic updates
- **UI Components**: shadcn/ui component library with Radix UI primitives and Tailwind CSS
- **Layout**: Three-panel layout with collapsible sidebar, main chat area, and right sidebar for conversation metadata
- **Landing Pages**: Static marketing pages recreated from nexusaihub.co.in with comprehensive feature showcase
- **Contacts System**: Advanced contacts management with custom properties, inline editing, drawer-based full editing, and enhanced property management with scrollable options UI
- **Agent Creation System**: Comprehensive agent creation with modal-based type selection, customization interface, live preview functionality, and advanced Flow Builder
- **Flow Builder**: Visual drag-and-drop flow designer powered by React Flow with Start, Input, Bot Knowledge, and End nodes, visual connections, and comprehensive knowledge source management

## Backend Architecture
- **Server**: Python Flask with development server running on port 5000
- **API Design**: RESTful API using Flask Blueprint organization with structured error handling
- **Authentication**: Replit OpenID Connect (OIDC) authentication with Flask-Session
- **Session Management**: Flask sessions stored in PostgreSQL using Flask-Session SQLAlchemy
- **Database ORM**: SQLAlchemy with Flask-SQLAlchemy for database operations and models
- **Storage Pattern**: Direct SQLAlchemy models with multi-tenant workspace isolation

## Database Architecture
- **Database**: PostgreSQL with connection via DATABASE_URL environment variable
- **ORM**: SQLAlchemy with Flask-SQLAlchemy for database operations and model definitions
- **Schema**: Multi-tenant design with Users, Workspaces, WorkspaceMembers, Conversations, Messages, Contacts, CustomFields, and Agents models
- **Migrations**: SQLAlchemy model-based schema management with db.create_all()
- **Relations**: Foreign key relationships between users, workspaces, conversations, messages, contacts, custom fields, and agents
- **Sessions**: Flask sessions stored in PostgreSQL using flask_sessions table
- **Custom Properties**: Flexible custom field system supporting string, number, date, dropdown, radio, and multiselect field types with workspace isolation, advanced drawer UI for editing, 20-character field name limits, 10+ character option requirements, and 50-option maximum limits
- **Agent Management**: Complete agent lifecycle management with Web, WhatsApp, and Voice agent types, draft/published/archived status tracking, JSON configuration storage, workspace-isolated access control, and visual flow configuration with persistent JSON storage
- **Knowledge Management**: Multi-modal knowledge input system supporting document uploads (.doc, .pdf, .txt, .csv, .xls/.xlsx), manual text entry, and website scraping for comprehensive bot training

## Authentication & Authorization
- **JWT Authentication**: Secure JWT tokens with 48-hour expiry for session management
- **Multi-Provider Auth**: Local email/password authentication and Google OAuth integration
- **Password Security**: bcrypt hashing with secure password reset functionality via email
- **Email Verification**: HTML email templates with SendGrid integration for account verification
- **Forgot Password**: Complete password reset flow with time-limited tokens and HTML email templates
- **Business Information Collection**: Post-login onboarding flow for collecting business name and type
- **Multi-tenancy**: Workspace-based access control with automatic workspace creation for new users
- **Route Protection**: Flask decorators (@require_auth) for secure API endpoint protection

# External Dependencies

## Backend - Python Flask
- **Flask**: Lightweight WSGI web application framework
- **Flask-SQLAlchemy**: Flask integration for SQLAlchemy ORM
- **Flask-Session**: Server-side session support with PostgreSQL storage
- **Flask-CORS**: Cross-Origin Resource Sharing handling
- **psycopg2-binary**: PostgreSQL adapter for Python

## Database
- **PostgreSQL**: Primary database using environment DATABASE_URL
- **SQLAlchemy**: Python SQL toolkit and Object-Relational Mapping

## Authentication
- **Replit Auth**: OIDC-based authentication (currently simplified for development)
- **Authlib**: OAuth and OpenID Connect library for Python

## Frontend - React TypeScript
- **React**: JavaScript library for building user interfaces
- **TypeScript**: Static type checking for JavaScript
- **Vite**: Fast build tool with HMR and development server
- **Wouter**: Minimalist routing for React

## UI & Styling
- **Dark Theme**: Comprehensive dark theme matching Nexus AI Hub branding with slate color palette
- **Tailwind CSS**: Utility-first CSS framework with custom design tokens and dark theme variables
- **Radix UI**: Headless UI components for accessibility and customization
- **Lucide React**: Modern icon library for consistent iconography
- **shadcn/ui**: Component library built on Radix UI primitives with dark theme customization
- **Responsive Design**: Mobile-first responsive layout with gradient backgrounds and modern aesthetics
- **Landing Pages**: Static marketing pages with hero sections, feature showcases, AI tools directory, and contact sections

## Development Tools
- **Vite**: Fast build tool with HMR and development server
- **ESBuild**: Fast bundling for production builds