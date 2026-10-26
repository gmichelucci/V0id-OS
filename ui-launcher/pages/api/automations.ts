import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'node:fs';
import path from 'node:path';
import { execSync, spawn } from 'node:child_process';

const V0ID_ROOT = path.resolve(process.cwd(), '..');
const PID_FILE = path.join(V0ID_ROOT, 'v0id_loop.pid');
const STOP_FILE = path.join(V0ID_ROOT, 'v0id_loop.stop');
const LOG_FILE = path.join(V0ID_ROOT, 'EVOLUTION_LOG.md');
const SAFE_CHECKPOINT_TAG = 'v5.0-stable-gold-checkpoint';

function isLoopRunning(): { running: boolean; pid?: number } {
  if (!fs.existsSync(PID_FILE)) return { running: false };
  try {
    const pidStr = fs.readFileSync(PID_FILE, 'utf8').trim();
    const pid = parseInt(pidStr, 10);
    if (!pid || isNaN(pid)) return { running: false };

    // Checa processo no Windows
    process.kill(pid, 0);
    return { running: true, pid };
  } catch {
    // Processo não existe mais
    try { fs.unlinkSync(PID_FILE); } catch {}
    return { running: false };
  }
}

function getRecentLogs(maxLines = 40): string {
  if (!fs.existsSync(LOG_FILE)) return 'Nenhum log de evolução gerado ainda.';
  try {
    const content = fs.readFileSync(LOG_FILE, 'utf8');
    const lines = content.split('\n');
    return lines.slice(-maxLines).join('\n');
  } catch {
    return 'Erro ao ler arquivo de log.';
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 1. GET: Retorna status do loop, logs recentes e checkpoint de segurança
  if (req.method === 'GET') {
    try {
      const { running, pid } = isLoopRunning();
      const recentLogs = getRecentLogs(35);
      
      let gitCommit = 'Desconhecido';
      try {
        gitCommit = execSync('git rev-parse --short HEAD', { cwd: V0ID_ROOT, encoding: 'utf8' }).trim();
      } catch {}

      return res.status(200).json({
        success: true,
        isRunning: running,
        pid: pid || null,
        recentLogs,
        currentCommit: gitCommit,
        safeCheckpointTag: SAFE_CHECKPOINT_TAG
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // 2. POST: Ações de controle (start, stop, rollback, checkpoint)
  if (req.method === 'POST') {
    const action = (req.query.action as string) || req.body?.action;

    // INICIAR LOOP EM BACKGROUND ATÉ ACABAR OS TOKENS
    if (action === 'start') {
      try {
        const { running, pid } = isLoopRunning();
        if (running) {
          return res.status(200).json({ success: true, message: `Loop já está em execução (PID ${pid}).`, isRunning: true });
        }

        if (fs.existsSync(STOP_FILE)) fs.unlinkSync(STOP_FILE);

        const scriptPath = path.join(V0ID_ROOT, 'v0id_token_budget_loop.mjs');
        const child = spawn('node', [scriptPath], {
          cwd: V0ID_ROOT,
          detached: true,
          stdio: 'ignore'
        });
        child.unref();

        fs.writeFileSync(PID_FILE, String(child.pid), 'utf8');

        return res.status(200).json({
          success: true,
          message: '🚀 Loop de auto-evolução iniciado em background! Executará até esgotar os tokens do OmniRoute.',
          isRunning: true,
          pid: child.pid
        });
      } catch (err: any) {
        return res.status(500).json({ success: false, error: err.message });
      }
    }

    // PARAR / INTERROMPER LOOP
    if (action === 'stop') {
      try {
        fs.writeFileSync(STOP_FILE, 'stop', 'utf8');
        const { running, pid } = isLoopRunning();
        if (running && pid) {
          try {
            process.kill(pid, 'SIGTERM');
          } catch {}
        }
        try { if (fs.existsSync(PID_FILE)) fs.unlinkSync(PID_FILE); } catch {}
        return res.status(200).json({ success: true, message: '⏹ Loop interrompido com sucesso.', isRunning: false });
      } catch (err: any) {
        return res.status(500).json({ success: false, error: err.message });
      }
    }

    // ROLLBACK / RESTAURAR VERSÃO SEGURA IMEDIATAMENTE
    if (action === 'rollback') {
      try {
        // Para qualquer loop que esteja rodando antes de resetar
        fs.writeFileSync(STOP_FILE, 'stop', 'utf8');
        const { running, pid } = isLoopRunning();
        if (running && pid) {
          try { process.kill(pid, 'SIGKILL'); } catch {}
        }
        try { if (fs.existsSync(PID_FILE)) fs.unlinkSync(PID_FILE); } catch {}

        console.log(`[ROLLBACK DE SEGURANÇA] Restaurando código para ${SAFE_CHECKPOINT_TAG}...`);
        execSync(`git reset --hard ${SAFE_CHECKPOINT_TAG}`, { cwd: V0ID_ROOT, encoding: 'utf8' });
        execSync('git clean -fd', { cwd: V0ID_ROOT, encoding: 'utf8' });

        return res.status(200).json({
          success: true,
          message: `⏪ Rollback concluído! O sistema foi restaurado com perfeição para o checkpoint seguro (${SAFE_CHECKPOINT_TAG}).`,
          restoredTo: SAFE_CHECKPOINT_TAG
        });
      } catch (err: any) {
        return res.status(500).json({ success: false, error: `Falha no rollback: ${err.message}` });
      }
    }

    // CRIAR NOVO CHECKPOINT SEGURO
    if (action === 'checkpoint') {
      try {
        const tagName = `checkpoint_manual_${Date.now()}`;
        execSync(`git tag -a "${tagName}" -m "Manual checkpoint criado pelo usuário"`, { cwd: V0ID_ROOT, encoding: 'utf8' });
        try {
          execSync(`git push origin "${tagName}"`, { cwd: V0ID_ROOT, encoding: 'utf8', timeout: 25000 });
        } catch {}

        return res.status(200).json({
          success: true,
          message: `💾 Checkpoint "${tagName}" criado e registrado com sucesso!`,
          checkpointTag: tagName
        });
      } catch (err: any) {
        return res.status(500).json({ success: false, error: err.message });
      }
    }
  }

  return res.status(405).json({ error: 'Método não permitido' });
}
