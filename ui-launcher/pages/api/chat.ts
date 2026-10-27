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

    // Monta o System Prompt com o Blueprint Arquitetural do Workspace (Padrão Antigravity)
    let systemPrompt = `Você é o V0id OS Core, assistente técnico de inteligência artificial de alto nível e orquestrador supremo do sistema operacional soberano V0id.
Você opera com raciocínio agêntico autônomo (estilo Antigravity / Cursor / Claude Code).

ARQUITETURA DO PROJETO V0ID OS:
- Diretório Raiz: C:\\V0id
- Estrutura de Pastas e Módulos:
  • 01_core_security: Roteador de IA (OmniRoute), Sandbox SAST, ferramentas de CLI e ferramentas agênticas (tools.js).
  • 02_auto_forge: Radar MCP na web, engenharia reversa REA e autômatos.
  • 03_chat_projects_nexus: Banco SQLite persistente (nexus.db) e gerenciador de projetos/conversas.
  • docs: Documentação viva, fotos dos estúdios (docs/scenes/), relatórios de auditoria interativa (INTERACTIVE_TEST_REPORT.md) e mapa de cenas (SCENES_INDEX.md).
  • ui-launcher: Interface gráfica Next.js + Three.js com o Launcher 3D orbital e os 14 estúdios.
  • Scripts de Automação: v0id_token_budget_loop.mjs (motor de auto-evolução contínua), v0id_interactive_tester.mjs (auditoria E2E via CDP), v0id_capture_scenes.mjs (captura de fotos), v0id_auto_healer.mjs (auto-cura de código).
  • Arquivos Chave: EVOLUTION_LOG.md (histórico de todos os ciclos de auto-melhoria), V0ID_SPEC.md (especificação do sistema).

DIRETRIZ AGÊNTICA FUNDAMENTAL:
Você possui ferramentas reais conectadas ao disco rígido e ao PowerShell do Windows:
- read_file(filePath): lê o conteúdo de qualquer arquivo no disco.
- write_file(filePath, content): cria ou edita arquivos.
- list_dir(dirPath): lista diretórios e descobre arquivos.
- run_command(command): executa comandos no PowerShell (ex: git status, git log, npm test, dir).

REGRAS DE CONDUTA TÉCNICA:
1. NUNCA adivinhe ou invente dados sobre o código, arquivos, logs, testes ou histórico do sistema. Use read_file ou run_command para inspecionar os arquivos reais antes de formular sua resposta.
2. Formate suas respostas de forma elegante, completa e profissional em português com Markdown rico (tópicos, tabelas, código demarcado).`;

    if (toggles?.cavemanMode) {
      systemPrompt += '\nDiretriz de concisão extrema: forneça respostas diretas e cirúrgicas sem preâmbulos.';
    } else {
      systemPrompt += '\nResponda com clareza, eloquência e detalhamento técnico completo, apresentando soluções bem desenvolvidas e explicando os conceitos com precisão.';
    }

    if (toggles?.ponytail) {
      systemPrompt += ' Adote a postura Ponytail (engenharia sênior pragmática: soluções limpas, menor código necessário, sem abstrações inúteis).';
    }

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

    let currentPrompt = fullUserPrompt;
    const allToolResults: any[] = [...toolResultsFromAttachments];
    let finalAnswer = '';
    let chosenProvider = 'OmniRoute Core';
    let chosenTier: any = 1;
    let chosenModel = 'default';

    // Loop ReAct Agêntico (até 3 iterações autônomas de pesquisa / execução de ferramentas)
    for (let turn = 0; turn < 3; turn++) {
      const response = await router.route(currentPrompt, {
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

      chosenProvider = response.providerUsed || chosenProvider;
      chosenTier = response.tier || chosenTier;
      chosenModel = response.model || chosenModel;
      const responseText = response.text || '';

      // Extrai chamadas de ferramentas nativas ou blocos de código
      const toolCalls = agent.parseTools(responseText, response.toolCalls);

      // Se o modelo não invocou ferramentas, temos a resposta textual final
      if (toolCalls.length === 0) {
        finalAnswer = responseText;
        break;
      }

      // Executa as ferramentas reais chamadas pelo modelo
      const turnResults: any[] = [];
      for (const tc of toolCalls) {
        if (tools[tc.tool]) {
          try {
            const r = tools[tc.tool](tc.args);
            turnResults.push({ tool: tc.tool, args: tc.args, result: r });
            allToolResults.push({ tool: tc.tool, args: tc.args, result: r });
          } catch (err: any) {
            turnResults.push({ tool: tc.tool, args: tc.args, error: err.message });
            allToolResults.push({ tool: tc.tool, args: tc.args, error: err.message });
          }
        }
      }

      // Formata os resultados reais do disco para a próxima iteração cognitiva
      const toolSummary = turnResults.map(t => {
        const argStr = JSON.stringify(t.args);
        const resStr = typeof t.result === 'string' ? t.result.slice(0, 3500) : (t.error ? `ERRO: ${t.error}` : JSON.stringify(t.result));
        return `[FERRAMENTA: ${t.tool}(${argStr})]\nRESULTADO:\n${resStr}`;
      }).join('\n\n');

      currentPrompt = `Você invocou as seguintes ferramentas no sistema operacional:
${toolSummary}

PERGUNTA ORIGINAL DO USUÁRIO:
"${message}"

INSTRUÇÃO:
Analise os dados reais acima. Se você já tiver informações suficientes para responder à pergunta com precisão cirúrgica e profundidade técnica, elabore a resposta final estruturada em Markdown. Se ainda faltar algum detalhe específico do disco ou do sistema, faça outra chamada de ferramenta.`;
    }

    let text = finalAnswer;

    // Se o modelo respondeu exclusivamente em bloco JSON sem ter sido pedido JSON, converte em Markdown analítico elegante
    const isOnlyToolJson = /^\s*```(?:json)?\s*\{[\s\S]*\}\s*```\s*$/i.test(text.trim());
    if (isOnlyToolJson && !/json/i.test(message)) {
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
        sender: chosenProvider || 'OmniRoute Core',
        text,
        provider: chosenProvider || 'OmniRoute Core',
        tier: chosenTier,
        model: chosenModel,
        toolResults: allToolResults
      });
    } catch (e: any) {
      console.warn('Erro ao persistir resposta do assistente:', e.message);
    }

    return res.status(200).json({
      success: true,
      text,
      provider: chosenProvider || 'OmniRoute Core',
      tier: chosenTier,
      model: chosenModel,
      toolResults: allToolResults
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
