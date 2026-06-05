"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Match } from "@/lib/types";
import { Pause } from "lucide-react";

interface MatchCardProps {
  match: Match;
  player1Name: string;
  player2Name: string;
  onResume?: (match: Match) => void;
}

function formatSetScore(set: { player1Games: number; player2Games: number; isTiebreak?: boolean }) {
  const score = `${set.player1Games}-${set.player2Games}`;
  return set.isTiebreak ? `${score}(TB)` : score;
}

export function MatchCard({ match, player1Name, player2Name, onResume }: MatchCardProps) {
  const isIncomplete = match.status === "incomplete";
  const p1Won = match.winnerId === match.player1Id;
  const p2Won = match.winnerId === match.player2Id;

  const p1Sets = match.sets.filter((s) => s.player1Games > s.player2Games).length;
  const p2Sets = match.sets.filter((s) => s.player2Games > s.player1Games).length;

  return (
    <div
      className={cn(
        "rounded-lg border p-3 transition-colors",
        isIncomplete
          ? "border-amber-300 bg-amber-50/50 cursor-pointer hover:bg-amber-50"
          : "hover:bg-muted/30"
      )}
      onClick={isIncomplete && onResume ? () => onResume(match) : undefined}
    >
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center justify-between">
            <span className={cn("text-sm truncate", p1Won ? "font-semibold" : isIncomplete ? "" : "text-muted-foreground")}>
              {player1Name}
            </span>
            <span className={cn("text-sm font-mono w-4 text-center", p1Won ? "font-bold" : "text-muted-foreground")}>
              {p1Sets}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className={cn("text-sm truncate", p2Won ? "font-semibold" : isIncomplete ? "" : "text-muted-foreground")}>
              {player2Name}
            </span>
            <span className={cn("text-sm font-mono w-4 text-center", p2Won ? "font-bold" : "text-muted-foreground")}>
              {p2Sets}
            </span>
          </div>
        </div>

        <div className="shrink-0 border-l pl-3">
          <div className="flex gap-2 text-xs font-mono text-muted-foreground">
            {match.sets.map((set, i) => (
              <span key={i} className="whitespace-nowrap">
                {formatSetScore(set)}
              </span>
            ))}
          </div>
          <div className="flex items-center justify-end gap-1 mt-1">
            {isIncomplete && (
              <Badge variant="outline" className="text-[10px] border-amber-400 text-amber-600 gap-0.5">
                <Pause className="h-2.5 w-2.5" />
                Incomplete
              </Badge>
            )}
            {!isIncomplete && match.playedAt && (
              <p className="text-[10px] text-muted-foreground">
                {new Date(match.playedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface MatchListProps {
  matches: Match[];
  playerNames: Map<string, string>;
  onResumeMatch?: (match: Match) => void;
}

export function MatchList({ matches, playerNames, onResumeMatch }: MatchListProps) {
  const incomplete = matches.filter((m) => m.status === "incomplete");
  const completed = matches.filter((m) => m.status === "completed");

  if (incomplete.length === 0 && completed.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground">
        No matches played yet
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {incomplete.map((match) => (
        <MatchCard
          key={match.id}
          match={match}
          player1Name={playerNames.get(match.player1Id) ?? "Unknown"}
          player2Name={playerNames.get(match.player2Id) ?? "Unknown"}
          onResume={onResumeMatch}
        />
      ))}
      {completed.map((match) => (
        <MatchCard
          key={match.id}
          match={match}
          player1Name={playerNames.get(match.player1Id) ?? "Unknown"}
          player2Name={playerNames.get(match.player2Id) ?? "Unknown"}
        />
      ))}
    </div>
  );
}

interface RemainingFixture {
  player1Id: string;
  player2Id: string;
}

interface FixtureListProps {
  fixtures: RemainingFixture[];
  playerNames: Map<string, string>;
}

export function FixtureList({ fixtures, playerNames }: FixtureListProps) {
  if (fixtures.length === 0) {
    return (
      <div className="py-8 text-center">
        <Badge className="bg-primary/10 text-primary border-primary/20">
          All matches completed
        </Badge>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {fixtures.map((f, i) => (
        <div
          key={i}
          className="flex items-center justify-between rounded-lg border border-dashed p-3 text-sm"
        >
          <span>{playerNames.get(f.player1Id) ?? "Unknown"}</span>
          <span className="text-xs text-muted-foreground font-medium">vs</span>
          <span className="text-right">{playerNames.get(f.player2Id) ?? "Unknown"}</span>
        </div>
      ))}
    </div>
  );
}
