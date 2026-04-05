import WebSocket from 'ws';
import { getDb } from '../../database/db';

type WsClient = WebSocket;

const clients = new Set<WsClient>();

export function addClient(ws: WsClient) {
  clients.add(ws);
  ws.on('close', () => clients.delete(ws));
}

function broadcast(data: unknown) {
  const msg = JSON.stringify(data);
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(msg);
    }
  }
}

export function startMihomoRelay() {
  const db = getDb();
  const apiUrlRow = db.prepare("SELECT value FROM settings WHERE key = 'mihomo.external_controller'").get() as
    | { value: string }
    | undefined;
  const secretRow = db.prepare("SELECT value FROM settings WHERE key = 'mihomo.secret'").get() as
    | { value: string }
    | undefined;
  const host = apiUrlRow ? JSON.parse(apiUrlRow.value) : '127.0.0.1:9090';
  const secret = secretRow ? JSON.parse(secretRow.value) : '';

  const wsUrl = `ws://${host}/traffic${secret ? `?token=${secret}` : ''}`;

  function connect() {
    const ws = new WebSocket(wsUrl);
    ws.on('message', (data) => {
      try {
        const parsed = JSON.parse(data.toString());
        broadcast({ type: 'traffic', data: parsed });
      } catch {
        // ignore malformed messages
      }
    });
    ws.on('error', () => setTimeout(connect, 5000));
    ws.on('close', () => setTimeout(connect, 5000));
  }

  // Start connection with a delay to allow Mihomo to start
  setTimeout(connect, 3000);
}
