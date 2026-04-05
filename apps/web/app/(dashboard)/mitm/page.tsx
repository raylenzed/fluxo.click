"use client";
import { useState } from "react";
import { AlertTriangle, Shield, Download, Upload, RefreshCw, Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Topbar } from "@/components/layout/topbar";
import { cn } from "@/lib/utils";

export default function MitmPage() {
  const [mitmEnabled, setMitmEnabled] = useState(false);
  const [autoQuicBlock, setAutoQuicBlock] = useState(true);
  const [tcpConcurrent, setTcpConcurrent] = useState(false);
  const [hostnameList, setHostnameList] = useState("*.example.com\napi.stripe.com\n*.ads.google.com");
  const [skipList, setSkipList] = useState("*.apple.com\n*.icloud.com\nbank.example.com");
  const [newHostname, setNewHostname] = useState("");

  const addHostname = () => {
    if (!newHostname.trim()) return;
    setHostnameList((prev) => prev ? `${prev}\n${newHostname.trim()}` : newHostname.trim());
    setNewHostname("");
  };

  return (
    <div className="flex flex-col h-full">
      <Topbar title="MitM" description="HTTPS decryption configuration" />

      <div className="flex-1 p-6 overflow-auto space-y-5">
        {/* Enable MitM */}
        <Card className={cn("border-2 transition-colors", mitmEnabled ? "border-amber-400 dark:border-amber-500" : "border-[var(--border)]")}>
          <div className="p-5 flex items-start gap-4">
            <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px]", mitmEnabled ? "bg-amber-100 text-amber-600 dark:bg-amber-500/20" : "bg-[var(--surface-2)] text-[var(--muted)]")}>
              <Shield className="h-6 w-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-[var(--foreground)]">HTTPS Decryption (MitM)</h3>
                {mitmEnabled && <Badge variant="warning">Active</Badge>}
              </div>
              <p className="text-sm text-[var(--muted)] mt-1">
                Intercepts and decrypts HTTPS traffic for inspection and modification. Requires a trusted CA certificate.
              </p>
            </div>
            <Switch checked={mitmEnabled} onCheckedChange={setMitmEnabled} className="shrink-0" />
          </div>
        </Card>

        {/* Warning */}
        {mitmEnabled && (
          <div className="flex items-start gap-3 rounded-[12px] bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-4 py-3">
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">Security Notice</p>
              <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                MitM is enabled. All HTTPS traffic matching the hostname list will be intercepted and decrypted.
                Only use this feature in trusted environments.
              </p>
            </div>
          </div>
        )}

        {/* CA Certificate */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">CA Certificate</CardTitle>
            <p className="text-xs text-[var(--muted)]">Manage the root CA certificate used for HTTPS interception</p>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 flex-wrap">
              <Button variant="outline" size="sm" className="gap-2 text-xs">
                <RefreshCw className="h-3.5 w-3.5" />
                Generate New CA
              </Button>
              <Button variant="outline" size="sm" className="gap-2 text-xs">
                <Download className="h-3.5 w-3.5" />
                Export CA
              </Button>
              <Button variant="outline" size="sm" className="gap-2 text-xs">
                <Shield className="h-3.5 w-3.5" />
                Install CA to System
              </Button>
            </div>
            <div className="mt-4 rounded-[10px] bg-[var(--surface-2)] border border-[var(--border)] px-4 py-3 space-y-1.5 text-xs">
              <div className="flex justify-between"><span className="text-[var(--muted)]">Common Name</span><span className="font-mono text-[var(--foreground)]">Mihomo Party CA</span></div>
              <div className="flex justify-between"><span className="text-[var(--muted)]">Expiry</span><span className="font-mono text-[var(--foreground)]">2034-04-06</span></div>
              <div className="flex justify-between"><span className="text-[var(--muted)]">SHA256</span><span className="font-mono text-[var(--muted)] truncate ml-4">a3:f2:e1:…</span></div>
              <div className="flex justify-between"><span className="text-[var(--muted)]">Status</span><Badge variant="success" className="text-[10px]">Installed</Badge></div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Hostname list */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Hostname List</CardTitle>
              <p className="text-xs text-[var(--muted)]">Domains to decrypt (supports wildcards like *.example.com)</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input
                  value={newHostname}
                  onChange={(e) => setNewHostname(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addHostname()}
                  placeholder="*.example.com"
                  className="flex-1 font-mono"
                />
                <Button onClick={addHostname} size="sm" variant="outline" className="shrink-0 gap-1">
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
              <textarea
                value={hostnameList}
                onChange={(e) => setHostnameList(e.target.value)}
                rows={7}
                className="w-full rounded-[10px] border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm font-mono text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-500)] resize-none"
                placeholder="*.example.com"
              />
            </CardContent>
          </Card>

          {/* Skip list */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Skip List</CardTitle>
              <p className="text-xs text-[var(--muted)]">Domains to never intercept (certificate pinning, banking, etc.)</p>
            </CardHeader>
            <CardContent>
              <textarea
                value={skipList}
                onChange={(e) => setSkipList(e.target.value)}
                rows={10}
                className="w-full rounded-[10px] border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm font-mono text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-500)] resize-none"
                placeholder="*.apple.com"
              />
            </CardContent>
          </Card>
        </div>

        {/* Advanced */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Advanced</CardTitle>
          </CardHeader>
          <CardContent className="space-y-0">
            <div className="flex items-center justify-between py-3 border-b border-[var(--border)]">
              <div>
                <p className="text-sm font-medium text-[var(--foreground)]">Auto QUIC Block</p>
                <p className="text-xs text-[var(--muted)] mt-0.5">Block QUIC/HTTP3 to prevent bypassing MitM via QUIC protocol</p>
              </div>
              <Switch checked={autoQuicBlock} onCheckedChange={setAutoQuicBlock} />
            </div>
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium text-[var(--foreground)]">TCP Concurrent</p>
                <p className="text-xs text-[var(--muted)] mt-0.5">Allow concurrent TCP connections through the MitM proxy</p>
              </div>
              <Switch checked={tcpConcurrent} onCheckedChange={setTcpConcurrent} />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button className="gap-2 bg-[var(--brand-500)] hover:bg-[var(--brand-600)] text-white">
            Apply Configuration
          </Button>
        </div>
      </div>
    </div>
  );
}
