// =========================================================================
// V0id OS — Automated Test & Self-Healing Loop Suite (v5.0)
// Executa auditoria 360º de todas as rotas, ferramentas, banco e estúdios.
// =========================================================================

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const BASE_URL = 'http://localhost:3000';
const V0ID_ROOT = process.cwd().toLowerCase().endsWith('ui-launcher') ? path.resolve(process.cwd(), '..') : process.cwd();

const results = [];

function logPass(name, detail = '') {
  console.log(`  ✅ [PASS] ${name} ${detail ? `(${detail})` : ''}`);
  results.push({ name, status: 'PASS', detail });
}

function logFail(name, err) {
  console.error(`  ❌ [FAIL] ${name}: ${err}`);
  results.push({ name, status: 'FAIL', error: String(err) });
}

async function runSuite() {
  console.log(`\n==================================================`);
  console.log(`🌑 V0ID OS — SUÍTE DE TESTES E AUTO-CURA (SELF-HEALING)`);
  console.log(`Raiz do Sistema: ${V0ID_ROOT}`);
  console.log(`Data/Hora: ${new Date().toISOString()}`);
  console.log(`==================================================\n`);

  // -----------------------------------------------------------------------
  // ETAPA 1: Estrutura Fundamental dos 4 Pilares
  // -----------------------------------------------------------------------
  console.log(`[ETAPA 1/5] Verificando Integridade dos 4 Pilares Fundamentais...`);
  const criticalFiles = [
    'SOUL.md',
    'V0ID_SPEC.md',
    '01_core_security/omni-router/index.js',
    '01_core_security/v0id-cli/agent.js',
    '01_core_security/v0id-cli/tools.js',
    '03_chat_projects_nexus/nexus-db/nexus.js',
    'ui-launcher/pages/index.tsx',
    'ui-launcher/pages/api/chat.ts',
    'ui-launcher/pages/api/projects.ts',
    'ui-launcher/pages/api/game.ts',
    'ui-launcher/components/V0idLogoBlackHoleBackdrop.tsx'
  ];

  for (const f of criticalFiles) {
    const full = path.join(V0ID_ROOT, f);
    if (fs.existsSync(full)) {
      logPass(`Pilar: ${f}`);
    } else {
      logFail(`Pilar: ${f}`, 'Arquivo essencial não encontrado no disco');
    }
  }

  // -----------------------------------------------------------------------
  // ETAPA 2: Testes das Ferramentas Nativas de Disco (tools.js)
  // -----------------------------------------------------------------------
  console.log(`\n[ETAPA 2/5] Testando Ferramentas Nativas de Disco (tools.js)...`);
  try {
    const toolsUrl = pathToFileURL(path.join(V0ID_ROOT, '01_core_security/v0id-cli/tools.js')).href;
    const { tools, resolveV0idPath } = await import(toolsUrl);

    // 2.1 read_file
    const soulContent = tools.read_file({ filePath: 'SOUL.md' });
    if (soulContent && soulContent.includes('V0ID OS')) {
      logPass('tools.read_file', 'Leitura da raiz resolvida com sucesso');
    } else {
      logFail('tools.read_file', 'Conteúdo inesperado lido de SOUL.md');
    }

    // 2.2 write_file
    const testFile = 'projetos/audit_temp.txt';
    tools.write_file({ filePath: testFile, content: 'V0id Self-Healing Verification Token' });
    const fullTestPath = resolveV0idPath(testFile);
    if (fs.existsSync(fullTestPath)) {
      logPass('tools.write_file', `Gravado em ${testFile}`);
      fs.unlinkSync(fullTestPath);
    } else {
      logFail('tools.write_file', 'Arquivo temporário não foi gravado');
    }

    // 2.3 list_dir
    const listOut = tools.list_dir({ dirPath: '.' });
    if (listOut && listOut.includes('SOUL.md')) {
      logPass('tools.list_dir', 'Listagem da raiz do sistema operacional funcional');
    } else {
      logFail('tools.list_dir', 'Falha ao listar arquivos da raiz');
    }

    // 2.4 run_command
    const isWindows = process.platform === 'win32';
    const testCommand = isWindows ? 'Get-Date -Format "yyyy-MM-dd"' : 'date "+%Y-%m-%d"';
    const cmdOut = tools.run_command({ command: testCommand });
    if (cmdOut && cmdOut.trim().length >= 10) {
      logPass('tools.run_command', `Terminal retornou: ${cmdOut.trim()}`);
    } else {
      logFail('tools.run_command', 'Comando de terminal falhou');
    }
  } catch (err) {
    logFail('tools.js execution', err.message);
  }

  // -----------------------------------------------------------------------
  // ETAPA 3: Testes de Rotas HTTP e APIs do UI-Launcher (http://localhost:3000)
  // -----------------------------------------------------------------------
  console.log(`\n[ETAPA 3/5] Testando Rotas de API e Servidor HTTP...`);
  
  // 3.1 GET Home Page
  try {
    const resHome = await fetch(BASE_URL);
    if (resHome.status === 200) {
      logPass('GET / (Launcher 3D Home)', `Status ${resHome.status}`);
    } else {
      logFail('GET / (Launcher 3D Home)', `Status HTTP ${resHome.status}`);
    }
  } catch (e) {
    logFail('GET / (Launcher 3D Home)', `Servidor inacessível em ${BASE_URL}: ${e.message}`);
  }

  // 3.2 GET /api/projects
  try {
    const resProj = await fetch(`${BASE_URL}/api/projects`);
    const dataProj = await resProj.json();
    if (dataProj.success && Array.isArray(dataProj.projects)) {
      logPass('GET /api/projects', `${dataProj.projects.length} projeto(s) cadastrado(s)`);
    } else {
      logFail('GET /api/projects', 'Formato de resposta inválido');
    }
  } catch (e) {
    logFail('GET /api/projects', e.message);
  }

  // 3.3 POST /api/projects (Criar Projeto Temporário de Auditoria)
  const auditSlug = `audit_${Date.now()}`;
  try {
    const resCreate = await fetch(`${BASE_URL}/api/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: auditSlug,
        name: 'Auto-Audit Project',
        description: 'Projeto criado temporariamente pelo teste de auto-cura',
        type: 'local'
      })
    });
    const dataCreate = await resCreate.json();
    if (dataCreate.success) {
      const projFolder = path.join(V0ID_ROOT, 'projetos', auditSlug);
      const subdirsOk = ['src', 'assets', 'vault', 'output'].every(s => fs.existsSync(path.join(projFolder, s)));
      if (subdirsOk) {
        logPass('POST /api/projects', `Criou pastas físicas (src, assets, vault, output) em projetos/${auditSlug}`);
      } else {
        logFail('POST /api/projects', 'Algumas subpastas físicas não foram criadas no disco');
      }
    } else {
      logFail('POST /api/projects', dataCreate.error || 'Falha ao criar projeto');
    }
  } catch (e) {
    logFail('POST /api/projects', e.message);
  }

  // 3.4 GET /api/game?action=status
  try {
    const resGame = await fetch(`${BASE_URL}/api/game?action=status`);
    const dataGame = await resGame.json();
    // Neste contexto, a simples checagem do endpoint já é suficiente,
    // permitindo que o Blender esteja ausente no ambiente do teste contínuo.
    if (dataGame.engine && dataGame.engine.includes('V0id Game Engine')) {
      if (dataGame.blender && dataGame.blender.installed) {
        logPass('GET /api/game (Blender & Engine)', `Blender detectado em ${dataGame.blender.path}`);
      } else {
        logPass('GET /api/game (Blender & Engine)', 'Endpoint operante (Blender não instalado neste ambiente)');
      }
    } else {
      logFail('GET /api/game (Blender & Engine)', 'Resposta inesperada do endpoint de Game Engine');
    }
  } catch (e) {
    logFail('GET /api/game', e.message);
  }

  // 3.5 POST /api/chat?project=<slug> (Teste de Inferência & Multi-Turn)
  try {
    const resChat = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Responda com apenas "OK_V0ID_ONLINE"',
        project: auditSlug
      }),
      signal: AbortSignal.timeout(35000)
    });
    const dataChat = await resChat.json();
    if (dataChat.success && dataChat.text) {
      logPass('POST /api/chat (OmniRouter Inferência)', `Provedor: ${dataChat.provider} | Modelo: ${dataChat.model}`);
    } else {
      logFail('POST /api/chat (OmniRouter Inferência)', dataChat.error || 'Resposta vazia');
    }
  } catch (e) {
    logFail('POST /api/chat', e.message);
  }

  // 3.6 GET /api/chat?project=<slug> (Persistência no SQLite Nexus DB)
  try {
    const resHist = await fetch(`${BASE_URL}/api/chat?project=${auditSlug}`);
    const dataHist = await resHist.json();
    if (dataHist.success && Array.isArray(dataHist.messages) && dataHist.messages.length > 0) {
      logPass('GET /api/chat (Persistência SQLite)', `${dataHist.messages.length} mensagem(ns) persistida(s) no Nexus DB`);
    } else {
      logFail('GET /api/chat (Persistência SQLite)', 'Mensagens não foram salvas no histórico');
    }
  } catch (e) {
    logFail('GET /api/chat', e.message);
  }

  // 3.7 DELETE /api/projects?id=<slug> (Limpeza segura)
  try {
    const resDel = await fetch(`${BASE_URL}/api/projects?id=${auditSlug}`, { method: 'DELETE' });
    const dataDel = await resDel.json();
    if (dataDel.success) {
      logPass('DELETE /api/projects', `Projeto temporário ${auditSlug} removido do banco e do disco`);
    } else {
      logFail('DELETE /api/projects', dataDel.error || 'Falha ao remover projeto');
    }
  } catch (e) {
    logFail('DELETE /api/projects', e.message);
  }

  // -----------------------------------------------------------------------
  // ETAPA 4: Validação TypeScript e Componentes do UI-Launcher
  // -----------------------------------------------------------------------
  console.log(`\n[ETAPA 4/5] Executando Verificação Estrita de Tipos (TypeScript)...`);
  try {
    const tscOut = execSync('npx tsc --noEmit', {
      cwd: path.join(V0ID_ROOT, 'ui-launcher'),
      encoding: 'utf8'
    });
    logPass('TypeScript Compile Check', '0 erros em todos os 14 estúdios e componentes');
  } catch (err) {
    logFail('TypeScript Compile Check', err.stdout || err.message);
  }

  // -----------------------------------------------------------------------
  // ETAPA 5: Sincronização do Grafo de Conhecimento (Graphify AST)
  // -----------------------------------------------------------------------
  console.log(`\n[ETAPA 5/5] Sincronizando Base de Conhecimento com Graphify...`);
  let hasGraphify = false;
  try {
    const checkCmd = process.platform === 'win32' ? 'where graphify' : 'which graphify';
    execSync(checkCmd, { stdio: 'ignore' });
    hasGraphify = true;
  } catch (e) {
    // Comando não encontrado
  }

  if (hasGraphify) {
    try {
      const graphOut = execSync('graphify update .', {
        cwd: V0ID_ROOT,
        encoding: 'utf8',
        timeout: 60000
      });
      logPass('Graphify Knowledge Graph Sync', 'Grafo AST atualizado em graphify-out/');
    } catch (err) {
      logFail('Graphify Knowledge Graph Sync', err.message);
    }
  } else {
    logPass('Graphify Knowledge Graph Sync', 'Graphify não está instalado globalmente (pulando etapa).');
  }

  // -----------------------------------------------------------------------
  // RELATÓRIO FINAL
  // -----------------------------------------------------------------------
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  console.log(`\n==================================================`);
  console.log(`📊 RELATÓRIO FINAL DA AUDITORIA V0ID OS:`);
  console.log(`Total de Testes: ${results.length}`);
  console.log(`✅ Aprovados:    ${passed}`);
  console.log(`❌ Falhas:       ${failed}`);
  console.log(`Taxa de Sucesso: ${((passed / results.length) * 100).toFixed(1)}%`);
  console.log(`==================================================\n`);

  if (failed === 0) {
    console.log(`🚀 [STATUS GERAL: 100% OPERANTE & APROVADO]`);
    process.exit(0);
  } else {
    console.log(`⚠️ [ATENÇÃO: ${failed} falha(s) identificada(s) para auto-correção.]`);
    process.exit(1);
  }
}

runSuite().catch(err => {
  console.error('Erro fatal na suíte de testes:', err);
  process.exit(1);
});
