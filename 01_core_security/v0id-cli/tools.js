// V0id CLI - Core Deterministic Local Tools Engine
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

function compressOutput(text, maxLines = 80) {
  if (!text || typeof text !== 'string') return '';
  const lines = text.split('\n');
  if (lines.length <= maxLines) return text;
  const half = Math.floor(maxLines / 2);
  return [
    ...lines.slice(0, half),
    `... [RTK SLIM: ${lines.length - maxLines} linhas comprimidas] ...`,
    ...lines.slice(lines.length - half)
  ].join('\n');
}

export function resolveV0idPath(rawPath) {
  if (!rawPath) return process.cwd();
  if (path.isAbsolute(rawPath)) return rawPath;

  const cwd = process.cwd();
  const isUiLauncher = cwd.toLowerCase().endsWith('ui-launcher');
  const v0idRoot = isUiLauncher ? path.resolve(cwd, '..') : cwd;

  // 1. Tenta a partir de V0ID_ROOT (ex: c:\V0id\SOUL.md ou c:\V0id\V0ID_SPEC.md)
  const rootCandidate = path.resolve(v0idRoot, rawPath);
  if (fs.existsSync(rootCandidate)) return rootCandidate;

  // 2. Tenta a partir do diretório de execução atual
  const cwdCandidate = path.resolve(cwd, rawPath);
  if (fs.existsSync(cwdCandidate)) return cwdCandidate;

  // 3. Tenta dentro de c:\V0id\projetos\<rawPath>
  const projCandidate = path.resolve(v0idRoot, 'projetos', rawPath);
  if (fs.existsSync(projCandidate)) return projCandidate;

  // Se o caminho aponta especificamente para ui-launcher ou começa com ./ui-launcher
  if (rawPath.startsWith('ui-launcher') || rawPath.startsWith('./ui-launcher') || rawPath.startsWith('.\\ui-launcher')) {
    return path.resolve(v0idRoot, rawPath);
  }

  // Fallback padrão: raiz do V0id
  return rootCandidate;
}

export const tools = {
  read_file: (args = {}) => {
    const rawPath = args.filePath || args.filepath || args.path || args.file;
    if (!rawPath) throw new Error('read_file: parâmetro filePath ausente.');
    const fullPath = resolveV0idPath(rawPath);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`File not found: ${rawPath} (buscado em ${fullPath})`);
    }
    const content = fs.readFileSync(fullPath, 'utf8');
    const lines = content.split('\n');
    const start = args.startLine ? Math.max(1, args.startLine) : 1;
    const end = args.endLine ? Math.min(lines.length, args.endLine) : lines.length;
    const sliced = lines.slice(start - 1, end).join('\n');
    return compressOutput(sliced, 100);
  },

  write_file: (args = {}) => {
    const rawPath = args.filePath || args.filepath || args.path || args.file;
    if (!rawPath) throw new Error('write_file: parâmetro filePath ausente.');
    const content = args.content !== undefined ? args.content : (args.code !== undefined ? args.code : args.text);
    if (content === undefined || content === null) throw new Error('write_file: parâmetro content ausente.');
    const fullPath = resolveV0idPath(rawPath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, String(content), 'utf8');
    return `OK: ${rawPath} gravado com sucesso (${Buffer.byteLength(String(content), 'utf8')} bytes em ${fullPath})`;
  },

  apply_diff: (args = {}) => {
    const rawPath = args.filePath || args.filepath || args.path || args.file;
    if (!rawPath) throw new Error('apply_diff: parâmetro filePath ausente.');
    const fullPath = resolveV0idPath(rawPath);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`File not found: ${rawPath}`);
    }
    const target = args.target;
    const replacement = args.replacement !== undefined ? args.replacement : '';
    if (!target) throw new Error('apply_diff: parâmetro target ausente.');
    const original = fs.readFileSync(fullPath, 'utf8');
    if (!original.includes(target)) {
      throw new Error(`Target string not found in ${rawPath}`);
    }
    const updated = original.replace(target, replacement);
    fs.writeFileSync(fullPath, updated, 'utf8');
    return `OK: Diff aplicado com sucesso em ${rawPath}`;
  },

  list_dir: (args = {}) => {
    const rawPath = args.dirPath || args.dir || args.path || '.';
    const fullPath = resolveV0idPath(rawPath);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`Directory not found: ${rawPath}`);
    }
    const entries = fs.readdirSync(fullPath, { withFileTypes: true });
    const formatted = entries.map(e => {
      const type = e.isDirectory() ? '[DIR]' : '[FILE]';
      return `${type.padEnd(7)} ${e.name}`;
    }).join('\n');
    return compressOutput(formatted, 60);
  },

  run_command: (args = {}) => {
    const command = args.command || args.cmd;
    if (!command) throw new Error('run_command: parâmetro command ausente.');
    const cwd = process.cwd().toLowerCase().endsWith('ui-launcher') ? path.resolve(process.cwd(), '..') : process.cwd();
    const isWindows = process.platform === 'win32';
    try {
      const raw = execSync(command, {
        cwd,
        encoding: 'utf8',
        timeout: args.timeoutMs || 45000,
        shell: isWindows ? 'powershell.exe' : '/bin/sh'
      });
      return compressOutput(raw, 40);
    } catch (err) {
      const stdout = err.stdout ? compressOutput(err.stdout, 20) : '';
      const stderr = err.stderr ? compressOutput(err.stderr, 20) : '';
      throw new Error(`Command failed with code ${err.status}\nSTDOUT: ${stdout}\nSTDERR: ${stderr}\nError: ${err.message}`);
    }
  },

  graphify: (args = {}) => {
    const action = args.action || 'update';
    const query = args.query || '';
    try {
      if (action === 'update') {
        const out = execSync('graphify update .', { encoding: 'utf8', timeout: 60000 });
        return compressOutput(out, 30);
      }
      if (action === 'query') {
        const out = execSync(`graphify query "${query.replace(/"/g, '\\"')}"`, { encoding: 'utf8', timeout: 30000 });
        return compressOutput(out, 40);
      }
      return `Unknown graphify action: ${action}`;
    } catch (err) {
      return `Graphify note: ${err.message}`;
    }
  }
};
