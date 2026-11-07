import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
// @ts-ignore
import { DatabaseSync } from 'node:sqlite';

const V0ID_ROOT = fs.existsSync(path.resolve(process.cwd(), 'V0ID_SPEC.md'))
  ? process.cwd()
  : path.resolve(process.cwd(), '..');

const DB_PATH = path.join(V0ID_ROOT, '03_chat_projects_nexus/nexus-db/nexus.db');

function getProjectFolder(id?: string): string {
  const cleanId = String(id || 'v0id').toLowerCase().trim();
  if (cleanId === 'v0id') return V0ID_ROOT;
  try {
    if (fs.existsSync(DB_PATH)) {
      const db = new DatabaseSync(DB_PATH);
      const row = db.prepare('SELECT type, sync_target FROM projects WHERE id = ?').get(cleanId) as any;
      if (row && row.type === 'local' && row.sync_target?.startsWith('local:')) {
        const localPath = row.sync_target.substring(6).trim();
        if (fs.existsSync(localPath)) return localPath;
      }
    }
  } catch {}
  return path.join(V0ID_ROOT, 'projetos', cleanId);
}

const SPEC_PATH = fs.existsSync(path.join(V0ID_ROOT, 'V0ID_SPEC.md'))
  ? path.join(V0ID_ROOT, 'V0ID_SPEC.md')
  : path.join(V0ID_ROOT, 'v0id_master_blueprint_spec.md');

const SOUL_PATH = path.join(V0ID_ROOT, 'SOUL.md');
const ENV_PATH = path.join(V0ID_ROOT, '.env');

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { action } = req.query;

    // 1. LER V0ID_SPEC.md (Blueprint Mestre), SOUL.md e .env
    if (req.method === 'GET' && action === 'config_files') {
      const spec = fs.existsSync(SPEC_PATH) ? fs.readFileSync(SPEC_PATH, 'utf8') : '';
      const soul = fs.existsSync(SOUL_PATH) ? fs.readFileSync(SOUL_PATH, 'utf8') : '';
      const env = fs.existsSync(ENV_PATH) ? fs.readFileSync(ENV_PATH, 'utf8') : '';
      return res.status(200).json({ success: true, spec, soul, env });
    }

    // 2. SALVAR V0ID_SPEC.md, SOUL.md e .env NO DISCO
    if (req.method === 'POST' && action === 'save_config') {
      const { spec, soul, env } = req.body;
      if (spec !== undefined && SPEC_PATH) fs.writeFileSync(SPEC_PATH, spec, 'utf8');
      if (soul !== undefined && SOUL_PATH) fs.writeFileSync(SOUL_PATH, soul, 'utf8');
      if (env !== undefined && ENV_PATH) fs.writeFileSync(ENV_PATH, env, 'utf8');
      return res.status(200).json({
        success: true,
        message: 'V0id Master Blueprint (V0ID_SPEC.md) e .env gravados com sucesso no disco rígido.'
      });
    }

    // 3. AÇÕES GIT (REPOSITORY HUB)
    if (req.method === 'POST' && action === 'git') {
      const { gitCmd, projectId } = req.body;
      const targetDir = getProjectFolder(projectId);

      try {
        let output = '';
        if (gitCmd === 'status') {
          output = execSync('git status --short', { cwd: targetDir, encoding: 'utf8', timeout: 15000 });
        } else if (gitCmd === 'diff') {
          output = execSync('git diff -U3', { cwd: targetDir, encoding: 'utf8', timeout: 15000 });
        } else if (gitCmd === 'log') {
          output = execSync('git log -n 10 --oneline', { cwd: targetDir, encoding: 'utf8', timeout: 15000 });
        } else if (gitCmd === 'init') {
          output = execSync('git init', { cwd: targetDir, encoding: 'utf8', timeout: 15000 });
        } else if (gitCmd === 'commit') {
          const msg = (req.body.message || 'V0id auto-sync checkpoint').replace(/"/g, '\\"');
          output = execSync(`git add . && git commit -m "${msg}"`, { cwd: targetDir, encoding: 'utf8', timeout: 20000 });
        } else if (gitCmd === 'push') {
          output = execSync('git push', { cwd: targetDir, encoding: 'utf8', timeout: 30000 });
        }
        return res.status(200).json({ success: true, output: output || 'Comando Git executado sem saída.' });
      } catch (err: any) {
        return res.status(200).json({ success: false, output: err.stdout || err.stderr || err.message });
      }
    }

    // 4. SINCRONIZAÇÃO GOOGLE DRIVE (REPOSITORY HUB)
    if (req.method === 'POST' && action === 'gdrive_sync') {
      const { projectId, gdrivePath } = req.body;
      const sourceDir = path.join(V0ID_ROOT, 'projetos', projectId || 'global');
      const targetDir = gdrivePath || process.env.GDRIVE_SYNC_PATH || path.join(V0ID_ROOT, 'backup_drive');

      if (!fs.existsSync(sourceDir)) {
        return res.status(404).json({ error: 'Pasta de origem não encontrada' });
      }

      fs.mkdirSync(targetDir, { recursive: true });

      let count = 0;
      for (const sub of ['output', 'assets', 'vault']) {
        const subPath = path.join(sourceDir, sub);
        if (fs.existsSync(subPath)) {
          const files = fs.readdirSync(subPath);
          for (const f of files) {
            const src = path.join(subPath, f);
            const dst = path.join(targetDir, `${sub}_${f}`);
            if (fs.statSync(src).isFile()) {
              fs.copyFileSync(src, dst);
              count++;
            }
          }
        }
      }

      return res.status(200).json({
        success: true,
        message: `${count} arquivo(s) sincronizados com sucesso na pasta do Google Drive: [${targetDir}]`
      });
    }

    return res.status(400).json({ error: 'Ação inválida' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
