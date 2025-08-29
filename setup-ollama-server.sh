#!/bin/bash

echo "🤖 SETTING UP OLLAMA SERVER ON YOUR LAPTOP"
echo "==========================================="
echo ""

# Check if Ollama is installed
if ! command -v ollama &> /dev/null; then
    echo "📦 Installing Ollama..."
    curl -fsSL https://ollama.ai/install.sh | sh
else
    echo "✅ Ollama is already installed"
fi

# Start Ollama service
echo ""
echo "🚀 Starting Ollama service..."
ollama serve &
OLLAMA_PID=$!
echo "Ollama PID: $OLLAMA_PID"
sleep 5

# Pull the model if not already present
echo ""
echo "📥 Pulling llama3.2:1b model (smallest, fastest)..."
ollama pull llama3.2:1b

echo ""
echo "✅ Ollama is running on http://localhost:11434"
echo ""
echo "==========================================="
echo "🌐 SETTING UP NGROK TUNNEL"
echo "==========================================="
echo ""

# Check if ngrok is installed
if ! command -v ngrok &> /dev/null; then
    echo "📦 Installing ngrok..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        brew install ngrok/ngrok/ngrok
    else
        # Linux
        curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null
        echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | sudo tee /etc/apt/sources.list.d/ngrok.list
        sudo apt update && sudo apt install ngrok
    fi
else
    echo "✅ ngrok is already installed"
fi

# Start ngrok tunnel
echo ""
echo "🔧 Starting ngrok tunnel..."
echo "This will expose your Ollama server to the internet"
echo ""

# Kill any existing ngrok processes
pkill ngrok 2>/dev/null

# Start ngrok in background and capture the URL
ngrok http 11434 --log-level=info --log=stdout > /tmp/ngrok.log 2>&1 &
NGROK_PID=$!
echo "ngrok PID: $NGROK_PID"

# Wait for ngrok to start
sleep 5

# Get the public URL from ngrok
echo ""
echo "🔍 Getting public URL..."
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | python3 -c "import sys, json; print(json.load(sys.stdin)['tunnels'][0]['public_url'])" 2>/dev/null)

if [ -z "$NGROK_URL" ]; then
    echo "⚠️  Could not get ngrok URL automatically."
    echo "Please check http://localhost:4040 for your tunnel URL"
    echo ""
    echo "Manual setup:"
    echo "1. Open a new terminal"
    echo "2. Run: ngrok http 11434"
    echo "3. Copy the https URL (e.g., https://abc123.ngrok.io)"
else
    echo "✅ Your Ollama server is accessible at: $NGROK_URL"
    
    # Update environment file
    echo ""
    echo "📝 Updating environment configuration..."
    cat > .env.ollama << EOF
# Ollama Server Configuration
OLLAMA_URL=$NGROK_URL
OLLAMA_MODEL=llama3.2:1b

# Keep OpenAI as fallback
USE_OPENAI_FALLBACK=true
OPENAI_API_KEY=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
EOF
    
    echo "✅ Environment file created: .env.ollama"
fi

echo ""
echo "==========================================="
echo "📊 SERVER STATUS"
echo "==========================================="
echo ""
echo "Ollama Server:"
echo "  Local: http://localhost:11434"
echo "  Public: $NGROK_URL"
echo "  Model: llama3.2:1b"
echo "  PID: $OLLAMA_PID"
echo ""
echo "ngrok Tunnel:"
echo "  Status: http://localhost:4040"
echo "  PID: $NGROK_PID"
echo ""
echo "==========================================="
echo "⚠️  IMPORTANT NOTES:"
echo "==========================================="
echo ""
echo "1. Keep this terminal open to maintain the connection"
echo "2. Your laptop must stay on and connected to internet"
echo "3. The ngrok URL will change if you restart"
echo "4. Free ngrok has a 40 connections/minute limit"
echo ""
echo "To stop the server:"
echo "  kill $OLLAMA_PID $NGROK_PID"
echo ""
echo "To test the connection:"
echo "  curl $NGROK_URL/api/generate -d '{\"model\":\"llama3.2:1b\",\"prompt\":\"Hello\"}'"
echo ""
echo "==========================================="