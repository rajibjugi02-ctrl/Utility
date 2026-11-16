@echo off
title GlassHub Utility - Frontend Next.js
cd /d "%~dp0frontend"
echo [GlassHub] Starting Next.js frontend on http://localhost:3000 ...
npm run dev
pause
