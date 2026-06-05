"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Lock, Unlock, CheckCircle, RotateCcw, CalendarDays } from "lucide-react";
import { useMatchStore, computeStandings, getMensGroupPlayers } from "@/lib/match-store";
import { generateMensBracket, generateFinalBracket } from "@/lib/bracket";
import { categories, womensPlayers, doublesTeams } from "@/lib/mock-data";
import { WalkoverManager } from "./walkover-manager";

interface TournamentControlsProps {
  onForceUpdate: () => void;
}

function DeadlineEditor({
  categoryId,
  cat,
  onForceUpdate,
}: {
  categoryId: string;
  cat: (typeof categories)[0];
  onForceUpdate: () => void;
}) {
  const store = useMatchStore();
  const extended = store.extendedDeadlines[categoryId] ?? {};
  const [open, setOpen] = useState(false);

  const groupDeadline = extended.group ?? cat.groupDeadline;
  const qfDeadline = extended.qf;
  const sfDeadline = extended.sf;
  const finalDeadline = extended.final ?? cat.finalDate;

  const stages =
    cat.id === "mens-singles"
      ? [
          { key: "group" as const, label: "Group Stage", current: groupDeadline },
          { key: "qf" as const, label: "Quarterfinals", current: qfDeadline ?? "2026-07-19" },
          { key: "sf" as const, label: "Semifinals", current: sfDeadline ?? "2026-07-26" },
          { key: "final" as const, label: "Final", current: finalDeadline },
        ]
      : [
          { key: "group" as const, label: "Group Stage", current: groupDeadline },
          { key: "final" as const, label: "Final", current: finalDeadline },
        ];

  if (!open) {
    return (
      <Button
        size="sm"
        variant="ghost"
        className="gap-1.5 text-xs"
        onClick={() => setOpen(true)}
      >
        <CalendarDays className="h-3 w-3" />
        Edit Deadlines
      </Button>
    );
  }

  return (
    <div className="space-y-2 border rounded-lg p-3 bg-muted/30">
      <p className="text-xs font-medium">Edit Deadlines</p>
      {stages.map((stage) => (
        <div key={stage.key} className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground w-24 shrink-0">{stage.label}</span>
          <Input
            type="date"
            defaultValue={stage.current}
            className="h-7 text-xs"
            onChange={(e) => {
              if (e.target.value) {
                store.extendDeadline(categoryId, stage.key, e.target.value);
                onForceUpdate();
              }
            }}
          />
        </div>
      ))}
      <Button size="sm" variant="ghost" className="text-xs h-7" onClick={() => setOpen(false)}>
        Done
      </Button>
    </div>
  );
}

export function TournamentControls({ onForceUpdate }: TournamentControlsProps) {
  const store = useMatchStore();

  function handleCloseAndLock(categoryId: string) {
    store.closeGroupStage(categoryId);

    if (categoryId === "mens-singles") {
      const groups = ["A", "B", "C", "D"];
      const allGroupStandings: Record<string, ReturnType<typeof computeStandings>> = {};
      for (const g of groups) {
        const players = getMensGroupPlayers(g);
        const matches = store.matches.filter((m) => m.categoryId === "mens-singles" && m.groupLabel === g);
        allGroupStandings[g] = computeStandings(players, matches, g);
      }
      const bracket = generateMensBracket(allGroupStandings, false);
      store.lockBracket(categoryId, bracket);
    } else {
      const players = categoryId === "womens-singles"
        ? womensPlayers.map((p) => ({ id: p.id, name: p.name }))
        : doublesTeams.map((t) => ({ id: t.id, name: t.teamName }));
      const matches = store.matches.filter((m) => m.categoryId === categoryId);
      const standings = computeStandings(players, matches, "A");
      const label = categoryId === "womens-singles" ? "Women's Singles" : "Mixed Doubles";
      const bracket = generateFinalBracket(standings, label, false);
      store.lockBracket(categoryId, bracket);
    }

    onForceUpdate();
  }

  function handleReopenAndUnlock(categoryId: string) {
    store.reopenGroupStage(categoryId);
    store.unlockBracket(categoryId);
    onForceUpdate();
  }

  function handleLockOnly(categoryId: string) {
    if (categoryId === "mens-singles") {
      const groups = ["A", "B", "C", "D"];
      const allGroupStandings: Record<string, ReturnType<typeof computeStandings>> = {};
      for (const g of groups) {
        const players = getMensGroupPlayers(g);
        const matches = store.matches.filter((m) => m.categoryId === "mens-singles" && m.groupLabel === g);
        allGroupStandings[g] = computeStandings(players, matches, g);
      }
      const bracket = generateMensBracket(allGroupStandings, false);
      store.lockBracket(categoryId, bracket);
    } else {
      const players = categoryId === "womens-singles"
        ? womensPlayers.map((p) => ({ id: p.id, name: p.name }))
        : doublesTeams.map((t) => ({ id: t.id, name: t.teamName }));
      const matches = store.matches.filter((m) => m.categoryId === categoryId);
      const standings = computeStandings(players, matches, "A");
      const label = categoryId === "womens-singles" ? "Women's Singles" : "Mixed Doubles";
      const bracket = generateFinalBracket(standings, label, false);
      store.lockBracket(categoryId, bracket);
    }
    onForceUpdate();
  }

  function handleUnlockOnly(categoryId: string) {
    store.unlockBracket(categoryId);
    onForceUpdate();
  }

  return (
    <div className="space-y-4">
      {categories.map((cat) => {
        const isClosed = store.closedGroups.has(cat.id);
        const isLocked = store.lockedBrackets.has(cat.id);
        const catMatches = store.matches.filter((m) => m.categoryId === cat.id);
        const completed = catMatches.filter((m) => m.status === "completed").length;
        const totalPerGroup = (cat.groupSize * (cat.groupSize - 1)) / 2;
        const total = totalPerGroup * cat.groupCount;
        const extended = store.extendedDeadlines[cat.id] ?? {};
        const groupDeadline = extended.group ?? cat.groupDeadline;

        return (
          <Card key={cat.id}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">{cat.name}</CardTitle>
                <div className="flex items-center gap-1.5">
                  {isClosed && (
                    <Badge variant="secondary" className="text-[10px] gap-1">
                      <CheckCircle className="h-2.5 w-2.5" />
                      Group Closed
                    </Badge>
                  )}
                  {isLocked && (
                    <Badge variant="secondary" className="text-[10px] gap-1">
                      <Lock className="h-2.5 w-2.5" />
                      Bracket Locked
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-xs text-muted-foreground">
                {completed} of {total} group matches completed
                {" · "}
                Group deadline: {new Date(groupDeadline).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                {extended.group && (
                  <span className="text-amber-600 ml-1">(extended)</span>
                )}
              </div>

              <DeadlineEditor
                categoryId={cat.id}
                cat={cat}
                onForceUpdate={onForceUpdate}
              />

              <div className="flex flex-wrap gap-2">
                {!isClosed && !isLocked && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 text-xs"
                    onClick={() => handleCloseAndLock(cat.id)}
                  >
                    <CheckCircle className="h-3 w-3" />
                    Close Group & Lock Bracket
                  </Button>
                )}

                {!isClosed && !isLocked && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="gap-1.5 text-xs"
                    onClick={() => handleLockOnly(cat.id)}
                  >
                    <Lock className="h-3 w-3" />
                    Lock Bracket Only
                  </Button>
                )}

                {(isClosed || isLocked) && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="gap-1.5 text-xs text-muted-foreground"
                    onClick={() => handleReopenAndUnlock(cat.id)}
                  >
                    <RotateCcw className="h-3 w-3" />
                    Reopen Group & Unlock
                  </Button>
                )}

                {!isLocked && isClosed && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 text-xs"
                    onClick={() => handleLockOnly(cat.id)}
                  >
                    <Lock className="h-3 w-3" />
                    Lock Bracket
                  </Button>
                )}

                {isLocked && !isClosed && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="gap-1.5 text-xs text-muted-foreground"
                    onClick={() => handleUnlockOnly(cat.id)}
                  >
                    <Unlock className="h-3 w-3" />
                    Unlock Bracket
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}

      <WalkoverManager categoryId="mens-singles" categoryName="Men's Singles" />
      <WalkoverManager categoryId="womens-singles" categoryName="Women's Singles" />
      <WalkoverManager categoryId="mixed-doubles" categoryName="Mixed Doubles" />
    </div>
  );
}
