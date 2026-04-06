import Fastify from 'fastify';
import cors from '@fastify/cors';
import websocketPlugin from '@fastify/websocket';
import fs from 'fs';
import path from 'path';
import { addClient, startMihomoRelay } from './modules/realtime/realtime.service';
import { generateConfig } from './modules/config/config.generator';
import { getDb } from './database/db';

const app = Fastify({ logger: true });

async function main() {
  await app.register(cors, {
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : true,
  });
  await app.register(websocketPlugin);

  // Register all routes
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

  // Health check
  app.get('/health', async () => ({ ok: true, timestamp: new Date().toISOString() }));

  const PORT = Number(process.env.PORT ?? 8090);
  await app.listen({ port: PORT, host: '0.0.0.0' });
  console.log(`Server running on port ${PORT}`);

  // Ensure DB is initialized (triggers seedDefaults)
  getDb();

  // Auto-generate initial config.yaml if it doesn't exist
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
