import Database from 'better-sqlite3';
import path from 'path';
import { CREATE_TABLES_SQL } from './schema';

const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), 'data', 'mihomo-party.db');

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!_db) {
    const fs = require('fs');
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    _db = new Database(DB_PATH);
    _db.pragma('journal_mode = WAL');
    _db.pragma('foreign_keys = ON');
    // Execute all CREATE TABLE statements
    _db.exec(CREATE_TABLES_SQL);
    // Seed default settings
    seedDefaults(_db);
  }
  return _db;
}

function seedDefaults(db: Database.Database) {
  const defaults: Record<string, unknown> = {
    'general.mixed_port': 7890,
    'general.allow_lan': false,
    'general.mode': 'rule',
    'general.log_level': 'info',
    'general.ipv6': false,
    'tun.enable': false,
    'tun.stack': 'system',
    'tun.auto_route': true,
    'tun.dns_hijack': '["any:53"]',
    'mihomo.external_controller': '127.0.0.1:9090',
    'mihomo.secret': '',
  };
  const now = new Date().toISOString();
  const stmt = db.prepare('INSERT OR IGNORE INTO settings (key, value, updated_at) VALUES (?, ?, ?)');
  for (const [key, value] of Object.entries(defaults)) {
    stmt.run(key, JSON.stringify(value), now);
  }
}
