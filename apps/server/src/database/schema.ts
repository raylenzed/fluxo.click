// Define SQL for creating all tables
export const CREATE_TABLES_SQL = `
  CREATE TABLE IF NOT EXISTS proxies (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    server TEXT NOT NULL,
    port INTEGER NOT NULL,
    config TEXT NOT NULL,  -- JSON blob for protocol-specific fields
    sort_order INTEGER DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS providers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    interval INTEGER DEFAULT 86400,
    filter TEXT,
    health_check_url TEXT,
    last_updated TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS proxy_groups (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,  -- select|url-test|fallback|load-balance
    proxies TEXT NOT NULL,  -- JSON array of proxy names
    providers TEXT DEFAULT '[]',  -- JSON array of provider names
    url TEXT,
    interval INTEGER DEFAULT 300,
    tolerance INTEGER DEFAULT 150,
    filter TEXT,
    use_all_proxies INTEGER DEFAULT 0,
    strategy TEXT,  -- for load-balance
    sort_order INTEGER DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS rules (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    value TEXT,
    policy TEXT NOT NULL,
    notify INTEGER DEFAULT 0,
    extended_matching INTEGER DEFAULT 0,
    sort_order INTEGER DEFAULT 0,
    note TEXT DEFAULT '',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS rule_providers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,  -- http|file|inline
    behavior TEXT NOT NULL,  -- domain|ipcidr|classical
    url TEXT,
    path TEXT,
    interval INTEGER DEFAULT 86400,
    policy TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS profiles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    is_active INTEGER DEFAULT 0,
    sort_order INTEGER DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS dns_config (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    enable INTEGER DEFAULT 1,
    mode TEXT DEFAULT 'fake-ip',
    nameservers TEXT DEFAULT '["223.5.5.5", "119.29.29.29"]',
    fallback_dns TEXT DEFAULT '["8.8.8.8", "1.1.1.1"]',
    fake_ip_filter TEXT DEFAULT '["*.local", "+.lan"]',
    use_hosts INTEGER DEFAULT 1,
    enhanced_mode INTEGER DEFAULT 1,
    updated_at TEXT NOT NULL
  );
`;
