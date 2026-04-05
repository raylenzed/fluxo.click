import type { FastifyPluginAsync } from 'fastify';
import path from 'path';
import {
  getMihomoStatus,
  getMihomoVersion,
  getMihomoConnections,
  closeConnection,
  closeAllConnections,
  reloadConfig,
} from './mihomo.service';

export const mihomoRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/mihomo/status', async (_req, reply) => {
    try {
      return await getMihomoStatus();
    } catch (err) {
      fastify.log.error(err);
      reply.code(500).send({ error: 'Internal server error' });
    }
  });

  fastify.get('/mihomo/version', async (_req, reply) => {
    try {
      return await getMihomoVersion();
    } catch (err) {
      fastify.log.error(err);
      reply.code(500).send({ error: 'Failed to get version' });
    }
  });

  fastify.get('/mihomo/connections', async (_req, reply) => {
    try {
      return await getMihomoConnections();
    } catch (err) {
      fastify.log.error(err);
      reply.code(500).send({ error: 'Failed to get connections' });
    }
  });

  fastify.delete('/mihomo/connections', async (_req, reply) => {
    try {
      await closeAllConnections();
      reply.code(200).send({ ok: true });
    } catch (err) {
      fastify.log.error(err);
      reply.code(500).send({ error: 'Failed to close connections' });
    }
  });

  fastify.delete('/mihomo/connections/:id', async (req, reply) => {
    try {
      const { id } = req.params as { id: string };
      await closeConnection(id);
      reply.code(200).send({ ok: true });
    } catch (err) {
      fastify.log.error(err);
      reply.code(500).send({ error: 'Failed to close connection' });
    }
  });

  fastify.post('/mihomo/reload', async (req, reply) => {
    try {
      const body = (req.body as { configPath?: string }) ?? {};
      const configPath = body.configPath || process.env.CONFIG_PATH || path.join(process.cwd(), 'data', 'config.yaml');
      await reloadConfig(configPath);
      reply.code(200).send({ ok: true });
    } catch (err) {
      fastify.log.error(err);
      reply.code(500).send({ error: 'Failed to reload config' });
    }
  });
};
