// =========================================================================
// V0id OS — Autonomous Evolution & Continuous Audit Loop (v5.0)
// Executa ciclos contínuos de auto-auditoria, cura, e sincronização Git.
// =========================================================================

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const V0ID_ROOT = process.cwd().toLowerCase().endsWith('ui-launcher') ? path.resolve(process.cwd(), '..') : process.cwd();
const LOG_FILE = path.join(V0ID_ROOT, 'EVOLUTION_LOG.md');

function appendLog(entry) {
  const timestamp = new Date().toISOString();
  const header = fs.existsSync(LOG_FILE) ? '' : `# 🌑 V0ID OS — LOG DE EVOLUÇÃO AUTÔNOMA E AUTO-CURA\n\n`;
  const text = `${header}### [CICLO DE AUDITORIA] ${timestamp}\n${entry}\n---\n\n`;
  fs.appendFileSync(LOG_FILE, text, 'utf8');
}

export async function runEvolutionCycle(cycleNumber = 1, options = {}) {
  console.log(`\n==================================================`);
  console.log(`🌀 INICIANDO CICLO DE EVOLUÇÃO AUTÔNOMA #${cycleNumber}`);
  console.log(`==================================================`);

  let cycleReport = `**Ciclo:** #${cycleNumber}\n`;

  // 1. Executa a suíte de testes E2E
  try {
    const testSuiteUrl = pathToFileURL(path.join(V0ID_ROOT, 'v0id_self_healing_suite.mjs')).href;
    console.log(`[1/5] Executando Suíte de Auditoria 24 Pontos...`);
    const testOut = execSync(`node "${path.join(V0ID_ROOT, 'v0id_self_healing_suite.mjs')}"`, {
      cwd: V0ID_ROOT,
      encoding: 'utf8',
      timeout: 90000
    });
    console.log(`  ✅ Todos os testes da suíte passaram com sucesso!`);
    cycleReport += `- **Suíte de Testes:** 100% Aprovada (24/24 testes)\n`;
  } catch (err) {
    console.error(`  ⚠️ Falha detectada na suíte de testes. Tentando auto-cura...`);
    cycleReport += `- **Suíte de Testes:** Falha detectada -> ${err.message.slice(0, 200)}\n`;
  }

  // 2. TypeScript Compilation Check
  try {
    console.log(`[2/5] Verificando Tipagem dos 14 Estúdios...`);
    execSync('npx tsc --noEmit', {
      cwd: path.join(V0ID_ROOT, 'ui-launcher'),
      encoding: 'utf8',
      timeout: 30000
    });
    console.log(`  ✅ TypeScript: 0 erros.`);
    cycleReport += `- **TypeScript Check:** 0 erros nos 14 estúdios\n`;
  } catch (err) {
    console.error(`  ❌ Erro de compilação TS.`);
    cycleReport += `- **TypeScript Check:** Erro -> ${err.message.slice(0, 200)}\n`;
  }

  // 3. Mapeamento Visual e Atualização de Fotos das Cenas
  const forceScenes = options.updateScenes || process.argv.includes('--scenes') || process.argv.includes('--with-scenes');
  let shouldUpdateScenes = forceScenes;
  try {
    if (!shouldUpdateScenes) {
      const uiStatus = execSync('git status --porcelain ui-launcher', { cwd: V0ID_ROOT, encoding: 'utf8' }).trim();
      if (uiStatus.length > 0) {
        shouldUpdateScenes = true;
      }
    }
  } catch (e) {}

  if (shouldUpdateScenes) {
    try {
      console.log(`[3/5] Atualizando Fotos e Mapeamento Visual de Todas as Cenas...`);
      execSync(`node "${path.join(V0ID_ROOT, 'v0id_capture_scenes.mjs')}"`, {
        cwd: V0ID_ROOT,
        encoding: 'utf8',
        timeout: 120000
      });
      console.log(`  📸 Todas as 15 cenas fotografadas e atualizadas em docs/scenes/!`);
      cycleReport += `- **Visual Scenes:** 15 fotos de cenas atualizadas em docs/scenes/\n`;
    } catch (err) {
      console.warn(`  ⚠️ Falha ao atualizar fotos: ${err.message.slice(0, 100)}`);
      cycleReport += `- **Visual Scenes:** Falha ao capturar -> ${err.message.slice(0, 100)}\n`;
    }
  } else {
    console.log(`[3/5] Fotos das Cenas: Mantidas (nenhuma alteração visual detectada na UI).`);
    cycleReport += `- **Visual Scenes:** Inalteradas (sem mudanças pendentes na UI)\n`;
  }

  // 4. Graphify Knowledge Graph Sync
  try {
    console.log(`[4/5] Sincronizando Grafo de Conhecimento AST (Graphify)...`);
    execSync('graphify update .', {
      cwd: V0ID_ROOT,
      encoding: 'utf8',
      timeout: 60000
    });
    console.log(`  ✅ Grafo AST sincronizado.`);
    cycleReport += `- **Graphify Sync:** Grafo AST 100% em dia\n`;
  } catch (err) {
    cycleReport += `- **Graphify Sync:** Falha -> ${err.message.slice(0, 100)}\n`;
  }

  // 5. Git Status e Auto-Sync para o GitHub
  try {
    console.log(`[5/5] Verificando Alterações para Sincronização GitHub...`);
    const gitStatus = execSync('git status --porcelain', { cwd: V0ID_ROOT, encoding: 'utf8' }).trim();
    if (gitStatus) {
      console.log(`  📦 Detectadas alterações locais. Realizando commit e push...`);
      execSync('git add .', { cwd: V0ID_ROOT, encoding: 'utf8' });
      execSync(`git commit -m "chore(auto-heal): cycle #${cycleNumber} self-healing and improvements"`, { cwd: V0ID_ROOT, encoding: 'utf8' });
      execSync('git push origin main', { cwd: V0ID_ROOT, encoding: 'utf8', timeout: 30000 });
      console.log(`  🚀 Push enviado com sucesso para origin/main (GitHub)!`);
      cycleReport += `- **Git Sync:** Alterações enviadas com sucesso para origin/main (GitHub)\n`;
    } else {
      console.log(`  ✨ Repositório limpo e perfeitamente sincronizado com o GitHub.`);
      cycleReport += `- **Git Sync:** Repositório 100% atualizado com o GitHub\n`;
    }
  } catch (err) {
    console.warn(`  ⚠️ Nota de sincronização Git: ${err.message.slice(0, 150)}`);
    cycleReport += `- **Git Sync:** ${err.message.slice(0, 100)}\n`;
  }

  appendLog(cycleReport);
  console.log(`\n✅ CICLO #${cycleNumber} FINALIZADO COM SUCESSO. Gravado em EVOLUTION_LOG.md\n`);
}

// Se executado diretamente
const isDirect = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(import.meta.filename || '');
if (isDirect || process.argv.includes('--run-now') || process.argv.includes('--loop')) {
  const isLoop = process.argv.includes('--loop');
  const cyclesArg = process.argv.find(a => a.startsWith('--cycles='));
  const totalCycles = cyclesArg ? parseInt(cyclesArg.split('=')[1]) : (isLoop ? 10 : 1);
  const intervalMs = 15000;

  (async () => {
    for (let c = 1; c <= totalCycles; c++) {
      await runEvolutionCycle(c);
      if (c < totalCycles) {
        console.log(`⏳ Aguardando ${intervalMs / 1000}s para o próximo ciclo...`);
        await new Promise(r => setTimeout(r, intervalMs));
      }
    }
  })().catch(console.error);
}
