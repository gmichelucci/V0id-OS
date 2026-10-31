#!/usr/bin/env node
// V0id CLI - Terminal Agent & Autopilot Core
import readline from 'node:readline';
import { V0idAgent } from './agent.js';
import { V0idWSServer } from './ws_server.js';
import { nexus } from '../../03_chat_projects_nexus/nexus-db/nexus.js';
import { loadEnv } from '../omni-router/env_loader.js';

loadEnv();

console.log(`
=====================================================
  🌑 V0ID OS — TERMINAL AGENT CORE (v0.1.0)
  Bootstrapping Autônomo & Semente Imortal
  WebSocket Server: ws://localhost:7777
  Projeto Ativo: Space Tide | Nexus DB: Conectado
=====================================================
`);

// 1. Initialize WebSocket Server on Port 7777
const wsServer = new V0idWSServer(7777, async (msg, ws) => {
  if (msg.type === 'goal') {
    await agent.planGoal(msg.goal);
    agent.runLoop();
  } else if (msg.type === 'chat') {
    const res = await agent.router.route(msg.message);
    ws.send(JSON.stringify({ type: 'chat_response', text: res.text, provider: res.providerUsed }));
  } else if (msg.type === 'status') {
    ws.send(JSON.stringify({
      type: 'status',
      running: agent.isRunning,
      activeTask: agent.activeTask
    }));
  }
});
wsServer.start();

// 2. Initialize Agent
const agent = new V0idAgent({
  activeProject: 'Space Tide',
  wsServer
});

// 3. Resume pending tasks on startup if present
await agent.resumeIfPending();

// 4. Interactive Terminal REPL
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: 'v0id> '
});

rl.prompt();

rl.on('line', async (line) => {
  const input = line.trim();
  if (!input) {
    rl.prompt();
    return;
  }

  if (input === '/exit' || input === 'exit') {
    console.log('[V0id] Encerrando agente...');
    wsServer.stop();
    process.exit(0);
  }

  if (input === '/help') {
    console.log(`
Comandos Disponíveis:
  /goal <objetivo>   - Decompõe e executa plano autônomo em loop
  /autopilot         - Dispara loop para tarefas pendentes na fila
  /tasks             - Lista tarefas na fila do Nexus DB
  /hibernation       - Exibe status de bloqueios 429
  /clear-hibernation - Limpa todos os bloqueios de cota
  /exit              - Finaliza o CLI
  <qualquer texto>   - Roteia pelo Gatekeeper + OmniRoute
`);
    rl.prompt();
    return;
  }

  if (input.startsWith('/goal ')) {
    const goalText = input.slice(6).trim();
    if (!goalText) {
      console.log('Uso: /goal <descrição do objetivo>');
    } else {
      await agent.planGoal(goalText);
      await agent.runLoop();
    }
    rl.prompt();
    return;
  }

  if (input === '/autopilot') {
    await agent.runLoop();
    rl.prompt();
    return;
  }

  if (input === '/tasks') {
    const next = nexus.getNextPendingTask();
    console.log('Próxima tarefa pendente:', next || 'Nenhuma tarefa pendente.');
    rl.prompt();
    return;
  }

  if (input === '/hibernation') {
    const hibs = nexus.getAllHibernations();
    console.log('Hibernações ativas:', hibs.length > 0 ? hibs : 'Nenhuma cota em hibernação.');
    rl.prompt();
    return;
  }

  if (input === '/clear-hibernation') {
    const hibs = nexus.getAllHibernations();
    hibs.forEach(h => nexus.clearHibernation(h.provider));
    console.log('Todas as hibernações foram limpas.');
    rl.prompt();
    return;
  }

  // General conversational / command input through OmniRoute
  try {
    const res = await agent.router.route(input);
    console.log(`\n[${res.providerUsed || 'OmniRoute'}]`);
    console.log(res.text);
  } catch (err) {
    console.error(`[Erro] ${err.message}`);
  }

  rl.prompt();
});
