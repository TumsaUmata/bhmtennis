"use client";

import { createContext, useContext } from "react";
import type { Match, SetScore, Standing } from "./types";
import { advanceBracket } from "./bracket";
import {
  sampleMatches,
  mensPlayers,
  womensPlayers,
  doublesTeams,
  mensGroupAssignments,
} from "./mock-data";

import type { Bracket, BracketMatch } from "./bracket";

export interface LockedBracket {
  categoryId: string;
  bracket: Bracket;
  lockedAt: string;
}

export interface MatchStore {
  matches: Match[];
  lockedBrackets: Map<string, LockedBracket>;
  closedGroups: Set<string>;
  extendedDeadlines: ExtendedDeadlines;
  addMatch: (
    categoryId: string,
    groupLabel: string,
    player1Id: string,
    player2Id: string,
    sets: SetScore[],
    winnerId: string
  ) => void;
  saveIncompleteMatch: (
    categoryId: string,
    groupLabel: string,
    player1Id: string,
    player2Id: string,
    sets: SetScore[]
  ) => void;
  completeMatch: (
    matchId: string,
    sets: SetScore[],
    winnerId: string
  ) => void;
  deleteMatch: (matchId: string) => void;
  editMatch: (matchId: string, sets: SetScore[], winnerId: string) => void;
  addWalkover: (
    categoryId: string,
    groupLabel: string,
    winnerId: string,
    loserId: string
  ) => void;
  closeGroupStage: (categoryId: string) => void;
  reopenGroupStage: (categoryId: string) => void;
  extendDeadline: (categoryId: string, stage: "group" | "qf" | "sf" | "final", newDate: string) => void;
  lockBracket: (categoryId: string, bracket: Bracket) => void;
  unlockBracket: (categoryId: string) => void;
  updateBracketMatch: (
    categoryId: string,
    matchId: string,
    sets: SetScore[],
    winnerId: string
  ) => void;
}

let nextMatchId = 100;

export interface ExtendedDeadlines {
  [categoryId: string]: {
    group?: string;
    qf?: string;
    sf?: string;
    final?: string;
  };
}

export function createMatchStore(): MatchStore {
  let matches = [...sampleMatches];
  const lockedBrackets = new Map<string, LockedBracket>();
  const closedGroups = new Set<string>();
  const extendedDeadlines: ExtendedDeadlines = {};

  return {
    get matches() {
      return matches;
    },
    get lockedBrackets() {
      return lockedBrackets;
    },
    get closedGroups() {
      return closedGroups;
    },
    get extendedDeadlines() {
      return extendedDeadlines;
    },
    addMatch(categoryId, groupLabel, player1Id, player2Id, sets, winnerId) {
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
    },
    saveIncompleteMatch(categoryId, groupLabel, player1Id, player2Id, sets) {
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
    },
    completeMatch(matchId, sets, winnerId) {
      matches = matches.map((m) =>
        m.id === matchId
          ? { ...m, sets, winnerId, status: "completed" as const, playedAt: new Date().toISOString().split("T")[0] }
          : m
      );
    },
    deleteMatch(matchId) {
      matches = matches.filter((m) => m.id !== matchId);
    },
    editMatch(matchId, sets, winnerId) {
      matches = matches.map((m) =>
        m.id === matchId
          ? { ...m, sets, winnerId, status: "completed" as const }
          : m
      );
    },
    addWalkover(categoryId, groupLabel, winnerId, loserId) {
      const newMatch: Match = {
        id: `match-${nextMatchId++}`,
        matchType: "tournament",
        categoryId,
        groupLabel,
        player1Id: winnerId,
        player2Id: loserId,
        stage: "group",
        status: "walkover",
        sets: [{ player1Games: 6, player2Games: 0 }, { player1Games: 6, player2Games: 0 }],
        winnerId,
        playedAt: new Date().toISOString().split("T")[0],
      };
      matches = [...matches, newMatch];
    },
    closeGroupStage(categoryId) {
      closedGroups.add(categoryId);
    },
    reopenGroupStage(categoryId) {
      closedGroups.delete(categoryId);
    },
    extendDeadline(categoryId, stage, newDate) {
      if (!extendedDeadlines[categoryId]) {
        extendedDeadlines[categoryId] = {};
      }
      extendedDeadlines[categoryId][stage] = newDate;
    },
    lockBracket(categoryId, bracket) {
      lockedBrackets.set(categoryId, {
        categoryId,
        bracket: JSON.parse(JSON.stringify(bracket)),
        lockedAt: new Date().toISOString(),
      });
    },
    unlockBracket(categoryId) {
      lockedBrackets.delete(categoryId);
    },
    updateBracketMatch(categoryId, matchId, sets, winnerId) {
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
      locked.bracket = advanceBracket(locked.bracket);
    },
  };
}

export function computeStandings(
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

export function getMensGroupPlayers(group: string) {
  return mensGroupAssignments
    .filter((a) => a.groupLabel === group)
    .map((a) => {
      const p = mensPlayers.find((p) => p.id === a.playerId)!;
      return { id: p.id, name: p.name };
    });
}

export function getPlayerNameMap(players: { id: string; name: string }[]) {
  return new Map(players.map((p) => [p.id, p.name]));
}

export function getRemainingFixtures(
  playerIds: string[],
  allMatches: Match[]
) {
  const playedPairs = new Set(
    allMatches
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
}

export const MatchStoreContext = createContext<MatchStore | null>(null);

export function useMatchStore() {
  const store = useContext(MatchStoreContext);
  if (!store) throw new Error("MatchStoreContext not provided");
  return store;
}
