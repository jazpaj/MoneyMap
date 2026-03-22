#!/bin/bash
# Finance Tracker - Start Script
# Starts both backend and frontend servers

DIR="$(cd "$(dirname "$0")" && pwd)"

echo "================================"
echo "  Finance Tracker"
echo "================================"
echo ""

# Start backend
echo "[1/2] Starting backend (FastAPI) on port 8000..."
cd "$DIR/backend"
source venv/bin/activate
uvicorn main:app --reload --port 8000 &
BACKEND_PID=$!

# Start frontend
echo "[2/2] Starting frontend (Vite) on port 5173..."
cd "$DIR/frontend"
npm run dev &
FRONTEND_PID=$!

echo ""
echo "Backend:  http://localhost:8000"
echo "Frontend: http://localhost:5173"
echo "API Docs: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop both servers."

# Cleanup on exit
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM
wait
