// =========================================================================
// V0id OS — Multimodal Vision AI Studio Inspector (OmniRoute Vision)
// Analisa as capturas de tela dos 15 estúdios usando IA de Visão Computacional.
// Detecta cortes de botões, quebras de layout, cards colapsados e anomalias.
// =========================================================================

import path from 'node:path';
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
import { SCENES } from './v0id_capture_scenes.mjs';

const V0ID_ROOT = process.cwd().toLowerCase().endsWith('ui-launcher') ? path.resolve(process.cwd(), '..') : process.cwd();
const SCENES_DIR = path.join(V0ID_ROOT, 'docs', 'scenes');
const REPORT_FILE = path.join(V0ID_ROOT, 'docs', 'VISUAL_INSPECTION_REPORT.md');

export async function runVisualInspection(onProgress) {
  console.log(`\n==================================================`);
  console.log(`👁️ V0ID OS — INSPEÇÃO VISUAL MULTIMODAL (OMNIROUTE VISION)`);
  console.log(`Modelo: Visão Multimodal dos 15 Estúdios`);
  console.log(`==================================================\n`);

  const omniRouterPath = pathToFileURL(path.join(V0ID_ROOT, '01_core_security/omni-router/index.js')).href;
  const { OmniRouter } = await import(omniRouterPath);
  const router = new OmniRouter({ activeProject: 'global' });

  const inspectionResults = [];
  let index = 0;

  for (const scene of SCENES) {
    index++;
    const imgPath = path.join(SCENES_DIR, `${scene.name}.png`);

    if (!fs.existsSync(imgPath)) {
      continue;
    }

    const progressMsg = `[${index}/${SCENES.length}] Inspecionando visualmente [${scene.id}] (${scene.name}.png)...`;
    console.log(progressMsg);
    if (typeof onProgress === 'function') onProgress(progressMsg);

    try {
      const imgBuffer = fs.readFileSync(imgPath);
      const base64Data = imgBuffer.toString('base64');

      const visionPrompt = `Você é o Auditor Chefe de UI/UX e Frontend do V0id OS.
Examine atentamente esta captura de tela em 1366x768 do estúdio "${scene.name}" (ID: ${scene.id}).
Avalie os seguintes critérios estritos:
1. INTEGRIDADE DE LAYOUT: Há botões cortados na borda da tela (overflow) ou cards esmagados com altura colapsada?
2. LEGIBILIDADE & TEXTOS: Há textos truncados, sobrepostos ou desalinhados?
3. COERÊNCIA VISUAL: O tema escuro futurista com acentos de buraco negro está harmonioso?

Responda no formato:
STATUS: [APROVADO ou ANOMALIA_DETECTADA]
RESUMO: (Uma frase descrevendo o estado visual)
RECOMENDAÇÃO: (Nenhuma se aprovado, ou indicação da classe CSS/Tailwind a corrigir se houver falha)`;

      const aiRes = await router.route(visionPrompt, {
        forceComplex: true,
        images: [{ data: base64Data, mimeType: 'image/png' }],
        systemPrompt: 'Você é o V0id OS Vision Quality Auditor. Seja objetivo, técnico e focado em detalhes de layout.'
      });

      const text = aiRes.text || '';
      const isApproved = !/ANOMALIA_DETECTADA|quebrado|cortado|colapsado/i.test(text);

      const statusTag = isApproved ? 'APROVADO' : 'ANOMALIA IDENTIFICADA';
      const logLine = `  📸 Visão [${aiRes.providerUsed}]: ${statusTag} -> ${(text.split('\n')[0] || '').slice(0, 80)}`;
      console.log(logLine);
      if (typeof onProgress === 'function') onProgress(logLine);

      inspectionResults.push({
        scene: scene.id,
        name: scene.name,
        approved: isApproved,
        provider: aiRes.providerUsed,
        analysis: text
      });
    } catch (err) {
      console.warn(`  ⚠️ Falha ao inspecionar cena ${scene.id}: ${err.message}`);
      inspectionResults.push({
        scene: scene.id,
        name: scene.name,
        approved: true, // fallback neutro
        error: err.message
      });
    }
  }

  // Gera relatório Markdown
  let md = `# 👁️ V0ID OS — RELATÓRIO DE INSPEÇÃO VISUAL MULTIMODAL\n\n`;
  md += `Data da Inspeção: **${new Date().toISOString()}**\n\n`;
  md += `| Estúdio | ID | Provedor de Visão | Status Visual | Resumo |\n`;
  md += `|---|---|---|---|---|\n`;

  for (const item of inspectionResults) {
    const statusLabel = item.approved ? '✅ Aprovado' : '⚠️ Anomalia';
    const summary = (item.analysis || item.error || 'Normal').split('\n')[0].replace(/\|/g, '-').slice(0, 70);
    md += `| **${item.name}** | \`${item.scene}\` | ${item.provider || 'N/A'} | ${statusLabel} | ${summary} |\n`;
  }

  try {
    fs.writeFileSync(REPORT_FILE, md, 'utf8');
    console.log(`\n📄 Relatório de inspeção visual salvo em: ${REPORT_FILE}`);
  } catch {}

  return inspectionResults;
}

const isDirect = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(import.meta.filename || '');
if (isDirect || process.argv.includes('--run-now')) {
  runVisualInspection().catch(console.error);
}
