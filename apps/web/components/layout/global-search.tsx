"use client";

import { Search, X } from "lucide-react";
import { useLocale } from "@/lib/i18n/context";
import { usePageSearch } from "@/lib/page-search";

export function GlobalSearch() {
  const { t } = useLocale();
  const { query, setQuery } = usePageSearch();

  return (
    <div className="relative mx-auto max-w-[560px]">
      <div className="flex h-11 items-center gap-3 rounded-full border border-[var(--border)] bg-[var(--surface)] px-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]">
        <Search className="h-4 w-4 shrink-0 text-[var(--muted-foreground)]" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t.topbar.searchPlaceholder}
          className="min-w-0 flex-1 bg-transparent text-[15px] font-medium text-[var(--foreground)] outline-none placeholder:text-[var(--muted-foreground)]"
          aria-label={t.topbar.searchPlaceholder}
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="rounded-full p-1 text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--foreground)]"
            aria-label={t.common.close}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
