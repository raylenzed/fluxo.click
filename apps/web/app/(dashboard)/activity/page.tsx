"use client";
import { useState } from "react";
import { Search, X, Pause, Play, ChevronDown, ChevronRight, ArrowUp, ArrowDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Topbar } from "@/components/layout/topbar";
import { formatBytes, cn } from "@/lib/utils";

interface Connection {
  id: string;
  host: string;
  method: string;
  status: number;
  active: boolean;
  policy: string;
  chain: string[];
  sent: number;
  recv: number;
  elapsed: string;
  process: string;
  rule: string;
  startTime: string;
}

const connections: Connection[] = [
  { id: "1", host: "api.openai.com:443", method: "CONNECT", status: 200, active: true, policy: "OpenAI", chain: ["OpenAI", "US OwO"], sent: 1.2 * 1024 * 1024, recv: 14.8 * 1024, elapsed: "2m 34s", process: "com.electron.cursor", rule: "DOMAIN-SUFFIX,openai.com,OpenAI", startTime: "14:22:01" },
  { id: "2", host: "www.google.com", method: "GET", status: 200, active: false, policy: "Proxy", chain: ["Proxy", "US OwO"], sent: 3 * 1024, recv: 98 * 1024, elapsed: "0.4s", process: "chrome", rule: "GEOIP,US,Proxy", startTime: "14:23:15" },
  { id: "3", host: "api.github.com", method: "GET", status: 200, active: true, policy: "Proxy", chain: ["Proxy", "JP RFC"], sent: 420, recv: 8 * 1024, elapsed: "1m 02s", process: "git", rule: "DOMAIN-KEYWORD,github,Proxy", startTime: "14:23:44" },
  { id: "4", host: "www.baidu.com", method: "GET", status: 200, active: false, policy: "DIRECT", chain: ["DIRECT"], sent: 1 * 1024, recv: 45 * 1024, elapsed: "0.2s", process: "safari", rule: "GEOIP,CN,DIRECT", startTime: "14:24:01" },
  { id: "5", host: "telegram.org:443", method: "CONNECT", status: 200, active: true, policy: "Telegram", chain: ["Telegram", "US OwO"], sent: 88 * 1024, recv: 220 * 1024, elapsed: "5m 12s", process: "Telegram", rule: "DOMAIN-SUFFIX,telegram.org,Telegram", startTime: "14:19:33" },
  { id: "6", host: "detectportal.firefox.com", method: "GET", status: 204, active: false, policy: "DIRECT", chain: ["DIRECT"], sent: 200, recv: 0, elapsed: "0.1s", process: "firefox", rule: "GEOIP,CN,DIRECT", startTime: "14:24:20" },
  { id: "7", host: "cdn.discordapp.com:443", method: "CONNECT", status: 200, active: true, policy: "Discord", chain: ["Discord", "US OwO"], sent: 2.4 * 1024 * 1024, recv: 18 * 1024 * 1024, elapsed: "8m 44s", process: "Discord", rule: "DOMAIN-SUFFIX,discordapp.com,Discord", startTime: "14:16:01" },
  { id: "8", host: "alive.github.com", method: "GET", status: 200, active: true, policy: "Proxy", chain: ["Proxy", "JP RFC"], sent: 150, recv: 80, elapsed: "3m 55s", process: "git", rule: "DOMAIN-KEYWORD,github,Proxy", startTime: "14:20:50" },
  { id: "9", host: "open.spotify.com:443", method: "CONNECT", status: 200, active: true, policy: "Streaming", chain: ["Streaming", "SG SPT"], sent: 512 * 1024, recv: 4.2 * 1024 * 1024, elapsed: "12m 10s", process: "Spotify", rule: "DOMAIN-SUFFIX,spotify.com,Streaming", startTime: "14:12:45" },
  { id: "10", host: "ocsp.apple.com", method: "GET", status: 200, active: false, policy: "DIRECT", chain: ["DIRECT"], sent: 800, recv: 1200, elapsed: "0.3s", process: "securityd", rule: "DOMAIN-SUFFIX,apple.com,DIRECT", startTime: "14:24:30" },
  { id: "11", host: "push.apple.com:443", method: "CONNECT", status: 200, active: true, policy: "DIRECT", chain: ["DIRECT"], sent: 3 * 1024, recv: 12 * 1024, elapsed: "20m 01s", process: "apsd", rule: "DOMAIN-SUFFIX,apple.com,DIRECT", startTime: "14:04:44" },
  { id: "12", host: "fonts.googleapis.com", method: "GET", status: 200, active: false, policy: "Proxy", chain: ["Proxy", "US OwO"], sent: 450, recv: 22 * 1024, elapsed: "0.6s", process: "chrome", rule: "DOMAIN-SUFFIX,googleapis.com,Proxy", startTime: "14:23:58" },
  { id: "13", host: "slack.com:443", method: "CONNECT", status: 200, active: true, policy: "Proxy", chain: ["Proxy", "US OwO"], sent: 66 * 1024, recv: 300 * 1024, elapsed: "9m 33s", process: "Slack", rule: "DOMAIN-SUFFIX,slack.com,Proxy", startTime: "14:15:12" },
  { id: "14", host: "cloudflare-dns.com", method: "GET", status: 200, active: false, policy: "DIRECT", chain: ["DIRECT"], sent: 100, recv: 200, elapsed: "0.05s", process: "mihomo", rule: "DOMAIN-SUFFIX,cloudflare.com,DIRECT", startTime: "14:24:39" },
  { id: "15", host: "api.notion.com:443", method: "CONNECT", status: 200, active: true, policy: "Proxy", chain: ["Proxy", "JP RFC"], sent: 34 * 1024, recv: 128 * 1024, elapsed: "4m 22s", process: "Notion", rule: "DOMAIN-SUFFIX,notion.com,Proxy", startTime: "14:20:23" },
];

const policyColors: Record<string, string> = {
  DIRECT: "bg-[var(--surface-2)] text-[var(--muted)] border border-[var(--border)]",
  Proxy: "bg-[var(--brand-100)] text-[var(--brand-600)] dark:bg-[var(--brand-500)]/20 dark:text-[var(--brand-300)]",
  OpenAI: "bg-amber-50 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
  Telegram: "bg-sky-50 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300",
  Discord: "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300",
  Streaming: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
};
function getPolicyColor(policy: string) {
  return policyColors[policy] ?? "bg-[var(--brand-100)] text-[var(--brand-600)]";
}

const methodColors: Record<string, string> = {
  GET: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
  POST: "bg-blue-50 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300",
  CONNECT: "bg-[var(--brand-100)] text-[var(--brand-600)] dark:bg-[var(--brand-500)]/20 dark:text-[var(--brand-300)]",
  PUT: "bg-amber-50 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
  DELETE: "bg-red-50 text-red-700 dark:bg-red-500/20 dark:text-red-300",
};

function ConnectionRow({ conn }: { conn: Connection }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <>
      <div
        className="flex items-center gap-3 rounded-[10px] px-3 py-2.5 hover:bg-[var(--surface-2)] transition-colors cursor-pointer group"
        onClick={() => setExpanded((v) => !v)}
      >
        <span className={cn("h-2 w-2 rounded-full shrink-0", conn.active ? "bg-emerald-500 animate-pulse" : "bg-[var(--border)]")} />
        <span className="flex-1 min-w-0 text-sm font-mono text-[var(--foreground)] truncate">{conn.host}</span>
        <span className={cn("hidden sm:block text-[10px] font-mono font-bold rounded px-1.5 py-0.5 shrink-0", methodColors[conn.method] ?? "bg-[var(--surface-2)] text-[var(--muted)]")}>{conn.method}</span>
        <span className="hidden sm:block text-xs text-[var(--muted)] shrink-0 font-mono">{conn.status}</span>
        <span className={cn("hidden md:block text-[11px] font-semibold rounded-[6px] px-2 py-0.5 shrink-0", getPolicyColor(conn.policy))}>{conn.policy}</span>
        <span className="hidden lg:flex items-center gap-1 text-[11px] text-[var(--muted)] shrink-0 font-mono">
          {conn.chain.map((c, i) => (
            <span key={i} className="flex items-center gap-1">
              {i > 0 && <ChevronRight className="h-3 w-3 opacity-40" />}
              {c}
            </span>
          ))}
        </span>
        <span className="hidden xl:flex items-center gap-2 text-[11px] text-[var(--muted)] shrink-0 font-mono">
          <span className="flex items-center gap-0.5"><ArrowUp className="h-3 w-3 text-emerald-500" />{formatBytes(conn.sent)}</span>
          <span className="flex items-center gap-0.5"><ArrowDown className="h-3 w-3 text-[var(--brand-400)]" />{formatBytes(conn.recv)}</span>
        </span>
        <span className="hidden xl:block text-xs text-[var(--muted)] shrink-0">{conn.elapsed}</span>
        <ChevronDown className={cn("h-3.5 w-3.5 text-[var(--muted)] shrink-0 transition-transform duration-150", expanded && "rotate-180")} />
      </div>
      {expanded && (
        <div className="mx-2 mb-1 rounded-[10px] bg-[var(--surface-2)] border border-[var(--border)] px-4 py-3 text-xs space-y-1.5">
          <div className="grid grid-cols-2 gap-2">
            <div><span className="text-[var(--muted)]">Process: </span><span className="text-[var(--foreground)] font-mono">{conn.process}</span></div>
            <div><span className="text-[var(--muted)]">Start: </span><span className="text-[var(--foreground)] font-mono">{conn.startTime}</span></div>
            <div><span className="text-[var(--muted)]">Duration: </span><span className="text-[var(--foreground)]">{conn.elapsed}</span></div>
            <div><span className="text-[var(--muted)]">Status: </span><span className={conn.active ? "text-emerald-600" : "text-[var(--muted)]"}>{conn.active ? "Active" : "Closed"}</span></div>
          </div>
          <div><span className="text-[var(--muted)]">Rule: </span><span className="text-[var(--foreground)] font-mono">{conn.rule}</span></div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1"><ArrowUp className="h-3 w-3 text-emerald-500" />{formatBytes(conn.sent)}</span>
            <span className="flex items-center gap-1"><ArrowDown className="h-3 w-3 text-[var(--brand-400)]" />{formatBytes(conn.recv)}</span>
          </div>
        </div>
      )}
    </>
  );
}

export default function ActivityPage() {
  const [search, setSearch] = useState("");
  const [policyFilter, setPolicyFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");
  const [onlyActive, setOnlyActive] = useState(false);
  const [paused, setPaused] = useState(false);

  const filtered = connections.filter((c) => {
    if (onlyActive && !c.active) return false;
    if (policyFilter !== "all" && c.policy !== policyFilter) return false;
    if (methodFilter !== "all" && c.method !== methodFilter) return false;
    if (search && !c.host.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalSent = filtered.reduce((s, c) => s + c.sent, 0);
  const totalRecv = filtered.reduce((s, c) => s + c.recv, 0);
  const activeCount = filtered.filter((c) => c.active).length;

  return (
    <div className="flex flex-col h-full">
      <Topbar title="Activity" description="Real-time connection log">
        <Button size="sm" variant="ghost" className="text-[var(--muted)] text-xs gap-1.5" onClick={() => {}}>
          <X className="h-3.5 w-3.5" />
          Clear
        </Button>
        <Button size="sm" variant="outline" className="text-xs gap-1.5" onClick={() => setPaused((v) => !v)}>
          {paused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
          {paused ? "Resume" : "Pause"}
        </Button>
      </Topbar>

      <div className="flex-1 p-6 overflow-auto space-y-4">
        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--muted)]" />
            <Input
              placeholder="Search host..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={policyFilter} onValueChange={setPolicyFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Policy" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Policies</SelectItem>
              <SelectItem value="DIRECT">DIRECT</SelectItem>
              <SelectItem value="Proxy">Proxy</SelectItem>
              <SelectItem value="OpenAI">OpenAI</SelectItem>
              <SelectItem value="Telegram">Telegram</SelectItem>
              <SelectItem value="Discord">Discord</SelectItem>
              <SelectItem value="Streaming">Streaming</SelectItem>
            </SelectContent>
          </Select>
          <Select value={methodFilter} onValueChange={setMethodFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Methods</SelectItem>
              <SelectItem value="GET">GET</SelectItem>
              <SelectItem value="POST">POST</SelectItem>
              <SelectItem value="CONNECT">CONNECT</SelectItem>
            </SelectContent>
          </Select>
          <label className="flex items-center gap-2 cursor-pointer">
            <Switch checked={onlyActive} onCheckedChange={setOnlyActive} />
            <span className="text-xs font-medium text-[var(--muted)]">Only Active</span>
          </label>
        </div>

        {/* Table header */}
        <Card>
          <div className="px-3 py-2 border-b border-[var(--border)] flex items-center gap-3">
            <span className="w-2 shrink-0" />
            <span className="flex-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">Host</span>
            <span className="hidden sm:block w-16 text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)] shrink-0">Method</span>
            <span className="hidden sm:block w-10 text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)] shrink-0">Code</span>
            <span className="hidden md:block w-20 text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)] shrink-0">Policy</span>
            <span className="hidden lg:block w-40 text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)] shrink-0">Chain</span>
            <span className="hidden xl:block w-32 text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)] shrink-0">Traffic</span>
            <span className="hidden xl:block w-14 text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)] shrink-0">Time</span>
            <span className="w-4 shrink-0" />
          </div>
          <CardContent className="pt-2 pb-2 px-2 space-y-0.5">
            {filtered.length === 0 ? (
              <p className="text-center text-[var(--muted)] text-sm py-8">No connections match the filter</p>
            ) : (
              filtered.map((conn) => <ConnectionRow key={conn.id} conn={conn} />)
            )}
          </CardContent>
        </Card>

        {/* Stats bar */}
        <div className="flex items-center gap-6 px-1 text-xs text-[var(--muted)]">
          <span>Total: <strong className="text-[var(--foreground)]">{filtered.length}</strong></span>
          <span>Active: <strong className="text-emerald-600">{activeCount}</strong></span>
          <span>Sent: <strong className="text-[var(--foreground)] font-mono">{formatBytes(totalSent)}</strong></span>
          <span>Received: <strong className="text-[var(--foreground)] font-mono">{formatBytes(totalRecv)}</strong></span>
          {paused && <Badge variant="warning">Paused</Badge>}
        </div>
      </div>
    </div>
  );
}
