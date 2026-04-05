"use client";
import { useState } from "react";
import { Plus, Trash2, Check, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Topbar } from "@/components/layout/topbar";
import { cn } from "@/lib/utils";

type DNSMode = "system" | "system-extra" | "custom";

interface DNSMapping {
  id: string;
  domain: string;
  value: string;
  dnsServer: string;
  notes: string;
}

const initialMappings: DNSMapping[] = [
  { id: "1", domain: "*.corp.example.com", value: "192.168.1.10", dnsServer: "system", notes: "Internal DNS" },
  { id: "2", domain: "+.lan", value: "192.168.1.1", dnsServer: "system", notes: "LAN gateway" },
];

export default function DNSPage() {
  const [dnsMode, setDNSMode] = useState<DNSMode>("system-extra");
  const [customDNS, setCustomDNS] = useState("223.5.5.5\ntls://dns.alidns.com\nhttps://doh.pub/dns-query");
  const [encryptedDNS, setEncryptedDNS] = useState("https://cloudflare-dns.com/dns-query");
  const [readHosts, setReadHosts] = useState(true);
  const [resolveAll, setResolveAll] = useState(false);
  const [fakeIP, setFakeIP] = useState(false);
  const [strictMatch, setStrictMatch] = useState(false);
  const [fakeIPFilter, setFakeIPFilter] = useState("*.local\n+.lan\n+.local.lan\ntime.*.com");
  const [mappings, setMappings] = useState<DNSMapping[]>(initialMappings);
  const [ddnsEnabled, setDdnsEnabled] = useState(false);
  const [ddnsDomain, setDdnsDomain] = useState("");
  const [ddnsProvider, setDdnsProvider] = useState("cloudflare");
  const [ddnsApiKey, setDdnsApiKey] = useState("");

  const addMapping = () => {
    setMappings((prev) => [...prev, { id: Date.now().toString(), domain: "", value: "", dnsServer: "system", notes: "" }]);
  };
  const removeMapping = (id: string) => setMappings((prev) => prev.filter((m) => m.id !== id));
  const updateMapping = (id: string, field: keyof DNSMapping, value: string) => {
    setMappings((prev) => prev.map((m) => (m.id === id ? { ...m, [field]: value } : m)));
  };

  const modeOptions: { value: DNSMode; label: string; desc: string }[] = [
    { value: "system", label: "System DNS", desc: "Use the system's default DNS resolver" },
    { value: "system-extra", label: "System + Extra", desc: "System DNS with additional servers" },
    { value: "custom", label: "Custom", desc: "Fully custom DNS server list" },
  ];

  return (
    <div className="flex flex-col h-full">
      <Topbar title="DNS" description="DNS configuration">
        <Button className="gap-2 bg-[var(--brand-500)] hover:bg-[var(--brand-600)] text-white text-xs">
          <Save className="h-3.5 w-3.5" />
          Apply
        </Button>
      </Topbar>

      <div className="flex-1 p-6 overflow-auto space-y-5">
        {/* DNS Servers */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">DNS Servers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {modeOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setDNSMode(opt.value)}
                  className={cn(
                    "flex flex-col items-start gap-1 rounded-[12px] border-2 px-4 py-3 text-left transition-all",
                    dnsMode === opt.value
                      ? "border-[var(--brand-500)] bg-[var(--brand-100)]/40 dark:bg-[var(--brand-500)]/10"
                      : "border-[var(--border)] hover:border-[var(--brand-300)]"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <div className={cn("h-4 w-4 rounded-full border-2 flex items-center justify-center", dnsMode === opt.value ? "border-[var(--brand-500)]" : "border-[var(--border)]")}>
                      {dnsMode === opt.value && <div className="h-2 w-2 rounded-full bg-[var(--brand-500)]" />}
                    </div>
                    <span className="text-sm font-semibold text-[var(--foreground)]">{opt.label}</span>
                  </div>
                  <p className="text-xs text-[var(--muted)] pl-6">{opt.desc}</p>
                </button>
              ))}
            </div>

            {dnsMode === "custom" && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-[var(--muted)]">Custom DNS Servers (one per line)</p>
                <textarea
                  value={customDNS}
                  onChange={(e) => setCustomDNS(e.target.value)}
                  rows={4}
                  className="w-full rounded-[10px] border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm font-mono text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-500)] resize-none"
                  placeholder="223.5.5.5&#10;tls://dns.alidns.com&#10;https://doh.pub/dns-query"
                />
              </div>
            )}

            <div className="space-y-2">
              <p className="text-xs font-medium text-[var(--muted)]">Encrypted DNS (DoH/DoT/DoQ)</p>
              <Input value={encryptedDNS} onChange={(e) => setEncryptedDNS(e.target.value)} placeholder="https://cloudflare-dns.com/dns-query" />
            </div>
          </CardContent>
        </Card>

        {/* DNS Options */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">DNS Options</CardTitle>
          </CardHeader>
          <CardContent className="space-y-0">
            {[
              { label: "Read /etc/hosts", desc: "Use local hosts file for name resolution", checked: readHosts, set: setReadHosts },
              { label: "Resolve All Domains", desc: "Force DNS resolution even for proxied connections", checked: resolveAll, set: setResolveAll },
              { label: "Fake IP Mode", desc: "Use fake IPs to improve proxy performance", checked: fakeIP, set: setFakeIP },
              { label: "Strict Match", desc: "Only match domains that exactly match a rule", checked: strictMatch, set: setStrictMatch },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between py-3 border-b border-[var(--border)] last:border-0">
                <div>
                  <p className="text-sm font-medium text-[var(--foreground)]">{item.label}</p>
                  <p className="text-xs text-[var(--muted)] mt-0.5">{item.desc}</p>
                </div>
                <Switch checked={item.checked} onCheckedChange={item.set} />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Fake IP Filter */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Fake IP Filter</CardTitle>
            <p className="text-xs text-[var(--muted)]">Domains excluded from fake-ip (one per line)</p>
          </CardHeader>
          <CardContent>
            <textarea
              value={fakeIPFilter}
              onChange={(e) => setFakeIPFilter(e.target.value)}
              rows={5}
              className="w-full rounded-[10px] border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm font-mono text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-500)] resize-none"
            />
          </CardContent>
        </Card>

        {/* Local DNS Mapping */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold">Local DNS Mapping</CardTitle>
                <p className="text-xs text-[var(--muted)] mt-1">Override DNS responses for specific domains</p>
              </div>
              <Button onClick={addMapping} size="sm" variant="outline" className="gap-1.5 text-xs">
                <Plus className="h-3.5 w-3.5" />
                Add Row
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {/* Header */}
              <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 px-2">
                {["Domain", "Value", "DNS Server", ""].map((h) => (
                  <span key={h} className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">{h}</span>
                ))}
              </div>
              {mappings.map((m) => (
                <div key={m.id} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-center">
                  <Input value={m.domain} onChange={(e) => updateMapping(m.id, "domain", e.target.value)} placeholder="*.example.com" className="font-mono text-xs" />
                  <Input value={m.value} onChange={(e) => updateMapping(m.id, "value", e.target.value)} placeholder="192.168.1.1" className="font-mono text-xs" />
                  <Select value={m.dnsServer} onValueChange={(v) => updateMapping(m.id, "dnsServer", v)}>
                    <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="system">System</SelectItem>
                      <SelectItem value="encrypted">Encrypted</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="ghost" size="icon-sm" onClick={() => removeMapping(m.id)} className="text-[var(--muted)] hover:text-red-500">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {mappings.length === 0 && (
                <p className="text-center text-xs text-[var(--muted)] py-4">No mappings configured</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* DDNS */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">DDNS</CardTitle>
              <Switch checked={ddnsEnabled} onCheckedChange={setDdnsEnabled} />
            </div>
          </CardHeader>
          {ddnsEnabled && (
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <p className="text-xs font-medium text-[var(--muted)]">Domain</p>
                <Input value={ddnsDomain} onChange={(e) => setDdnsDomain(e.target.value)} placeholder="home.example.com" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <p className="text-xs font-medium text-[var(--muted)]">Provider</p>
                  <Select value={ddnsProvider} onValueChange={setDdnsProvider}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cloudflare">Cloudflare</SelectItem>
                      <SelectItem value="dnspod">DNSPod</SelectItem>
                      <SelectItem value="alibaba">Alibaba DNS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-medium text-[var(--muted)]">API Key</p>
                  <Input value={ddnsApiKey} onChange={(e) => setDdnsApiKey(e.target.value)} type="password" placeholder="••••••••" />
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
