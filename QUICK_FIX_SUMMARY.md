# ⚡ Quick Fix Summary - OAuth DNS Error

## 🎯 The Problem

Testing revealed: **OAuth redirect is using placeholder URL** `your-project-id.supabase.co` instead of the real Supabase URL.

**Error:** `DNS_PROBE_FINISHED_NXDOMAIN`

---

## ✅ The Solution

**Set environment variables in Netlify and redeploy:**

1. **Netlify Dashboard** → Site Settings → Environment Variables
   - Add: `VITE_SUPABASE_URL = https://uoahrhroyqsqixusewwe.supabase.co`
   - Add: `VITE_SUPABASE_ANON_KEY = (your-anon-key)`

2. **Trigger new deploy** in Netlify

3. **Test OAuth** - should now work!

---

## 📋 Action Items

- [ ] Set `VITE_SUPABASE_URL` in Netlify environment variables
- [ ] Set `VITE_SUPABASE_ANON_KEY` in Netlify environment variables  
- [ ] Trigger new deploy in Netlify
- [ ] Test Google OAuth login
- [ ] Verify OAuth redirect uses correct Supabase URL

---

## 📝 Full Details

See: `CRITICAL_FIX_OAUTH_DNS_ERROR.md` for complete instructions.

---

**Status:** ⚠️ **BLOCKER** - OAuth not working until environment variables are set
