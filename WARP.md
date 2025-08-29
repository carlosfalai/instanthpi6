# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Development Commands

### Local Development

```bash
# Install dependencies
npm install

# Start development server (frontend + backend)
npm run dev

# Build project
npm run build

# Start production server
npm start

# Database operations
npm run db:push  # Push schema changes to database

# Type check
npm run check

# Code quality
npm run lint      # Check for linting errors
npm run lint:fix  # Fix linting errors automatically
npm run format    # Format code with Prettier
npm run format:check  # Check code formatting

# Testing
npm test          # Run tests in watch mode
npm run test:run  # Run tests once
npm run test:ui   # Run tests with UI
npm run test:single  # Run single test with verbose output
```

### AI/ML Infrastructure Commands

```bash
# Start Ollama server (local AI)
ollama serve

# Start Cloudflare tunnel for Ollama
cloudflared tunnel run ollama-instanthpi

# Test Ollama connection
./test-ollama.sh

# Pull AI models
ollama pull llama3.1:8b
```

### Deployment Commands

```bash
# Automatic deployment
./deploy-automatic.sh

# Deploy to Netlify
./deploy.sh

# Deploy Supabase functions
npx supabase functions deploy
```

## Architecture Overview

### Core System Design

InstantHPI is a **comprehensive AI-powered medical platform** with de-identified patient system and multi-modal AI integration:

- **Patient Portal**: De-identified intake forms using 10-character alphanumeric IDs (e.g., A1B2C3D4E5)
- **Physician Portal**: Multi-clinic access with AI-assisted medical documentation
- **AI Processing**: Clinical transcription in French/English using multiple AI providers
- **Secure Storage**: Supabase PostgreSQL with Row Level Security (RLS)

### Technology Stack

- **Frontend**: React + TypeScript + Vite + Tailwind CSS + Radix UI
- **Backend**: Express.js + TypeScript
- **Database**: PostgreSQL via Supabase with Drizzle ORM
- **AI Integration**: OpenAI GPT-4o, Anthropic Claude 3.5 Sonnet, Local Ollama models
- **Authentication**: Supabase Auth (Email OTP + Google OAuth)
- **Payments**: Stripe subscriptions
- **Communication**: Spruce Health API integration

### Monorepo Structure

```
├── client/          # React frontend
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── pages/       # Route components
│   │   └── lib/         # Utilities and API clients
├── server/          # Express.js backend
│   ├── routes/      # API route handlers
│   ├── lib/         # Server utilities
│   └── utils/       # Helper functions
├── shared/          # Shared types and schema
└── supabase/        # Database schema and functions
```

## Key Features & Architecture

### Patient De-identification System

- **10-character alphanumeric patient IDs** (HIPAA compliant)
- No personal information in initial intake
- Secure data flow: Patient Form → Supabase → AI → Clinical Notes

### Multi-AI Provider Architecture

The system supports multiple AI providers with intelligent fallback:

1. **Primary**: Anthropic Claude 3.5 Sonnet (medical documentation)
2. **Secondary**: OpenAI GPT-4o (general AI tasks)
3. **Local**: Ollama (free, self-hosted LLMs via Cloudflare tunnel)
4. **Triage**: Specialized medical triage using Canadian Triage Acuity Scale (CTAS)

### Database Schema Highlights

- **Consultations**: Patient intake and clinical data
- **AI Processing Logs**: Complete AI command history
- **Messages**: Spruce Health API integration for patient communications
- **Pending Items**: Task tracking with priority AI learning
- **Preventative Care**: Billing optimization suggestions
- **Medications & Chronic Conditions**: Comprehensive patient management

### Real-time Communication

- **Spruce Health API**: Professional patient messaging
- **Multi-language Support**: French/English with automatic detection
- **AI Message Analysis**: Automatic medication refill detection
- **Priority Task Management**: AI learns physician behavior patterns

## Development Workflow

### Environment Setup

```bash
# Required environment variables
SUPABASE_URL=https://uoahrhroyqsqixusewwe.supabase.co
SUPABASE_ANON_KEY=[key from Supabase dashboard]
SUPABASE_SERVICE_KEY=[service key from Supabase dashboard]

# AI Provider Keys (use at least one)
OPENAI_API_KEY=[OpenAI key]
ANTHROPIC_API_KEY=[Anthropic key]
OLLAMA_URL=https://ollama.instanthpi.ca  # Permanent Cloudflare tunnel

# Communication APIs
SPRUCE_API_KEY=[Spruce Health API key]
SPRUCE_ACCESS_ID=[Spruce access ID]

# Payment Processing
STRIPE_SECRET_KEY=[Stripe secret key]
STRIPE_PUBLIC_KEY=[Stripe public key]
```

### Medical AI Integration Points

1. **Clinical Documentation Generation**: `/api/anthropic/generate-medical-documentation`
2. **AI Triage Processing**: `/api/ollama/triage` (CTAS-based medical urgency scoring)
3. **Medical Template Processing**: French/English medical report generation
4. **Medication Analysis**: AI-powered prescription and refill detection
5. **Priority Task Learning**: Behavioral pattern recognition for physicians

### Database Development

- **ORM**: Drizzle with type-safe schema in `shared/schema.ts`
- **Migrations**: Auto-generated from schema changes
- **Seeding**: Medical sample data with French/English patients
- **RLS**: Row-level security for multi-tenant clinic access

### AI Model Configuration

- **Ollama Models**: `llama3.1:8b` (4.6GB), accessible via permanent Cloudflare tunnel
- **Temperature Settings**: Low (0.1-0.3) for medical consistency
- **Context Windows**: Optimized for clinical documentation (4K+ tokens)
- **Streaming**: Disabled for medical accuracy validation

## Production Deployment

### Current Infrastructure

- **Database**: Supabase (live at uoahrhroyqsqixusewwe.supabase.co)
- **Frontend**: Netlify (instanthpi.ca)
- **AI Services**:
  - Cloudflare tunnel for Ollama (https://ollama.instanthpi.ca)
  - External APIs for OpenAI/Anthropic
- **Authentication**: Supabase Auth with Google OAuth

### Scaling Considerations

- **AI Rate Limiting**: Configured for medical usage patterns
- **Database Connection Pooling**: For high-volume clinical access
- **CDN**: Static asset optimization for medical forms
- **Monitoring**: Health checks for AI service availability

### Security & Compliance

- **HIPAA Ready**: De-identified patient system
- **PIPEDA Compliant**: Canadian privacy law compliance
- **Encryption**: TLS in transit, AES at rest
- **Audit Logging**: Complete AI processing history
- **Access Control**: Clinic-based role permissions

## Medical Specialization Notes

### Clinical Workflow Integration

- **HPI Generation**: Automated History of Present Illness from patient forms
- **SOAP Note Creation**: AI-generated clinical documentation
- **Differential Diagnosis**: AI-assisted diagnostic suggestions
- **Treatment Planning**: Automated care plan generation
- **Follow-up Scheduling**: Integrated appointment management

### French Medical Language Processing

- **Medical Terminology**: Specialized French medical vocabulary
- **Cultural Context**: Quebec healthcare system integration
- **Regulatory Compliance**: Canadian medical documentation standards
- **Romanization Support**: For non-French speakers

### AI Ethics in Medical Context

- **Human Oversight**: All AI-generated content requires physician approval
- **Confidence Scoring**: AI provides confidence levels for medical decisions
- **Audit Trail**: Complete record of AI-assisted clinical decisions
- **Fallback Protocols**: Manual override for all AI suggestions

## Troubleshooting

### Common Issues

1. **Blank Page on Login**: Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in environment
2. **AI Service Unavailable**: Verify Ollama server is running and tunnel is active
3. **Database Connection**: Confirm Supabase credentials and network connectivity
4. **Spruce API Errors**: Check API keys and rate limits

### Debug Commands

```bash
# Check Ollama status
curl https://ollama.instanthpi.ca/api/tags

# Verify environment variables
echo $VITE_SUPABASE_URL

# Run tests to verify setup
npm run test:run
```

This medical AI platform represents a Tier 4 automation system, providing the highest level of clinical workflow automation while maintaining strict medical compliance and human oversight requirements.
