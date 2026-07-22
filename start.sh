#!/bin/bash

echo "========================================"
echo "  AI Life Planner Agent - Startup"
echo "========================================"
echo ""

# Start backend
echo "[1/2] Starting Backend..."
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload &
BACKEND_PID=$!
cd ..

sleep 3

# Start frontend
echo ""
echo "[2/2] Starting Frontend..."
cd frontend
npm install
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "========================================"
echo "  Services started!"
echo "  Backend: http://localhost:8000"
echo "  Frontend: http://localhost:3000"
echo "========================================"
echo ""
echo "Please make sure to configure backend/.env with your SEED_API_KEY"
echo ""
echo "Press Ctrl+C to stop all services"

wait
