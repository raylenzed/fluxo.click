"use client";
import { useLocale } from "@/lib/i18n/context";
import { useRealtimeConnections } from "@/lib/hooks/use-connections";
import { Topbar } from "@/components/layout/topbar";
import { Card } from "@/components/ui/card";
import { formatBytes } from "@/lib/utils";
import { Monitor } from "lucide-react";

export default function DevicesPage() {
  const { t } = useLocale();
  const { connections } = useRealtimeConnections();

  const deviceMap = new Map<string, { count: number; upload: number; download: number }>();
  for (const conn of connections) {
    const meta = conn.metadata as Record<string, string>;
    const ip: string = meta?.sourceIP || meta?.remoteAddress || "Unknown";
    const existing = deviceMap.get(ip) ?? { count: 0, upload: 0, download: 0 };
    deviceMap.set(ip, {
      count: existing.count + 1,
      upload: existing.upload + (conn.upload ?? 0),
      download: existing.download + (conn.download ?? 0),
    });
  }
  const devices = Array.from(deviceMap.entries())
    .map(([ip, stats]) => ({ ip, ...stats }))
    .sort((a, b) => b.count - a.count);

  return (
    <div className="flex flex-col h-full">
      <Topbar title={t.devices.title} description={t.devices.subtitle} />
      <div className="flex-1 p-6 overflow-auto">
        {devices.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-[var(--muted)]">
            <Monitor className="h-12 w-12 mb-3 opacity-30" />
            <p className="text-sm font-medium">{t.devices.noDevices}</p>
            <p className="text-xs mt-1 opacity-70">{t.devices.noDevicesHint}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {devices.map((device) => (
              <Card key={device.ip} className="p-4 hover:shadow-lg transition-all">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-8 w-8 rounded-[10px] bg-sky-50 dark:bg-sky-500/20 flex items-center justify-center shrink-0">
                    <Monitor className="h-4 w-4 text-sky-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[var(--foreground)] font-mono truncate">{device.ip}</p>
                    <p className="text-xs text-[var(--muted)]">{device.count} {t.devices.connections}</p>
                  </div>
                </div>
                <div className="flex justify-between text-xs text-[var(--muted)]">
                  <span>↑ {formatBytes(device.upload)}</span>
                  <span>↓ {formatBytes(device.download)}</span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
