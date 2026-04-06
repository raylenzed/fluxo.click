"use client";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { RotateCw, Server, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Topbar } from "@/components/layout/topbar";
import { formatBytes, cn } from "@/lib/utils";
import { useLocale } from "@/lib/i18n/context";


async function ft(url: string, ms = 5000) {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), ms);
  try { const r = await fetch(url, { signal: ctrl.signal }); return r.ok ? r.json() : null; }
  catch { return null; } finally { clearTimeout(id); }
}

function useSystemStatus() {
  return useQuery({
    queryKey: ["system", "status"],
    queryFn: async () => {
      const [statusRes, memRes, connRes, uptimeRes] = await Promise.all([
        ft(`/api/mihomo/status`, 5000),
        ft(`/api/mihomo/memory`, 4000),
        ft(`/api/mihomo/connections`, 5000),
        ft(`/api/mihomo/uptime`, 3000),
      ]);
      return {
        running: Boolean(statusRes?.running),
        version: (statusRes?.version as string | null) ?? null,
        memory: (memRes?.inuse as number) ?? null,
        connections: ((connRes?.connections as unknown[]) ?? []).length,
        uptime: (uptimeRes?.uptime as number | null) ?? null,
      };
    },
    refetchInterval: 10_000,
    retry: false,
  });
}

function fmtUptime(s: number): string {
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m ${s % 60}s`;
  const h = Math.floor(s / 3600); const m = Math.floor((s % 3600) / 60);
  return h < 24 ? `${h}h ${m}m` : `${Math.floor(h / 24)}d ${h % 24}h`;
}

function ServiceCard({
  label, running, version, memory, connections, uptime, onRestart, restarting, t,
}: {
  label: string;
  running: boolean;
  version?: string | null;
  memory?: number | null;
  connections?: number;
  uptime?: number | null;
  onRestart?: () => void;
  restarting?: boolean;
  t: { version: string; memory: string; connections: string; openConnections: string; restart: string; running: string; stopped: string; uptime?: string };
}) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={cn(
            "h-10 w-10 rounded-[12px] flex items-center justify-center",
            running ? "bg-emerald-50 dark:bg-emerald-500/20" : "bg-[var(--surface-2)]"
          )}>
            <Server className={cn("h-5 w-5", running ? "text-emerald-500" : "text-[var(--muted)]")} />
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--foreground)]">{label}</p>
            <Badge variant={running ? "success" : "secondary"} className="mt-1 text-[10px]">
              {running ? t.running : t.stopped}
            </Badge>
          </div>
        </div>
        {onRestart && (
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 text-xs shrink-0"
            onClick={onRestart}
            disabled={restarting}
          >
            {restarting
              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
              : <RotateCw className="h-3.5 w-3.5" />}
            {t.restart}
          </Button>
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        {version && (
          <div className="rounded-[10px] bg-[var(--surface-2)] px-3 py-2">
            <p className="text-[10px] text-[var(--muted)] font-medium">{t.version}</p>
            <p className="text-sm font-mono font-semibold text-[var(--foreground)] mt-0.5">{version}</p>
          </div>
        )}
        {memory != null && (
          <div className="rounded-[10px] bg-[var(--surface-2)] px-3 py-2">
            <p className="text-[10px] text-[var(--muted)] font-medium">{t.memory}</p>
            <p className="text-sm font-semibold text-[var(--foreground)] mt-0.5">{formatBytes(memory)}</p>
          </div>
        )}
        {connections != null && (
          <div className="rounded-[10px] bg-[var(--surface-2)] px-3 py-2">
            <p className="text-[10px] text-[var(--muted)] font-medium">{t.connections}</p>
            <p className="text-sm font-semibold text-[var(--foreground)] mt-0.5">{connections} {t.openConnections}</p>
          </div>
        )}
        {uptime != null && t.uptime && (
          <div className="rounded-[10px] bg-[var(--surface-2)] px-3 py-2">
            <p className="text-[10px] text-[var(--muted)] font-medium">{t.uptime}</p>
            <p className="text-sm font-semibold text-[var(--foreground)] mt-0.5">{fmtUptime(uptime)}</p>
          </div>
        )}
      </div>
    </Card>
  );
}

export default function SystemPage() {
  const { t } = useLocale();
  const { data, isLoading } = useSystemStatus();

  const restartMihomo = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/mihomo/reload`, { method: "POST" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => toast.success("Mihomo reloaded"),
    onError: () => toast.error("Failed to reload Mihomo"),
  });

  const sysT = t.system;

  return (
    <div className="flex flex-col h-full">
      <Topbar title={sysT.title} description={sysT.subtitle} />
      <div className="flex-1 p-6 overflow-auto space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-[var(--muted)]" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ServiceCard
              label={sysT.mihomoService}
              running={data?.running ?? false}
              version={data?.version}
              memory={data?.memory}
              connections={data?.connections}
              uptime={data?.uptime}
              onRestart={() => restartMihomo.mutate()}
              restarting={restartMihomo.isPending}
              t={sysT}
            />
            <ServiceCard
              label={sysT.fluxoService}
              running={true}
              version={undefined}
              t={sysT}
            />
          </div>
        )}
      </div>
    </div>
  );
}
