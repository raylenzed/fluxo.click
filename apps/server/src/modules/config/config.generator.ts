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

  // Load rule providers
  const ruleProviderRows = db.prepare('SELECT * FROM rule_providers').all() as any[];
  const ruleProviders: Record<string, unknown> = {};
  for (const rp of ruleProviderRows) {
    ruleProviders[rp.name] = {
      type: rp.type,
      behavior: rp.behavior,
      ...(rp.url ? { url: rp.url } : {}),
      path: rp.path || `./rule-providers/${rp.name}.yaml`,
      interval: rp.interval || 86400,
    };
  }

  // Load rules
  const ruleRows = db.prepare('SELECT * FROM rules ORDER BY sort_order').all() as any[];
  const rules = ruleRows.map(row => {
    if (row.type === 'FINAL') return `MATCH,${row.policy}`;
    if (row.type === 'RULE-SET') return `RULE-SET,${row.value},${row.policy}`;
    if (!row.value) return `${row.type},${row.policy}`;
    const parts = [row.type, row.value, row.policy];
    // notify column stores the "no-resolve" flag for IP-type rules
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
  // tun.dns_hijack may be stored as JSON array string or plain string
  const rawDnsHijack = (settings['tun.dns_hijack'] as string) ?? '["any:53"]';
  let dnsHijackArr: string[];
  try {
    const parsed = JSON.parse(rawDnsHijack);
    dnsHijackArr = Array.isArray(parsed) ? parsed : [String(parsed)];
  } catch {
    dnsHijackArr = rawDnsHijack.split(',').map((s: string) => s.trim()).filter(Boolean);
  }
  config['tun'] = {
    enable: tunEnable,
    stack: settings['tun.stack'] ?? 'system',
    'auto-route': settings['tun.auto_route'] ?? true,
    'auto-redirect': false,
    'dns-hijack': dnsHijackArr,
  };

  // DNS section
  if (dnsRow) {
    // Use mode column directly; fall back to enhanced_mode boolean for legacy rows
    const dnsMode = dnsRow.mode || (dnsRow.enhanced_mode ? 'fake-ip' : 'normal');
    const dns: Record<string, unknown> = {
      enable: Boolean(dnsRow.enable),
      'enhanced-mode': dnsMode,
      nameserver: JSON.parse(dnsRow.nameservers || '[]'),
      fallback: JSON.parse(dnsRow.fallback_dns || '[]'),
      'use-hosts': Boolean(dnsRow.use_hosts),
    };
    if (dnsMode === 'fake-ip') {
      dns['fake-ip-range'] = '198.18.0.0/15';
      dns['fake-ip-filter'] = JSON.parse(dnsRow.fake_ip_filter || '[]');
    }
    config['dns'] = dns;
  }

  if (proxies.length > 0) config['proxies'] = proxies;
  if (Object.keys(proxyProviders).length > 0) config['proxy-providers'] = proxyProviders;
  if (proxyGroups.length > 0) config['proxy-groups'] = proxyGroups;
  if (Object.keys(ruleProviders).length > 0) config['rule-providers'] = ruleProviders;
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
