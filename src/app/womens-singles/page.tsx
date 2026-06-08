"use client";

import { useState, useCallback, useEffect } from "react";
import { UserRound } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { StandingsTable } from "@/components/standings/standings-table";
import { MatchList } from "@/components/matches/match-card";
import { ScoreEntry, FixtureWithEntry } from "@/components/matches/score-entry";
import { KnockoutBracket, CandidatesList } from "@/components/bracket/knockout-bracket";
import { getService } from "@/lib/services";
import { useMatchStore, computeStandings, getPlayerNameMap, getRemainingFixtures } from "@/lib/match-store";
import { generateFinalBracket, advanceBracket } from "@/lib/bracket";
import type { BracketMatch } from "@/lib/bracket";
import { categories } from "@/lib/mock-data";
import type { SetScore, Match, Standing } from "@/lib/types";
import { useCurrentUser } from "@/lib/current-user";
import { RegistrationBanner } from "@/components/registration/registration-banner";
import type { Category } from "@/lib/types";

const womensCategory = categories.find((c) => c.id === "womens-singles")!;
const totalMatches = (womensCategory.groupSize * (womensCategory.groupSize - 1)) / 2;

export default function WomensSinglesPage() {
  const store = useMatchStore();
  const currentUser = useCurrentUser();
  const service = getService();

  const [selectedFixture, setSelectedFixture] = useState<{ p1: string; p2: string } | null>(null);
  const [resumingMatch, setResumingMatch] = useState<Match | null>(null);
  const [bracketState, setBracketState] = useState<BracketMatch | null>(null);
  const [serviceMatches, setServiceMatches] = useState<Match[]>([]);
  const [serviceStandings, setServiceStandings] = useState<Standing[]>([]);
  const [servicePlayerNames, setServicePlayerNames] = useState<Map<string, string>>(new Map());
  const [servicePlayerIds, setServicePlayerIds] = useState<string[]>([]);
  const [categoryData, setCategoryData] = useState<Category>(womensCategory);
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [, forceUpdate] = useState(0);

  const refresh = useCallback(async () => {
    const [allMatches, standings, nameMap, cat] = await Promise.all([
      service.getMatches("womens-singles"),
      service.getStandings("womens-singles", "A"),
      service.getPlayerNameMap("womens-singles", "A"),
      service.getCategory("womens-singles"),
    ]);
    setServiceMatches(allMatches);
    setServiceStandings(standings);
    setServicePlayerNames(nameMap);
    setServicePlayerIds([...nameMap.keys()]);
    if (cat) setCategoryData(cat);
    setLoaded(true);
  }, []);

  useEffect(() => {
    setLoading(true);
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  const playerNames = servicePlayerNames;
  const playerIds = servicePlayerIds;
  const matches = serviceMatches;
  const standings = serviceStandings;
  const remainingFixtures = getRemainingFixtures(playerIds, matches);
  const completedMatches = matches.filter((m) => m.status === "completed").length;
  const progress = (completedMatches / totalMatches) * 100;
  const groupComplete = completedMatches >= totalMatches;
  const adminClosed = store.closedGroups.has("womens-singles");
  const shouldLock = groupComplete || adminClosed;

  const lockedData = store.lockedBrackets.get("womens-singles");
  const isLocked = !!lockedData;
  if (shouldLock && !isLocked) {
    const finalBracket = generateFinalBracket(standings, "Women's Singles", false);
    store.lockBracket("womens-singles", finalBracket);
  }

  const bracket = isLocked ? advanceBracket(lockedData!.bracket) : generateFinalBracket(standings, "Women's Singles", true);
  const candidates = !isLocked ? standings.slice(0, 2).map((s, i) => ({
    slot: i === 0 ? "1st Place" : "2nd Place",
    playerName: s.playerName,
    points: s.points,
  })) : [];

  const lockedDataEarly = store.lockedBrackets.get("womens-singles");
  const adminClosedEarly = store.closedGroups.has("womens-singles");
  const [view, setView] = useState<"group" | "final">(lockedDataEarly || adminClosedEarly ? "final" : "group");

  const handleSubmit = useCallback(async (sets: SetScore[], winnerId: string) => {
    if (resumingMatch) {
      await service.completeMatch(resumingMatch.id, sets, winnerId);
      store.completeMatch(resumingMatch.id, sets, winnerId);
      setResumingMatch(null);
    } else if (selectedFixture) {
      await service.addMatch("womens-singles", "A", selectedFixture.p1, selectedFixture.p2, sets, winnerId);
      store.addMatch("womens-singles", "A", selectedFixture.p1, selectedFixture.p2, sets, winnerId);
      setSelectedFixture(null);
    }
    await refresh();
    forceUpdate((n) => n + 1);
  }, [service, store, selectedFixture, resumingMatch, refresh]);

  const handleSaveIncomplete = useCallback(async (sets: SetScore[]) => {
    if (resumingMatch) {
      await service.completeMatch(resumingMatch.id, sets, "");
      store.completeMatch(resumingMatch.id, sets, "");
      setResumingMatch(null);
    } else if (selectedFixture) {
      await service.saveIncompleteMatch("womens-singles", "A", selectedFixture.p1, selectedFixture.p2, sets);
      store.saveIncompleteMatch("womens-singles", "A", selectedFixture.p1, selectedFixture.p2, sets);
      setSelectedFixture(null);
    }
    await refresh();
    forceUpdate((n) => n + 1);
  }, [service, store, selectedFixture, resumingMatch, refresh]);

  const handleWalkover = useCallback(async (winnerId: string) => {
    if (!selectedFixture) return;
    const loserId = winnerId === selectedFixture.p1 ? selectedFixture.p2 : selectedFixture.p1;
    await service.awardWalkover("womens-singles", "A", winnerId, loserId);
    setSelectedFixture(null);
    await refresh();
    forceUpdate((n) => n + 1);
  }, [service, selectedFixture, refresh]);

  const handleResumeMatch = useCallback((match: Match) => { setResumingMatch(match); setSelectedFixture(null); }, []);
  const handleCancel = useCallback(() => { setSelectedFixture(null); setResumingMatch(null); setBracketState(null); }, []);
  const handleBracketMatchClick = useCallback((match: BracketMatch) => { if (match.status !== "ready" || !isLocked) return; setBracketState(match); }, [isLocked]);
  const handleBracketSubmit = useCallback(async (sets: SetScore[], winnerId: string) => {
    if (!bracketState) return;
    await service.updateBracketMatch("womens-singles", bracketState.id, sets, winnerId);
    setBracketState(null);
    refresh();
  }, [service, bracketState, refresh]);

  const scoreEntryActive = selectedFixture || resumingMatch;
  const scoreP1 = resumingMatch?.player1Id ?? selectedFixture?.p1 ?? "";
  const scoreP2 = resumingMatch?.player2Id ?? selectedFixture?.p2 ?? "";

  if (loading) return <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <UserRound className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">Women&apos;s Singles</h1>
          <p className="text-sm text-muted-foreground">7 players round-robin — Top 2 advance to final</p>
        </div>
        <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/10">
          {isLocked || adminClosed ? "Final" : "Group Stage"}
        </Badge>
      </div>

      <RegistrationBanner category={categoryData} />

      <Tabs value={view} onValueChange={(v) => { setView(v as "group" | "final"); handleCancel(); }}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="group" className="font-semibold">Group Stage</TabsTrigger>
          <TabsTrigger value="final" className="font-semibold">Final</TabsTrigger>
        </TabsList>

        <TabsContent value="group" className="space-y-4 mt-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{completedMatches} of {totalMatches} matches played</span>
            <span className="text-xs font-medium">Deadline: {new Date(womensCategory.groupDeadline).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>
          </div>
          <Progress value={progress} className="h-1.5" />

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Standings</CardTitle></CardHeader>
            <CardContent><StandingsTable standings={standings} advancementSlots={womensCategory.advancementSlots} /></CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Match Results</CardTitle></CardHeader>
            <CardContent><MatchList matches={matches} playerNames={playerNames} onResumeMatch={handleResumeMatch} /></CardContent>
          </Card>

          {scoreEntryActive && (
            <ScoreEntry player1Id={scoreP1} player2Id={scoreP2} player1Name={playerNames.get(scoreP1) ?? ""} player2Name={playerNames.get(scoreP2) ?? ""} onSubmit={handleSubmit} onSaveIncomplete={handleSaveIncomplete} onCancel={handleCancel} initialSets={resumingMatch?.sets} onWalkover={currentUser.isAdmin && selectedFixture ? handleWalkover : undefined} />
          )}

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">Remaining Fixtures</CardTitle>
                <Badge variant="outline" className="text-xs">{remainingFixtures.length} left</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {remainingFixtures.length === 0 ? (
                <div className="py-8 text-center"><Badge className="bg-primary/10 text-primary border-primary/20">All matches completed</Badge></div>
              ) : (
                <div className="space-y-2">
                  {remainingFixtures.map((f, i) => (
                    <FixtureWithEntry key={i} player1Id={f.player1Id} player2Id={f.player2Id} player1Name={playerNames.get(f.player1Id) ?? ""} player2Name={playerNames.get(f.player2Id) ?? ""} canEnter={currentUser.isAdmin || f.player1Id === currentUser.id || f.player2Id === currentUser.id} onSelectFixture={(p1, p2) => { setSelectedFixture({ p1, p2 }); setResumingMatch(null); }} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="final" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Final</CardTitle>
              {!isLocked && <p className="text-[11px] text-muted-foreground mt-1">Final will be set once all group matches are completed.</p>}
              {isLocked && <p className="text-[11px] text-muted-foreground mt-1">Group stage complete — tap to enter the final result.</p>}
            </CardHeader>
            <CardContent><KnockoutBracket bracket={bracket} isLocked={isLocked} onMatchClick={handleBracketMatchClick} /></CardContent>
          </Card>

          {!isLocked && candidates.length > 0 && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Current Leaders</CardTitle></CardHeader>
              <CardContent><CandidatesList candidates={candidates} /></CardContent>
            </Card>
          )}

          {bracketState && isLocked && (
            <ScoreEntry player1Id={bracketState.player1Id!} player2Id={bracketState.player2Id!} player1Name={bracketState.player1Name ?? ""} player2Name={bracketState.player2Name ?? ""} onSubmit={handleBracketSubmit} onCancel={() => setBracketState(null)} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
