@echo off
title V0id OS - Conectar Google Flow (Nano Banana)
echo ================================================================
echo  V0id OS - Conectar ao Google Flow (Nano Banana)
echo ================================================================
echo Abrindo Microsoft Edge com Perfil Dedicado do V0id...
start "" "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --remote-debugging-port=9222 --user-data-dir="C:\V0id\.flow_browser" --no-first-run --no-default-browser-check https://flow.google.com/
echo.
echo Janela do Edge iniciada com sucesso!
echo 1. Faca login na sua conta Google Pro.
echo 2. Crie ou acesse o projeto 'V0id OS'.
echo.
echo Quando concluir, voce pode deixar o Edge aberto ou fechar.
echo O V0id gerencia as chamadas em segundo plano a partir de agora!
echo.
pause
