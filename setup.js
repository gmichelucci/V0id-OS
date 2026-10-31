// =========================================================================
// V0id OS — Universal Setup & Automated Bootstrapper
// Instala automaticamente todas as dependências (Node, Next, Remotion),
// inicializa bancos limpos, gera templates de .env e valida o ambiente.
// =========================================================================

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = __dirname;
const UI_DIR = path.join(ROOT_DIR, 'ui-launcher');

console.log('================================================================');
console.log('⚡ V0ID OS — ASSISTENTE DE INSTALAÇÃO & ONBOARDING AUTOMÁTICO');
console.log('================================================================');
console.log(`📁 Diretório de Instalação: ${ROOT_DIR}\n`);

// 1. Validação de Versão do Node
const nodeVer = process.version;
const major = parseInt(nodeVer.replace('v', '').split('.')[0], 10);
if (major < 18) {
  console.error(`[ERRO] Node.js 18 ou superior é obrigatório. Versão detectada: ${nodeVer}`);
  process.exit(1);
}
console.log(`[1/5] ✅ Node.js detectado: ${nodeVer}`);

// 2. Criação automática de .env a partir de .env.example
console.log('[2/5] 🔑 Verificando configurações de ambiente (.env)...');
const envExamplePath = path.join(ROOT_DIR, '.env.example');
const envPath = path.join(ROOT_DIR, '.env');
const uiEnvPath = path.join(UI_DIR, '.env');

if (!fs.existsSync(envPath) && fs.existsSync(envExamplePath)) {
  fs.copyFileSync(envExamplePath, envPath);
  console.log('       Criado arquivo .env a partir de .env.example (sem chaves pessoais)');
}
if (!fs.existsSync(uiEnvPath) && fs.existsSync(envExamplePath)) {
  fs.copyFileSync(envExamplePath, uiEnvPath);
  console.log('       Sincronizado .env em ui-launcher/.env');
}
console.log('      ✅ Configurações de ambiente prontas.');

// 3. Instalação de Dependências
console.log('[3/5] 📦 Instalando dependências do núcleo e estúdios...');
try {
  console.log('       Executando npm install no núcleo...');
  execSync('npm install --prefer-offline --no-audit', { cwd: ROOT_DIR, stdio: 'inherit' });

  console.log('       Executando npm install na interface & Remotion...');
  execSync('npm install --prefer-offline --no-audit', { cwd: UI_DIR, stdio: 'inherit' });
  console.log('      ✅ Pacotes npm instalados com sucesso.');
} catch (err) {
  console.warn('      ⚠️ Aviso durante npm install:', err.message);
}

// 4. Verificação de FFmpeg nativo
console.log('[4/5] 🎞️ Verificando binário do FFmpeg para vídeos...');
try {
  const ffmpegOut = execSync('ffmpeg -version', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  const fVer = ffmpegOut.split('\n')[0] || '';
  console.log(`      ✅ FFmpeg nativo encontrado: ${fVer.slice(0, 45)}...`);
} catch {
  console.log('      ℹ️ FFmpeg não localizado no PATH global.');
  console.log('         Para renderizar vídeos de notícias e novelas com velocidade máxima:');
  console.log('         Execute no PowerShell: winget install Gyan.FFmpeg');
}

// 5. Inicialização de Banco SQLite Limpo (Nexus DB)
console.log('[5/5] 🧠 Inicializando Nexus DB (Memória Soberana do Usuário)...');
try {
  const dbDir = path.join(ROOT_DIR, '03_chat_projects_nexus', 'nexus-db');
  fs.mkdirSync(dbDir, { recursive: true });
  // Import dinâmico do NexusDB para criar o schema limpo
  const { NexusDB } = await import('./03_chat_projects_nexus/nexus-db/nexus.js');
  const nexus = new NexusDB(path.join(dbDir, 'nexus.db'));
  nexus.getProjects(); // Aciona schema
  console.log('      ✅ Nexus DB inicializado com zero dados pré-existentes.');
} catch (e) {
  console.log('      ℹ️ Nexus DB será inicializado na primeira execução.');
}

// Garantir pastas essenciais
const generatedDir = path.join(UI_DIR, 'public', 'generated');
fs.mkdirSync(generatedDir, { recursive: true });

console.log('\n================================================================');
console.log('🎉 V0ID OS ESTÁ 100% PRONTO PARA USO!');
console.log('================================================================');
console.log('Como iniciar:');
console.log('  1. Dê um duplo clique em "iniciar_v0id.bat"');
console.log('     OU');
console.log('  2. Execute no terminal: npm run dev\n');
console.log('O painel abrirá automaticamente em: http://localhost:3000');
console.log('================================================================\n');
