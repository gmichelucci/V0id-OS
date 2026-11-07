@echo off
title V0id OS - Sovereign Autonomous Developer Desktop
cd /d "%~dp0ui-launcher"

set "BROWSER_APP="
if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" set "BROWSER_APP=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
if exist "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" set "BROWSER_APP=%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"
if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" set "BROWSER_APP=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
if exist "%LocalAppData%\Google\Chrome\Application\chrome.exe" set "BROWSER_APP=%LocalAppData%\Google\Chrome\Application\chrome.exe"

rem Check if port 3000 is already active
netstat -ano | findstr :3000 | findstr LISTENING >nul
if %errorlevel% equ 0 (
    echo =========================================================================
    echo   V0ID OS - SISTEMA OPERACIONAL ATIVO NA PORTA 3000
    echo =========================================================================
    echo   Abrindo janela nativa do aplicativo...
    echo =========================================================================
    if defined BROWSER_APP (
        start "" "%BROWSER_APP%" --app="http://localhost:3000" --name="V0id OS"
    ) else (
        start http://localhost:3000
    )
    exit /b 0
)

cls
echo =========================================================================
echo   V0ID OS - INICIANDO APLICATIVO NATIVO DESKTOP...
echo   URL: http://localhost:3000
echo =========================================================================

if defined BROWSER_APP (
    start "" cmd /c "timeout /t 3 /nobreak >nul & start \"\" \"%BROWSER_APP%\" --app=\"http://localhost:3000\" --name=\"V0id OS\""
) else (
    start "" cmd /c "timeout /t 3 /nobreak >nul & start http://localhost:3000"
)

node node_modules\next\dist\bin\next dev -p 3000
