import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'node:fs';
import path from 'node:path';
import { exec } from 'node:child_process';

const VAULT_ROOT = path.resolve(process.cwd(), '../projetos');

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '25mb'
    }
  }
};

function scanDir(dir: string, baseDir: string): any[] {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let list: any[] = [];
  for (const e of entries) {
    const full = path.join(dir, e.name);
    const rel = path.relative(baseDir, full).replace(/\\/g, '/');
    if (e.isDirectory()) {
      list = list.concat(scanDir(full, baseDir));
    } else {
      const stat = fs.statSync(full);
      const ext = path.extname(e.name).toLowerCase();
      const isText = ['.js', '.ts', '.tsx', '.jsx', '.json', '.md', '.txt', '.html', '.css', '.py'].includes(ext);
      const isMedia = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.mp4', '.webm', '.wav', '.mp3', '.glb'].includes(ext);
      list.push({
        name: e.name,
        relPath: rel,
        fullPath: full,
        size: stat.size,
        modified: stat.mtime.toISOString(),
        ext,
        isText,
        isMedia
      });
    }
  }
  return list;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const projectId = (req.query.projectId as string) || 'space_tide';
    const projDir = path.join(VAULT_ROOT, projectId);
    fs.mkdirSync(projDir, { recursive: true });

    // 1. ACTION: ABRIR ARQUIVO NO PROGRAMA PADRÃO DO WINDOWS
    if (req.method === 'POST' && req.query.action === 'open_local') {
      const { relPath } = req.body;
      const fullPath = path.join(projDir, relPath);
      if (fs.existsSync(fullPath)) {
        exec(`start "" "${fullPath}"`, () => {});
        return res.status(200).json({ success: true, message: `Arquivo aberto no Windows: ${fullPath}` });
      }
      return res.status(404).json({ error: 'Arquivo não encontrado' });
    }

    // 2. GET: LER CONTEÚDO DE UM ARQUIVO OU LISTAR PASTA DO PROJETO
    if (req.method === 'GET') {
      const fileReq = req.query.file as string;
      if (fileReq) {
        const target = path.join(projDir, fileReq);
        if (!fs.existsSync(target)) return res.status(404).json({ error: 'Arquivo não encontrado' });

        const ext = path.extname(target).toLowerCase();
        const isText = ['.js', '.ts', '.tsx', '.jsx', '.json', '.md', '.txt', '.html', '.css', '.py'].includes(ext);

        if (isText) {
          const content = fs.readFileSync(target, 'utf8');
          return res.status(200).json({ success: true, content, isText: true, path: fileReq });
        } else {
          // Send base64 for media preview
          const buffer = fs.readFileSync(target);
          return res.status(200).json({
            success: true,
            base64: buffer.toString('base64'),
            isText: false,
            ext,
            size: buffer.length,
            path: fileReq
          });
        }
      }

      // Se nenhum arquivo específico for pedido, lista todos os arquivos reais da pasta
      const files = scanDir(projDir, projDir);
      return res.status(200).json({ success: true, files, projectDir: projDir });
    }

    // 3. PUT: SALVAR EDIÇÕES DE TEXTO/CÓDIGO DE VERDADE NO DISCO
    if (req.method === 'PUT') {
      const { relPath, content } = req.body;
      if (!relPath) return res.status(400).json({ error: 'relPath é obrigatório' });
      const target = path.join(projDir, relPath);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, content, 'utf8');
      return res.status(200).json({ success: true, message: `Arquivo [${relPath}] gravado com sucesso no disco.` });
    }

    // 4. POST: UPLOAD OU COLAR PRINT / IMAGEM NO PROJETO
    if (req.method === 'POST') {
      const { filename, base64Data, folder = 'assets' } = req.body;
      if (!filename || !base64Data) {
        return res.status(400).json({ error: 'filename e base64Data são obrigatórios' });
      }

      const targetDir = path.join(projDir, folder);
      fs.mkdirSync(targetDir, { recursive: true });
      const targetFile = path.join(targetDir, filename);

      const cleanBase64 = base64Data.replace(/^data:[a-zA-Z0-9_\-\/]+;base64,/, '');
      const buffer = Buffer.from(cleanBase64, 'base64');
      fs.writeFileSync(targetFile, buffer);

      return res.status(201).json({
        success: true,
        message: `Arquivo [${filename}] salvo com sucesso na pasta ${folder}.`,
        relPath: `${folder}/${filename}`
      });
    }

    return res.status(405).json({ error: 'Método não permitido' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
