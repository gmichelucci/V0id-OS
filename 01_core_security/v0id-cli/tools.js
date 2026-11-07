// V0id CLI - Core Deterministic Local Tools Engine
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
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

export function getActiveProjectRoot(overrideRoot) {
  if (overrideRoot && fs.existsSync(overrideRoot)) return overrideRoot;
  if (process.env.V0ID_PROJECT_ROOT && fs.existsSync(process.env.V0ID_PROJECT_ROOT)) {
    return process.env.V0ID_PROJECT_ROOT;
  }
  const cwd = process.cwd();
  return cwd.toLowerCase().endsWith('ui-launcher') ? path.resolve(cwd, '..') : cwd;
}

export function resolveV0idPath(rawPath, customProjectRoot) {
  if (!rawPath) return getActiveProjectRoot(customProjectRoot);
  if (path.isAbsolute(rawPath)) return rawPath;

  const projectRoot = getActiveProjectRoot(customProjectRoot);
  const cwd = process.cwd();
  const isUiLauncher = cwd.toLowerCase().endsWith('ui-launcher');
  const v0idRoot = isUiLauncher ? path.resolve(cwd, '..') : cwd;

  // 1. Se há um projeto ativo e o arquivo existe dentro dele, prioridade máxima
  if (projectRoot) {
    const projCandidate = path.resolve(projectRoot, rawPath);
    if (fs.existsSync(projCandidate)) return projCandidate;
  }

  // 2. Tenta a partir de V0ID_ROOT (ex: c:\V0id\SOUL.md ou c:\V0id\V0ID_SPEC.md)
  const rootCandidate = path.resolve(v0idRoot, rawPath);
  if (fs.existsSync(rootCandidate)) return rootCandidate;

  // 3. Tenta a partir do diretório de execução atual
  const cwdCandidate = path.resolve(cwd, rawPath);
  if (fs.existsSync(cwdCandidate)) return cwdCandidate;

  // 4. Tenta dentro de c:\V0id\projetos\<rawPath>
  const projCandidate = path.resolve(v0idRoot, 'projetos', rawPath);
  if (fs.existsSync(projCandidate)) return projCandidate;

  // Se for criação de novo arquivo, grava na raiz do projeto ativo se configurado!
  if (projectRoot && !rawPath.startsWith('..') && !rawPath.includes('01_core') && !rawPath.includes('ui-launcher')) {
    return path.resolve(projectRoot, rawPath);
  }

  // Fallback padrão: raiz do V0id
  return rootCandidate;
}

export const snapshotRegistry = new Map();

export function createSnapshot(filePath) {
  try {
    const fullPath = path.isAbsolute(filePath) ? filePath : resolveV0idPath(filePath);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const snapId = `snap_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      snapshotRegistry.set(snapId, { filePath: fullPath, content, timestamp: Date.now() });

      // Persiste no disco para compartilhamento entre processos e sobrevivência a reinicializações
      const cwd = process.cwd().toLowerCase().endsWith('ui-launcher') ? path.resolve(process.cwd(), '..') : process.cwd();
      const snapDir = path.resolve(cwd, '03_chat_projects_nexus', 'nexus-db', 'snapshots');
      fs.mkdirSync(snapDir, { recursive: true });
      fs.writeFileSync(path.join(snapDir, `${snapId}.json`), JSON.stringify({ filePath: fullPath, content, timestamp: Date.now() }), 'utf8');

      return snapId;
    }
  } catch {}
  return null;
}

export function rollbackSnapshot(snapId) {
  let item = snapshotRegistry.get(snapId);
  if (!item) {
    const cwd = process.cwd().toLowerCase().endsWith('ui-launcher') ? path.resolve(process.cwd(), '..') : process.cwd();
    const snapFile = path.resolve(cwd, '03_chat_projects_nexus', 'nexus-db', 'snapshots', `${snapId}.json`);
    if (fs.existsSync(snapFile)) {
      try {
        item = JSON.parse(fs.readFileSync(snapFile, 'utf8'));
      } catch {}
    }
  }
  if (!item) throw new Error(`Snapshot expirado ou não encontrado: ${snapId}`);
  fs.writeFileSync(item.filePath, item.content, 'utf8');
  return `OK: Alteração no arquivo ${path.basename(item.filePath)} revertida com sucesso!`;
}

export function recordSnapshotAfter(snapId, newContent) {
  try {
    if (!snapId) return;
    const item = snapshotRegistry.get(snapId);
    if (item) {
      item.newContent = newContent;
      snapshotRegistry.set(snapId, item);
    }
    const cwd = process.cwd().toLowerCase().endsWith('ui-launcher') ? path.resolve(process.cwd(), '..') : process.cwd();
    const snapFile = path.resolve(cwd, '03_chat_projects_nexus', 'nexus-db', 'snapshots', `${snapId}.json`);
    if (fs.existsSync(snapFile)) {
      try {
        const diskItem = JSON.parse(fs.readFileSync(snapFile, 'utf8'));
        diskItem.newContent = newContent;
        fs.writeFileSync(snapFile, JSON.stringify(diskItem), 'utf8');
      } catch {}
    }
  } catch {}
}

export function listSnapshots(limit = 20) {
  const cwd = process.cwd().toLowerCase().endsWith('ui-launcher') ? path.resolve(process.cwd(), '..') : process.cwd();
  const snapDir = path.resolve(cwd, '03_chat_projects_nexus', 'nexus-db', 'snapshots');
  if (!fs.existsSync(snapDir)) return [];
  const files = fs.readdirSync(snapDir).filter(f => f.endsWith('.json'));
  const list = [];
  for (const f of files) {
    try {
      const data = JSON.parse(fs.readFileSync(path.join(snapDir, f), 'utf8'));
      list.push({
        id: f.replace('.json', ''),
        filePath: data.filePath,
        fileName: path.basename(data.filePath),
        timestamp: data.timestamp,
        hasOld: !!data.content,
        hasNew: !!data.newContent,
        oldContent: data.content,
        newContent: data.newContent
      });
    } catch {}
  }
  return list.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)).slice(0, limit);
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
    const snapId = createSnapshot(fullPath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, String(content), 'utf8');
    if (snapId) recordSnapshotAfter(snapId, String(content));
    const snapSuffix = snapId ? ` [SNAPSHOT:${snapId}]` : '';
    return `OK: ${rawPath} gravado com sucesso (${Buffer.byteLength(String(content), 'utf8')} bytes em ${fullPath})${snapSuffix}`;
  },

  rollback_diff: (args = {}) => {
    const snapId = args.snapshotId || args.snapId || args.id;
    if (!snapId) throw new Error('rollback_diff: parâmetro snapshotId ausente.');
    return rollbackSnapshot(snapId);
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
    const snapId = createSnapshot(fullPath);
    const snapSuffix = snapId ? ` [SNAPSHOT:${snapId}]` : '';
    const original = fs.readFileSync(fullPath, 'utf8');

    // 1. Casamento direto
    if (original.includes(target)) {
      const occurrences = original.split(target).length - 1;
      if (occurrences > 1) {
        const idx = original.indexOf(target);
        const updated = original.slice(0, idx) + replacement + original.slice(idx + target.length);
        fs.writeFileSync(fullPath, updated, 'utf8');
        if (snapId) recordSnapshotAfter(snapId, updated);
        return `OK: Diff aplicado na 1ª de ${occurrences} ocorrências em ${rawPath}${snapSuffix}`;
      }
      const updated = original.replace(target, replacement);
      fs.writeFileSync(fullPath, updated, 'utf8');
      if (snapId) recordSnapshotAfter(snapId, updated);
      return `OK: Diff aplicado com sucesso em ${rawPath}${snapSuffix}`;
    }

    // 2. Casamento tolerante a quebras de linha Windows/Unix (\r\n vs \n)
    const normOriginal = original.replace(/\r\n/g, '\n');
    const normTarget = target.replace(/\r\n/g, '\n');
    if (normOriginal.includes(normTarget)) {
      const normReplacement = replacement.replace(/\r\n/g, '\n');
      const updated = normOriginal.replace(normTarget, normReplacement);
      fs.writeFileSync(fullPath, updated, 'utf8');
      if (snapId) recordSnapshotAfter(snapId, updated);
      return `OK: Diff aplicado com sucesso em ${rawPath} (normalizado CRLF/LF)${snapSuffix}`;
    }

    throw new Error(`Target string not found in ${rawPath}. Certifique-se de que o trecho a ser substituído coincide exatamente com o arquivo.`);
  },

  list_dir: (args = {}) => {
    const rawPath = args.dirPath || args.dir || args.path || '.';
    const root = getActiveProjectRoot(args.projectRoot);
    const fullPath = (rawPath === '.' || rawPath === './') ? root : resolveV0idPath(rawPath, root);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`Directory not found: ${rawPath} (${fullPath})`);
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
    const root = getActiveProjectRoot(args.projectRoot);
    const dir = args.dirPath ? resolveV0idPath(args.dirPath, root) : root;
    try {
      const cmd = `git grep -n -I --max-count 40 -e "${query.replace(/"/g, '\\"')}"`;
      const out = execSync(cmd, { cwd: dir, encoding: 'utf8', timeout: 8000, stdio: ['pipe', 'pipe', 'ignore'] });
      return compressOutput(out.trim() || 'Nenhum resultado encontrado.', 50);
    } catch (err) {
      try {
        const psCmd = `Get-ChildItem -Path "${dir}" -Recurse -File -Exclude node_modules,.next,.git -ErrorAction SilentlyContinue | Select-String -Pattern "${query.replace(/"/g, '`"')}" | Select-Object -First 30 | ForEach-Object { "$($_.Filename):$($_.LineNumber): $($_.Line.Trim())" }`;
        const psOut = execSync(psCmd, { cwd: dir, shell: 'powershell.exe', encoding: 'utf8', timeout: 12000 });
        if (psOut && psOut.trim()) return compressOutput(psOut.trim(), 40);
      } catch {}
      return `Busca finalizada: nenhum resultado encontrado para "${query}" em ${dir}.`;
    }
  },

  find_files: (args = {}) => {
    const pattern = args.pattern || args.glob || '*';
    const root = getActiveProjectRoot(args.projectRoot);
    const dir = args.dirPath ? resolveV0idPath(args.dirPath, root) : root;
    try {
      const psCmd = `Get-ChildItem -Path "${dir}" -Recurse -Filter "${pattern}" -Exclude node_modules,.next,.git -ErrorAction SilentlyContinue | Select-Object -First 45 -ExpandProperty FullName`;
      const out = execSync(psCmd, { cwd: dir, shell: 'powershell.exe', encoding: 'utf8', timeout: 15000 });
      return compressOutput(out.trim() || 'Nenhum arquivo encontrado com esse padrão.', 45);
    } catch (e) {
      return `find_files falhou: ${e.message}`;
    }
  },

  generate_image: async (args = {}) => {
    const prompt = args.prompt || args.description;
    if (!prompt) throw new Error('generate_image: parâmetro prompt ausente.');

    const aspectRatio = args.aspectRatio || '1:1';
    const width = args.width || (aspectRatio === '16:9' ? 1280 : (aspectRatio === '9:16' ? 720 : 1024));
    const height = args.height || (aspectRatio === '16:9' ? 720 : (aspectRatio === '9:16' ? 1280 : 1024));
    const seed = args.seed || Math.floor(Math.random() * 1000000);
    const uncensored = args.uncensored === true;
    const cwd = process.cwd().toLowerCase().endsWith('ui-launcher') ? path.resolve(process.cwd(), '..') : process.cwd();

    // Resolução de imagem de referência para Image-to-Image (Img2Img)
    const imageInput = args.imagePath || args.image || args.referenceImage;
    let refImageUri = null;
    if (imageInput && typeof imageInput === 'string') {
      if (imageInput.startsWith('data:image/') || imageInput.startsWith('http://') || imageInput.startsWith('https://')) {
        refImageUri = imageInput;
      } else {
        const candidatePaths = [
          path.resolve(imageInput),
          path.resolve(cwd, imageInput),
          path.resolve(cwd, 'ui-launcher', 'public', imageInput.replace(/^\//, '')),
          path.resolve(cwd, 'ui-launcher', imageInput)
        ];
        for (const p of candidatePaths) {
          if (fs.existsSync(p)) {
            const buf = fs.readFileSync(p);
            const ext = path.extname(p).toLowerCase().replace('.', '');
            const mime = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : (ext === 'webp' ? 'image/webp' : 'image/png');
            refImageUri = `data:${mime};base64,${buf.toString('base64')}`;
            break;
          }
        }
      }
    }

    // Normaliza modelo solicitado pelo chat ou usuário
    let rawModel = String(args.model || (uncensored ? 'flux' : 'auto')).toLowerCase().trim();
    let requestedModel = 'nano-banana';
    if (uncensored || rawModel === '4' || rawModel.includes('flux')) {
      requestedModel = 'flux';
    } else if (rawModel === '1' || rawModel.includes('pro')) {
      requestedModel = 'nano-banana-pro';
    } else if (rawModel === '3' || rawModel.includes('lite')) {
      requestedModel = 'nano-banana-lite';
    } else if (rawModel === '2' || rawModel.includes('banana') || rawModel.includes('bana') || rawModel.includes('flow') || rawModel === 'auto') {
      requestedModel = 'nano-banana';
    } else {
      requestedModel = rawModel;
    }

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
    const isBananaRequested = !uncensored && (requestedModel.includes('banana') || requestedModel.includes('flow') || requestedModel === 'auto');
    if (isBananaRequested) {
      try {
        const clientPath = pathToFileURL(path.resolve(cwd, '01_core_security', 'flow-bridge', 'flow_client.js')).href + `?t=${Date.now()}`;
        const { flowBridge: liveBridge } = await import(clientPath);
        const bridge = liveBridge || flowBridge;
        if (bridge && bridge.isConfigured()) {
          const flowRes = await bridge.generateImage({ prompt, aspectRatio, timeoutMs: 65000 });
          if (flowRes && flowRes.buffer) {
            return saveAndReturn(flowRes.buffer, flowRes.modelUsed, flowRes.format || 'jpg');
          }
        }
      } catch (flowErr) {
        console.warn('[GoogleFlowBridge] Fallback ativo:', flowErr.message);
      }
    }

    // 2. Tenta Google Nano Banana Pro via Google AI Studio se houver GEMINI_API_KEY
    if (!uncensored && isBananaRequested && process.env.GEMINI_API_KEY) {
      const nanoModels = ['nano-banana-pro-preview', 'gemini-nano-banana-2.1', 'gemini-3.1-flash-image'];
      for (const nm of nanoModels) {
        try {
          const gUrl = `https://generativelanguage.googleapis.com/v1beta/models/${nm}:generateContent?key=${process.env.GEMINI_API_KEY}`;
          const gParts = [];
          if (refImageUri) {
            const m = refImageUri.match(/^data:([^;]+);base64,(.+)$/);
            if (m) {
              gParts.push({ inlineData: { mimeType: m[1], data: m[2] } });
            }
          }
          gParts.push({
            text: refImageUri
              ? `Transform and edit this reference image according to instructions: ${prompt}`
              : `Generate a high quality detailed image: ${prompt}`
          });

          const gRes = await fetch(gUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: gParts }] }),
            signal: AbortSignal.timeout(35000)
          });
          if (gRes.ok) {
            const gJson = await gRes.json();
            const parts = gJson.candidates?.[0]?.content?.parts || [];
            const imgPart = parts.find(p => p.inlineData && p.inlineData.data);
            if (imgPart) {
              const buf = Buffer.from(imgPart.inlineData.data, 'base64');
              const ext = imgPart.inlineData.mimeType?.includes('jpeg') ? 'jpg' : 'png';
              const label = refImageUri ? `Google Nano Banana Img2Img (${nm})` : `Google Nano Banana (${nm})`;
              return saveAndReturn(buf, label, ext);
            }
          }
        } catch {}
      }
    }

    // 3. Motor Neural FLUX.1 (Black Forest Labs 12B - Qualidade Estúdio Midjourney-Tier) & Fallbacks
    const buildUrl = (m) => {
      const encoded = encodeURIComponent(prompt);
      let u = `https://image.pollinations.ai/prompt/${encoded}?width=${width}&height=${height}&model=${m}&nologo=true&seed=${seed}`;
      if (uncensored) u += '&safe=false';
      if (refImageUri) u += `&image=${encodeURIComponent(refImageUri)}`;
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
      if (res && res.ok && (res.headers.get('content-type') || '').includes('image')) break;
    }

    if (!res || !res.ok || !(res.headers.get('content-type') || '').includes('image')) {
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

  generate_video: async (args = {}) => {
    const prompt = args.prompt || args.description || 'Cinematic video animation';
    const duration = Math.min(Math.max(Number(args.duration) || 5, 2), 15);
    const aspectRatio = args.aspectRatio || '1:1';
    const motion = String(args.motion || 'rotate').toLowerCase();
    const withMusic = args.withMusic !== false;

    const cwd = process.cwd().toLowerCase().endsWith('ui-launcher') ? path.resolve(process.cwd(), '..') : process.cwd();
    const timestamp = Date.now();
    const seed = Math.floor(Math.random() * 1000000);
    const videoFilename = `video_${timestamp}_${seed.toString(36)}.mp4`;
    const publicVideoPath = path.resolve(cwd, 'ui-launcher', 'public', 'generated', videoFilename);
    fs.mkdirSync(path.dirname(publicVideoPath), { recursive: true });

    // 1. Localiza a imagem base para animar
    let sourceImgPath = null;
    if (args.imagePath) {
      const cleanPath = args.imagePath.replace(/^\//, '').replace(/^generated\//, 'ui-launcher/public/generated/');
      const candidate = resolveV0idPath(cleanPath);
      if (fs.existsSync(candidate)) sourceImgPath = candidate;
    }

    if (!sourceImgPath) {
      // Procura a imagem mais recente gerada em ui-launcher/public/generated/
      const genDir = path.resolve(cwd, 'ui-launcher', 'public', 'generated');
      if (fs.existsSync(genDir)) {
        const files = fs.readdirSync(genDir)
          .filter(f => /\.(jpg|jpeg|png)$/i.test(f) && !f.includes('test_'))
          .map(f => ({ name: f, time: fs.statSync(path.join(genDir, f)).mtimeMs }))
          .sort((a, b) => b.time - a.time);
        if (files.length > 0) {
          sourceImgPath = path.join(genDir, files[0].name);
        }
      }
    }

    // Se ainda não houver imagem base, sintetiza uma imagem via generate_image
    if (!sourceImgPath || !fs.existsSync(sourceImgPath)) {
      const imgRes = await tools.generate_image({ prompt, aspectRatio });
      const match = typeof imgRes === 'string' ? imgRes.match(/Arquivo salvo:\s*(.*)/) : null;
      if (match && fs.existsSync(match[1].trim())) {
        sourceImgPath = match[1].trim();
      }
    }

    if (!sourceImgPath || !fs.existsSync(sourceImgPath)) {
      throw new Error('generate_video: Nenhuma imagem base disponível para animar.');
    }

    const width = aspectRatio === '16:9' ? 1280 : (aspectRatio === '9:16' ? 720 : 1024);
    const height = aspectRatio === '16:9' ? 720 : (aspectRatio === '9:16' ? 1280 : 1024);
    const fps = 30;
    const totalFrames = duration * fps;

    // Filtros de movimento cinematográfico
    let filter = '';
    if (motion.includes('zoom') || motion.includes('b') || motion.includes('aproxima')) {
      // Zoom in dinâmico em direção ao centro e relevo
      filter = `scale=2048:2048,zoompan=z='min(zoom+0.0016,1.4)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${totalFrames}:s=${width}x${height}:fps=${fps}`;
    } else if (motion.includes('rotac') || motion.includes('gir') || motion.includes('orbit')) {
      // Rotação orbital majestosa
      filter = `scale=2048:2048,rotate=angle='0.025*t':ow=${width}:oh=${height}:c=black@0`;
    } else if (motion.includes('pan') || motion.includes('a')) {
      // Pan horizontal suave
      filter = `scale=2560:1440,zoompan=z='1.2':x='if(lte(on,1),(iw-iw/zoom)/2,x+1.5)':y='ih/2-(ih/zoom/2)':d=${totalFrames}:s=${width}x${height}:fps=${fps}`;
    } else {
      // Cinematic: zoom lento + leve deriva senoidal
      filter = `scale=2048:2048,zoompan=z='min(zoom+0.0015,1.35)':x='iw/2-(iw/zoom/2)+sin(in/30)*15':y='ih/2-(ih/zoom/2)+cos(in/30)*15':d=${totalFrames}:s=${width}x${height}:fps=${fps}`;
    }

    // Áudio: tom ambiente sintético (senoides via lavfi), não é Flow Music
    const audioSynth = `aevalsrc=exprs='0.16*sin(2*PI*55*t)+0.08*sin(2*PI*110*t)+0.05*sin(2*PI*220*t+sin(2*PI*0.1*t))':s=44100,afade=t=in:ss=0:d=1,afade=t=out:st=${duration - 1}:d=1`;

    const cmd = `ffmpeg -y -loop 1 -t ${duration} -i "${sourceImgPath}" -f lavfi -t ${duration} -i "${audioSynth}" -filter_complex "[0:v]${filter},format=yuv420p[v];[1:a]volume=1.0[a]" -map "[v]" -map "[a]" -c:v libx264 -preset fast -crf 20 -c:a aac -b:a 192k -shortest "${publicVideoPath}"`;

    try {
      execSync(cmd, { stdio: 'pipe' });
    } catch (ffmpegErr) {
      // Fallback sem áudio se lavfi der erro no sistema
      const fallbackCmd = `ffmpeg -y -loop 1 -t ${duration} -i "${sourceImgPath}" -vf "${filter},format=yuv420p" -c:v libx264 -preset fast -crf 20 "${publicVideoPath}"`;
      execSync(fallbackCmd, { stdio: 'pipe' });
    }

    try {
      const projDir = path.resolve(cwd, 'projetos', 'global', 'assets', 'videos');
      fs.mkdirSync(projDir, { recursive: true });
      fs.copyFileSync(publicVideoPath, path.join(projDir, videoFilename));
    } catch {}

    const webUrl = `/generated/${videoFilename}`;
    const cleanPrompt = prompt.replace(/[\[\]\r\n]/g, ' ').slice(0, 80);
    return `OK: Vídeo sintetizado com sucesso!\nURL: ${webUrl}\nArquivo salvo: ${publicVideoPath}\nModelo: FFmpeg local (animação de câmera sobre imagem estática + tom ambiente sintético — NÃO é Veo/Google Flow) (${width}x${height}, ${duration}s, 30fps)\nExibição:\n![${cleanPrompt}](${webUrl})`;
  },

  run_command: (args = {}) => {
    const command = args.command || args.cmd;
    if (!command) throw new Error('run_command: parâmetro command ausente.');
    const root = getActiveProjectRoot(args.projectRoot);
    const cwd = args.cwd ? resolveV0idPath(args.cwd, root) : root;
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
  },

  web_search: async (args = {}) => {
    const query = args.query || args.q || args.search;
    if (!query) throw new Error('web_search: parâmetro query ausente.');
    try {
      const ddgApiUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1`;
      const res = await fetch(ddgApiUrl, { signal: AbortSignal.timeout(8000) });
      const data = await res.json().catch(() => ({}));
      const parts = [];
      if (data.AbstractText) {
        parts.push(`**${data.Heading || query}**\n${data.AbstractText}\nFonte: ${data.AbstractURL || 'DuckDuckGo'}`);
      }
      if (Array.isArray(data.RelatedTopics)) {
        for (const rt of data.RelatedTopics.slice(0, 4)) {
          if (rt.Text) parts.push(`• ${rt.Text}${rt.FirstURL ? ` (${rt.FirstURL})` : ''}`);
        }
      }
      if (parts.length > 0) {
        return `Resultados de pesquisa para "${query}":\n\n${parts.join('\n\n')}`;
      }
      // Fallback Wikipedia
      const wikiUrl = `https://pt.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`;
      const wRes = await fetch(wikiUrl, { signal: AbortSignal.timeout(6000) });
      if (wRes.ok) {
        const wData = await wRes.json();
        if (wData.extract) {
          return `**${wData.title}** (Wikipedia):\n${wData.extract}\nURL: ${wData.content_urls?.desktop?.page || wikiUrl}`;
        }
      }
      return `Pesquisa web executada para "${query}". Nenhum resumo enciclopédico direto retornado. Use fetch_web com a URL exata se possuir um link direto.`;
    } catch (err) {
      return `Nota da busca web: ${err.message}`;
    }
  },

  fetch_web: async (args = {}) => {
    const rawUrl = args.url || args.link;
    if (!rawUrl) throw new Error('fetch_web: parâmetro url ausente.');
    try {
      const res = await fetch(rawUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        signal: AbortSignal.timeout(15000)
      });
      const text = await res.text();
      const clean = text
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      return compressOutput(clean, 60);
    } catch (err) {
      return `Falha ao carregar [${rawUrl}]: ${err.message}`;
    }
  }
};
