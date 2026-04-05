"use client";
import { useState, useCallback } from "react";
import {
  Plus, Search, Download, Upload, GripVertical, MoreHorizontal,
  ChevronDown, ChevronRight, LayoutList, FolderOpen, Globe, ExternalLink,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Topbar } from "@/components/layout/topbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────
type RuleType =
  | "DOMAIN" | "DOMAIN-SUFFIX" | "DOMAIN-KEYWORD" | "DOMAIN-WILDCARD" | "DOMAIN-SET"
  | "IP-CIDR" | "IP-CIDR6" | "GEOIP" | "GEOSITE" | "IP-ASN"
  | "PROCESS-NAME" | "USER-AGENT" | "URL-REGEX"
  | "IN-PORT" | "DEST-PORT" | "SRC-PORT" | "SRC-IP"
  | "DEVICE-NAME" | "PROTOCOL" | "SUBNET" | "HOSTNAME-TYPE" | "FINAL";

interface Rule {
  id: string;
  type: RuleType;
  value: string;
  policy: string;
  matches: number;
  note: string;
}

// ─── Mock data ────────────────────────────────────────────────────────────────
const initialRules: Rule[] = [
  { id: "1",  type: "DOMAIN-SUFFIX",  value: "openai.com",           policy: "OpenAI",  matches: 847,  note: "" },
  { id: "2",  type: "DOMAIN-SUFFIX",  value: "anthropic.com",        policy: "Claude",  matches: 312,  note: "" },
  { id: "3",  type: "GEOIP",          value: "CN",                   policy: "DIRECT",  matches: 2341, note: "China mainland" },
  { id: "4",  type: "DOMAIN-KEYWORD", value: "google",               policy: "Proxy",   matches: 1205, note: "" },
  { id: "5",  type: "IP-CIDR",        value: "192.168.0.0/16",       policy: "DIRECT",  matches: 56,   note: "LAN" },
  { id: "6",  type: "DOMAIN-SUFFIX",  value: "telegram.org",         policy: "Telegram",matches: 423,  note: "" },
  { id: "7",  type: "PROCESS-NAME",   value: "WeChat",               policy: "DIRECT",  matches: 89,   note: "" },
  { id: "8",  type: "DOMAIN-SUFFIX",  value: "youtube.com",          policy: "YouTube", matches: 2890, note: "" },
  { id: "9",  type: "DOMAIN-SUFFIX",  value: "github.com",           policy: "Github",  matches: 677,  note: "" },
  { id: "10", type: "DOMAIN-SUFFIX",  value: "spotify.com",          policy: "Spotify", matches: 203,  note: "" },
  { id: "11", type: "DOMAIN-WILDCARD",value: "*.amazon.com",         policy: "Amazon",  matches: 445,  note: "" },
  { id: "12", type: "GEOSITE",        value: "geolocation-!cn",      policy: "Proxy",   matches: 5678, note: "Non-China" },
  { id: "13", type: "FINAL",          value: "",                     policy: "Proxy",   matches: 234,  note: "Fallback" },
];

const RULE_TYPES: RuleType[] = [
  "DOMAIN", "DOMAIN-SUFFIX", "DOMAIN-KEYWORD", "DOMAIN-WILDCARD", "DOMAIN-SET",
  "IP-CIDR", "IP-CIDR6", "GEOIP", "GEOSITE", "IP-ASN",
  "PROCESS-NAME", "USER-AGENT", "URL-REGEX",
  "IN-PORT", "DEST-PORT", "SRC-PORT", "SRC-IP",
  "DEVICE-NAME", "PROTOCOL", "SUBNET", "HOSTNAME-TYPE", "FINAL",
];

const POLICIES = ["DIRECT", "REJECT", "Proxy", "OpenAI", "Claude", "Telegram",
  "YouTube", "Github", "Spotify", "Amazon", "Google", "Twitter",
  "WeChat", "Speedtest", "PayPal", "Dropbox"];

const BUILTIN_RULE_SETS = [
  "geoip-cn", "geoip-us", "geosite-cn", "geosite-geolocation-!cn",
  "geosite-google", "geosite-youtube", "geosite-telegram",
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getRuleTypeBadgeClass(type: RuleType): string {
  if (type.startsWith("DOMAIN")) return "bg-[var(--brand-100)] text-[var(--brand-700)] dark:bg-[var(--brand-500)]/20 dark:text-[var(--brand-300)]";
  if (type === "IP-CIDR" || type === "IP-CIDR6" || type === "GEOIP" || type === "GEOSITE" || type === "IP-ASN" || type === "SRC-IP" || type === "SUBNET")
    return "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300";
  if (type === "PROCESS-NAME") return "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300";
  if (type === "FINAL") return "bg-[var(--surface-2)] text-[var(--muted)] border border-[var(--border)]";
  return "bg-slate-100 text-slate-600 dark:bg-slate-500/20 dark:text-slate-300";
}

function getPolicyBadgeClass(policy: string): string {
  if (policy === "DIRECT") return "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300";
  if (policy === "REJECT") return "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300";
  if (policy === "Proxy") return "bg-[var(--brand-100)] text-[var(--brand-700)] dark:bg-[var(--brand-500)]/20 dark:text-[var(--brand-300)]";
  return "bg-[var(--surface-2)] text-[var(--foreground)] border border-[var(--border)]";
}

// ─── Sortable Row ─────────────────────────────────────────────────────────────
function SortableRuleRow({
  rule,
  index,
  onEdit,
  onDelete,
}: {
  rule: Rule;
  index: number;
  onEdit: (rule: Rule) => void;
  onDelete: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: rule.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className="group relative"
    >
      {/* Drag handle + index */}
      <td className="w-12 pl-3 pr-1 py-2.5">
        <div className="flex items-center gap-1.5">
          <button
            {...attributes}
            {...listeners}
            className="opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing text-[var(--muted)] hover:text-[var(--foreground)] transition-opacity"
          >
            <GripVertical className="h-3.5 w-3.5" />
          </button>
          <span className="text-xs text-[var(--muted)] font-mono w-5 text-right">{index + 1}</span>
        </div>
      </td>

      {/* Type */}
      <td className="py-2.5 pr-3">
        <span className={cn("inline-flex items-center rounded-[6px] px-2 py-0.5 text-[11px] font-semibold font-mono whitespace-nowrap", getRuleTypeBadgeClass(rule.type))}>
          {rule.type}
        </span>
      </td>

      {/* Value */}
      <td className="py-2.5 pr-3 max-w-[200px]">
        <span className="text-sm font-mono text-[var(--foreground)] truncate block">
          {rule.value || <span className="text-[var(--muted)] italic">—</span>}
        </span>
      </td>

      {/* Policy */}
      <td className="py-2.5 pr-3">
        <span className={cn("inline-flex items-center rounded-[6px] px-2 py-0.5 text-xs font-semibold whitespace-nowrap", getPolicyBadgeClass(rule.policy))}>
          {rule.policy}
        </span>
      </td>

      {/* Matches */}
      <td className="py-2.5 pr-3 text-right">
        <span className="text-xs tabular-nums text-[var(--muted)]">
          {rule.matches.toLocaleString()}
        </span>
      </td>

      {/* Notes */}
      <td className="py-2.5 pr-2 max-w-[140px]">
        <span className="text-xs text-[var(--muted)] truncate block">{rule.note}</span>
      </td>

      {/* Actions */}
      <td className="py-2.5 pr-3 w-10">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className="opacity-0 group-hover:opacity-100 h-6 w-6 text-[var(--muted)]"
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onClick={() => onEdit(rule)}>Edit Rule</DropdownMenuItem>
            <DropdownMenuItem>Duplicate</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600" onClick={() => onDelete(rule.id)}>
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  );
}

// ─── Policy Group Section ─────────────────────────────────────────────────────
function PolicyGroup({
  policy,
  rules,
  onEdit,
  onDelete,
  startIndex,
}: {
  policy: string;
  rules: Rule[];
  onEdit: (r: Rule) => void;
  onDelete: (id: string) => void;
  startIndex: number;
}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      <tr>
        <td colSpan={7} className="pt-3 pb-1 pl-3">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center gap-2 text-xs font-semibold text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
          >
            {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            <span className={cn("inline-flex items-center rounded-[6px] px-2 py-0.5 font-semibold", getPolicyBadgeClass(policy))}>
              {policy}
            </span>
            <span className="text-[var(--muted-foreground)] font-normal">({rules.length})</span>
          </button>
        </td>
      </tr>
      {!collapsed && rules.map((rule, i) => (
        <SortableRuleRow
          key={rule.id}
          rule={rule}
          index={startIndex + i}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </>
  );
}

// ─── Add/Edit Rule Dialog ─────────────────────────────────────────────────────
function RuleDialog({
  open,
  onClose,
  editingRule,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  editingRule?: Rule;
  onSave: (rule: Omit<Rule, "id" | "matches">) => void;
}) {
  const [type, setType] = useState<RuleType>(editingRule?.type ?? "DOMAIN-SUFFIX");
  const [value, setValue] = useState(editingRule?.value ?? "");
  const [policy, setPolicy] = useState(editingRule?.policy ?? "Proxy");
  const [note, setNote] = useState(editingRule?.note ?? "");
  const [sendNotif, setSendNotif] = useState(false);
  const [extendedMatch, setExtendedMatch] = useState(false);
  const [resolveDns, setResolveDns] = useState(false);

  const isDomain = type.startsWith("DOMAIN");
  const isNoValue = type === "FINAL";

  function handleSave() {
    onSave({ type, value, policy, note });
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{editingRule ? "Edit Rule" : "New Rule"}</DialogTitle>
          <DialogDescription>Configure the rule type, value, and target policy.</DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-2 space-y-4">
          {/* Type */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--muted)]">Rule Type</label>
            <Select value={type} onValueChange={(v) => setType(v as RuleType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RULE_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Value */}
          {!isNoValue && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[var(--muted)]">Value</label>
              <Input
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={
                  type === "IP-CIDR" ? "e.g. 103.0.0.0/8"
                  : type === "GEOIP" ? "e.g. CN"
                  : type === "PROCESS-NAME" ? "e.g. chrome"
                  : "e.g. api.openai.com"
                }
                className="font-mono"
              />
            </div>
          )}

          {/* Policy */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--muted)]">Policy</label>
            <Select value={policy} onValueChange={setPolicy}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {POLICIES.map((p) => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Note */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--muted)]">Notes (optional)</label>
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Optional description"
            />
          </div>

          {/* Options */}
          <div className="rounded-[12px] border border-[var(--border)] bg-[var(--surface-2)] divide-y divide-[var(--border)]">
            <label className="flex items-center justify-between px-3 py-2.5 cursor-pointer">
              <span className="text-sm text-[var(--foreground)]">Send Notification</span>
              <Switch checked={sendNotif} onCheckedChange={setSendNotif} />
            </label>
            <label className="flex items-center justify-between px-3 py-2.5 cursor-pointer">
              <span className="text-sm text-[var(--foreground)]">Extended Matching</span>
              <Switch checked={extendedMatch} onCheckedChange={setExtendedMatch} />
            </label>
            {isDomain && (
              <label className="flex items-center justify-between px-3 py-2.5 cursor-pointer">
                <span className="text-sm text-[var(--foreground)]">Resolve DNS</span>
                <Switch checked={resolveDns} onCheckedChange={setResolveDns} />
              </label>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={!isNoValue && !value.trim()}>
            {editingRule ? "Save Changes" : "Add Rule"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Rule Set Dialog ───────────────────────────────────────────────────────────
function RuleSetDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [name, setName] = useState("");
  const [sourceType, setSourceType] = useState<"builtin" | "external">("builtin");
  const [builtinSet, setBuiltinSet] = useState(BUILTIN_RULE_SETS[0]);
  const [policy, setPolicy] = useState("Proxy");
  const [url, setUrl] = useState("");
  const [interval, setIntervalVal] = useState("86400");
  const [testing, setTesting] = useState(false);

  function handleTest() {
    setTesting(true);
    setTimeout(() => setTesting(false), 1500);
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-[480px]">
        <DialogHeader>
          <DialogTitle>New Rule Set</DialogTitle>
          <DialogDescription>Add a built-in or external rule set provider.</DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-2 space-y-4">
          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--muted)]">Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. my-cn-rules" />
          </div>

          {/* Source type toggle */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--muted)]">Source</label>
            <div className="flex gap-1.5 rounded-[10px] bg-[var(--surface-2)] p-0.5 border border-[var(--border)]">
              {(["builtin", "external"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setSourceType(t)}
                  className={cn(
                    "flex-1 rounded-[8px] py-1.5 text-xs font-semibold transition-all capitalize",
                    sourceType === t
                      ? "bg-[var(--brand-500)] text-white shadow-sm"
                      : "text-[var(--muted)] hover:text-[var(--foreground)]"
                  )}
                >
                  {t === "builtin" ? "Built-in" : "External URL"}
                </button>
              ))}
            </div>
          </div>

          {/* Built-in select */}
          {sourceType === "builtin" && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[var(--muted)]">Built-in Set</label>
              <Select value={builtinSet} onValueChange={setBuiltinSet}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BUILTIN_RULE_SETS.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* External URL */}
          {sourceType === "external" && (
            <>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[var(--muted)]">Subscription URL</label>
                <div className="flex gap-2">
                  <Input
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://example.com/rules.yaml"
                    className="flex-1 font-mono text-xs"
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleTest}
                    disabled={!url || testing}
                    className="shrink-0 gap-1.5"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    {testing ? "Testing…" : "Test"}
                  </Button>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[var(--muted)]">Update Interval (seconds)</label>
                <Input
                  type="number"
                  value={interval}
                  onChange={(e) => setIntervalVal(e.target.value)}
                />
              </div>
            </>
          )}

          {/* Policy */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--muted)]">Policy</label>
            <Select value={policy} onValueChange={setPolicy}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {POLICIES.map((p) => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={onClose} disabled={!name.trim() || (sourceType === "external" && !url.trim())}>
            Add Rule Set
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function RulesPage() {
  const [rules, setRules] = useState<Rule[]>(initialRules);
  const [search, setSearch] = useState("");
  const [groupByPolicy, setGroupByPolicy] = useState(false);
  const [showAddRule, setShowAddRule] = useState(false);
  const [showAddRuleSet, setShowAddRuleSet] = useState(false);
  const [editingRule, setEditingRule] = useState<Rule | undefined>();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const filtered = rules.filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      r.type.toLowerCase().includes(q) ||
      r.value.toLowerCase().includes(q) ||
      r.policy.toLowerCase().includes(q) ||
      r.note.toLowerCase().includes(q)
    );
  });

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setRules((prev) => {
        const oldIdx = prev.findIndex((r) => r.id === active.id);
        const newIdx = prev.findIndex((r) => r.id === over.id);
        return arrayMove(prev, oldIdx, newIdx);
      });
    }
  }

  function handleDelete(id: string) {
    setRules((prev) => prev.filter((r) => r.id !== id));
  }

  function handleSaveRule(data: Omit<Rule, "id" | "matches">) {
    if (editingRule) {
      setRules((prev) => prev.map((r) => r.id === editingRule.id ? { ...r, ...data } : r));
      setEditingRule(undefined);
    } else {
      const newRule: Rule = {
        id: String(Date.now()),
        matches: 0,
        ...data,
      };
      setRules((prev) => [newRule, ...prev]);
    }
  }

  // Group by policy
  const grouped = filtered.reduce<Record<string, Rule[]>>((acc, rule) => {
    if (!acc[rule.policy]) acc[rule.policy] = [];
    acc[rule.policy].push(rule);
    return acc;
  }, {});

  return (
    <div className="flex flex-col h-full">
      <Topbar title="Rules" description={`${rules.length} rules configured`}>
        <Button variant="ghost" size="sm" className="gap-1.5 text-[var(--muted)]">
          <Upload className="h-3.5 w-3.5" />
          Import
        </Button>
        <Button variant="ghost" size="sm" className="gap-1.5 text-[var(--muted)]">
          <Download className="h-3.5 w-3.5" />
          Export
        </Button>
        <Button variant="secondary" size="sm" onClick={() => setShowAddRuleSet(true)} className="gap-1.5">
          <Globe className="h-3.5 w-3.5" />
          Add Rule Set
        </Button>
        <Button size="sm" onClick={() => setShowAddRule(true)} className="gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          Add Rule
        </Button>
      </Topbar>

      <div className="flex-1 p-6 overflow-auto">
        {/* Filter bar */}
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--muted)]" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search rules…"
              className="pl-8 h-8 text-xs"
            />
          </div>

          {/* Group toggle */}
          <button
            onClick={() => setGroupByPolicy(!groupByPolicy)}
            className={cn(
              "flex items-center gap-1.5 rounded-[8px] px-3 h-8 text-xs font-semibold border transition-all",
              groupByPolicy
                ? "bg-[var(--brand-500)] text-white border-[var(--brand-500)]"
                : "bg-[var(--surface-2)] text-[var(--muted)] border-[var(--border)] hover:text-[var(--foreground)]"
            )}
          >
            {groupByPolicy ? <FolderOpen className="h-3.5 w-3.5" /> : <LayoutList className="h-3.5 w-3.5" />}
            {groupByPolicy ? "By Policy" : "Flat List"}
          </button>

          <span className="text-xs text-[var(--muted)] ml-auto">
            {filtered.length} / {rules.length} rules
          </span>
        </div>

        {/* Table */}
        <div className="rounded-[16px] border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <table className="w-full text-sm">
              {/* Sticky header */}
              <thead className="sticky top-0 z-10 bg-[var(--surface-2)] border-b border-[var(--border)]">
                <tr>
                  <th className="pl-3 pr-1 py-2.5 w-12" />
                  <th className="py-2.5 pr-3 text-left text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Type</th>
                  <th className="py-2.5 pr-3 text-left text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Value</th>
                  <th className="py-2.5 pr-3 text-left text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Policy</th>
                  <th className="py-2.5 pr-3 text-right text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Matches</th>
                  <th className="py-2.5 pr-2 text-left text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Notes</th>
                  <th className="py-2.5 pr-3 w-10" />
                </tr>
              </thead>

              <SortableContext items={filtered.map((r) => r.id)} strategy={verticalListSortingStrategy}>
                <tbody className="divide-y divide-[var(--border)]">
                  {groupByPolicy ? (
                    Object.entries(grouped).map(([policy, groupRules]) => {
                      // Calculate start index in filtered list
                      const startIdx = filtered.indexOf(groupRules[0]);
                      return (
                        <PolicyGroup
                          key={policy}
                          policy={policy}
                          rules={groupRules}
                          onEdit={(r) => { setEditingRule(r); setShowAddRule(true); }}
                          onDelete={handleDelete}
                          startIndex={startIdx}
                        />
                      );
                    })
                  ) : (
                    filtered.map((rule, i) => (
                      <SortableRuleRow
                        key={rule.id}
                        rule={rule}
                        index={i}
                        onEdit={(r) => { setEditingRule(r); setShowAddRule(true); }}
                        onDelete={handleDelete}
                      />
                    ))
                  )}

                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-sm text-[var(--muted)]">
                        No rules match your search
                      </td>
                    </tr>
                  )}
                </tbody>
              </SortableContext>
            </table>
          </DndContext>
        </div>
      </div>

      {/* Dialogs */}
      <RuleDialog
        open={showAddRule}
        onClose={() => { setShowAddRule(false); setEditingRule(undefined); }}
        editingRule={editingRule}
        onSave={handleSaveRule}
      />
      <RuleSetDialog open={showAddRuleSet} onClose={() => setShowAddRuleSet(false)} />
    </div>
  );
}
