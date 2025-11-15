#!/bin/bash

# Comprehensive local development starter
# This script ensures all prerequisites are met and starts the application

set -e

echo "🚀 InstantHPI Local Development Setup"
echo "======================================"
echo ""

# Check Node.js version
echo "📋 Checking prerequisites..."
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo "❌ Node.js version 20+ required. Current: $(node -v)"
    exit 1
fi
echo "✅ Node.js $(node -v)"

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found!"
    echo "📝 Creating .env template..."
    cat > .env << 'EOF'
# Supabase Configuration (REQUIRED)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Frontend Environment Variables
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Server Configuration
PORT=3000
NODE_ENV=development

# Optional: AI Services
# OPENAI_API_KEY=your-openai-key-here
# ANTHROPIC_API_KEY=your-anthropic-key-here

# Optional: External Services
# SPRUCE_API_KEY=your-spruce-key-here
# SPRUCE_ACCESS_ID=your-spruce-access-id-here
# TWILIO_ACCOUNT_SID=your-twilio-sid
# TWILIO_AUTH_TOKEN=your-twilio-token
# STRIPE_SECRET_KEY=your-stripe-key
EOF
    echo "⚠️  Please edit .env file and add your Supabase credentials!"
    echo "   Then run this script again."
    exit 1
fi

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Check if required env vars are set
source .env 2>/dev/null || true
if [ -z "$SUPABASE_URL" ] || [ "$SUPABASE_URL" = "https://your-project.supabase.co" ]; then
    echo "⚠️  Warning: SUPABASE_URL not configured in .env"
    echo "   The app may not work correctly without Supabase configuration."
fi

# Kill any existing servers
echo "🧹 Cleaning up existing servers..."
pkill -f "tsx server/index.ts" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true
sleep 1

# Start backend server
echo ""
echo "🔧 Starting backend server on port 3000..."
NODE_ENV=development npx tsx server/index.ts > backend.log 2>&1 &
BACKEND_PID=$!
echo "$BACKEND_PID" > .backend.pid

# Wait for backend to start
echo "⏳ Waiting for backend to initialize..."
sleep 3

# Check if backend is running
if ! kill -0 $BACKEND_PID 2>/dev/null; then
    echo "❌ Backend failed to start. Check backend.log for errors."
    exit 1
fi

# Start frontend server
echo "🎨 Starting frontend server on port 5173..."
npx vite > frontend.log 2>&1 &
FRONTEND_PID=$!
echo "$FRONTEND_PID" > .frontend.pid

# Wait for frontend to start
sleep 2

# Check if frontend is running
if ! kill -0 $FRONTEND_PID 2>/dev/null; then
    echo "❌ Frontend failed to start. Check frontend.log for errors."
    kill $BACKEND_PID 2>/dev/null || true
    exit 1
fi

echo ""
echo "✅ Development servers started successfully!"
echo ""
echo "📍 URLs:"
echo "   Frontend:  http://localhost:5173"
echo "   Backend:   http://localhost:3000"
echo "   Doctor Login: http://localhost:5173/doctor-login"
echo ""
echo "📝 Logs:"
echo "   Backend:  tail -f backend.log"
echo "   Frontend: tail -f frontend.log"
echo ""
echo "🛑 To stop: ./stop-dev.sh or Ctrl+C"
echo ""
echo "💡 Tip: Run 'npm run check:supabase' to verify Supabase configuration"
echo ""

# Wait for user interrupt
trap "echo ''; echo '🛑 Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; rm -f .backend.pid .frontend.pid; exit 0" INT TERM

# Keep script running
wait

