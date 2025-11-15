# Authentication Error Fix Guide

## Problem
You're seeing: **"Missing authorization code. Please restart the sign-in flow."**

This happens when Google OAuth redirects back but doesn't pass the authorization code.

## Quick Solution: Use Demo Login

Instead of clicking "Sign in with Google", use the demo credentials:

**Email:** `doctor@instanthpi.ca`  
**Password:** `medical123`

This bypasses OAuth and works immediately.

## Root Cause

The OAuth flow requires:
1. **Supabase environment variables** set in Netlify
2. **OAuth redirect URI** properly configured
3. **Google OAuth** enabled in Supabase

## Fix Steps

### 1. Check Browser Console (F12)
Open the browser console on the error page - you should see diagnostic logs like:
```
[AuthCallback] Supabase config loaded: {
  urlSet: false,  // ← This should be true
  keySet: false  // ← This should be true
}
```

### 2. Set Environment Variables in Netlify

Go to Netlify Dashboard → Your Site → Settings → Build & Deploy → Environment:

Add these variables:
```
VITE_SUPABASE_URL=https://uoahrhroyqsqixusewwe.supabase.co
VITE_SUPABASE_ANON_KEY=(your-anon-key-here)
```

### 3. Configure Supabase Redirect URI

In Supabase Dashboard → Authentication → URL Configuration:

Add to "Redirect URLs":
```
https://instanthpi.ca/auth/callback
```

### 4. Redeploy

After setting environment variables, trigger a new deploy in Netlify.

## Alternative: Use Demo Login

Until OAuth is fixed, you can always use:
- **Email:** `doctor@instanthpi.ca`
- **Password:** `medical123`

This works immediately and doesn't require OAuth configuration.

