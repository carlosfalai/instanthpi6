# 🔒 Permanent ngrok Address Options

## Option 1: ngrok Static Domain (RECOMMENDED)

**Cost: $8/month** - Best value for permanent address

### Steps to Set Up:

1. **Sign up for ngrok account** (you already have: cff@centremedicalfont.ca)

   ```bash
   ngrok config add-authtoken YOUR_AUTH_TOKEN
   ```

2. **Subscribe to Personal Plan ($8/month)**
   - Go to: https://dashboard.ngrok.com/billing/subscription
   - Choose "Personal" plan
   - Includes 1 static domain

3. **Create Static Domain**
   - Go to: https://dashboard.ngrok.com/cloud-edge/domains
   - Click "Create Domain"
   - You'll get something like: `instanthpi.ngrok.app`

4. **Start ngrok with your domain**

   ```bash
   ngrok http 11434 --domain=instanthpi.ngrok.app
   ```

5. **Update your app**
   ```bash
   # Update .env.production
   OLLAMA_URL=https://instanthpi.ngrok.app
   ```

---

## Option 2: Cloudflare Tunnel (FREE)

**Cost: $0** - Completely free but requires more setup

### Steps:

1. **Install Cloudflare Tunnel**

   ```bash
   brew install cloudflare/cloudflare/cloudflared
   ```

2. **Login to Cloudflare**

   ```bash
   cloudflared tunnel login
   ```

3. **Create tunnel**

   ```bash
   cloudflared tunnel create ollama-server
   ```

4. **Configure tunnel** - Create `~/.cloudflared/config.yml`:

   ```yaml
   tunnel: YOUR_TUNNEL_ID
   credentials-file: /Users/carlosfavielfont/.cloudflared/YOUR_TUNNEL_ID.json

   ingress:
     - hostname: ollama.instanthpi.ca
       service: http://localhost:11434
     - service: http_status:404
   ```

5. **Add DNS record in Cloudflare**
   - Add CNAME: `ollama.instanthpi.ca` → `YOUR_TUNNEL_ID.cfargotunnel.com`

6. **Run tunnel**

   ```bash
   cloudflared tunnel run ollama-server
   ```

7. **Your permanent URL**: `https://ollama.instanthpi.ca`

---

## Option 3: LocalTunnel (FREE but less reliable)

**Cost: $0** - Free but may have downtime

### Steps:

1. **Install localtunnel**

   ```bash
   npm install -g localtunnel
   ```

2. **Run with subdomain**

   ```bash
   lt --port 11434 --subdomain instanthpi-ollama
   ```

3. **Your URL**: `https://instanthpi-ollama.loca.lt`

---

## Option 4: Self-Hosted with Port Forwarding

**Cost: $0** - Use your home internet

### Steps:

1. **Get your public IP**

   ```bash
   curl ifconfig.me
   ```

2. **Port forward on router**
   - Forward port 11434 to your laptop's local IP
   - Router settings: 192.168.1.1 or 10.0.0.1

3. **Use Dynamic DNS** (if IP changes)
   - Use no-ip.com or duckdns.org (free)
   - Get domain like: `instanthpi.duckdns.org`

4. **Your URL**: `http://YOUR_PUBLIC_IP:11434` or `https://instanthpi.duckdns.org:11434`

---

## 🎯 QUICKEST SOLUTION:

### For ngrok Static Domain ($8/month):

1. Go to: https://dashboard.ngrok.com/billing/subscription
2. Subscribe to Personal plan
3. Create domain at: https://dashboard.ngrok.com/cloud-edge/domains
4. Run: `ngrok http 11434 --domain=YOUR_STATIC_DOMAIN`

### For Cloudflare (FREE):

1. Already have instanthpi.ca on Cloudflare? Perfect!
2. Just add subdomain `ollama.instanthpi.ca`
3. Use Cloudflare Tunnel (instructions above)

---

## Which Should You Choose?

| Option                | Cost  | Reliability | Setup Time | Best For          |
| --------------------- | ----- | ----------- | ---------- | ----------------- |
| **ngrok Static**      | $8/mo | ⭐⭐⭐⭐⭐  | 5 min      | Production use    |
| **Cloudflare Tunnel** | FREE  | ⭐⭐⭐⭐⭐  | 20 min     | If you own domain |
| **LocalTunnel**       | FREE  | ⭐⭐        | 2 min      | Testing only      |
| **Port Forward**      | FREE  | ⭐⭐⭐      | 15 min     | Home server       |

**Recommendation**: Since you have instanthpi.ca, use **Cloudflare Tunnel** for FREE permanent address!
