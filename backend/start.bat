@echo off
chcp 65001 >nul
set HTTP_PROXY=
set HTTPS_PROXY=
set http_proxy=
set https_proxy=
set NO_PROXY=*
set no_proxy=*

echo ========================================
echo   AI Life Planner Agent - Backend
echo ========================================
echo.

REM Check if port 8000 is in use and kill the process
echo Checking port 8000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8000 ^| findstr LISTENING') do (
    echo Killing existing process on port 8000 (PID: %%a^)
    taskkill /F /PID %%a >nul 2>&1
)
timeout /t 1 /nobreak >nul

echo Starting server...
echo.
echo   Server:     http://localhost:8000
echo   API Docs:   http://localhost:8000/docs
echo.
echo   Press Ctrl+C to stop
echo ========================================
echo.

python run_server.py

pause
