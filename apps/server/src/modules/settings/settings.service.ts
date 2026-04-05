import { getDb } from '../../database/db';

export function getAllSettings(): Record<string, unknown> {
  const rows = getDb().prepare('SELECT key, value FROM settings').all() as { key: string; value: string }[];
  const result: Record<string, unknown> = {};
  for (const row of rows) {
    result[row.key] = JSON.parse(row.value);
  }
  return result;
}

export function updateSettings(data: Record<string, unknown>) {
  const now = new Date().toISOString();
  const db = getDb();
  const stmt = db.prepare('INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, ?)');
  const update = db.transaction(() => {
    for (const [key, value] of Object.entries(data)) {
      stmt.run(key, JSON.stringify(value), now);
    }
  });
  update();
}

export function getSetting(key: string): unknown {
  const row = getDb().prepare('SELECT value FROM settings WHERE key = ?').get(key) as { value: string } | undefined;
  return row ? JSON.parse(row.value) : undefined;
}
