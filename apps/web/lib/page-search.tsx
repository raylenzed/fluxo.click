"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";

type PageSearchContextValue = {
  query: string;
  setQuery: (query: string) => void;
};

const PageSearchContext = createContext<PageSearchContextValue | null>(null);

export function PageSearchProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [query, setQuery] = useState("");

  useEffect(() => {
    setQuery("");
  }, [pathname]);

  const value = useMemo(() => ({ query, setQuery }), [query]);
  return <PageSearchContext.Provider value={value}>{children}</PageSearchContext.Provider>;
}

export function usePageSearch(): PageSearchContextValue {
  const context = useContext(PageSearchContext);
  if (!context) throw new Error("usePageSearch must be used within PageSearchProvider");
  return context;
}
