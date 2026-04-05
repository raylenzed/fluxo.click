"use client";
import { useState } from "react";
import { Search, ArrowUp, ArrowDown, ChevronsUpDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Topbar } from "@/components/layout/topbar";
import { formatBytes, formatSpeed, cn } from "@/lib/utils";

interface Process {
  name: string;
  displayName: string;
  connections: number;
  uploadSpeed: number;
  downloadSpeed: number;
  totalSent: number;
  totalRecv: number;
  color: string;
}

const processes: Process[] = [
  { name: "com.electron.cursor", displayName: "Cursor", connections: 18, uploadSpeed: 340 * 1024, downloadSpeed: 1.8 * 1024 * 1024, totalSent: 4.2 * 1024 * 1024, totalRecv: 120 * 1024 * 1024, color: "#7c5cfc" },
  { name: "chrome", displayName: "Chrome", connections: 32, uploadSpeed: 120 * 1024, downloadSpeed: 800 * 1024, totalSent: 8.5 * 1024 * 1024, totalRecv: 340 * 1024 * 1024, color: "#ea4335" },
  { name: "Spotify", displayName: "Spotify", connections: 6, uploadSpeed: 12 * 1024, downloadSpeed: 320 * 1024, totalSent: 2.1 * 1024 * 1024, totalRecv: 88 * 1024 * 1024, color: "#1db954" },
  { name: "safari", displayName: "Safari", connections: 14, uploadSpeed: 44 * 1024, downloadSpeed: 210 * 1024, totalSent: 1.2 * 1024 * 1024, totalRecv: 45 * 1024 * 1024, color: "#0071e3" },
  { name: "Terminal", displayName: "Terminal", connections: 4, uploadSpeed: 8 * 1024, downloadSpeed: 15 * 1024, totalSent: 320 * 1024, totalRecv: 1.8 * 1024 * 1024, color: "#333333" },
  { name: "Slack", displayName: "Slack", connections: 8, uploadSpeed: 22 * 1024, downloadSpeed: 120 * 1024, totalSent: 3.4 * 1024 * 1024, totalRecv: 22 * 1024 * 1024, color: "#4a154b" },
  { name: "Discord", displayName: "Discord", connections: 5, uploadSpeed: 18 * 1024, downloadSpeed: 88 * 1024, totalSent: 2.8 * 1024 * 1024, totalRecv: 18 * 1024 * 1024, color: "#5865f2" },
  { name: "WeChat", displayName: "WeChat", connections: 3, uploadSpeed: 6 * 1024, downloadSpeed: 30 * 1024, totalSent: 500 * 1024, totalRecv: 8 * 1024 * 1024, color: "#07c160" },
  { name: "bird", displayName: "iCloud", connections: 7, uploadSpeed: 88 * 1024, downloadSpeed: 45 * 1024, totalSent: 12 * 1024 * 1024, totalRecv: 5 * 1024 * 1024, color: "#2997ff" },
  { name: "Finder", displayName: "Finder", connections: 2, uploadSpeed: 2 * 1024, downloadSpeed: 4 * 1024, totalSent: 44 * 1024, totalRecv: 120 * 1024, color: "#888888" },
];

type SortKey = "connections" | "uploadSpeed" | "downloadSpeed" | "totalSent" | "totalRecv";
type SortDir = "asc" | "desc";

export default function ProcessesPage() {
  const [search, setSearch] = useState("");
  const [meteredNetwork, setMeteredNetwork] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("downloadSpeed");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("desc"); }
  };

  const filtered = processes
    .filter((p) => !search || p.displayName.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const diff = a[sortKey] - b[sortKey];
      return sortDir === "asc" ? diff : -diff;
    });

  function SortHeader({ label, k }: { label: string; k: SortKey }) {
    const active = sortKey === k;
    return (
      <button
        onClick={() => handleSort(k)}
        className={cn("flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider transition-colors", active ? "text-[var(--brand-500)]" : "text-[var(--muted)] hover:text-[var(--foreground)]")}
      >
        {label} <ChevronsUpDown className="h-3 w-3 opacity-60" />
      </button>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <Topbar title="Processes" description="Traffic breakdown by application" />
      <div className="flex-1 p-6 overflow-auto space-y-5">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--muted)]" />
              <Input placeholder="Search process..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 w-52" />
            </div>
            <span className="text-sm text-[var(--muted)]">{filtered.length} processes</span>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <Switch checked={meteredNetwork} onCheckedChange={setMeteredNetwork} />
            <span className="text-xs font-medium text-[var(--muted)]">Metered Network</span>
          </label>
        </div>

        <Card>
          <div className="px-4 py-2.5 border-b border-[var(--border)] flex items-center gap-3">
            <span className="w-8 shrink-0" />
            <span className="flex-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">Process</span>
            <span className="w-20 text-right shrink-0"><SortHeader label="Conns" k="connections" /></span>
            <span className="hidden sm:block w-28 text-right shrink-0"><SortHeader label="Upload" k="uploadSpeed" /></span>
            <span className="hidden sm:block w-28 text-right shrink-0"><SortHeader label="Download" k="downloadSpeed" /></span>
            <span className="hidden md:block w-24 text-right shrink-0"><SortHeader label="Sent" k="totalSent" /></span>
            <span className="hidden md:block w-24 text-right shrink-0"><SortHeader label="Recv" k="totalRecv" /></span>
          </div>
          <CardContent className="pt-2 pb-2 px-2 space-y-0.5">
            {filtered.map((proc, i) => (
              <div
                key={proc.name}
                className={cn(
                  "flex items-center gap-3 rounded-[10px] px-2 py-2.5 transition-colors hover:bg-[var(--surface-2)]",
                  i < 3 && "bg-[var(--brand-100)]/30 dark:bg-[var(--brand-500)]/5"
                )}
              >
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] text-white text-sm font-bold"
                  style={{ backgroundColor: proc.color }}
                >
                  {proc.displayName[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--foreground)] truncate">{proc.displayName}</p>
                  <p className="text-[11px] text-[var(--muted)] font-mono truncate">{proc.name}</p>
                </div>
                <div className="w-20 text-right shrink-0">
                  <span className="text-sm font-semibold text-[var(--foreground)]">{proc.connections}</span>
                </div>
                <div className="hidden sm:flex w-28 items-center justify-end gap-0.5 shrink-0">
                  <ArrowUp className="h-3 w-3 text-emerald-500" />
                  <span className="text-xs font-mono text-emerald-600">{formatSpeed(proc.uploadSpeed)}</span>
                </div>
                <div className="hidden sm:flex w-28 items-center justify-end gap-0.5 shrink-0">
                  <ArrowDown className="h-3 w-3 text-[var(--brand-500)]" />
                  <span className="text-xs font-mono text-[var(--brand-500)]">{formatSpeed(proc.downloadSpeed)}</span>
                </div>
                <div className="hidden md:block w-24 text-right shrink-0">
                  <span className="text-xs font-mono text-[var(--muted)]">{formatBytes(proc.totalSent)}</span>
                </div>
                <div className="hidden md:block w-24 text-right shrink-0">
                  <span className="text-xs font-mono text-[var(--muted)]">{formatBytes(proc.totalRecv)}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
