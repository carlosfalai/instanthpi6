#!/bin/bash

echo "🧪 TESTING OLLAMA SETUP"
echo "======================="
echo ""

# Test 1: Local Ollama
echo "1️⃣ Testing Local Ollama (localhost:11434)..."
LOCAL_TEST=$(curl -s http://localhost:11434/api/tags 2>/dev/null)
if [ ! -z "$LOCAL_TEST" ]; then
    echo "   ✅ Local Ollama is working"
else
    echo "   ❌ Local Ollama not responding"
fi
echo ""

# Test 2: Cloudflare Tunnel
echo "2️⃣ Testing Cloudflare Tunnel (ollama.instanthpi.ca)..."
TUNNEL_TEST=$(curl -s https://ollama.instanthpi.ca/api/tags 2>/dev/null)
if [ ! -z "$TUNNEL_TEST" ]; then
    echo "   ✅ Tunnel is working! URL is accessible"
else
    echo "   ⚠️  Tunnel not responding (make sure cloudflared tunnel is running)"
fi
echo ""

# Test 3: Generate text through tunnel
echo "3️⃣ Testing AI Generation through tunnel..."
echo "   Sending test prompt: 'Bonjour, dis juste ok si tu fonctionnes'"
RESPONSE=$(curl -s -X POST https://ollama.instanthpi.ca/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "model": "llama3.1:8b",
    "prompt": "Bonjour, dis juste ok si tu fonctionnes",
    "stream": false
  }' 2>/dev/null | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('response', 'No response')[:100])" 2>/dev/null)

if [ ! -z "$RESPONSE" ] && [ "$RESPONSE" != "No response" ]; then
    echo "   ✅ AI Generation working!"
    echo "   Response: $RESPONSE"
else
    echo "   ⚠️  AI Generation not working"
fi
echo ""

# Test 4: DNS Resolution
echo "4️⃣ Testing DNS Resolution..."
DNS_CHECK=$(nslookup ollama.instanthpi.ca 2>/dev/null | grep -A1 "Name:" | tail -1)
if [[ $DNS_CHECK == *"Address"* ]]; then
    echo "   ✅ DNS is resolving correctly"
    echo "   $DNS_CHECK"
else
    echo "   ⚠️  DNS not resolving yet (may take a few minutes)"
fi
echo ""

echo "======================="
echo "📊 SUMMARY:"
echo "======================="
echo ""
echo "If all tests pass:"
echo "✅ Your setup is complete!"
echo "🌐 Permanent URL: https://ollama.instanthpi.ca"
echo "📱 Your app at instanthpi.ca will use this URL"
echo ""
echo "If tunnel test fails:"
echo "➡️  Make sure to run: cloudflared tunnel run ollama-instanthpi"
echo "➡️  In a separate terminal and keep it running"
echo ""