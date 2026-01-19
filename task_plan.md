# Task Plan: InstantHPI Platform Development

## Goal
Build a production-ready medical consultation SaaS platform with Stripe payments, Supabase backend, and premium Obsidian Precision design.

## Active Skills
- **planning-with-files** - Manus-style persistent planning (this file)
- **stripe-integration** - Payment processing, subscriptions, webhooks
- **senior-frontend** - React/Next.js best practices, component scaffolding
- **frontend-testing** - Vitest + React Testing Library tests
- **applying-brand-guidelines** - Consistent branding (customized for InstantHPI)
- **frontend-design** - Premium UI/UX implementation

## Phases
- [x] Phase 1: Design System Overhaul - Obsidian Precision theme
- [x] Phase 2: Deploy to Netlify production
- [x] Phase 3: Stripe Integration - Payment processing setup
- [ ] Phase 4: Subscription management and billing
- [ ] Phase 5: Frontend testing suite
- [ ] Phase 6: Final polish and optimization

## Completed Work

### Design System (Phase 1) ✓
- Replaced neon cyan/purple with warm amber/gold accents
- Deep obsidian backgrounds (#0a0908)
- Outfit (display) + DM Sans (body) typography
- Glassmorphism with warm tones
- Files updated: design-system.css, index.css, landing.tsx, doctor-login.tsx, ModernLayout.tsx

### Deployment (Phase 2) ✓
- Live at: https://instanthpi.ca
- Committed to git: f233448
- Pushed to GitHub: main branch

### Stripe Integration (Phase 3) ✓
- Configured LIVE Stripe keys
- Created pricing page at /pricing with 3 tiers:
  - Débutant ($49/month) - Individual practitioners
  - Professionnel ($149/month) - Growing clinics
  - Entreprise ($399/month) - Large organizations
- Created Netlify functions:
  - stripe-create-checkout.js - Creates Stripe Checkout sessions
  - stripe-portal.js - Customer portal for subscription management
  - stripe-webhook.js - Handles Stripe webhook events
  - stripe-subscription-status.js - Check subscription status
- Added subscription success page at /subscription/success
- Deployed to production

## Current Configuration

### Environment
- **Supabase Project**: gbxksgxezbljwlnlpkpz
- **Netlify Site**: instanthpi-medical (bce155e1-901a-468e-ad6e-d8a0fe6aedbd)
- **Domain**: instanthpi.ca

### Stripe (LIVE)
- Account ID: acct_1RIw72FpJAvVCZQI
- Public Key: pk_live_51RIw72...
- Secret Key: sk_live_51RIw72... (in Netlify env vars)
- Webhook endpoint: https://instanthpi.ca/api/stripe/webhook

## Key Questions
1. ~~What subscription tiers are needed?~~ ✓ Implemented: Débutant, Professionnel, Entreprise
2. ~~What pricing model?~~ ✓ Implemented: Monthly with 20% annual discount option
3. What features should be gated by subscription tier?

## Decisions Made
- [Design]: Obsidian Precision theme with amber accents - luxury medical aesthetic
- [Auth]: Supabase Auth with Google OAuth
- [Hosting]: Netlify with serverless functions

## Errors Encountered
- **API Keys Invalid** (2026-01-19): Both Anthropic and OpenAI API keys are invalid/expired
  - ANTHROPIC_API_KEY: Placeholder value `sk-ant-placeholder-key-for-development`
  - OPENAI_API_KEY: Key is expired/revoked
  - **ACTION REQUIRED**: User must update .env with valid API keys for AI features to work

## Status
**Command Center Complete** - Unified communications hub deployed with integrated chat and AI modes.

## Recent Completed Work

### UX Consolidation (Latest)
- Created unified Command Center at `/command` route
- Consolidated inbox, messages, and patients pages into single interface
- Three-mode right panel: Details, Chat, AI
- Stream Deck style AI quick actions integrated
- Industrial/medical aesthetic with JetBrains Mono font
- Real-time Spruce conversation data
- Embedded messaging and AI generation

### Navigation Simplified
- Reduced main nav from 7 items to 5:
  - Dashboard, Command Center, Documents, AI Assistant, Settings
- Removed redundant Clients, Messages, Inbox links

## Current Work: Command Center Dynamic Panels

### Goal
Transform the 5-panel Command Center into a fully dynamic, customizable workspace.

### Phases

#### Phase 1: Foundation (DONE)
- [x] Install react-resizable-panels
- [x] Convert panels to resizable
- [x] Remove sidebar and title bar
- [x] Fix scroll containment

#### Phase 2: Drag & Drop Reordering (DONE)
- [x] Install @dnd-kit/core, @dnd-kit/sortable
- [x] Create usePanelLayout hook
- [x] Wrap panels in SortableContext
- [x] Implement handleDragEnd for reordering
- [x] Add visual drag handles (GripVertical icon)

#### Phase 3: Editable Panel Names (DONE)
- [x] Create EditableTitle component
- [x] Double-click to edit panel names
- [x] Save on blur/enter (via usePanelLayout hook)

#### Phase 4: Layout Persistence (DONE)
- [x] Save layout to localStorage (order, sizes, names)
- [x] Restore layout on mount
- [x] Add reset button (in Templates panel header)

### Current Status
All Dynamic Panel Phases Complete - Testing and deployment next

---

## Next Steps
1. Core workflow: Form storage and search by alphanumeric ID
2. Auto-generate documentation when form found using doctor's templates
3. Connect subscription status to user accounts in Supabase
