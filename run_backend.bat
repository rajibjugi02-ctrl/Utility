@echo off
title GlassHub Utility - Backend Server
cd /d "%~dp0backend"
echo [GlassHub] Starting FastAPI backend on http://localhost:8000 ...
.\venv\Scripts\uvicorn main:app --host 0.0.0.0 --port 8000 --reload
pause
