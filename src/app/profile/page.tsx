"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { User, Trophy, Target, Clock, CalendarClock, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MatchCard } from "@/components/matches/match-card";
import { LeagueScoreDialog } from "@/components/league/league-score-dialog";
import { useCurrentUser } from "@/lib/current-user";
import { getService } from "@/lib/services";
import type { Match, LeagueRating } from "@/lib/types";

export default function ProfilePage() {
  const currentUser = useCurrentUser();
  const service = getService();
  const [myMatches, setMyMatches] = useState<Match[]>([]);
  const [remaining, setRemaining] = useState<{ player1Id: string; player2Id: string }[]>([]);
  const [playerNames, setPlayerNames] = useState<Map<string, string>>(new Map());
  const [assignments, setAssignments] = useState<{ categoryId: string; groupLabel: string }[]>([]);
  const [categoryNames, setCategoryNames] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [leagueRating, setLeagueRating] = useState<LeagueRating | null>(null);
  const [leagueMatches, setLeagueMatches] = useState<Match[]>([]);
  const [activeSeason, setActiveSeason] = useState<{ id: string } | null>(null);
  const [allPlayers, setAllPlayers] = useState<{ id: string; name: string }[]>([]);
  const [scoreEntry, setScoreEntry] = useState<{ matchId: string; opponent: { id: string; name: string } } | null>(null);
  const [logMatchOpen, setLogMatchOpen] = useState(false);

  const load = useCallback(async () => {
    const [[matches, allNames, cats, myAssignments], [rating, lMatches, seasons, ratings]] = await Promise.all([
      Promise.all([
        service.getPlayerMatches(currentUser.id),
        service.getAllPlayerNames(),
        service.getCategories(),
        service.getPlayerAssignments(currentUser.id),
      ]),
      Promise.all([
        service.getPlayerLeagueRating(currentUser.id),
        service.getLeagueMatches(currentUser.id),
        service.getLeagueSeasons(),
        service.getLeagueRatings(),
      ]),
    ]);

    setMyMatches(matches);
    setPlayerNames(allNames);
    setAssignments(myAssignments);
    setCategoryNames(new Map(cats.map((c) => [c.id, c.name])));
    setLeagueRating(rating);
    setLeagueMatches(lMatches);
    const active = seasons.find((s) => s.status === "active") ?? null;
    setActiveSeason(active ? { id: active.id } : null);
    setAllPlayers(ratings.map((r) => ({ id: r.playerId, name: r.playerName })));

    const fixtureSets = await Promise.all(
      myAssignments.map(async (assignment) => {
        const nameMap = await service.getPlayerNameMap(assignment.categoryId, assignment.groupLabel);
        const ids = [...nameMap.keys()];
        const fixtures = await service.getRemainingFixtures(ids, assignment.categoryId, assignment.groupLabel);
        return fixtures.filter((f) => f.player1Id === currentUser.id || f.player2Id === currentUser.id);
      })
    );
    setRemaining(fixtureSets.flat());
  }, [currentUser.id]);

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [load]);

  const tournamentCompleted = myMatches.filter((m) => m.status === "completed" && m.matchType !== "league");
  const tournamentIncomplete = myMatches.filter((m) => m.status === "incomplete" && m.matchType !== "league");
  const leagueCompleted = leagueMatches.filter((m) => m.status === "completed");
  const leagueIncomplete = leagueMatches.filter((m) => m.status === "incomplete");

  const allCompleted = [...tournamentCompleted, ...leagueCompleted];
  const allIncomplete = [...tournamentIncomplete, ...leagueIncomplete];
  const allToPlay = remaining; // tournament fixtures yet to be played

  const primaryAssignment = assignments[0];
  const categoryLabel = primaryAssignment
    ? `${categoryNames.get(primaryAssignment.categoryId) ?? primaryAssignment.categoryId} · Group ${primaryAssignment.groupLabel}`
    : "No group assigned";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
        Loading...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <User className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{currentUser.name}</h1>
          <p className="text-sm text-muted-foreground">{categoryLabel}</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        <Card>
          <CardContent className="flex flex-col items-center py-3">
            <Trophy className="h-4 w-4 text-primary mb-1" />
            <span className="text-xl font-bold">{allCompleted.filter((m) => m.winnerId === currentUser.id).length}</span>
            <span className="text-[10px] text-muted-foreground">Wins</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center py-3">
            <Target className="h-4 w-4 text-muted-foreground mb-1" />
            <span className="text-xl font-bold">{allCompleted.filter((m) => m.winnerId && m.winnerId !== currentUser.id).length}</span>
            <span className="text-[10px] text-muted-foreground">Losses</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center py-3">
            <Clock className="h-4 w-4 text-amber-500 mb-1" />
            <span className="text-xl font-bold">{allIncomplete.length}</span>
            <span className="text-[10px] text-muted-foreground">Incomplete</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center py-3">
            <CalendarClock className="h-4 w-4 text-blue-500 mb-1" />
            <span className="text-xl font-bold">{allToPlay.length}</span>
            <span className="text-[10px] text-muted-foreground">To Play</span>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">My Matches</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="upcoming">
            <div className="overflow-x-auto pb-1 mb-3">
              <TabsList>
                <TabsTrigger value="upcoming" className="text-xs whitespace-nowrap">
                  To Play ({allToPlay.length})
                </TabsTrigger>
                <TabsTrigger value="incomplete" className="text-xs whitespace-nowrap">
                  Incomplete ({allIncomplete.length})
                </TabsTrigger>
                <TabsTrigger value="completed" className="text-xs whitespace-nowrap">
                  Completed ({allCompleted.length})
                </TabsTrigger>
                <TabsTrigger value="all" className="text-xs whitespace-nowrap">
                  All ({allToPlay.length + allIncomplete.length + allCompleted.length + leagueMatches.filter((m) => m.status === "requested" || m.status === "confirmed").length})
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="upcoming">
              {activeSeason && (
                <button
                  onClick={() => setLogMatchOpen(true)}
                  className="w-full rounded-lg border border-dashed p-3 text-sm text-muted-foreground hover:border-primary/50 hover:text-primary hover:bg-primary/5 transition-colors text-center mb-3"
                >
                  + Log a league match
                </button>
              )}
              {allToPlay.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">No upcoming matches</div>
              ) : (
                <div className="space-y-2">
                  {allToPlay.map((f, i) => {
                    const opponentId = f.player1Id === currentUser.id ? f.player2Id : f.player1Id;
                    const assignment = assignments[0];
                    return (
                      <Link key={i} href={`/tournament/2026-summer/${assignment?.categoryId ?? "mens-singles"}`}>
                        <div className="flex items-center justify-between rounded-lg border border-dashed p-3 text-sm cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-[10px]">Tournament</Badge>
                            <span className="font-medium">{playerNames.get(opponentId) ?? opponentId}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Badge variant="outline" className="text-[10px]">Group {assignment?.groupLabel}</Badge>
                            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="incomplete">
              {allIncomplete.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">No incomplete matches</div>
              ) : (
                <div className="space-y-2">
                  {allIncomplete.map((match) => (
                    <MatchWithLabel
                      key={match.id}
                      match={match}
                      playerNames={playerNames}
                      categoryNames={categoryNames}
                      allPlayers={allPlayers}
                      currentUserId={currentUser.id}
                      onEnterScore={(matchId, opponent) => setScoreEntry({ matchId, opponent })}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="completed">
              {allCompleted.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">No completed matches</div>
              ) : (
                <div className="space-y-2">
                  {allCompleted.map((match) => (
                    <MatchWithLabel
                      key={match.id}
                      match={match}
                      playerNames={playerNames}
                      categoryNames={categoryNames}
                      allPlayers={allPlayers}
                      currentUserId={currentUser.id}
                      onEnterScore={(matchId, opponent) => setScoreEntry({ matchId, opponent })}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="all">
              {allToPlay.length === 0 && allIncomplete.length === 0 && allCompleted.length === 0 && leagueMatches.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">No matches yet</div>
              ) : (
                <div className="space-y-2">
                  {allToPlay.map((f, i) => {
                    const opponentId = f.player1Id === currentUser.id ? f.player2Id : f.player1Id;
                    const assignment = assignments[0];
                    return (
                      <Link key={`r-${i}`} href={`/tournament/2026-summer/${assignment?.categoryId ?? "mens-singles"}`}>
                        <div className="flex items-center justify-between rounded-lg border border-dashed p-3 text-sm cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-[10px]">Tournament</Badge>
                            <span className="font-medium">{playerNames.get(opponentId) ?? opponentId}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Badge variant="outline" className="text-[10px]">Group {assignment?.groupLabel}</Badge>
                            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                  {[...allIncomplete, ...allCompleted].map((match) => (
                    <MatchWithLabel
                      key={match.id}
                      match={match}
                      playerNames={playerNames}
                      categoryNames={categoryNames}
                      allPlayers={allPlayers}
                      currentUserId={currentUser.id}
                      onEnterScore={(matchId, opponent) => setScoreEntry({ matchId, opponent })}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">League Rating</CardTitle>
        </CardHeader>
        <CardContent>
          {leagueRating === null ? (
            <p className="text-sm text-muted-foreground">No league matches played yet</p>
          ) : (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Rating</span>
              <div className="flex items-center gap-3">
                <span className="font-semibold tabular-nums text-lg">{leagueRating.rating}</span>
                <span className="text-xs text-muted-foreground">{leagueRating.gamesPlayed} games</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <LeagueScoreDialog
        open={!!scoreEntry}
        onClose={() => setScoreEntry(null)}
        onSuccess={() => { setScoreEntry(null); load(); }}
        seasonId={activeSeason?.id ?? ""}
        currentUser={{ id: currentUser.id, name: currentUser.name }}
        matchId={scoreEntry?.matchId}
        opponent={scoreEntry?.opponent}
      />
      <LeagueScoreDialog
        open={logMatchOpen}
        onClose={() => setLogMatchOpen(false)}
        onSuccess={() => { setLogMatchOpen(false); load(); }}
        seasonId={activeSeason?.id ?? ""}
        currentUser={{ id: currentUser.id, name: currentUser.name }}
        enrolledPlayers={allPlayers}
      />
    </div>
  );
}

function MatchWithLabel({
  match,
  playerNames,
  categoryNames,
  allPlayers,
  currentUserId,
  onEnterScore,
}: {
  match: Match;
  playerNames: Map<string, string>;
  categoryNames: Map<string, string>;
  allPlayers: { id: string; name: string }[];
  currentUserId: string;
  onEnterScore: (matchId: string, opponent: { id: string; name: string }) => void;
}) {
  const isLeague = match.matchType === "league";
  const opponentId = match.player1Id === currentUserId ? match.player2Id : match.player1Id;
  const opponentName = playerNames.get(opponentId) ?? allPlayers.find((p) => p.id === opponentId)?.name ?? opponentId;
  const isPending = match.status === "requested" || match.status === "confirmed" || match.status === "incomplete";
  const isCompleted = match.status === "completed";

  if (isLeague) {
    return (
      <div className="rounded-lg border p-3 text-sm space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px] text-primary border-primary/40">League</Badge>
            <span className="font-medium">{opponentName}</span>
          </div>
          <div className="flex items-center gap-2">
            {isPending && (
              <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-300">Pending</Badge>
            )}
            {isCompleted && match.winnerId && (
              <Badge
                variant="outline"
                className={match.winnerId === currentUserId ? "text-[10px] text-green-600 border-green-300" : "text-[10px] text-muted-foreground"}
              >
                {match.winnerId === currentUserId ? "Won" : "Lost"}
              </Badge>
            )}
          </div>
        </div>
        {isCompleted && match.sets.length > 0 && (
          <p className="text-xs text-muted-foreground">
            {match.sets.map((s) => `${s.player1Games}-${s.player2Games}`).join("  ")}
          </p>
        )}
        {isPending && match.status !== "incomplete" && (
          <button
            onClick={() => onEnterScore(match.id, { id: opponentId, name: opponentName })}
            className="text-xs font-medium text-primary hover:underline"
          >
            Enter score →
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-[10px]">Tournament</Badge>
        <Badge variant="outline" className="text-[10px]">
          {categoryNames.get(match.categoryId) ?? match.categoryId}
        </Badge>
        {match.groupLabel && match.groupLabel.length === 1 && (
          <span className="text-[10px] text-muted-foreground">Group {match.groupLabel}</span>
        )}
      </div>
      <MatchCard
        match={match}
        player1Name={playerNames.get(match.player1Id) ?? match.player1Id}
        player2Name={playerNames.get(match.player2Id) ?? match.player2Id}
      />
    </div>
  );
}
