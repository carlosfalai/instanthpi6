# 🚀 Steps to Run Ollama on Your Laptop as AI Server

## Quick Start (3 Steps)

### Step 1: Install and Start Ollama

Open Terminal and run:

```bash
# Install Ollama (if not installed)
curl -fsSL https://ollama.ai/install.sh | sh

# Start Ollama server
ollama serve
```

Keep this terminal open!

### Step 2: Pull the Model

Open a NEW terminal and run:

```bash
# Pull the smallest, fastest model
ollama pull llama3.2:1b

# Test it works
ollama run llama3.2:1b "Hello"
```

### Step 3: Expose to Internet with ngrok

In another NEW terminal:

```bash
# Install ngrok (if not installed)
brew install ngrok/ngrok/ngrok

# Start tunnel to expose Ollama
ngrok http 11434
```

You'll see something like:

```
Forwarding https://abc123def.ngrok.app -> http://localhost:11434
```

## 🔧 Update Your Cloud App

Copy the ngrok URL (like `https://abc123def.ngrok.app`) and I'll update your app to use it.

## 📝 What's Running

You'll have 3 terminals open:

1. **Terminal 1**: Ollama server (`ollama serve`)
2. **Terminal 2**: Your regular terminal for commands
3. **Terminal 3**: ngrok tunnel (`ngrok http 11434`)

## ✅ Test Your Setup

```bash
# Test local Ollama
curl http://localhost:11434/api/generate -d '{
  "model": "llama3.2:1b",
  "prompt": "Hello"
}'

# Test through ngrok (replace with your URL)
curl https://abc123def.ngrok.app/api/generate -d '{
  "model": "llama3.2:1b",
  "prompt": "Hello"
}'
```

## ⚠️ Important Notes

1. **Keep all terminals open** - Closing them stops the server
2. **Your laptop must stay on** and connected to internet
3. **ngrok URL changes** when you restart (free tier)
4. **Free ngrok limit**: 40 connections/minute

## 🔄 Daily Startup

Each day when you want to use it:

```bash
# Terminal 1
ollama serve

# Terminal 3
ngrok http 11434

# Then give me the new ngrok URL to update
```

## 💡 Pro Tips

- Use `llama3.2:1b` for fastest responses
- Upgrade to `llama3.2:3b` for better quality
- Consider ngrok paid plan for stable URL
- Your laptop needs ~4GB RAM free

---

**Ready?** Start with Step 1 and let me know your ngrok URL!
