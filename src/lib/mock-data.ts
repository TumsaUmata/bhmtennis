import {
  Tournament,
  Category,
  Player,
  DoublesTeam,
  GroupAssignment,
  Match,
  Standing,
  CategorySummary,
} from "./types";

export const tournament: Tournament = {
  id: "bhm-2026",
  name: "Blackhorse Mills Tennis Tournament",
  slug: "2026-summer",
  shortName: "Summer 2026",
  startDate: "2026-06-15",
  endDate: "2026-08-03",
  status: "group_stage",
};

export const categories: Category[] = [
  {
    id: "mens-singles",
    tournamentId: "bhm-2026",
    name: "Men's Singles",
    slug: "mens-singles",
    groupCount: 4,
    groupSize: 6,
    advancementSlots: 2,
    knockoutRounds: 3,
    groupDeadline: "2026-07-12",
    finalDate: "2026-08-03",
  },
  {
    id: "womens-singles",
    tournamentId: "bhm-2026",
    name: "Women's Singles",
    slug: "womens-singles",
    groupCount: 1,
    groupSize: 7,
    advancementSlots: 2,
    knockoutRounds: 1,
    groupDeadline: "2026-07-27",
    finalDate: "2026-08-03",
  },
  {
    id: "mixed-doubles",
    tournamentId: "bhm-2026",
    name: "Mixed Doubles",
    slug: "mixed-doubles",
    groupCount: 1,
    groupSize: 6,
    advancementSlots: 2,
    knockoutRounds: 1,
    groupDeadline: "2026-07-27",
    finalDate: "2026-08-03",
  },
];

export const mensPlayers: Player[] = [
  // Group A
  { id: "m1", name: "James Wilson" },
  { id: "m2", name: "David Chen" },
  { id: "m3", name: "Marcus Johnson" },
  { id: "m4", name: "Oliver Smith" },
  { id: "m5", name: "Ryan Patel" },
  { id: "m6", name: "Tom Brown" },
  // Group B
  { id: "m7", name: "Alex Thompson" },
  { id: "m8", name: "Ben Martinez" },
  { id: "m9", name: "Carlos Rivera" },
  { id: "m10", name: "Daniel Kim" },
  { id: "m11", name: "Edward Lee" },
  { id: "m12", name: "Frank Garcia" },
  // Group C
  { id: "m13", name: "George Taylor" },
  { id: "m14", name: "Harry Anderson" },
  { id: "m15", name: "Ian Wright" },
  { id: "m16", name: "Jack Robinson" },
  { id: "m17", name: "Kevin Murphy" },
  { id: "m18", name: "Liam Davis" },
  // Group D
  { id: "m19", name: "Michael Clark" },
  { id: "m20", name: "Nathan Hall" },
  { id: "m21", name: "Oscar Young" },
  { id: "m22", name: "Peter King" },
  { id: "m23", name: "Quentin Scott" },
  { id: "m24", name: "Robert Adams" },
];

export const womensPlayers: Player[] = [
  { id: "w1", name: "Sarah Mitchell" },
  { id: "w2", name: "Emma Thompson" },
  { id: "w3", name: "Lisa Chen" },
  { id: "w4", name: "Amy Patel" },
  { id: "w5", name: "Rachel Kim" },
  { id: "w6", name: "Nina Garcia" },
  { id: "w7", name: "Kate Wilson" },
];

export const doublesTeams: DoublesTeam[] = [
  { id: "d1", player1: { id: "dp1", name: "James Wilson" }, player2: { id: "dp2", name: "Sarah Mitchell" }, teamName: "Wilson / Mitchell" },
  { id: "d2", player1: { id: "dp3", name: "David Chen" }, player2: { id: "dp4", name: "Emma Thompson" }, teamName: "Chen / Thompson" },
  { id: "d3", player1: { id: "dp5", name: "Marcus Johnson" }, player2: { id: "dp6", name: "Lisa Chen" }, teamName: "Johnson / Chen" },
  { id: "d4", player1: { id: "dp7", name: "Oliver Smith" }, player2: { id: "dp8", name: "Amy Patel" }, teamName: "Smith / Patel" },
  { id: "d5", player1: { id: "dp9", name: "Ryan Patel" }, player2: { id: "dp10", name: "Rachel Kim" }, teamName: "Patel / Kim" },
  { id: "d6", player1: { id: "dp11", name: "Tom Brown" }, player2: { id: "dp12", name: "Nina Garcia" }, teamName: "Brown / Garcia" },
];

export const mensGroupAssignments: GroupAssignment[] = [
  // Group A
  ...["m1", "m2", "m3", "m4", "m5", "m6"].map((id) => ({ playerId: id, categoryId: "mens-singles", groupLabel: "A" })),
  // Group B
  ...["m7", "m8", "m9", "m10", "m11", "m12"].map((id) => ({ playerId: id, categoryId: "mens-singles", groupLabel: "B" })),
  // Group C
  ...["m13", "m14", "m15", "m16", "m17", "m18"].map((id) => ({ playerId: id, categoryId: "mens-singles", groupLabel: "C" })),
  // Group D
  ...["m19", "m20", "m21", "m22", "m23", "m24"].map((id) => ({ playerId: id, categoryId: "mens-singles", groupLabel: "D" })),
];

export const sampleMatches: Match[] = [
  // Men's Group A - some completed matches
  { id: "match1", matchType: "tournament", categoryId: "mens-singles", groupLabel: "A", player1Id: "m1", player2Id: "m2", stage: "group", status: "completed", sets: [{ player1Games: 6, player2Games: 3 }, { player1Games: 6, player2Games: 4 }], winnerId: "m1", playedAt: "2026-06-20" },
  { id: "match2", matchType: "tournament", categoryId: "mens-singles", groupLabel: "A", player1Id: "m3", player2Id: "m4", stage: "group", status: "completed", sets: [{ player1Games: 4, player2Games: 6 }, { player1Games: 6, player2Games: 3 }, { player1Games: 7, player2Games: 5 }], winnerId: "m3", playedAt: "2026-06-21" },
  { id: "match3", matchType: "tournament", categoryId: "mens-singles", groupLabel: "A", player1Id: "m1", player2Id: "m5", stage: "group", status: "completed", sets: [{ player1Games: 6, player2Games: 2 }, { player1Games: 6, player2Games: 1 }], winnerId: "m1", playedAt: "2026-06-22" },
  { id: "match4", matchType: "tournament", categoryId: "mens-singles", groupLabel: "A", player1Id: "m2", player2Id: "m3", stage: "group", status: "completed", sets: [{ player1Games: 3, player2Games: 6 }, { player1Games: 6, player2Games: 4 }, { player1Games: 6, player2Games: 7, isTiebreak: true }], winnerId: "m3", playedAt: "2026-06-23" },
  // Men's Group B
  { id: "match5", matchType: "tournament", categoryId: "mens-singles", groupLabel: "B", player1Id: "m7", player2Id: "m8", stage: "group", status: "completed", sets: [{ player1Games: 6, player2Games: 4 }, { player1Games: 7, player2Games: 5 }], winnerId: "m7", playedAt: "2026-06-20" },
  { id: "match6", matchType: "tournament", categoryId: "mens-singles", groupLabel: "B", player1Id: "m9", player2Id: "m10", stage: "group", status: "completed", sets: [{ player1Games: 6, player2Games: 1 }, { player1Games: 6, player2Games: 3 }], winnerId: "m9", playedAt: "2026-06-21" },
  // Women's
  { id: "match7", matchType: "tournament", categoryId: "womens-singles", groupLabel: "A", player1Id: "w1", player2Id: "w2", stage: "group", status: "completed", sets: [{ player1Games: 6, player2Games: 4 }, { player1Games: 6, player2Games: 2 }], winnerId: "w1", playedAt: "2026-06-20" },
  { id: "match8", matchType: "tournament", categoryId: "womens-singles", groupLabel: "A", player1Id: "w3", player2Id: "w4", stage: "group", status: "completed", sets: [{ player1Games: 7, player2Games: 5 }, { player1Games: 3, player2Games: 6 }, { player1Games: 6, player2Games: 4 }], winnerId: "w3", playedAt: "2026-06-21" },
  { id: "match9", matchType: "tournament", categoryId: "womens-singles", groupLabel: "A", player1Id: "w1", player2Id: "w3", stage: "group", status: "completed", sets: [{ player1Games: 6, player2Games: 3 }, { player1Games: 6, player2Games: 4 }], winnerId: "w1", playedAt: "2026-06-23" },
  // Doubles
  { id: "match10", matchType: "tournament", categoryId: "mixed-doubles", groupLabel: "A", player1Id: "d1", player2Id: "d2", stage: "group", status: "completed", sets: [{ player1Games: 6, player2Games: 3 }, { player1Games: 4, player2Games: 6 }, { player1Games: 7, player2Games: 6, isTiebreak: true }], winnerId: "d1", playedAt: "2026-06-22" },
  { id: "match11", matchType: "tournament", categoryId: "mixed-doubles", groupLabel: "A", player1Id: "d3", player2Id: "d4", stage: "group", status: "completed", sets: [{ player1Games: 6, player2Games: 2 }, { player1Games: 6, player2Games: 4 }], winnerId: "d3", playedAt: "2026-06-23" },
];

function computeStandings(
  players: { id: string; name: string }[],
  matches: Match[],
  groupLabel: string
): Standing[] {
  const standings: Standing[] = players.map((p) => ({
    playerId: p.id,
    playerName: p.name,
    groupLabel,
    played: 0,
    wins: 0,
    losses: 0,
    points: 0,
    setsWon: 0,
    setsLost: 0,
    gamesWon: 0,
    gamesLost: 0,
  }));

  const map = new Map(standings.map((s) => [s.playerId, s]));

  for (const match of matches) {
    if (match.status !== "completed" || match.groupLabel !== groupLabel) continue;

    const s1 = map.get(match.player1Id);
    const s2 = map.get(match.player2Id);
    if (!s1 || !s2) continue;

    s1.played++;
    s2.played++;

    let p1Sets = 0;
    let p2Sets = 0;
    for (const set of match.sets) {
      s1.gamesWon += set.player1Games;
      s1.gamesLost += set.player2Games;
      s2.gamesWon += set.player2Games;
      s2.gamesLost += set.player1Games;
      if (set.player1Games > set.player2Games) p1Sets++;
      else p2Sets++;
    }

    s1.setsWon += p1Sets;
    s1.setsLost += p2Sets;
    s2.setsWon += p2Sets;
    s2.setsLost += p1Sets;

    if (match.winnerId === match.player1Id) {
      s1.wins++;
      s1.points += 1;
      s2.losses++;
    } else {
      s2.wins++;
      s2.points += 1;
      s1.losses++;
    }
  }

  standings.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    const aSetDiff = a.setsWon - a.setsLost;
    const bSetDiff = b.setsWon - b.setsLost;
    if (bSetDiff !== aSetDiff) return bSetDiff - aSetDiff;
    const aGameDiff = a.gamesWon - a.gamesLost;
    const bGameDiff = b.gamesWon - b.gamesLost;
    return bGameDiff - aGameDiff;
  });

  return standings;
}

export function getMensStandings(group: string): Standing[] {
  const groupPlayers = mensGroupAssignments
    .filter((a) => a.groupLabel === group)
    .map((a) => {
      const p = mensPlayers.find((p) => p.id === a.playerId)!;
      return { id: p.id, name: p.name };
    });
  const groupMatches = sampleMatches.filter((m) => m.categoryId === "mens-singles" && m.groupLabel === group);
  return computeStandings(groupPlayers, groupMatches, group);
}

export function getWomensStandings(): Standing[] {
  const players = womensPlayers.map((p) => ({ id: p.id, name: p.name }));
  const matches = sampleMatches.filter((m) => m.categoryId === "womens-singles");
  return computeStandings(players, matches, "A");
}

export function getDoublesStandings(): Standing[] {
  const players = doublesTeams.map((t) => ({ id: t.id, name: t.teamName }));
  const matches = sampleMatches.filter((m) => m.categoryId === "mixed-doubles");
  return computeStandings(players, matches, "A");
}

export function getCategorySummaries(): CategorySummary[] {
  return categories.map((cat) => {
    const catMatches = sampleMatches.filter((m) => m.categoryId === cat.id);
    const completedMatches = catMatches.filter((m) => m.status === "completed").length;

    const totalMatchesPerGroup = (cat.groupSize * (cat.groupSize - 1)) / 2;
    const totalMatches = totalMatchesPerGroup * cat.groupCount;

    let leaders: { name: string; points: number }[] = [];
    if (cat.id === "mens-singles") {
      const allStandings = ["A", "B", "C", "D"].flatMap((g) => getMensStandings(g));
      leaders = allStandings
        .sort((a, b) => b.points - a.points)
        .slice(0, 3)
        .map((s) => ({ name: s.playerName, points: s.points }));
    } else if (cat.id === "womens-singles") {
      leaders = getWomensStandings()
        .slice(0, 2)
        .map((s) => ({ name: s.playerName, points: s.points }));
    } else {
      leaders = getDoublesStandings()
        .slice(0, 2)
        .map((s) => ({ name: s.playerName, points: s.points }));
    }

    return { category: cat, totalMatches, completedMatches, leaders };
  });
}

export function getMensGroupMatches(group: string): Match[] {
  return sampleMatches.filter(
    (m) => m.categoryId === "mens-singles" && m.groupLabel === group
  );
}

export function getWomensMatches(): Match[] {
  return sampleMatches.filter((m) => m.categoryId === "womens-singles");
}

export function getDoublesMatches(): Match[] {
  return sampleMatches.filter((m) => m.categoryId === "mixed-doubles");
}

export function getMensPlayerNames(group: string): Map<string, string> {
  const map = new Map<string, string>();
  mensGroupAssignments
    .filter((a) => a.groupLabel === group)
    .forEach((a) => {
      const p = mensPlayers.find((p) => p.id === a.playerId);
      if (p) map.set(p.id, p.name);
    });
  return map;
}

export function getWomensPlayerNames(): Map<string, string> {
  return new Map(womensPlayers.map((p) => [p.id, p.name]));
}

export function getDoublesPlayerNames(): Map<string, string> {
  return new Map(doublesTeams.map((t) => [t.id, t.teamName]));
}

export function getRemainingFixtures(
  playerIds: string[],
  completedMatches: Match[]
): { player1Id: string; player2Id: string }[] {
  const playedPairs = new Set(
    completedMatches
      .filter((m) => m.status === "completed")
      .map((m) => [m.player1Id, m.player2Id].sort().join("-"))
  );

  const fixtures: { player1Id: string; player2Id: string }[] = [];
  for (let i = 0; i < playerIds.length; i++) {
    for (let j = i + 1; j < playerIds.length; j++) {
      const key = [playerIds[i], playerIds[j]].sort().join("-");
      if (!playedPairs.has(key)) {
        fixtures.push({ player1Id: playerIds[i], player2Id: playerIds[j] });
      }
    }
  }
  return fixtures;
}

export function getRecentMatches(): (Match & { player1Name: string; player2Name: string; categoryName: string })[] {
  const allPlayers = new Map<string, string>();
  mensPlayers.forEach((p) => allPlayers.set(p.id, p.name));
  womensPlayers.forEach((p) => allPlayers.set(p.id, p.name));
  doublesTeams.forEach((t) => allPlayers.set(t.id, t.teamName));

  const catNames = new Map(categories.map((c) => [c.id, c.name]));

  return sampleMatches
    .filter((m) => m.status === "completed")
    .sort((a, b) => (b.playedAt ?? "").localeCompare(a.playedAt ?? ""))
    .slice(0, 5)
    .map((m) => ({
      ...m,
      player1Name: allPlayers.get(m.player1Id) ?? "Unknown",
      player2Name: allPlayers.get(m.player2Id) ?? "Unknown",
      categoryName: catNames.get(m.categoryId) ?? "Unknown",
    }));
}
