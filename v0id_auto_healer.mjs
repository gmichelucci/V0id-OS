// =========================================================================
// V0id OS — Active Self-Healing Code Mutator (Motor de Auto-Cura de Código)
// Recebe diagnósticos visuais e de interação E2E, sintetiza melhorias reais
// no código via OmniRoute, valida rigorosamente e comita com segurança.
// =========================================================================

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const V0ID_ROOT = process.cwd().toLowerCase().endsWith('ui-launcher')
  ? path.resolve(process.cwd(), '..')
  : process.cwd();

export const STUDIO_COMPONENT_MAP = {
  'home': 'ui-launcher/pages/index.tsx',
  'chat': 'ui-launcher/components/studios/GlobalChatView.tsx',
  'core': 'ui-launcher/components/studios/CoreSoulView.tsx',
  'auto-forge': 'ui-launcher/components/studios/AutoForgeView.tsx',
  'security': 'ui-launcher/components/studios/SecurityView.tsx',
  'plugins': 'ui-launcher/components/studios/PluginsMcpAuditView.tsx',
  'rules': 'ui-launcher/components/studios/PluginsRulesView.tsx',
  'automations': 'ui-launcher/components/studios/AutomationsView.tsx',
  'repository': 'ui-launcher/components/studios/RepositoryView.tsx',
  'code': 'ui-launcher/components/studios/CodeGameStudioView.tsx',
  'game': 'ui-launcher/components/studios/GameStudioEngineView.tsx',
  'omnimedia': 'ui-launcher/components/studios/OmniMediaStudioView.tsx',
  'research': 'ui-launcher/components/studios/ResearchStudioView.tsx',
  'marketing': 'ui-launcher/components/studios/MarketingAgencyView.tsx',
  'finances': 'ui-launcher/components/studios/ExecutiveStudioView.tsx'
};

function runValidation() {
  // 1. TypeScript Check
  const tsRes = spawnSync('npx', ['tsc', '--noEmit'], {
    cwd: path.join(V0ID_ROOT, 'ui-launcher'),
    shell: true,
    windowsHide: true,
    stdio: 'pipe',
    timeout: 45000
  });
  if (tsRes.status !== 0) {
    return { ok: false, stage: 'typescript', error: (tsRes.stderr || tsRes.stdout || '').slice(-300) };
  }

  // 2. 24-point test suite check
  const suiteRes = spawnSync('node', [path.join(V0ID_ROOT, 'v0id_self_healing_suite.mjs')], {
    cwd: V0ID_ROOT,
    windowsHide: true,
    stdio: 'pipe',
    timeout: 60000
  });
  if (suiteRes.status !== 0) {
    return { ok: false, stage: 'test_suite', error: (suiteRes.stderr || suiteRes.stdout || '').slice(-300) };
  }

  return { ok: true };
}

export async function runSelfHealing(defects = [], onProgress) {
  const log = (msg) => {
    console.log(msg);
    if (typeof onProgress === 'function') onProgress(msg);
  };

  log(`\n==================================================`);
  log(`🛠️ V0ID OS — MOTOR DE AUTO-CURA ATIVA E REFATORAÇÃO`);
  log(`Defeitos identificados para cura: ${defects.length}`);
  log(`==================================================\n`);

  if (!defects || defects.length === 0) {
    log(`  ✨ Nenhum defeito crítico pendente. Sistema em 100% de harmonia.`);
    return { healedCount: 0, items: [] };
  }

  const omniRouterPath = pathToFileURL(path.join(V0ID_ROOT, '01_core_security/omni-router/index.js')).href;
  const { OmniRouter, loadEnv } = await import(omniRouterPath);
  loadEnv();
  const router = new OmniRouter({ activeProject: 'global' });

  const healedItems = [];

  for (const defect of defects.slice(0, 3)) { // Limite prudente de até 3 mutações por ciclo
    const sceneId = defect.scene || defect.id;
    const relFile = STUDIO_COMPONENT_MAP[sceneId];
    if (!relFile) continue;

    const absFile = path.join(V0ID_ROOT, relFile);
    if (!fs.existsSync(absFile)) continue;

    log(`  🔧 Iniciando auto-cura para estúdio [${sceneId}] (${relFile})...`);
    const originalContent = fs.readFileSync(absFile, 'utf8');

    const prompt = `Você é o Engenheiro Especialista em Auto-Cura do V0id OS.
O auditor visual/interativo detectou o seguinte defeito no estúdio "${sceneId}":
${defect.description || defect.analysis || JSON.stringify(defect)}

Aqui está o código fonte de ${relFile}:
\`\`\`tsx
${originalContent}
\`\`\`

Gere uma substituição cirúrgica precisa no código para corrigir o defeito (ex: corrigir overflow, adicionar truncate, ajustar alinhamento ou classe CSS).
Responda EXCLUSIVAMENTE em formato JSON puro, sem markdown ao redor, seguindo o esquema:
{
  "target": "trecho exato existente no código a ser substituído",
  "replacement": "novo trecho corrigido",
  "explanation": "resumo de 1 frase da melhoria aplicada"
}`;

    try {
      const res = await router.route(prompt, {
        forceComplex: true,
        systemPrompt: 'Você é um gerador determinístico de diffs cirúrgicos de código em JSON puro.'
      });

      const rawText = (res.text || '').replace(/^```(json)?/m, '').replace(/```$/m, '').trim();
      const match = rawText.match(/\{[\s\S]*\}/);
      if (!match) {
        log(`  ⚠️ Não foi possível interpretar o diff JSON gerado pela IA.`);
        continue;
      }

      const patch = JSON.parse(match[0]);
      if (!patch.target || !patch.replacement || !originalContent.includes(patch.target)) {
        log(`  ⚠️ O trecho alvo (target) não foi encontrado no arquivo de forma idêntica.`);
        continue;
      }

      // Aplica a mutação
      const patchedContent = originalContent.replace(patch.target, patch.replacement);
      fs.writeFileSync(absFile, patchedContent, 'utf8');
      log(`  📝 Mutação aplicada temporariamente em ${relFile}. Validando TypeScript & Testes...`);

      // Validação estrita
      const validation = runValidation();
      if (validation.ok) {
        log(`  ✅ [AUTO-CURA APROVADA] ${patch.explanation || 'Melhoria de layout validada com 100% de sucesso.'}`);
        healedItems.push({
          scene: sceneId,
          file: relFile,
          explanation: patch.explanation
        });
      } else {
        log(`  ❌ Validação falhou (${validation.stage}). Revertendo alteração por segurança...`);
        fs.writeFileSync(absFile, originalContent, 'utf8');
      }
    } catch (err) {
      log(`  ⚠️ Exceção durante auto-cura de ${sceneId}: ${err.message}`);
      fs.writeFileSync(absFile, originalContent, 'utf8');
    }
  }

  log(`\n🎉 Ciclo de Auto-Cura concluído: ${healedItems.length} melhoria(s) aplicada(s) com sucesso.\n`);
  return { healedCount: healedItems.length, items: healedItems };
}
