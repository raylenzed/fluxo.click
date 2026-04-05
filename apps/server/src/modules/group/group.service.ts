import { getDb } from '../../database/db';
import { randomUUID } from 'crypto';

export function getAllGroups() {
  return getDb().prepare('SELECT * FROM proxy_groups ORDER BY sort_order').all();
}

export function getGroupById(id: string) {
  return getDb().prepare('SELECT * FROM proxy_groups WHERE id = ?').get(id);
}

export function createGroup(data: {
  name: string;
  type: string;
  proxies: string[];
  providers?: string[];
  url?: string;
  interval?: number;
  tolerance?: number;
  filter?: string;
  use_all_proxies?: boolean;
  strategy?: string;
}) {
  const now = new Date().toISOString();
  const id = randomUUID();
  getDb()
    .prepare(
      `INSERT INTO proxy_groups (id, name, type, proxies, providers, url, interval, tolerance, filter, use_all_proxies, strategy, sort_order, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM proxy_groups), ?, ?)`
    )
    .run(
      id,
      data.name,
      data.type,
      JSON.stringify(data.proxies ?? []),
      JSON.stringify(data.providers ?? []),
      data.url ?? null,
      data.interval ?? 300,
      data.tolerance ?? 150,
      data.filter ?? null,
      data.use_all_proxies ? 1 : 0,
      data.strategy ?? null,
      now,
      now
    );
  return { id };
}

export function updateGroup(
  id: string,
  data: Partial<{
    name: string;
    type: string;
    proxies: string[];
    providers: string[];
    url: string;
    interval: number;
    tolerance: number;
    filter: string;
    use_all_proxies: boolean;
    strategy: string;
  }>
) {
  const now = new Date().toISOString();
  const sets: string[] = ['updated_at = ?'];
  const vals: unknown[] = [now];
  if (data.name !== undefined) { sets.push('name = ?'); vals.push(data.name); }
  if (data.type !== undefined) { sets.push('type = ?'); vals.push(data.type); }
  if (data.proxies !== undefined) { sets.push('proxies = ?'); vals.push(JSON.stringify(data.proxies)); }
  if (data.providers !== undefined) { sets.push('providers = ?'); vals.push(JSON.stringify(data.providers)); }
  if (data.url !== undefined) { sets.push('url = ?'); vals.push(data.url); }
  if (data.interval !== undefined) { sets.push('interval = ?'); vals.push(data.interval); }
  if (data.tolerance !== undefined) { sets.push('tolerance = ?'); vals.push(data.tolerance); }
  if (data.filter !== undefined) { sets.push('filter = ?'); vals.push(data.filter); }
  if (data.use_all_proxies !== undefined) { sets.push('use_all_proxies = ?'); vals.push(data.use_all_proxies ? 1 : 0); }
  if (data.strategy !== undefined) { sets.push('strategy = ?'); vals.push(data.strategy); }
  vals.push(id);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getDb().prepare(`UPDATE proxy_groups SET ${sets.join(', ')} WHERE id = ?`).run(...(vals as any[]));
}

export function deleteGroup(id: string) {
  getDb().prepare('DELETE FROM proxy_groups WHERE id = ?').run(id);
}
