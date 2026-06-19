#!/bin/bash
# Start both backend and frontend for local development

echo "Starting ClearSignal dev servers..."

# Backend
cd backend
PYTHON=$(ls ../.venv/Scripts/python.exe 2>/dev/null || ls ../.venv/bin/python 2>/dev/null || echo python)
$PYTHON -m uvicorn app.main:app --reload --port 8000 &
BACKEND_PID=$!
cd ..

# Frontend
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "Backend:  http://localhost:8000"
echo "Frontend: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop both servers"

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT
wait
