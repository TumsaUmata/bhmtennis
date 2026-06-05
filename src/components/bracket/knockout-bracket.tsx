"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Trophy } from "lucide-react";
import type { Bracket, BracketMatch } from "@/lib/bracket";

interface KnockoutBracketProps {
  bracket: Bracket;
  isLocked: boolean;
  onMatchClick?: (match: BracketMatch) => void;
}

function formatScore(match: BracketMatch): string {
  if (match.sets.length === 0) return "";
  return match.sets
    .map((s) => {
      const score = `${s.player1Games}-${s.player2Games}`;
      return s.isTiebreak ? `${score}(TB)` : score;
    })
    .join(" ");
}

const roundLabels = ["Quarterfinals", "Semifinals", "Final"];

function BracketMatchCard({
  match,
  isLocked,
  onMatchClick,
}: {
  match: BracketMatch;
  isLocked: boolean;
  onMatchClick?: (m: BracketMatch) => void;
}) {
  const isReady = match.status === "ready" && isLocked;
  const isCompleted = match.status === "completed";
  const p1Won = match.winnerId === match.player1Id;
  const p2Won = match.winnerId === match.player2Id;

  const showPlayers = isLocked || isCompleted;

  return (
    <div
      className={cn(
        "rounded-lg border p-2.5 w-full min-w-[200px] transition-all",
        isReady && "border-primary/40 cursor-pointer hover:border-primary hover:shadow-sm",
        isCompleted && "bg-muted/30",
        !isReady && !isCompleted && "opacity-70"
      )}
      onClick={isReady && onMatchClick ? () => onMatchClick(match) : undefined}
    >
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            {match.player1SeedLabel && (
              <p className="text-[10px] text-muted-foreground">{match.player1SeedLabel}</p>
            )}
            <span className={cn(
              "text-sm truncate block",
              p1Won ? "font-semibold" : isCompleted ? "text-muted-foreground" : ""
            )}>
              {match.player1Name ?? "TBD"}
            </span>
          </div>
          {isCompleted && (
            <span className={cn("text-xs font-mono ml-2", p1Won && "font-bold text-primary")}>
              {match.sets.filter((s) => s.player1Games > s.player2Games).length}
            </span>
          )}
        </div>
        <div className="border-t" />
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            {match.player2SeedLabel && (
              <p className="text-[10px] text-muted-foreground">{match.player2SeedLabel}</p>
            )}
            <span className={cn(
              "text-sm truncate block",
              p2Won ? "font-semibold" : isCompleted ? "text-muted-foreground" : ""
            )}>
              {match.player2Name ?? "TBD"}
            </span>
          </div>
          {isCompleted && (
            <span className={cn("text-xs font-mono ml-2", p2Won && "font-bold text-primary")}>
              {match.sets.filter((s) => s.player2Games > s.player1Games).length}
            </span>
          )}
        </div>
      </div>
      {isCompleted && match.sets.length > 0 && (
        <p className="text-[10px] font-mono text-muted-foreground mt-1.5 text-center">
          {formatScore(match)}
        </p>
      )}
      {isReady && !isCompleted && (
        <p className="text-[10px] text-primary text-center mt-1.5 font-medium">
          Tap to enter score
        </p>
      )}
      {!isLocked && !isCompleted && match.player1Name && (
        <p className="text-[10px] text-muted-foreground text-center mt-1.5">
          Based on current standings
        </p>
      )}
    </div>
  );
}

interface PotentialCandidate {
  slot: string;
  playerName: string;
  points: number;
}

interface KnockoutBracketWithCandidatesProps extends KnockoutBracketProps {
  candidates?: PotentialCandidate[];
  groupStageComplete: boolean;
}

export function KnockoutBracket({
  bracket,
  isLocked,
  onMatchClick,
}: KnockoutBracketProps) {
  const totalRounds = bracket.rounds.length;
  const labels = totalRounds === 1 ? ["Final"] : roundLabels.slice(3 - totalRounds);

  return (
    <div className="space-y-4">
      {bracket.champion && (
        <div className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-primary/10 border border-primary/20">
          <Trophy className="h-5 w-5 text-primary" />
          <span className="font-bold text-primary">{bracket.champion}</span>
          <Badge className="bg-primary text-primary-foreground text-[10px]">Champion</Badge>
        </div>
      )}

      <div className="overflow-x-auto">
        <div className="flex gap-6 min-w-fit pb-2">
          {bracket.rounds.map((round, roundIndex) => (
            <div key={roundIndex} className="flex flex-col">
              <p className="text-xs font-semibold text-muted-foreground mb-2 text-center">
                {labels[roundIndex]}
              </p>
              <div
                className="flex flex-col justify-around flex-1 gap-3"
                style={{ minHeight: `${round.length * 80}px` }}
              >
                {round.map((match) => (
                  <BracketMatchCard
                    key={match.id}
                    match={match}
                    isLocked={isLocked}
                    onMatchClick={onMatchClick}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function CandidatesList({ candidates }: { candidates: PotentialCandidate[] }) {
  if (candidates.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-muted-foreground">Current Potential Qualifiers</p>
      <div className="grid grid-cols-2 gap-2">
        {candidates.map((c) => (
          <div key={c.slot} className="flex items-center justify-between rounded-lg border border-dashed p-2 text-xs">
            <span className="text-muted-foreground">{c.slot}</span>
            <span className="font-medium">{c.playerName} <span className="text-muted-foreground">({c.points}pts)</span></span>
          </div>
        ))}
      </div>
    </div>
  );
}
