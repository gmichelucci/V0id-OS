@echo off
title V0id OS - Sovereign Workspace and 3D Launcher
cd /d "C:\V0id\ui-launcher"

rem Check if port 3000 is already active
netstat -ano | findstr :3000 | findstr LISTENING >nul
if %errorlevel% equ 0 (
    echo =========================================================================
    echo   V0ID OS - SISTEMA OPERACIONAL ATIVO NA PORTA 3000
    echo =========================================================================
    echo   Abrindo a interface no navegador...
    echo =========================================================================
    start http://localhost:3000
    exit /b 0
)

cls
echo =========================================================================
echo   V0ID OS - INICIANDO LAUNCHER 3D...
echo   URL: http://localhost:3000
echo =========================================================================

start "" cmd /c "timeout /t 2 /nobreak >nul & start http://localhost:3000"
node node_modules\next\dist\bin\next dev -p 3000
