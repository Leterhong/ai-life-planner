@echo off
echo ========================================
echo   AI Life Planner Agent - Dev Startup
echo ========================================
echo.

REM Clear proxy settings
set HTTP_PROXY=
set HTTPS_PROXY=
set http_proxy=
set https_proxy=
set NO_PROXY=*
set no_proxy=*

echo [1/2] Starting Backend Server...
echo.
start "AI Planner - Backend" cmd /k "cd /d %~dp0backend && python main.py"

echo Waiting for backend to start (5 seconds)...
timeout /t 5 /nobreak > nul

echo.
echo [2/2] Starting Frontend Dev Server...
echo.
start "AI Planner - Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ========================================
echo   Both servers are starting!
echo.
echo   Backend API:  http://localhost:8000
echo   API Docs:     http://localhost:8000/docs
echo   Frontend App: http://localhost:3000
echo.
echo   You can close this window now.
echo   Two separate terminal windows will open.
echo ========================================
echo.
pause
