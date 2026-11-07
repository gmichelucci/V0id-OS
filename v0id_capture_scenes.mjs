// =========================================================================
// V0id OS — Studio Scene Visual Mapper (Edge Headless)
// Captura fotos e mapeia visualmente todos os 14 estúdios e o Launcher 3D.
// =========================================================================

import path from 'node:path';
import fs from 'node:fs';
import { EdgeCDPClient } from './v0id_interactive_tester.mjs';

const V0ID_ROOT = process.cwd().toLowerCase().endsWith('ui-launcher') ? path.resolve(process.cwd(), '..') : process.cwd();
const OUTPUT_DIR = path.join(V0ID_ROOT, 'docs', 'scenes');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

export const SCENES = [
  { id: 'home', name: '00_v0id_launcher_3d', url: 'http://localhost:3000' },
  { id: 'chat', name: '01_chat_global', url: 'http://localhost:3000/?studio=chat' },
  { id: 'core', name: '02_core_soul', url: 'http://localhost:3000/?studio=core' },
  { id: 'auto-forge', name: '03_auto_forge', url: 'http://localhost:3000/?studio=auto-forge' },
  { id: 'security', name: '04_security_sandbox', url: 'http://localhost:3000/?studio=security' },
  { id: 'plugins', name: '05_plugins_mcp', url: 'http://localhost:3000/?studio=plugins' },
  { id: 'rules', name: '06_rules_system', url: 'http://localhost:3000/?studio=rules' },
  { id: 'automations', name: '07_automations_n8n', url: 'http://localhost:3000/?studio=automations' },
  { id: 'repository', name: '08_repository_hub', url: 'http://localhost:3000/?studio=repository' },
  { id: 'code', name: '09_code_studio', url: 'http://localhost:3000/?studio=code' },
  { id: 'game', name: '10_game_engine', url: 'http://localhost:3000/?studio=game' },
  { id: 'omnimedia', name: '11_omnimedia_studio', url: 'http://localhost:3000/?studio=omnimedia' },
  { id: 'research', name: '12_research_studio', url: 'http://localhost:3000/?studio=research' },
  { id: 'marketing', name: '13_marketing_agency', url: 'http://localhost:3000/?studio=marketing' },
  { id: 'finances', name: '14_finances_caixa', url: 'http://localhost:3000/?studio=finances' }
];

export async function captureAllScenes(onProgress) {
  console.log(`\n==================================================`);
  console.log(`📸 V0ID OS — CAPTURANDO CENAS VISUAIS DE TODOS OS ESTÚDIOS`);
  console.log(`Navegador: Edge Headless (DevTools Protocol Nativo CDP)`);
  console.log(`Destino: ${OUTPUT_DIR}`);
  console.log(`==================================================\n`);

  const manifest = [];
  const client = new EdgeCDPClient(9228);

  try {
    await client.start();
    let index = 0;

    for (const scene of SCENES) {
      index++;
      const outFile = path.join(OUTPUT_DIR, `${scene.name}.png`);
      const statusMsg = `[${index}/${SCENES.length}] Capturando cena [${scene.id}] -> ${scene.name}.png...`;
      if (typeof onProgress === 'function') {
        onProgress(statusMsg);
      } else {
        console.log(statusMsg);
      }

      try {
        await client.navigate(scene.url);
        // Aguarda hidratação do React para montar a tela do estúdio correspondente
        await new Promise(r => setTimeout(r, 1400));

        const shot = await client.send('Page.captureScreenshot', { format: 'png' }, 10000);
        if (shot && shot.data) {
          fs.writeFileSync(outFile, Buffer.from(shot.data, 'base64'));
          const stats = fs.statSync(outFile);
          const okMsg = `  ✅ Capturado com sucesso! (${(stats.size / 1024).toFixed(1)} KB)`;
          if (typeof onProgress === 'function') {
            onProgress(okMsg);
          } else {
            console.log(okMsg);
          }
          manifest.push({ ...scene, file: outFile, sizeKB: (stats.size / 1024).toFixed(1), ok: true });
        } else {
          throw new Error('CDP não retornou dados de imagem');
        }
      } catch (err) {
        console.error(`  ❌ Erro ao capturar cena ${scene.id}: ${err.message}`);
        manifest.push({ ...scene, ok: false, error: err.message });
      }
    }
  } finally {
    await client.close();
  }

  // Gera um índice visual em Markdown
  try {
    const sceneMdPath = path.join(V0ID_ROOT, 'docs', 'SCENES_INDEX.md');
    let mdContent = `# 🌑 V0ID OS — MAPA VISUAL DAS CENAS E ESTÚDIOS\n\n`;
    mdContent += `Mapeamento autônomo executado em: **${new Date().toISOString()}**\n\n`;
    mdContent += `| Estúdio | ID | Arquivo de Captura | Tamanho |\n`;
    mdContent += `|---|---|---|---|\n`;

    for (const item of manifest) {
      const fileName = path.basename(item.file || '');
      mdContent += `| **${item.name}** | \`${item.id}\` | [${fileName}](./scenes/${fileName}) | ${item.sizeKB || 0} KB |\n`;
    }

    fs.writeFileSync(sceneMdPath, mdContent, 'utf8');
    console.log(`\n📄 Índice visual gerado em: ${sceneMdPath}`);
  } catch (err) {
    console.warn(`  ⚠️ Aviso ao gravar SCENES_INDEX.md: ${err.message}`);
  }

  return manifest;
}

const isDirect = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(import.meta.filename || '');
if (isDirect) {
  captureAllScenes().catch(console.error);
}
