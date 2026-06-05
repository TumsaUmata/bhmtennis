"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { User, Trophy, Target, Clock, CalendarClock, ChevronRight, Medal } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MatchCard } from "@/components/matches/match-card";
import { LeagueScoreDialog } from "@/components/league/league-score-dialog";
import { useCurrentUser } from "@/lib/current-user";
import { getService } from "@/lib/services";
import type { Match, LeagueRating } from "@/lib/types";

type CategoryId = "mens-singles" | "womens-singles" | "mixed-doubles";

const LEAGUE_CATEGORIES: { id: CategoryId; label: string }[] = [
  { id: "mens-singles", label: "Men's Singles" },
  { id: "womens-singles", label: "Women's" },
  { id: "mixed-doubles", label: "Doubles" },
];

export default function ProfilePage() {
  const currentUser = useCurrentUser();
  const service = getService();
  const [tab, setTab] = useState("upcoming");
  const [myMatches, setMyMatches] = useState<Match[]>([]);
  const [remaining, setRemaining] = useState<{ player1Id: string; player2Id: string }[]>([]);
  const [playerNames, setPlayerNames] = useState<Map<string, string>>(new Map());
  const [assignments, setAssignments] = useState<{ categoryId: string; groupLabel: string }[]>([]);
  const [categoryNames, setCategoryNames] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);

  // League state
  const [leagueRating, setLeagueRating] = useState<LeagueRating | null>(null);
  const [leagueMatches, setLeagueMatches] = useState<Match[]>([]);
  const [activeSeason, setActiveSeason] = useState<{ id: string } | null>(null);
  const [allPlayers, setAllPlayers] = useState<{ id: string; name: string }[]>([]);
  const [scoreEntry, setScoreEntry] = useState<{ matchId: string; opponent: { id: string; name: string } } | null>(null);
  const [logMatchOpen, setLogMatchOpen] = useState(false);

  const load = useCallback(async () => {
    const [matches, allNames, cats, myAssignments] = await Promise.all([
      service.getPlayerMatches(currentUser.id),
      service.getAllPlayerNames(),
      service.getCategories(),
      service.getPlayerAssignments(currentUser.id),
    ]);

    setMyMatches(matches);
    setPlayerNames(allNames);
    setAssignments(myAssignments);
    setCategoryNames(new Map(cats.map((c) => [c.id, c.name])));

    // Compute remaining fixtures for each category the player is in
    const allRemaining: { player1Id: string; player2Id: string }[] = [];
    for (const assignment of myAssignments) {
      const nameMap = await service.getPlayerNameMap(assignment.categoryId, assignment.groupLabel);
      const ids = [...nameMap.keys()];
      const fixtures = await service.getRemainingFixtures(ids, assignment.categoryId, assignment.groupLabel);
      const mine = fixtures.filter((f) => f.player1Id === currentUser.id || f.player2Id === currentUser.id);
      allRemaining.push(...mine);
    }
    setRemaining(allRemaining);

    // Load league data in parallel
    const [rating, lMatches, seasons, ratings] = await Promise.all([
      service.getPlayerLeagueRating(currentUser.id),
      service.getLeagueMatches(currentUser.id),
      service.getLeagueSeasons(),
      service.getLeagueRatings(),
    ]);
    setLeagueRating(rating);
    setLeagueMatches(lMatches);
    const active = seasons.find((s) => s.status === "active") ?? null;
    setActiveSeason(active ? { id: active.id } : null);
    setAllPlayers(ratings.map((r) => ({ id: r.playerId, name: r.playerName })));
  }, [currentUser.id]);

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [load]);

  const completed = myMatches.filter((m) => m.status === "completed");
  const incomplete = myMatches.filter((m) => m.status === "incomplete");

  const primaryAssignment = assignments[0];
  const categoryLabel = primaryAssignment
    ? `${categoryNames.get(primaryAssignment.categoryId) ?? primaryAssignment.categoryId} · Group ${primaryAssignment.groupLabel}`
    : "No group assigned";

  const hasAnyLeagueRating = leagueRating !== null;

  if (loading) {
    return <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">Loading...</div>;
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
            <span className="text-xl font-bold">{completed.filter((m) => m.winnerId === currentUser.id).length}</span>
            <span className="text-[10px] text-muted-foreground">Wins</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center py-3">
            <Target className="h-4 w-4 text-muted-foreground mb-1" />
            <span className="text-xl font-bold">{completed.filter((m) => m.winnerId && m.winnerId !== currentUser.id).length}</span>
            <span className="text-[10px] text-muted-foreground">Losses</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center py-3">
            <Clock className="h-4 w-4 text-amber-500 mb-1" />
            <span className="text-xl font-bold">{incomplete.length}</span>
            <span className="text-[10px] text-muted-foreground">Incomplete</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center py-3">
            <CalendarClock className="h-4 w-4 text-blue-500 mb-1" />
            <span className="text-xl font-bold">{remaining.length}</span>
            <span className="text-[10px] text-muted-foreground">To Play</span>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">My Matches</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="grid w-full grid-cols-5 mb-3">
              <TabsTrigger value="upcoming" className="text-xs">To Play ({remaining.length})</TabsTrigger>
              <TabsTrigger value="incomplete" className="text-xs">Incomplete ({incomplete.length})</TabsTrigger>
              <TabsTrigger value="completed" className="text-xs">Completed ({completed.length})</TabsTrigger>
              <TabsTrigger value="all" className="text-xs">All ({myMatches.length + remaining.length})</TabsTrigger>
              <TabsTrigger value="league" className="text-xs">League ({leagueMatches.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="upcoming">
              {remaining.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">All group matches played</div>
              ) : (
                <div className="space-y-2">
                  {remaining.map((f, i) => {
                    const opponentId = f.player1Id === currentUser.id ? f.player2Id : f.player1Id;
                    const assignment = assignments.find((a) => true) ?? assignments[0];
                    return (
                      <Link key={i} href={`/tournament/2026-summer/${assignment?.categoryId ?? "mens-singles"}`}>
                        <div className="flex items-center justify-between rounded-lg border border-dashed p-3 text-sm cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors">
                          <span className="font-medium">{playerNames.get(opponentId) ?? opponentId}</span>
                          <div className="flex items-center gap-1.5">
                            <Badge variant="outline" className="text-[10px]">
                              Group {assignment?.groupLabel}
                            </Badge>
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
              {incomplete.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">No incomplete matches</div>
              ) : (
                <div className="space-y-2">
                  {incomplete.map((match) => (
                    <MatchWithCategory key={match.id} match={match} playerNames={playerNames} categoryNames={categoryNames} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="completed">
              {completed.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">No completed matches</div>
              ) : (
                <div className="space-y-2">
                  {completed.map((match) => (
                    <MatchWithCategory key={match.id} match={match} playerNames={playerNames} categoryNames={categoryNames} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="all">
              {remaining.length > 0 && (
                <div className="space-y-2 mb-3">
                  <p className="text-xs font-medium text-muted-foreground">To Play</p>
                  {remaining.map((f, i) => {
                    const opponentId = f.player1Id === currentUser.id ? f.player2Id : f.player1Id;
                    const assignment = assignments[0];
                    return (
                      <Link key={`u-${i}`} href={`/tournament/2026-summer/${assignment?.categoryId ?? "mens-singles"}`}>
                        <div className="flex items-center justify-between rounded-lg border border-dashed p-3 text-sm cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors">
                          <span className="font-medium">{playerNames.get(opponentId) ?? opponentId}</span>
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
              {incomplete.length > 0 && (
                <div className="space-y-2 mb-3">
                  <p className="text-xs font-medium text-muted-foreground">Incomplete</p>
                  {incomplete.map((match) => (
                    <MatchWithCategory key={match.id} match={match} playerNames={playerNames} categoryNames={categoryNames} />
                  ))}
                </div>
              )}
              {completed.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Completed</p>
                  {completed.map((match) => (
                    <MatchWithCategory key={match.id} match={match} playerNames={playerNames} categoryNames={categoryNames} />
                  ))}
                </div>
              )}
              {remaining.length === 0 && myMatches.length === 0 && (
                <div className="py-8 text-center text-sm text-muted-foreground">No matches yet</div>
              )}
            </TabsContent>

            <TabsContent value="league">
              <div className="space-y-3">
                {activeSeason && (
                  <button
                    onClick={() => setLogMatchOpen(true)}
                    className="w-full rounded-lg border border-dashed p-3 text-sm text-muted-foreground hover:border-primary/50 hover:text-primary hover:bg-primary/5 transition-colors text-center"
                  >
                    + Log a match we already played
                  </button>
                )}
                {leagueMatches.length === 0 ? (
                  <div className="py-6 text-center text-sm text-muted-foreground">No league matches yet</div>
                ) : (
                  leagueMatches.map((match) => {
                    const opponentId = match.player1Id === currentUser.id ? match.player2Id : match.player1Id;
                    const opponentName = playerNames.get(opponentId) ?? allPlayers.find(p => p.id === opponentId)?.name ?? opponentId;
                    const isPending = match.status === "requested" || match.status === "confirmed";
                    const isCompleted = match.status === "completed";

                    return (
                      <div key={match.id} className="rounded-lg border p-3 text-sm space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{opponentName}</span>
                          <div className="flex items-center gap-2">
                            {isPending && (
                              <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-300">Pending</Badge>
                            )}
                            {isCompleted && match.winnerId && (
                              <Badge variant="outline" className={
                                match.winnerId === currentUser.id
                                  ? "text-[10px] text-green-600 border-green-300"
                                  : "text-[10px] text-muted-foreground"
                              }>
                                {match.winnerId === currentUser.id ? "Won" : "Lost"}
                              </Badge>
                            )}
                          </div>
                        </div>
                        {isCompleted && match.sets.length > 0 && (
                          <p className="text-xs text-muted-foreground">
                            {match.sets.map((s) => `${s.player1Games}-${s.player2Games}`).join("  ")}
                          </p>
                        )}
                        {isPending && (
                          <button
                            onClick={() => setScoreEntry({ matchId: match.id, opponent: { id: opponentId, name: opponentName } })}
                            className="text-xs font-medium text-primary hover:underline"
                          >
                            Enter score →
                          </button>
                        )}
                        {match.playedAt && isCompleted && (
                          <p className="text-xs text-muted-foreground">{new Date(match.playedAt).toLocaleDateString("en-GB")}</p>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* League Ratings card */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Medal className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-semibold">League Ratings</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {!hasAnyLeagueRating ? (
            <p className="text-sm text-muted-foreground">No league matches played yet</p>
          ) : (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Rating</span>
              <div className="flex items-center gap-3">
                <span className="font-semibold tabular-nums text-lg">{leagueRating!.rating}</span>
                <span className="text-xs text-muted-foreground">{leagueRating!.gamesPlayed} games</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* League score dialogs */}
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

function MatchWithCategory({
  match,
  playerNames,
  categoryNames,
}: {
  match: Match;
  playerNames: Map<string, string>;
  categoryNames: Map<string, string>;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
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
