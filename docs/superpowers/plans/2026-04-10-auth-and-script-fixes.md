# Auth & Script Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add password authentication to Fluxo Web UI + API, auto-generate Mihomo secret, and fix all errors in install.sh and fluxo-cli.sh.

**Architecture:** Fastify server guards all `/api/*` routes with a preHandler JWT hook (bcrypt password, cookie-based JWT, auto-generated secrets). Next.js middleware redirects unauthenticated visits to `/login`. The Next.js API proxy is fixed to forward Cookie/Authorization headers so the JWT reaches Fastify.

**Tech Stack:** `bcryptjs`, `@fastify/cookie`, `jsonwebtoken` (server); Next.js App Router server components + middleware (web); Node.js `crypto` for secret generation.

---

## File Map

**Create:**
- `apps/server/src/modules/auth/auth.service.ts` — password hash, JWT sign/verify helpers
- `apps/server/src/modules/auth/auth.routes.ts` — `/api/auth/*` endpoints
- `apps/web/app/login/page.tsx` — login form page
- `apps/web/app/setup/page.tsx` — first-run password setup page
- `apps/web/middleware.ts` — redirect unauthenticated requests to /login

**Modify:**
- `apps/server/package.json` — add `bcryptjs`, `@fastify/cookie`, `jsonwebtoken` deps
- `apps/server/src/database/db.ts` — seed `auth.jwt_secret`, `auth.password_hash`, auto-generate `mihomo.secret`
- `apps/server/src/index.ts` — register `@fastify/cookie`, register auth routes, add global preHandler
- `apps/web/app/api/[...path]/route.ts` — forward Cookie + Authorization headers; forward Set-Cookie response header
- `apps/web/lib/api.ts` — add `authApi` helpers (login, logout, me, setup)
- `install.sh` — fix show_summary (uninstall command, remove Tailscale/Docker, add fluxo-web)
- `tools/fluxo-cli.sh` — fix SCRIPT_RAW_URL and SCRIPT_VERSION_URL (fluxo → fluxo.click)

---

## Task 1: Fix install.sh show_summary and fluxo-cli.sh URLs

**Files:**
- Modify: `install.sh:576-584`
- Modify: `tools/fluxo-cli.sh:16-17`

- [ ] **Step 1: Fix install.sh show_summary**

In `install.sh`, replace the `show_summary()` Useful commands block (lines 576–584):

```bash
  echo -e "${BOLD}  Useful commands:${NC}"
  echo -e "  ${CYAN}fluxo-cli${NC}                         — interactive CLI (Mihomo management)"
  echo -e "  ${CYAN}fluxo-cli status${NC}                  — quick status"
  echo -e "  ${CYAN}fluxo-cli test${NC}                    — network connectivity test"
  echo -e "  ${CYAN}systemctl status mihomo${NC}           — core status"
  echo -e "  ${CYAN}systemctl status fluxo${NC}            — API server status"
  echo -e "  ${CYAN}systemctl status fluxo-web${NC}        — web UI status"
  echo -e "  ${CYAN}journalctl -fu mihomo${NC}             — core logs (live)"
  echo -e "  ${CYAN}journalctl -fu fluxo${NC}              — API server logs (live)"
  echo -e "  ${CYAN}journalctl -fu fluxo-web${NC}          — web UI logs (live)"
  echo -e "  ${CYAN}curl -fsSL https://fluxo.click | sudo bash -- --uninstall${NC}"
  echo -e "                                    — uninstall everything"
```

- [ ] **Step 2: Fix fluxo-cli.sh repo URLs**

In `tools/fluxo-cli.sh`, replace lines 16–17:

```bash
SCRIPT_RAW_URL="https://raw.githubusercontent.com/RaylenZed/fluxo.click/main/tools/fluxo-cli.sh"
SCRIPT_VERSION_URL="https://raw.githubusercontent.com/RaylenZed/fluxo.click/main/tools/version"
```

- [ ] **Step 3: Commit**

```bash
git add install.sh tools/fluxo-cli.sh
git commit -m "fix: correct install.sh summary commands and fluxo-cli repo URLs"
```

---

## Task 2: Add server authentication dependencies

**Files:**
- Modify: `apps/server/package.json`

- [ ] **Step 1: Install packages**

Run from repo root:
```bash
cd apps/server
pnpm add bcryptjs @fastify/cookie jsonwebtoken
pnpm add -D @types/bcryptjs @types/jsonwebtoken
cd ../..
```

- [ ] **Step 2: Verify install**

```bash
grep -E "bcryptjs|@fastify/cookie|jsonwebtoken" apps/server/package.json
```
Expected: all three appear under `dependencies`.

- [ ] **Step 3: Commit**

```bash
git add apps/server/package.json apps/server/pnpm-lock.yaml pnpm-lock.yaml
git commit -m "feat(server): add bcryptjs, @fastify/cookie, jsonwebtoken deps"
```

---

## Task 3: Seed auth + auto-generate secrets in db.ts

**Files:**
- Modify: `apps/server/src/database/db.ts`

- [ ] **Step 1: Update seedDefaults in db.ts**

Replace the `seedDefaults` function's defaults block so that:
- `auth.jwt_secret` is auto-generated (32 random hex bytes)
- `auth.password_hash` defaults to `""` (empty = setup required)
- `mihomo.secret` is auto-generated (16 random hex bytes) instead of `""`

Full updated file `apps/server/src/database/db.ts`:

```typescript
import Database from 'better-sqlite3';
import path from 'path';
import crypto from 'crypto';
import { CREATE_TABLES_SQL } from './schema';

const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), 'data', 'fluxo.db');

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!_db) {
    const fs = require('fs');
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    _db = new Database(DB_PATH);
    _db.pragma('journal_mode = WAL');
    _db.pragma('foreign_keys = ON');
    _db.exec(CREATE_TABLES_SQL);
    seedDefaults(_db);
  }
  return _db;
}

function seedDefaults(db: Database.Database) {
  const now = new Date().toISOString();

  const defaults: Record<string, unknown> = {
    'general.mixed_port': 7890,
    'general.allow_lan': true,
    'general.mode': 'rule',
    'general.log_level': 'info',
    'general.ipv6': false,
    'tun.enable': false,
    'tun.stack': 'system',
    'tun.auto_route': true,
    'tun.dns_hijack': '["any:53"]',
    'mihomo.external_controller': '0.0.0.0:9090',
    // Auto-generate a random Mihomo API secret on first run (INSERT OR IGNORE keeps existing value)
    'mihomo.secret': crypto.randomBytes(16).toString('hex'),
    // Auth: JWT signing secret (generated once, never changes)
    'auth.jwt_secret': crypto.randomBytes(32).toString('hex'),
    // Auth: password hash — empty means setup is required
    'auth.password_hash': '',
  };

  const settingsStmt = db.prepare('INSERT OR IGNORE INTO settings (key, value, updated_at) VALUES (?, ?, ?)');
  for (const [key, value] of Object.entries(defaults)) {
    settingsStmt.run(key, JSON.stringify(value), now);
  }

  // Default DNS config
  db.prepare(`
    INSERT OR IGNORE INTO dns_config
      (id, enable, mode, nameservers, fallback_dns, fake_ip_filter, use_hosts, enhanced_mode, updated_at)
    VALUES (1, 1, 'fake-ip',
      '["223.5.5.5","119.29.29.29","114.114.114.114"]',
      '["8.8.8.8","1.1.1.1","tls://dns.google"]',
      '["*.local","+.lan","+.local","time.*.com","ntp.*.com","+.ntp.org"]',
      1, 1, ?)
  `).run(now);

  // Default rules
  const existingRules = db.prepare('SELECT COUNT(*) as count FROM rules').get() as { count: number };
  if (existingRules.count === 0) {
    const ruleStmt = db.prepare(`
      INSERT INTO rules (id, type, value, policy, notify, extended_matching, sort_order, note, created_at, updated_at)
      VALUES (?, ?, ?, ?, 0, 0, ?, ?, ?, ?)
    `);
    const defaultRules = [
      { id: 'default-1', type: 'GEOIP',   value: 'CN',              policy: 'DIRECT', order: 0,  note: 'China mainland IPs go direct' },
      { id: 'default-2', type: 'GEOSITE', value: 'cn',              policy: 'DIRECT', order: 1,  note: 'China mainland domains go direct' },
      { id: 'default-3', type: 'GEOSITE', value: 'private',         policy: 'DIRECT', order: 2,  note: 'Private/LAN addresses go direct' },
      { id: 'default-4', type: 'IP-CIDR', value: '192.168.0.0/16',  policy: 'DIRECT', order: 3,  note: 'LAN' },
      { id: 'default-5', type: 'IP-CIDR', value: '10.0.0.0/8',      policy: 'DIRECT', order: 4,  note: 'LAN' },
      { id: 'default-6', type: 'IP-CIDR', value: '172.16.0.0/12',   policy: 'DIRECT', order: 5,  note: 'LAN' },
      { id: 'default-7', type: 'IP-CIDR', value: '127.0.0.0/8',     policy: 'DIRECT', order: 6,  note: 'Loopback' },
      { id: 'default-8', type: 'FINAL',   value: '',                policy: 'DIRECT', order: 99, note: 'Default: direct until you add a proxy group' },
    ];
    for (const r of defaultRules) {
      ruleStmt.run(r.id, r.type, r.value, r.policy, r.order, r.note, now, now);
    }
  }

  // Default proxy group
  const existingGroups = db.prepare('SELECT COUNT(*) as count FROM proxy_groups').get() as { count: number };
  if (existingGroups.count === 0) {
    db.prepare(`
      INSERT INTO proxy_groups
        (id, name, type, proxies, providers, url, interval, tolerance, filter, use_all_proxies, sort_order, created_at, updated_at)
      VALUES ('default-proxy-group', 'Proxy', 'select', '[]', '[]', NULL, 300, 150, NULL, 0, 0, ?, ?)
    `).run(now, now);
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/server/src/database/db.ts
git commit -m "feat(server): auto-generate mihomo secret and JWT secret on first run"
```

---

## Task 4: Create auth service

**Files:**
- Create: `apps/server/src/modules/auth/auth.service.ts`

- [ ] **Step 1: Create auth.service.ts**

```typescript
// apps/server/src/modules/auth/auth.service.ts
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDb } from '../../database/db';

const BCRYPT_ROUNDS = 10;
const JWT_EXPIRY = '30d';
const COOKIE_NAME = 'fluxo_session';

function getSetting(key: string): string {
  const row = getDb().prepare('SELECT value FROM settings WHERE key = ?').get(key) as { value: string } | undefined;
  return row ? JSON.parse(row.value) : '';
}

function setSetting(key: string, value: string) {
  const now = new Date().toISOString();
  getDb().prepare('INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, ?)').run(key, JSON.stringify(value), now);
}

export function getJwtSecret(): string {
  return getSetting('auth.jwt_secret');
}

export function isSetupRequired(): boolean {
  return !getSetting('auth.password_hash');
}

export async function setPassword(plaintext: string): Promise<void> {
  const hash = await bcrypt.hash(plaintext, BCRYPT_ROUNDS);
  setSetting('auth.password_hash', hash);
}

export async function verifyPassword(plaintext: string): Promise<boolean> {
  const hash = getSetting('auth.password_hash');
  if (!hash) return false;
  return bcrypt.compare(plaintext, hash);
}

export function signToken(): string {
  return jwt.sign({}, getJwtSecret(), { expiresIn: JWT_EXPIRY });
}

export function verifyToken(token: string): boolean {
  try {
    jwt.verify(token, getJwtSecret());
    return true;
  } catch {
    return false;
  }
}

export { COOKIE_NAME };
```

- [ ] **Step 2: Commit**

```bash
git add apps/server/src/modules/auth/auth.service.ts
git commit -m "feat(server): add auth service (bcrypt + JWT)"
```

---

## Task 5: Create auth routes

**Files:**
- Create: `apps/server/src/modules/auth/auth.routes.ts`

- [ ] **Step 1: Create auth.routes.ts**

```typescript
// apps/server/src/modules/auth/auth.routes.ts
import type { FastifyPluginAsync } from 'fastify';
import {
  isSetupRequired,
  setPassword,
  verifyPassword,
  signToken,
  COOKIE_NAME,
} from './auth.service';

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: 'strict' as const,
  path: '/',
  maxAge: 30 * 24 * 60 * 60, // 30 days in seconds
};

export const authRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /api/auth/me — returns auth state (used by frontend to check session)
  fastify.get('/auth/me', async (req, reply) => {
    const token = (req.cookies as Record<string, string>)[COOKIE_NAME];
    const { verifyToken } = await import('./auth.service');
    if (token && verifyToken(token)) {
      return reply.send({ authenticated: true, setupRequired: false });
    }
    return reply.send({ authenticated: false, setupRequired: isSetupRequired() });
  });

  // POST /api/auth/setup — set password on first run (only when no password exists)
  fastify.post('/auth/setup', async (req, reply) => {
    if (!isSetupRequired()) {
      return reply.code(403).send({ error: 'Setup already complete. Use /api/auth/login.' });
    }
    const { password } = req.body as { password?: string };
    if (!password || password.length < 6) {
      return reply.code(400).send({ error: 'Password must be at least 6 characters.' });
    }
    await setPassword(password);
    const token = signToken();
    reply.setCookie(COOKIE_NAME, token, COOKIE_OPTS);
    return reply.send({ ok: true });
  });

  // POST /api/auth/login — verify password and issue session cookie
  fastify.post('/auth/login', async (req, reply) => {
    if (isSetupRequired()) {
      return reply.code(403).send({ error: 'Setup required. Use /api/auth/setup.' });
    }
    const { password } = req.body as { password?: string };
    if (!password) {
      return reply.code(400).send({ error: 'Password required.' });
    }
    const ok = await verifyPassword(password);
    if (!ok) {
      return reply.code(401).send({ error: 'Invalid password.' });
    }
    const token = signToken();
    reply.setCookie(COOKIE_NAME, token, COOKIE_OPTS);
    return reply.send({ ok: true });
  });

  // POST /api/auth/logout — clear session cookie
  fastify.post('/auth/logout', async (_req, reply) => {
    reply.clearCookie(COOKIE_NAME, { path: '/' });
    return reply.send({ ok: true });
  });
};
```

- [ ] **Step 2: Commit**

```bash
git add apps/server/src/modules/auth/auth.routes.ts
git commit -m "feat(server): add auth routes (setup, login, logout, me)"
```

---

## Task 6: Register cookie plugin, auth routes, and global auth hook in index.ts

**Files:**
- Modify: `apps/server/src/index.ts`

- [ ] **Step 1: Update index.ts**

Replace the full content of `apps/server/src/index.ts`:

```typescript
import Fastify from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import websocketPlugin from '@fastify/websocket';
import fs from 'fs';
import path from 'path';
import { addClient, startMihomoRelay } from './modules/realtime/realtime.service';
import { generateConfig } from './modules/config/config.generator';
import { getDb } from './database/db';
import { verifyToken, COOKIE_NAME } from './modules/auth/auth.service';

const app = Fastify({ logger: true });

// Routes that don't require authentication
const PUBLIC_ROUTES = new Set([
  '/api/auth/me',
  '/api/auth/login',
  '/api/auth/setup',
  '/api/auth/logout',
  '/health',
]);

async function main() {
  await app.register(cors, {
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : true,
    credentials: true,
  });
  await app.register(cookie);
  await app.register(websocketPlugin);

  // Global authentication preHandler — runs before every route handler
  app.addHook('preHandler', async (req, reply) => {
    if (PUBLIC_ROUTES.has(req.url.split('?')[0])) return;
    // WebSocket endpoint also skips auth (frontend connects after page load)
    if (req.url === '/ws') return;

    const token = (req.cookies as Record<string, string>)[COOKIE_NAME]
      ?? (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : undefined);

    if (!token || !verifyToken(token)) {
      reply.code(401).send({ error: 'Unauthorized' });
    }
  });

  // Register all routes
  const { authRoutes } = await import('./modules/auth/auth.routes');
  const { proxyRoutes } = await import('./modules/proxy/proxy.routes');
  const { groupRoutes } = await import('./modules/group/group.routes');
  const { ruleRoutes } = await import('./modules/rule/rule.routes');
  const { settingsRoutes } = await import('./modules/settings/settings.routes');
  const { mihomoRoutes } = await import('./modules/mihomo/mihomo.routes');
  const { profileRoutes } = await import('./modules/profile/profile.routes');
  const { dnsRoutes } = await import('./modules/dns/dns.routes');
  const { providerRoutes } = await import('./modules/provider/provider.routes');
  const { ruleProviderRoutes } = await import('./modules/rule-provider/rule-provider.routes');
  const { configRoutes } = await import('./modules/config/config.routes');

  await app.register(authRoutes, { prefix: '/api' });
  await app.register(proxyRoutes, { prefix: '/api' });
  await app.register(groupRoutes, { prefix: '/api' });
  await app.register(ruleRoutes, { prefix: '/api' });
  await app.register(settingsRoutes, { prefix: '/api' });
  await app.register(mihomoRoutes, { prefix: '/api' });
  await app.register(profileRoutes, { prefix: '/api' });
  await app.register(dnsRoutes, { prefix: '/api' });
  await app.register(providerRoutes, { prefix: '/api' });
  await app.register(ruleProviderRoutes, { prefix: '/api' });
  await app.register(configRoutes, { prefix: '/api' });

  // WebSocket endpoint for real-time data
  app.get('/ws', { websocket: true }, (socket) => {
    addClient(socket as unknown as import('ws'));
  });

  // Health check (public)
  app.get('/health', async () => ({ ok: true, timestamp: new Date().toISOString() }));

  const PORT = Number(process.env.PORT ?? 8090);
  await app.listen({ port: PORT, host: '0.0.0.0' });
  console.log(`Server running on port ${PORT}`);

  getDb();

  const configPath = process.env.CONFIG_PATH || '/etc/mihomo/config.yaml';
  const configDir = path.dirname(configPath);
  try {
    if (!fs.existsSync(configPath)) {
      app.log.info(`No config found at ${configPath}, generating default config...`);
      fs.mkdirSync(configDir, { recursive: true });
      const yaml = await generateConfig();
      fs.writeFileSync(configPath, yaml, 'utf-8');
      app.log.info(`Default config written to ${configPath}`);
    }
  } catch (err) {
    app.log.warn(`Could not write default config to ${configPath}: ${(err as Error).message}`);
    app.log.warn('You can manually generate it via POST /api/config/apply');
  }

  startMihomoRelay();
}

main().catch(console.error);
```

- [ ] **Step 2: Build and verify no TypeScript errors**

```bash
cd apps/server && pnpm build 2>&1 | tail -10
```
Expected: no errors, `dist/index.js` updated.

- [ ] **Step 3: Commit**

```bash
git add apps/server/src/index.ts
git commit -m "feat(server): register cookie plugin and global JWT auth preHandler"
```

---

## Task 7: Fix Next.js API proxy to forward cookies

**Files:**
- Modify: `apps/web/app/api/[...path]/route.ts`

- [ ] **Step 1: Update route.ts to forward auth headers**

Replace the full content of `apps/web/app/api/[...path]/route.ts`:

```typescript
import { type NextRequest, NextResponse } from 'next/server';

const BACKEND = process.env.BACKEND_URL ?? 'http://localhost:8090';

async function proxy(req: NextRequest, params: Promise<{ path: string[] }>) {
  const { path } = await params;
  const url = `${BACKEND}/api/${path.join('/')}${req.nextUrl.search}`;

  const rawBody = req.method !== 'GET' && req.method !== 'HEAD' ? await req.text() : undefined;
  const body = rawBody || undefined;

  // Forward auth-relevant headers to Fastify
  const headers: Record<string, string> = {};
  if (body) headers['content-type'] = 'application/json';
  const cookie = req.headers.get('cookie');
  if (cookie) headers['cookie'] = cookie;
  const authorization = req.headers.get('authorization');
  if (authorization) headers['authorization'] = authorization;

  const res = await fetch(url, { method: req.method, headers, body });
  const text = await res.text();

  // Forward Set-Cookie back to the browser
  const responseHeaders: Record<string, string> = {
    'content-type': res.headers.get('content-type') ?? 'application/json',
  };
  const setCookie = res.headers.get('set-cookie');
  if (setCookie) responseHeaders['set-cookie'] = setCookie;

  return new NextResponse(text, { status: res.status, headers: responseHeaders });
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(req, params);
}
export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(req, params);
}
export async function PUT(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(req, params);
}
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(req, params);
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/app/api/[...path]/route.ts
git commit -m "fix(web): forward cookie and authorization headers in API proxy"
```

---

## Task 8: Add auth API helpers to lib/api.ts

**Files:**
- Modify: `apps/web/lib/api.ts`

- [ ] **Step 1: Append authApi to the bottom of apps/web/lib/api.ts**

Add this block at the end of the file (after the last export):

```typescript
// --- Auth ---
export const authApi = {
  me: () => request<{ authenticated: boolean; setupRequired: boolean }>('/api/auth/me'),
  login: (password: string) =>
    request<{ ok: boolean }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ password }),
    }),
  setup: (password: string) =>
    request<{ ok: boolean }>('/api/auth/setup', {
      method: 'POST',
      body: JSON.stringify({ password }),
    }),
  logout: () => request<{ ok: boolean }>('/api/auth/logout', { method: 'POST' }),
};
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/lib/api.ts
git commit -m "feat(web): add authApi helpers (me, login, setup, logout)"
```

---

## Task 9: Create Next.js middleware for auth redirect

**Files:**
- Create: `apps/web/middleware.ts`

- [ ] **Step 1: Create middleware.ts**

```typescript
// apps/web/middleware.ts
import { type NextRequest, NextResponse } from 'next/server';

// Routes that don't require a session cookie
const PUBLIC_PATHS = ['/login', '/setup'];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public paths and Next.js internals through
  if (
    PUBLIC_PATHS.some((p) => pathname.startsWith(p)) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  const session = req.cookies.get('fluxo_session');
  if (!session) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/middleware.ts
git commit -m "feat(web): add middleware to redirect unauthenticated users to /login"
```

---

## Task 10: Create login page

**Files:**
- Create: `apps/web/app/login/page.tsx`

- [ ] **Step 1: Create login page**

```tsx
// apps/web/app/login/page.tsx
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // If setup is required, redirect to /setup
  useEffect(() => {
    authApi.me().then((res) => {
      if (res.authenticated) router.replace("/");
      else if (res.setupRequired) router.replace("/setup");
    }).catch(() => {});
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await authApi.login(password);
      router.replace("/");
    } catch {
      toast.error("Invalid password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--canvas)]">
      <div className="w-full max-w-sm p-8 rounded-2xl bg-[var(--background)] shadow-[0_4px_32px_rgba(0,0,0,0.10)]">
        <h1 className="text-2xl font-semibold text-[var(--foreground)] mb-1">Fluxo</h1>
        <p className="text-sm text-[var(--muted)] mb-6">Enter your password to continue</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            required
          />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/app/login/page.tsx
git commit -m "feat(web): add login page"
```

---

## Task 11: Create setup page (first-run)

**Files:**
- Create: `apps/web/app/setup/page.tsx`

- [ ] **Step 1: Create setup page**

```tsx
// apps/web/app/setup/page.tsx
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function SetupPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  // Redirect away if setup is already done
  useEffect(() => {
    authApi.me().then((res) => {
      if (res.authenticated) router.replace("/");
      else if (!res.setupRequired) router.replace("/login");
    }).catch(() => {});
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      toast.error("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      await authApi.setup(password);
      router.replace("/");
    } catch (err) {
      toast.error((err as Error).message ?? "Setup failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--canvas)]">
      <div className="w-full max-w-sm p-8 rounded-2xl bg-[var(--background)] shadow-[0_4px_32px_rgba(0,0,0,0.10)]">
        <h1 className="text-2xl font-semibold text-[var(--foreground)] mb-1">Welcome to Fluxo</h1>
        <p className="text-sm text-[var(--muted)] mb-6">Set a password to protect your dashboard</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="password"
            placeholder="Password (min 6 chars)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            required
          />
          <Input
            type="password"
            placeholder="Confirm password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Setting up…" : "Set password & continue"}
          </Button>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/app/setup/page.tsx
git commit -m "feat(web): add first-run setup page"
```

---

## Task 12: Build web app and verify no TypeScript errors

- [ ] **Step 1: Build web**

```bash
cd apps/web && pnpm build 2>&1 | tail -20
```
Expected: build succeeds, standalone output at `apps/web/.next/standalone/`.

- [ ] **Step 2: Copy static assets to standalone (required for production)**

```bash
cp -r apps/web/public apps/web/.next/standalone/apps/web/public
mkdir -p apps/web/.next/standalone/apps/web/.next
cp -r apps/web/.next/static apps/web/.next/standalone/apps/web/.next/static
```

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "feat: complete auth implementation — login, setup, JWT guard, Mihomo secret"
```

---

## Self-Review

**Spec coverage check:**
- ✅ install.sh: uninstall command fixed, Tailscale/Docker removed, fluxo-web added → Task 1
- ✅ fluxo-cli.sh: repo URLs fixed → Task 1
- ✅ Mihomo secret: auto-generated → Task 3
- ✅ Fastify auth: bcrypt password, JWT, cookie, preHandler → Tasks 4–6
- ✅ Next.js proxy: forwards Cookie + Authorization, Set-Cookie → Task 7
- ✅ Login page → Task 10
- ✅ Setup page (first run) → Task 11
- ✅ Middleware redirect → Task 9

**Type consistency:**
- `COOKIE_NAME` exported from auth.service.ts, used in auth.routes.ts and index.ts ✅
- `verifyToken` imported in index.ts from auth.service.ts ✅
- `authApi` in lib/api.ts uses same `/api/auth/*` paths as auth.routes.ts ✅
- `authApi.me()` returns `{ authenticated, setupRequired }`, login/setup pages use both fields ✅

**No placeholders:** All code is complete with no TBD/TODO. ✅
