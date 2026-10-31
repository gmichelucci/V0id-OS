// =========================================================================
// V0id OS — Google Flow Setup Launcher (Edge Soberano)
// Inicializa o Microsoft Edge com perfil dedicado em C:\V0id\.flow_browser
// e porta de depuração CDP 9222 para login e sincronização do Google Pro.
// =========================================================================

import path from 'node:path';
import fs from 'node:fs';
import { spawn } from 'node:child_process';

const EDGE_PATHS = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
];

const EDGE_PATH = EDGE_PATHS.find(p => fs.existsSync(p));
const PROFILE_DIR = path.resolve(process.cwd().includes('ui-launcher') ? '..' : '.', '.flow_browser');
const FLOW_URL = 'https://flow.google.com/';
const PORT = 9222;

if (!EDGE_PATH) {
  console.error('[ERRO] Executável do Microsoft Edge não encontrado nos caminhos padrão.');
  process.exit(1);
}

if (!fs.existsSync(PROFILE_DIR)) {
  fs.mkdirSync(PROFILE_DIR, { recursive: true });
}

console.log('================================================================');
console.log('⚡ V0ID OS — CONFIGURAÇÃO DO GOOGLE FLOW & NANO BANANA (EDGE)');
console.log('================================================================');
console.log(`📁 Perfil Soberano Isolado: ${PROFILE_DIR}`);
console.log(`🌐 Porta de Depuração CDP:  http://localhost:${PORT}`);
console.log(`🔗 Abrindo URL:             ${FLOW_URL}`);
console.log('----------------------------------------------------------------');
console.log('INSTRUÇÕES RÁPIDAS:');
console.log('1. A janela do Microsoft Edge será aberta na tela agora.');
console.log('2. Faça o login na sua conta Google onde você tem o Google Pro.');
console.log('3. Crie ou abra um projeto chamado "V0id OS" para seus assets.');
console.log('4. Seus cookies e sessão ficarão salvos PERMANENTEMENTE nesta pasta.');
console.log('   (O V0id nunca mais pedirá para você logar novamente).');
console.log('================================================================\n');

const child = spawn(EDGE_PATH, [
  `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${PROFILE_DIR}`,
  '--no-sandbox',
  '--no-first-run',
  '--no-default-browser-check',
  '--disable-sync',
  '--disable-component-update',
  FLOW_URL
], {
  detached: true,
  stdio: 'ignore'
});

child.unref();

console.log('✅ Janela do Edge iniciada com sucesso!');
console.log('Após realizar o login e criar o projeto "V0id OS", você pode fechar a janela ou deixá-la aberta.');
process.exit(0);
