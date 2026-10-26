@echo off
title V0id OS — Sovereign Workspace & 3D Launcher
chcp 65001 >nul
cd /d "C:\V0id\ui-launcher"

cls
echo =========================================================================
echo   🌑 V0ID OS — SISTEMA OPERACIONAL SOBERANO
echo =========================================================================
echo   Iniciando o servidor e abrindo a interface na Órbita 3D...
echo   URL: http://localhost:3000
echo.
echo   Pressione Ctrl+C para encerrar o servidor quando terminar.
echo =========================================================================
echo.

start "" cmd /c "timeout /t 2 /nobreak >nul & start http://localhost:3000"
npm run dev
