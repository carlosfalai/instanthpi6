# Quick Start: Run Locally

## 🚀 Fastest Way to Start

```bash
# 1. Install dependencies
npm install

# 2. Create .env file (see below for template)

# 3. Start development servers
./start-local.sh
```

## 📋 Step-by-Step Setup

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Create Environment File

Create a `.env` file in the root directory:

```env
# REQUIRED: Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# REQUIRED: Frontend Environment Variables
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Server Configuration
PORT=3000
NODE_ENV=development
```

**How to get Supabase credentials:**
1. Go to https://supabase.com
2. Sign up/login and create a project
3. Go to Project Settings → API
4. Copy the Project URL and anon key
5. Copy the service_role key (keep it secret!)

### Step 3: Set Up Database

Run the database migrations:

**Option A: Using Supabase CLI (Recommended)**
```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Push migrations
supabase db push
```

**Option B: Manual SQL Execution**
1. Go to Supabase Dashboard → SQL Editor
2. Run each migration file from `supabase/migrations/` in order
3. Start with `001_*.sql`, then `002_*.sql`, etc.

### Step 4: Start the Application

**Option A: Using the automated script (Recommended)**
```bash
chmod +x start-local.sh
./start-local.sh
```

**Option B: Manual start**
```bash
# Terminal 1: Backend
npm run dev

# Terminal 2: Frontend  
npx vite
```

### Step 5: Access the Application

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3000
- **Doctor Login:** http://localhost:5173/doctor-login
- **Patient Login:** http://localhost:5173/patient-login

## 🛑 Stopping the Servers

```bash
./stop-dev.sh
```

Or press `Ctrl+C` if running manually.

## ✅ Verify Everything Works

1. **Check servers are running:**
   ```bash
   curl http://localhost:3000/api/health
   # Should return some response
   ```

2. **Check frontend loads:**
   - Open http://localhost:5173
   - Should see the landing page

3. **Test Supabase connection:**
   ```bash
   npm run check:supabase
   ```

## 🔧 Troubleshooting

### Port Already in Use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Kill process on port 5173
lsof -ti:5173 | xargs kill -9
```

### Missing Environment Variables
- Check `.env` file exists in root directory
- Verify all required variables are set
- Frontend variables must start with `VITE_`

### Database Connection Issues
- Verify Supabase URL and keys are correct
- Check Supabase project is active
- Ensure migrations have been run

### Build Errors
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

## 📝 Next Steps

1. **Configure OAuth (Google Login):**
   - Supabase Dashboard → Authentication → Providers
   - Enable Google OAuth
   - Add redirect URL: `http://localhost:5173/auth/callback`

2. **Optional: Configure External Services:**
   - Spruce Health (patient messaging)
   - Twilio (SMS)
   - Stripe (payments)
   - OpenAI/Anthropic (AI features)

3. **Run Tests:**
   ```bash
   npm test
   ```

## 📚 Full Documentation

See `LOCAL_SETUP.md` for complete setup guide.

