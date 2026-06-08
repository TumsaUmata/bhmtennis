"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { validateMatchSets, validateSetScore, validateTiebreakScore } from "@/lib/tennis-validation";
import type { SetScore } from "@/lib/types";

interface ScoreEntryProps {
  player1Name: string;
  player2Name: string;
  player1Id: string;
  player2Id: string;
  onSubmit: (sets: SetScore[], winnerId: string) => void;
  onSaveIncomplete?: (sets: SetScore[]) => void;
  onWalkover?: (winnerId: string) => void;
  onCancel: () => void;
  initialSets?: SetScore[];
}

export function ScoreEntry({
  player1Name,
  player2Name,
  player1Id,
  player2Id,
  onSubmit,
  onSaveIncomplete,
  onWalkover,
  onCancel,
  initialSets,
}: ScoreEntryProps) {
  const [sets, setSets] = useState<SetScore[]>(
    initialSets ?? [
      { player1Games: 0, player2Games: 0 },
      { player1Games: 0, player2Games: 0 },
    ]
  );
  const [hasThirdSet, setHasThirdSet] = useState(initialSets ? initialSets.length > 2 : false);
  const [thirdSetIsTiebreak, setThirdSetIsTiebreak] = useState(
    initialSets && initialSets.length > 2 ? !!initialSets[2].isTiebreak : true
  );
  const [error, setError] = useState<string | null>(null);
  const [setErrors, setSetErrors] = useState<(string | null)[]>([null, null, null]);

  function updateGame(setIndex: number, player: 1 | 2, value: string) {
    const num = value === "" ? 0 : parseInt(value, 10);
    if (isNaN(num) || num < 0) return;

    const isTiebreak = setIndex === 2 && thirdSetIsTiebreak;
    if (!markIncomplete && !isTiebreak && num > 7) return;

    setSets((prev) => {
      const next = [...prev];
      const set = { ...next[setIndex] };
      if (player === 1) set.player1Games = num;
      else set.player2Games = num;
      if (isTiebreak) set.isTiebreak = true;
      next[setIndex] = set;
      return next;
    });
    setError(null);

    // Live validation per set
    setSetErrors((prev) => {
      const next = [...prev];
      const updatedSet = { ...sets[setIndex] };
      if (player === 1) updatedSet.player1Games = num;
      else updatedSet.player2Games = num;
      if (isTiebreak) updatedSet.isTiebreak = true;

      if (updatedSet.player1Games === 0 && updatedSet.player2Games === 0) {
        next[setIndex] = null;
      } else {
        next[setIndex] = isTiebreak
          ? validateTiebreakScore(updatedSet)
          : validateSetScore(updatedSet);
      }
      return next;
    });
  }

  function toggleThirdSet() {
    if (hasThirdSet) {
      setSets((prev) => prev.slice(0, 2));
      setHasThirdSet(false);
      setSetErrors((prev) => [prev[0], prev[1], null]);
    } else {
      setSets((prev) => [...prev, { player1Games: 0, player2Games: 0, isTiebreak: thirdSetIsTiebreak }]);
      setHasThirdSet(true);
    }
    setError(null);
  }

  function toggleTiebreakMode(isTiebreak: boolean) {
    setThirdSetIsTiebreak(isTiebreak);
    if (hasThirdSet) {
      setSets((prev) => {
        const next = [...prev];
        const set = { ...next[2] };
        set.isTiebreak = isTiebreak;
        if (!isTiebreak) {
          set.player1Games = Math.min(set.player1Games, 7);
          set.player2Games = Math.min(set.player2Games, 7);
        }
        next[2] = set;
        return next;
      });
      setSetErrors((prev) => {
        const next = [...prev];
        next[2] = null;
        return next;
      });
    }
  }

  const [markIncomplete, setMarkIncomplete] = useState(false);

  function handleSubmit() {
    if (markIncomplete) {
      const hasAnyScore = sets.some((s) => s.player1Games > 0 || s.player2Games > 0);
      if (!hasAnyScore) {
        setError("Enter at least one set score to save as incomplete");
        return;
      }
      onSaveIncomplete?.(sets);
      return;
    }

    const err = validateMatchSets(sets);
    if (err) {
      setError(err);
      return;
    }

    const p1Won = sets.filter((s) => s.player1Games > s.player2Games).length;
    const p2Won = sets.filter((s) => s.player2Games > s.player1Games).length;
    const winnerId = p1Won > p2Won ? player1Id : player2Id;
    onSubmit(sets, winnerId);
  }

  return (
    <Card className="border-primary/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">Enter Score</CardTitle>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-sm font-medium">
          <span className="truncate">{player1Name}</span>
          <span className="text-xs text-muted-foreground">vs</span>
          <span className="truncate text-right">{player2Name}</span>
        </div>

        {sets.map((set, i) => {
          const isTiebreak = i === 2 && thirdSetIsTiebreak;
          const max = isTiebreak ? undefined : 7;
          const setError = markIncomplete ? null : setErrors[i];

          return (
            <div key={i} className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground">
                  {i === 2 ? (isTiebreak ? "Tiebreak" : "3rd Set") : `Set ${i + 1}`}
                </span>
                {isTiebreak && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                    TB
                  </Badge>
                )}
              </div>
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                <input
                  type="number"
                  min={0}
                  max={markIncomplete ? undefined : max}
                  value={set.player1Games || ""}
                  placeholder="0"
                  onChange={(e) => updateGame(i, 1, e.target.value)}
                  className={cn(
                    "h-12 w-full rounded-lg border bg-background px-3 text-center text-xl font-bold font-mono focus:outline-none focus:ring-2 focus:ring-primary/50",
                    setError && "border-destructive focus:ring-destructive/50",
                    !setError && set.player1Games > set.player2Games && set.player2Games > 0 && "text-primary"
                  )}
                />
                <span className="text-sm text-muted-foreground font-medium">-</span>
                <input
                  type="number"
                  min={0}
                  max={markIncomplete ? undefined : max}
                  value={set.player2Games || ""}
                  placeholder="0"
                  onChange={(e) => updateGame(i, 2, e.target.value)}
                  className={cn(
                    "h-12 w-full rounded-lg border bg-background px-3 text-center text-xl font-bold font-mono focus:outline-none focus:ring-2 focus:ring-primary/50",
                    setError && "border-destructive focus:ring-destructive/50",
                    !setError && set.player2Games > set.player1Games && set.player1Games > 0 && "text-primary"
                  )}
                />
              </div>
              {setError && (
                <p className="text-[11px] text-destructive">{setError}</p>
              )}
            </div>
          );
        })}

        <div className="space-y-2 border-t pt-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={hasThirdSet}
              onChange={toggleThirdSet}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <span className="text-sm">Add 3rd set / tiebreak</span>
          </label>

          {hasThirdSet && (
            <div className="flex gap-2 pl-6">
              <button
                type="button"
                onClick={() => toggleTiebreakMode(true)}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-medium transition-colors",
                  thirdSetIsTiebreak
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                Tiebreak (first to 10)
              </button>
              <button
                type="button"
                onClick={() => toggleTiebreakMode(false)}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-medium transition-colors",
                  !thirdSetIsTiebreak
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                Full set
              </button>
            </div>
          )}
        </div>

        {onSaveIncomplete && (
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={markIncomplete}
              onChange={(e) => { setMarkIncomplete(e.target.checked); setError(null); }}
              className="h-4 w-4 rounded border-gray-300 text-amber-500 focus:ring-amber-500"
            />
            <span className="text-sm text-muted-foreground">
              Mark as incomplete (finish later)
            </span>
          </label>
        )}

        {onWalkover && (
          <div className="border-t pt-3 space-y-2">
            <p className="text-xs text-muted-foreground font-medium">Walkover (no score played)</p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-xs"
                onClick={() => onWalkover(player1Id)}
              >
                {player1Name} wins
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-xs"
                onClick={() => onWalkover(player2Id)}
              >
                {player2Name} wins
              </Button>
            </div>
          </div>
        )}

        {error && (
          <p className="text-sm text-destructive text-center">{error}</p>
        )}

        <div className="flex gap-2 pt-1">
          <Button variant="outline" className="flex-1" onClick={onCancel}>
            Cancel
          </Button>
          <Button className="flex-1" onClick={handleSubmit}>
            {markIncomplete ? "Save Incomplete" : "Submit Result"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

interface FixtureWithEntryProps {
  player1Id: string;
  player2Id: string;
  player1Name: string;
  player2Name: string;
  canEnter: boolean;
  onSelectFixture: (p1Id: string, p2Id: string) => void;
}

export function FixtureWithEntry({
  player1Id,
  player2Id,
  player1Name,
  player2Name,
  canEnter,
  onSelectFixture,
}: FixtureWithEntryProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between rounded-lg border border-dashed p-3 text-sm transition-colors",
        canEnter
          ? "cursor-pointer hover:border-primary/50 hover:bg-primary/5"
          : "opacity-60"
      )}
      onClick={canEnter ? () => onSelectFixture(player1Id, player2Id) : undefined}
    >
      <span>{player1Name}</span>
      {canEnter ? (
        <Badge variant="outline" className="text-[10px]">
          tap to enter score
        </Badge>
      ) : (
        <span className="text-[10px] text-muted-foreground">scheduled</span>
      )}
      <span className="text-right">{player2Name}</span>
    </div>
  );
}
