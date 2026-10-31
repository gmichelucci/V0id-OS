// V0id CLI - Built-in WebSocket Server (Port 7777)
import { WebSocketServer } from 'ws';

export class V0idWSServer {
  constructor(port = 7777, onMessage = null) {
    this.port = port;
    this.onMessage = onMessage;
    this.wss = null;
    this.clients = new Set();
  }

  start() {
    try {
      this.wss = new WebSocketServer({ port: this.port });

      this.wss.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          console.log(`[WebSocket] Porta ${this.port} em uso por outra instância ativa. Continuando em modo CLI.`);
        } else {
          console.error(`[WebSocket Server Error] ${err.message}`);
        }
      });

      this.wss.on('connection', (ws) => {
        this.clients.add(ws);
        this.broadcast({ type: 'connected', message: 'Conectado ao V0id Core OS' });

        ws.on('message', (data) => {
          try {
            const parsed = JSON.parse(data.toString());
            if (this.onMessage) this.onMessage(parsed, ws);
          } catch (e) {
            ws.send(JSON.stringify({ type: 'error', message: 'JSON inválido' }));
          }
        });

        ws.on('close', () => {
          this.clients.delete(ws);
        });

        ws.on('error', () => {
          this.clients.delete(ws);
        });
      });

      return true;
    } catch (err) {
      console.error(`[WebSocket Server Error] Porta ${this.port}: ${err.message}`);
      return false;
    }
  }

  broadcast(payload) {
    const raw = JSON.stringify(payload);
    for (const client of this.clients) {
      if (client.readyState === 1) { // OPEN
        client.send(raw);
      }
    }
  }

  stop() {
    if (this.wss) {
      this.wss.close();
    }
  }
}
