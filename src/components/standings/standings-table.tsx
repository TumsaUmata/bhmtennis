"use client";

import { Standing } from "@/lib/types";
import { cn } from "@/lib/utils";

interface StandingsTableProps {
  standings: Standing[];
  advancementSlots: number;
}

export function StandingsTable({ standings, advancementSlots }: StandingsTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-xs text-muted-foreground">
            <th className="pb-2 pr-2 font-medium">#</th>
            <th className="pb-2 pr-4 font-medium">Player</th>
            <th className="pb-2 px-2 font-medium text-center">P</th>
            <th className="pb-2 px-2 font-medium text-center">W</th>
            <th className="pb-2 px-2 font-medium text-center">L</th>
            <th className="pb-2 px-2 font-medium text-center">Pts</th>
            <th className="pb-2 px-2 font-medium text-center">Sets</th>
            <th className="pb-2 pl-2 font-medium text-center hidden sm:table-cell">Games</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((s, i) => {
            const isQualifying = i < advancementSlots;
            const setDiff = s.setsWon - s.setsLost;
            const gameDiff = s.gamesWon - s.gamesLost;

            return (
              <tr
                key={s.playerId}
                className={cn(
                  "border-b last:border-0 transition-colors",
                  isQualifying && "bg-primary/5"
                )}
              >
                <td className="py-2.5 pr-2">
                  <span
                    className={cn(
                      "inline-flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold",
                      isQualifying
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground"
                    )}
                  >
                    {i + 1}
                  </span>
                </td>
                <td className="py-2.5 pr-4 font-medium truncate max-w-[120px] sm:max-w-none">
                  {s.playerName}
                </td>
                <td className="py-2.5 px-2 text-center text-muted-foreground">
                  {s.played}
                </td>
                <td className="py-2.5 px-2 text-center font-medium text-primary">
                  {s.wins}
                </td>
                <td className="py-2.5 px-2 text-center text-muted-foreground">
                  {s.losses}
                </td>
                <td className="py-2.5 px-2 text-center font-bold">
                  {s.points}
                </td>
                <td className="py-2.5 px-2 text-center text-xs">
                  <span className="text-muted-foreground">
                    {s.setsWon}-{s.setsLost}
                  </span>
                  <span className={cn(
                    "ml-1 font-medium",
                    setDiff > 0 ? "text-primary" : setDiff < 0 ? "text-destructive" : "text-muted-foreground"
                  )}>
                    ({setDiff > 0 ? "+" : ""}{setDiff})
                  </span>
                </td>
                <td className="py-2.5 pl-2 text-center text-xs hidden sm:table-cell">
                  <span className="text-muted-foreground">
                    {s.gamesWon}-{s.gamesLost}
                  </span>
                  <span className={cn(
                    "ml-1 font-medium",
                    gameDiff > 0 ? "text-primary" : gameDiff < 0 ? "text-destructive" : "text-muted-foreground"
                  )}>
                    ({gameDiff > 0 ? "+" : ""}{gameDiff})
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
