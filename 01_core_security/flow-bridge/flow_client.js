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
const FLOW_DEFAULT_URL = process.env.GOOGLE_FLOW_PROJECT_URL || 'https://flow.google.com/';

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

  async ensureBrowserRunning(headless = false) {
    if (await this.isPortAlive()) return true;
    if (!this.edgePath) throw new Error('Microsoft Edge não encontrado.');

    const args = [
      `--remote-debugging-port=${this.port}`,
      `--user-data-dir=${this.profileDir}`,
      '--no-first-run',
      '--no-default-browser-check',
      '--window-position=-32000,-32000'
    ];

    if (headless) {
      args.push('--headless=new');
    }

    args.push(FLOW_DEFAULT_URL);

    const proc = spawn(this.edgePath, args, {
      detached: true,
      stdio: 'ignore'
    });
    proc.unref();

    for (let i = 0; i < 25; i++) {
      if (await this.isPortAlive()) return true;
      await new Promise(r => setTimeout(r, 400));
    }
    return false;
  }

  async connectToPage(filterUrl = 'flow.google') {
    const alive = await this.ensureBrowserRunning(false);
    if (!alive) throw new Error('Não foi possível conectar ao Edge na porta 9222.');

    const res = await fetch(`http://localhost:${this.port}/json`);
    const tabs = await res.json();
    let target = tabs.find(t => t.type === 'page' && t.url && t.url.includes(filterUrl));

    if (!target) {
      const newTabRes = await fetch(`http://localhost:${this.port}/json/new?${encodeURI(FLOW_DEFAULT_URL)}`);
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

      const send = (method, params = {}, timeoutMs = 20000) => {
        return new Promise((resCb, rejCb) => {
          const id = msgId++;
          const timer = setTimeout(() => {
            if (pending.has(id)) {
              pending.delete(id);
              rejCb(new Error(`Timeout CDP comando [${method}] após ${timeoutMs}ms`));
            }
          }, timeoutMs);

          pending.set(id, {
            resolve: (val) => { clearTimeout(timer); resCb(val); },
            reject: (err) => { clearTimeout(timer); rejCb(err); }
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

  async generateImage({ prompt, aspectRatio = '1:1', timeoutMs = 70000 }) {
    if (!this.isConfigured()) {
      throw new Error('Perfil do Google Flow ainda não configurado. Execute setup_flow.js primeiro.');
    }

    const { ws, send, targetUrl } = await this.connectToPage('flow.google');

    try {
      // 1. Verifica autenticação
      const authCheck = await send('Runtime.evaluate', {
        expression: `(() => {
          const text = document.body ? document.body.innerText : '';
          const hasSignIn = text.includes('Fazer login') || text.includes('Sign in');
          return { hasSignIn, url: window.location.href };
        })()`,
        returnByValue: true
      });

      const pageState = authCheck?.result?.value || {};
      if (pageState.hasSignIn) {
        throw new Error('Google Flow requer login. Abra "conectar_google_flow.bat" e faça login na sua conta.');
      }

      // 2. Se não estiver dentro de um projeto, encontra e entra no projeto "V0id OS"
      if (!pageState.url.includes('/project/')) {
        const findProject = await send('Runtime.evaluate', {
          expression: `(() => {
            const cards = Array.from(document.querySelectorAll('.project-card, flow-project-card'));
            const v0idCard = cards.find(c => c.innerText && c.innerText.includes('V0id OS')) || cards[0];
            const link = v0idCard ? v0idCard.querySelector('a') : null;
            return { found: !!v0idCard, href: link ? link.href : null };
          })()`,
          returnByValue: true
        });

        const proj = findProject?.result?.value;
        const targetProjUrl = (proj && proj.href) ? proj.href : FLOW_DEFAULT_URL;
        await send('Page.navigate', { url: targetProjUrl });
        await new Promise(r => setTimeout(r, 4000));
      }

      // 3. Aguarda o editor ProseMirror carregar
      let editorReady = false;
      for (let i = 0; i < 20; i++) {
        const checkEditor = await send('Runtime.evaluate', {
          expression: `!!document.querySelector('div.ProseMirror')`,
          returnByValue: true
        });
        if (checkEditor?.result?.value) {
          editorReady = true;
          break;
        }
        await new Promise(r => setTimeout(r, 600));
      }

      if (!editorReady) {
        throw new Error('Editor ProseMirror do Google Flow não encontrado na tela.');
      }

      // 4. Configura proporção de tela (Aspect Ratio) no menu do Flow se especificado
      if (aspectRatio) {
        try {
          const ratioTarget = aspectRatio === '16:9' ? '16:9' : (aspectRatio === '9:16' ? '9:16' : '1:1');
          await send('Runtime.evaluate', {
            expression: `(() => {
              const btn = document.querySelector('button.settings-trigger-button');
              if (btn) btn.click();
            })()`
          });
          await new Promise(r => setTimeout(r, 400));
          // Garante modo Imagem antes da proporção (modo Vídeo gasta créditos)
          await send('Runtime.evaluate', {
            expression: `Array.from(document.querySelectorAll('.cdk-overlay-container button')).find(b => b.innerText.includes('Imagem'))?.click()`
          });
          await new Promise(r => setTimeout(r, 600));
          await send('Runtime.evaluate', {
            expression: `(() => {
              const buttons = Array.from(document.querySelectorAll('.cdk-overlay-container button, .mat-mdc-menu-panel button'));
              const target = buttons.find(b => b.innerText && b.innerText.includes('${ratioTarget}'));
              if (target) target.click();
              const backdrop = document.querySelector('.cdk-overlay-backdrop');
              if (backdrop) backdrop.click();
            })()`
          });
          await new Promise(r => setTimeout(r, 400));
        } catch {}
      }

      // 5. Captura a lista de imagens existentes do Google CDN antes da nova geração
      const existingImagesRes = await send('Runtime.evaluate', {
        expression: `Array.from(document.querySelectorAll('img[src*="flow-content.google"]')).map(i => i.src)`,
        returnByValue: true
      });
      const existingUrls = new Set(existingImagesRes?.result?.value || []);

      // 6. Foca o ProseMirror e injeta o texto nativamente via CDP
      await send('Runtime.evaluate', {
        expression: `(() => {
          const pm = document.querySelector('div.ProseMirror');
          if (pm) {
            pm.focus();
            document.execCommand('selectAll', false, null);
          }
        })()`
      });

      await send('Input.insertText', { text: prompt });
      await new Promise(r => setTimeout(r, 500));

      // 7. Clica no botão de iniciar geração
      const clickBtnRes = await send('Runtime.evaluate', {
        expression: `(() => {
          const btn = document.querySelector('button.generate-icon-button') || document.querySelector('button[aria-label="Iniciar geração"]');
          if (!btn) return { clicked: false, error: 'Botão de gerar não encontrado' };
          const rect = btn.getBoundingClientRect();
          return { clicked: true, disabled: btn.disabled, x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
        })()`,
        returnByValue: true
      });

      const btnInfo = clickBtnRes?.result?.value;
      if (!btnInfo || !btnInfo.clicked) {
        throw new Error(btnInfo?.error || 'Não foi possível acionar o botão de geração no Google Flow.');
      }

      // Dispara clique via hardware mouse events
      await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: btnInfo.x, y: btnInfo.y, button: 'left', clickCount: 1 });
      await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: btnInfo.x, y: btnInfo.y, button: 'left', clickCount: 1 });

      // 8. Polling aguardando a nova imagem aparecer no DOM (flow-content.google)
      const startTime = Date.now();
      let newImageUrl = null;

      while (Date.now() - startTime < timeoutMs) {
        await new Promise(r => setTimeout(r, 2000));

        const pollRes = await send('Runtime.evaluate', {
          expression: `(() => {
            const allImages = Array.from(document.querySelectorAll('img[src*="flow-content.google"]'));
            return allImages
              .filter(i => i.naturalWidth > 200 && i.src)
              .map(i => i.src);
          })()`,
          returnByValue: true
        });

        const currentUrls = pollRes?.result?.value || [];
        const foundUrl = currentUrls.find(u => !existingUrls.has(u));
        if (foundUrl) {
          newImageUrl = foundUrl;
          break;
        }
      }

      if (!newImageUrl) {
        throw new Error('Tempo limite excedido aguardando a renderização do Nano Banana no Google Flow.');
      }

      // 8. Baixa a imagem diretamente da CDN de alta resolução do Google
      const imgFetch = await fetch(newImageUrl);
      if (!imgFetch.ok) {
        throw new Error(`Falha ao baixar imagem do Google CDN (${imgFetch.status})`);
      }

      const buffer = Buffer.from(await imgFetch.arrayBuffer());

      return {
        buffer,
        format: 'jpg',
        modelUsed: 'Google Nano Banana Pro (Google Flow)'
      };

    } finally {
      try { ws.close(); } catch {}
    }
  }

  // Lê saldo de créditos (menu da conta) e custo atual de imagem/vídeo (menu de configurações). Não gera nada.
  async getCredits() {
    const { ws, send } = await this.connectToPage('flow.google');
    const ev = async (e) => (await send('Runtime.evaluate', { expression: e, returnByValue: true }))?.result?.value;
    const sleep = (ms) => new Promise(r => setTimeout(r, ms));
    const overlay = () => ev(`document.querySelector('.cdk-overlay-container')?.innerText || ''`);
    const closeOverlay = async () => { await ev(`document.querySelector('.cdk-overlay-backdrop')?.click()`); await sleep(400); };
    const clickMenu = (t) => ev(`Array.from(document.querySelectorAll('.cdk-overlay-container button')).find(b => b.innerText.includes('${t}'))?.click()`);
    const toInt = (s) => (s ? parseInt(s.replace(/\D/g, ''), 10) : null);
    try {
      for (let i = 0; i < 20 && !(await ev(`!!document.querySelector('button.settings-trigger-button')`)); i++) await sleep(600);
      await closeOverlay();

      // Saldo: botão "Detalhes da conta" (selo PRO)
      await ev(`document.querySelector('[aria-label="Detalhes da conta"]')?.click()`);
      await sleep(1200);
      const acct = await overlay();
      await closeOverlay();

      // Custos: lê no modo Vídeo e volta ao modo Imagem
      await ev(`document.querySelector('button.settings-trigger-button')?.click()`); await sleep(600);
      await clickMenu('Vídeo'); await sleep(900);
      const videoMenu = await overlay();
      await clickMenu('Imagem'); await sleep(700);
      const imageMenu = await overlay();
      await closeOverlay();

      const cost = (txt) => toInt(txt.match(/usar ([\d.]+) cr[ée]ditos/)?.[1]);
      return {
        balance: toInt(acct.match(/([\d.]+) cr[ée]ditos do Google Flow/)?.[1]),
        resetAt: acct.match(/Redefini[çc][ãa]o do limite de uso:\s*(.+)/)?.[1]?.trim() || null,
        imageCost: cost(imageMenu),
        videoCost: cost(videoMenu),
        videoModel: videoMenu.match(/(Omni[^\n]*|Veo[^\n]*)/)?.[1]?.trim() || null
      };
    } finally {
      try { ws.close(); } catch {}
    }
  }
}

export const flowBridge = new GoogleFlowBridge();
