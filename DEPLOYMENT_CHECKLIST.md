# Deployment Checklist - InstantHPI Google OAuth

## Current Issue
**Status:** ❌ Login fails with "Missing authorization code. Please restart the sign-in flow."
**Root Cause:** Supabase environment variables not properly configured in deployment

---

## Environment Variables Required

### For Frontend (Vite - Build Time)
These are **CRITICAL** for OAuth flow:

| Variable | Value | Where | Status |
|----------|-------|-------|--------|
| `VITE_SUPABASE_URL` | `https://uoahrhroyqsqixusewwe.supabase.co` | Netlify Deploy Settings | ❓ Check |
| `VITE_SUPABASE_ANON_KEY` | Your 128-char anon key | Netlify Deploy Settings | ❓ Check |

⚠️ **CRITICAL:** These MUST be set in Netlify Deploy settings as environment variables, not in `.env` files.

### For Backend/Server
| Variable | Value | Purpose |
|----------|-------|---------|
| `SUPABASE_URL` | `https://uoahrhroyqsqixusewwe.supabase.co` | Server API calls |
| `SUPABASE_SERVICE_KEY` | Service role key | Server-side operations |
| `SUPABASE_ANON_KEY` | Anon key | Client operations |

---

## Supabase Configuration

### 1. Google OAuth Provider
**Location:** Supabase Dashboard → Authentication → Providers → Google

```
✓ Enabled: YES
✓ Client ID: Set in Supabase (from Google Cloud Console)
✓ Client Secret: Set in Supabase (from Google Cloud Console)
```

### 2. Authorized Redirect URIs
**Location:** Supabase Dashboard → Authentication → URL Configuration

Allowed Redirect URLs must include:
```
https://instanthpi.ca/auth/callback
http://localhost:3000/auth/callback
https://localhost:3000/auth/callback
```

---

## Google Cloud Console Configuration

### OAuth 2.0 Client
**Location:** Google Cloud Console → APIs & Services → Credentials

```
Application Type: Web application
Name: InstantHPI Supabase

Authorized JavaScript Origins:
  - https://uoahrhroyqsqixusewwe.supabase.co
  - https://instanthpi.ca
  - http://localhost:3000

Authorized Redirect URIs:
  - https://uoahrhroyqsqixusewwe.supabase.co/auth/v1/callback
  - https://instanthpi.ca/auth/v1/callback
  - http://localhost:3000/auth/v1/callback
```

---

## Netlify Deployment Settings

### Steps to Configure:

1. **Go to Netlify Dashboard**
   - Select project: instanthpi-medical
   - Go to: Settings → Build & Deploy → Environment

2. **Add Environment Variables**
   ```
   VITE_SUPABASE_URL = https://uoahrhroyqsqixusewwe.supabase.co
   VITE_SUPABASE_ANON_KEY = (your 128-character anon key)
   ```

3. **Redeploy**
   - Trigger a new deploy to apply env vars
   - The build will now have these variables

---

## Testing Checklist

- [ ] Verify env vars in Netlify → Site settings → Build & Deploy → Environment
- [ ] Trigger redeploy: Netlify → Deploys → Trigger deploy
- [ ] Try Google login and check browser console (F12)
- [ ] Verify no "Missing VITE_SUPABASE_URL" errors in console
- [ ] Check auth-callback page receives `code` parameter in URL
- [ ] Verify email confirms in Supabase auth logs
- [ ] Test both demo login (doctor@instanthpi.ca) and Google OAuth

---

## Troubleshooting

### "Missing authorization code" Error
**Cause:** Supabase credentials not loaded
**Fix:**
1. Verify env vars in Netlify settings
2. Trigger new deploy
3. Check browser console for "urlSet: false" or "keySet: false"

### "Failed to exchange code" Error
**Cause:** Code exchange fails with Supabase
**Fix:**
1. Verify Google credentials in Supabase Dashboard
2. Verify redirect URIs match exactly
3. Check Supabase auth logs for errors

### User stuck on auth callback page
**Cause:** Code parameter present but exchange fails
**Fix:**
1. Check Supabase service status
2. Verify credentials are current
3. Check browser console for detailed errors

---

## Quick Diagnosis Script

Run in browser console at https://instanthpi.ca/auth/callback:
```javascript
// Check if we got here with a code
const url = new URL(window.location.href);
console.log('URL params:', Object.fromEntries(url.searchParams));
console.log('Has code:', !!url.searchParams.get('code'));
console.log('Has error:', !!url.searchParams.get('error'));
```

---

## Current Domain Status
- **Production:** https://instanthpi.ca
- **Supabase Project:** uoahrhroyqsqixusewwe
- **OAuth Callback:** https://instanthpi.ca/auth/callback
















