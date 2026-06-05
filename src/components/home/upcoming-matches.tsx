"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Match } from "@/lib/types";

interface MatchWithNames extends Match {
  player1Name: string;
  player2Name: string;
  categoryName: string;
}

interface UpcomingMatchesProps {
  matches: MatchWithNames[];
}

function formatScore(match: MatchWithNames): string {
  return match.sets
    .map((s) => {
      const score = `${s.player1Games}-${s.player2Games}`;
      return s.isTiebreak ? `${score}(TB)` : score;
    })
    .join("  ");
}

export function RecentMatches({ matches }: UpcomingMatchesProps) {
  if (matches.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Recent Results</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {matches.map((match) => {
          const p1Won = match.winnerId === match.player1Id;
          return (
            <div
              key={match.id}
              className="flex items-center gap-3 rounded-lg border p-3"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`text-sm truncate ${p1Won ? "font-semibold" : "text-muted-foreground"}`}
                  >
                    {match.player1Name}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span
                    className={`text-sm truncate ${!p1Won ? "font-semibold" : "text-muted-foreground"}`}
                  >
                    {match.player2Name}
                  </span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-sm font-mono font-medium">
                  {formatScore(match)}
                </div>
                <Badge variant="outline" className="text-[10px] mt-1">
                  {match.categoryName}
                </Badge>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
