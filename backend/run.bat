@echo off
REM AI Life Planner Backend - Run script
REM This script disables proxy and starts the server

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
echo Starting server at http://localhost:8000
echo API Docs: http://localhost:8000/docs
echo.
echo Press Ctrl+C to stop
echo ========================================
echo.

python run_server.py

pause
