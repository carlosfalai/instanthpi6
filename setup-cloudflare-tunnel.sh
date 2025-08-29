#!/bin/bash

echo "🌐 Setting up Cloudflare Tunnel for Permanent Ollama Access"
echo "==========================================================="
echo ""

# Install cloudflared
echo "📦 Installing Cloudflare Tunnel..."
if ! command -v cloudflared &> /dev/null; then
    brew install cloudflare/cloudflare/cloudflared
else
    echo "✅ Cloudflared already installed"
fi

echo ""
echo "📝 Follow these steps:"
echo ""
echo "1. Login to Cloudflare:"
echo "   cloudflared tunnel login"
echo ""
echo "2. Create tunnel:"
echo "   cloudflared tunnel create ollama-instanthpi"
echo ""
echo "3. Note your Tunnel ID (looks like: a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p6)"
echo ""
echo "4. Create config file at ~/.cloudflared/config.yml:"
echo ""

cat << 'EOF'
# Copy this to ~/.cloudflared/config.yml
tunnel: YOUR_TUNNEL_ID_HERE
credentials-file: /Users/carlosfavielfont/.cloudflared/YOUR_TUNNEL_ID_HERE.json

ingress:
  - hostname: ollama.instanthpi.ca
    service: http://localhost:11434
    originRequest:
      noTLSVerify: true
  - service: http_status:404
EOF

echo ""
echo "5. Add DNS record in Cloudflare Dashboard:"
echo "   - Type: CNAME"
echo "   - Name: ollama"
echo "   - Target: YOUR_TUNNEL_ID.cfargotunnel.com"
echo ""
echo "6. Run the tunnel:"
echo "   cloudflared tunnel run ollama-instanthpi"
echo ""
echo "7. Your permanent URL will be:"
echo "   https://ollama.instanthpi.ca"
echo ""
echo "==========================================================="
echo "Benefits:"
echo "✅ Completely FREE"
echo "✅ Permanent subdomain"
echo "✅ No expiration"
echo "✅ Better performance than ngrok"
echo "✅ Works with your existing domain"
echo "==========================================================="