import type { NextApiRequest, NextApiResponse } from 'next';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

// Bypass Next.js / Webpack static analysis for native external ESM modules
const dynamicImport = new Function('specifier', 'return import(specifier)');

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const nexusPath = pathToFileURL(path.resolve(process.cwd(), '../03_chat_projects_nexus/nexus-db/nexus.js')).href;

  // 1. GET: Retorna o histórico persistido de mensagens ou lista de sessões
  if (req.method === 'GET') {
    try {
      const { nexus } = await dynamicImport(nexusPath);
      const proj = (req.query.project as string) || 'global';
      const action = req.query.action as string;

      // Retorna sessões existentes para o projeto
      if (action === 'sessions') {
        const sessions = nexus.getSessions(proj);
        return res.status(200).json({ success: true, sessions });
      }

      const sessionId = (req.query.session_id as string) || null;
      const history = nexus.getChatMessages(proj, sessionId, 100);
      return res.status(200).json({ success: true, messages: history });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // 2. DELETE: Exclui uma sessão de conversa
  if (req.method === 'DELETE') {
    try {
      const { nexus } = await dynamicImport(nexusPath);
      const sessionId = (req.query.session_id as string) || (req.body && req.body.session_id);
      if (sessionId) {
        nexus.deleteSession(sessionId);
        return res.status(200).json({ success: true, deleted: sessionId });
      }
      return res.status(400).json({ success: false, error: 'session_id obrigatório' });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // 3. POST (action=new_session): Cria uma nova sessão explicitamente
  if (req.method === 'POST' && req.query.action === 'new_session') {
    try {
      const { nexus } = await dynamicImport(nexusPath);
      const { project = 'global', title = 'Nova Conversa' } = req.body;
      const session = nexus.createSession(project, title);
      return res.status(200).json({ success: true, session });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // 4. POST (action=gold): Marca a última resposta como [APPROVED_GOLD] no SQLite
  if (req.method === 'POST' && req.query.action === 'gold') {
    try {
      const { nexus } = await dynamicImport(nexusPath);
      const { project = 'global' } = req.body;
      const last = nexus.markLastMessageGold(project);
      return res.status(200).json({ success: true, marked: last });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });

  const { message, project, toggles, session_id, attachments } = req.body;
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Mensagem vazia' });
  }

  try {
    const omniRouterPath = pathToFileURL(path.resolve(process.cwd(), '../01_core_security/omni-router/index.js')).href;
    const toolsPath = pathToFileURL(path.resolve(process.cwd(), '../01_core_security/v0id-cli/tools.js')).href;
    const agentPath = pathToFileURL(path.resolve(process.cwd(), '../01_core_security/v0id-cli/agent.js')).href;

    const { OmniRouter, TOOL_DEFINITIONS } = await dynamicImport(omniRouterPath);
    const { tools } = await dynamicImport(toolsPath);
    const { V0idAgent } = await dynamicImport(agentPath);
    const { nexus } = await dynamicImport(nexusPath);

    const activeProj = project || 'global';
    const activeSession = session_id || 'default';
    const agent = new V0idAgent({ activeProject: activeProj });

    // Monta o System Prompt de acordo com os Toggles ativos em tempo real
    let systemPrompt = 'Você é o V0id OS Core, assistente técnico de engenharia de software e orquestrador supremo do sistema operacional soberano V0id. Responda em português formal, fluido, analítico e de alto nível técnico, estruturando suas explicações em Markdown com clareza impecável.';

    // Injeção de Contexto Vivo do Sistema (como o Antigravity faz com o Workspace)
    try {
      const fsModule = await dynamicImport('node:fs');
      const evolutionLogPath = path.resolve(process.cwd(), '../EVOLUTION_LOG.md');
      if (fsModule.existsSync(evolutionLogPath)) {
        const evoContent = fsModule.readFileSync(evolutionLogPath, 'utf8').trim();
        const cycles = evoContent.split('### [CICLO DE EVOLUÇÃO CONTÍNUA]');
        if (cycles.length > 1) {
          const lastCycle = cycles[cycles.length - 1].trim().slice(0, 900);
          systemPrompt += `\n\n--- [CONTEXTO VIVO DO SISTEMA: ÚLTIMO CICLO DE AUTO-MELHORIA REGISTRADO NO DISCO] ---\n${lastCycle}\n---------------------------------------------------------------------------------`;
        }
      }
    } catch {}

    if (toggles?.cavemanMode) {
      systemPrompt += '\nDiretriz de concisão extrema: forneça respostas diretas e cirúrgicas sem preâmbulos.';
    } else {
      systemPrompt += '\nResponda com clareza, eloquência e detalhamento técnico completo, apresentando soluções bem desenvolvidas e explicando os conceitos com precisão.';
    }

    if (toggles?.ponytail) {
      systemPrompt += ' Adote a postura Ponytail (engenharia sênior pragmática: soluções limpas, menor código necessário, sem abstrações inúteis).';
    }

    systemPrompt += '\nVocê tem ferramentas para ler arquivos (read_file), listar pastas (list_dir) e rodar comandos (run_command). Se a dúvida do usuário depender de dados específicos do código ou arquivos, utilize essas ferramentas.';

    // Processa arquivos anexados e anexa ao prompt do usuário
    let fullUserPrompt = message;
    const toolResultsFromAttachments: any[] = [];
    if (Array.isArray(attachments) && attachments.length > 0) {
      const fileBlocks = attachments.map((att: any) => {
        toolResultsFromAttachments.push({
          tool: 'attach_file',
          args: { name: att.name, size: att.size || (att.content?.length || 0) },
          result: `Arquivo anexado: ${att.name}`
        });
        return `\n\n--- [ARQUIVO ANEXADO: ${att.name}] ---\n${att.content || ''}\n----------------------------------`;
      }).join('');
      fullUserPrompt = `${message}${fileBlocks}`;
    }

    // Carrega histórico prévio desta sessão para prover memória multi-turn real
    const previousHistory = nexus.getChatMessages(activeProj, activeSession, 12);

    // Salva a mensagem do usuário no banco SQLite persistente vinculada à sessão
    try {
      nexus.saveChatMessage({
        projectId: activeProj,
        sessionId: activeSession,
        sender: 'Você',
        text: message,
        toolResults: toolResultsFromAttachments
      });
    } catch (e: any) {
      console.warn('Erro ao persistir mensagem do usuário:', e.message);
    }

    // Se o usuário iniciar com /goal no Chat Global, aciona o Autopilot do V0idAgent
    if (message.trim().startsWith('/goal')) {
      const goalDesc = message.replace(/^\/goal\s*/i, '').trim();
      const goalId = await agent.planGoal(goalDesc);
      // Dispara o loop em background
      agent.runLoop().catch(console.error);

      const autopilotReply = `🚀 [AUTOPILOT V0ID INICIADO]\nObjetivo: "${goalDesc}"\nDecomposto em micro-tarefas e registrado no Nexus DB (ID: ${goalId}).\nO V0id Agent está executando o loop autônomo com gravação direta no disco!`;

      try {
        nexus.saveChatMessage({
          projectId: activeProj,
          sessionId: activeSession,
          sender: 'V0id Autopilot Agent',
          text: autopilotReply,
          provider: 'V0id Autopilot Agent',
          tier: 'Autonomous',
          model: 'OmniRoute Autopilot'
        });
      } catch {}

      return res.status(200).json({
        success: true,
        text: autopilotReply,
        provider: 'V0id Autopilot Agent',
        tier: 'Autonomous',
        model: 'OmniRoute Autopilot',
        toolResults: []
      });
    }

    const router = new OmniRouter({
      activeProject: activeProj
    });

    const response = await router.route(fullUserPrompt, {
      forceComplex: true,
      tools: TOOL_DEFINITIONS,
      systemPrompt,
      history: previousHistory,
      uncensored: toggles?.uncensoredMode,
      forceAgy: toggles?.forceAgy,
      promptImprover: toggles?.promptImprover !== false,
      cavemanMode: toggles?.cavemanMode === true,
      ponytail: toggles?.ponytail !== false
    });

    let text = response.text || '';
    // Usa o parseTools do V0idAgent para capturar chamadas nativas + blocos JSON + Markdown ghost-writes
    const toolCalls = agent.parseTools(text, response.toolCalls);
    const toolResults: any[] = [];

    // Executa ferramentas reais no disco se o modelo tiver invocado
    for (const tc of toolCalls) {
      if (tools[tc.tool]) {
        try {
          const r = tools[tc.tool](tc.args);
          toolResults.push({ tool: tc.tool, args: tc.args, result: r });
        } catch (err: any) {
          toolResults.push({ tool: tc.tool, args: tc.args, error: err.message });
        }
      }
    }

    // Se o modelo invocou ferramentas no disco mas não gerou o texto explicativo final (ou mandou apenas JSON),
    // alimenta o resultado da ferramenta de volta para o modelo gerar a resposta completa da pergunta do usuário!
    const isOnlyToolJson = /^\s*```(?:json)?\s*\{[\s\S]*\}\s*```\s*$/i.test(text.trim());
    if (toolResults.length > 0 && (!text.trim() || isOnlyToolJson)) {
      try {
        const toolSummary = toolResults.map(t => {
          if (t.tool === 'read_file') {
            const preview = typeof t.result === 'string' ? t.result.slice(0, 1800) : '';
            return `[ARQUIVO LIDO: ${t.args?.filePath || t.args?.path || 'arquivo'}]\n${preview}`;
          }
          if (t.tool === 'list_dir') {
            return `[CONTEÚDO DA PASTA: ${t.args?.dirPath || '.'}]\n${t.result}`;
          }
          return `[FERRAMENTA ${t.tool}]: ${typeof t.result === 'string' ? t.result.slice(0, 500) : 'OK'}`;
        }).join('\n\n');

        const followUpPrompt = `Você é o V0id OS Core. O usuário fez a seguinte pergunta:
"${message}"

Aqui estão os dados reais que você acabou de ler do disco rígido:
${toolSummary}

DIRETRIZ DE RESPOSTA OBRIGATÓRIA:
Com base estritamente nos dados que você leu acima, formule agora uma resposta completa, analítica e estruturada explicando o que você leu e respondendo à pergunta original do usuário.
Não invoque novas ferramentas. Responda em texto claro, técnico e executivo com a identidade oficial do V0id OS.`;

        const followUp = await router.route(followUpPrompt, {
          forceComplex: true,
          systemPrompt: systemPrompt + ' Formule uma resposta analítica, fluida, estruturada e detalhada em linguagem natural e profissional.',
          uncensored: toggles?.uncensoredMode,
          forceAgy: toggles?.forceAgy
        });
        if (followUp && followUp.text) {
          text = followUp.text;
        }
      } catch (err: any) {
        console.error('Erro na síntese da resposta com ferramentas:', err.message);
      }
    } else if (isOnlyToolJson && !/json/i.test(message)) {
      // Se o modelo respondeu exclusivamente em bloco JSON sem ter sido pedido JSON, converte em Markdown analítico elegante
      try {
        const rawJson = text.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
        const parsed = JSON.parse(rawJson);
        let formattedMd = '### 📊 Resumo Executivo das Ações:\n\n';
        for (const [k, v] of Object.entries(parsed)) {
          const label = k.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          formattedMd += `- **${label}:** ${typeof v === 'object' ? JSON.stringify(v) : v}\n`;
        }
        text = formattedMd;
      } catch {}
    }

    // Salva a resposta do assistente no banco SQLite persistente vinculada à sessão
    try {
      nexus.saveChatMessage({
        projectId: activeProj,
        sessionId: activeSession,
        sender: response.providerUsed || 'OmniRoute Core',
        text,
        provider: response.providerUsed || 'OmniRoute Core',
        tier: response.tier,
        model: response.model,
        toolResults
      });
    } catch (e: any) {
      console.warn('Erro ao persistir resposta do assistente:', e.message);
    }

    return res.status(200).json({
      success: true,
      text,
      provider: response.providerUsed || 'OmniRoute Core',
      tier: response.tier,
      model: response.model,
      toolResults
    });
  } catch (err: any) {
    console.error('CHAT API ERROR:', err.stack || err);
    return res.status(500).json({
      success: false,
      error: err.message,
      provider: 'OmniRoute Error'
    });
  }
}
