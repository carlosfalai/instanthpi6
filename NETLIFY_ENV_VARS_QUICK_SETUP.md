# ⚡ Quick Setup: Netlify Environment Variables

## What You Need

1. **Supabase Anon Key** (get from dashboard)
2. **Netlify Dashboard access**

---

## 🚀 3-Minute Setup

### 1. Get Anon Key
- Go to: https://supabase.com/dashboard/project/uoahrhroyqsqixusewwe/settings/api
- Copy the **"anon public"** key (starts with `eyJ...`)

### 2. Set in Netlify
- Go to: https://app.netlify.com/sites/instanthpi-medical/settings/deploys#environment-variables
- Add:
  - `VITE_SUPABASE_URL` = `https://uoahrhroyqsqixusewwe.supabase.co`
  - `VITE_SUPABASE_ANON_KEY` = `(paste anon key)`

### 3. Deploy
- Go to: https://app.netlify.com/sites/instanthpi-medical/deploys
- Click **"Trigger deploy"**

### 4. Test
- Go to: https://instanthpi.ca/doctor-login
- Click "Sign in with Google"
- Should work! ✅

---

**Your Supabase Access Token:** `sbp_345ba068f41288ed4cf03eaaf434b8514d0deb9b`  
*(This is for API operations, not the anon key we need)*
