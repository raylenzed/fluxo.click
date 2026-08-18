import type { FastifyPluginAsync } from 'fastify';
import { getDb } from '../../database/db';
import { randomUUID } from 'crypto';
import {
  HttpError,
  assertNonEmptyName,
  assertPolicyExists,
  assertValidProviderType,
  assertValidRuleProviderBehavior,
  getHttpStatus,
} from '../policy/policy.validation';
import {
  createRuleForProvider,
  deleteRulesForProvider,
  syncRuleForProvider,
} from './rule-provider.sync';

type RuleProviderBody = {
  name: string;
  type: string;
  behavior: string;
  url?: string;
  path?: string;
  interval?: number;
  policy: string;
};

function validateRuleProvider(body: RuleProviderBody) {
  const name = assertNonEmptyName(body.name, 'Rule provider name');
  const policy = assertNonEmptyName(body.policy, 'Policy');
  const type = assertNonEmptyName(body.type, 'Rule provider type');
  const behavior = assertNonEmptyName(body.behavior, 'Rule provider behavior');
  assertValidProviderType(type);
  assertValidRuleProviderBehavior(behavior);
  assertPolicyExists(policy);
  const url = typeof body.url === 'string' ? body.url.trim() : '';
  const providerPath = typeof body.path === 'string' ? body.path.trim() : '';
  if (type === 'http' && !url) throw new HttpError(400, 'HTTP rule provider requires a URL');
  if (type === 'file' && !providerPath) throw new HttpError(400, 'File rule provider requires a path');
  if (type === 'inline') throw new HttpError(400, 'Inline rule providers are not supported yet');
  return { name, policy, type, behavior, url, providerPath };
}

export const ruleProviderRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/rule-providers', async () => {
    return getDb()
      .prepare(
        `SELECT rp.*,
          COALESCE(
            (SELECT r.policy
             FROM rules r
             WHERE r.type = 'RULE-SET' AND r.value = rp.name
             ORDER BY r.sort_order
             LIMIT 1),
            rp.policy
          ) AS policy
         FROM rule_providers rp
         ORDER BY rp.name`
      )
      .all();
  });

  fastify.post('/rule-providers', async (req, reply) => {
    try {
      const body = req.body as RuleProviderBody;
      const { name, policy, type, behavior, url, providerPath } = validateRuleProvider(body);

      const db = getDb();
      const duplicate = db.prepare('SELECT 1 FROM rule_providers WHERE name = ?').get(name);
      if (duplicate) throw new HttpError(409, `Rule provider already exists: ${name}`);

      const now = new Date().toISOString();
      const id = randomUUID();
      const create = db.transaction(() => {
        db.prepare(
          `INSERT INTO rule_providers (id, name, type, behavior, url, path, interval, policy, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
          .run(
            id,
            name,
            type,
            behavior,
            url || null,
            providerPath || null,
            body.interval ?? 86400,
            policy,
            now,
            now
          );
        createRuleForProvider(db, name, policy, now);
      });
      create();
      reply.code(201).send({ id });
    } catch (err) {
      fastify.log.error(err);
      reply.code(getHttpStatus(err)).send({ error: err instanceof Error ? err.message : 'Internal server error' });
    }
  });

  fastify.put('/rule-providers/:id', async (req, reply) => {
    try {
      const { id } = req.params as { id: string };
      const body = req.body as RuleProviderBody;
      const { name, policy, type, behavior, url, providerPath } = validateRuleProvider(body);
      const db = getDb();
      const existing = db.prepare('SELECT name FROM rule_providers WHERE id = ?').get(id) as
        | { name: string }
        | undefined;
      if (!existing) throw new HttpError(404, 'Rule provider not found');

      const duplicate = db.prepare('SELECT 1 FROM rule_providers WHERE name = ? AND id <> ?').get(name, id);
      if (duplicate) throw new HttpError(409, `Rule provider already exists: ${name}`);

      const now = new Date().toISOString();
      const update = db.transaction(() => {
        db.prepare(
          `UPDATE rule_providers
           SET name = ?, type = ?, behavior = ?, url = ?, path = ?, interval = ?, policy = ?, updated_at = ?
           WHERE id = ?`
        ).run(
          name,
          type,
          behavior,
          url || null,
          providerPath || null,
          body.interval ?? 86400,
          policy,
          now,
          id
        );
        syncRuleForProvider(db, existing.name, name, policy, now);
      });
      update();
      return { ok: true };
    } catch (err) {
      fastify.log.error(err);
      reply.code(getHttpStatus(err)).send({ error: err instanceof Error ? err.message : 'Internal server error' });
    }
  });

  fastify.delete('/rule-providers/:id', async (req, reply) => {
    try {
      const { id } = req.params as { id: string };
      const db = getDb();
      const existing = db.prepare('SELECT name FROM rule_providers WHERE id = ?').get(id) as { name: string } | undefined;
      if (!existing) throw new HttpError(404, 'Rule provider not found');

      const remove = db.transaction(() => {
        deleteRulesForProvider(db, existing.name);
        db.prepare('DELETE FROM rule_providers WHERE id = ?').run(id);
      });
      remove();
      return { ok: true };
    } catch (err) {
      fastify.log.error(err);
      reply.code(getHttpStatus(err)).send({ error: err instanceof Error ? err.message : 'Internal server error' });
    }
  });
};
