#!/bin/bash

echo "🛑 Stopping development servers..."

# Kill backend
if [ -f .backend.pid ]; then
    BACKEND_PID=$(cat .backend.pid)
    kill $BACKEND_PID 2>/dev/null && echo "✓ Backend stopped (PID: $BACKEND_PID)"
    rm .backend.pid
fi

# Kill frontend
if [ -f .frontend.pid ]; then
    FRONTEND_PID=$(cat .frontend.pid)
    kill $FRONTEND_PID 2>/dev/null && echo "✓ Frontend stopped (PID: $FRONTEND_PID)"
    rm .frontend.pid
fi

# Clean up any remaining processes
pkill -f "tsx server/index.ts" 2>/dev/null
pkill -f "vite" 2>/dev/null

echo "✅ All servers stopped"
