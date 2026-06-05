"use client";

import { useState, useCallback, useEffect } from "react";
import { Users } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { StandingsTable } from "@/components/standings/standings-table";
import { MatchList } from "@/components/matches/match-card";
import { ScoreEntry, FixtureWithEntry } from "@/components/matches/score-entry";
import { KnockoutBracket, CandidatesList } from "@/components/bracket/knockout-bracket";
import { getService } from "@/lib/services";
import { useMatchStore, computeStandings, getMensGroupPlayers, getPlayerNameMap, getRemainingFixtures } from "@/lib/match-store";
import { generateMensBracket, advanceBracket, isGroupStageComplete } from "@/lib/bracket";
import type { BracketMatch } from "@/lib/bracket";
import { categories } from "@/lib/mock-data";
import type { SetScore, Match, Standing } from "@/lib/types";
import { useCurrentUser } from "@/lib/current-user";
import { RegistrationBanner } from "@/components/registration/registration-banner";
import type { Category } from "@/lib/types";

const groups = ["A", "B", "C", "D"];
const mensCategory = categories.find((c) => c.id === "mens-singles")!;
const totalMatchesPerGroup = (mensCategory.groupSize * (mensCategory.groupSize - 1)) / 2;

export default function MensSinglesPage() {
  const store = useMatchStore();
  const currentUser = useCurrentUser();
  const service = getService();

  const [view, setView] = useState<"groups" | "knockout">("groups");
  const [activeGroup, setActiveGroup] = useState("A");
  const [selectedFixture, setSelectedFixture] = useState<{ p1: string; p2: string } | null>(null);
  const [resumingMatch, setResumingMatch] = useState<Match | null>(null);
  const [bracketState, setBracketState] = useState<BracketMatch | null>(null);
  const [serviceMatches, setServiceMatches] = useState<Match[]>([]);
  const [serviceStandings, setServiceStandings] = useState<Record<string, Standing[]>>({});
  const [servicePlayerNames, setServicePlayerNames] = useState<Record<string, Map<string, string>>>({});
  const [servicePlayerIds, setServicePlayerIds] = useState<Record<string, string[]>>({});
  const [categoryData, setCategoryData] = useState<Category>(mensCategory);
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [, forceUpdate] = useState(0);

  const refresh = useCallback(async () => {
    const [allMatches, cat, ...rest] = await Promise.all([
      service.getMatches("mens-singles"),
      service.getCategory("mens-singles"),
      ...groups.flatMap((g) => [
        service.getStandings("mens-singles", g),
        service.getPlayerNameMap("mens-singles", g),
      ]),
    ]);
    setServiceMatches(allMatches);
    if (cat) setCategoryData(cat);

    const standings: Record<string, Standing[]> = {};
    const playerNames: Record<string, Map<string, string>> = {};
    const playerIds: Record<string, string[]> = {};
    groups.forEach((g, i) => {
      standings[g] = rest[i * 2] as Standing[];
      const nameMap = rest[i * 2 + 1] as Map<string, string>;
      playerNames[g] = nameMap;
      playerIds[g] = [...nameMap.keys()];
    });
    setServiceStandings(standings);
    setServicePlayerNames(playerNames);
    setServicePlayerIds(playerIds);
    setLoaded(true);
  }, []);

  useEffect(() => {
    setLoading(true);
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  const allMatches = serviceMatches;
  const groupMatches = allMatches.filter((m) => m.groupLabel === activeGroup);
  const allGroupStandings: Record<string, Standing[]> = serviceStandings;
  const standings = allGroupStandings[activeGroup] ?? [];
  const playerNames = servicePlayerNames[activeGroup] ?? new Map();
  const playerIds = servicePlayerIds[activeGroup] ?? [];
  const remainingFixtures = getRemainingFixtures(playerIds, groupMatches);
  const completedInGroup = groupMatches.filter((m) => m.status === "completed").length;
  const progress = (completedInGroup / totalMatchesPerGroup) * 100;

  const completedByGroup: Record<string, number> = {};
  for (const g of groups) {
    completedByGroup[g] = serviceMatches.filter((m) => m.groupLabel === g && m.status === "completed").length;
  }
  const groupComplete = isGroupStageComplete(totalMatchesPerGroup, 4, completedByGroup);
  const adminClosed = store.closedGroups.has("mens-singles");
  const shouldLock = groupComplete || adminClosed;

  const lockedData = store.lockedBrackets.get("mens-singles");
  const isLocked = !!lockedData;
  if (shouldLock && !isLocked) {
    const finalBracket = generateMensBracket(allGroupStandings, false);
    store.lockBracket("mens-singles", finalBracket);
  }

  const bracket = isLocked ? advanceBracket(lockedData!.bracket) : generateMensBracket(allGroupStandings, true);
  const candidates = !isLocked
    ? groups.flatMap((g) => (allGroupStandings[g]?.slice(0, 2) ?? []).map((s, i) => ({
        slot: `${i === 0 ? "1st" : "2nd"} Group ${g}`,
        playerName: s.playerName,
        points: s.points,
      })))
    : [];

  const lockedDataEarly = store.lockedBrackets.get("mens-singles");
  const adminClosedEarly = store.closedGroups.has("mens-singles");
  useEffect(() => {
    if (lockedDataEarly || adminClosedEarly) setView("knockout");
  }, []);

  const handleSubmit = useCallback(async (sets: SetScore[], winnerId: string) => {
    if (resumingMatch) {
      await service.completeMatch(resumingMatch.id, sets, winnerId);
      store.completeMatch(resumingMatch.id, sets, winnerId);
      setResumingMatch(null);
    } else if (selectedFixture) {
      const newMatch = await service.addMatch("mens-singles", activeGroup, selectedFixture.p1, selectedFixture.p2, sets, winnerId);
      store.addMatch("mens-singles", activeGroup, selectedFixture.p1, selectedFixture.p2, sets, winnerId);
      setSelectedFixture(null);
    }
    await refresh();
    forceUpdate((n) => n + 1);
  }, [service, store, selectedFixture, resumingMatch, activeGroup, refresh]);

  const handleSaveIncomplete = useCallback(async (sets: SetScore[]) => {
    if (resumingMatch) {
      await service.completeMatch(resumingMatch.id, sets, "");
      store.completeMatch(resumingMatch.id, sets, "");
      setResumingMatch(null);
    } else if (selectedFixture) {
      await service.saveIncompleteMatch("mens-singles", activeGroup, selectedFixture.p1, selectedFixture.p2, sets);
      store.saveIncompleteMatch("mens-singles", activeGroup, selectedFixture.p1, selectedFixture.p2, sets);
      setSelectedFixture(null);
    }
    await refresh();
    forceUpdate((n) => n + 1);
  }, [service, store, selectedFixture, resumingMatch, activeGroup, refresh]);

  const handleResumeMatch = useCallback((match: Match) => {
    setResumingMatch(match);
    setSelectedFixture(null);
    setBracketState(null);
  }, []);

  const handleCancel = useCallback(() => {
    setSelectedFixture(null);
    setResumingMatch(null);
    setBracketState(null);
  }, []);

  const handleBracketMatchClick = useCallback((match: BracketMatch) => {
    if (match.status !== "ready" || !isLocked) return;
    setBracketState(match);
    setSelectedFixture(null);
    setResumingMatch(null);
  }, [isLocked]);

  const handleBracketSubmit = useCallback(async (sets: SetScore[], winnerId: string) => {
    if (!bracketState) return;
    store.updateBracketMatch("mens-singles", bracketState.id, sets, winnerId);
    setBracketState(null);
    forceUpdate((n) => n + 1);
  }, [store, bracketState]);

  const scoreEntryActive = selectedFixture || resumingMatch;
  const scoreP1 = resumingMatch?.player1Id ?? selectedFixture?.p1 ?? "";
  const scoreP2 = resumingMatch?.player2Id ?? selectedFixture?.p2 ?? "";

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
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <Users className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">Men&apos;s Singles</h1>
          <p className="text-sm text-muted-foreground">4 groups of 6 — Top 2 advance to quarterfinals</p>
        </div>
        <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/10">
          {isLocked || adminClosed ? "Knockout" : "Group Stage"}
        </Badge>
      </div>

      <RegistrationBanner category={categoryData} />

      <Tabs value={view} onValueChange={(v) => { setView(v as "groups" | "knockout"); handleCancel(); }}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="groups" className="font-semibold">Groups</TabsTrigger>
          <TabsTrigger value="knockout" className="font-semibold">Knockout</TabsTrigger>
        </TabsList>

        <TabsContent value="groups" className="space-y-4 mt-4">
          <Tabs value={activeGroup} onValueChange={(v) => { setActiveGroup(v); handleCancel(); }}>
            <TabsList className="grid w-full grid-cols-4">
              {groups.map((g) => (
                <TabsTrigger key={g} value={g} className="font-semibold">Group {g}</TabsTrigger>
              ))}
            </TabsList>

            {groups.map((g) => (
              <TabsContent key={g} value={g} className="space-y-4 mt-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{completedInGroup} of {totalMatchesPerGroup} matches played</span>
                  <span className="text-xs font-medium">
                    Deadline: {new Date(mensCategory.groupDeadline).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                  </span>
                </div>
                <Progress value={progress} className="h-1.5" />

                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Standings</CardTitle></CardHeader>
                  <CardContent>
                    <StandingsTable standings={standings} advancementSlots={mensCategory.advancementSlots} />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Match Results</CardTitle></CardHeader>
                  <CardContent>
                    <MatchList matches={groupMatches} playerNames={playerNames} onResumeMatch={handleResumeMatch} />
                  </CardContent>
                </Card>

                {scoreEntryActive && (
                  <ScoreEntry
                    player1Id={scoreP1} player2Id={scoreP2}
                    player1Name={playerNames.get(scoreP1) ?? ""} player2Name={playerNames.get(scoreP2) ?? ""}
                    onSubmit={handleSubmit} onSaveIncomplete={handleSaveIncomplete} onCancel={handleCancel}
                    initialSets={resumingMatch?.sets}
                  />
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
                      <div className="py-8 text-center">
                        <Badge className="bg-primary/10 text-primary border-primary/20">All matches completed</Badge>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {remainingFixtures.map((f, i) => (
                          <FixtureWithEntry
                            key={i}
                            player1Id={f.player1Id} player2Id={f.player2Id}
                            player1Name={playerNames.get(f.player1Id) ?? ""} player2Name={playerNames.get(f.player2Id) ?? ""}
                            canEnter={currentUser.isAdmin || f.player1Id === currentUser.id || f.player2Id === currentUser.id}
                            onSelectFixture={(p1, p2) => { setSelectedFixture({ p1, p2 }); setResumingMatch(null); }}
                          />
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </TabsContent>

        <TabsContent value="knockout" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Knockout Bracket</CardTitle>
              {!isLocked && <p className="text-[11px] text-muted-foreground mt-1">Bracket locks when all group matches are completed.</p>}
              {isLocked && <p className="text-[11px] text-muted-foreground mt-1">Group stage complete — tap a match to enter the result.</p>}
            </CardHeader>
            <CardContent>
              <KnockoutBracket bracket={bracket} isLocked={isLocked} onMatchClick={handleBracketMatchClick} />
            </CardContent>
          </Card>

          {!isLocked && candidates.length > 0 && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Current Leaders</CardTitle></CardHeader>
              <CardContent><CandidatesList candidates={candidates} /></CardContent>
            </Card>
          )}

          {bracketState && isLocked && (
            <ScoreEntry
              player1Id={bracketState.player1Id!} player2Id={bracketState.player2Id!}
              player1Name={bracketState.player1Name ?? ""} player2Name={bracketState.player2Name ?? ""}
              onSubmit={handleBracketSubmit} onCancel={() => setBracketState(null)}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
