import { randomUUID } from 'crypto';
import type Database from 'better-sqlite3';

type RuleProviderRow = {
  name: string;
  policy: string;
};

function nextRuleOrder(db: Database.Database): number {
  const firstFinal = db
    .prepare("SELECT MIN(sort_order) AS sort_order FROM rules WHERE type IN ('FINAL', 'MATCH')")
    .get() as { sort_order: number | null };

  if (firstFinal.sort_order !== null) {
    db.prepare('UPDATE rules SET sort_order = sort_order + 1 WHERE sort_order >= ?').run(firstFinal.sort_order);
    return firstFinal.sort_order;
  }

  const lastRule = db.prepare('SELECT COALESCE(MAX(sort_order), -1) AS sort_order FROM rules').get() as {
    sort_order: number;
  };
  return lastRule.sort_order + 1;
}

export function createRuleForProvider(
  db: Database.Database,
  name: string,
  policy: string,
  now = new Date().toISOString()
): string {
  const existing = db
    .prepare("SELECT id FROM rules WHERE type = 'RULE-SET' AND value = ? LIMIT 1")
    .get(name) as { id: string } | undefined;
  if (existing) return existing.id;

  const id = randomUUID();
  db.prepare(
    `INSERT INTO rules
      (id, type, value, policy, notify, extended_matching, sort_order, note, created_at, updated_at)
     VALUES (?, 'RULE-SET', ?, ?, 0, 0, ?, '', ?, ?)`
  ).run(id, name, policy, nextRuleOrder(db), now, now);
  return id;
}

export function syncRuleForProvider(
  db: Database.Database,
  previousName: string,
  name: string,
  policy: string,
  now = new Date().toISOString()
): string {
  const result = db
    .prepare(
      `UPDATE rules
       SET value = ?, policy = ?, updated_at = ?
       WHERE type = 'RULE-SET' AND value = ?`
    )
    .run(name, policy, now, previousName);

  if (result.changes > 0) {
    const row = db
      .prepare("SELECT id FROM rules WHERE type = 'RULE-SET' AND value = ? ORDER BY sort_order LIMIT 1")
      .get(name) as { id: string };
    return row.id;
  }

  return createRuleForProvider(db, name, policy, now);
}

export function deleteRulesForProvider(db: Database.Database, name: string): number {
  const result = db.prepare("DELETE FROM rules WHERE type = 'RULE-SET' AND value = ?").run(name);
  const rows = db.prepare('SELECT id FROM rules ORDER BY sort_order, rowid').all() as Array<{ id: string }>;
  const updateOrder = db.prepare('UPDATE rules SET sort_order = ? WHERE id = ?');
  rows.forEach((row, index) => updateOrder.run(index, row.id));
  return result.changes;
}

export function backfillRuleProviderRules(db: Database.Database): number {
  const missingProviders = db
    .prepare(
      `SELECT rp.name, rp.policy
       FROM rule_providers rp
       LEFT JOIN rules r ON r.type = 'RULE-SET' AND r.value = rp.name
       WHERE r.id IS NULL
       ORDER BY rp.name`
    )
    .all() as RuleProviderRow[];

  const now = new Date().toISOString();
  missingProviders.forEach((provider) => {
    createRuleForProvider(db, provider.name, provider.policy, now);
  });
  return missingProviders.length;
}
