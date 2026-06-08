"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { BookOpen, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CategoryCard } from "@/components/home/category-card";
import { RecentMatches } from "@/components/home/upcoming-matches";
import { getService } from "@/lib/services";
import type { Tournament, CategorySummary, Match } from "@/lib/types";

interface RecentMatch extends Match {
  player1Name: string;
  player2Name: string;
  categoryName: string;
}

export default function Home() {
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [summaries, setSummaries] = useState<CategorySummary[]>([]);
  const [recentMatches, setRecentMatches] = useState<RecentMatch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const service = getService();
      try {
        const [t, s, m] = await Promise.all([
          service.getTournament(),
          service.getCategorySummaries(),
          service.getRecentMatches(5),
        ]);
        setTournament(t);
        setSummaries(s);
        setRecentMatches(m as RecentMatch[]);
      } catch (err) {
        console.error("[Home] load error:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="flex items-center justify-center py-24 text-sm text-muted-foreground">
        No tournament data found. Run seed.sql in Supabase.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">{tournament.name}</h1>
          <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/10">
            In Progress
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {new Date(tournament.startDate).toLocaleDateString("en-GB", { day: "numeric", month: "long" })}
          {" – "}
          {new Date(tournament.endDate).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {summaries.map((summary) => (
          <CategoryCard key={summary.category.id} summary={summary} tournamentSlug={tournament.slug} />
        ))}
      </div>

      <RecentMatches matches={recentMatches} />

      <Link href={`/tournament/${tournament.slug}/rules`}>
        <Card className="transition-all hover:shadow-md hover:border-primary/30 cursor-pointer">
          <CardContent className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                <BookOpen className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Tournament Rules</p>
                <p className="text-xs text-muted-foreground">Format, scoring, deadlines & seeding</p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </CardContent>
        </Card>
      </Link>
    </div>
  );
}
