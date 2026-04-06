"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, ExternalLink, Filter, Layers, Loader2 } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useLocale } from "@/lib/i18n/context";
import { proxiesApi, groupsApi, type ProxyRow, type GroupRow } from "@/lib/api";
import { cn } from "@/lib/utils";

interface ProxyGroupDialogProps {
  open: boolean;
  onClose: () => void;
  onSave?: (data: Record<string, unknown>) => void;
  groupName?: string;
}

export function ProxyGroupDialog({ open, onClose, onSave, groupName }: ProxyGroupDialogProps) {
  const { t } = useLocale();
  const gT = t.proxyGroup;

  const [name, setName] = useState(groupName ?? "");
  const [type, setType] = useState("select");
  const [selected, setSelected] = useState<string[]>([]);
  const [useExternal, setUseExternal] = useState(false);
  const [externalUrl, setExternalUrl] = useState("");
  const [externalInterval, setExternalInterval] = useState("86400");
  const [useAllProxies, setUseAllProxies] = useState(false);
  const [filterRegex, setFilterRegex] = useState("");
  const [url, setUrl] = useState("https://www.google.com/generate_204");
  const [interval, setInterval] = useState("300");

  // Fetch real proxies and groups from API
  const { data: proxies = [], isLoading: loadingProxies } = useQuery({
    queryKey: ["proxies"],
    queryFn: () => proxiesApi.list(),
    enabled: open,
    staleTime: 30_000,
  });

  const { data: groups = [], isLoading: loadingGroups } = useQuery({
    queryKey: ["groups"],
    queryFn: () => groupsApi.list(),
    enabled: open,
    staleTime: 30_000,
  });

  const isLoading = loadingProxies || loadingGroups;

  // Build member list: DIRECT, REJECT + real proxies + other groups (excluding current)
  const builtins = [
    { name: "DIRECT", type: "builtin" },
    { name: "REJECT", type: "builtin" },
  ];
  const proxyMembers = proxies.map((p: ProxyRow) => ({ name: p.name, type: p.type }));
  const groupMembers = groups
    .filter((g: GroupRow) => g.name !== groupName)
    .map((g: GroupRow) => ({ name: g.name, type: "group" }));

  const allMembers = [...builtins, ...proxyMembers, ...groupMembers];

  const toggleProxy = (proxyName: string) => {
    setSelected((prev) =>
      prev.includes(proxyName) ? prev.filter((p) => p !== proxyName) : [...prev, proxyName]
    );
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-[560px]">
        <DialogHeader>
          <DialogTitle>{groupName ? gT.titleEdit.replace("{name}", groupName) : gT.titleNew}</DialogTitle>
          <DialogDescription>{gT.description}</DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-2 space-y-4">
          {/* Name + Type */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[var(--muted)]">{gT.groupName}</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={gT.groupNamePlaceholder} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[var(--muted)]">{gT.type}</label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="select">{gT.typeManual}</SelectItem>
                  <SelectItem value="url-test">{gT.typeAuto}</SelectItem>
                  <SelectItem value="fallback">{gT.typeFallback}</SelectItem>
                  <SelectItem value="load-balance">{gT.typeLoadBalance}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="members">
            <TabsList className="w-full">
              <TabsTrigger value="members" className="flex-1 gap-1.5">
                <Check className="h-3.5 w-3.5" />{gT.tabMembers}
              </TabsTrigger>
              <TabsTrigger value="external" className="flex-1 gap-1.5">
                <ExternalLink className="h-3.5 w-3.5" />{gT.tabExternal}
              </TabsTrigger>
              <TabsTrigger value="filter" className="flex-1 gap-1.5">
                <Filter className="h-3.5 w-3.5" />{gT.tabFilter}
              </TabsTrigger>
              <TabsTrigger value="options" className="flex-1 gap-1.5">
                <Layers className="h-3.5 w-3.5" />{gT.tabOptions}
              </TabsTrigger>
            </TabsList>

            {/* Members tab */}
            <TabsContent value="members" className="mt-3">
              {isLoading ? (
                <div className="flex items-center justify-center py-8 gap-2 text-sm text-[var(--muted)]">
                  <Loader2 className="h-4 w-4 animate-spin" />{gT.loadingProxies}
                </div>
              ) : allMembers.length === 2 /* only builtins */ && proxies.length === 0 ? (
                <div className="space-y-1 max-h-[200px] overflow-y-auto pr-1">
                  {builtins.map((proxy) => (
                    <button key={proxy.name} onClick={() => toggleProxy(proxy.name)}
                      className={cn("w-full flex items-center gap-3 rounded-[10px] px-3 py-2 text-sm transition-all duration-150",
                        selected.includes(proxy.name) ? "bg-[var(--brand-50)] dark:bg-[var(--brand-500)]/15" : "hover:bg-[var(--surface-2)]"
                      )}>
                      <div className={cn("h-4 w-4 rounded-[4px] border flex items-center justify-center transition-all",
                        selected.includes(proxy.name) ? "bg-[var(--brand-500)] border-[var(--brand-500)]" : "border-[var(--border)] bg-[var(--surface-2)]"
                      )}>
                        {selected.includes(proxy.name) && <Check className="h-2.5 w-2.5 text-white" />}
                      </div>
                      <span className="text-xs text-[var(--muted-foreground)] bg-[var(--surface-2)] rounded px-1.5 py-0.5 font-mono uppercase">{proxy.type}</span>
                      <span className="flex-1 text-left font-medium text-[var(--foreground)]">{proxy.name}</span>
                    </button>
                  ))}
                  <p className="text-xs text-[var(--muted)] text-center py-2">{gT.noProxies}</p>
                </div>
              ) : (
                <div className="space-y-1 max-h-[200px] overflow-y-auto pr-1">
                  {allMembers.map((proxy) => (
                    <button key={proxy.name} onClick={() => toggleProxy(proxy.name)}
                      className={cn("w-full flex items-center gap-3 rounded-[10px] px-3 py-2 text-sm transition-all duration-150",
                        selected.includes(proxy.name) ? "bg-[var(--brand-50)] dark:bg-[var(--brand-500)]/15" : "hover:bg-[var(--surface-2)]"
                      )}>
                      <div className={cn("h-4 w-4 rounded-[4px] border flex items-center justify-center transition-all",
                        selected.includes(proxy.name) ? "bg-[var(--brand-500)] border-[var(--brand-500)]" : "border-[var(--border)] bg-[var(--surface-2)]"
                      )}>
                        {selected.includes(proxy.name) && <Check className="h-2.5 w-2.5 text-white" />}
                      </div>
                      <span className="text-xs text-[var(--muted-foreground)] bg-[var(--surface-2)] rounded px-1.5 py-0.5 font-mono uppercase">{proxy.type}</span>
                      <span className="flex-1 text-left font-medium text-[var(--foreground)]">{proxy.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* External provider tab */}
            <TabsContent value="external" className="mt-3 space-y-3">
              <div className="flex items-center justify-between rounded-[12px] bg-[var(--surface-2)] px-3 py-2.5 border border-[var(--border)]">
                <div>
                  <p className="text-sm font-medium text-[var(--foreground)]">{gT.includeExternal}</p>
                  <p className="text-xs text-[var(--muted)]">{gT.includeExternalDesc}</p>
                </div>
                <Switch checked={useExternal} onCheckedChange={setUseExternal} />
              </div>
              {useExternal && (
                <div className="space-y-3 pl-1">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[var(--muted)]">{gT.subscriptionUrl}</label>
                    <Input value={externalUrl} onChange={(e) => setExternalUrl(e.target.value)} placeholder="https://example.com/sub.yaml" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[var(--muted)]">{gT.autoUpdateInterval}</label>
                    <Input type="number" value={externalInterval} onChange={(e) => setExternalInterval(e.target.value)} />
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Filter tab */}
            <TabsContent value="filter" className="mt-3 space-y-3">
              <div className="rounded-[12px] bg-[var(--surface-2)] px-3 py-2.5 border border-[var(--border)]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[var(--foreground)]">{gT.includeAllProxies}</p>
                    <p className="text-xs text-[var(--muted)]">{gT.includeAllProxiesDesc}</p>
                  </div>
                  <Switch checked={useAllProxies} onCheckedChange={setUseAllProxies} />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[var(--muted)]">{gT.filterRegex}</label>
                <Input value={filterRegex} onChange={(e) => setFilterRegex(e.target.value)} placeholder='e.g. ^(?=.*(US|美国)).*$' className="font-mono text-xs" />
                <p className="text-[11px] text-[var(--muted-foreground)]">{gT.filterRegexDesc}</p>
              </div>
            </TabsContent>

            {/* Options tab */}
            <TabsContent value="options" className="mt-3 space-y-3">
              {(type === "url-test" || type === "fallback") && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[var(--muted)]">{t.proxyNode.testUrl}</label>
                    <Input value={url} onChange={(e) => setUrl(e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-[var(--muted)]">{t.proxyNode.testInterval}</label>
                      <Input type="number" value={interval} onChange={(e) => setInterval(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-[var(--muted)]">{t.proxyNode.tolerance}</label>
                      <Input type="number" defaultValue="150" />
                    </div>
                  </div>
                </>
              )}
              {type === "load-balance" && (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[var(--muted)]">{t.proxyNode.strategy}</label>
                  <Select defaultValue="consistent-hashing">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="consistent-hashing">Consistent Hashing</SelectItem>
                      <SelectItem value="round-robin">Round Robin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              {type === "select" && (
                <div className="flex items-center justify-center py-4 text-sm text-[var(--muted)]">
                  {gT.noOptionsForSelect}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={onClose}>{gT.cancel}</Button>
          <Button onClick={() => { onSave?.({ name: name.trim(), type, proxies: selected, filter: filterRegex || undefined, url, interval: parseInt(interval, 10), use_all_proxies: useAllProxies ? 1 : 0 }); onClose(); }} disabled={!name.trim()}>
            {groupName ? gT.saveChanges : gT.createGroup}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
