"use client";
import { useState } from "react";
import { ExternalLink, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Topbar } from "@/components/layout/topbar";

function SettingRow({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-[var(--border)] last:border-0">
      <div className="min-w-0">
        <p className="text-sm font-medium text-[var(--foreground)]">{label}</p>
        {description && <p className="text-xs text-[var(--muted)] mt-0.5">{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="pb-0">
        <CardTitle className="text-sm font-semibold text-[var(--muted)] uppercase tracking-wider">{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export default function SettingsPage() {
  // General
  const [startLogin, setStartLogin] = useState(true);
  const [launchMinimized, setLaunchMinimized] = useState(false);
  const [allowLAN, setAllowLAN] = useState(true);
  const [ipv6DNS, setIpv6DNS] = useState(false);
  const [doh, setDoh] = useState(true);
  const [geoipUrl, setGeoipUrl] = useState("https://cdn.jsdelivr.net/gh/Loyalsoldier/geoip@release/Country.mmdb");
  const [geositeUrl, setGeositeUrl] = useState("https://cdn.jsdelivr.net/gh/Loyalsoldier/v2ray-rules-dat@release/geosite.dat");
  const [updateInterval, setUpdateInterval] = useState("24h");
  const [logLevel, setLogLevel] = useState("info");
  // Remote
  const [remoteAccess, setRemoteAccess] = useState(false);
  const [allowWAN, setAllowWAN] = useState(false);
  const [apiPort, setApiPort] = useState("9090");
  const [httpsEnabled, setHttpsEnabled] = useState(false);
  const [apiSecret, setApiSecret] = useState("my-secret-key-2024");
  const [builtinDashboard, setBuiltinDashboard] = useState(true);
  const [customDashUrl, setCustomDashUrl] = useState("");
  // Advanced
  const [connectUrl, setConnectUrl] = useState("https://www.google.com/generate_204");
  const [proxyTestUrl, setProxyTestUrl] = useState("https://www.gstatic.com/generate_204");
  const [testTimeout, setTestTimeout] = useState("5000");
  const [connTimeout, setConnTimeout] = useState("3000");
  const [errorPage, setErrorPage] = useState(true);
  const [sysDNSSupplement, setSysDNSSupplement] = useState(false);
  const [strictDNS, setStrictDNS] = useState(false);

  return (
    <div className="flex flex-col h-full">
      <Topbar title="Settings" description="Configure Mihomo behavior" />
      <div className="flex-1 p-6 overflow-auto space-y-5">
        <Tabs defaultValue="general">
          <TabsList>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="remote">Remote</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          {/* General Tab */}
          <TabsContent value="general" className="mt-5 space-y-4">
            <SectionCard title="Startup">
              <SettingRow label="Start at Login" description="Launch Mihomo Party when you log in">
                <Switch checked={startLogin} onCheckedChange={setStartLogin} />
              </SettingRow>
              <SettingRow label="Launch Minimized" description="Start in the menu bar without showing the window">
                <Switch checked={launchMinimized} onCheckedChange={setLaunchMinimized} />
              </SettingRow>
            </SectionCard>

            <SectionCard title="Network">
              <SettingRow label="Allow LAN Connections" description="Accept connections from other devices on the network">
                <Switch checked={allowLAN} onCheckedChange={setAllowLAN} />
              </SettingRow>
              <SettingRow label="IPv6 DNS Queries" description="Enable IPv6 AAAA record resolution">
                <Switch checked={ipv6DNS} onCheckedChange={setIpv6DNS} />
              </SettingRow>
              <SettingRow label="DNS over HTTPS" description="Encrypt DNS queries via HTTPS">
                <Switch checked={doh} onCheckedChange={setDoh} />
              </SettingRow>
            </SectionCard>

            <SectionCard title="Data">
              <div className="py-3 border-b border-[var(--border)] space-y-2">
                <p className="text-sm font-medium text-[var(--foreground)]">GeoIP Database URL</p>
                <div className="flex gap-2">
                  <Input value={geoipUrl} onChange={(e) => setGeoipUrl(e.target.value)} className="flex-1" />
                  <Button variant="outline" size="sm" className="shrink-0 text-xs">Update Now</Button>
                </div>
              </div>
              <div className="py-3 border-b border-[var(--border)] space-y-2">
                <p className="text-sm font-medium text-[var(--foreground)]">GeoSite Database URL</p>
                <div className="flex gap-2">
                  <Input value={geositeUrl} onChange={(e) => setGeositeUrl(e.target.value)} className="flex-1" />
                  <Button variant="outline" size="sm" className="shrink-0 text-xs">Update Now</Button>
                </div>
              </div>
              <SettingRow label="Auto-update Interval" description="How often to refresh geo databases">
                <Select value={updateInterval} onValueChange={setUpdateInterval}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="disabled">Disabled</SelectItem>
                    <SelectItem value="1h">Every 1h</SelectItem>
                    <SelectItem value="6h">Every 6h</SelectItem>
                    <SelectItem value="24h">Every 24h</SelectItem>
                  </SelectContent>
                </Select>
              </SettingRow>
            </SectionCard>

            <SectionCard title="Logs">
              <SettingRow label="Log Level" description="Verbosity of Mihomo core logs">
                <Select value={logLevel} onValueChange={setLogLevel}>
                  <SelectTrigger className="w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="debug">Debug</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                    <SelectItem value="silent">Silent</SelectItem>
                  </SelectContent>
                </Select>
              </SettingRow>
            </SectionCard>
          </TabsContent>

          {/* Remote Tab */}
          <TabsContent value="remote" className="mt-5 space-y-4">
            <SectionCard title="Proxy Service">
              <SettingRow label="Remote Access" description="Allow external clients to connect to the proxy">
                <Switch checked={remoteAccess} onCheckedChange={setRemoteAccess} />
              </SettingRow>
              <SettingRow label="Allow WAN Access" description="Accept connections from the internet (not just LAN)">
                <Switch checked={allowWAN} onCheckedChange={setAllowWAN} />
              </SettingRow>
            </SectionCard>

            <SectionCard title="Controller">
              <SettingRow label="HTTP API Port" description="Port for the external controller REST API">
                <Input value={apiPort} onChange={(e) => setApiPort(e.target.value)} className="w-24 text-right" />
              </SettingRow>
              <SettingRow label="HTTPS" description="Enable TLS for the controller API">
                <Switch checked={httpsEnabled} onCheckedChange={setHttpsEnabled} />
              </SettingRow>
              <div className="py-3 space-y-2">
                <p className="text-sm font-medium text-[var(--foreground)]">API Secret</p>
                <p className="text-xs text-[var(--muted)]">Required for external controller authentication</p>
                <Input value={apiSecret} onChange={(e) => setApiSecret(e.target.value)} type="password" placeholder="Enter API secret..." />
              </div>
            </SectionCard>

            <SectionCard title="Dashboard">
              <SettingRow label="Built-in Web Dashboard" description="Serve the Yacd/Metacubexd UI from the controller">
                <Switch checked={builtinDashboard} onCheckedChange={setBuiltinDashboard} />
              </SettingRow>
              <div className="py-3 space-y-2">
                <p className="text-sm font-medium text-[var(--foreground)]">Custom Dashboard URL</p>
                <p className="text-xs text-[var(--muted)]">Override with an external dashboard URL</p>
                <Input
                  value={customDashUrl}
                  onChange={(e) => setCustomDashUrl(e.target.value)}
                  disabled={builtinDashboard}
                  placeholder="https://board.razord.top"
                />
              </div>
              <div className="pt-2">
                <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                  <ExternalLink className="h-3.5 w-3.5" />
                  Open Dashboard
                </Button>
              </div>
            </SectionCard>
          </TabsContent>

          {/* Advanced Tab */}
          <TabsContent value="advanced" className="mt-5 space-y-4">
            <SectionCard title="Connectivity">
              <div className="py-3 border-b border-[var(--border)] space-y-2">
                <p className="text-sm font-medium text-[var(--foreground)]">Connectivity Test URL</p>
                <Input value={connectUrl} onChange={(e) => setConnectUrl(e.target.value)} />
              </div>
              <div className="py-3 border-b border-[var(--border)] space-y-2">
                <p className="text-sm font-medium text-[var(--foreground)]">Default Proxy Test URL</p>
                <Input value={proxyTestUrl} onChange={(e) => setProxyTestUrl(e.target.value)} />
              </div>
              <SettingRow label="Test Timeout (ms)" description="Timeout for proxy latency tests">
                <Input value={testTimeout} onChange={(e) => setTestTimeout(e.target.value)} type="number" className="w-24 text-right" />
              </SettingRow>
              <SettingRow label="Connection Timeout (ms)" description="Timeout for establishing connections">
                <Input value={connTimeout} onChange={(e) => setConnTimeout(e.target.value)} type="number" className="w-24 text-right" />
              </SettingRow>
            </SectionCard>

            <SectionCard title="Error Page">
              <SettingRow label="Show Error Page" description="Display a friendly error page when connection fails">
                <Switch checked={errorPage} onCheckedChange={setErrorPage} />
              </SettingRow>
            </SectionCard>

            <SectionCard title="DNS">
              <SettingRow label="System DNS Supplement" description="Append system DNS servers to the resolver list">
                <Switch checked={sysDNSSupplement} onCheckedChange={setSysDNSSupplement} />
              </SettingRow>
              <SettingRow label="Strict DNS" description="Reject DNS responses with non-matching IPs">
                <Switch checked={strictDNS} onCheckedChange={setStrictDNS} />
              </SettingRow>
            </SectionCard>

            <div className="flex justify-end">
              <Button className="gap-2 bg-[var(--brand-500)] hover:bg-[var(--brand-600)] text-white">
                <Save className="h-4 w-4" />
                Save Changes
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
