"use client";

import { useState, useEffect, useCallback } from "react";
import { AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getService } from "@/lib/services";

interface MissedFixture {
  player1Id: string;
  player2Id: string;
  player1Name: string;
  player2Name: string;
  groupLabel: string;
  deadline: string;
}

interface Props {
  categoryId: string;
  categoryName: string;
}

export function WalkoverManager({ categoryId, categoryName }: Props) {
  const [fixtures, setFixtures] = useState<MissedFixture[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null); // key: `${p1}-${p2}`

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getService().getMissedFixtures(categoryId);
      setFixtures(result);
    } finally {
      setLoading(false);
    }
  }, [categoryId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleAwardWalkover(
    fixture: MissedFixture,
    winnerId: string,
    loserId: string
  ) {
    const key = `${fixture.player1Id}-${fixture.player2Id}`;
    setBusy(key);
    try {
      await getService().awardWalkover(categoryId, fixture.groupLabel, winnerId, loserId);
      setFixtures((prev) =>
        prev.filter(
          (f) =>
            !(f.player1Id === fixture.player1Id && f.player2Id === fixture.player2Id)
        )
      );
    } finally {
      setBusy(null);
    }
  }

  if (loading || fixtures.length === 0) return null;

  return (
    <Card className="border-amber-200 dark:border-amber-800">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <CardTitle className="text-sm font-semibold">
              Missed Fixtures — {categoryName}
            </CardTitle>
          </div>
          <Badge
            variant="secondary"
            className="text-xs bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400"
          >
            {fixtures.length} unplayed past deadline
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {fixtures.map((fixture) => {
          const key = `${fixture.player1Id}-${fixture.player2Id}`;
          const isBusy = busy === key;
          return (
            <div
              key={key}
              className="rounded-lg border bg-muted/30 px-3 py-2.5 space-y-2"
            >
              <div className="text-xs font-medium text-foreground">
                {fixture.player1Name} vs {fixture.player2Name}
                <span className="text-muted-foreground font-normal ml-2">
                  · Group {fixture.groupLabel}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs gap-1"
                  disabled={isBusy}
                  onClick={() =>
                    handleAwardWalkover(fixture, fixture.player1Id, fixture.player2Id)
                  }
                >
                  {fixture.player1Name} wins by walkover
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs gap-1"
                  disabled={isBusy}
                  onClick={() =>
                    handleAwardWalkover(fixture, fixture.player2Id, fixture.player1Id)
                  }
                >
                  {fixture.player2Name} wins by walkover
                </Button>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
