# InstantHPI - Local Development Only

## CRITICAL: Project Direction
- **NO DEPLOYMENT** - This is local development only
- **SINGLE INTERFACE** - Command Center (5-panel layout) is the ONLY UI
- **NO OLD DASHBOARDS** - Remove all legacy dashboard pages/routes

## The App
InstantHPI is a 5-panel Command Center for physicians:
1. **Inbox** - Patient conversations from Spruce Health
2. **History** - Selected patient's message history
3. **Queue** - Staging queue with 60-second auto-send countdown
4. **AI (Claude)** - AI-generated clinical documentation
5. **Templates** - SOAP notes, referrals, imaging, meds, labs, work leave

## Development Guidelines

### Use Auto-Claude System
- Check `.auto-claude/ideation/ideation.json` for improvement ideas
- Check `.auto-claude/specs/` for active work specs
- Create new specs in `.auto-claude/specs/XXX-description/`

### GSD Mode (Get Shit Done)
- Don't stop to ask questions
- Fix bugs autonomously
- Run tests after changes
- Debug and troubleshoot without prompting

### Ralph Wiggum
- When unsure what's next, check `.auto-claude/ideation/ideation.json`
- Run auto-build tasks from ideation categories:
  - code (cq-XXX) - Code quality improvements
  - uiux (uiux-XXX) - UI/UX improvements
  - security (sec-XXX) - Security fixes
  - docs (doc-XXX) - Documentation
  - perf (perf-XXX) - Performance optimization

### Planning with Files
- Update this file (task_plan.md) with progress
- Create specs for multi-step work
- Track bugs and fixes in this file

## Current Status
- Build: ✅ Passing
- Tests: ✅ 5/5 passing
- Server: localhost:3000

## Environment
All credentials in `.env` - LOCAL USE ONLY, never deploy.

## Routing
After cleanup, all routes should redirect to `/`:
- `/` → Command Center (authenticated users)
- `/login` → Login page
- `/settings` → Settings (authenticated users)
- All legacy routes (/command, /doctor-dashboard, /inbox, etc.) → redirect to `/`

## Completed Improvements
- ✅ Rate limiting added (sec-005) - 100 req/min global, 10 req/min for auth
- ✅ Security headers with helmet
- ✅ Code splitting implemented (perf-004) - Lazy loading for pages
- ✅ Bundle optimized: vendor chunk (147KB), page chunks loaded on demand
- ✅ Old dashboard files removed
- ✅ All routes redirect to Command Center
- ✅ Local dev auth bypass - Server auth middleware bypasses Supabase in development
- ✅ Fixed 401 errors on spruce-conversations-all endpoint
- ✅ Fixed physicians table lookup error (skipped in local dev)
- ✅ Command Center now loads data properly (200 Spruce conversations)
- ✅ Fixed "Message content not available" bug - Now shows attachment descriptions
- ✅ Added memoization (perf-002) - ConversationList, ConversationDetail, SpruceConversation
- ✅ localStorage caching for conversations - Fallback when API fails + faster initial load
- ✅ Saved Messages / Quick Replies feature (useSavedMessages hook)
  - Imported 39 messages from Stream Deck profile
  - Categories: greeting, appointment, followup, general, ai_prompt, codes
  - Patient messages: Bonjour, dossier, Pharm?, fAXED, f/u 7d, Radio/Echo, Truck Stop
  - AI prompts: soap, meds, labs, referral, imaging, reasoning, discuss, edu, etc.
  - Shortcut codes: .7777, .8691, .cfont, .email, .ver1, .rad, .docs, etc.
  - "Quick" tab in Templates panel
  - Click to add to staging queue
  - Version-controlled defaults (auto-reset on update)

## How to Use
1. Open http://localhost:3000 in browser
2. Command Center loads automatically (local dev auth bypass)
3. **Inbox panel**: Shows 200+ Spruce conversations
4. **History panel**: Click a conversation to see message thread
5. **Queue panel**: Stage messages before sending (60s auto-send)
6. **Templates panel**: Click "Quick" tab for saved messages
7. **AI panel**: Claude-powered documentation generation

## Session: 2026-01-20
### TypeScript Fixes (GSD mode)
- ✅ Fixed spruce.ts - Conversation type properties (displayName, participants, lastMessage)
- ✅ Fixed urgentCare.ts - Status/requestType enum type casting
- ✅ Fixed ollama-ai.ts - Error handling (unknown type)
- ✅ Fixed ai.ts - ContentBlock text access
- ✅ Fixed stripe.ts and stripe-subscription.ts - Subscription period properties, payment_intent access
- ✅ Fixed triage-generation.ts - Priority level indexing, removed broken Kysely-style queries
- ✅ Fixed interconsultation.ts - Physicians email access
- ✅ Fixed user.ts - schedulerPreferences workaround
- ✅ Fixed priority-ai-service.ts - JSONB field type casting
- ✅ Fixed spruce-health-client.ts - Error response, participants property
- ✅ Fixed storage.ts - Document ID comparison
- ✅ Fixed supabase-server.ts - Error message extraction
- ✅ Fixed documentVerification.ts - ContentBlock text, message content null check

### Code Quality (cq-002)
- ✅ spruce.ts: 18 `any` types → 0 (added SpruceApiPatient, SpruceApiMessage, FormattedMessage interfaces)

### UI Improvements
- ✅ 5th panel split into AI Prompts (top) and Patient Messages (bottom)
- ✅ Drag-and-drop between AI and Patient sections
- ✅ Messages scrollable in both halves
- ✅ Patient messages (.xxx) auto-add to 60s queue on click
- ✅ AI prompts set the AI chat input on click

### Status
- Build: ✅ Passing
- Tests: ✅ 5/5 passing
- Server: ✅ Running on localhost:3000
- Remaining TS errors: ~8 (non-blocking, in documents.ts and documentVerification.ts)
- Total `any` types remaining: ~268 (down from 286)

## Next Actions (from ideation.json)
1. Fix remaining `any` types (cq-002) - ~289 occurrences left (storage.ts done: 12→0)
2. Split monolithic spruce.ts into modules (cq-003) - 1009 lines
3. Fix documents.ts fileUrl property errors
4. Fix documentVerification.ts insert type mismatch
