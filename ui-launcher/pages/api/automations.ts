import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'node:fs';
import path from 'node:path';
import { execSync, spawn } from 'node:child_process';

const V0ID_ROOT = path.resolve(process.cwd(), '..');
const PID_FILE = path.join(V0ID_ROOT, 'v0id_loop.pid');
const STOP_FILE = path.join(V0ID_ROOT, 'v0id_loop.stop');
const LOG_FILE = path.join(V0ID_ROOT, 'EVOLUTION_LOG.md');
const RUNNER_LOG = path.join(V0ID_ROOT, 'loop_runner.log');
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

function getRecentLogs(): string {
  let output = '';

  // 1. Histórico consolidado em Markdown (EVOLUTION_LOG.md) no topo
  if (fs.existsSync(LOG_FILE)) {
    try {
      const content = fs.readFileSync(LOG_FILE, 'utf8').trim();
      if (content) {
        const lines = content.split('\n');
        output += `📜 [HISTÓRICO CONSOLIDADO (EVOLUTION_LOG.md)]\n` + lines.slice(-20).join('\n') + `\n\n`;
      }
    } catch {}
  }

  // 2. Streaming ao vivo do executor atual (loop_runner.log) NO FINAL (onde o autoscroll foca!)
  if (fs.existsSync(RUNNER_LOG)) {
    try {
      const runnerContent = fs.readFileSync(RUNNER_LOG, 'utf8').trim();
      if (runnerContent) {
        const lines = runnerContent.split('\n');
        output += `⚡ [STREAMING AO VIVO DO MOTOR EM TEMPO REAL]\n` + lines.slice(-45).join('\n');
      }
    } catch {}
  }

  return output.trim() || 'Nenhum log de evolução gerado ainda. Clique em "Iniciar Loop de Auto-Melhoria" para começar.';
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Previne qualquer cache HTTP pelo browser ou proxy
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  // 1. GET: Retorna status do loop, logs recentes e checkpoint de segurança
  if (req.method === 'GET') {
    try {
      const { running, pid } = isLoopRunning();
      const recentLogs = getRecentLogs();
      
      let gitCommit = 'Desconhecido';
      try {
        gitCommit = execSync('git rev-parse --short HEAD', { cwd: V0ID_ROOT, encoding: 'utf8', windowsHide: true }).trim();
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

        if (fs.existsSync(STOP_FILE)) {
          try { fs.unlinkSync(STOP_FILE); } catch {}
        }

        const scriptPath = path.join(V0ID_ROOT, 'v0id_token_budget_loop.mjs');
        const outFd = fs.openSync(RUNNER_LOG, 'a');

        // Spawna com windowsHide: true e redirecionamento de stdio para RUNNER_LOG
        // Isso impede completamente a abertura de qualquer janela de cmd preta na tela do usuário
        const child = spawn('node', [scriptPath], {
          cwd: V0ID_ROOT,
          detached: true,
          windowsHide: true,
          stdio: ['ignore', outFd, outFd]
        });
        child.unref();

        fs.writeFileSync(PID_FILE, String(child.pid), 'utf8');

        return res.status(200).json({
          success: true,
          message: '🚀 Loop de auto-evolução iniciado em background! Executará silenciosamente até esgotar os tokens do OmniRoute.',
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
            execSync(`taskkill /pid ${pid} /T /F`, { stdio: 'ignore', windowsHide: true });
          } catch {
            try { process.kill(pid, 'SIGTERM'); } catch {}
          }
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
          try {
            execSync(`taskkill /pid ${pid} /T /F`, { stdio: 'ignore', windowsHide: true });
          } catch {}
        }
        try { if (fs.existsSync(PID_FILE)) fs.unlinkSync(PID_FILE); } catch {}

        console.log(`[ROLLBACK DE SEGURANÇA] Restaurando código para ${SAFE_CHECKPOINT_TAG}...`);
        execSync(`git reset --hard ${SAFE_CHECKPOINT_TAG}`, { cwd: V0ID_ROOT, encoding: 'utf8', windowsHide: true });
        execSync('git clean -fd', { cwd: V0ID_ROOT, encoding: 'utf8', windowsHide: true });

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
        execSync(`git tag -a "${tagName}" -m "Manual checkpoint criado pelo usuário"`, { cwd: V0ID_ROOT, encoding: 'utf8', windowsHide: true });
        try {
          execSync(`git push origin "${tagName}"`, { cwd: V0ID_ROOT, encoding: 'utf8', timeout: 25000, windowsHide: true });
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
