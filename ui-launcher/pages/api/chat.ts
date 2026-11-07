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
      const proj = ((req.query.project as string) || 'global').toLowerCase();
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
      const session = nexus.createSession(String(project).toLowerCase(), title);
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
      const last = nexus.markLastMessageGold(String(project).toLowerCase());
      return res.status(200).json({ success: true, marked: last });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });

  const { message, project, toggles, session_id, attachments, chatMode, stream } = req.body;
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Mensagem vazia' });
  }

  const isStreaming = stream === true || req.headers.accept?.includes('text/event-stream');
  let isAborted = false;
  req.on('close', () => {
    isAborted = true;
  });

  if (isStreaming) {
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    // @ts-ignore
    if (res.flushHeaders) res.flushHeaders();
  }

  const emitEvent = (event: string, data: any) => {
    if (isStreaming && !isAborted) {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
      // @ts-ignore
      if (res.flush) res.flush();
    }
  };

  const sendFinalResponse = (resObj: { success: boolean; text: string; provider: string; tier: string; model?: string; toolResults: any[] }) => {
    if (isStreaming) {
      emitEvent('done', resObj);
      return res.end();
    }
    return res.status(200).json(resObj);
  };

  try {
    const omniRouterPath = pathToFileURL(path.resolve(process.cwd(), '../01_core_security/omni-router/index.js')).href + `?t=${Date.now()}`;
    const toolsPath = pathToFileURL(path.resolve(process.cwd(), '../01_core_security/v0id-cli/tools.js')).href + `?t=${Date.now()}`;
    const agentPath = pathToFileURL(path.resolve(process.cwd(), '../01_core_security/v0id-cli/agent.js')).href + `?t=${Date.now()}`;

    const { OmniRouter, TOOL_DEFINITIONS } = await dynamicImport(omniRouterPath);
    const { tools } = await dynamicImport(toolsPath);
    const { V0idAgent } = await dynamicImport(agentPath);
    const { nexus } = await dynamicImport(nexusPath);

    const activeProj = (project || 'global').toLowerCase();
    const activeSession = session_id || 'default';
    const projectRoot = nexus.getProjectRoot(activeProj);
    process.env.V0ID_PROJECT_ROOT = projectRoot || '';
    const projectRow = nexus.getProject(activeProj);
    const projectName = projectRow?.name || (activeProj === 'v0id' ? 'V0id OS' : 'Geral');

    const agent = new V0idAgent({ activeProject: activeProj });

    // Monta o System Prompt de Alto Nível (Padrão Antigravity Soberano)
    const repoSection = (activeProj === 'global' || !projectRoot)
      ? `WORKSPACE / REPOSITÓRIO ATIVO:
- Modo: "Geral" (Nenhum repositório vinculado — Modo Livre e Conversação Geral)
- ESCOPO: Nenhum repositório de código está vinculado a este chat. Você opera em modo livre para reflexão, estratégia, perguntas gerais ou auxílio conceitual. Se o usuário quiser criar, inspecionar, debugar ou executar código em um projeto específico, oriente-o a selecionar o projeto "V0id OS" ou clicar em "+ Vincular Pasta" na barra superior para vincular a pasta do repositório dele.
- ACESSO AO SISTEMA: Caso o usuário solicite comandos ou investigações em caminhos explícitos no Windows (ex: C:\\Projetos), você possui ferramentas ativas de terminal e disco para inspecionar conforme solicitado.`
      : `WORKSPACE / REPOSITÓRIO ATIVO:
- Projeto Selecionado: "${projectName}" (ID: ${activeProj})
- Raiz do Repositório: "${projectRoot}"
- ESCOPO DE OPERAÇÃO: Suas ferramentas de arquivo e terminal (read_file, write_file, apply_diff, search_code, find_files, list_dir, run_command) operam DIRETAMENTE dentro da raiz deste repositório ("${projectRoot}").
- Se o usuário pedir para criar, modificar, compilar, rodar ou inspecionar arquivos deste projeto, faça isso diretamente nesta pasta como em um IDE profissional estilo Antigravity.
- ACESSO TOTAL AO COMPUTADOR DO USUÁRIO: Além do repositório ativo, você tem autorização e capacidade total para ler, inspecionar, buscar, listar ou criar arquivos em QUALQUER pasta do computador do usuário (C:\\, D:\\, etc.) quando ele fornecer caminhos ou pedir investigações no sistema. Nunca afirme que não tem acesso aos arquivos locais.`;

    let systemPrompt = `Você é o V0id OS Core, assistente de inteligência artificial soberano, culto, prestativo e altamente competente (padrão Google Antigravity / Gemini Elite). Você é a essência do V0id OS, um sistema autônomo, auto-curável e auto-melhorável.

${repoSection}

CONSCIÊNCIA DE SISTEMA & CAPACIDADES REAIS:
- Você NÃO é um chatbot limitado a texto. Você tem ACESSO DIRETO AO SISTEMA OPERACIONAL WINDOWS, ao disco rígido e ao terminal.
- Se o usuário pedir para criar, modificar, investigar ou corrigir algo, NUNCA peça para ele fazer manualmente ou rode código imaginário. Use suas FERRAMENTAS REAIS ativamente.
- Você possui auto-conhecimento completo do repositório:
  * Diretório Raiz: C:\\V0id
  * 01_core_security (omni-router, v0id-cli com WebSocket :7777, security-guard, auto-forge)
  * 02_plugins_automations_rules (mcp-gateway, rules-engine, automations-hub)
  * 03_chat_projects_nexus (nexus-db com SQLite nativo, reflection-loop, checkpoints)
  * 04_studios_tools (estúdios de code, game, film, image, audio, research, marketing, finances)
  * ui-launcher (interface Next.js/React com rotas /api/chat, /api/projects, /api/files, /api/automations, /api/autoforge, /api/rea, /api/system)
  * Documentos Mestres: V0ID_SPEC.md (especificação arquitetural unificada), SOUL.md (regras e gostos aprendidos).

FERRAMENTAS NATIVAS DISPONÍVEIS:
- \`read_file\`: Lê o conteúdo exato de arquivos do disco (com suporte a startLine e endLine). Use SEMPRE antes de modificar código.
- \`write_file\`: Cria ou substitui arquivos inteiros no disco.
- \`apply_diff\`: Aplica substituições cirúrgicas em arquivos existentes (preservando o restante do código).
- \`search_code\`: Busca textual/grep instantânea em múltiplos arquivos do repositório. Use para localizar funções, variáveis ou erros.
- \`find_files\`: Busca arquivos por nome ou padrão glob (ex: *.tsx, *agent*).
- \`list_dir\`: Lista o conteúdo de diretórios.
- \`run_command\`: Executa comandos PowerShell reais (ex: git, npm, node).
- \`web_search\`: Pesquisa na web em tempo real por documentação técnica, pacotes, bibliotecas e soluções de programação.
- \`fetch_web\`: Acessa uma URL web (HTTP/HTTPS) e extrai o conteúdo textual de documentação ou páginas.
- \`graphify\`: Consulta a base de conhecimento do AST e grafo de dependências do código (action: "query", query: "...").
- \`generate_image\`: Sintetiza imagens, fotos, ilustrações ou artes conceituais via rede neural soberana (prompt detalhado em inglês, aspectRatio: "1:1" | "16:9" | "9:16", model: "nano-banana-pro" | "nano-banana" | "nano-banana-lite" | "flux", uncensored: boolean, imagePath?: string para edição Image-to-Image / Img2Img com imagem de referência).
- \`generate_video\`: Gera e renderiza vídeos cinematográficos em alta definição (MP4) animando imagens (Image-to-Video com rotação, zoom ou pan cinematográfico) ou a partir de prompt com áudio e trilha sonora (prompt em inglês, motion: "zoom_in" | "zoom_out" | "rotate" | "pan" | "cinematic", aspectRatio: "1:1" | "16:9" | "9:16", duration: number, withMusic: boolean, imagePath?: string).

AUTONOMIA DE ENGENHARIA SOBERANA (PADRÃO ANTIGRAVITY):
- Você é um programador sênior autônomo. Quando o usuário pedir para criar, modificar, consertar ou debugar um código ou repositório, NÃO fique apenas teorizando ou pedindo permissão a cada passo.
- Inspecione os arquivos relevantes (\`search_code\`, \`read_file\`), aplique as correções necessárias (\`apply_diff\` ou \`write_file\`), valide com comandos de teste (\`run_command\`) e continue iterando autonomamente até o problema estar resolvido e testado.

GERAÇÃO DE MÍDIA & CATÁLOGO OMNISTUDIO (INTERATIVIDADE OBRIGATÓRIA):
- Quando o usuário pedir para gerar uma imagem, vídeo, áudio ou multimídia SEM especificar o modelo (ex: "quero gerar uma foto da lua", "gere uma imagem de um samurai", "crie um vídeo"), NÃO execute a ferramenta às cegas na primeira mensagem.
- Em vez disso, apresente o **Painel do Diretor OmniStudio** com as opções disponíveis para o usuário escolher o motor exato antes de sintetizar:
  1. 🍌 **Google Nano Banana Pro** (Google Flow - Fotorrealismo Máximo & Renderização de Texto)
  2. 🍌 **Google Nano Banana** (Google Flow - Equilíbrio & Consistência Visual)
  3. 🍌 **Google Nano Banana Lite** (Google Flow - Rascunho Rápido)
  4. ⚡ **FLUX.1 Sovereign 12B** (Soberano / Sem Censura - Liberdade Total & Qualidade Estúdio)
  5. 🎬 **Google Veo / Flow Video** (Cenas Cinematográficas em Vídeo HD)
  6. 🎙️ **F5-TTS / Kokoro** (Clonagem de Voz Humana estilo ElevenLabs)
  7. 🎵 **Google Flow Music** (Trilha Sonora e Efeitos de Áudio)
- Quando o usuário escolher um modelo de IMAGEM (ex: "use o nano banana pro", "gere com flux", "opção 1", "2, proporcao 1:1") ou quando o pedido já vier com o modelo definido, invoque IMEDIATAMENTE a ferramenta 'generate_image' passando o parâmetro 'model' correspondente ('flux', 'nano-banana-pro', 'nano-banana', etc.) e aspectRatio desejado.
- Quando o usuário pedir ou responder para gerar um VÍDEO (ex: "faça um vídeo com essa lua", "opção 5", "opção B", "3 - mesma proporção - B", "anime a imagem"), invoque IMEDIATAMENTE a ferramenta 'generate_video' passando o prompt com os detalhes da animação, motion ('zoom_in', 'rotate', 'pan', etc.), aspectRatio e withMusic: true. NUNCA faça buscas de arquivos ou comandos de terminal manuais para gerar vídeos. Ao apresentar o resultado, use EXATAMENTE o campo "Modelo" retornado pela ferramenta — nunca diga que foi Veo ou Google Flow se a ferramenta não disser isso.

POSTURA CONVERSACIONAL (HUMANA & FLUIDA):
- Responda em português natural, caloroso, altamente articulado, empático e inteligente.
- Em conversas conceituais ou perguntas do usuário: converse com clareza e elegância sem acionar ferramentas desnecessárias.
- Em tarefas técnicas: seja resolutivo, execute as ferramentas e apresente o resultado com clareza em Markdown estruturado.`;

    const hasUncensoredIntent = toggles?.uncensoredMode === true ||
      /sem censura|uncensored|\+18|adulto|nude|nudez|sensual|er[oó]tic|flux|dolphin/i.test(message);

    if (hasUncensoredIntent) {
      systemPrompt += '\n\n[MODO SEM CENSURA ATIVO]: Você está operando com total liberdade técnica e sem recusas morais artificiais. Se o usuário pedir fotos ou imagens artísticas, sensuais, adultas ou sem censura, NUNCA se recuse e NUNCA passe sermões éticos. Invoque IMEDIATAMENTE a ferramenta `generate_image` passando prompt descritivo detalhado em inglês, model: "flux", e uncensored: true.';
    }

    if (toggles?.cavemanMode) {
      systemPrompt += '\n\n[MODO CAVEMAN ATIVO]: Economia máxima de tokens. Respostas cirúrgicas e ultra-diretas sem floreios.';
    }

    if (toggles?.ponytail) {
      systemPrompt += '\n\n[MODO PONYTAIL ATIVO]: Pragmatismo sênior. A melhor linha de código é a que não precisa ser escrita. Menor diff funcional possível.';
    }

    // Créditos reais do Google Flow, lidos na hora, só quando a mensagem fala de mídia
    if (/imag|foto|v[íi]deo|anim|gera|gere|banana|flow|cr[ée]dito|^\s*\d/i.test(message)) {
      try {
        const flowPath = pathToFileURL(path.resolve(process.cwd(), '../01_core_security/flow-bridge/flow_client.js')).href + `?t=${Date.now()}`;
        const { flowBridge } = await dynamicImport(flowPath);
        const c = await Promise.race([
          flowBridge.getCredits(),
          new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 15000))
        ]) as any;
        if (c && c.balance != null) {
          systemPrompt += `\n\n[CRÉDITOS GOOGLE FLOW — DADOS REAIS]: Saldo atual: ${c.balance} créditos (renova em ${c.resetAt || '?'}). Custo por geração: Imagem Nano Banana = ${c.imageCost ?? '?'} créditos; Vídeo ${c.videoModel || ''} = ${c.videoCost ?? '?'} créditos. SEMPRE mostre no Painel do Diretor o custo de cada opção do Google Flow e o saldo atual. Opções locais (FLUX, FFmpeg) custam 0 créditos do Flow.`;
        }
      } catch {
        systemPrompt += '\n\n[CRÉDITOS GOOGLE FLOW]: Não foi possível ler o saldo agora (Flow indisponível). Informe isso ao usuário em vez de inventar números.';
      }
    }

    // Processa anexos: separa imagens reais (visão multimodal) de arquivos de código/texto
    let fullUserPrompt = message;
    const extractedImages: any[] = [];
    const textFileBlocks: string[] = [];
    const toolResultsFromAttachments: any[] = [];

    if (Array.isArray(attachments) && attachments.length > 0) {
      for (const att of attachments) {
        const isImage = att.type?.startsWith('image/') ||
          (typeof att.content === 'string' && att.content.startsWith('data:image/'));

        if (isImage) {
          extractedImages.push(att.content);
          let localPath = '';
          try {
            const matches = typeof att.content === 'string' && att.content.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
            if (matches) {
              const fs = await dynamicImport('node:fs');
              const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
              const filename = `upload_${Date.now()}_${Math.random().toString(36).slice(2, 7)}.${ext}`;
              const diskPath = path.resolve(process.cwd(), 'public', 'generated', filename);
              fs.writeFileSync(diskPath, Buffer.from(matches[2], 'base64'));
              localPath = `/generated/${filename}`;
            }
          } catch {}
          toolResultsFromAttachments.push({
            tool: 'attach_image',
            args: { name: att.name, size: att.size || 0, path: localPath },
            result: `Imagem de referência carregada: ${att.name}${localPath ? ` (salva em ${localPath})` : ''}`
          });
        } else {
          toolResultsFromAttachments.push({
            tool: 'attach_file',
            args: { name: att.name, size: att.size || (att.content?.length || 0) },
            result: `Arquivo anexado: ${att.name}`
          });
          textFileBlocks.push(`\n\n--- [ARQUIVO ANEXADO: ${att.name}] ---\n${att.content || ''}\n----------------------------------`);
        }
      }
      fullUserPrompt = `${message}${textFileBlocks.join('')}`;
    }

    // Detecção e auto-carregamento de menções @arquivo (Padrão Antigravity)
    const mentionMatches = message.match(/@([a-zA-Z0-9_\-\.\/\\ ]+\.[a-zA-Z0-9]+)/g);
    if (mentionMatches) {
      const fs = await dynamicImport('node:fs');
      for (const m of mentionMatches) {
        const cleanFile = m.slice(1).trim();
        const candidatePaths = [
          path.resolve(projectRoot, cleanFile),
          path.resolve(cleanFile)
        ];
        for (const p of candidatePaths) {
          if (fs.existsSync(p) && !fs.statSync(p).isDirectory()) {
            try {
              const fileContent = fs.readFileSync(p, 'utf8');
              toolResultsFromAttachments.push({
                tool: 'read_file',
                args: { filePath: cleanFile, isMention: true },
                result: `[MENÇÃO @${cleanFile}]: ${fileContent.split('\n').length} linhas lidas do disco.`
              });
              textFileBlocks.push(`\n\n--- [ARQUIVO @MENCIONADO: ${cleanFile}] ---\n${fileContent.slice(0, 15000)}\n-----------------------------------------`);
              break;
            } catch {}
          }
        }
      }
      fullUserPrompt = `${message}${textFileBlocks.join('')}`;
    }

    // Detecção e auto-carregamento de menções de símbolos AST com # (Padrão Antigravity)
    const symbolMatches = message.match(/#([a-zA-Z0-9_\.]{2,}(?:\(\))?)/g);
    if (symbolMatches) {
      const fs = await dynamicImport('node:fs');
      const v0idRoot = process.cwd().toLowerCase().endsWith('ui-launcher') ? path.resolve(process.cwd(), '..') : process.cwd();
      const graphFile = path.resolve(v0idRoot, 'graphify-out', 'graph.json');
      if (fs.existsSync(graphFile)) {
        try {
          const graphData = JSON.parse(fs.readFileSync(graphFile, 'utf8'));
          if (Array.isArray(graphData.nodes)) {
            for (const sm of symbolMatches) {
              const cleanSym = sm.slice(1).trim().replace(/\(\)$/, '');
              const node = graphData.nodes.find((n: any) => 
                (n.label && n.label.replace(/\(\)$/, '').toLowerCase() === cleanSym.toLowerCase()) ||
                (n.norm_label && n.norm_label === cleanSym.toLowerCase())
              );
              if (node && node.source_file) {
                const srcPath = path.resolve(v0idRoot, node.source_file);
                if (fs.existsSync(srcPath)) {
                  const content = fs.readFileSync(srcPath, 'utf8');
                  toolResultsFromAttachments.push({
                    tool: 'graphify',
                    args: { symbol: node.label, file: node.source_file, location: node.source_location },
                    result: `[SÍMBOLO AST #${node.label}]: Localizado em ${node.source_file} (${node.source_location || 'L1'})`
                  });
                  textFileBlocks.push(`\n\n--- [SÍMBOLO AST #${node.label} (${node.source_file}:${node.source_location || 'L1'})] ---\n${content.slice(0, 10000)}\n---------------------------------------------------------`);
                }
              }
            }
          }
        } catch {}
      }
      fullUserPrompt = `${message}${textFileBlocks.join('')}`;
    }

    // Carrega histórico prévio desta sessão para prover memória multi-turn persistente
    const previousHistory = nexus.getChatMessages(activeProj, activeSession, 40);

    // Salva a mensagem do usuário no banco SQLite persistente
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

    // Slash Command: /project ou /repo (Informa detalhes do repositório local ativo)
    if (message.trim() === '/project' || message.trim() === '/repo' || message.trim() === '/workspace') {
      const fs = await dynamicImport('node:fs');
      const exists = fs.existsSync(projectRoot);
      let fileCount = 0;
      try {
        if (exists) {
          const files = fs.readdirSync(projectRoot);
          fileCount = files.length;
        }
      } catch {}

      const repoReply = `📁 **[WORKSPACE / REPOSITÓRIO LOCAL ATIVO]**

- **Projeto:** **${projectName}** (\`${activeProj}\`)
- **Caminho no Disco:** \`${projectRoot}\`
- **Status do Diretório:** ${exists ? `✅ Ativo no disco (${fileCount} itens na raiz)` : '⚠️ Pasta será criada na primeira escrita'}
- **Escopo do Terminal:** Todas as ferramentas (\`read_file\`, \`write_file\`, \`apply_diff\`, \`run_command\`) estão executando **nesta pasta**.

*Para trocar de projeto ou vincular outra pasta do seu computador, use o seletor no topo do chat.*`;

      try {
        nexus.saveChatMessage({
          projectId: activeProj,
          sessionId: activeSession,
          sender: 'V0id Workspace Core',
          text: repoReply,
          provider: 'V0id Workspace',
          tier: 'Workspace'
        });
      } catch {}

      return sendFinalResponse({
        success: true,
        text: repoReply,
        provider: 'V0id Workspace',
        tier: 'Workspace',
        toolResults: []
      });
    }

    // Slash Command: /git (Execução direta e instantânea de comandos Git no projeto ativo)
    if (message.trim().startsWith('/git')) {
      const gitArgs = message.replace(/^\/git\s*/i, '').trim() || 'status --short';
      const { execSync } = await dynamicImport('node:child_process');
      let gitOutput = '';
      try {
        gitOutput = execSync(`git ${gitArgs}`, { cwd: projectRoot, encoding: 'utf8', timeout: 15000 });
      } catch (err: any) {
        gitOutput = err.stdout || err.stderr || err.message;
      }
      const gitReply = `🌿 **[GIT — ${projectName}]** (\`git ${gitArgs}\`)\n\n\`\`\`bash\n${gitOutput.trim() || 'Comando executado sem alterações ou saída.'}\n\`\`\``;
      try {
        nexus.saveChatMessage({
          projectId: activeProj,
          sessionId: activeSession,
          sender: 'V0id Git Core',
          text: gitReply,
          provider: 'V0id Git',
          tier: 'System'
        });
      } catch {}
      return sendFinalResponse({
        success: true,
        text: gitReply,
        provider: 'V0id Git',
        tier: 'System',
        toolResults: []
      });
    }

    // Slash Command: /rollback (Reverte a última modificação de código de ferramenta instantaneamente)
    if (message.trim().startsWith('/rollback')) {
      try {
        const dynamicImportFunc = new Function('specifier', 'return import(specifier)');
        const toolsPath = pathToFileURL(path.resolve(process.cwd(), '../01_core_security/v0id-cli/tools.js')).href + `?t=${Date.now()}`;
        const { listSnapshots, rollbackSnapshot } = await dynamicImportFunc(toolsPath);
        const snaps = listSnapshots(1);
        if (!snaps || snaps.length === 0) {
          const noSnapReply = `⚠️ **[NENHUM SNAPSHOT REGISTRADO]**: Não há alterações recentes gravadas no disco para reverter.`;
          return sendFinalResponse({ success: true, text: noSnapReply, provider: 'V0id Rollback', tier: 'System', toolResults: [] });
        }
        const lastSnap = snaps[0];
        const resMsg = rollbackSnapshot(lastSnap.id);
        const rollbackReply = `↩️ **[ROLLBACK CONCLUÍDO COM SUCESSO]**\n\n- **Arquivo Restaurado:** \`${lastSnap.fileName}\` (\`${lastSnap.filePath}\`)\n- **Snapshot ID:** \`${lastSnap.id}\`\n\nO arquivo voltou ao estado idêntico ao de antes da modificação.`;
        try {
          nexus.saveChatMessage({
            projectId: activeProj,
            sessionId: activeSession,
            sender: 'V0id Rollback Core',
            text: rollbackReply,
            provider: 'V0id Rollback',
            tier: 'System'
          });
        } catch {}
        return sendFinalResponse({ success: true, text: rollbackReply, provider: 'V0id Rollback', tier: 'System', toolResults: [] });
      } catch (err: any) {
        return sendFinalResponse({ success: false, text: `❌ Erro no rollback: ${err.message}`, provider: 'V0id Rollback', tier: 'System', toolResults: [] });
      }
    }

    // Slash Command: /compact (Compacta o histórico da sessão ativa estilo Antigravity)
    if (message.trim().startsWith('/compact')) {
      const history = nexus.getChatMessages(activeProj, activeSession, 80);
      if (history.length <= 2) {
        const noCompactReply = `ℹ️ **[COMPACTAÇÃO DISPENSADA]**: Esta sessão possui apenas ${history.length} mensagens. O contexto está leve e pronto para continuar.`;
        return sendFinalResponse({
          success: true,
          text: noCompactReply,
          provider: 'V0id Memory Compact',
          tier: 'Memory',
          toolResults: []
        });
      }

      const conversationText = history.map(h => `${h.sender}: ${h.text}`).join('\n\n');
      const compactPrompt = `Você é o Arquivista Executivo do V0id OS.
Analise o histórico completo abaixo da sessão "${activeSession}" do projeto "${projectName}".
Gere um RESUMO EXECUTIVO CONCISO E ESTRUTURADO (padrão Antigravity /compact):
1. **Decisões Técnicas Tomadas:** Escolhas de arquitetura, pacotes e abordagens.
2. **Arquivos Criados/Modificados:** Lista com caminhos exatos.
3. **Estado Atual e Próximos Passos:** O que foi concluído e o que ficou pendente.

Histórico a compactar:
${conversationText.slice(0, 32000)}`;

      const compactRouter = new OmniRouter({ activeProject: activeProj });
      const summaryRes = await compactRouter.route(compactPrompt, { fastResponse: true });
      const summaryText = summaryRes.text || 'Histórico consolidado com sucesso.';

      // Substitui o histórico longo no SQLite pelo sumário executivo
      nexus.db.prepare("DELETE FROM chat_messages WHERE project_id = ? AND session_id = ?").run(activeProj, activeSession);
      const compactFinalText = `📦 **[HISTÓRICO COMPACTADO — SESSÃO CONSOLIDADA]**\n\n${summaryText}\n\n*Memória da sessão compactada com sucesso. O contexto agora está limpo e otimizado para os próximos passos.*`;

      nexus.saveChatMessage({
        projectId: activeProj,
        sessionId: activeSession,
        sender: 'V0id Memory Compact',
        text: compactFinalText,
        provider: summaryRes.providerUsed || 'OmniRoute Fast',
        tier: 'Memory'
      });

      return sendFinalResponse({
        success: true,
        text: compactFinalText,
        provider: summaryRes.providerUsed || 'OmniRoute Fast',
        tier: 'Memory',
        toolResults: []
      });
    }

    // Slash Command: /plan (Planejamento detalhado sem tocar no código antes da aprovação)
    if (message.trim().startsWith('/plan')) {
      const planTopic = message.replace(/^\/plan\s*/i, '').trim();
      systemPrompt += `\n\n[MODO DE PLANEJAMENTO ANTIGRAVITY ATIVO (/plan)]:
O usuário solicitou um plano de execução estruturado para: "${planTopic}".
NÃO execute alterações em arquivos ainda.
Apresente um PLANO DE ENGENHARIA ESTRUTURADO em Markdown contendo:
1. **Objetivo & Escopo:** O que será feito e o que está fora de escopo.
2. **Mapeamento de Arquivos:** Arquivos que serão criados, editados ou inspecionados dentro de "${projectRoot}".
3. **Passo a Passo Técnico:** Ordem lógica de implementação com snippets conceituais.
4. **Validação & Testes:** Comandos para testar e validar a alteração.
Finalize convidando o usuário a dar o OK para você iniciar a execução.`;
    }

    // Se o usuário iniciar com /goal no Chat Global, aciona o Autopilot do V0idAgent
    if (message.trim().startsWith('/goal')) {
      const goalDesc = message.replace(/^\/goal\s*/i, '').trim();
      const goalId = await agent.planGoal(goalDesc);
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

      return sendFinalResponse({
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

    // Loop ReAct Agêntico Autônomo Profundo (até 10 turnos iterativos)
    const MAX_TURNS = 10;
    for (let turn = 0; turn < MAX_TURNS; turn++) {
      const response = await router.route(currentPrompt, {
        forceComplex: toggles?.forceComplex === true,
        tools: chatMode === 'nuvem' ? [] : TOOL_DEFINITIONS,
        systemPrompt: chatMode === 'nuvem'
          ? "Você é o agente Jules na nuvem, conectado remotamente ao GitHub. Como você não possui acesso ao disco local, execute apenas operações git remotas. Seja extremamente eficiente."
          : systemPrompt,
        history: previousHistory,
        images: extractedImages,
        uncensored: toggles?.uncensoredMode === true || hasUncensoredIntent,
        forceAgy: toggles?.forceAgy,
        promptImprover: toggles?.promptImprover !== false,
        cavemanMode: toggles?.cavemanMode === true,
        ponytail: toggles?.ponytail !== false,
        onChunk: isStreaming ? (chunk: string) => emitEvent('delta', { chunk }) : undefined,
        chatMode
      });

      chosenProvider = response.providerUsed || chosenProvider;
      chosenTier = response.tier || chosenTier;
      chosenModel = response.model || chosenModel;
      const responseText = response.text || '';

      // Extrai chamadas de ferramentas nativas ou blocos explícitos
      const toolCalls = agent.parseTools(responseText, response.toolCalls, { tools, allowGhostWrite: false });

      // Se o modelo respondeu sem invocar ferramentas, temos a resposta textual final
      if (toolCalls.length === 0) {
        finalAnswer = responseText;
        break;
      }

      // Executa as ferramentas reais chamadas pelo modelo
      const turnResults: any[] = [];
      for (const tc of toolCalls) {
        if (isAborted) break;
        if (tools[tc.tool]) {
          emitEvent('tool_start', { tool: tc.tool, args: tc.args, turn: turn + 1 });
          try {
            if (tc.tool === 'generate_image') {
              if (toggles?.uncensoredMode || hasUncensoredIntent) {
                tc.args = { ...tc.args, uncensored: true, model: 'flux' };
              }
              // Injeta automaticamente a imagem de referência anexada se for um pedido de edição/transformação
              if (!tc.args.imagePath && extractedImages.length > 0) {
                tc.args.imagePath = extractedImages[0];
              }
            }
            const r = await tools[tc.tool](tc.args);
            emitEvent('tool_end', { tool: tc.tool, args: tc.args, result: r, turn: turn + 1 });
            turnResults.push({ tool: tc.tool, args: tc.args, result: r });
            allToolResults.push({ tool: tc.tool, args: tc.args, result: r });
          } catch (err: any) {
            emitEvent('tool_end', { tool: tc.tool, args: tc.args, error: err.message, turn: turn + 1 });
            turnResults.push({ tool: tc.tool, args: tc.args, error: err.message });
            allToolResults.push({ tool: tc.tool, args: tc.args, error: err.message });
          }
        }
      }

      // Formata os resultados reais do disco para a próxima iteração cognitiva
      const toolSummary = turnResults.map(t => {
        const argStr = JSON.stringify(t.args);
        const resStr = typeof t.result === 'string' ? t.result.slice(0, 4000) : (t.error ? `ERRO: ${t.error}` : JSON.stringify(t.result));
        return `[FERRAMENTA: ${t.tool}(${argStr})]\nRESULTADO:\n${resStr}`;
      }).join('\n\n');

      currentPrompt = `Você invocou as seguintes ferramentas no sistema operacional:
${toolSummary}

PERGUNTA ORIGINAL DO USUÁRIO:
"${message}"

INSTRUÇÃO:
Analise as saídas reais acima. Se você já possui todos os dados para responder ao usuário com perfeição e profundidade, elabore a resposta final estruturada em Markdown. Se ainda faltar algum detalhe específico do disco ou do sistema, faça outra chamada de ferramenta necessária.`;
    }

    let text = finalAnswer;
    const mediaTool = allToolResults.find(t => (t.tool === 'generate_video' || t.tool === 'generate_image') && t.result);

    if (!text) {
      if (mediaTool) {
        text = `✨ **${mediaTool.tool === 'generate_video' ? 'Vídeo cinematográfico renderizado' : 'Imagem sintetizada'} com sucesso pelo V0id OS Core:**\n\n${mediaTool.result}`;
      } else if (allToolResults.length > 0) {
        const lastTool = allToolResults[allToolResults.length - 1];
        text = `Ação executada no sistema: **${lastTool.tool}**\n\n${typeof lastTool.result === 'string' ? lastTool.result : JSON.stringify(lastTool.result, null, 2)}`;
      } else {
        text = 'Operação processada pelo V0id OS Core.';
      }
    }

    // Se o modelo envolveu toda a resposta em bloco de código (ex: ```markdown ... ```), desempacota
    if (/^\s*```(?:markdown)?\s*[\s\S]*```\s*$/i.test(text.trim())) {
      text = text.trim().replace(/^```(?:markdown)?\s*/i, '').replace(/\s*```$/, '').trim();
    }

    // Se imagem ou vídeo foi sintetizado, normaliza URLs e garante renderização visual direta
    if (mediaTool && typeof mediaTool.result === 'string') {
      // 1. Substitui qualquer domínio alucinado (ex: https://v0id-os.com/generated/ -> /generated/)
      text = text.replace(/https?:\/\/[^\/]+\/generated\//g, '/generated/');

      // 2. Localiza a tag markdown oficial gerada pelo motor (ex: ![alt](/generated/...))
      const officialMediaTag = mediaTool.result.match(/!\[.*?\]\(\/generated\/[^\)]+\)/);
      if (officialMediaTag) {
        if (!text.includes(officialMediaTag[0])) {
          // Se o modelo alucinou outro link de imagem no corpo, substitui pelo real
          if (/!\[.*?\]\([^\)]*\/generated\/[^\)]+\)/.test(text)) {
            text = text.replace(/!\[.*?\]\([^\)]*\/generated\/[^\)]+\)/g, officialMediaTag[0]);
          } else {
            text = `${officialMediaTag[0]}\n\n${text}`;
          }
        }
      }
    } else if (text.includes('/generated/') || /!\[.*?\]\([^\)]*\/generated\/[^\)]+\)/i.test(text) || /# Imagem Gerada/i.test(text)) {
      // Resgate: se o modelo faking/alucinou que gerou imagem sem ter invocado a ferramenta
      try {
        const promptForImg = message.replace(/^(?:gere|crie|faça|mostre|desenhe|sintetize)\s+/i, '').trim() || 'artistic digital masterpiece';
        const imgRes = await tools.generate_image({
          prompt: promptForImg,
          uncensored: toggles?.uncensoredMode || hasUncensoredIntent,
          model: 'flux'
        });
        allToolResults.push({ tool: 'generate_image', args: { prompt: promptForImg }, result: imgRes });
        const officialTag = imgRes.match(/!\[.*?\]\(\/generated\/[^\)]+\)/);
        if (officialTag) {
          text = `${officialTag[0]}\n\n${text.replace(/!\[.*?\]\([^\)]+\)/g, '')}`;
        }
      } catch (err: any) {
        console.warn('Fallback generate_image failed:', err.message);
      }
    }

    // Se o modelo respondeu exclusivamente em bloco JSON sem ter sido pedido JSON, converte em Markdown elegante
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

    if (isAborted && !text) {
      text = 'Operação interrompida pelo usuário.';
    }

    if (isStreaming) {
      const chunkSize = 20;
      for (let i = 0; i < text.length; i += chunkSize) {
        if (isAborted) break;
        emitEvent('delta', { chunk: text.slice(i, i + chunkSize) });
        await new Promise(r => setTimeout(r, 12));
      }
      emitEvent('done', {
        success: true,
        text,
        provider: chosenProvider || 'OmniRoute Core',
        tier: chosenTier,
        model: chosenModel,
        toolResults: allToolResults
      });
      return res.end();
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
    if (isStreaming) {
      emitEvent('error', { error: err.message });
      return res.end();
    }
    return res.status(500).json({
      success: false,
      error: err.message,
      provider: 'OmniRoute Error'
    });
  }
}
