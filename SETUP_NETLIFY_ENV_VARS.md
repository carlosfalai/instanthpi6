# Setup Netlify Environment Variables - Step by Step

## 🎯 Goal
Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Netlify to fix OAuth login.

---

## Step 1: Get Your Supabase Anon Key

### Option A: From Supabase Dashboard (Recommended)

1. **Go to Supabase Dashboard:**
   - https://supabase.com/dashboard/project/uoahrhroyqsqixusewwe/settings/api

2. **Find the "Project API keys" section**

3. **Copy the "anon" / "public" key:**
   - It's a long string starting with `eyJ...`
   - It's usually labeled as "anon public" or "public anon key"
   - **DO NOT** copy the "service_role" key (that's secret!)

### Option B: Using Supabase CLI (if installed)

```bash
# If you have Supabase CLI installed
supabase projects api-keys --project-ref uoahrhroyqsqixusewwe
```

---

## Step 2: Set Environment Variables in Netlify

1. **Go to Netlify Dashboard:**
   - https://app.netlify.com/sites/instanthpi-medical/settings/deploys#environment-variables

2. **Click "Add a variable"** (or "Edit variables" if some exist)

3. **Add these two variables:**

   **Variable 1:**
   - **Key:** `VITE_SUPABASE_URL`
   - **Value:** `https://uoahrhroyqsqixusewwe.supabase.co`
   - **Scopes:** Production, Deploy Previews, Branch Deploys (check all)

   **Variable 2:**
   - **Key:** `VITE_SUPABASE_ANON_KEY`
   - **Value:** `(paste your anon key here - the one starting with eyJ...)`
   - **Scopes:** Production, Deploy Previews, Branch Deploys (check all)

4. **Click "Save"**

---

## Step 3: Trigger New Deploy

1. **Go to Deploys tab:**
   - https://app.netlify.com/sites/instanthpi-medical/deploys

2. **Click "Trigger deploy"** → **"Deploy site"**

3. **Wait for build to complete** (~2-3 minutes)

---

## Step 4: Verify It Works

1. **Go to:** https://instanthpi.ca/doctor-login

2. **Open browser console** (F12)

3. **Run this in console:**
   ```javascript
   console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
   console.log('Supabase Key:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'SET' : 'MISSING');
   ```

4. **Expected output:**
   ```
   Supabase URL: https://uoahrhroyqsqixusewwe.supabase.co
   Supabase Key: SET
   ```

5. **Test OAuth:**
   - Click "Sign in with Google"
   - Should redirect to: `https://uoahrhroyqsqixusewwe.supabase.co/auth/v1/authorize...` ✅
   - Complete Google sign-in
   - Should redirect back successfully

---

## Quick Reference

### Supabase Project Info
- **Project URL:** https://uoahrhroyqsqixusewwe.supabase.co
- **Project Ref:** `uoahrhroyqsqixusewwe`
- **API Settings:** https://supabase.com/dashboard/project/uoahrhroyqsqixusewwe/settings/api

### Netlify Site Info
- **Site Name:** instanthpi-medical
- **Environment Variables:** https://app.netlify.com/sites/instanthpi-medical/settings/deploys#environment-variables
- **Deploys:** https://app.netlify.com/sites/instanthpi-medical/deploys

---

## Troubleshooting

### "Still seeing placeholder URL?"
- Make sure you triggered a **new deploy** after setting environment variables
- Environment variables are embedded at **build time**, not runtime
- Check that variables are set for "Production" scope

### "Can't find anon key in dashboard?"
- Look for "Project API keys" section
- The anon key is usually the first one listed
- It's safe to share (it's public), unlike the service_role key

### "OAuth still not working?"
- Verify redirect URI is set in Supabase: https://instanthpi.ca/auth/callback
- Check Supabase Dashboard → Authentication → URL Configuration
- Verify Google OAuth is enabled in Supabase

---

## Your Supabase Access Token

You provided: `sbp_345ba068f41288ed4cf03eaaf434b8514d0deb9b`

This is a **personal access token** (useful for API operations), but for the frontend OAuth fix, you need the **anon key** from the dashboard.

---

**Status:** ⚠️ **Waiting for environment variables to be set in Netlify**
