// =========================================================================
// V0id OS — Interactive E2E Studio Feature & Button Tester (Edge CDP)
// Testa a interatividade real, cliques de botões e integridade de todas as cenas.
// =========================================================================

import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { spawn, execSync } from 'node:child_process';
import WebSocket from 'ws';
import { SCENES } from './v0id_capture_scenes.mjs';

const V0ID_ROOT = process.cwd().toLowerCase().endsWith('ui-launcher') ? path.resolve(process.cwd(), '..') : process.cwd();
const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const REPORT_FILE = path.join(V0ID_ROOT, 'docs', 'INTERACTIVE_TEST_REPORT.md');

export class EdgeCDPClient {
  constructor(port = 9226) {
    this.port = port;
    this.edgeProcess = null;
    this.ws = null;
    this.msgId = 1;
    this.pendingCallbacks = new Map();
  }

  async start() {
    const tmpProfile = path.join(os.tmpdir(), `v0id_edge_test_${Date.now()}`);
    this.edgeProcess = spawn(EDGE_PATH, [
      '--headless=new',
      `--remote-debugging-port=${this.port}`,
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-sync',
      '--disable-search-engine-choice-screen',
      '--disable-component-update',
      '--disable-background-networking',
      '--disable-default-apps',
      '--disable-extensions',
      '--disable-gpu',
      '--no-sandbox',
      '--window-size=1366,768',
      `--user-data-dir=${tmpProfile}`,
      'about:blank'
    ], { windowsHide: true });

    // Aguarda o endpoint do CDP estar disponível
    let ready = false;
    for (let i = 0; i < 30; i++) {
      try {
        const res = await fetch(`http://localhost:${this.port}/json`);
        if (res.ok) {
          ready = true;
          break;
        }
      } catch {}
      await new Promise(r => setTimeout(r, 200));
    }

    if (!ready) throw new Error('Não foi possível iniciar o Edge com porta CDP.');

    const res = await fetch(`http://localhost:${this.port}/json`);
    const tabs = await res.json();
    const target = tabs.find(t => t.type === 'page' && !t.url.startsWith('edge://')) || tabs.find(t => t.type === 'page') || tabs[0];

    if (!target || !target.webSocketDebuggerUrl) {
      throw new Error('Nenhuma aba válida encontrada no Edge CDP.');
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timeout de conexão ao WebSocket CDP do Edge.'));
      }, 8000);

      this.ws = new WebSocket(target.webSocketDebuggerUrl);
      this.ws.on('open', async () => {
        try {
          await this.send('Page.enable', {}, 5000);
          await this.send('Runtime.enable', {}, 5000);
          clearTimeout(timeout);
          resolve();
        } catch (err) {
          clearTimeout(timeout);
          reject(err);
        }
      });
      this.ws.on('message', (data) => {
        try {
          const msg = JSON.parse(data.toString());
          if (msg.id && this.pendingCallbacks.has(msg.id)) {
            const cb = this.pendingCallbacks.get(msg.id);
            this.pendingCallbacks.delete(msg.id);
            if (msg.error) cb.reject(new Error(msg.error.message));
            else cb.resolve(msg.result);
          }
        } catch {}
      });
      this.ws.on('error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });
  }

  send(method, params = {}, timeoutMs = 10000) {
    return new Promise((resolve, reject) => {
      const id = this.msgId++;
      let timer = null;
      if (timeoutMs > 0) {
        timer = setTimeout(() => {
          if (this.pendingCallbacks.has(id)) {
            this.pendingCallbacks.delete(id);
            reject(new Error(`Timeout ao executar CDP comando [${method}] após ${timeoutMs}ms`));
          }
        }, timeoutMs);
      }
      this.pendingCallbacks.set(id, {
        resolve: (val) => {
          if (timer) clearTimeout(timer);
          resolve(val);
        },
        reject: (err) => {
          if (timer) clearTimeout(timer);
          reject(err);
        }
      });
      try {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
          if (timer) clearTimeout(timer);
          this.pendingCallbacks.delete(id);
          reject(new Error(`WebSocket CDP fechado ao enviar comando [${method}]`));
          return;
        }
        this.ws.send(JSON.stringify({ id, method, params }));
      } catch (err) {
        if (timer) clearTimeout(timer);
        this.pendingCallbacks.delete(id);
        reject(err);
      }
    });
  }

  async navigate(url) {
    try {
      await this.send('Page.navigate', { url }, 8000);
    } catch {}
    // Aguarda hidratação do React e carregamento inicial
    await new Promise(r => setTimeout(r, 1200));
  }

  async evaluate(expression, timeoutMs = 8000) {
    const res = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true
    }, timeoutMs);
    return res?.result?.value;
  }

  async close() {
    try { if (this.ws) this.ws.close(); } catch {}
    try {
      if (this.edgeProcess && this.edgeProcess.pid) {
        try { execSync(`taskkill /pid ${this.edgeProcess.pid} /T /F`, { stdio: 'ignore', windowsHide: true }); } catch {}
      }
    } catch {}
  }
}

export async function runInteractiveTest(onProgress) {
  console.log(`\n==================================================`);
  console.log(`🧪 V0ID OS — AUDITORIA INTERATIVA E TESTE DE BOTÕES E2E`);
  console.log(`Navegador: Edge Headless (DevTools Protocol Nativo)`);
  console.log(`==================================================\n`);

  const client = new EdgeCDPClient();
  const results = [];

  try {
    await client.start();
    let index = 0;

    for (const scene of SCENES) {
      index++;
      const progressMsg = `[${index}/${SCENES.length}] Testando cena [${scene.id}] (${scene.name})...`;
      console.log(progressMsg);
      if (typeof onProgress === 'function') onProgress(progressMsg);

      await client.navigate(scene.url);

      // Injeta rastreador de erros de console e inspeciona botões
      const inspectionScript = `
        (() => {
          window.__v0id_errors = window.__v0id_errors || [];
          window.onerror = (msg, url, line) => window.__v0id_errors.push({ type: 'error', msg, line });
          window.onunhandledrejection = (e) => window.__v0id_errors.push({ type: 'promise', msg: String(e.reason) });

          const buttons = Array.from(document.querySelectorAll('button'));
          const inputs = Array.from(document.querySelectorAll('input, textarea, select'));

          const buttonData = buttons.map(b => {
            const rect = b.getBoundingClientRect();
            return {
              text: (b.innerText || b.getAttribute('title') || b.getAttribute('aria-label') || '').trim().slice(0, 30),
              disabled: b.disabled,
              visible: rect.width > 0 && rect.height > 0,
              isCutOffRight: rect.right > window.innerWidth,
              isCutOffBottom: rect.bottom > window.innerHeight
            };
          });

          // Testa cliques em botões seguros (abas, visualizadores, filtros)
          let clicksAttempted = 0;
          const isHomeLauncher = window.location.pathname === '/' && !window.location.search;

          if (!isHomeLauncher) {
            for (const btn of buttons) {
              const text = (btn.innerText || '').toLowerCase();
              const isDestructive = /reverter|deletar|excluir|parar|reset|destruir/i.test(text);
              const isNav = /router|link/i.test(btn.className) || btn.closest('a');
              if (!isDestructive && !isNav && !btn.disabled && btn.offsetWidth > 0) {
                try {
                  btn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
                  clicksAttempted++;
                  if (clicksAttempted >= 4) break; // Testa até 4 botões seguros por cena
                } catch {}
              }
            }
          }

          return {
            title: document.title,
            buttonCount: buttons.length,
            inputCount: inputs.length,
            clicksAttempted,
            buttons: buttonData,
            cutOffCount: buttonData.filter(b => b.isCutOffRight || b.isCutOffBottom).length,
            errors: window.__v0id_errors
          };
        })()
      `;

      try {
        const data = await client.evaluate(inspectionScript);
        const hasErrors = (data?.errors || []).length > 0;
        const hasCutoffs = (data?.cutOffCount || 0) > 0;

        let status = '100% OPERANTE';
        if (hasErrors) status = 'ERRO DE SCRIPT';
        else if (hasCutoffs) status = 'AVISO DE CORTE VISUAL';

        const summary = `  ✅ Botões: ${data?.buttonCount || 0} | Inputs: ${data?.inputCount || 0} | Cliques testados: ${data?.clicksAttempted || 0} | Status: ${status}`;
        console.log(summary);
        if (typeof onProgress === 'function') onProgress(summary);

        results.push({
          scene: scene.id,
          name: scene.name,
          url: scene.url,
          buttonCount: data?.buttonCount || 0,
          inputCount: data?.inputCount || 0,
          clicksTested: data?.clicksAttempted || 0,
          cutOffButtons: data?.cutOffCount || 0,
          errors: data?.errors || [],
          status,
          ok: !hasErrors
        });
      } catch (err) {
        console.warn(`  ⚠️ Falha ao avaliar cena ${scene.id}: ${err.message}`);
        results.push({ scene: scene.id, name: scene.name, ok: false, error: err.message, status: 'FALHA' });
      }
    }
  } finally {
    await client.close();
  }

  // Gera relatório Markdown
  let reportMd = `# 🧪 V0ID OS — RELATÓRIO DE AUDITORIA INTERATIVA E2E\n\n`;
  reportMd += `Executado em: **${new Date().toISOString()}**\n\n`;
  reportMd += `| Estúdio | ID | Botões | Inputs | Cliques Testados | Cortes Detectados | Status |\n`;
  reportMd += `|---|---|---|---|---|---|---|\n`;

  for (const r of results) {
    reportMd += `| **${r.name}** | \`${r.scene}\` | ${r.buttonCount || 0} | ${r.inputCount || 0} | ${r.clicksTested || 0} | ${r.cutOffButtons || 0} | **${r.status}** |\n`;
  }

  try {
    fs.writeFileSync(REPORT_FILE, reportMd, 'utf8');
    console.log(`\n📄 Relatório de testes interativos salvo em: ${REPORT_FILE}`);
  } catch {}

  return results;
}

const isDirect = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(import.meta.filename || '');
if (isDirect) {
  runInteractiveTest().catch(console.error);
}
