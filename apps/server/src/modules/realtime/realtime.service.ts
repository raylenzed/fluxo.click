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

function getMihomoWsConfig(): { host: string; secret: string } {
  // Env var takes precedence (Docker / systemd overrides)
  if (process.env.MIHOMO_API_URL) {
    try {
      const url = new URL(process.env.MIHOMO_API_URL);
      return { host: url.host, secret: process.env.MIHOMO_SECRET || '' };
    } catch {
      // fall through to DB
    }
  }
  const db = getDb();
  const apiUrlRow = db.prepare("SELECT value FROM settings WHERE key = 'mihomo.external_controller'").get() as
    | { value: string }
    | undefined;
  const secretRow = db.prepare("SELECT value FROM settings WHERE key = 'mihomo.secret'").get() as
    | { value: string }
    | undefined;
  const host = apiUrlRow ? JSON.parse(apiUrlRow.value) : '127.0.0.1:9090';
  const secret = secretRow ? JSON.parse(secretRow.value) : '';
  return { host, secret };
}

/**
 * Creates a resilient WebSocket relay to a Mihomo endpoint.
 * Uses exponential backoff (5s → 60s cap) and guarantees exactly one
 * reconnect timer at a time, preventing the timer-accumulation OOM bug.
 */
function makeRelay(
  urlFn: () => string,
  onMessage: (parsed: unknown) => void
): void {
  let retryDelay = 5_000;
  let timer: ReturnType<typeof setTimeout> | null = null;

  function connect() {
    let connected = false;
    let closed = false;

    const ws = new WebSocket(urlFn());

    ws.on('open', () => { connected = true; });

    ws.on('message', (data) => {
      retryDelay = 5_000; // reset backoff on successful message
      try { onMessage(JSON.parse(data.toString())); } catch { /* ignore malformed */ }
    });

    // error is always followed by close in Node.js ws — just suppress it
    ws.on('error', () => {});

    ws.on('close', () => {
      if (closed) return; // guard against double-fire
      closed = true;
      if (timer) { clearTimeout(timer); timer = null; }
      const delay = connected ? 5_000 : retryDelay; // fast retry after clean close
      retryDelay = Math.min(retryDelay * 2, 60_000);
      timer = setTimeout(() => { timer = null; connect(); }, delay);
    });
  }

  // Stagger initial connections to avoid hammering Mihomo on startup
  setTimeout(connect, 3_000);
}

export function startMihomoRelay() {
  const { host, secret } = getMihomoWsConfig();
  const tokenSuffix = secret ? `?token=${encodeURIComponent(secret)}` : '';

  makeRelay(
    () => `ws://${host}/traffic${tokenSuffix}`,
    (parsed) => broadcast({ type: 'traffic', data: parsed })
  );

  makeRelay(
    () => `ws://${host}/connections${tokenSuffix}`,
    (parsed) => {
      const p = parsed as { connections?: unknown[]; downloadTotal?: number; uploadTotal?: number };
      broadcast({
        type: 'connections',
        data: {
          connections: p.connections ?? [],
          downloadTotal: p.downloadTotal ?? 0,
          uploadTotal: p.uploadTotal ?? 0,
        },
      });
    }
  );

  makeRelay(
    () => `ws://${host}/logs${tokenSuffix}`,
    (parsed) => {
      const p = parsed as { type?: string; payload?: string };
      broadcast({ type: 'log', data: { type: p.type ?? 'info', payload: p.payload ?? '' } });
    }
  );
}
