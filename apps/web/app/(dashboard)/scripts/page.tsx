"use client";
import { useState } from "react";
import { Plus, Play, Trash2, ChevronDown, ChevronUp, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Topbar } from "@/components/layout/topbar";
import { cn } from "@/lib/utils";

type ScriptType = "http-request" | "http-response" | "cron" | "event" | "dns" | "rule";

interface Script {
  id: string;
  name: string;
  type: ScriptType;
  enabled: boolean;
  lastRun: string;
  cronExpr?: string;
  eventType?: string;
  code: string;
}

const scripts: Script[] = [
  { id: "1", name: "Rewrite Reddit", type: "http-request", enabled: true, lastRun: "2m ago", code: `// Rewrite Reddit requests\n$done({ response: { status: 200, headers: { 'X-Rewrite': 'mihomo' } } });` },
  { id: "2", name: "Block Ads Header", type: "http-response", enabled: true, lastRun: "5m ago", code: `// Remove ad-related response headers\ndelete $response.headers['x-ad-tracking'];\n$done($response);` },
  { id: "3", name: "Auto Unlock", type: "cron", enabled: false, lastRun: "1h ago", cronExpr: "0 * * * *", code: `// Auto-unlock check every hour\nconsole.log('Checking unlock status...');` },
  { id: "4", name: "IP Check", type: "event", enabled: true, lastRun: "Just now", eventType: "network-changed", code: `// Triggered on network change\nconst ip = await fetch('https://api.ipify.org?format=json');\nconsole.log('New IP:', ip);` },
];

const typeColors: Record<ScriptType, string> = {
  "http-request": "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
  "http-response": "bg-blue-50 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300",
  "cron": "bg-amber-50 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
  "event": "bg-sky-50 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300",
  "dns": "bg-[var(--brand-100)] text-[var(--brand-600)] dark:bg-[var(--brand-500)]/20 dark:text-[var(--brand-300)]",
  "rule": "bg-[var(--surface-2)] text-[var(--muted)] border border-[var(--border)]",
};

const logLines = [
  "[14:22:01] Rewrite Reddit — executed (GET https://www.reddit.com/r/programming/) → 200",
  "[14:22:00] Block Ads Header — removed 3 tracking headers from api.doubleclick.net",
  "[14:21:55] IP Check — network-changed event fired, new IP: 104.21.xx.xx",
  "[14:21:30] Rewrite Reddit — executed (GET https://www.reddit.com/) → 200",
  "[14:20:00] Auto Unlock — skipped (disabled)",
];

export default function ScriptsPage() {
  const [scriptList, setScriptList] = useState<Script[]>(scripts);
  const [showLogs, setShowLogs] = useState(false);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [editingScript, setEditingScript] = useState<Script | null>(null);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<ScriptType>("http-request");
  const [newCode, setNewCode] = useState("// Your script here\n$done({});");
  const [newCron, setNewCron] = useState("0 * * * *");
  const [newEvent, setNewEvent] = useState("network-changed");

  const toggleScript = (id: string) => {
    setScriptList((prev) => prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s)));
  };

  const deleteScript = (id: string) => {
    setScriptList((prev) => prev.filter((s) => s.id !== id));
  };

  const handleCreate = () => {
    if (!newName.trim()) return;
    const script: Script = {
      id: Date.now().toString(),
      name: newName.trim(),
      type: newType,
      enabled: true,
      lastRun: "Never",
      code: newCode,
      ...(newType === "cron" ? { cronExpr: newCron } : {}),
      ...(newType === "event" ? { eventType: newEvent } : {}),
    };
    setScriptList((prev) => [...prev, script]);
    setShowNewDialog(false);
    setNewName("");
    setNewCode("// Your script here\n$done({});");
  };

  return (
    <div className="flex flex-col h-full">
      <Topbar title="Scripts" description="Scripted rule management">
        <Button size="sm" onClick={() => setShowNewDialog(true)} className="gap-1.5 text-xs bg-[var(--brand-500)] hover:bg-[var(--brand-600)] text-white">
          <Plus className="h-3.5 w-3.5" />
          New Script
        </Button>
      </Topbar>

      <div className="flex-1 p-6 overflow-auto space-y-5 flex flex-col">
        {/* Script table */}
        <Card className="flex-1">
          <div className="px-4 py-2.5 border-b border-[var(--border)] grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 items-center">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">Name</span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)] w-28">Type</span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)] w-20 hidden sm:block">Last Run</span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)] w-12">Active</span>
            <span className="w-16" />
          </div>
          <CardContent className="pt-2 pb-2 px-2 space-y-0.5">
            {scriptList.map((script) => (
              <div
                key={script.id}
                className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 items-center rounded-[10px] px-2 py-2.5 hover:bg-[var(--surface-2)] transition-colors cursor-pointer group"
                onClick={() => setEditingScript(script)}
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[var(--foreground)] truncate">{script.name}</p>
                  {script.cronExpr && <p className="text-[11px] text-[var(--muted)] font-mono">{script.cronExpr}</p>}
                  {script.eventType && <p className="text-[11px] text-[var(--muted)]">on: {script.eventType}</p>}
                </div>
                <div className="w-28">
                  <span className={cn("text-[11px] font-semibold rounded-[6px] px-2 py-0.5", typeColors[script.type])}>{script.type}</span>
                </div>
                <div className="w-20 hidden sm:block">
                  <span className="text-xs text-[var(--muted)]">{script.lastRun}</span>
                </div>
                <div className="w-12" onClick={(e) => e.stopPropagation()}>
                  <Switch checked={script.enabled} onCheckedChange={() => toggleScript(script.id)} />
                </div>
                <div className="w-16 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="icon-sm" className="text-[var(--muted)] hover:text-[var(--brand-500)]">
                    <Play className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon-sm" className="text-[var(--muted)] hover:text-red-500" onClick={() => deleteScript(script.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Log panel */}
        <Card>
          <button
            className="flex items-center justify-between w-full px-5 py-3"
            onClick={() => setShowLogs((v) => !v)}
          >
            <span className="text-sm font-semibold text-[var(--foreground)]">Log Output</span>
            {showLogs ? <ChevronUp className="h-4 w-4 text-[var(--muted)]" /> : <ChevronDown className="h-4 w-4 text-[var(--muted)]" />}
          </button>
          {showLogs && (
            <div className="px-4 pb-4">
              <div className="rounded-[10px] bg-[var(--surface-2)] border border-[var(--border)] p-3 font-mono text-[11px] text-[var(--muted)] space-y-1 max-h-40 overflow-auto">
                {logLines.map((line, i) => <p key={i}>{line}</p>)}
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* New/Edit Script Dialog */}
      <Dialog open={showNewDialog || editingScript !== null} onOpenChange={(open) => { if (!open) { setShowNewDialog(false); setEditingScript(null); } }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingScript ? `Edit: ${editingScript.name}` : "New Script"}</DialogTitle>
          </DialogHeader>
          <div className="px-6 pb-2 space-y-4">
            {!editingScript && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[var(--foreground)]">Name</label>
                  <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="My Script" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[var(--foreground)]">Type</label>
                  <Select value={newType} onValueChange={(v) => setNewType(v as ScriptType)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="http-request">http-request</SelectItem>
                      <SelectItem value="http-response">http-response</SelectItem>
                      <SelectItem value="cron">cron</SelectItem>
                      <SelectItem value="event">event</SelectItem>
                      <SelectItem value="dns">dns</SelectItem>
                      <SelectItem value="rule">rule</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            {!editingScript && newType === "cron" && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[var(--foreground)]">Cron Expression</label>
                <Input value={newCron} onChange={(e) => setNewCron(e.target.value)} className="font-mono" placeholder="0 * * * *" />
              </div>
            )}
            {!editingScript && newType === "event" && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[var(--foreground)]">Event Type</label>
                <Input value={newEvent} onChange={(e) => setNewEvent(e.target.value)} placeholder="network-changed" />
              </div>
            )}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[var(--foreground)]">Script Code</label>
              <p className="text-xs text-[var(--muted)]">JavaScript — use $done() to complete, $request/$response for HTTP scripts</p>
              <textarea
                value={editingScript ? editingScript.code : newCode}
                onChange={(e) => editingScript ? setEditingScript({ ...editingScript, code: e.target.value }) : setNewCode(e.target.value)}
                rows={10}
                className="w-full rounded-[10px] border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm font-mono text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-500)] resize-none"
                spellCheck={false}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowNewDialog(false); setEditingScript(null); }}>Cancel</Button>
            <Button onClick={editingScript ? () => { setScriptList((prev) => prev.map((s) => s.id === editingScript.id ? editingScript : s)); setEditingScript(null); } : handleCreate} className="bg-[var(--brand-500)] hover:bg-[var(--brand-600)] text-white">
              {editingScript ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
