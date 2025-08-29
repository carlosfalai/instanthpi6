# 🚀 Cloudflare Tunnel Setup for Ollama

## Step-by-Step Instructions

### ✅ Step 1: Login to Cloudflare

```bash
cloudflared tunnel login
```

- This opens your browser
- Login to your Cloudflare account
- Select `instanthpi.ca` domain
- Click "Authorize"

### ✅ Step 2: Create the Tunnel

```bash
cloudflared tunnel create ollama-instanthpi
```

This will output something like:

```
Tunnel credentials written to /Users/carlosfavielfont/.cloudflared/a1b2c3d4-xxxx.json
Created tunnel ollama-instanthpi with id a1b2c3d4-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

**IMPORTANT**: Save that Tunnel ID! (the a1b2c3d4-xxxx part)

### ✅ Step 3: Create Config File

Create file at `~/.cloudflared/config.yml`:

```bash
mkdir -p ~/.cloudflared
nano ~/.cloudflared/config.yml
```

Paste this (replace YOUR_TUNNEL_ID with your actual ID):

```yaml
tunnel: YOUR_TUNNEL_ID
credentials-file: /Users/carlosfavielfont/.cloudflared/YOUR_TUNNEL_ID.json

ingress:
  - hostname: ollama.instanthpi.ca
    service: http://localhost:11434
    originRequest:
      noTLSVerify: true
  - service: http_status:404
```

### ✅ Step 4: Add DNS Record

```bash
cloudflared tunnel route dns ollama-instanthpi ollama.instanthpi.ca
```

Or manually in Cloudflare Dashboard:

1. Go to https://dash.cloudflare.com
2. Select `instanthpi.ca`
3. Go to DNS
4. Add record:
   - Type: `CNAME`
   - Name: `ollama`
   - Target: `YOUR_TUNNEL_ID.cfargotunnel.com`
   - Proxy: ON (orange cloud)

### ✅ Step 5: Run the Tunnel

```bash
cloudflared tunnel run ollama-instanthpi
```

### ✅ Step 6: Your Permanent URL

Your Ollama is now accessible at:

```
https://ollama.instanthpi.ca
```

## 🔄 Daily Usage

Every time you start your laptop:

```bash
# Terminal 1: Start Ollama
ollama serve

# Terminal 2: Start Cloudflare Tunnel
cloudflared tunnel run ollama-instanthpi
```

## 🎯 Test Your Setup

```bash
curl https://ollama.instanthpi.ca/api/tags
```

## ⚡ Make it Auto-Start (Optional)

```bash
# Auto-start tunnel on login
brew services start cloudflared

# Or with launchd
cloudflared service install
```

## 🔧 Troubleshooting

If tunnel doesn't work:

1. Check Ollama is running: `curl localhost:11434/api/tags`
2. Check tunnel status: `cloudflared tunnel list`
3. Check DNS: `nslookup ollama.instanthpi.ca`
4. Check logs: `cloudflared tunnel run ollama-instanthpi --loglevel debug`

---

**Your permanent URL will be: `https://ollama.instanthpi.ca`**

No more changing ngrok URLs! This is permanent and FREE!
