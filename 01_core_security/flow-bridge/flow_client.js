// =========================================================================
// V0id OS — Google Flow Headless CDP Bridge (Nano Banana Autonomous Client)
// Conecta-se ao Edge dedicado (porta 9222) via CDP para sintetizar imagens
// no Google Flow reutilizando os créditos do Google Pro do usuário.
// =========================================================================

import path from 'node:path';
import fs from 'node:fs';
import { spawn } from 'node:child_process';
import WebSocket from 'ws';

const ROOT_DIR = process.cwd().includes('ui-launcher') ? path.resolve(process.cwd(), '..') : process.cwd();
const PROFILE_DIR = path.join(ROOT_DIR, '.flow_browser');
const PORT = 9222;

const EDGE_PATHS = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
];

export class GoogleFlowBridge {
  constructor(port = PORT) {
    this.port = port;
    this.profileDir = PROFILE_DIR;
    this.edgePath = EDGE_PATHS.find(p => fs.existsSync(p));
  }

  isConfigured() {
    if (!fs.existsSync(this.profileDir)) return false;
    const defaultDir = path.join(this.profileDir, 'Default');
    return fs.existsSync(defaultDir);
  }

  async isPortAlive() {
    try {
      const res = await fetch(`http://localhost:${this.port}/json/version`, { signal: AbortSignal.timeout(1500) });
      return res.ok;
    } catch {
      return false;
    }
  }

  async ensureBrowserRunning(headless = true) {
    if (await this.isPortAlive()) return true;
    if (!this.edgePath) throw new Error('Microsoft Edge não encontrado.');

    const args = [
      `--remote-debugging-port=${this.port}`,
      `--user-data-dir=${this.profileDir}`,
      '--no-sandbox',
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-sync',
      '--disable-component-update',
      '--disable-background-networking'
    ];

    if (headless) {
      args.push('--headless=new');
    }

    args.push('https://flow.google.com/');

    const proc = spawn(this.edgePath, args, {
      detached: true,
      stdio: 'ignore',
      windowsHide: headless
    });
    proc.unref();

    for (let i = 0; i < 25; i++) {
      if (await this.isPortAlive()) return true;
      await new Promise(r => setTimeout(r, 400));
    }
    return false;
  }

  async connectToPage(filterUrl = 'flow.google') {
    const alive = await this.ensureBrowserRunning(true);
    if (!alive) throw new Error('Não foi possível conectar ao Edge na porta 9222.');

    const res = await fetch(`http://localhost:${this.port}/json`);
    const tabs = await res.json();
    let target = tabs.find(t => t.type === 'page' && t.url && t.url.includes(filterUrl));

    if (!target) {
      // Abre aba do Google Flow via CDP HTTP Endpoint
      const newTabRes = await fetch(`http://localhost:${this.port}/json/new?https://flow.google.com/`);
      target = await newTabRes.json();
      await new Promise(r => setTimeout(r, 2000));
    }

    if (!target || !target.webSocketDebuggerUrl) {
      throw new Error('Nenhuma aba do Google Flow com WebSocket CDP encontrada.');
    }

    return new Promise((resolve, reject) => {
      const ws = new WebSocket(target.webSocketDebuggerUrl);
      let msgId = 1;
      const pending = new Map();

      const send = (method, params = {}, timeoutMs = 15000) => {
        return new Promise((res, rej) => {
          const id = msgId++;
          const timer = setTimeout(() => {
            if (pending.has(id)) {
              pending.delete(id);
              rej(new Error(`Timeout CDP comando [${method}]`));
            }
          }, timeoutMs);

          pending.set(id, {
            resolve: (val) => { clearTimeout(timer); res(val); },
            reject: (err) => { clearTimeout(timer); rej(err); }
          });

          ws.send(JSON.stringify({ id, method, params }));
        });
      };

      ws.on('open', async () => {
        try {
          await send('Page.enable');
          await send('Runtime.enable');
          resolve({ ws, send, targetUrl: target.url });
        } catch (e) {
          reject(e);
        }
      });

      ws.on('message', (data) => {
        try {
          const m = JSON.parse(data.toString());
          if (m.id && pending.has(m.id)) {
            const cb = pending.get(m.id);
            pending.delete(m.id);
            if (m.error) cb.reject(new Error(m.error.message));
            else cb.resolve(m.result);
          }
        } catch {}
      });

      ws.on('error', reject);
    });
  }

  async generateImage({ prompt, aspectRatio = '1:1', timeoutMs = 60000 }) {
    if (!this.isConfigured()) {
      throw new Error('Perfil do Google Flow ainda não configurado. Execute setup_flow.js primeiro.');
    }

    const { ws, send, targetUrl } = await this.connectToPage('flow.google');

    try {
      // 1. Verifica se está logado na página
      const authCheck = await send('Runtime.evaluate', {
        expression: `(() => {
          const text = document.body ? document.body.innerText : '';
          const hasSignIn = text.includes('Fazer login') || text.includes('Sign in');
          const isFlowReady = !!document.querySelector('textarea, input, [contenteditable="true"]');
          return { hasSignIn, isFlowReady, title: document.title, url: window.location.href };
        })()`,
        returnByValue: true
      });

      const pageState = authCheck?.result?.value || {};
      if (pageState.hasSignIn && !pageState.isFlowReady) {
        throw new Error('Google Flow requer login. Abra "conectar_google_flow.bat" e faça login na sua conta.');
      }

      // 2. Procura o input do prompt ou seleciona o projeto V0id OS
      const injectPromptScript = `(async () => {
        // Tenta localizar projeto V0id OS se estiver na lista de projetos
        const projectButtons = Array.from(document.querySelectorAll('button, a, div[role="button"]'));
        const v0idProject = projectButtons.find(b => b.innerText && b.innerText.toLowerCase().includes('v0id os'));
        if (v0idProject) v0idProject.click();

        await new Promise(r => setTimeout(r, 1000));

        // Encontra o campo de entrada do prompt
        const input = document.querySelector('textarea, [contenteditable="true"], input[type="text"]');
        if (!input) return { ok: false, error: 'Campo de prompt do Google Flow não encontrado na tela.' };

        if (input.tagName === 'TEXTAREA' || input.tagName === 'INPUT') {
          input.value = ${JSON.stringify(prompt)};
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
        } else {
          input.innerText = ${JSON.stringify(prompt)};
          input.dispatchEvent(new InputEvent('input', { bubbles: true }));
        }

        // Tenta localizar o botão de gerar
        const buttons = Array.from(document.querySelectorAll('button, div[role="button"]'));
        const submitBtn = buttons.find(b => {
          const aria = (b.getAttribute('aria-label') || '').toLowerCase();
          const txt = (b.innerText || '').toLowerCase();
          return aria.includes('generate') || aria.includes('gerar') || aria.includes('create') || txt.includes('gerar') || txt.includes('generate');
        });

        if (submitBtn) {
          submitBtn.click();
          return { ok: true, submitted: true };
        }

        // Se não achou botão, dispara Enter
        input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true }));
        return { ok: true, submitted: true, viaEnter: true };
      })()`;

      const subRes = await send('Runtime.evaluate', {
        expression: injectPromptScript,
        returnByValue: true,
        awaitPromise: true
      });

      const subStatus = subRes?.result?.value;
      if (!subStatus || !subStatus.ok) {
        throw new Error(subStatus?.error || 'Não foi possível submeter prompt no Google Flow.');
      }

      // 3. Aguarda renderização da nova imagem (polling de até timeoutMs)
      const startTime = Date.now();
      let imageBase64 = null;

      while (Date.now() - startTime < timeoutMs) {
        await new Promise(r => setTimeout(r, 2000));
        const checkImage = await send('Runtime.evaluate', {
          expression: `(() => {
            const imgs = Array.from(document.querySelectorAll('img[src^="data:image"], img[src*="googleusercontent"], canvas'));
            if (!imgs.length) return null;
            const last = imgs[imgs.length - 1];
            if (last.tagName === 'CANVAS') {
              return last.toDataURL('image/png');
            }
            return last.src;
          })()`,
          returnByValue: true
        });

        const src = checkImage?.result?.value;
        if (src && (src.startsWith('data:image') || src.startsWith('http'))) {
          imageBase64 = src;
          break;
        }
      }

      if (!imageBase64) {
        throw new Error('Tempo limite excedido aguardando imagem gerada pelo Nano Banana.');
      }

      let buffer;
      if (imageBase64.startsWith('data:image')) {
        const cleanB64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
        buffer = Buffer.from(cleanB64, 'base64');
      } else {
        const fetchRes = await fetch(imageBase64);
        buffer = Buffer.from(await fetchRes.arrayBuffer());
      }

      return {
        buffer,
        format: 'png',
        modelUsed: 'Google Nano Banana (Google Flow Pro)'
      };

    } finally {
      try { ws.close(); } catch {}
    }
  }
}

export const flowBridge = new GoogleFlowBridge();
