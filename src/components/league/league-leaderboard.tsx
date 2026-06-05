"use client";

import { Trophy, Swords } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface LeagueRatingRow {
  playerId: string;
  playerName: string;
  rating: number;
  gamesPlayed: number;
}

interface Props {
  ratings: LeagueRatingRow[];
  currentUserId: string;
  onChallenge: (opponent: { id: string; name: string }) => void;
  challengeDisabled: boolean;
}

export function LeagueLeaderboard({ ratings, currentUserId, onChallenge, challengeDisabled }: Props) {
  if (ratings.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          No players ranked yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      {/* Header row */}
      <div className="flex items-center gap-3 px-4 py-2 text-xs font-medium text-muted-foreground border-b">
        <span className="w-7 text-center">#</span>
        <span className="flex-1">Player</span>
        <span className="w-14 text-right">Rating</span>
        <span className="w-12 text-right">Games</span>
        <span className="w-20" />
      </div>
      <CardContent className="p-0">
        {ratings.map((row, index) => {
          const rank = index + 1;
          const isMe = row.playerId === currentUserId;
          return (
            <div key={row.playerId}>
              <div
                className={cn(
                  "flex items-center gap-3 px-4 py-3 text-sm",
                  isMe && "bg-primary/5"
                )}
              >
                {/* Rank */}
                <div className="w-7 flex items-center justify-center">
                  {rank === 1 ? (
                    <Trophy className="h-4 w-4 text-amber-500" />
                  ) : (
                    <span className="text-xs font-semibold text-muted-foreground">{rank}</span>
                  )}
                </div>

                {/* Player name */}
                <span className={cn("flex-1 font-medium", isMe && "text-primary")}>
                  {row.playerName}
                  {isMe && <span className="ml-1.5 text-xs text-muted-foreground">(you)</span>}
                </span>

                {/* Rating */}
                <span className="w-14 text-right font-semibold tabular-nums">{row.rating}</span>

                {/* Games */}
                <span className="w-12 text-right text-muted-foreground tabular-nums">{row.gamesPlayed}</span>

                {/* Challenge button */}
                <div className="w-20 flex justify-end">
                  {!isMe && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2 text-xs gap-1"
                      disabled={challengeDisabled}
                      onClick={() => onChallenge({ id: row.playerId, name: row.playerName })}
                    >
                      <Swords className="h-3 w-3" />
                      Challenge
                    </Button>
                  )}
                </div>
              </div>
              {index < ratings.length - 1 && <div className="border-t mx-4" />}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
