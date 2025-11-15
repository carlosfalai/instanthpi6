#!/bin/bash

# Simple one-command start script
# Starts both backend and frontend servers

echo "🚀 Starting InstantHPI locally..."
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    echo "   Please create .env file with your Supabase credentials."
    echo "   See QUICK_START.md for instructions."
    exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Kill any existing servers
pkill -f "tsx server/index.ts" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true
sleep 1

# Start backend
echo "🔧 Starting backend on port 3000..."
NODE_ENV=development npx tsx server/index.ts > backend.log 2>&1 &
BACKEND_PID=$!
echo "$BACKEND_PID" > .backend.pid

# Wait for backend
sleep 3

# Start frontend
echo "🎨 Starting frontend on port 5173..."
npx vite > frontend.log 2>&1 &
FRONTEND_PID=$!
echo "$FRONTEND_PID" > .frontend.pid

sleep 2

echo ""
echo "✅ Servers started!"
echo ""
echo "📍 Frontend: http://localhost:5173"
echo "📍 Backend:  http://localhost:3000"
echo ""
echo "📝 Logs: tail -f backend.log frontend.log"
echo "🛑 Stop: ./stop-dev.sh"
echo ""

# Keep running
wait $BACKEND_PID $FRONTEND_PID

