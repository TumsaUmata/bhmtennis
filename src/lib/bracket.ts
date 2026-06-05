import type { SetScore, Standing } from "./types";

export interface BracketMatch {
  id: string;
  round: number;
  position: number;
  player1Id?: string;
  player1Name?: string;
  player1SeedLabel?: string;
  player2Id?: string;
  player2Name?: string;
  player2SeedLabel?: string;
  sets: SetScore[];
  winnerId?: string;
  status: "pending" | "ready" | "completed";
  label: string;
}

export interface Bracket {
  rounds: BracketMatch[][];
  champion?: string;
}

export function generateMensBracket(
  groupStandings: Record<string, Standing[]>,
  useLabels: boolean
): Bracket {
  const makeSeedLabel = (group: string, pos: number) =>
    `${pos === 0 ? "1st" : "2nd"} Group ${group}`;

  const getPlayer = (group: string, pos: number) => {
    const s = groupStandings[group]?.[pos];
    if (!s) return undefined;
    return { id: s.playerId, name: s.playerName, seedLabel: makeSeedLabel(group, pos) };
  };

  const a1 = getPlayer("A", 0);
  const a2 = getPlayer("A", 1);
  const b1 = getPlayer("B", 0);
  const b2 = getPlayer("B", 1);
  const c1 = getPlayer("C", 0);
  const c2 = getPlayer("C", 1);
  const d1 = getPlayer("D", 0);
  const d2 = getPlayer("D", 1);

  const qf: BracketMatch[] = [
    {
      id: "qf1", round: 0, position: 0,
      player1Id: a1?.id, player1Name: a1?.name,
      player1SeedLabel: useLabels ? a1?.seedLabel : undefined,
      player2Id: d2?.id, player2Name: d2?.name,
      player2SeedLabel: useLabels ? d2?.seedLabel : undefined,
      sets: [], status: !useLabels && a1 && d2 ? "ready" : "pending",
      label: "QF1",
    },
    {
      id: "qf2", round: 0, position: 1,
      player1Id: b1?.id, player1Name: b1?.name,
      player1SeedLabel: useLabels ? b1?.seedLabel : undefined,
      player2Id: c2?.id, player2Name: c2?.name,
      player2SeedLabel: useLabels ? c2?.seedLabel : undefined,
      sets: [], status: !useLabels && b1 && c2 ? "ready" : "pending",
      label: "QF2",
    },
    {
      id: "qf3", round: 0, position: 2,
      player1Id: c1?.id, player1Name: c1?.name,
      player1SeedLabel: useLabels ? c1?.seedLabel : undefined,
      player2Id: b2?.id, player2Name: b2?.name,
      player2SeedLabel: useLabels ? b2?.seedLabel : undefined,
      sets: [], status: !useLabels && c1 && b2 ? "ready" : "pending",
      label: "QF3",
    },
    {
      id: "qf4", round: 0, position: 3,
      player1Id: d1?.id, player1Name: d1?.name,
      player1SeedLabel: useLabels ? d1?.seedLabel : undefined,
      player2Id: a2?.id, player2Name: a2?.name,
      player2SeedLabel: useLabels ? a2?.seedLabel : undefined,
      sets: [], status: !useLabels && d1 && a2 ? "ready" : "pending",
      label: "QF4",
    },
  ];

  const sf: BracketMatch[] = [
    { id: "sf1", round: 1, position: 0, sets: [], status: "pending", label: "SF1" },
    { id: "sf2", round: 1, position: 1, sets: [], status: "pending", label: "SF2" },
  ];

  const final: BracketMatch[] = [
    { id: "final", round: 2, position: 0, sets: [], status: "pending", label: "Final" },
  ];

  return { rounds: [qf, sf, final] };
}

export function generateFinalBracket(
  standings: Standing[],
  categoryLabel: string,
  useLabels: boolean
): Bracket {
  const p1 = standings[0];
  const p2 = standings[1];

  const final: BracketMatch = {
    id: "final",
    round: 0,
    position: 0,
    player1Id: p1?.playerId,
    player1Name: p1?.playerName,
    player1SeedLabel: useLabels ? "1st Place" : undefined,
    player2Id: p2?.playerId,
    player2Name: p2?.playerName,
    player2SeedLabel: useLabels ? "2nd Place" : undefined,
    sets: [],
    status: !useLabels && p1 && p2 ? "ready" : "pending",
    label: `${categoryLabel} Final`,
  };

  return { rounds: [[final]] };
}

export function advanceBracket(bracket: Bracket): Bracket {
  const rounds = bracket.rounds.map((round) => [...round.map((m) => ({ ...m }))]);

  for (let r = 0; r < rounds.length - 1; r++) {
    const currentRound = rounds[r];
    const nextRound = rounds[r + 1];

    for (let i = 0; i < currentRound.length; i += 2) {
      const match1 = currentRound[i];
      const match2 = currentRound[i + 1];
      const nextMatch = nextRound[Math.floor(i / 2)];
      if (!nextMatch) continue;

      if (match1?.status === "completed" && match1.winnerId) {
        const winner = match1.winnerId === match1.player1Id
          ? { id: match1.player1Id, name: match1.player1Name }
          : { id: match1.player2Id, name: match1.player2Name };
        nextMatch.player1Id = winner.id;
        nextMatch.player1Name = winner.name;
      }

      if (match2?.status === "completed" && match2.winnerId) {
        const winner = match2.winnerId === match2.player1Id
          ? { id: match2.player1Id, name: match2.player1Name }
          : { id: match2.player2Id, name: match2.player2Name };
        nextMatch.player2Id = winner.id;
        nextMatch.player2Name = winner.name;
      }

      if (nextMatch.player1Id && nextMatch.player2Id && nextMatch.status === "pending") {
        nextMatch.status = "ready";
      }
    }
  }

  const finalMatch = rounds[rounds.length - 1]?.[0];
  const champion = finalMatch?.status === "completed" && finalMatch.winnerId
    ? (finalMatch.winnerId === finalMatch.player1Id ? finalMatch.player1Name : finalMatch.player2Name)
    : undefined;

  return { rounds, champion };
}

export function isGroupStageComplete(
  totalMatchesPerGroup: number,
  groupCount: number,
  completedMatchesByGroup: Record<string, number>
): boolean {
  for (let i = 0; i < groupCount; i++) {
    const label = String.fromCharCode(65 + i);
    if ((completedMatchesByGroup[label] ?? 0) < totalMatchesPerGroup) {
      return false;
    }
  }
  return true;
}
