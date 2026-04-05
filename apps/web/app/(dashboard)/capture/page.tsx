"use client";
import { useState } from "react";
import { Circle, Search, Download, Trash2, X, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Topbar } from "@/components/layout/topbar";
import { formatBytes, cn } from "@/lib/utils";

interface Capture {
  id: string;
  method: string;
  url: string;
  status: number;
  contentType: string;
  size: number;
  timeMs: number;
  requestHeaders: Record<string, string>;
  responseHeaders: Record<string, string>;
  requestBody?: string;
  responseBody?: string;
}

const captures: Capture[] = [
  { id: "1", method: "GET", url: "https://api.openai.com/v1/models", status: 200, contentType: "application/json", size: 4.2 * 1024, timeMs: 230, requestHeaders: { "Authorization": "Bearer sk-••••", "Content-Type": "application/json" }, responseHeaders: { "Content-Type": "application/json", "x-request-id": "req_abc123" }, responseBody: '{"object":"list","data":[{"id":"gpt-4"}]}' },
  { id: "2", method: "POST", url: "https://api.openai.com/v1/chat/completions", status: 200, contentType: "application/json", size: 1.8 * 1024, timeMs: 4201, requestHeaders: { "Authorization": "Bearer sk-••••", "Content-Type": "application/json" }, responseHeaders: { "Content-Type": "application/json" }, requestBody: '{"model":"gpt-4","messages":[{"role":"user","content":"Hello"}]}', responseBody: '{"choices":[{"message":{"content":"Hi!"}}]}' },
  { id: "3", method: "CONNECT", url: "www.google.com:443", status: 200, contentType: "-", size: 0, timeMs: 42, requestHeaders: {}, responseHeaders: {} },
  { id: "4", method: "GET", url: "https://www.google.com/generate_204", status: 204, contentType: "text/html", size: 0, timeMs: 88, requestHeaders: { "User-Agent": "curl/8.0" }, responseHeaders: { "Content-Length": "0" } },
  { id: "5", method: "GET", url: "https://cdn.discordapp.com/attachments/123/456/image.png", status: 200, contentType: "image/png", size: 240 * 1024, timeMs: 340, requestHeaders: { "Range": "bytes=0-" }, responseHeaders: { "Content-Type": "image/png", "Content-Length": "245760" } },
  { id: "6", method: "POST", url: "https://slack.com/api/chat.postMessage", status: 200, contentType: "application/json", size: 820, timeMs: 122, requestHeaders: { "Authorization": "Bearer xoxb-••••" }, responseHeaders: { "Content-Type": "application/json" }, requestBody: '{"channel":"C123","text":"Hello"}', responseBody: '{"ok":true,"ts":"1234567890.123"}' },
  { id: "7", method: "GET", url: "https://api.github.com/user/repos", status: 200, contentType: "application/json", size: 32 * 1024, timeMs: 510, requestHeaders: { "Authorization": "token ghp_••••" }, responseHeaders: { "X-RateLimit-Remaining": "59" } },
  { id: "8", method: "GET", url: "https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700", status: 200, contentType: "text/css", size: 3.4 * 1024, timeMs: 65, requestHeaders: { "Accept": "text/css" }, responseHeaders: { "Content-Type": "text/css; charset=utf-8" } },
];

const methodColors: Record<string, string> = {
  GET: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
  POST: "bg-blue-50 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300",
  CONNECT: "bg-[var(--brand-100)] text-[var(--brand-600)] dark:bg-[var(--brand-500)]/20 dark:text-[var(--brand-300)]",
  PUT: "bg-amber-50 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
  DELETE: "bg-red-50 text-red-700 dark:bg-red-500/20 dark:text-red-300",
};

const statusColor = (s: number) => {
  if (s < 200) return "text-[var(--muted)]";
  if (s < 300) return "text-emerald-600";
  if (s < 400) return "text-amber-600";
  return "text-red-600";
};

export default function CapturePage() {
  const [recording, setRecording] = useState(false);
  const [selected, setSelected] = useState<Capture | null>(null);
  const [search, setSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [captureList, setCaptureList] = useState<Capture[]>(captures);

  const filtered = captureList.filter((c) => {
    if (methodFilter !== "all" && c.method !== methodFilter) return false;
    if (statusFilter !== "all") {
      const range = parseInt(statusFilter);
      if (c.status < range || c.status >= range + 100) return false;
    }
    if (search && !c.url.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="flex flex-col h-full">
      <Topbar title="Capture" description="HTTP traffic inspection">
        <Button variant="ghost" size="sm" className="text-[var(--muted)] text-xs gap-1.5" onClick={() => setCaptureList([])}>
          <Trash2 className="h-3.5 w-3.5" />
          Clear
        </Button>
        <Button variant="outline" size="sm" className="text-xs gap-1.5">
          <Download className="h-3.5 w-3.5" />
          Export HAR
        </Button>
        <Button
          size="sm"
          onClick={() => setRecording((v) => !v)}
          className={cn("gap-1.5 text-xs font-semibold", recording ? "bg-red-500 hover:bg-red-600 text-white" : "bg-[var(--brand-500)] hover:bg-[var(--brand-600)] text-white")}
        >
          <Circle className={cn("h-3 w-3", recording && "animate-pulse fill-white")} />
          {recording ? "Stop Recording" : "Start Recording"}
        </Button>
      </Topbar>

      <div className="flex-1 p-6 overflow-auto space-y-4">
        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--muted)]" />
            <Input placeholder="Search URL..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={methodFilter} onValueChange={setMethodFilter}>
            <SelectTrigger className="w-32"><SelectValue placeholder="Method" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Methods</SelectItem>
              <SelectItem value="GET">GET</SelectItem>
              <SelectItem value="POST">POST</SelectItem>
              <SelectItem value="CONNECT">CONNECT</SelectItem>
              <SelectItem value="PUT">PUT</SelectItem>
              <SelectItem value="DELETE">DELETE</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="200">2xx Success</SelectItem>
              <SelectItem value="300">3xx Redirect</SelectItem>
              <SelectItem value="400">4xx Client Err</SelectItem>
              <SelectItem value="500">5xx Server Err</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-4">
          {/* Request list */}
          <Card className="flex-1 min-w-0">
            <div className="px-3 py-2 border-b border-[var(--border)] flex items-center gap-3 text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">
              <span className="w-14 shrink-0">Method</span>
              <span className="flex-1">URL</span>
              <span className="w-12 text-right shrink-0 hidden sm:block">Status</span>
              <span className="w-20 text-right shrink-0 hidden md:block">Type</span>
              <span className="w-16 text-right shrink-0 hidden md:block">Size</span>
              <span className="w-14 text-right shrink-0 hidden lg:block">Time</span>
            </div>
            <CardContent className="pt-1 pb-1 px-1 space-y-0.5">
              {filtered.length === 0 ? (
                <p className="text-center text-sm text-[var(--muted)] py-8">{recording ? "Waiting for traffic..." : "No captures — start recording to capture traffic"}</p>
              ) : (
                filtered.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => setSelected(selected?.id === c.id ? null : c)}
                    className={cn("flex items-center gap-3 rounded-[10px] px-2 py-2.5 cursor-pointer transition-colors", selected?.id === c.id ? "bg-[var(--brand-100)]/40 dark:bg-[var(--brand-500)]/10" : "hover:bg-[var(--surface-2)]")}
                  >
                    <span className={cn("w-14 shrink-0 text-[10px] font-mono font-bold rounded px-1.5 py-0.5 text-center", methodColors[c.method] ?? "bg-[var(--surface-2)] text-[var(--muted)]")}>{c.method}</span>
                    <span className="flex-1 min-w-0 text-xs font-mono text-[var(--foreground)] truncate">{c.url}</span>
                    <span className={cn("w-12 text-right text-xs font-mono font-semibold shrink-0 hidden sm:block", statusColor(c.status))}>{c.status}</span>
                    <span className="w-20 text-right text-[11px] text-[var(--muted)] shrink-0 hidden md:block truncate">{c.contentType.split(";")[0]}</span>
                    <span className="w-16 text-right text-[11px] font-mono text-[var(--muted)] shrink-0 hidden md:block">{c.size > 0 ? formatBytes(c.size) : "-"}</span>
                    <span className="w-14 text-right text-[11px] font-mono text-[var(--muted)] shrink-0 hidden lg:block">{c.timeMs}ms</span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Detail panel */}
          {selected && (
            <Card className="w-80 shrink-0 self-start sticky top-0">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs font-semibold truncate">Request Detail</CardTitle>
                  <button onClick={() => setSelected(null)} className="text-[var(--muted)] hover:text-[var(--foreground)]">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                <div>
                  <p className="font-semibold text-[var(--muted)] uppercase tracking-wider mb-1">General</p>
                  <div className="space-y-1">
                    <div className="flex gap-2"><span className="text-[var(--muted)] shrink-0">Method</span><span className="font-mono">{selected.method}</span></div>
                    <div className="flex gap-2"><span className="text-[var(--muted)] shrink-0">Status</span><span className={cn("font-mono font-semibold", statusColor(selected.status))}>{selected.status}</span></div>
                    <div className="flex gap-2"><span className="text-[var(--muted)] shrink-0">Size</span><span className="font-mono">{selected.size > 0 ? formatBytes(selected.size) : "-"}</span></div>
                    <div className="flex gap-2"><span className="text-[var(--muted)] shrink-0">Time</span><span className="font-mono">{selected.timeMs}ms</span></div>
                  </div>
                </div>
                <div>
                  <p className="font-semibold text-[var(--muted)] uppercase tracking-wider mb-1">URL</p>
                  <p className="font-mono text-[var(--foreground)] break-all">{selected.url}</p>
                </div>
                {Object.keys(selected.requestHeaders).length > 0 && (
                  <div>
                    <p className="font-semibold text-[var(--muted)] uppercase tracking-wider mb-1">Request Headers</p>
                    <div className="rounded-[8px] bg-[var(--surface-2)] border border-[var(--border)] p-2 space-y-1">
                      {Object.entries(selected.requestHeaders).map(([k, v]) => (
                        <div key={k} className="flex gap-2"><span className="text-[var(--muted)] shrink-0 font-semibold">{k}:</span><span className="font-mono text-[var(--foreground)] truncate">{v}</span></div>
                      ))}
                    </div>
                  </div>
                )}
                {selected.requestBody && (
                  <div>
                    <p className="font-semibold text-[var(--muted)] uppercase tracking-wider mb-1">Request Body</p>
                    <pre className="rounded-[8px] bg-[var(--surface-2)] border border-[var(--border)] p-2 font-mono text-[var(--foreground)] overflow-auto max-h-24 whitespace-pre-wrap">{selected.requestBody}</pre>
                  </div>
                )}
                {selected.responseBody && (
                  <div>
                    <p className="font-semibold text-[var(--muted)] uppercase tracking-wider mb-1">Response Body</p>
                    <pre className="rounded-[8px] bg-[var(--surface-2)] border border-[var(--border)] p-2 font-mono text-[var(--foreground)] overflow-auto max-h-24 whitespace-pre-wrap">{selected.responseBody}</pre>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
