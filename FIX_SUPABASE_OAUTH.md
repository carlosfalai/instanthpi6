# Fix Supabase OAuth Configuration

## Quick Fix Steps

### Step 1: Set Environment Variables in Netlify

1. Go to **Netlify Dashboard**
   - URL: https://app.netlify.com
   - Select your site: `instanthpi-medical` (or your site name)

2. Navigate to **Site Settings**
   - Settings → Build & Deploy → Environment

3. Add these environment variables:

   ```
   VITE_SUPABASE_URL = https://uoahrhroyqsqixusewwe.supabase.co
   VITE_SUPABASE_ANON_KEY = (paste your anon key here)
   ```

4. **Get your Supabase credentials:**
   - Go to: https://supabase.com/dashboard/project/uoahrhroyqsqixusewwe/settings/api
   - Copy the "anon" / "public" key (the long one starting with `eyJ...`)
   - Copy the "Project URL" (should be `https://uoahrhroyqsqixusewwe.supabase.co`)

### Step 2: Configure Supabase Redirect URI

1. Go to **Supabase Dashboard**
   - URL: https://supabase.com/dashboard/project/uoahrhroyqsqixusewwe/auth/url-configuration

2. Under **Redirect URLs**, add:
   ```
   https://instanthpi.ca/auth/callback
   ```

3. Click **Save**

### Step 3: Verify Google OAuth is Enabled

1. Go to **Supabase Dashboard**
   - Authentication → Providers → Google

2. Ensure:
   - ✅ Google provider is **Enabled**
   - ✅ Client ID is set
   - ✅ Client Secret is set

### Step 4: Trigger New Deploy

1. In Netlify Dashboard, go to **Deploys**
2. Click **Trigger deploy** → **Deploy site**
3. Wait for build to complete

### Step 5: Test OAuth

1. Go to https://instanthpi.ca/doctor-login
2. Click "Sign in with Google"
3. Complete Google sign-in
4. Should redirect back and work!

## Verification Script

Run this locally to check your config:
```bash
npm run check:supabase
```

Or manually check in browser console at https://instanthpi.ca/auth/callback:
```javascript
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL ? 'SET' : 'MISSING');
console.log('Supabase Key:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'SET' : 'MISSING');
```

## Troubleshooting

### Still seeing "Missing authorization code"?

1. **Check browser console** (F12) - look for `[AuthCallback]` logs
2. **Verify environment variables** are set in Netlify (not just in code)
3. **Check redirect URI** matches exactly: `https://instanthpi.ca/auth/callback`
4. **Verify Google OAuth** is enabled in Supabase

### Environment variables not working?

- Make sure they're set in **Netlify Dashboard**, not just `.env` files
- Variables starting with `VITE_` are build-time only
- Must trigger a **new deploy** after adding variables

## Alternative: Use Demo Login

Until OAuth is fixed, you can use:
- **Email:** `doctor@instanthpi.ca`
- **Password:** `medical123`

This works immediately without OAuth configuration.

