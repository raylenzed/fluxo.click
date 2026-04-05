"use client";
import { useState } from "react";
import { Info, Smartphone, Laptop, Tablet, Plus, Wifi } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Topbar } from "@/components/layout/topbar";
import { formatBytes, cn } from "@/lib/utils";

type DeviceType = "phone" | "laptop" | "tablet" | "nas" | "router";

interface Device {
  id: string;
  name: string;
  hostname: string;
  ip: string;
  mac: string;
  lastSeen: string;
  type: DeviceType;
  totalSent: number;
  totalRecv: number;
  online: boolean;
}

const devices: Device[] = [
  { id: "1", name: "iPhone 15 Pro", hostname: "raylen-iphone.local", ip: "192.168.1.101", mac: "A4:C3:F0:12:34:56", lastSeen: "Just now", type: "phone", totalSent: 120 * 1024 * 1024, totalRecv: 800 * 1024 * 1024, online: true },
  { id: "2", name: "MacBook Pro", hostname: "raylen-macbook.local", ip: "192.168.1.100", mac: "F8:FF:C2:AB:CD:EF", lastSeen: "Just now", type: "laptop", totalSent: 4.2 * 1024 * 1024 * 1024, totalRecv: 12 * 1024 * 1024 * 1024, online: true },
  { id: "3", name: "iPad Air", hostname: "raylen-ipad.local", ip: "192.168.1.102", mac: "C8:D7:19:A1:B2:C3", lastSeen: "5m ago", type: "tablet", totalSent: 55 * 1024 * 1024, totalRecv: 380 * 1024 * 1024, online: true },
  { id: "4", name: "Android Phone", hostname: "android-phone.local", ip: "192.168.1.103", mac: "30:52:CB:7E:8F:10", lastSeen: "12m ago", type: "phone", totalSent: 30 * 1024 * 1024, totalRecv: 200 * 1024 * 1024, online: false },
  { id: "5", name: "Synology NAS", hostname: "nas.local", ip: "192.168.1.200", mac: "00:11:32:AA:BB:CC", lastSeen: "Just now", type: "nas", totalSent: 2.1 * 1024 * 1024 * 1024, totalRecv: 800 * 1024 * 1024, online: true },
  { id: "6", name: "Home Router", hostname: "router.local", ip: "192.168.1.1", mac: "B0:BE:76:11:22:33", lastSeen: "Just now", type: "router", totalSent: 0, totalRecv: 0, online: true },
];

const deviceTypeLabels: Record<DeviceType, string> = {
  phone: "Phone",
  laptop: "Laptop",
  tablet: "Tablet",
  nas: "NAS",
  router: "Router",
};

function DeviceIcon({ type, className }: { type: DeviceType; className?: string }) {
  if (type === "phone") return <Smartphone className={className} />;
  if (type === "tablet") return <Tablet className={className} />;
  if (type === "laptop") return <Laptop className={className} />;
  return <Wifi className={className} />;
}

const typeColors: Record<DeviceType, string> = {
  phone: "bg-sky-50 text-sky-600 dark:bg-sky-500/20 dark:text-sky-300",
  laptop: "bg-[var(--brand-100)] text-[var(--brand-600)] dark:bg-[var(--brand-500)]/20 dark:text-[var(--brand-300)]",
  tablet: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300",
  nas: "bg-amber-50 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300",
  router: "bg-[var(--surface-2)] text-[var(--muted)]",
};

export default function DevicesPage() {
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const types = ["all", "phone", "laptop", "tablet", "nas", "router"];
  const filtered = devices.filter((d) => typeFilter === "all" || d.type === typeFilter);

  return (
    <div className="flex flex-col h-full">
      <Topbar title="Devices" description="LAN device management">
        <Button size="sm" className="gap-1.5 text-xs bg-[var(--brand-500)] hover:bg-[var(--brand-600)] text-white">
          <Plus className="h-3.5 w-3.5" />
          Add Device
        </Button>
      </Topbar>

      <div className="flex-1 p-6 overflow-auto space-y-5">
        {/* Info banner */}
        <div className="flex items-start gap-3 rounded-[12px] bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-4 py-3">
          <Info className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
          <p className="text-sm text-amber-700 dark:text-amber-300">
            Gateway mode is required for device management. Enable it in Overview to see all LAN devices.
          </p>
        </div>

        {/* Type filter */}
        <div className="flex items-center gap-2 flex-wrap">
          {types.map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={cn(
                "rounded-[8px] px-3 py-1 text-xs font-semibold capitalize transition-all",
                typeFilter === t
                  ? "bg-[var(--brand-500)] text-white"
                  : "bg-[var(--surface-2)] text-[var(--muted)] hover:text-[var(--foreground)] border border-[var(--border)]"
              )}
            >
              {t === "all" ? "All Devices" : deviceTypeLabels[t as DeviceType]}
            </button>
          ))}
          <span className="text-xs text-[var(--muted)] ml-1">{filtered.length} device{filtered.length !== 1 ? "s" : ""}</span>
        </div>

        {/* Device grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((device) => (
            <Card key={device.id} className="p-4 hover:shadow-lg transition-shadow duration-200">
              <div className="flex items-start gap-3">
                <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px]", typeColors[device.type])}>
                  <DeviceIcon type={device.type} className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-[var(--foreground)] truncate">{device.name}</p>
                    <span className={cn("h-2 w-2 rounded-full shrink-0", device.online ? "bg-emerald-500" : "bg-[var(--border)]")} />
                  </div>
                  <p className="text-xs text-[var(--muted)] font-mono truncate">{device.hostname}</p>
                </div>
                <Badge variant="secondary" className="text-[10px] shrink-0">{deviceTypeLabels[device.type]}</Badge>
              </div>

              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[var(--muted)]">IP Address</span>
                  <span className="font-mono text-[var(--foreground)]">{device.ip}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[var(--muted)]">MAC</span>
                  <span className="font-mono text-[var(--muted)] truncate ml-4">{device.mac.slice(0, 11)}…</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[var(--muted)]">Last seen</span>
                  <span className="text-[var(--foreground)]">{device.lastSeen}</span>
                </div>
              </div>

              {(device.totalSent > 0 || device.totalRecv > 0) && (
                <div className="mt-3 pt-3 border-t border-[var(--border)] flex items-center justify-between text-xs text-[var(--muted)] font-mono">
                  <span>↑ {formatBytes(device.totalSent)}</span>
                  <span>↓ {formatBytes(device.totalRecv)}</span>
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
