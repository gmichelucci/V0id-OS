import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'node:fs';
import path from 'node:path';
import { exec } from 'node:child_process';
// @ts-ignore
import { DatabaseSync } from 'node:sqlite';

const DB_PATH = path.resolve(process.cwd(), '../03_chat_projects_nexus/nexus-db/nexus.db');
// Repositório central de projetos na raiz do V0id OS: c:\V0id\projetos\
const VAULT_ROOT = path.resolve(process.cwd(), '../projetos');

function getDb() {
  return new DatabaseSync(DB_PATH);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    fs.mkdirSync(VAULT_ROOT, { recursive: true });
    const db = getDb();

    // 1. ACTION: ABRIR PASTA NO WINDOWS EXPLORER
    if (req.method === 'POST' && req.query.action === 'open_folder') {
      const { id } = req.body;
      const folderPath = (id && id !== 'global') ? path.join(VAULT_ROOT, id) : VAULT_ROOT;
      fs.mkdirSync(folderPath, { recursive: true });
      exec(`explorer.exe "${folderPath}"`, () => {});
      return res.status(200).json({ success: true, message: `Pasta aberta no Windows: ${folderPath}` });
    }

    // 2. ACTION: RODAR / ABRIR APP NO NAVEGADOR
    if (req.method === 'POST' && req.query.action === 'run_app') {
      const { id } = req.body;
      const projDir = (id && id !== 'global') ? path.join(VAULT_ROOT, id) : VAULT_ROOT;
      const htmlFile = path.join(projDir, 'output', 'index.html');
      if (fs.existsSync(htmlFile)) {
        exec(`start "" "${htmlFile}"`, () => {});
        return res.status(200).json({ success: true, message: `App aberto no navegador: ${htmlFile}` });
      } else {
        // Fallback abre a pasta se ainda não houver index.html
        exec(`explorer.exe "${projDir}"`, () => {});
        return res.status(200).json({ success: true, message: `Arquivo output/index.html não encontrado. Pasta aberta: ${projDir}` });
      }
    }

    // 3. GET: LISTAR PROJETOS REAIS DO BANCO E DISCO
    if (req.method === 'GET') {
      const rows = db.prepare('SELECT id, name, description, type, sync_target, active FROM projects ORDER BY created_at ASC').all() as any[];
      const enriched = rows.map(r => {
        const folder = path.join(VAULT_ROOT, r.id);
        const folderExists = fs.existsSync(folder);
        return {
          ...r,
          folderExists,
          folderPath: folder
        };
      });
      return res.status(200).json({ success: true, projects: enriched });
    }

    // 4. POST: CRIAR NOVO PROJETO REAL (NO BANCO E NO DISCO)
    if (req.method === 'POST') {
      const { id, name, description, type, syncTarget } = req.body;
      if (!name) return res.status(400).json({ error: 'Nome do projeto é obrigatório' });

      const slug = id || name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
      const syncType = type || 'git';
      
      let sync = syncTarget;
      if (!sync) {
        if (syncType === 'git') sync = `https://github.com/v0id-os/${slug}`;
        else if (syncType === 'drive') sync = `Google Drive: V0id_Vault/${slug}`;
        else if (syncType === 'both') sync = `GitHub + Google Drive (${slug})`;
        else sync = 'Apenas Local';
      }

      // Salva no SQLite
      const stmt = db.prepare('INSERT OR REPLACE INTO projects (id, name, description, type, sync_target, active) VALUES (?, ?, ?, ?, ?, 1)');
      stmt.run(slug, name, description || '', syncType, sync);

      // Cria a estrutura física de pastas dentro de c:\V0id\projetos\<slug>\
      const projDir = path.join(VAULT_ROOT, slug);
      for (const sub of ['src', 'assets', 'vault', 'output']) {
        fs.mkdirSync(path.join(projDir, sub), { recursive: true });
      }

      // Cria arquivo inicial de documentação no projeto
      const docPath = path.join(projDir, 'vault', 'README.md');
      if (!fs.existsSync(docPath)) {
        fs.writeFileSync(docPath, `# ${name}\n\n${description || 'Projeto criado no V0id OS.'}\n\nSincronização: ${sync} (${syncType})\nDiretório: ${projDir}\n`, 'utf8');
      }

      return res.status(201).json({
        success: true,
        project: { id: slug, name, description, type: syncType, syncTarget: sync, folderPath: projDir }
      });
    }

    // 5. DELETE: EXCLUIR PROJETO DO BANCO E DO DISCO
    if (req.method === 'DELETE') {
      const { id } = req.query;
      if (!id || id === 'global') {
        return res.status(400).json({ error: 'Não é permitido excluir o contexto raiz Global' });
      }

      // Remove do banco
      db.prepare('DELETE FROM projects WHERE id = ?').run(id as string);
      db.prepare('DELETE FROM history_cross_tags WHERE project_id = ?').run(id as string);

      // Remove pasta física com segurança
      const projDir = path.join(VAULT_ROOT, id as string);
      if (fs.existsSync(projDir)) {
        fs.rmSync(projDir, { recursive: true, force: true });
      }

      return res.status(200).json({ success: true, message: `Projeto [${id}] removido do banco e do disco.` });
    }

    return res.status(405).json({ error: 'Método não permitido' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
