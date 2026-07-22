#!/bin/bash
# AI Life Planner Backend - Run script

export HTTP_PROXY=""
export HTTPS_PROXY=""
export http_proxy=""
export https_proxy=""
export NO_PROXY="*"
export no_proxy="*"

echo "========================================"
echo "  AI Life Planner Agent - Backend"
echo "========================================"
echo ""
echo "Starting server at http://localhost:8000"
echo "API Docs: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop"
echo "========================================"
echo ""

python main.py
