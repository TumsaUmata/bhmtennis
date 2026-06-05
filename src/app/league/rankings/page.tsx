"use client";

import { useState, useEffect, useCallback } from "react";
import { Medal, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LeagueLeaderboard } from "@/components/league/league-leaderboard";
import { ChallengeDialog } from "@/components/league/challenge-dialog";
import { LeagueScoreDialog } from "@/components/league/league-score-dialog";
import { getService } from "@/lib/services";
import { useCurrentUser, isGuest } from "@/lib/current-user";
import type { LeagueSeason } from "@/lib/types";

interface RatingRow {
  playerId: string;
  playerName: string;
  rating: number;
  gamesPlayed: number;
}

export default function LeagueRankingsPage() {
  const currentUser = useCurrentUser();
  const [loaded, setLoaded] = useState(false);
  const [activeSeason, setActiveSeason] = useState<LeagueSeason | null>(null);
  const [ratings, setRatings] = useState<RatingRow[]>([]);
  const [myEnrollment, setMyEnrollment] = useState<{ optedOut: boolean } | null>(null);
  const [enrollmentBusy, setEnrollmentBusy] = useState(false);
  const [challengeOpponent, setChallengeOpponent] = useState<{ id: string; name: string } | null>(null);
  const [logMatchOpen, setLogMatchOpen] = useState(false);

  const load = useCallback(async () => {
    setLoaded(false);
    try {
      const [allSeasons, ratingsData] = await Promise.all([
        getService().getLeagueSeasons(),
        getService().getLeagueRatings(),
      ]);

      const active = allSeasons.find((s) => s.status === "active") ?? null;
      setActiveSeason(active);
      setRatings(ratingsData);

      if (active && !isGuest(currentUser)) {
        const enrollments = await getService().getSeasonEnrollments(active.id);
        const mine = enrollments.find((e) => e.playerId === currentUser.id);
        setMyEnrollment(mine ? { optedOut: mine.optedOut } : null);
      } else {
        setMyEnrollment(null);
      }
    } finally {
      setLoaded(true);
    }
  }, [currentUser]);

  useEffect(() => { load(); }, [load]);

  async function handleOptOut() {
    if (!activeSeason || isGuest(currentUser)) return;
    setEnrollmentBusy(true);
    try {
      await getService().optOutOfSeason(currentUser.id, activeSeason.id);
      setMyEnrollment({ optedOut: true });
    } finally { setEnrollmentBusy(false); }
  }

  async function handleOptIn() {
    if (!activeSeason || isGuest(currentUser)) return;
    setEnrollmentBusy(true);
    try {
      await getService().optBackIntoSeason(currentUser.id, activeSeason.id);
      setMyEnrollment({ optedOut: false });
    } finally { setEnrollmentBusy(false); }
  }

  const challengeDisabled = isGuest(currentUser) || (myEnrollment?.optedOut ?? true) || !activeSeason;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <Medal className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">BHM League</h1>
          <p className="text-sm text-muted-foreground">Challenge-based ratings league — everyone plays everyone</p>
        </div>
      </div>

      {!loaded ? (
        <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">Loading…</div>
      ) : !activeSeason ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <Medal className="h-7 w-7 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium">No active season</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                The league runs in seasons. An admin will open the first season when ready.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">{activeSeason.name}</CardTitle>
                <Badge className="bg-primary/10 text-primary border-primary/20">Active</Badge>
              </div>
            </CardHeader>
          </Card>

          <LeagueLeaderboard
            ratings={ratings}
            currentUserId={currentUser.id}
            onChallenge={setChallengeOpponent}
            challengeDisabled={challengeDisabled}
          />

          {!isGuest(currentUser) && !challengeDisabled && (
            <Button size="sm" variant="outline" className="w-full" onClick={() => setLogMatchOpen(true)}>
              Log a match we already played
            </Button>
          )}

          {!isGuest(currentUser) && myEnrollment !== null && (
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">
                  {myEnrollment.optedOut ? "You have opted out of this season" : "You are enrolled in this season"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {myEnrollment.optedOut
                    ? "Opt back in to participate in league matches."
                    : "You will be included in league rankings and matchmaking."}
                </p>
              </div>
              {myEnrollment.optedOut ? (
                <Button size="sm" onClick={handleOptIn} disabled={enrollmentBusy}>
                  {enrollmentBusy ? "Updating…" : "Opt back in"}
                </Button>
              ) : (
                <Button size="sm" variant="outline" onClick={handleOptOut} disabled={enrollmentBusy}>
                  {enrollmentBusy ? "Updating…" : "Opt out"}
                </Button>
              )}
            </div>
          )}
        </>
      )}

      <ChallengeDialog
        opponent={challengeOpponent}
        seasonId={activeSeason?.id ?? ""}
        onClose={() => setChallengeOpponent(null)}
        onSuccess={load}
      />

      <LeagueScoreDialog
        open={logMatchOpen}
        onClose={() => setLogMatchOpen(false)}
        onSuccess={load}
        seasonId={activeSeason?.id ?? ""}
        currentUser={{ id: currentUser.id, name: currentUser.name }}
        enrolledPlayers={ratings.map((r) => ({ id: r.playerId, name: r.playerName }))}
      />

      <Card>
        <CardContent className="py-4 space-y-3">
          <p className="text-sm font-medium">How it works</p>
          <div className="space-y-2 text-sm text-muted-foreground">
            {[
              "Challenge any player in the league at any time — no category restrictions",
              "Win points based on your opponent's rating. Beating a higher-rated player earns more.",
              "Stay active — inactive players drop in the standings as others play",
            ].map((text) => (
              <div key={text} className="flex items-start gap-2">
                <ChevronRight className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                <span>{text}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
