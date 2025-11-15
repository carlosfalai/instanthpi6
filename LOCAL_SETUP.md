# Local Development Setup Guide

## Prerequisites

1. **Node.js** (v20 or higher)
   ```bash
   node --version  # Should be v20+
   ```

2. **npm** or **yarn**
   ```bash
   npm --version
   ```

3. **Supabase Account** (for database and auth)
   - Sign up at https://supabase.com
   - Create a new project
   - Get your project URL and anon key

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Create a `.env` file in the root directory:

```bash
# Supabase Configuration (REQUIRED)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Frontend Environment Variables (for Vite)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Server Configuration
PORT=3000
NODE_ENV=development

# Optional: AI Services (if using AI features)
OPENAI_API_KEY=your-openai-key-here
ANTHROPIC_API_KEY=your-anthropic-key-here

# Optional: External Services
SPRUCE_API_KEY=your-spruce-key-here
SPRUCE_ACCESS_ID=your-spruce-access-id-here
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
STRIPE_SECRET_KEY=your-stripe-key
```

### 3. Set Up Supabase Database

Run migrations to set up your database schema:

```bash
# Make sure you have Supabase CLI installed
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

Or manually run SQL migrations from `supabase/migrations/` in your Supabase dashboard.

### 4. Start Development Servers

**Option A: Using the provided script (Recommended)**
```bash
chmod +x start-dev.sh
./start-dev.sh
```

**Option B: Manual start**
```bash
# Terminal 1: Start backend server
npm run dev

# Terminal 2: Start frontend server
npx vite
```

**Option C: Using npm scripts**
```bash
# Start both servers (if configured)
npm run dev:all
```

### 5. Access the Application

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3000
- **Doctor Login:** http://localhost:5173/doctor-login

## Stopping Servers

```bash
chmod +x stop-dev.sh
./stop-dev.sh
```

Or manually:
```bash
# Find and kill processes
pkill -f "tsx server/index.ts"
pkill -f "vite"
```

## Project Structure

```
├── client/              # Frontend React application
│   └── src/
│       ├── pages/      # Page components
│       ├── components/ # Reusable components
│       └── lib/        # Utilities and configs
├── server/              # Backend Express server
│   ├── routes/         # API routes
│   ├── services/      # Business logic
│   └── index.ts       # Entry point
├── supabase/
│   └── migrations/    # Database migrations
└── netlify/
    └── functions/     # Netlify serverless functions
```

## Development Tips

### Viewing Logs

```bash
# Backend logs
tail -f backend.log

# Frontend logs
tail -f frontend.log

# Both in one terminal
tail -f backend.log frontend.log
```

### Database Access

1. **Supabase Dashboard:** https://supabase.com/dashboard
2. **Local Supabase (if using CLI):**
   ```bash
   supabase start
   supabase status
   ```

### Common Issues

1. **Port already in use:**
   ```bash
   # Kill process on port 3000
   lsof -ti:3000 | xargs kill -9
   
   # Kill process on port 5173
   lsof -ti:5173 | xargs kill -9
   ```

2. **Missing environment variables:**
   - Make sure `.env` file exists in root directory
   - Check that all required variables are set

3. **Database connection issues:**
   - Verify Supabase URL and keys are correct
   - Check Supabase project is active
   - Ensure migrations have been run

4. **Build errors:**
   ```bash
   # Clear node_modules and reinstall
   rm -rf node_modules package-lock.json
   npm install
   ```

## Next Steps

1. **Set up OAuth** (Google login):
   - Configure OAuth in Supabase Dashboard
   - Add redirect URLs: `http://localhost:5173/auth/callback`

2. **Configure External Services:**
   - Spruce Health (for patient messaging)
   - Twilio (for SMS)
   - Stripe (for payments)
   - OpenAI/Anthropic (for AI features)

3. **Run Tests:**
   ```bash
   npm test
   ```

4. **Build for Production:**
   ```bash
   npm run build
   npm start
   ```

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `SUPABASE_URL` | Yes | Your Supabase project URL |
| `SUPABASE_ANON_KEY` | Yes | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key |
| `VITE_SUPABASE_URL` | Yes | Same as SUPABASE_URL (for frontend) |
| `VITE_SUPABASE_ANON_KEY` | Yes | Same as SUPABASE_ANON_KEY (for frontend) |
| `PORT` | No | Backend server port (default: 3000) |
| `OPENAI_API_KEY` | No | For AI features |
| `ANTHROPIC_API_KEY` | No | For AI features |
| `SPRUCE_API_KEY` | No | For patient messaging |
| `TWILIO_ACCOUNT_SID` | No | For SMS features |
| `STRIPE_SECRET_KEY` | No | For payment features |

## Support

For issues or questions:
- Check logs: `backend.log` and `frontend.log`
- Review Supabase dashboard for database issues
- Check environment variables are set correctly

