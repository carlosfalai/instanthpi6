#!/bin/bash

echo "🤖 DEPLOYING OLLAMA LLAMA3:1.8B TO CLOUD (FREE)"
echo "==============================================="

# OPTION 1: FLY.IO (FREE TIER - BEST OPTION)
echo "Option 1: Deploy to Fly.io (FREE)"
echo "---------------------------------"

# Create Dockerfile for Ollama
cat > Dockerfile.ollama << 'EOF'
FROM ollama/ollama:latest

# Install the model at build time
RUN ollama pull llama3:1.8b

# Expose Ollama API port
EXPOSE 11434

# Start Ollama server
CMD ["serve"]
EOF

# Create fly.toml configuration
cat > fly.toml << 'EOF'
app = "instanthpi-ollama"
primary_region = "ord"

[build]
  dockerfile = "Dockerfile.ollama"

[env]
  OLLAMA_HOST = "0.0.0.0"

[[services]]
  internal_port = 11434
  protocol = "tcp"
  
  [[services.ports]]
    port = 443
    handlers = ["tls", "http"]
  
  [[services.ports]]
    port = 80
    handlers = ["http"]

[services.concurrency]
  hard_limit = 25
  soft_limit = 20

[[vm]]
  cpu_kind = "shared"
  cpus = 1
  memory_mb = 2048
EOF

echo "To deploy on Fly.io:"
echo "1. Install flyctl: curl -L https://fly.io/install.sh | sh"
echo "2. Run: fly auth signup (create free account)"
echo "3. Run: fly launch --no-deploy"
echo "4. Run: fly deploy"
echo "5. Your Ollama URL will be: https://instanthpi-ollama.fly.dev"
echo ""

# OPTION 2: GOOGLE COLAB (FREE GPU)
echo "Option 2: Google Colab (FREE GPU - 4-6 hours)"
echo "----------------------------------------------"

cat > colab_ollama.py << 'EOF'
# Run this in Google Colab for FREE GPU

!curl -fsSL https://ollama.ai/install.sh | sh

# Install localtunnel for public URL
!npm install -g localtunnel

# Start Ollama in background
import subprocess
import time

# Start Ollama server
ollama_process = subprocess.Popen(['ollama', 'serve'], 
                                  stdout=subprocess.PIPE, 
                                  stderr=subprocess.PIPE)

# Wait for server to start
time.sleep(5)

# Pull llama3:1.8b model
!ollama pull llama3:1.8b

# Expose to internet
!lt --port 11434 --subdomain instanthpi-ai

print("Your Ollama API is now available at:")
print("https://instanthpi-ai.loca.lt")
print("Use this URL in your app!")
EOF

echo "Colab notebook created: colab_ollama.py"
echo ""

# OPTION 3: RAILWAY WITH OLLAMA
echo "Option 3: Railway.app (EASIEST - $5 credit free)"
echo "-------------------------------------------------"

cat > railway-ollama.json << 'EOF'
{
  "name": "instanthpi-ollama",
  "description": "Ollama LLM for InstantHPI",
  "repository": "https://github.com/ollama/ollama",
  "branch": "main",
  "buildCommand": "curl -fsSL https://ollama.ai/install.sh | sh && ollama pull llama3:1.8b",
  "startCommand": "ollama serve --host 0.0.0.0",
  "envVars": {
    "OLLAMA_HOST": "0.0.0.0",
    "OLLAMA_MODELS": "/app/models"
  },
  "healthcheckPath": "/",
  "port": 11434
}
EOF

echo "Railway config created: railway-ollama.json"
echo "Deploy with: railway up"
echo ""

# OPTION 4: LOCAL + NGROK (IMMEDIATE)
echo "Option 4: Local + Ngrok (IMMEDIATE - Your laptop)"
echo "--------------------------------------------------"
echo "# On your laptop:"
echo "ollama serve"
echo "ollama run llama3:1.8b"
echo ""
echo "# In another terminal:"
echo "ngrok http 11434"
echo ""
echo "# Copy the ngrok URL and update your .env:"
echo "OLLAMA_URL=https://xxxxx.ngrok.io"
echo ""

# Update environment for cloud Ollama
cat > .env.ollama << 'EOF'
# Choose your Ollama deployment:

# Option 1: Fly.io (after deployment)
OLLAMA_URL=https://instanthpi-ollama.fly.dev

# Option 2: Google Colab
# OLLAMA_URL=https://instanthpi-ai.loca.lt

# Option 3: Railway
# OLLAMA_URL=https://instanthpi-ollama.railway.app

# Option 4: Local + Ngrok
# OLLAMA_URL=https://your-ngrok-url.ngrok.io

# Model to use
OLLAMA_MODEL=llama3:1.8b

# Fallback to OpenAI if Ollama fails
USE_OPENAI_FALLBACK=true
OPENAI_API_KEY=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
EOF

echo ""
echo "========================================="
echo "🎯 QUICKEST SOLUTION:"
echo "========================================="
echo "1. Use Railway (easiest): railway up"
echo "2. Use Fly.io (most reliable): fly deploy"
echo "3. Use Ngrok (immediate): ngrok http 11434"
echo ""
echo "Your llama3:1.8b model will be available via API!"
echo "========================================="