# InstantHPI - AI-Powered Telemedicine Platform

## Overview

InstantHPI is a comprehensive AI-powered telemedicine platform designed to transform healthcare professional interactions through advanced workflow automation and intelligent medical documentation. Built by a family physician for physicians, this platform provides a Tier 4 level of medical practice automation, offering the highest degree of automation in clinical workflows.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

InstantHPI follows a modern full-stack architecture with a React-based frontend, Express.js backend, and PostgreSQL database using Drizzle ORM. The application is designed as a monorepo with shared components and clear separation of concerns.

### Core Technology Stack

- **Frontend**: React with TypeScript, Vite for build tooling
- **Backend**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **UI Framework**: Radix UI components with Tailwind CSS
- **State Management**: React Query for server state
- **Routing**: Wouter for client-side routing

## Key Components

### Frontend Architecture

- **Component Library**: Built on Radix UI primitives with custom theming
- **Layout System**: Multi-layout support including Spruce-like interface and three-panel dashboard
- **Theme System**: Professional variant with light appearance and configurable radius
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture

- **API Layer**: RESTful Express.js server with TypeScript
- **Database Layer**: Drizzle ORM for type-safe database operations
- **Authentication**: Session-based authentication with role management
- **File Storage**: Support for document and attachment handling

### AI Integration Layer

- **Anthropic Claude**: Primary AI provider for medical documentation and analysis
- **Medical Templates**: Comprehensive diagnosis templates and protocols
- **Multi-language Support**: French and English with romanization support
- **SOAP Note Generation**: Automated clinical documentation

### External Integrations

- **Spruce Health API**: Patient communication and conversation management
- **SendGrid**: Email communication services
- **Stripe**: Payment processing for subscriptions
- **Formsite**: Form data integration for patient intake

## Data Flow

### Patient Management Flow

1. Patient data enters through various channels (Formsite forms, Spruce conversations, manual entry)
2. AI processes patient information to generate HPI confirmations and SOAP notes
3. Clinical protocols are matched to patient symptoms and conditions
4. Automated documentation is generated with physician approval workflows

### Communication Flow

1. Spruce Health API manages patient conversations
2. Messages are processed through AI for content analysis and response suggestions
3. Multi-language support provides patient communications in preferred language
4. Real-time updates maintain conversation state across the platform

### Documentation Workflow

1. Patient data triggers AI analysis using medical templates
2. Spartan SOAP notes are generated following clinical best practices
3. Medication prescriptions and treatment plans are suggested
4. Follow-up scheduling and care coordination is automated

## External Dependencies

### Core Infrastructure

- **Neon Database**: PostgreSQL hosting
- **Vercel/Replit**: Application hosting and deployment
- **CDN Services**: Asset delivery and optimization

### AI and Medical Services

- **Anthropic Claude API**: Medical AI processing
- **Spruce Health API**: Patient communication platform
- **Medical Template Library**: Comprehensive diagnosis protocols

### Business Services

- **SendGrid**: Transactional email delivery
- **Stripe**: Subscription and payment management
- **Monitoring Services**: Application performance and health tracking

## Deployment Strategy

### Development Environment

- **Local Development**: Vite dev server with Express.js backend
- **Database**: Local PostgreSQL or Neon development instance
- **Environment Variables**: Secure configuration management

### Production Deployment

- **Build Process**: Vite builds frontend, ESBuild bundles backend
- **Database Migrations**: Drizzle migrations for schema management
- **Health Checks**: Endpoint monitoring and performance tracking
- **Security**: HIPAA-compliant data handling and encryption

### Scaling Considerations

- **Database**: PostgreSQL with connection pooling
- **API Rate Limiting**: Configured for external service limits
- **Caching**: Strategic caching for frequently accessed data
- **Load Balancing**: Support for horizontal scaling

The architecture supports multiple deployment tiers from basic practice automation (Tier 1) to full AI-driven workflows (Tier 4), allowing physicians to adopt automation incrementally based on their practice needs and comfort level with AI assistance.
