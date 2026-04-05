import yaml from 'js-yaml';
import { getDb } from '../../database/db';

export async function generateConfig(): Promise<string> {
  const db = getDb();

  // Load settings
  const settingsRows = db.prepare('SELECT key, value FROM settings').all() as { key: string; value: string }[];
  const settings: Record<string, unknown> = {};
  for (const row of settingsRows) {
    settings[row.key] = JSON.parse(row.value);
  }

  // Load proxies
  const proxyRows = db.prepare('SELECT * FROM proxies ORDER BY sort_order').all() as any[];
  const proxies = proxyRows.map(row => {
    const config = JSON.parse(row.config);
    return { name: row.name, type: row.type, server: row.server, port: row.port, ...config };
  });

  // Load providers
  const providerRows = db.prepare('SELECT * FROM providers').all() as any[];
  const proxyProviders: Record<string, unknown> = {};
  for (const p of providerRows) {
    proxyProviders[p.name] = {
      type: 'http',
      url: p.url,
      interval: p.interval,
      path: `./providers/${p.name}.yaml`,
      ...(p.filter ? { filter: p.filter } : {}),
      ...(p.health_check_url ? { 'health-check': { enable: true, interval: 600, url: p.health_check_url } } : {}),
    };
  }

  // Load proxy groups
  const groupRows = db.prepare('SELECT * FROM proxy_groups ORDER BY sort_order').all() as any[];
  const proxyGroups = groupRows.map(row => {
    const base: Record<string, unknown> = {
      name: row.name,
      type: row.type,
      proxies: JSON.parse(row.proxies),
    };
    if (row.providers && JSON.parse(row.providers).length > 0) {
      base['use'] = JSON.parse(row.providers);
    }
    if (row.filter) base['filter'] = row.filter;
    if (row.use_all_proxies) base['include-all'] = true;
    if (row.type === 'url-test' || row.type === 'fallback') {
      base['url'] = row.url || 'https://www.google.com/generate_204';
      base['interval'] = row.interval || 300;
      base['tolerance'] = row.tolerance || 150;
    }
    if (row.type === 'load-balance') {
      base['strategy'] = row.strategy || 'consistent-hashing';
    }
    return base;
  });

  // Load rules
  const ruleRows = db.prepare('SELECT * FROM rules ORDER BY sort_order').all() as any[];
  const rules = ruleRows.map(row => {
    if (row.type === 'FINAL') return `MATCH,${row.policy}`;
    if (!row.value) return `${row.type},${row.policy}`;
    const parts = [row.type, row.value, row.policy];
    if (row.notify) parts.push('no-resolve');
    return parts.join(',');
  });

  // Load DNS config
  const dnsRow = db.prepare('SELECT * FROM dns_config WHERE id = 1').get() as any;

  // Build config object
  const config: Record<string, unknown> = {
    'mixed-port': settings['general.mixed_port'] ?? 7890,
    'allow-lan': settings['general.allow_lan'] ?? false,
    mode: settings['general.mode'] ?? 'rule',
    'log-level': settings['general.log_level'] ?? 'info',
    ipv6: settings['general.ipv6'] ?? false,
    'external-controller': settings['mihomo.external_controller'] ?? '127.0.0.1:9090',
    ...(settings['mihomo.secret'] ? { secret: settings['mihomo.secret'] } : {}),
  };

  // TUN section
  const tunEnable = settings['tun.enable'] === true || settings['tun.enable'] === 'true';
  config['tun'] = {
    enable: tunEnable,
    stack: settings['tun.stack'] ?? 'system',
    'auto-route': settings['tun.auto_route'] ?? true,
    'auto-redirect': false,
    'dns-hijack': JSON.parse((settings['tun.dns_hijack'] as string) ?? '["any:53"]'),
  };

  // DNS section
  if (dnsRow) {
    config['dns'] = {
      enable: Boolean(dnsRow.enable),
      'enhanced-mode': dnsRow.enhanced_mode ? 'fake-ip' : 'normal',
      'fake-ip-range': '198.18.0.0/15',
      'fake-ip-filter': JSON.parse(dnsRow.fake_ip_filter || '[]'),
      nameserver: JSON.parse(dnsRow.nameservers || '[]'),
      fallback: JSON.parse(dnsRow.fallback_dns || '[]'),
      'use-hosts': Boolean(dnsRow.use_hosts),
    };
  }

  if (proxies.length > 0) config['proxies'] = proxies;
  if (Object.keys(proxyProviders).length > 0) config['proxy-providers'] = proxyProviders;
  if (proxyGroups.length > 0) config['proxy-groups'] = proxyGroups;
  if (rules.length > 0) config['rules'] = rules;

  return yaml.dump(config, { lineWidth: -1, quotingType: '"' });
}

export async function writeConfigAndReload(configPath: string, mihomoApiUrl: string, mihomoSecret?: string): Promise<void> {
  const fs = await import('fs/promises');
  const axios = (await import('axios')).default;

  const yamlContent = await generateConfig();
  await fs.writeFile(configPath, yamlContent, 'utf-8');

  // Reload via Mihomo REST API
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (mihomoSecret) headers['Authorization'] = `Bearer ${mihomoSecret}`;
  await axios.put(`${mihomoApiUrl}/configs`, { path: configPath }, { headers });
}
