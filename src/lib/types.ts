export type TournamentStatus = "upcoming" | "group_stage" | "knockout" | "completed";
export type MatchStage = "group" | "quarterfinal" | "semifinal" | "final";
export type MatchStatus = "requested" | "confirmed" | "completed" | "incomplete" | "disputed" | "walkover";
export type MatchType = "tournament" | "league";
export type SkillLevel = "beginner" | "improver" | "intermediate" | "advanced";

export const SKILL_LEVEL_RATINGS: Record<SkillLevel, number> = {
  advanced: 1200,
  intermediate: 1000,
  improver: 800,
  beginner: 600,
};

export const LEAGUE_RATING_FLOOR = 400;

export interface Tournament {
  id: string;
  name: string;
  slug: string;
  shortName: string;
  startDate: string;
  endDate: string;
  status: TournamentStatus;
}

export interface TournamentInput {
  name: string;
  slug: string;
  shortName: string;
  startDate: string;
  endDate: string;
}

export interface LeagueSeasonInput {
  name: string;
  startDate: string;
  endDate: string;
}

export interface Category {
  id: string;
  tournamentId: string;
  name: string;
  slug: string;
  groupCount: number;
  groupSize: number;
  advancementSlots: number;
  knockoutRounds: number;
  groupDeadline: string;
  finalDate: string;
  registrationOpen?: boolean;
  registrationDeadline?: string | null;
}

export interface Player {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  skillLevel?: SkillLevel;
}

export interface DoublesTeam {
  id: string;
  player1: Player;
  player2: Player;
  teamName: string;
}

export interface GroupAssignment {
  playerId: string;
  categoryId: string;
  groupLabel: string;
}

export interface SetScore {
  player1Games: number;
  player2Games: number;
  isTiebreak?: boolean;
}

export interface Match {
  id: string;
  matchType: MatchType;        // "tournament" | "league" — defaults to "tournament"
  categoryId: string;
  groupLabel?: string;
  player1Id: string;
  player2Id: string;
  stage: MatchStage;
  status: MatchStatus;
  sets: SetScore[];
  winnerId?: string;
  playedAt?: string;
}

export interface Standing {
  playerId: string;
  playerName: string;
  groupLabel: string;
  played: number;
  wins: number;
  losses: number;
  points: number;
  setsWon: number;
  setsLost: number;
  gamesWon: number;
  gamesLost: number;
}

export interface CategorySummary {
  category: Category;
  totalMatches: number;
  completedMatches: number;
  leaders: { name: string; points: number }[];
}

// ── League types (populated when league mode is built) ─────────────────────

export interface LeagueSeason {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  tiered: boolean;
  status: "upcoming" | "active" | "completed";
}

export interface LeagueLevel {
  id: string;
  seasonId: string;
  name: string;           // e.g. "Level 1", "Level 2"
  order: number;          // 1 = top level
}

export interface LeagueLevelAssignment {
  playerId: string;
  levelId: string;
  seasonId: string;
}

export interface LeagueRating {
  playerId: string;
  rating: number;
  gamesPlayed: number;
  updatedAt: string;
}

export interface LeagueRatingHistory {
  id: string;
  playerId: string;
  categoryId: string;
  seasonId: string;
  matchId: string;
  ratingBefore: number;
  ratingAfter: number;
  ratingChange: number;
  recordedAt: string;
}
