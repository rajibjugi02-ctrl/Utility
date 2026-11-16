@echo off
title GlassHub Utility - Launch All
echo [GlassHub] Starting Backend and Frontend services...
start "GlassHub Backend" cmd /k "run_backend.bat"
timeout /t 2 /nobreak >nul
start "GlassHub Frontend" cmd /k "run_frontend.bat"
echo [GlassHub] Services launched!
echo - Frontend: http://localhost:3000
echo - Backend API: http://localhost:8000
echo - Swagger Docs: http://localhost:8000/docs
pause
