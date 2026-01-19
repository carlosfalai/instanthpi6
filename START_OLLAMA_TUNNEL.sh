#!/bin/bash

echo "🚀 STARTING OLLAMA WITH CLOUDFLARE TUNNEL"
echo "=========================================="
echo ""
echo "Your permanent URL: https://ollama.instanthpi.ca"
echo ""

# Check if Ollama is running
if lsof -Pi :11434 -sTCP:LISTEN -t >/dev/null ; then
    echo "✅ Ollama is already running on port 11434"
else
    echo "🟡 Starting Ollama server..."
    ollama serve &
    OLLAMA_PID=$!
    echo "   Ollama PID: $OLLAMA_PID"
    sleep 3
fi

echo ""
echo "🌐 Starting Cloudflare Tunnel..."
echo "   Connecting ollama.instanthpi.ca to localhost:11434"
echo ""

# Run the tunnel
cloudflared tunnel run ollama-instanthpi

# Note: The tunnel runs in foreground. Press Ctrl+C to stop.