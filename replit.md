# Overview

This is a multi-tenant Nexus AI chat platform built with React TypeScript frontend and Python Flask backend. The application provides workspace-based organization where users can create conversations and interact with AI assistants. It features real-time chat interfaces, user authentication through Replit Auth, PostgreSQL database storage, and a modern UI built with shadcn/ui components.

**Last Updated**: August 14, 2025 - Successfully converted backend from Express.js to Python Flask per user request.

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
- **Server**: Python Flask with development server running on port 5000
- **API Design**: RESTful API using Flask Blueprint organization with structured error handling
- **Authentication**: Replit OpenID Connect (OIDC) authentication with Flask-Session
- **Session Management**: Flask sessions stored in PostgreSQL using Flask-Session SQLAlchemy
- **Database ORM**: SQLAlchemy with Flask-SQLAlchemy for database operations and models
- **Storage Pattern**: Direct SQLAlchemy models with multi-tenant workspace isolation

## Database Architecture
- **Database**: PostgreSQL with connection via DATABASE_URL environment variable
- **ORM**: SQLAlchemy with Flask-SQLAlchemy for database operations and model definitions
- **Schema**: Multi-tenant design with Users, Workspaces, WorkspaceMembers, Conversations, and Messages models
- **Migrations**: SQLAlchemy model-based schema management with db.create_all()
- **Relations**: Foreign key relationships between users, workspaces, conversations, and messages
- **Sessions**: Flask sessions stored in PostgreSQL using flask_sessions table

## Authentication & Authorization
- **Provider**: Replit OIDC with manual OAuth flow implementation (simplified for development)
- **Sessions**: Flask-Session with PostgreSQL storage using flask_sessions table
- **Middleware**: Flask decorators for route protection (@require_auth)
- **Multi-tenancy**: Workspace-based access control with WorkspaceMember model for membership management
- **Development**: Currently using mock authentication for local development

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
- **Tailwind CSS**: Utility-first CSS framework with custom design tokens
- **Radix UI**: Headless UI components for accessibility and customization
- **Lucide React**: Modern icon library for consistent iconography
- **shadcn/ui**: Component library built on Radix UI primitives

## Development Tools
- **Vite**: Fast build tool with HMR and development server
- **ESBuild**: Fast bundling for production builds