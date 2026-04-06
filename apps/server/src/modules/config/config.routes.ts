import type { FastifyPluginAsync } from 'fastify';
import fs from 'fs/promises';
import path from 'path';
import { generateConfig } from './config.generator';
import { reloadConfig } from '../mihomo/mihomo.service';

function getConfigPath(): string {
  return process.env.CONFIG_PATH || '/etc/mihomo/config.yaml';
}


export const configRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /api/config — return current raw YAML on disk (or generated if not exists)
  fastify.get('/config', async (_req, reply) => {
    try {
      const configPath = getConfigPath();
      try {
        const content = await fs.readFile(configPath, 'utf-8');
        return reply.type('text/plain').send(content);
      } catch {
        // File doesn't exist yet, return generated
        const yaml = await generateConfig();
        return reply.type('text/plain').send(yaml);
      }
    } catch (err) {
      fastify.log.error(err);
      reply.code(500).send({ error: 'Failed to read config' });
    }
  });

  // GET /api/config/generated — always return freshly generated YAML from DB
  fastify.get('/config/generated', async (_req, reply) => {
    try {
      const yaml = await generateConfig();
      return reply.type('text/plain').send(yaml);
    } catch (err) {
      fastify.log.error(err);
      reply.code(500).send({ error: 'Failed to generate config' });
    }
  });

  // PUT /api/config — save raw YAML and reload mihomo
  fastify.put('/config', async (req, reply) => {
    try {
      const { yaml: body } = req.body as { yaml: string };
      if (typeof body !== 'string' || !body.trim()) {
        return reply.code(400).send({ error: 'Empty config' });
      }
      const configPath = getConfigPath();
      const configDir = path.dirname(configPath);
      await fs.mkdir(configDir, { recursive: true });
      await fs.writeFile(configPath, body, 'utf-8');

      // Reload mihomo (without regenerating the file)
      await reloadConfig(configPath);

      return { ok: true };
    } catch (err) {
      fastify.log.error(err);
      reply.code(500).send({ error: 'Failed to save config' });
    }
  });
};
