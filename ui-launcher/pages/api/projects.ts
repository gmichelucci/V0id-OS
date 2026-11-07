import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'node:fs';
import path from 'node:path';
import { exec, execSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
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
      let folderPath = VAULT_ROOT;
      if (id && id !== 'global') {
        const row = db.prepare('SELECT type, sync_target FROM projects WHERE id = ?').get(id) as any;
        if (row && row.type === 'local' && row.sync_target?.startsWith('local:')) {
          folderPath = row.sync_target.substring(6);
        } else {
          folderPath = path.join(VAULT_ROOT, id);
        }
      }
      if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath, { recursive: true });
      exec(`explorer.exe "${folderPath}"`, () => {});
      return res.status(200).json({ success: true, message: `Pasta aberta no Windows: ${folderPath}` });
    }

    // 1.1 ACTION: VINCULAR REPOSITÓRIO LOCAL EXISTENTE
    if (req.method === 'POST' && req.query.action === 'link_repo') {
      const { id, name, localPath, description } = req.body;
      if (!localPath || typeof localPath !== 'string') {
        return res.status(400).json({ error: 'Caminho local da pasta é obrigatório' });
      }
      const fullLocalPath = path.resolve(localPath.trim());
      if (!fs.existsSync(fullLocalPath)) {
        return res.status(400).json({ error: 'A pasta informada não foi encontrada no Windows: ' + fullLocalPath });
      }

      const slug = id || (name || path.basename(fullLocalPath)).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
      const projName = name || path.basename(fullLocalPath);

      db.prepare(`
        INSERT OR REPLACE INTO projects (id, name, description, type, sync_target, active)
        VALUES (?, ?, ?, 'local', ?, 1)
      `).run(slug, projName, description || ('Repositório local em ' + fullLocalPath), 'local:' + fullLocalPath);

      return res.status(200).json({
        success: true,
        project: {
          id: slug,
          name: projName,
          type: 'local',
          sync_target: 'local:' + fullLocalPath,
          folderPath: fullLocalPath,
          folderExists: true
        },
        message: 'Repositório "' + projName + '" vinculado com sucesso em ' + fullLocalPath + '!'
      });
    }

    // 1.2 ACTION: ABRIR DIÁLOGO NATIVO DO WINDOWS PARA ESCOLHER PASTA
    if (req.method === 'POST' && req.query.action === 'browse_folder') {
      try {
        const psScript = `
Add-Type -AssemblyName System.Windows.Forms;
$f = New-Object System.Windows.Forms.FolderBrowserDialog;
$f.Description = 'Selecione qualquer pasta de projeto ou repositório no seu computador';
$f.ShowNewFolderButton = $true;
if ($f.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) {
  Write-Output $f.SelectedPath
}
`;
        const selected = execSync(`powershell -Sta -Command "${psScript.replace(/\r?\n/g, ' ')}"`, {
          encoding: 'utf8',
          timeout: 45000
        }).trim();

        if (selected && fs.existsSync(selected)) {
          return res.status(200).json({ success: true, folderPath: selected, name: path.basename(selected) });
        }
        return res.status(200).json({ success: false, message: 'Nenhuma pasta selecionada' });
      } catch (err: any) {
        return res.status(500).json({ error: 'Erro ao abrir seletor: ' + err.message });
      }
    }

    // 1.3 ACTION: LISTAR PASTAS RÁPIDAS SUGERIDAS DO COMPUTADOR DO USUÁRIO
    if (req.method === 'GET' && req.query.action === 'quick_paths') {
      const os = await import('node:os');
      const home = os.homedir();
      const candidates = [
        'C:\\Projetos',
        path.join(home, 'Projects'),
        path.join(home, 'Documents'),
        path.join(home, 'Desktop'),
        path.join(home, 'Downloads'),
        'C:\\V0id',
        'C:\\'
      ];
      const valid: Array<{ name: string; path: string }> = [];
      for (const p of candidates) {
        if (fs.existsSync(p)) {
          valid.push({ name: path.basename(p) || p, path: p });
          if (p === 'C:\\Projetos' || p.toLowerCase().endsWith('projects')) {
            try {
              const subs = fs.readdirSync(p, { withFileTypes: true });
              for (const s of subs) {
                if (s.isDirectory() && !s.name.startsWith('.')) {
                  valid.push({ name: `${s.name}`, path: path.join(p, s.name) });
                }
              }
            } catch {}
          }
        }
      }
      return res.status(200).json({ success: true, paths: valid });
    }

    // 1.4 ACTION: AUTOCOMPLETAR ARQUIVOS DO PROJETO PARA MENÇÃO COM @ (PADRÃO ANTIGRAVITY)
    if (req.method === 'GET' && req.query.action === 'suggest_files') {
      const { id, query } = req.query;
      let projectFolder = VAULT_ROOT;
      if (id && id !== 'global') {
        const row = db.prepare('SELECT type, sync_target FROM projects WHERE id = ?').get(id as string) as any;
        if (row && row.type === 'local' && row.sync_target?.startsWith('local:')) {
          projectFolder = row.sync_target.substring(6);
        } else {
          projectFolder = path.join(VAULT_ROOT, id as string);
        }
      } else if (id === 'global') {
        projectFolder = 'C:\\';
      }

      const q = typeof query === 'string' ? query.toLowerCase().trim() : '';
      const results: Array<{ name: string; relativePath: string; isDir: boolean }> = [];

      try {
        const crawl = (currentDir: string, depth = 0) => {
          if (depth > 4 || results.length >= 30) return;
          const entries = fs.readdirSync(currentDir, { withFileTypes: true });
          for (const e of entries) {
            if (e.name.startsWith('.') || e.name === 'node_modules' || e.name === '.next' || e.name === '.godot') continue;
            const full = path.join(currentDir, e.name);
            const rel = path.relative(projectFolder, full).replace(/\\/g, '/');
            if (!q || rel.toLowerCase().includes(q) || e.name.toLowerCase().includes(q)) {
              results.push({ name: e.name, relativePath: rel, isDir: e.isDirectory() });
            }
            if (e.isDirectory() && results.length < 30) {
              crawl(full, depth + 1);
            }
          }
        };
        if (fs.existsSync(projectFolder)) {
          crawl(projectFolder);
        }
      } catch {}

      return res.status(200).json({ success: true, suggestions: results.slice(0, 20) });
    }

    // 1.5 ACTION: REVERTER ALTERAÇÃO DE DIFF
    if (req.method === 'POST' && req.query.action === 'rollback') {
      const { snapshotId } = req.body;
      try {
        const dynamicImport = new Function('specifier', 'return import(specifier)');
        const toolsPath = pathToFileURL(path.resolve(process.cwd(), '../01_core_security/v0id-cli/tools.js')).href + `?t=${Date.now()}`;
        const { rollbackSnapshot } = await dynamicImport(toolsPath);
        const result = rollbackSnapshot(snapshotId);
        return res.status(200).json({ success: true, message: result });
      } catch (err: any) {
        return res.status(400).json({ error: err.message });
      }
    }

    // 1.6 ACTION: LISTAR DIFFS E SNAPSHOTS RECENTES (INSPEÇÃO VISUAL)
    if (req.method === 'GET' && req.query.action === 'diffs') {
      const { id } = req.query;
      let projectFolder = VAULT_ROOT;
      if (id && id !== 'global') {
        const row = db.prepare('SELECT type, sync_target FROM projects WHERE id = ?').get(id as string) as any;
        if (row && row.type === 'local' && row.sync_target?.startsWith('local:')) {
          projectFolder = row.sync_target.substring(6);
        } else {
          projectFolder = path.join(VAULT_ROOT, id as string);
        }
      } else if (id === 'global') {
        projectFolder = process.cwd().toLowerCase().endsWith('ui-launcher') ? path.resolve(process.cwd(), '..') : process.cwd();
      }

      let gitDiff = '';
      try {
        if (fs.existsSync(projectFolder)) {
          gitDiff = execSync('git diff -U3', { cwd: projectFolder, encoding: 'utf8', timeout: 8000 });
        }
      } catch {}

      let snapshots: any[] = [];
      try {
        const dynamicImport = new Function('specifier', 'return import(specifier)');
        const toolsPath = pathToFileURL(path.resolve(process.cwd(), '../01_core_security/v0id-cli/tools.js')).href + `?t=${Date.now()}`;
        const { listSnapshots } = await dynamicImport(toolsPath);
        snapshots = listSnapshots(20);
      } catch {}

      return res.status(200).json({ success: true, snapshots, gitDiff, projectFolder });
    }

    // 1.7 ACTION: EXECUTAR COMANDO NO TERMINAL INTEGRADO DO PROJETO
    if (req.method === 'POST' && req.query.action === 'run_terminal_cmd') {
      const { cmd, id } = req.body;
      if (!cmd || typeof cmd !== 'string') return res.status(400).json({ error: 'Comando ausente' });
      
      let targetDir = process.cwd().toLowerCase().endsWith('ui-launcher') ? path.resolve(process.cwd(), '..') : process.cwd();
      if (id && id !== 'global' && id !== 'v0id') {
        const row = db.prepare('SELECT type, sync_target FROM projects WHERE id = ?').get(id as string) as any;
        if (row && row.type === 'local' && row.sync_target?.startsWith('local:')) {
          targetDir = row.sync_target.substring(6);
        } else {
          targetDir = path.join(VAULT_ROOT, id as string);
        }
      }

      try {
        const output = execSync(cmd, { cwd: targetDir, encoding: 'utf8', timeout: 20000, shell: 'powershell.exe' });
        return res.status(200).json({ success: true, output: output || 'Executado com sucesso (sem saída).', cwd: targetDir, exitCode: 0 });
      } catch (err: any) {
        return res.status(200).json({ success: false, output: err.stdout || err.stderr || err.message, cwd: targetDir, exitCode: err.status || 1 });
      }
    }

    // 1.8 ACTION: AUTOCOMPLETAR SÍMBOLOS DO GRAFO E AST COM # (PADRÃO ANTIGRAVITY)
    if (req.method === 'GET' && req.query.action === 'suggest_symbols') {
      const { query } = req.query;
      const q = typeof query === 'string' ? query.toLowerCase().trim() : '';
      const v0idRoot = process.cwd().toLowerCase().endsWith('ui-launcher') ? path.resolve(process.cwd(), '..') : process.cwd();
      const graphFile = path.resolve(v0idRoot, 'graphify-out', 'graph.json');
      const symbols: Array<{ label: string; file: string; line?: string; kind?: string; community?: string }> = [];

      if (fs.existsSync(graphFile)) {
        try {
          const graphData = JSON.parse(fs.readFileSync(graphFile, 'utf8'));
          if (Array.isArray(graphData.nodes)) {
            for (const n of graphData.nodes) {
              if (symbols.length >= 25) break;
              const lbl = n.label || '';
              const file = n.source_file || '';
              if (!lbl) continue;
              if (!q || lbl.toLowerCase().includes(q) || file.toLowerCase().includes(q)) {
                symbols.push({
                  label: lbl,
                  file,
                  line: n.source_location || '',
                  kind: n._callable_class ? 'class' : (n._callable ? 'function' : 'module'),
                  community: n.community_name || ''
                });
              }
            }
          }
        } catch {}
      }
      return res.status(200).json({ success: true, symbols });
    }

    // 1.9 ACTION: MÉTRICAS E HEALTH SCORECARD DO OMNIROUTE
    if (req.method === 'GET' && req.query.action === 'omniroute_metrics') {
      try {
        const dynamicImport = new Function('specifier', 'return import(specifier)');
        const nexusPath = pathToFileURL(path.resolve(process.cwd(), '../03_chat_projects_nexus/nexus-db/nexus.js')).href + `?t=${Date.now()}`;
        const { nexus } = await dynamicImport(nexusPath);
        const metrics = nexus.getProviderMetrics();
        const hibernations = nexus.getAllHibernations();
        return res.status(200).json({ success: true, metrics, hibernations });
      } catch (err: any) {
        return res.status(500).json({ success: false, error: err.message });
      }
    }

    // 2. ACTION: RODAR / ABRIR APP NO NAVEGADOR
    if (req.method === 'POST' && req.query.action === 'run_app') {
      const { id } = req.body;
      let projDir = VAULT_ROOT;
      if (id && id !== 'global') {
        const row = db.prepare('SELECT type, sync_target FROM projects WHERE id = ?').get(id) as any;
        if (row && row.type === 'local' && row.sync_target?.startsWith('local:')) {
          projDir = row.sync_target.substring(6);
        } else {
          projDir = path.join(VAULT_ROOT, id);
        }
      }
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

      const hasGlobal = rows.some(r => r.id === 'global');
      const hasV0id = rows.some(r => r.id === 'v0id');

      if (!hasGlobal) {
        db.prepare("INSERT OR IGNORE INTO projects (id, name, description, type, sync_target, active) VALUES ('global', 'Global', 'Ambiente Desktop Global', 'local', 'local:C:\\', 1)").run();
        rows.push({ id: 'global', name: 'Global', description: 'Ambiente Desktop Global', type: 'local', sync_target: 'local:C:\\', active: 1 });
      }

      if (!hasV0id) {
        const cwd = process.cwd();
        const rootPath = cwd.toLowerCase().endsWith('ui-launcher') ? path.resolve(cwd, '..') : cwd;
        db.prepare("INSERT OR IGNORE INTO projects (id, name, description, type, sync_target, active) VALUES ('v0id', 'V0id OS', 'Repositório Local V0id', 'local', ?, 1)").run(`local:${rootPath}`);
        rows.push({ id: 'v0id', name: 'V0id OS', description: 'Repositório Local V0id', type: 'local', sync_target: `local:${rootPath}`, active: 1 });
      }

      const enriched = rows.map(r => {
        const folder = (r.type === 'local' && r.sync_target?.startsWith('local:'))
          ? r.sync_target.substring(6)
          : path.join(VAULT_ROOT, r.id);
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
      const { id, name, description, type, syncTarget, localPath } = req.body;
      if (!name) return res.status(400).json({ error: 'Nome do projeto é obrigatório' });

      const slug = id || name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
      const syncType = type || 'git';
      
      let sync = syncTarget;
      if (!sync) {
        if (syncType === 'git') sync = `https://github.com/v0id-os/${slug}`;
        else if (syncType === 'drive') sync = `Google Drive: V0id_Vault/${slug}`;
        else if (syncType === 'both') sync = `GitHub + Google Drive (${slug})`;
        else if (syncType === 'local' && localPath) sync = `local:${localPath}`;
        else sync = 'Apenas Local';
      }

      // Se for diretório local customizado e ele existir/precisar ser criado:
      let projDir = path.join(VAULT_ROOT, slug);
      if (syncType === 'local' && localPath) {
        projDir = localPath;
        if (!fs.existsSync(projDir)) {
          fs.mkdirSync(projDir, { recursive: true });
        }
      } else {
        // Cria a estrutura física de pastas dentro de c:\V0id\projetos\<slug>\
        for (const sub of ['src', 'assets', 'vault', 'output']) {
          fs.mkdirSync(path.join(projDir, sub), { recursive: true });
        }
        // Cria arquivo inicial de documentação no projeto
        const docPath = path.join(projDir, 'vault', 'README.md');
        if (!fs.existsSync(docPath)) {
          fs.writeFileSync(docPath, `# ${name}\n\n${description || 'Projeto criado no V0id OS.'}\n\nSincronização: ${sync} (${syncType})\nDiretório: ${projDir}\n`, 'utf8');
        }
      }

      // Salva no SQLite
      const stmt = db.prepare('INSERT OR REPLACE INTO projects (id, name, description, type, sync_target, active) VALUES (?, ?, ?, ?, ?, 1)');
      stmt.run(slug, name, description || '', syncType, sync);

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

      let projDir = path.join(VAULT_ROOT, id as string);
      const row = db.prepare('SELECT type, sync_target FROM projects WHERE id = ?').get(id as string) as any;
      if (row && row.type === 'local' && row.sync_target?.startsWith('local:')) {
        projDir = row.sync_target.substring(6);
      }

      // Remove do banco
      db.prepare('DELETE FROM projects WHERE id = ?').run(id as string);
      db.prepare('DELETE FROM history_cross_tags WHERE project_id = ?').run(id as string);

      // Remove pasta física com segurança apenas se estiver em VAULT_ROOT (para não apagar repositórios de fora acidentalmente)
      if (projDir.startsWith(VAULT_ROOT) && fs.existsSync(projDir)) {
        fs.rmSync(projDir, { recursive: true, force: true });
      }

      return res.status(200).json({ success: true, message: `Projeto [${id}] removido do banco.` });
    }

    return res.status(405).json({ error: 'Método não permitido' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
