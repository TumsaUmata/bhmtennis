import type {
  Tournament,
  TournamentInput,
  Category,
  Player,
  DoublesTeam,
  GroupAssignment,
  Match,
  SetScore,
  Standing,
  CategorySummary,
  LeagueSeason,
  LeagueSeasonInput,
} from "../types";
import type { Bracket } from "../bracket";

export interface LockedBracketData {
  categoryId: string;
  bracket: Bracket;
  lockedAt: string;
}

export interface TournamentService {
  // Tournament
  getTournament(): Promise<Tournament>;
  getTournaments(): Promise<Tournament[]>;
  createTournament(input: TournamentInput): Promise<Tournament>;

  // Categories
  getCategories(): Promise<Category[]>;
  getCategory(slug: string): Promise<Category | undefined>;

  // Players
  getPlayers(categoryId: string): Promise<Player[]>;
  getPlayersByGroup(categoryId: string, group: string): Promise<Player[]>;
  getDoublesTeams(): Promise<DoublesTeam[]>;
  getGroupAssignments(categoryId: string): Promise<GroupAssignment[]>;
  getPlayerAssignments(playerId: string): Promise<{ categoryId: string; groupLabel: string }[]>;
  getAllPlayerNames(): Promise<Map<string, string>>;
  getPlayerNameMap(categoryId: string, group?: string): Promise<Map<string, string>>;

  // Matches
  getMatches(categoryId: string, groupLabel?: string): Promise<Match[]>;
  getPlayerMatches(playerId: string): Promise<Match[]>;
  getRecentMatches(limit?: number): Promise<(Match & { player1Name: string; player2Name: string; categoryName: string })[]>;
  addMatch(
    categoryId: string,
    groupLabel: string,
    player1Id: string,
    player2Id: string,
    sets: SetScore[],
    winnerId: string
  ): Promise<Match>;
  saveIncompleteMatch(
    categoryId: string,
    groupLabel: string,
    player1Id: string,
    player2Id: string,
    sets: SetScore[]
  ): Promise<Match>;
  completeMatch(matchId: string, sets: SetScore[], winnerId: string): Promise<Match>;

  // Standings (computed)
  getStandings(categoryId: string, group: string): Promise<Standing[]>;
  getCategorySummaries(): Promise<CategorySummary[]>;

  // Remaining fixtures
  getRemainingFixtures(playerIds: string[], categoryId: string, group: string): Promise<{ player1Id: string; player2Id: string }[]>;

  // Brackets
  getLockedBracket(categoryId: string): Promise<LockedBracketData | null>;
  lockBracket(categoryId: string, bracket: Bracket): Promise<void>;
  unlockBracket(categoryId: string): Promise<void>;
  updateBracketMatch(categoryId: string, matchId: string, sets: SetScore[], winnerId: string): Promise<void>;

  // League seasons
  getLeagueSeasons(): Promise<LeagueSeason[]>;
  createLeagueSeason(input: LeagueSeasonInput): Promise<LeagueSeason>;
  closeLeagueSeason(id: string): Promise<void>;

  // Tournament registrations
  registerForTournament(playerId: string, categoryId: string): Promise<void>;
  withdrawFromTournament(playerId: string, categoryId: string): Promise<void>;
  getMyRegistrations(playerId: string): Promise<{ categoryId: string; status: string }[]>;
  getRegistrations(categoryId: string): Promise<{ playerId: string; playerName: string; registeredAt: string; status: string }[]>;
  openRegistration(categoryId: string, deadline: string): Promise<void>;
  closeRegistration(categoryId: string): Promise<void>;
  extendRegistrationDeadline(categoryId: string, newDeadline: string): Promise<void>;

  // League season enrollments
  getSeasonEnrollments(seasonId: string): Promise<{ playerId: string; playerName: string; optedOut: boolean }[]>;
  optOutOfSeason(playerId: string, seasonId: string): Promise<void>;
  optBackIntoSeason(playerId: string, seasonId: string): Promise<void>;
  getEnrollmentPreview(categoryId: string): Promise<{ count: number }>;

  // League ratings + challenges
  getLeagueRatings(): Promise<{ playerId: string; playerName: string; rating: number; gamesPlayed: number }[]>;
  getPlayerLeagueRating(playerId: string): Promise<import("../types").LeagueRating | null>;
  createLeagueChallenge(challengerId: string, challengedId: string, seasonId: string): Promise<import("../types").Match>;
  getLeagueMatches(playerId: string): Promise<import("../types").Match[]>;
  completeLeagueMatch(matchId: string, sets: SetScore[], winnerId: string): Promise<import("../types").Match>;
  logLeagueMatch(player1Id: string, player2Id: string, sets: SetScore[], winnerId: string, seasonId: string): Promise<import("../types").Match>;

  // Tournament draw
  generateDraw(categoryId: string, groupCount: number, seedPlayerIds: string[]): Promise<void>;

  // Walkover processing
  getMissedFixtures(categoryId: string): Promise<{ player1Id: string; player2Id: string; player1Name: string; player2Name: string; groupLabel: string; deadline: string }[]>;
  awardWalkover(categoryId: string, groupLabel: string, winnerId: string, loserId: string): Promise<import("../types").Match>;
}
