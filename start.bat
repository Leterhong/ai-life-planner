@echo off
echo ========================================
echo   AI Life Planner Agent - Startup
echo ========================================
echo.

echo [1/2] Starting Backend...
start "Backend" cmd /k "cd backend && python -m venv venv && venv\Scripts\activate && pip install -r requirements.txt && python main.py"

echo Waiting for backend to initialize (5 seconds)...
timeout /t 5 /nobreak > nul

echo.
echo [2/2] Starting Frontend...
start "Frontend" cmd /k "cd frontend && npm install && npm run dev"

echo.
echo ========================================
echo   Services started!
echo   Backend: http://localhost:8000
echo   Frontend: http://localhost:3000
echo ========================================
echo.
echo Please make sure to configure backend/.env with your SEED_API_KEY
pause
