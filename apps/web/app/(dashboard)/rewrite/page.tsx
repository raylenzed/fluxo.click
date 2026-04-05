"use client";
import { useState } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Plus, Download, Upload, GripVertical, Trash2, Pen, Play, Check, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Topbar } from "@/components/layout/topbar";
import { cn } from "@/lib/utils";

type RuleType = "header-modify" | "302" | "reject" | "reject-200" | "302-js";

interface RewriteRule {
  id: string;
  pattern: string;
  type: RuleType;
  value: string;
  enabled: boolean;
}

const initialRules: RewriteRule[] = [
  { id: "1", pattern: "^https://www\\.google\\.cn(.*)", type: "header-modify", value: "add header X-Country: CN", enabled: true },
  { id: "2", pattern: "^https://.*\\.doubleclick\\.net", type: "reject", value: "", enabled: true },
  { id: "3", pattern: "^http://(.*)", type: "302", value: "https://$1", enabled: true },
  { id: "4", pattern: "^https://www\\.youtube\\.com/get_video_info", type: "reject-200", value: "", enabled: false },
];

const typeColors: Record<RuleType, string> = {
  "header-modify": "bg-[var(--brand-100)] text-[var(--brand-600)] dark:bg-[var(--brand-500)]/20 dark:text-[var(--brand-300)]",
  "302": "bg-amber-50 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
  "reject": "bg-red-50 text-red-700 dark:bg-red-500/20 dark:text-red-300",
  "reject-200": "bg-orange-50 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300",
  "302-js": "bg-sky-50 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300",
};

function SortableRow({
  rule,
  index,
  onToggle,
  onDelete,
  onEdit,
}: {
  rule: RewriteRule;
  index: number;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (rule: RewriteRule) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: rule.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 rounded-[10px] px-2 py-2.5 transition-colors group",
        isDragging ? "bg-[var(--surface-2)] shadow-lg opacity-90 z-10" : "hover:bg-[var(--surface-2)]",
        !rule.enabled && "opacity-50"
      )}
    >
      <button {...attributes} {...listeners} className="text-[var(--muted)] hover:text-[var(--foreground)] cursor-grab active:cursor-grabbing shrink-0 touch-none">
        <GripVertical className="h-4 w-4" />
      </button>
      <span className="text-xs text-[var(--muted)] w-5 shrink-0 font-mono">{index + 1}</span>
      <code className="flex-1 min-w-0 text-xs font-mono text-[var(--foreground)] truncate">{rule.pattern}</code>
      <span className={cn("hidden sm:block text-[11px] font-semibold rounded-[6px] px-2 py-0.5 shrink-0", typeColors[rule.type])}>{rule.type}</span>
      <code className="hidden md:block flex-1 min-w-0 text-[11px] font-mono text-[var(--muted)] truncate max-w-[180px]">{rule.value || "—"}</code>
      <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
        <Switch checked={rule.enabled} onCheckedChange={() => onToggle(rule.id)} />
        <Button variant="ghost" size="icon-sm" className="opacity-0 group-hover:opacity-100 text-[var(--muted)] hover:text-[var(--brand-500)] transition-opacity" onClick={() => onEdit(rule)}>
          <Pen className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon-sm" className="opacity-0 group-hover:opacity-100 text-[var(--muted)] hover:text-red-500 transition-opacity" onClick={() => onDelete(rule.id)}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

export default function RewritePage() {
  const [rules, setRules] = useState<RewriteRule[]>(initialRules);
  const [showDialog, setShowDialog] = useState(false);
  const [editingRule, setEditingRule] = useState<RewriteRule | null>(null);
  const [form, setForm] = useState<Omit<RewriteRule, "id">>({ pattern: "", type: "302", value: "", enabled: true });
  const [testUrl, setTestUrl] = useState("");
  const [testResult, setTestResult] = useState<{ matched: RewriteRule; description: string } | null>(null);
  const [testNoMatch, setTestNoMatch] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setRules((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const toggleRule = (id: string) => setRules((prev) => prev.map((r) => r.id === id ? { ...r, enabled: !r.enabled } : r));
  const deleteRule = (id: string) => setRules((prev) => prev.filter((r) => r.id !== id));

  const openNew = () => {
    setEditingRule(null);
    setForm({ pattern: "", type: "302", value: "", enabled: true });
    setShowDialog(true);
  };

  const openEdit = (rule: RewriteRule) => {
    setEditingRule(rule);
    setForm({ pattern: rule.pattern, type: rule.type, value: rule.value, enabled: rule.enabled });
    setShowDialog(true);
  };

  const saveRule = () => {
    if (!form.pattern.trim()) return;
    if (editingRule) {
      setRules((prev) => prev.map((r) => r.id === editingRule.id ? { ...r, ...form } : r));
    } else {
      setRules((prev) => [...prev, { id: Date.now().toString(), ...form }]);
    }
    setShowDialog(false);
  };

  const testMatch = () => {
    if (!testUrl.trim()) return;
    const match = rules.find((r) => {
      try { return new RegExp(r.pattern).test(testUrl); } catch { return false; }
    });
    if (match) {
      const desc = match.type === "reject" ? `Rejected by rule #${rules.indexOf(match) + 1}`
        : match.type === "302" ? `Redirected → ${testUrl.replace(new RegExp(match.pattern), match.value)}`
        : `Header modified: ${match.value}`;
      setTestResult({ matched: match, description: desc });
      setTestNoMatch(false);
    } else {
      setTestResult(null);
      setTestNoMatch(true);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <Topbar title="Rewrite" description="URL rewrite rules">
        <Button variant="outline" size="sm" className="gap-1.5 text-xs">
          <Upload className="h-3.5 w-3.5" />
          Import
        </Button>
        <Button variant="outline" size="sm" className="gap-1.5 text-xs">
          <Download className="h-3.5 w-3.5" />
          Export
        </Button>
        <Button size="sm" onClick={openNew} className="gap-1.5 text-xs bg-[var(--brand-500)] hover:bg-[var(--brand-600)] text-white">
          <Plus className="h-3.5 w-3.5" />
          Add Rule
        </Button>
      </Topbar>

      <div className="flex-1 p-6 overflow-auto space-y-5">
        {/* Rule table */}
        <Card>
          <div className="px-3 py-2.5 border-b border-[var(--border)] flex items-center gap-3">
            <span className="w-4 shrink-0" />
            <span className="w-5 shrink-0 text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">#</span>
            <span className="flex-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">Pattern</span>
            <span className="hidden sm:block w-28 text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)] shrink-0">Type</span>
            <span className="hidden md:block w-48 text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)] shrink-0">Value</span>
            <span className="w-24 shrink-0" />
          </div>
          <CardContent className="pt-2 pb-2 px-2">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={rules.map((r) => r.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-0.5">
                  {rules.map((rule, i) => (
                    <SortableRow
                      key={rule.id}
                      rule={rule}
                      index={i}
                      onToggle={toggleRule}
                      onDelete={deleteRule}
                      onEdit={openEdit}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
            {rules.length === 0 && (
              <p className="text-center text-sm text-[var(--muted)] py-8">No rewrite rules. Click "Add Rule" to get started.</p>
            )}
          </CardContent>
        </Card>

        {/* Rule testing */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Rule Testing</CardTitle>
            <p className="text-xs text-[var(--muted)]">Enter a URL to see which rule matches</p>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input
                value={testUrl}
                onChange={(e) => { setTestUrl(e.target.value); setTestResult(null); setTestNoMatch(false); }}
                onKeyDown={(e) => e.key === "Enter" && testMatch()}
                placeholder="https://www.example.com/path?query=1"
                className="flex-1 font-mono text-sm"
              />
              <Button onClick={testMatch} size="sm" variant="outline" className="gap-1.5 shrink-0">
                <Play className="h-3.5 w-3.5" />
                Test
              </Button>
            </div>
            {testResult && (
              <div className="rounded-[10px] bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 px-4 py-3 flex items-start gap-3">
                <Check className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                <div className="text-sm">
                  <p className="font-semibold text-emerald-700 dark:text-emerald-300">Matched rule #{rules.indexOf(testResult.matched) + 1}</p>
                  <p className="text-emerald-600 dark:text-emerald-400 text-xs mt-0.5">{testResult.description}</p>
                  <p className="text-emerald-600 dark:text-emerald-400 text-xs font-mono mt-1">{testResult.matched.pattern}</p>
                </div>
              </div>
            )}
            {testNoMatch && (
              <div className="rounded-[10px] bg-[var(--surface-2)] border border-[var(--border)] px-4 py-3 flex items-start gap-3">
                <X className="h-4 w-4 text-[var(--muted)] mt-0.5 shrink-0" />
                <p className="text-sm text-[var(--muted)]">No rules matched this URL.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingRule ? "Edit Rule" : "New Rewrite Rule"}</DialogTitle>
          </DialogHeader>
          <div className="px-6 pb-2 space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[var(--foreground)]">Pattern (Regex)</label>
              <Input
                value={form.pattern}
                onChange={(e) => setForm((f) => ({ ...f, pattern: e.target.value }))}
                placeholder="^https://www\.example\.com(.*)"
                className="font-mono"
              />
              <p className="text-xs text-[var(--muted)]">Use standard JavaScript regex syntax. Capture groups available via $1, $2…</p>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[var(--foreground)]">Type</label>
              <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v as RuleType }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="302">302 Redirect</SelectItem>
                  <SelectItem value="reject">Reject</SelectItem>
                  <SelectItem value="reject-200">Reject (200)</SelectItem>
                  <SelectItem value="header-modify">Header Modify</SelectItem>
                  <SelectItem value="302-js">302 (JS)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(form.type === "302" || form.type === "302-js" || form.type === "header-modify") && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[var(--foreground)]">
                  {form.type === "header-modify" ? "Header Action" : "Redirect URL"}
                </label>
                <Input
                  value={form.value}
                  onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
                  placeholder={form.type === "header-modify" ? "add header X-Custom: value" : "https://$1"}
                  className="font-mono"
                />
              </div>
            )}
            <div className="flex items-center gap-2">
              <Switch checked={form.enabled} onCheckedChange={(v) => setForm((f) => ({ ...f, enabled: v }))} />
              <label className="text-sm text-[var(--muted)]">Enabled</label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={saveRule} className="bg-[var(--brand-500)] hover:bg-[var(--brand-600)] text-white">
              {editingRule ? "Save" : "Add Rule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
