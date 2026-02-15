@echo off
cd /d "%~dp0"
echo Starting Meu Amiguito Development Server...
echo Bypassing npm run dev issues by invoking vite directly with node.
echo Access the app at http://localhost:8080
node node_modules/vite/bin/vite.js
pause
