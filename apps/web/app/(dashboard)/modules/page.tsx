"use client";
import { useState } from "react";
import { Link, ChevronRight, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Topbar } from "@/components/layout/topbar";
import { cn } from "@/lib/utils";

interface Module {
  id: string;
  name: string;
  description: string;
  author: string;
  version: string;
  sourceUrl: string;
  enabled: boolean;
  installed: boolean;
  category: string;
}

const initialModules: Module[] = [
  { id: "1", name: "Block Ads", description: "Blocks advertisement domains and tracking pixels using a curated blocklist", author: "mihomo-party", version: "1.3.2", sourceUrl: "https://cdn.jsdelivr.net/gh/mihomo-party/modules/block-ads.js", enabled: true, installed: true, category: "Security" },
  { id: "2", name: "HTTPS Unlock", description: "Unlock geo-restricted content via HTTPS header modification", author: "community", version: "0.8.1", sourceUrl: "https://raw.githubusercontent.com/unlock/modules/main/https-unlock.js", enabled: false, installed: true, category: "Unlock" },
  { id: "3", name: "Remove Tracking", description: "Strip tracking parameters (UTM, fbclid, etc.) from URLs", author: "mihomo-party", version: "2.1.0", sourceUrl: "https://cdn.jsdelivr.net/gh/mihomo-party/modules/remove-tracking.js", enabled: true, installed: true, category: "Privacy" },
  { id: "4", name: "Custom DNS", description: "Override DNS resolution for specific domains with custom rules", author: "community", version: "1.0.4", sourceUrl: "https://raw.githubusercontent.com/dns-rules/main/custom-dns.js", enabled: false, installed: true, category: "DNS" },
  { id: "5", name: "YouTube Ad Skip", description: "Automatically skip YouTube advertisements", author: "yt-tools", version: "3.2.1", sourceUrl: "https://github.com/yt-tools/ad-skip", enabled: false, installed: false, category: "Media" },
  { id: "6", name: "Netflix Quality", description: "Force higher quality streams on Netflix", author: "stream-tools", version: "1.0.0", sourceUrl: "https://github.com/stream-tools/netflix", enabled: false, installed: false, category: "Media" },
];

const categoryColors: Record<string, string> = {
  Security: "bg-red-50 text-red-700 dark:bg-red-500/20 dark:text-red-300",
  Privacy: "bg-[var(--brand-100)] text-[var(--brand-600)] dark:bg-[var(--brand-500)]/20 dark:text-[var(--brand-300)]",
  Unlock: "bg-amber-50 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
  DNS: "bg-sky-50 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300",
  Media: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
};

export default function ModulesPage() {
  const [modules, setModules] = useState<Module[]>(initialModules);
  const [showInstall, setShowInstall] = useState(false);
  const [installUrl, setInstallUrl] = useState("");
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);

  const toggleModule = (id: string) => {
    setModules((prev) => prev.map((m) => (m.id === id ? { ...m, enabled: !m.enabled } : m)));
  };

  const installModule = (id: string) => {
    setModules((prev) => prev.map((m) => (m.id === id ? { ...m, installed: true } : m)));
  };

  const installed = modules.filter((m) => m.installed);
  const available = modules.filter((m) => !m.installed);

  function ModuleCard({ module, showInstallBtn }: { module: Module; showInstallBtn?: boolean }) {
    return (
      <Card
        className={cn("cursor-pointer transition-all hover:shadow-md", selectedModule?.id === module.id && "border-[var(--brand-500)]")}
        onClick={() => setSelectedModule(module)}
      >
        <div className="p-4 flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[var(--surface-2)] border border-[var(--border)] text-lg font-bold text-[var(--brand-500)]">
            {module.name[0]}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-[var(--foreground)]">{module.name}</span>
              <span className="text-[10px] text-[var(--muted)] font-mono">v{module.version}</span>
              <span className={cn("text-[10px] font-semibold rounded-[6px] px-2 py-0.5", categoryColors[module.category] ?? "bg-[var(--surface-2)] text-[var(--muted)]")}>
                {module.category}
              </span>
            </div>
            <p className="text-xs text-[var(--muted)] mt-0.5 line-clamp-2">{module.description}</p>
            <p className="text-[11px] text-[var(--muted)] mt-1">by {module.author}</p>
          </div>
          <div className="shrink-0 flex items-center gap-2">
            {showInstallBtn ? (
              <Button size="sm" variant="outline" className="text-xs" onClick={(e) => { e.stopPropagation(); installModule(module.id); }}>
                Install
              </Button>
            ) : (
              <Switch checked={module.enabled} onCheckedChange={() => toggleModule(module.id)} onClick={(e) => e.stopPropagation()} />
            )}
            <ChevronRight className="h-4 w-4 text-[var(--muted)]" />
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <Topbar title="Modules" description="Manage scripted modules">
        <Button onClick={() => setShowInstall(true)} size="sm" variant="outline" className="gap-1.5 text-xs">
          <Link className="h-3.5 w-3.5" />
          Install from URL
        </Button>
      </Topbar>

      <div className="flex-1 p-6 overflow-auto">
        <div className={cn("flex gap-5", selectedModule && "pr-0")}>
          <div className="flex-1 min-w-0 space-y-5">
            <Tabs defaultValue="installed">
              <TabsList>
                <TabsTrigger value="installed">Installed ({installed.length})</TabsTrigger>
                <TabsTrigger value="available">Available ({available.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="installed" className="mt-4 space-y-3">
                {installed.map((m) => <ModuleCard key={m.id} module={m} />)}
              </TabsContent>
              <TabsContent value="available" className="mt-4 space-y-3">
                {available.map((m) => <ModuleCard key={m.id} module={m} showInstallBtn />)}
              </TabsContent>
            </Tabs>
          </div>

          {/* Detail panel */}
          {selectedModule && (
            <div className="w-72 shrink-0">
              <Card className="sticky top-0">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">{selectedModule.name}</CardTitle>
                    <button onClick={() => setSelectedModule(null)} className="text-[var(--muted)] hover:text-[var(--foreground)]">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <p className="text-[var(--muted)] text-xs">{selectedModule.description}</p>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between"><span className="text-[var(--muted)]">Author</span><span className="text-[var(--foreground)]">{selectedModule.author}</span></div>
                    <div className="flex justify-between"><span className="text-[var(--muted)]">Version</span><span className="font-mono text-[var(--foreground)]">v{selectedModule.version}</span></div>
                    <div className="flex justify-between"><span className="text-[var(--muted)]">Category</span><span className="text-[var(--foreground)]">{selectedModule.category}</span></div>
                    <div className="flex justify-between"><span className="text-[var(--muted)]">Status</span><Badge variant={selectedModule.enabled ? "success" : "secondary"}>{selectedModule.enabled ? "Enabled" : "Disabled"}</Badge></div>
                  </div>
                  <div className="pt-2 space-y-1.5">
                    <p className="text-[10px] text-[var(--muted)] font-semibold uppercase tracking-wider">Source URL</p>
                    <p className="text-[11px] font-mono text-[var(--muted)] break-all">{selectedModule.sourceUrl}</p>
                  </div>
                  {selectedModule.installed && (
                    <div className="pt-2 flex gap-2">
                      <Switch checked={selectedModule.enabled} onCheckedChange={() => toggleModule(selectedModule.id)} />
                      <span className="text-xs text-[var(--muted)]">{selectedModule.enabled ? "Enabled" : "Disabled"}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Install from URL Dialog */}
      <Dialog open={showInstall} onOpenChange={setShowInstall}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Install Module from URL</DialogTitle>
          </DialogHeader>
          <div className="px-6 pb-2 space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[var(--foreground)]">Module URL</label>
              <Input value={installUrl} onChange={(e) => setInstallUrl(e.target.value)} placeholder="https://example.com/module.js" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInstall(false)}>Cancel</Button>
            <Button className="bg-[var(--brand-500)] hover:bg-[var(--brand-600)] text-white">Install</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
