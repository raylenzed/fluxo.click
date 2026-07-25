"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
  groupsApi,
  profilesApi,
  providersApi,
  proxiesApi,
  ruleProvidersApi,
  rulesApi,
} from "@/lib/api";
import { useLocale } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";

type SearchResult = {
  id: string;
  category: string;
  label: string;
  detail: string;
  href: string;
};

type SearchScope = "policies" | "rules" | "ruleProviders" | "providers" | "profiles" | "overview" | "none";

function getSearchScope(pathname: string): SearchScope {
  if (pathname.startsWith("/policies")) return "policies";
  if (pathname.startsWith("/rules")) return "rules";
  if (pathname.startsWith("/rewrite")) return "ruleProviders";
  if (pathname.startsWith("/modules")) return "providers";
  if (pathname.startsWith("/profiles")) return "profiles";
  if (pathname === "/" || pathname.startsWith("/overview")) return "overview";
  return "none";
}

export function GlobalSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useLocale();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const enabled = open && query.trim().length > 0;
  const scope = getSearchScope(pathname);

  const proxies = useQuery({
    queryKey: ["proxies"],
    queryFn: proxiesApi.list,
    staleTime: 30_000,
    enabled: enabled && (scope === "policies" || scope === "overview"),
  });
  const groups = useQuery({
    queryKey: ["groups"],
    queryFn: groupsApi.list,
    staleTime: 30_000,
    enabled: enabled && (scope === "policies" || scope === "overview"),
  });
  const rules = useQuery({
    queryKey: ["rules"],
    queryFn: rulesApi.list,
    staleTime: 30_000,
    enabled: enabled && scope === "rules",
  });
  const ruleProviders = useQuery({
    queryKey: ["rule-providers"],
    queryFn: ruleProvidersApi.list,
    staleTime: 30_000,
    enabled: enabled && scope === "ruleProviders",
  });
  const providers = useQuery({
    queryKey: ["providers"],
    queryFn: providersApi.list,
    staleTime: 30_000,
    enabled: enabled && scope === "providers",
  });
  const profiles = useQuery({
    queryKey: ["profiles"],
    queryFn: profilesApi.list,
    staleTime: 30_000,
    enabled: enabled && (scope === "profiles" || scope === "overview"),
  });

  const results = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    if (!needle) return [];
    const matches = (...values: Array<string | number | null | undefined>) =>
      values.some((value) => String(value ?? "").toLocaleLowerCase().includes(needle));
    const items: SearchResult[] = [];

    if (scope === "policies" || scope === "overview") {
      for (const proxy of proxies.data ?? []) {
        if (matches(proxy.name, proxy.type, proxy.server, proxy.port)) {
          items.push({
            id: `proxy-${proxy.id}`,
            category: t.nav.policies,
            label: proxy.name,
            detail: `${proxy.type} · ${proxy.server}:${proxy.port}`,
            href: "/policies",
          });
        }
      }
      for (const group of groups.data ?? []) {
        if (matches(group.name, group.type)) {
          items.push({
            id: `group-${group.id}`,
            category: t.nav.policies,
            label: group.name,
            detail: group.type,
            href: "/policies",
          });
        }
      }
    }
    if (scope === "rules") {
      for (const rule of rules.data ?? []) {
        if (matches(rule.type, rule.value, rule.policy, rule.note)) {
          items.push({
            id: `rule-${rule.id}`,
            category: t.nav.rules,
            label: `${rule.type}${rule.value ? `,${rule.value}` : ""}`,
            detail: rule.policy,
            href: "/rules",
          });
        }
      }
    }
    if (scope === "ruleProviders") {
      for (const ruleProvider of ruleProviders.data ?? []) {
        if (matches(ruleProvider.name, ruleProvider.behavior, ruleProvider.policy, ruleProvider.url)) {
          items.push({
            id: `rule-provider-${ruleProvider.id}`,
            category: t.nav.ruleSets,
            label: ruleProvider.name,
            detail: ruleProvider.policy,
            href: "/rewrite",
          });
        }
      }
    }
    if (scope === "providers") {
      for (const provider of providers.data ?? []) {
        if (matches(provider.name, provider.url, provider.filter)) {
          items.push({
            id: `provider-${provider.id}`,
            category: t.nav.providers,
            label: provider.name,
            detail: provider.url,
            href: "/modules",
          });
        }
      }
    }
    if (scope === "profiles" || scope === "overview") {
      for (const profile of profiles.data ?? []) {
        if (matches(profile.name, profile.description)) {
          items.push({
            id: `profile-${profile.id}`,
            category: t.nav.profiles,
            label: profile.name,
            detail: profile.description,
            href: "/profiles",
          });
        }
      }
    }
    return items.slice(0, 12);
  }, [
    groups.data,
    profiles.data,
    providers.data,
    proxies.data,
    query,
    ruleProviders.data,
    rules.data,
    scope,
    t.nav,
  ]);

  const loading = enabled && (
    ((scope === "policies" || scope === "overview") && (proxies.isLoading || groups.isLoading)) ||
    (scope === "rules" && rules.isLoading) ||
    (scope === "ruleProviders" && ruleProviders.isLoading) ||
    (scope === "providers" && providers.isLoading) ||
    ((scope === "profiles" || scope === "overview") && profiles.isLoading)
  );

  useEffect(() => {
    setActiveIndex(0);
  }, [query, results.length]);

  function selectResult(result: SearchResult) {
    setOpen(false);
    setQuery("");
    router.push(result.href);
  }

  return (
    <div className="relative mx-auto max-w-[560px]">
      <div className="flex h-11 items-center gap-3 rounded-full border border-[var(--border)] bg-[var(--surface)] px-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]">
        <Search className="h-4 w-4 shrink-0 text-[var(--muted-foreground)]" />
        <input
          type="search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => window.setTimeout(() => setOpen(false), 120)}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown" && results.length > 0) {
              event.preventDefault();
              setActiveIndex((index) => (index + 1) % results.length);
            } else if (event.key === "ArrowUp" && results.length > 0) {
              event.preventDefault();
              setActiveIndex((index) => (index - 1 + results.length) % results.length);
            } else if (event.key === "Enter" && results[activeIndex]) {
              event.preventDefault();
              selectResult(results[activeIndex]);
            } else if (event.key === "Escape") {
              setOpen(false);
            }
          }}
          placeholder={t.topbar.searchPlaceholder}
          className="min-w-0 flex-1 bg-transparent text-[15px] font-medium text-[var(--foreground)] outline-none placeholder:text-[var(--muted-foreground)]"
          aria-label={t.topbar.searchPlaceholder}
          aria-expanded={open && enabled}
        />
      </div>

      {open && enabled && (
        <div className="absolute left-0 right-0 top-12 z-50 overflow-hidden rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-1.5 shadow-[0_18px_50px_rgba(24,32,48,0.2)]">
          {loading && results.length === 0 ? (
            <p className="px-4 py-3 text-sm text-[var(--muted)]">{t.topbar.searchLoading}</p>
          ) : results.length === 0 ? (
            <p className="px-4 py-3 text-sm text-[var(--muted)]">{t.topbar.searchNoResults}</p>
          ) : (
            results.map((result, index) => (
              <button
                key={result.id}
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => selectResult(result)}
                onMouseEnter={() => setActiveIndex(index)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-[11px] px-3 py-2 text-left",
                  activeIndex === index ? "bg-[var(--surface-2)]" : "hover:bg-[var(--surface-2)]"
                )}
              >
                <span className="w-16 shrink-0 text-[10px] font-bold uppercase tracking-wide text-[var(--muted)]">
                  {result.category}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-[var(--foreground)]">{result.label}</span>
                  <span className="block truncate text-xs text-[var(--muted)]">{result.detail}</span>
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
