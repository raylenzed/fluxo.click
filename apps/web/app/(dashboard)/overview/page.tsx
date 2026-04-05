"use client";
import { useState } from "react";
import {
  Copy, Check, RefreshCw, Globe, Lock, LayoutDashboard,
  ArrowDown, ArrowUp, Activity, Cpu, Clock, Wifi
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Topbar } from "@/components/layout/topbar";
import { formatBytes, cn } from "@/lib/utils";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button
      onClick={handleCopy}
      className="p-1 rounded-[6px] text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-2)] transition-all shrink-0"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

export default function OverviewPage() {
  const [systemProxy, setSystemProxy] = useState(true);
  const [enhancedMode, setEnhancedMode] = useState(true);
  const [gatewayMode, setGatewayMode] = useState(false);

  const proxyAddresses = [
    { label: "HTTP Proxy", value: "127.0.0.1:7890" },
    { label: "SOCKS5", value: "127.0.0.1:7891" },
    { label: "Mixed Port", value: "127.0.0.1:7893" },
  ];

  const statusItems = [
    { label: "Mode", value: "Rules", icon: Activity, iconColor: "bg-[var(--brand-100)] text-[var(--brand-500)] dark:bg-[var(--brand-500)]/20" },
    { label: "Connections", value: "104", icon: Wifi, iconColor: "bg-sky-50 text-sky-500 dark:bg-sky-500/20" },
    { label: "Memory", value: "128 MB", icon: Cpu, iconColor: "bg-amber-50 text-amber-500 dark:bg-amber-500/20" },
    { label: "Uptime", value: "3h 24m", icon: Clock, iconColor: "bg-emerald-50 text-emerald-500 dark:bg-emerald-500/20" },
  ];

  return (
    <div className="flex flex-col h-full">
      <Topbar title="Overview" description="Network control center">
        <Button size="sm" variant="outline" className="gap-2 text-xs">
          <RefreshCw className="h-3.5 w-3.5" />
          Reload Config
        </Button>
      </Topbar>

      <div className="flex-1 p-6 overflow-auto space-y-5">
        {/* Status grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statusItems.map((item) => (
            <Card key={item.label} className="p-4 flex items-start gap-3">
              <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px]", item.iconColor)}>
                <item.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-[var(--muted)] uppercase tracking-wider">{item.label}</p>
                <p className="mt-0.5 text-2xl font-extrabold text-[var(--foreground)] tracking-tighter">{item.value}</p>
              </div>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Network Mode */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Network Mode</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: "System Proxy", description: "Route system traffic through Mihomo", checked: systemProxy, onCheckedChange: setSystemProxy },
                { label: "Enhanced Mode (TUN)", description: "Capture all traffic via virtual NIC", checked: enhancedMode, onCheckedChange: setEnhancedMode },
                { label: "Gateway Mode", description: "Act as gateway for LAN devices", checked: gatewayMode, onCheckedChange: setGatewayMode },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[var(--foreground)]">{item.label}</p>
                    <p className="text-xs text-[var(--muted)] mt-0.5">{item.description}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={item.checked ? "success" : "secondary"}>{item.checked ? "Active" : "Inactive"}</Badge>
                    <Switch checked={item.checked} onCheckedChange={item.onCheckedChange} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Proxy Addresses */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Proxy Addresses</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {proxyAddresses.map((addr) => (
                <div key={addr.label} className="flex items-center justify-between rounded-[10px] bg-[var(--surface-2)] px-3 py-2.5 border border-[var(--border)]">
                  <div>
                    <p className="text-xs text-[var(--muted)] font-medium">{addr.label}</p>
                    <p className="text-sm font-mono font-semibold text-[var(--foreground)] mt-0.5">{addr.value}</p>
                  </div>
                  <CopyButton text={addr.value} />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Connection Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Connection Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: "External Controller", value: "127.0.0.1:9090", icon: Globe },
                { label: "API Key", value: "••••••••••••••••", icon: Lock },
                { label: "Web Dashboard", value: "http://127.0.0.1:9090/ui", icon: LayoutDashboard },
              ].map((info) => (
                <div key={info.label} className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-[var(--surface-2)] border border-[var(--border)]">
                    <info.icon className="h-4 w-4 text-[var(--muted)]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-[var(--muted)]">{info.label}</p>
                    <p className="text-sm font-mono text-[var(--foreground)] truncate">{info.value}</p>
                  </div>
                  <CopyButton text={info.value} />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Traffic Summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Traffic Summary</CardTitle>
              <p className="text-xs text-[var(--muted)]">This session</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[var(--brand-100)] text-[var(--brand-500)] dark:bg-[var(--brand-500)]/20">
                  <ArrowDown className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-[var(--muted)] font-medium">Downloaded</p>
                  <p className="text-2xl font-extrabold text-[var(--foreground)] tracking-tighter">{formatBytes(4.67 * 1024 * 1024 * 1024)}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-emerald-50 text-emerald-500 dark:bg-emerald-500/20">
                  <ArrowUp className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-[var(--muted)] font-medium">Uploaded</p>
                  <p className="text-2xl font-extrabold text-[var(--foreground)] tracking-tighter">{formatBytes(1.59 * 1024 * 1024 * 1024)}</p>
                </div>
              </div>
              <div className="pt-2 border-t border-[var(--border)]">
                <div className="flex justify-between text-xs text-[var(--muted)]">
                  <span>Session started</span>
                  <span>3h 24m ago</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
