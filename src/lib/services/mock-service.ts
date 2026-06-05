import type { TournamentService, LockedBracketData } from "./types";
import type { Match, SetScore, Standing, CategorySummary } from "../types";
import type { Bracket } from "../bracket";
import {
  tournament,
  categories,
  mensPlayers,
  womensPlayers,
  doublesTeams,
  mensGroupAssignments,
  sampleMatches,
} from "../mock-data";

let matches = [...sampleMatches];
let nextMatchId = 100;
const lockedBrackets = new Map<string, LockedBracketData>();

function computeStandings(
  players: { id: string; name: string }[],
  matchList: Match[],
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

  for (const match of matchList) {
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

function getPlayersForCategory(categoryId: string, group?: string) {
  if (categoryId === "mens-singles") {
    const assignments = group
      ? mensGroupAssignments.filter((a) => a.groupLabel === group)
      : mensGroupAssignments;
    return assignments.map((a) => {
      const p = mensPlayers.find((p) => p.id === a.playerId)!;
      return { id: p.id, name: p.name };
    });
  }
  if (categoryId === "womens-singles") {
    return womensPlayers.map((p) => ({ id: p.id, name: p.name }));
  }
  if (categoryId === "mixed-doubles") {
    return doublesTeams.map((t) => ({ id: t.id, name: t.teamName }));
  }
  return [];
}

export function createMockService(): TournamentService {
  return {
    async getTournament() {
      return tournament;
    },

    async getCategories() {
      return categories;
    },

    async getCategory(slug) {
      return categories.find((c) => c.slug === slug);
    },

    async getPlayers(categoryId) {
      if (categoryId === "mens-singles") return mensPlayers;
      if (categoryId === "womens-singles") return womensPlayers;
      return [];
    },

    async getPlayersByGroup(categoryId, group) {
      if (categoryId === "mens-singles") {
        return mensGroupAssignments
          .filter((a) => a.groupLabel === group)
          .map((a) => mensPlayers.find((p) => p.id === a.playerId)!)
          .filter(Boolean);
      }
      if (categoryId === "womens-singles") return womensPlayers;
      return [];
    },

    async getDoublesTeams() {
      return doublesTeams;
    },

    async getGroupAssignments(categoryId) {
      if (categoryId === "mens-singles") return mensGroupAssignments;
      return [];
    },

    async getPlayerAssignments(playerId) {
      const results: { categoryId: string; groupLabel: string }[] = [];
      const mensAssign = mensGroupAssignments.find((a) => a.playerId === playerId);
      if (mensAssign) results.push({ categoryId: "mens-singles", groupLabel: mensAssign.groupLabel });
      const womensAssign = womensPlayers.find((p) => p.id === playerId);
      if (womensAssign) results.push({ categoryId: "womens-singles", groupLabel: "A" });
      const doublesAssign = doublesTeams.find((t) => t.id === playerId);
      if (doublesAssign) results.push({ categoryId: "mixed-doubles", groupLabel: "A" });
      return results;
    },

    async getAllPlayerNames() {
      const map = new Map<string, string>();
      mensPlayers.forEach((p) => map.set(p.id, p.name));
      womensPlayers.forEach((p) => map.set(p.id, p.name));
      doublesTeams.forEach((t) => map.set(t.id, t.teamName));
      return map;
    },

    async getPlayerNameMap(categoryId, group) {
      const players = getPlayersForCategory(categoryId, group);
      return new Map(players.map((p) => [p.id, p.name]));
    },

    async getMatches(categoryId, groupLabel) {
      return matches.filter(
        (m) =>
          m.categoryId === categoryId &&
          (!groupLabel || m.groupLabel === groupLabel)
      );
    },

    async getPlayerMatches(playerId) {
      return matches.filter(
        (m) => m.player1Id === playerId || m.player2Id === playerId
      );
    },

    async getRecentMatches(limit = 5) {
      const allPlayers = new Map<string, string>();
      mensPlayers.forEach((p) => allPlayers.set(p.id, p.name));
      womensPlayers.forEach((p) => allPlayers.set(p.id, p.name));
      doublesTeams.forEach((t) => allPlayers.set(t.id, t.teamName));
      const catNames = new Map(categories.map((c) => [c.id, c.name]));

      return matches
        .filter((m) => m.status === "completed")
        .sort((a, b) => (b.playedAt ?? "").localeCompare(a.playedAt ?? ""))
        .slice(0, limit)
        .map((m) => ({
          ...m,
          player1Name: allPlayers.get(m.player1Id) ?? "Unknown",
          player2Name: allPlayers.get(m.player2Id) ?? "Unknown",
          categoryName: catNames.get(m.categoryId) ?? "Unknown",
        }));
    },

    async addMatch(categoryId, groupLabel, player1Id, player2Id, sets, winnerId) {
      const newMatch: Match = {
        id: `match-${nextMatchId++}`,
        matchType: "tournament",
        categoryId,
        groupLabel,
        player1Id,
        player2Id,
        stage: "group",
        status: "completed",
        sets,
        winnerId,
        playedAt: new Date().toISOString().split("T")[0],
      };
      matches = [...matches, newMatch];
      return newMatch;
    },

    async saveIncompleteMatch(categoryId, groupLabel, player1Id, player2Id, sets) {
      const newMatch: Match = {
        id: `match-${nextMatchId++}`,
        matchType: "tournament",
        categoryId,
        groupLabel,
        player1Id,
        player2Id,
        stage: "group",
        status: "incomplete",
        sets,
        playedAt: new Date().toISOString().split("T")[0],
      };
      matches = [...matches, newMatch];
      return newMatch;
    },

    async completeMatch(matchId, sets, winnerId) {
      let updated: Match | undefined;
      matches = matches.map((m) => {
        if (m.id === matchId) {
          updated = {
            ...m,
            sets,
            winnerId,
            status: "completed" as const,
            playedAt: new Date().toISOString().split("T")[0],
          };
          return updated;
        }
        return m;
      });
      return updated!;
    },

    async getStandings(categoryId, group) {
      const players = getPlayersForCategory(categoryId, group);
      const catMatches = matches.filter((m) => m.categoryId === categoryId);
      return computeStandings(players, catMatches, group);
    },

    async getCategorySummaries() {
      const summaries: CategorySummary[] = [];
      for (const cat of categories) {
        const catMatches = matches.filter((m) => m.categoryId === cat.id);
        const completedCount = catMatches.filter((m) => m.status === "completed").length;
        const totalPerGroup = (cat.groupSize * (cat.groupSize - 1)) / 2;
        const total = totalPerGroup * cat.groupCount;

        let leaders: { name: string; points: number }[] = [];
        if (cat.id === "mens-singles") {
          const all = ["A", "B", "C", "D"].flatMap((g) => {
            const players = getPlayersForCategory(cat.id, g);
            return computeStandings(players, catMatches, g);
          });
          leaders = all
            .sort((a, b) => b.points - a.points)
            .slice(0, 3)
            .map((s) => ({ name: s.playerName, points: s.points }));
        } else {
          const players = getPlayersForCategory(cat.id);
          const standings = computeStandings(players, catMatches, "A");
          leaders = standings
            .slice(0, 2)
            .map((s) => ({ name: s.playerName, points: s.points }));
        }

        summaries.push({ category: cat, totalMatches: total, completedMatches: completedCount, leaders });
      }
      return summaries;
    },

    async getRemainingFixtures(playerIds, categoryId, group) {
      const catMatches = matches.filter(
        (m) => m.categoryId === categoryId && m.groupLabel === group
      );
      const playedPairs = new Set(
        catMatches
          .filter((m) => m.status === "completed" || m.status === "incomplete")
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
    },

    async getLockedBracket(categoryId) {
      return lockedBrackets.get(categoryId) ?? null;
    },

    async lockBracket(categoryId, bracket) {
      lockedBrackets.set(categoryId, {
        categoryId,
        bracket: JSON.parse(JSON.stringify(bracket)),
        lockedAt: new Date().toISOString(),
      });
    },

    async unlockBracket(categoryId) {
      lockedBrackets.delete(categoryId);
    },

    async getTournaments() { return [tournament]; },
    async createTournament() { return tournament; },
    async getLeagueSeasons() { return []; },
    async createLeagueSeason() { throw new Error("Not available in mock mode"); },
    async closeLeagueSeason() {},

    // Tournament registrations (in-memory mock)
    async registerForTournament() {},
    async withdrawFromTournament() {},
    async getMyRegistrations() { return []; },
    async getRegistrations() { return []; },
    async openRegistration() {},
    async closeRegistration() {},
    async extendRegistrationDeadline() {},

    // League season enrollments (in-memory mock)
    async getSeasonEnrollments() { return []; },
    async optOutOfSeason() {},
    async optBackIntoSeason() {},
    async getEnrollmentPreview() { return { count: 0 }; },

    async updateBracketMatch(categoryId, matchId, sets, winnerId) {
      const locked = lockedBrackets.get(categoryId);
      if (!locked) return;
      for (const round of locked.bracket.rounds) {
        const match = round.find((m) => m.id === matchId);
        if (match) {
          match.sets = sets;
          match.winnerId = winnerId;
          match.status = "completed";
          break;
        }
      }
    },

    async getLeagueRatings() { return []; },
    async getPlayerLeagueRating() { return null; },
    async createLeagueChallenge() { throw new Error("Not available in mock mode"); },
    async getLeagueMatches() { return []; },
    async completeLeagueMatch() { throw new Error("Not available in mock mode"); },
    async logLeagueMatch() { throw new Error("Not available in mock mode"); },
    async generateDraw() {},
    async getMissedFixtures() { return []; },
    async awardWalkover() { throw new Error("Not available in mock mode"); },
  };
}
