// V0id CLI - Recursive Self-Command Autopilot Agent with Anti-Ghost-Write Engine
import fs from 'node:fs';
import path from 'node:path';
import { OmniRouter, TOOL_DEFINITIONS } from '../omni-router/index.js';
import { tools } from './tools.js';
import { nexus } from '../../03_chat_projects_nexus/nexus-db/nexus.js';

export class V0idAgent {
  constructor(options = {}) {
    this.router = options.router || new OmniRouter({
      activeProject: options.activeProject || 'Space Tide',
      onStatus: (msg) => this.log(msg)
    });
    this.ws = options.wsServer || null;
    this.isRunning = false;
    this.activeTask = null;
    this.specPath = path.resolve(process.cwd(), 'V0ID_SPEC.md');
  }

  log(msg) {
    console.log(msg);
    if (this.ws) {
      this.ws.broadcast({ type: 'log', message: msg, timestamp: Date.now() });
    }
  }

  loadSpec() {
    try {
      if (fs.existsSync(this.specPath)) {
        return fs.readFileSync(this.specPath, 'utf8');
      }
    } catch {}
    return '';
  }

  // Parse tool blocks from model output with multi-pattern fallback
  parseTools(text = '', nativeCalls = [], options = {}) {
    const calls = [];
    const seen = new Set();

    const addCall = (tool, args) => {
      if (!tools[tool]) return;
      const key = `${tool}:${JSON.stringify(args)}`;
      if (!seen.has(key)) {
        seen.add(key);
        calls.push({ tool, args: args || {} });
      }
    };

    // 1. Native API tool calls (OpenAI tool_calls / Gemini functionCall)
    if (Array.isArray(nativeCalls)) {
      for (const nc of nativeCalls) {
        if (nc && nc.tool) {
          addCall(nc.tool, nc.args || {});
        }
      }
    }

    if (!text || typeof text !== 'string') return calls;

    // 2. Pattern: ```json { "tool": "write_file", "args": { ... } } ``` or single JSON objects
    const jsonMatches = text.matchAll(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/gi);
    for (const match of jsonMatches) {
      try {
        const obj = JSON.parse(match[1]);
        const toolName = obj.tool || obj.name || obj.function;
        const toolArgs = obj.args || obj.parameters || obj.arguments || obj;
        if (toolName && tools[toolName]) {
          addCall(toolName, toolArgs);
        }
      } catch {}
    }

    // 3. Pattern: JSON Array of tools: ```json [ { "tool": "..." }, ... ] ```
    const arrayMatches = text.matchAll(/```(?:json)?\s*(\[\s*\{[\s\S]*?\}\s*\])\s*```/gi);
    for (const match of arrayMatches) {
      try {
        const list = JSON.parse(match[1]);
        if (Array.isArray(list)) {
          for (const item of list) {
            const toolName = item.tool || item.name;
            const toolArgs = item.args || item.parameters || item;
            if (toolName && tools[toolName]) {
              addCall(toolName, toolArgs);
            }
          }
        }
      } catch {}
    }

    // 4. Pattern: Tag markers: [TOOL:write_file] { ... } [/TOOL]
    const markerMatches = text.matchAll(/\[TOOL:([a-z_]+)\]([\s\S]*?)\[\/TOOL\]/gi);
    for (const match of markerMatches) {
      const toolName = match[1].toLowerCase();
      if (tools[toolName]) {
        try {
          const args = JSON.parse(match[2].trim());
          addCall(toolName, args);
        } catch {}
      }
    }

    // 5. Pattern: Code blocks annotated with filepath (Markdown Ghost-Write Rescue)
    // Apenas no modo autopilot de execução contínua, nunca no chat conversacional
    if (options.allowGhostWrite === true) {
      const fileBlockRegex = /(?:###?\s*(?:File|Arquivo):\s*[`\*]?([a-zA-Z0-9_\-\.\/\\ ]+\.[a-zA-Z0-9]+)[`\*]?\s*\n+```[a-zA-Z0-9_\-]*\n([\s\S]*?)```|```[a-zA-Z0-9_\-]*\s+(?:file(?:path)?|path)=([a-zA-Z0-9_\-\.\/\\ ]+)\n([\s\S]*?)```|```[a-zA-Z0-9_\-]*\n(?:\/\/|#|<!--)\s*(?:file(?:path)?|path):\s*([a-zA-Z0-9_\-\.\/\\ ]+)(?:-->)?\n([\s\S]*?)```)/gi;

      for (const match of text.matchAll(fileBlockRegex)) {
        const filePath = (match[1] || match[3] || match[5] || '').trim();
        const content = match[2] || match[4] || match[6] || '';
        if (filePath && content) {
          addCall('write_file', { filePath, content });
        }
      }
    }

    return calls;
  }

  // Step 1: Break goal into sequential micro-tasks
  async planGoal(goalDescription) {
    this.log(`[AUTOPILOT] Planejando objetivo: "${goalDescription}"...`);
    const goalId = 'goal_' + Date.now();
    nexus.createGoal(goalId, goalDescription, `Objetivo iniciado via /goal`);

    const prompt = `Você é o planejador mestre do V0id OS.
Quebre o seguinte objetivo em uma lista de 3 a 6 micro-tarefas sequenciais e executáveis.
Responda EXCLUSIVAMENTE com um array JSON no formato:
[
  { "step": 1, "prompt": "Descrição técnica da micro-tarefa 1 com ferramentas necessárias" },
  { "step": 2, "prompt": "Descrição técnica da micro-tarefa 2 com validação" }
]

OBJETIVO:
${goalDescription}`;

    let tasks = [];
    try {
      const res = await this.router.route(prompt, { forceComplex: true });
      const jsonMatch = res.text.match(/\[\s*\{[\s\S]*\}\s*\]/);
      if (jsonMatch) {
        tasks = JSON.parse(jsonMatch[0]);
      }
    } catch (err) {
      this.log(`[AUTOPILOT Warning] Falha na decomposição via LLM (${err.message}). Usando decomposição direta.`);
    }

    if (!tasks || tasks.length === 0) {
      tasks = [
        { step: 1, prompt: `Executar passo 1 para: ${goalDescription}` },
        { step: 2, prompt: `Validar resultados e testes para: ${goalDescription}` }
      ];
    }

    for (const t of tasks) {
      nexus.enqueueTask(goalId, t.step, t.prompt);
    }

    this.log(`[AUTOPILOT] ${tasks.length} micro-tarefas enfileiradas com sucesso no Nexus DB.`);
    return goalId;
  }

  // Step 2 & 3: Run recursive loop with Anti-Ghost-Write enforcement
  async runLoop() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.log(`[AUTOPILOT] Iniciando loop recursivo de auto-comando...`);

    while (this.isRunning) {
      const task = nexus.getNextPendingTask();
      if (!task) {
        this.log(`[AUTOPILOT] Fila de tarefas vazia. Sistema pronto.`);
        break;
      }

      this.activeTask = task;
      nexus.updateTaskStatus(task.id, 'IN_PROGRESS');
      this.log(`\n==================================================`);
      this.log(`[TAREFA #${task.id} | PASSO ${task.step_order}] ${task.self_prompt}`);
      this.log(`==================================================`);

      if (this.ws) {
        this.ws.broadcast({ type: 'task_start', taskId: task.id, step: task.step_order, prompt: task.self_prompt });
      }

      let success = false;
      let lastError = null;
      let executedToolsCount = 0;

      // Execute task with auto-correction & Anti-Ghost-Write (up to 3 attempts)
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          let taskPrompt;
          if (attempt === 1) {
            taskPrompt = `Execute a seguinte micro-tarefa técnica no V0id OS:
${task.self_prompt}

SISTEMA OPERACIONAL: Windows (PowerShell).
REGRA MANDATÓRIA ANTI-GHOST-WRITE:
- Você DEVE obrigatoriamente chamar a ferramenta write_file para gravar os arquivos no disco ou run_command para executar comandos.
- É PROIBIDO responder apenas com texto explicativo ou código sem invocar ferramentas. Respostas sem chamadas de ferramentas serão rejeitadas.

Formato aceito:
\`\`\`json
{
  "tool": "write_file",
  "args": {
    "filePath": "caminho/do/arquivo.ext",
    "content": "conteúdo completo do arquivo"
  }
}
\`\`\`
ou
\`\`\`json
{
  "tool": "run_command",
  "args": { "command": "Get-ChildItem" }
}
\`\`\``;
          } else {
            taskPrompt = `A tentativa #${attempt - 1} da tarefa #${task.id} FALHOU com o seguinte motivo:
${lastError}

Você NÃO invocou nenhuma ferramenta real no disco. Use OBRIGATORIAMENTE write_file ou run_command em formato JSON para criar os arquivos reais agora.`;
          }

          const response = await this.router.route(taskPrompt, {
            forceComplex: true,
            tools: TOOL_DEFINITIONS
          });

          // Multi-source tool resolution: native tool_calls + robust text parser
          const toolCalls = this.parseTools(response.text, response.toolCalls, { allowGhostWrite: true });

          if (toolCalls.length === 0) {
            // GHOST WRITE DETECTED: Model replied with text only!
            this.log(`[GHOST WRITE DETECTADO - Tentativa ${attempt}] O modelo respondeu apenas texto sem invocar ferramentas.`);
            lastError = 'Ghost Write: Nenhuma ferramenta (write_file/run_command) foi invocada. Nenhum arquivo foi gravado no disco.';
            continue; // Re-prompt model to force tool call
          }

          // Strict write check: if task requires writing, read_file alone is NOT enough
          const modifyingCalls = toolCalls.filter(c => ['write_file', 'apply_diff', 'run_command'].includes(c.tool));
          const requiresWrite = /write_file|crie|create|build|implemente|\.tsx|\.ts|\.js|\.json|\.html|\.css/i.test(task.self_prompt);

          if (requiresWrite && modifyingCalls.length === 0) {
            this.log(`[GHOST WRITE DETECTADO - Tentativa ${attempt}] Apenas ferramentas de leitura (${toolCalls.map(c => c.tool).join(', ')}) foram executadas, mas a tarefa exige criação/gravação real.`);
            lastError = 'A tarefa exige a gravação/criação de arquivos no disco, mas nenhuma ferramenta modificadora (write_file/run_command) foi executada. Use obrigatoriamente write_file para gravar o arquivo solicitado.';
            continue;
          }

          // Execute extracted tools
          for (const call of toolCalls) {
            this.log(`[TOOL CALL] Executando ${call.tool}...`);
            const toolResult = tools[call.tool](call.args);
            this.log(`[TOOL RESULT] ${toolResult}`);
            executedToolsCount++;
          }

          if (executedToolsCount > 0) {
            success = true;
            break;
          }
        } catch (err) {
          lastError = err.message;
          this.log(`[ERRO NA TAREFA #${task.id} - Tentativa ${attempt}] ${err.message}`);
        }
      }

      // Checkpoint Enforcement: Can ONLY be marked DONE if tools were actually executed!
      if (success && executedToolsCount > 0) {
        nexus.updateTaskStatus(task.id, 'DONE', {
          completedAt: new Date().toISOString(),
          toolsExecuted: executedToolsCount
        });
        this.log(`[CHECKPOINT SEGURO] Tarefa #${task.id} concluída com ${executedToolsCount} ferramenta(s) executada(s) no disco [DONE].`);
        if (this.ws) {
          this.ws.broadcast({ type: 'task_done', taskId: task.id, toolsExecuted: executedToolsCount });
        }
      } else {
        nexus.updateTaskStatus(task.id, 'FAILED', null, lastError || 'Ghost Write: Zero ferramentas executadas');
        this.log(`[FALHA] Tarefa #${task.id} abortada: ${lastError}. Checkpoint falso proibido.`);
      }

      // Memory Clean: Reset short-term conversation context to prevent token explosion
      this.activeTask = null;
    }

    this.isRunning = false;
  }

  // Step 4: Resume pending tasks from previous session
  async resumeIfPending() {
    const nextTask = nexus.getNextPendingTask();
    if (nextTask) {
      this.log(`[AUTOPILOT] Tarefas pendentes detectadas no Nexus DB. Retomando backlog...`);
      await this.runLoop();
    }
  }

  stop() {
    this.isRunning = false;
    this.log(`[AUTOPILOT] Loop interrompido.`);
  }
}
