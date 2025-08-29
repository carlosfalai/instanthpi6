# InstantHPI Project Story - Progress Tracking

## Session: Aug 24, 2025 - Complete Medical Platform Setup

### 1. Initial Setup

- Created medical platform with patient intake, physician dashboard
- Set up Supabase cloud database (instanthpi-secure project)
- Configured authentication with Email OTP and Google OAuth
- Created de-identified patient ID system (10-char alphanumeric)

### 2. Database Schema Created

- patients, consultations, physicians, clinics tables
- Interconsultation system for specialist referrals
- Row Level Security policies
- Stripe subscription tables

### 3. Deployment to Netlify

- Deployed to instanthpi-medical.netlify.app
- Configured custom domain instanthpi.ca
- Set up DNS with Netlify nameservers (p09.nsone.net)

### 4. Ollama AI Integration (FREE LLM)

- Started with ngrok tunnel (temporary URL)
- User had ngrok URL: https://6d7ea46fbf20.ngrok-free.app
- Realized ngrok changes URLs daily - not good

### 5. Cloudflare Tunnel Setup (PERMANENT)

- Installed cloudflared
- Added instanthpi.ca to Cloudflare account (info@centremedicalfont.ca)
- Created tunnel: ollama-instanthpi (ID: 08e7bdbf-f9f4-472c-bda9-dedadf8caec5)
- Set up DNS: ollama.instanthpi.ca → tunnel
- Permanent URL: https://ollama.instanthpi.ca

### 6. Model Configuration

- Started with gpt-oss:120b (120GB - too big!)
- Switched to llama3.1:8b (4.6GB - much better)
- Removed phi3:medium (freed 14GB)
- Total freed: 134GB disk space

### 7. Current Issue

- Site loads blank at instanthpi.ca/login
- Fixed by setting Netlify environment variables:
  - VITE_SUPABASE_URL
  - VITE_SUPABASE_ANON_KEY
  - VITE_API_URL
- Need to rebuild with env vars

### 8. API Keys & Credentials

- Cloudflare Global API: 76dd8dade6a6ab47d3a23aa32e4c2a57741f2
- Cloudflare Token: d41kEWEXRDL7M1QKu8K8w1po5H--tPib7iS3xSwx
- Netlify Token: nfp_MHncB8Hr3wj4T2mrbFRDoNjbcB1W9SPve0b1
- Supabase Project: uoahrhroyqsqixusewwe

### 9. What Works Now

- ✅ Ollama running locally with llama3.1:8b
- ✅ Cloudflare tunnel created
- ✅ DNS configured
- ✅ App deployed to Netlify
- ⏳ Fixing blank page issue

### 10. Fixed Environment Variables

- Added VITE_SUPABASE_URL to Netlify
- Added VITE_SUPABASE_ANON_KEY to Netlify
- Added VITE_API_URL to Netlify
- Redeployed with env vars set

### 11. Current Status - DEBUGGING BLANK PAGE

- Site deployed at https://instanthpi.ca
- Login page showing blank - investigating
- Added title tag to HTML
- Found issue: Server missing Supabase env vars
- Need to add SUPABASE_URL and keys to .env file
- Cloudflare tunnel needs to be started: cloudflared tunnel run ollama-instanthpi

### 12. What's Wrong

- The React app isn't rendering at instanthpi.ca/login
- Server crashes locally due to missing Supabase URL in env
- Need to update .env file with Supabase credentials

## Commands to Remember

```bash
# Start Ollama
ollama serve

# Start Cloudflare Tunnel
cloudflared tunnel run ollama-instanthpi

# Test Ollama
./test-ollama.sh
```

## URLs

- Live Site: https://instanthpi.ca
- Ollama API: https://ollama.instanthpi.ca
- Netlify: https://instanthpi-medical.netlify.app
