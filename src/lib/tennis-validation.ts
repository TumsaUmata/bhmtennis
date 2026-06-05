import type { SetScore } from "./types";

/**
 * Valid completed set scores in tennis:
 * - 6-0, 6-1, 6-2, 6-3, 6-4 (winner reaches 6 with 2+ game lead)
 * - 7-5 (winner breaks at 6-5)
 * - 7-6 (tiebreak at 6-6)
 * Reversed versions are also valid (0-6, 1-6, etc.)
 */
export function validateSetScore(set: SetScore): string | null {
  const { player1Games: p1, player2Games: p2 } = set;

  if (p1 === 0 && p2 === 0) {
    return "Enter a score";
  }

  if (p1 === p2) {
    return `${p1}-${p2} is not valid — a set can't end in a tie`;
  }

  const high = Math.max(p1, p2);
  const low = Math.min(p1, p2);

  if (high < 6) {
    return `${p1}-${p2} is not valid — a player needs at least 6 games to win a set`;
  }

  if (high === 6 && low <= 4) {
    return null;
  }

  if (high === 6 && low === 5) {
    return `6-5 is not valid — at 5-5 play continues to 6-4 (break) or 6-6 (tiebreak)`;
  }

  if (high === 7 && low === 5) {
    return null;
  }

  if (high === 7 && low === 6) {
    return null;
  }

  if (high === 7 && low < 5) {
    return `${p1}-${p2} is not valid — if a player reaches 7, the other must have 5 or 6`;
  }

  if (high > 7) {
    return `${p1}-${p2} is not valid — a regular set can't go above 7 games`;
  }

  return `${p1}-${p2} is not a valid set score`;
}

/**
 * Valid deciding tiebreak scores:
 * - Winner must have at least 10 points
 * - Must win by at least 2 points
 * - e.g. 10-0, 10-8, 11-9, 15-13
 */
export function validateTiebreakScore(set: SetScore): string | null {
  const { player1Games: p1, player2Games: p2 } = set;

  if (p1 === 0 && p2 === 0) {
    return "Enter a score";
  }

  if (p1 === p2) {
    return `${p1}-${p2} is not valid — tiebreak can't end in a tie`;
  }

  const high = Math.max(p1, p2);
  const low = Math.min(p1, p2);
  const diff = high - low;

  if (high < 10) {
    return `Winner must reach at least 10 in a deciding tiebreak`;
  }

  if (diff < 2) {
    return `${p1}-${p2} is not valid — must win by at least 2 points`;
  }

  if (low >= 9 && diff !== 2) {
    return `${p1}-${p2} is not valid — after 9-9, must win by exactly 2`;
  }

  return null;
}

export function validateMatchSets(sets: SetScore[]): string | null {
  for (let i = 0; i < sets.length; i++) {
    const set = sets[i];
    const isTiebreak = set.isTiebreak;

    const err = isTiebreak
      ? validateTiebreakScore(set)
      : validateSetScore(set);

    if (err) {
      const label = isTiebreak ? "Tiebreak" : `Set ${i + 1}`;
      return `${label}: ${err}`;
    }
  }

  const p1Won = sets.filter((s) => s.player1Games > s.player2Games).length;
  const p2Won = sets.filter((s) => s.player2Games > s.player1Games).length;

  if (sets.length >= 2 && p1Won === p2Won) {
    return "Sets are split — add a 3rd set or tiebreak to decide the match";
  }

  return null;
}
