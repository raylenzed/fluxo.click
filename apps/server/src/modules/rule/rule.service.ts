import { getDb } from '../../database/db';
import { randomUUID } from 'crypto';

export function getAllRules() {
  return getDb().prepare('SELECT * FROM rules ORDER BY sort_order').all();
}

export function getRuleById(id: string) {
  return getDb().prepare('SELECT * FROM rules WHERE id = ?').get(id);
}

export function createRule(data: {
  type: string;
  value?: string;
  policy: string;
  notify?: boolean;
  extended_matching?: boolean;
  note?: string;
}) {
  const now = new Date().toISOString();
  const id = randomUUID();
  getDb()
    .prepare(
      `INSERT INTO rules (id, type, value, policy, notify, extended_matching, sort_order, note, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM rules), ?, ?, ?)`
    )
    .run(
      id,
      data.type,
      data.value ?? null,
      data.policy,
      data.notify ? 1 : 0,
      data.extended_matching ? 1 : 0,
      data.note ?? '',
      now,
      now
    );
  return { id };
}

export function updateRule(
  id: string,
  data: Partial<{
    type: string;
    value: string;
    policy: string;
    notify: boolean;
    extended_matching: boolean;
    note: string;
  }>
) {
  const now = new Date().toISOString();
  const sets: string[] = ['updated_at = ?'];
  const vals: unknown[] = [now];
  if (data.type !== undefined) { sets.push('type = ?'); vals.push(data.type); }
  if (data.value !== undefined) { sets.push('value = ?'); vals.push(data.value); }
  if (data.policy !== undefined) { sets.push('policy = ?'); vals.push(data.policy); }
  if (data.notify !== undefined) { sets.push('notify = ?'); vals.push(data.notify ? 1 : 0); }
  if (data.extended_matching !== undefined) { sets.push('extended_matching = ?'); vals.push(data.extended_matching ? 1 : 0); }
  if (data.note !== undefined) { sets.push('note = ?'); vals.push(data.note); }
  vals.push(id);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getDb().prepare(`UPDATE rules SET ${sets.join(', ')} WHERE id = ?`).run(...(vals as any[]));
}

export function deleteRule(id: string) {
  getDb().prepare('DELETE FROM rules WHERE id = ?').run(id);
}

export function reorderRules(ids: string[]) {
  const db = getDb();
  const stmt = db.prepare('UPDATE rules SET sort_order = ? WHERE id = ?');
  const update = db.transaction(() => {
    ids.forEach((id, index) => {
      stmt.run(index, id);
    });
  });
  update();
}
