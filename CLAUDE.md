# InstantHPI - Claude Development Guidelines

## CRITICAL RULES

### 1. LOCAL ONLY - NO DEPLOYMENT
- This app runs on localhost:3000 only
- NEVER deploy to Netlify, Vercel, or any hosting
- Keep credentials in .env as-is

### 2. SINGLE INTERFACE - COMMAND CENTER ONLY
- The ONLY user interface is the 5-panel Command Center at `/command-center`
- DO NOT create new dashboard pages
- DO NOT work on old dashboard layouts
- All routes should redirect to Command Center after login

### 3. The 5 Panels
1. **Inbox** - Spruce Health patient conversations
2. **History** - Selected patient's message thread
3. **Queue** - Staging queue (60s auto-send countdown)
4. **AI** - Claude-powered documentation generation
5. **Templates** - Medical document templates (SOAP, referrals, etc.)

## Development Mode: GSD (Get Shit Done)

### DO:
- Fix bugs without asking
- Run tests after changes (`npm test`)
- Run build to verify (`npm run build`)
- Debug autonomously
- Check `.auto-claude/ideation/ideation.json` for next tasks
- Update `task_plan.md` with progress

### DON'T:
- Stop to ask "should I do X?"
- Wait for confirmation to fix obvious bugs
- Create new dashboard pages
- Deploy anywhere
- Modify credentials

## Auto-Claude System

### Finding Work
1. Check `.auto-claude/ideation/ideation.json` for ideas
2. Check `.auto-claude/specs/` for active specs
3. Check `task_plan.md` for next actions

### Categories in ideation.json
- `code` (cq-XXX) - Code quality
- `uiux` (uiux-XXX) - UI/UX improvements
- `security` (sec-XXX) - Security fixes
- `docs` (doc-XXX) - Documentation
- `perf` (perf-XXX) - Performance

### Creating Specs
For multi-step work, create spec folder:
```
.auto-claude/specs/XXX-description/
  - spec.md (the task)
  - progress.md (track progress)
```

## Commands

```bash
# Start dev server
npm run dev

# Run tests
npm test

# Build
npm run build

# Type check
npx tsc --noEmit
```

## Tech Stack
- Frontend: React + Vite + Tailwind + shadcn/ui
- Backend: Express + TypeScript
- Database: Supabase (PostgreSQL)
- Auth: Supabase Auth (Google OAuth)
- AI: Claude (Anthropic) + GPT-4 (OpenAI)
- Messaging: Spruce Health API

## File Structure
```
client/src/
  pages/
    command-center.tsx  ← THE MAIN UI
    login-page.tsx
    auth-callback.tsx
  components/
    command-center/     ← Panel components
    layout/
      ModernLayout.tsx  ← App wrapper
server/
  routes/              ← API endpoints
  middleware/
    auth.ts            ← Authentication
```

## DO NOT TOUCH
- `.env` credentials (keep as-is)
- Netlify config (deleted, don't recreate)
- Any deployment configs
