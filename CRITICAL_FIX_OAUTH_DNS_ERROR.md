# 🚨 CRITICAL FIX: OAuth DNS Error

## Problem Identified

**Error:** `DNS_PROBE_FINISHED_NXDOMAIN`  
**URL:** `your-project-id.supabase.co/auth/v1/authorize...`  
**Root Cause:** `VITE_SUPABASE_URL` environment variable is missing or set to placeholder in Netlify

---

## ⚡ Quick Fix (5 minutes)

### Step 1: Set Environment Variables in Netlify

1. **Go to Netlify Dashboard:**
   - https://app.netlify.com/sites/instanthpi-medical/settings/deploys#environment-variables

2. **Add/Update these variables:**
   ```
   VITE_SUPABASE_URL = https://uoahrhroyqsqixusewwe.supabase.co
   VITE_SUPABASE_ANON_KEY = (your-anon-key-here)
   ```

3. **Get your Supabase Anon Key:**
   - Go to: https://supabase.com/dashboard/project/uoahrhroyqsqixusewwe/settings/api
   - Copy the "anon" / "public" key (starts with `eyJ...`)

### Step 2: Trigger New Deploy

1. In Netlify Dashboard → **Deploys** tab
2. Click **"Trigger deploy"** → **"Deploy site"**
3. Wait for build to complete (~2-3 minutes)

### Step 3: Test OAuth

1. Go to: https://instanthpi.ca/doctor-login
2. Click "Sign in with Google"
3. Should redirect to: `https://uoahrhroyqsqixusewwe.supabase.co/auth/v1/authorize...` ✅
4. Complete Google sign-in
5. Should redirect back successfully

---

## Verification

After deployment, check in browser console (F12) at https://instanthpi.ca:

```javascript
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
// Should show: https://uoahrhroyqsqixusewwe.supabase.co
// NOT: undefined or "your-project-id.supabase.co"
```

---

## Alternative: Use Demo Login (Temporary Workaround)

Until OAuth is fixed, you can use:
- **Email:** `doctor@instanthpi.ca`
- **Password:** `medical123`

This bypasses OAuth and works immediately.

---

## Why This Happened

The build process embeds environment variables at **build time**. If `VITE_SUPABASE_URL` is not set in Netlify's environment variables, the code falls back to a placeholder or undefined value, causing the OAuth redirect to fail.

**Important:** Environment variables must be set in Netlify **before** building, or you need to trigger a new deploy after setting them.

---

## Status

- [ ] Environment variables set in Netlify
- [ ] New deploy triggered
- [ ] OAuth tested and working
- [ ] Verified in browser console

---

**Last Updated:** January 8, 2026  
**Deploy ID:** 695fc0ca08579ccd1097cc64
