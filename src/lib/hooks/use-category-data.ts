"use client";

import { useState, useEffect, useCallback } from "react";
import { getService } from "@/lib/services";
import type { Match, Standing, Category } from "@/lib/types";

interface CategoryData {
  category: Category | null;
  matches: Match[];
  standings: Record<string, Standing[]>;
  loading: boolean;
  refresh: () => void;
}

export function useCategoryData(slug: string, groups: string[]): CategoryData {
  const [category, setCategory] = useState<Category | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [standings, setStandings] = useState<Record<string, Standing[]>>({});
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  const refresh = useCallback(() => setTick((n) => n + 1), []);

  useEffect(() => {
    let cancelled = false;
    const service = getService();

    async function load() {
      setLoading(true);
      try {
        const [cat, allMatches] = await Promise.all([
          service.getCategory(slug),
          service.getMatches(
            slug === "mens-singles" ? "mens-singles" :
            slug === "womens-singles" ? "womens-singles" : "mixed-doubles"
          ),
        ]);

        if (cancelled) return;
        setCategory(cat ?? null);
        setMatches(allMatches);

        const newStandings: Record<string, Standing[]> = {};
        for (const group of groups) {
          newStandings[group] = await service.getStandings(
            slug === "mens-singles" ? "mens-singles" :
            slug === "womens-singles" ? "womens-singles" : "mixed-doubles",
            group
          );
        }
        if (!cancelled) setStandings(newStandings);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [slug, tick]);

  return { category, matches, standings, loading, refresh };
}
