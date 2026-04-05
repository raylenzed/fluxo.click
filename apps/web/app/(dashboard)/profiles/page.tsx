"use client";
import { useState } from "react";
import { Folder, Plus, Link, CheckCircle2, MoreHorizontal, Trash2, Copy, Pen, Download, Play } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Topbar } from "@/components/layout/topbar";
import { cn } from "@/lib/utils";

interface Profile {
  id: string;
  name: string;
  description: string;
  proxies: number;
  rules: number;
  lastModified: string;
  active: boolean;
}

const initialProfiles: Profile[] = [
  { id: "1", name: "Home", description: "Personal home network config", proxies: 4, rules: 13, lastModified: "Today, 10:24", active: true },
  { id: "2", name: "Work VPN", description: "Corporate VPN with split tunneling", proxies: 2, rules: 8, lastModified: "Yesterday, 18:05", active: false },
  { id: "3", name: "Gaming", description: "Low-latency gaming rules with CDN optimization", proxies: 6, rules: 22, lastModified: "3 days ago", active: false },
];

export default function ProfilesPage() {
  const [profiles, setProfiles] = useState<Profile[]>(initialProfiles);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingActivateId, setPendingActivateId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [importUrl, setImportUrl] = useState("");
  const [importInterval, setImportInterval] = useState("24h");

  const handleActivate = (id: string) => {
    setPendingActivateId(id);
    setShowConfirmDialog(true);
  };

  const confirmActivate = () => {
    if (pendingActivateId) {
      setProfiles((prev) => prev.map((p) => ({ ...p, active: p.id === pendingActivateId })));
    }
    setShowConfirmDialog(false);
    setPendingActivateId(null);
  };

  const handleCreate = () => {
    if (!newName.trim()) return;
    setProfiles((prev) => [
      ...prev,
      { id: Date.now().toString(), name: newName.trim(), description: newDesc.trim(), proxies: 0, rules: 0, lastModified: "Just now", active: false },
    ]);
    setNewName("");
    setNewDesc("");
    setShowNewDialog(false);
  };

  const handleDelete = (id: string) => {
    setProfiles((prev) => prev.filter((p) => p.id !== id));
  };

  const handleDuplicate = (profile: Profile) => {
    setProfiles((prev) => [
      ...prev,
      { ...profile, id: Date.now().toString(), name: `${profile.name} (Copy)`, active: false, lastModified: "Just now" },
    ]);
  };

  const pendingProfile = profiles.find((p) => p.id === pendingActivateId);

  return (
    <div className="flex flex-col h-full">
      <Topbar title="Profiles" description="Configuration profile management">
        <Button onClick={() => setShowImportDialog(true)} variant="outline" size="sm" className="gap-1.5 text-xs">
          <Link className="h-3.5 w-3.5" />
          Import URL
        </Button>
        <Button onClick={() => setShowNewDialog(true)} size="sm" className="gap-1.5 text-xs bg-[var(--brand-500)] hover:bg-[var(--brand-600)] text-white">
          <Plus className="h-3.5 w-3.5" />
          New Profile
        </Button>
      </Topbar>

      <div className="flex-1 p-6 overflow-auto space-y-5">
        {/* Storage path */}
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[var(--surface-2)] border border-[var(--border)]">
              <Folder className="h-4 w-4 text-[var(--muted)]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-[var(--muted)] mb-1">Profile Storage Path</p>
              <Input value="~/.config/mihomo-party/profiles" readOnly className="bg-[var(--surface-2)] font-mono text-xs" />
            </div>
          </div>
        </Card>

        {/* Profile list */}
        <div className="space-y-3">
          {profiles.map((profile) => (
            <Card
              key={profile.id}
              className={cn(
                "transition-all duration-200",
                profile.active && "border-[var(--brand-500)] shadow-[0_0_0_1px_var(--brand-500)]"
              )}
            >
              <div className="p-5 flex items-start gap-4">
                <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] font-bold text-lg", profile.active ? "bg-[var(--brand-500)] text-white" : "bg-[var(--surface-2)] text-[var(--muted)]")}>
                  {profile.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-semibold text-[var(--foreground)]">{profile.name}</h3>
                    {profile.active && (
                      <Badge variant="success" className="gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Active
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-[var(--muted)] mt-0.5 truncate">{profile.description}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-[var(--muted)]">
                    <span>{profile.proxies} proxies</span>
                    <span>{profile.rules} rules</span>
                    <span>Modified {profile.lastModified}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {!profile.active && (
                    <Button size="sm" variant="outline" className="text-xs gap-1.5" onClick={() => handleActivate(profile.id)}>
                      <Play className="h-3 w-3" />
                      Activate
                    </Button>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon-sm" className="text-[var(--muted)]">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem className="gap-2"><Download className="h-3.5 w-3.5" />Export</DropdownMenuItem>
                      <DropdownMenuItem className="gap-2" onClick={() => handleDuplicate(profile)}><Copy className="h-3.5 w-3.5" />Duplicate</DropdownMenuItem>
                      <DropdownMenuItem className="gap-2"><Pen className="h-3.5 w-3.5" />Rename</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="gap-2 text-red-500" onClick={() => handleDelete(profile.id)}><Trash2 className="h-3.5 w-3.5" />Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* New Profile Dialog */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Profile</DialogTitle>
          </DialogHeader>
          <div className="px-6 pb-2 space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[var(--foreground)]">Name</label>
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="My Profile" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[var(--foreground)]">Description</label>
              <Input value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Optional description" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewDialog(false)}>Cancel</Button>
            <Button onClick={handleCreate} className="bg-[var(--brand-500)] hover:bg-[var(--brand-600)] text-white">Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import URL Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import from URL</DialogTitle>
          </DialogHeader>
          <div className="px-6 pb-2 space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[var(--foreground)]">Subscription URL</label>
              <Input value={importUrl} onChange={(e) => setImportUrl(e.target.value)} placeholder="https://sub.example.com/..." />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[var(--foreground)]">Auto-update Interval</label>
              <Select value={importInterval} onValueChange={setImportInterval}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="disabled">Disabled</SelectItem>
                  <SelectItem value="1h">Every 1h</SelectItem>
                  <SelectItem value="6h">Every 6h</SelectItem>
                  <SelectItem value="24h">Every 24h</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowImportDialog(false)}>Cancel</Button>
            <Button className="bg-[var(--brand-500)] hover:bg-[var(--brand-600)] text-white">Import</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Switch Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Switch Profile</DialogTitle>
          </DialogHeader>
          <div className="px-6 pb-2">
            <p className="text-sm text-[var(--muted)]">
              Switch to <strong className="text-[var(--foreground)]">{pendingProfile?.name}</strong>? Active connections will be restarted.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>Cancel</Button>
            <Button onClick={confirmActivate} className="bg-[var(--brand-500)] hover:bg-[var(--brand-600)] text-white">Switch</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
