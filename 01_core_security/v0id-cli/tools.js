// V0id CLI - Core Deterministic Local Tools Engine
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { flowBridge } from '../flow-bridge/flow_client.js';

export function compressOutput(text, maxLines = 80) {
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

    // Se o arquivo for muito longo e nenhuma faixa foi pedida, lê até 350 linhas com aviso claro (sem picotar o código)
    if (!args.endLine && lines.length > 350) {
      const slice = lines.slice(0, 350).join('\n');
      return `${slice}\n\n... [Arquivo longo: mostrando linhas 1 a 350 de ${lines.length}. Use startLine e endLine para ler outras seções com precisão.]`;
    }
    return lines.slice(start - 1, end).join('\n');
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

    // 1. Casamento direto
    if (original.includes(target)) {
      const occurrences = original.split(target).length - 1;
      if (occurrences > 1) {
        const idx = original.indexOf(target);
        const updated = original.slice(0, idx) + replacement + original.slice(idx + target.length);
        fs.writeFileSync(fullPath, updated, 'utf8');
        return `OK: Diff aplicado na 1ª de ${occurrences} ocorrências em ${rawPath}`;
      }
      const updated = original.replace(target, replacement);
      fs.writeFileSync(fullPath, updated, 'utf8');
      return `OK: Diff aplicado com sucesso em ${rawPath}`;
    }

    // 2. Casamento tolerante a quebras de linha Windows/Unix (\r\n vs \n)
    const normOriginal = original.replace(/\r\n/g, '\n');
    const normTarget = target.replace(/\r\n/g, '\n');
    if (normOriginal.includes(normTarget)) {
      const normReplacement = replacement.replace(/\r\n/g, '\n');
      const updated = normOriginal.replace(normTarget, normReplacement);
      fs.writeFileSync(fullPath, updated, 'utf8');
      return `OK: Diff aplicado com sucesso em ${rawPath} (normalizado CRLF/LF)`;
    }

    throw new Error(`Target string not found in ${rawPath}. Certifique-se de que o trecho a ser substituído coincide exatamente com o arquivo.`);
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

  search_code: (args = {}) => {
    const query = args.query || args.term || args.pattern;
    if (!query) throw new Error('search_code: parâmetro query ausente.');
    const cwd = process.cwd().toLowerCase().endsWith('ui-launcher') ? path.resolve(process.cwd(), '..') : process.cwd();
    const dir = args.dirPath ? resolveV0idPath(args.dirPath) : cwd;
    try {
      const cmd = `git grep -n -I --max-count 40 -e "${query.replace(/"/g, '\\"')}"`;
      const out = execSync(cmd, { cwd: dir, encoding: 'utf8', timeout: 8000, stdio: ['pipe', 'pipe', 'ignore'] });
      return compressOutput(out.trim() || 'Nenhum resultado encontrado.', 50);
    } catch (err) {
      if (err.status === 1) {
        return 'Nenhum resultado encontrado no repositório.';
      }
      return `Busca finalizada: nenhum resultado encontrado para "${query}".`;
    }
  },

  find_files: (args = {}) => {
    const pattern = args.pattern || args.glob || '*';
    const cwd = process.cwd().toLowerCase().endsWith('ui-launcher') ? path.resolve(process.cwd(), '..') : process.cwd();
    const dir = args.dirPath ? resolveV0idPath(args.dirPath) : cwd;
    try {
      const psCmd = `Get-ChildItem -Path "${dir}" -Recurse -Filter "${pattern}" -Exclude node_modules,.next,.git -ErrorAction SilentlyContinue | Select-Object -First 40 | Resolve-Path -Relative`;
      const out = execSync(psCmd, { cwd: dir, shell: 'powershell.exe', encoding: 'utf8', timeout: 15000 });
      return compressOutput(out.trim() || 'Nenhum arquivo encontrado com esse padrão.', 45);
    } catch (e) {
      return `find_files falhou: ${e.message}`;
    }
  },

  generate_image: async (args = {}) => {
    const prompt = args.prompt || args.description;
    if (!prompt) throw new Error('generate_image: parâmetro prompt ausente.');

    const width = args.width || (args.aspectRatio === '16:9' ? 1280 : (args.aspectRatio === '9:16' ? 720 : 1024));
    const height = args.height || (args.aspectRatio === '16:9' ? 720 : (args.aspectRatio === '9:16' ? 1280 : 1024));
    const seed = args.seed || Math.floor(Math.random() * 1000000);
    const uncensored = args.uncensored === true;
    const requestedModel = args.model || (uncensored ? 'flux' : 'auto');

    const cwd = process.cwd().toLowerCase().endsWith('ui-launcher') ? path.resolve(process.cwd(), '..') : process.cwd();
    const saveAndReturn = (buffer, modelLabel, ext = 'png') => {
      const timestamp = Date.now();
      const filename = `img_${timestamp}_${seed.toString(36)}.${ext}`;
      const publicPath = path.resolve(cwd, 'ui-launcher', 'public', 'generated', filename);
      fs.mkdirSync(path.dirname(publicPath), { recursive: true });
      fs.writeFileSync(publicPath, buffer);
      try {
        const projDir = path.resolve(cwd, 'projetos', 'global', 'assets', 'images');
        fs.mkdirSync(projDir, { recursive: true });
        fs.writeFileSync(path.resolve(projDir, filename), buffer);
      } catch {}
      const webUrl = `/generated/${filename}`;
      const cleanPrompt = prompt.replace(/[\[\]\r\n]/g, ' ').slice(0, 80);
      return `OK: Imagem sintetizada com sucesso!\nURL: ${webUrl}\nArquivo salvo: ${publicPath}\nModelo: ${modelLabel} (${width}x${height}, seed: ${seed})\nExibição:\n![${cleanPrompt}](${webUrl})`;
    };

    // 1. Tenta Google Flow Bridge (Nano Banana via Edge com Google Pro)
    if (!uncensored && (requestedModel === 'auto' || requestedModel.includes('banana') || requestedModel.includes('flow'))) {
      if (flowBridge && flowBridge.isConfigured()) {
        try {
          const flowRes = await flowBridge.generateImage({ prompt, aspectRatio, timeoutMs: 45000 });
          if (flowRes && flowRes.buffer) {
            return saveAndReturn(flowRes.buffer, flowRes.modelUsed, flowRes.format || 'png');
          }
        } catch (flowErr) {
          console.warn('[GoogleFlowBridge] Fallback ativo:', flowErr.message);
        }
      }
    }

    // 2. Tenta Google Nano Banana Pro via Google AI Studio se houver GEMINI_API_KEY
    if (!uncensored && (requestedModel === 'auto' || requestedModel.includes('banana')) && process.env.GEMINI_API_KEY) {
      const nanoModels = ['nano-banana-pro-preview', 'gemini-nano-banana-2.1', 'gemini-3.1-flash-image'];
      for (const nm of nanoModels) {
        try {
          const gUrl = `https://generativelanguage.googleapis.com/v1beta/models/${nm}:generateContent?key=${process.env.GEMINI_API_KEY}`;
          const gRes = await fetch(gUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: `Generate a high quality detailed image: ${prompt}` }] }]
            }),
            signal: AbortSignal.timeout(35000)
          });
          if (gRes.ok) {
            const gJson = await gRes.json();
            const parts = gJson.candidates?.[0]?.content?.parts || [];
            const imgPart = parts.find(p => p.inlineData && p.inlineData.data);
            if (imgPart) {
              const buf = Buffer.from(imgPart.inlineData.data, 'base64');
              const ext = imgPart.inlineData.mimeType?.includes('jpeg') ? 'jpg' : 'png';
              return saveAndReturn(buf, `Google Nano Banana (${nm})`, ext);
            }
          }
        } catch {}
      }
    }

    // 2. Motor Neural FLUX.1 (Black Forest Labs 12B - Qualidade Estúdio Midjourney-Tier) & Fallbacks
    const buildUrl = (m) => {
      const encoded = encodeURIComponent(prompt);
      let u = `https://image.pollinations.ai/prompt/${encoded}?width=${width}&height=${height}&model=${m}&nologo=true&seed=${seed}`;
      if (uncensored) u += '&safe=false';
      if (process.env.POLLINATIONS_API_KEY) u += `&key=${encodeURIComponent(process.env.POLLINATIONS_API_KEY)}`;
      return u;
    };

    const fetchImage = async (url) => {
      try {
        let r = await fetch(url, { signal: AbortSignal.timeout(50000) });
        if (r.status === 402 || r.status === 503) {
          let waitSec = 0;
          try {
            const clone = r.clone();
            const errJson = await clone.json();
            const match = (errJson.error?.message || '').match(/Retry after (\d+)s/i);
            if (match) waitSec = parseInt(match[1], 10);
          } catch {}
          if (waitSec > 0 && waitSec <= 45) {
            await new Promise(resolve => setTimeout(resolve, (waitSec + 1) * 1000));
            r = await fetch(url, { signal: AbortSignal.timeout(50000) });
          }
        }
        return r;
      } catch (e) {
        return { ok: false, status: 500, statusText: e.message || 'Timeout' };
      }
    };

    // Ordem de prioridade para máxima qualidade visual:
    // flux (12B photoreal) -> turbo (rápido e sem limites de cota) -> sana
    const candidateModels = (requestedModel !== 'auto' && !requestedModel.includes('banana'))
      ? [requestedModel, 'flux', 'turbo']
      : ['flux', 'turbo', 'sana'];

    let usedModel = 'flux';
    let res = null;

    for (const m of candidateModels) {
      usedModel = m;
      res = await fetchImage(buildUrl(m));
      if (res && res.ok) break;
    }

    if (!res || !res.ok) {
      throw new Error(`Falha ao sintetizar imagem (${res?.status || 500}): ${res?.statusText || 'Todos os motores de imagem falharam'}`);
    }

    const buffer = Buffer.from(await res.arrayBuffer());
    const modelLabels = {
      flux: 'FLUX.1 Schnell/Dev (12B High-Res)',
      turbo: 'SDXL Turbo (Fast Fallback)',
      sana: 'Sana Efficient (600M)'
    };
    const modelLabel = modelLabels[usedModel] || `Neural Engine (${usedModel})`;
    return saveAndReturn(buffer, modelLabel);
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
    const action = args.action || 'query';
    const query = args.query || '';
    const cwd = process.cwd().toLowerCase().endsWith('ui-launcher') ? path.resolve(process.cwd(), '..') : process.cwd();
    try {
      if (action === 'update') {
        const out = execSync('graphify update .', { cwd, encoding: 'utf8', timeout: 60000 });
        return compressOutput(out, 30);
      }
      if (action === 'query') {
        const q = query || 'arquitetura geral';
        const out = execSync(`graphify query "${q.replace(/"/g, '\\"')}"`, { cwd, encoding: 'utf8', timeout: 30000 });
        return compressOutput(out, 40);
      }
      if (action === 'stats') {
        const out = execSync('graphify stats', { cwd, encoding: 'utf8', timeout: 15000 });
        return compressOutput(out, 30);
      }
      return `Ação do graphify desconhecida: ${action}. Use 'query', 'update' ou 'stats'.`;
    } catch (err) {
      return `Graphify note: ${err.message}`;
    }
  }
};
