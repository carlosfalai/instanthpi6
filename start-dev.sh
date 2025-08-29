#!/bin/bash

# Start backend server
echo "🚀 Starting backend server on port 3000..."
NODE_ENV=development npx tsx server/index.ts > backend.log 2>&1 &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"

# Wait for backend to start
sleep 3

# Start frontend server
echo "🎨 Starting frontend server on port 5173..."
npx vite > frontend.log 2>&1 &
FRONTEND_PID=$!
echo "Frontend PID: $FRONTEND_PID"

# Save PIDs to file for later cleanup
echo "$BACKEND_PID" > .backend.pid
echo "$FRONTEND_PID" > .frontend.pid

echo "✅ Development servers started!"
echo "📍 Frontend: http://localhost:5173"
echo "📍 Backend API: http://localhost:3000"
echo ""
echo "📝 Logs:"
echo "   Backend: tail -f backend.log"
echo "   Frontend: tail -f frontend.log"
echo ""
echo "🛑 To stop: ./stop-dev.sh"
