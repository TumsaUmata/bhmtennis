import type { TournamentService, LockedBracketData } from "@/lib/services/types";
import type { Match, SetScore, Standing, CategorySummary, Player, DoublesTeam } from "@/lib/types";
import type { Bracket } from "@/lib/bracket";
import { supabase } from "@/lib/supabase/client";

function computeStandings(
  players: { id: string; name: string }[],
  matchList: Match[],
  groupLabel: string
): Standing[] {
  const standings: Standing[] = players.map((p) => ({
    playerId: p.id,
    playerName: p.name,
    groupLabel,
    played: 0, wins: 0, losses: 0, points: 0,
    setsWon: 0, setsLost: 0, gamesWon: 0, gamesLost: 0,
  }));

  const map = new Map(standings.map((s) => [s.playerId, s]));

  for (const match of matchList) {
    if (match.status !== "completed" || match.groupLabel !== groupLabel) continue;
    const s1 = map.get(match.player1Id);
    const s2 = map.get(match.player2Id);
    if (!s1 || !s2) continue;

    s1.played++; s2.played++;
    let p1Sets = 0, p2Sets = 0;
    for (const set of match.sets) {
      s1.gamesWon += set.player1Games; s1.gamesLost += set.player2Games;
      s2.gamesWon += set.player2Games; s2.gamesLost += set.player1Games;
      if (set.player1Games > set.player2Games) p1Sets++; else p2Sets++;
    }
    s1.setsWon += p1Sets; s1.setsLost += p2Sets;
    s2.setsWon += p2Sets; s2.setsLost += p1Sets;
    if (match.winnerId === match.player1Id) { s1.wins++; s1.points += 1; s2.losses++; }
    else { s2.wins++; s2.points += 1; s1.losses++; }
  }

  standings.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if ((b.setsWon - b.setsLost) !== (a.setsWon - a.setsLost)) return (b.setsWon - b.setsLost) - (a.setsWon - a.setsLost);
    return (b.gamesWon - b.gamesLost) - (a.gamesWon - a.gamesLost);
  });
  return standings;
}

function mapMatch(row: Record<string, unknown>): Match {
  return {
    id: row.id as string,
    matchType: (row.match_type as Match["matchType"]) ?? "tournament",
    categoryId: row.category_id as string,
    groupLabel: row.group_label as string | undefined,
    player1Id: row.player1_id as string,
    player2Id: row.player2_id as string,
    stage: row.stage as Match["stage"],
    status: row.status as Match["status"],
    sets: (row.sets as SetScore[]) ?? [],
    winnerId: row.winner_id as string | undefined,
    playedAt: row.played_at as string | undefined,
  };
}

export function createSupabaseService(): TournamentService {
  return {
    async getTournament() {
      const { data, error } = await supabase.from("tournaments").select("*").eq("status", "group_stage").maybeSingle();
      if (error) throw error;
      if (!data) throw new Error("No active tournament found — run seed.sql in Supabase SQL Editor.");
      return {
        id: data.id,
        name: data.name,
        slug: (data.slug as string | null) ?? data.id,
        shortName: (data.short_name as string | null) ?? data.name,
        startDate: data.start_date,
        endDate: data.end_date,
        status: data.status,
      };
    },

    async getTournaments() {
      const { data, error } = await supabase.from("tournaments").select("*").order("start_date", { ascending: false });
      if (error) throw error;
      return data.map((t: Record<string, unknown>) => ({
        id: t.id as string,
        name: t.name as string,
        slug: (t.slug as string | null) ?? (t.id as string),
        shortName: (t.short_name as string | null) ?? (t.name as string),
        startDate: t.start_date as string,
        endDate: t.end_date as string,
        status: t.status as string,
      })) as import("../types").Tournament[];
    },

    async createTournament(input) {
      const { data, error } = await supabase.from("tournaments").insert({
        name: input.name,
        slug: input.slug,
        short_name: input.shortName,
        start_date: input.startDate,
        end_date: input.endDate,
        status: "upcoming",
      }).select().single();
      if (error) throw error;
      return {
        id: data.id,
        name: data.name,
        slug: data.slug ?? data.id,
        shortName: data.short_name ?? data.name,
        startDate: data.start_date,
        endDate: data.end_date,
        status: data.status,
      };
    },

    async getCategories() {
      const { data, error } = await supabase.from("categories").select("*").order("name");
      if (error) throw error;
      return data.map((c: Record<string, unknown>) => ({
        id: c.id as string,
        tournamentId: c.tournament_id as string,
        name: c.name as string,
        slug: c.slug as string,
        groupCount: c.group_count as number,
        groupSize: c.group_size as number,
        advancementSlots: c.advancement_slots as number,
        knockoutRounds: c.knockout_rounds as number,
        groupDeadline: c.group_deadline as string,
        finalDate: c.final_date as string,
        registrationOpen: (c.registration_open as boolean | null) ?? false,
        registrationDeadline: c.registration_deadline as string | null,
      }));
    },

    async getCategory(slug) {
      const { data, error } = await supabase.from("categories").select("*").eq("slug", slug).single();
      if (error) return undefined;
      return {
        id: data.id,
        tournamentId: data.tournament_id,
        name: data.name,
        slug: data.slug,
        groupCount: data.group_count,
        groupSize: data.group_size,
        advancementSlots: data.advancement_slots,
        knockoutRounds: data.knockout_rounds,
        groupDeadline: data.group_deadline,
        finalDate: data.final_date,
        registrationOpen: (data.registration_open as boolean | null) ?? false,
        registrationDeadline: data.registration_deadline as string | null,
      };
    },

    async getPlayers(categoryId) {
      const { data, error } = await supabase
        .from("group_assignments")
        .select("player_id, players(id, name, email, phone)")
        .eq("category_id", categoryId);
      if (error) throw error;
      return data.map((d: Record<string, unknown>) => (d as Record<string, unknown>).players as Player);
    },

    async getPlayersByGroup(categoryId, group) {
      const { data, error } = await supabase
        .from("group_assignments")
        .select("player_id, players(id, name, email, phone)")
        .eq("category_id", categoryId)
        .eq("group_label", group);
      if (error) throw error;
      return data.map((d: Record<string, unknown>) => (d as Record<string, unknown>).players as Player);
    },

    async getDoublesTeams() {
      const { data, error } = await supabase
        .from("doubles_teams")
        .select("*, player1:player1_id(id, name), player2:player2_id(id, name)");
      if (error) throw error;
      return data.map((d: Record<string, unknown>) => ({
        id: d.id as string,
        player1: d.player1 as Player,
        player2: d.player2 as Player,
        teamName: d.team_name as string,
      })) as DoublesTeam[];
    },

    async getGroupAssignments(categoryId) {
      const { data, error } = await supabase
        .from("group_assignments")
        .select("*")
        .eq("category_id", categoryId);
      if (error) throw error;
      return data.map((d: Record<string, unknown>) => ({
        playerId: (d.player_id ?? d.team_id) as string,
        categoryId: d.category_id as string,
        groupLabel: d.group_label as string,
      }));
    },

    async getPlayerAssignments(playerId) {
      const { data, error } = await supabase
        .from("group_assignments")
        .select("category_id, group_label")
        .eq("player_id", playerId);
      if (error) throw error;
      return (data ?? []).map((d: Record<string, unknown>) => ({
        categoryId: d.category_id as string,
        groupLabel: d.group_label as string,
      }));
    },

    async getAllPlayerNames() {
      const map = new Map<string, string>();

      const { data: players } = await supabase.from("players").select("id, name");
      players?.forEach((p: Record<string, string>) => map.set(p.id, p.name));

      const { data: teams } = await supabase.from("doubles_teams").select("id, team_name");
      teams?.forEach((t: Record<string, string>) => map.set(t.id, t.team_name));

      return map;
    },

    async getPlayerNameMap(categoryId, group) {
      const map = new Map<string, string>();

      // Singles: player_id -> players(name)
      let singlesQuery = supabase
        .from("group_assignments")
        .select("player_id, players(name)")
        .eq("category_id", categoryId)
        .not("player_id", "is", null);
      if (group) singlesQuery = singlesQuery.eq("group_label", group);
      const { data: singlesData } = await singlesQuery;
      singlesData?.forEach((d: Record<string, unknown>) => {
        if (d.player_id) {
          map.set(d.player_id as string, ((d as Record<string, unknown>).players as Record<string, string>)?.name ?? "Unknown");
        }
      });

      // Doubles: team_id -> doubles_teams(team_name)
      let doublesQuery = supabase
        .from("group_assignments")
        .select("team_id, doubles_teams(team_name)")
        .eq("category_id", categoryId)
        .not("team_id", "is", null);
      if (group) doublesQuery = doublesQuery.eq("group_label", group);
      const { data: doublesData } = await doublesQuery;
      doublesData?.forEach((d: Record<string, unknown>) => {
        if (d.team_id) {
          map.set(d.team_id as string, ((d as Record<string, unknown>).doubles_teams as Record<string, string>)?.team_name ?? "Unknown");
        }
      });

      return map;
    },

    async getMatches(categoryId, groupLabel) {
      let query = supabase.from("matches").select("*").eq("category_id", categoryId);
      if (groupLabel) query = query.eq("group_label", groupLabel);
      const { data, error } = await query.order("played_at", { ascending: false });
      if (error) throw error;
      return data.map(mapMatch);
    },

    async getPlayerMatches(playerId) {
      const { data, error } = await supabase
        .from("matches")
        .select("*")
        .or(`player1_id.eq.${playerId},player2_id.eq.${playerId}`)
        .order("played_at", { ascending: false });
      if (error) throw error;
      return data.map(mapMatch);
    },

    async getRecentMatches(limit = 5) {
      const { data, error } = await supabase
        .from("matches")
        .select("*")
        .eq("status", "completed")
        .order("played_at", { ascending: false })
        .limit(limit);
      if (error) throw error;

      const matches = data.map(mapMatch);
      if (matches.length === 0) return [];

      const playerIds = [...new Set(matches.flatMap((m: Match) => [m.player1Id, m.player2Id]))];
      const { data: players } = await supabase.from("players").select("id, name").in("id", playerIds);
      const nameMap = new Map((players ?? []).map((p: Record<string, string>) => [p.id, p.name]));

      const catIds = [...new Set(matches.map((m: Match) => m.categoryId))];
      const { data: cats } = await supabase.from("categories").select("id, name").in("id", catIds);
      const catMap = new Map((cats ?? []).map((c: Record<string, string>) => [c.id, c.name]));

      return matches.map((m: Match) => ({
        ...m,
        player1Name: nameMap.get(m.player1Id) ?? "Unknown",
        player2Name: nameMap.get(m.player2Id) ?? "Unknown",
        categoryName: catMap.get(m.categoryId) ?? "Unknown",
      }));
    },

    async addMatch(categoryId, groupLabel, player1Id, player2Id, sets, winnerId) {
      const { data, error } = await supabase
        .from("matches")
        .insert({
          match_type: "tournament",
          category_id: categoryId,
          group_label: groupLabel,
          player1_id: player1Id,
          player2_id: player2Id,
          stage: "group",
          status: "completed",
          sets,
          winner_id: winnerId,
          played_at: new Date().toISOString().split("T")[0],
        })
        .select()
        .single();
      if (error) throw error;
      return mapMatch(data);
    },

    async saveIncompleteMatch(categoryId, groupLabel, player1Id, player2Id, sets) {
      const { data, error } = await supabase
        .from("matches")
        .insert({
          match_type: "tournament",
          category_id: categoryId,
          group_label: groupLabel,
          player1_id: player1Id,
          player2_id: player2Id,
          stage: "group",
          status: "incomplete",
          sets,
          played_at: new Date().toISOString().split("T")[0],
        })
        .select()
        .single();
      if (error) throw error;
      return mapMatch(data);
    },

    async completeMatch(matchId, sets, winnerId) {
      const { data, error } = await supabase
        .from("matches")
        .update({
          sets,
          winner_id: winnerId,
          status: "completed",
          played_at: new Date().toISOString().split("T")[0],
        })
        .eq("id", matchId)
        .select()
        .single();
      if (error) throw error;
      return mapMatch(data);
    },

    async getStandings(categoryId, group) {
      const playerNameMap = await this.getPlayerNameMap(categoryId, group);
      const players = [...playerNameMap.entries()].map(([id, name]) => ({ id, name }));
      const matches = await this.getMatches(categoryId, group);
      return computeStandings(players, matches, group);
    },

    async getCategorySummaries() {
      const cats = await this.getCategories();
      const summaries: CategorySummary[] = [];

      for (const cat of cats) {
        const { count } = await supabase
          .from("matches")
          .select("*", { count: "exact", head: true })
          .eq("category_id", cat.id)
          .eq("status", "completed");

        const totalPerGroup = (cat.groupSize * (cat.groupSize - 1)) / 2;
        const total = totalPerGroup * cat.groupCount;
        const completedCount = count ?? 0;

        const groups = cat.groupCount > 1
          ? Array.from({ length: cat.groupCount }, (_, i) => String.fromCharCode(65 + i))
          : ["A"];

        const allStandings = [];
        for (const g of groups) {
          const standings = await this.getStandings(cat.id, g);
          allStandings.push(...standings);
        }

        const leaders = allStandings
          .sort((a, b) => b.points - a.points)
          .slice(0, cat.groupCount > 1 ? 3 : 2)
          .map((s) => ({ name: s.playerName, points: s.points }));

        summaries.push({ category: cat, totalMatches: total, completedMatches: completedCount, leaders });
      }
      return summaries;
    },

    async getRemainingFixtures(playerIds, categoryId, group) {
      const matches = await this.getMatches(categoryId, group);
      const playedPairs = new Set(
        matches
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
      const { data, error } = await supabase
        .from("locked_brackets")
        .select("*")
        .eq("category_id", categoryId)
        .single();
      if (error || !data) return null;
      return {
        categoryId: data.category_id,
        bracket: data.bracket_data as Bracket,
        lockedAt: data.locked_at,
      };
    },

    async lockBracket(categoryId, bracket) {
      const { error } = await supabase
        .from("locked_brackets")
        .upsert({
          category_id: categoryId,
          bracket_data: bracket,
          locked_at: new Date().toISOString(),
        }, { onConflict: "category_id" });
      if (error) throw error;
    },

    async unlockBracket(categoryId) {
      const { error } = await supabase
        .from("locked_brackets")
        .delete()
        .eq("category_id", categoryId);
      if (error) throw error;
    },

    async updateBracketMatch(categoryId, matchId, sets, winnerId) {
      const locked = await this.getLockedBracket(categoryId);
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
      await supabase
        .from("locked_brackets")
        .update({ bracket_data: locked.bracket })
        .eq("category_id", categoryId);
    },

    async getLeagueSeasons() {
      const { data, error } = await supabase.from("league_seasons").select("*").order("start_date", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((s: Record<string, unknown>) => ({
        id: s.id as string,
        name: s.name as string,
        startDate: s.start_date as string,
        endDate: s.end_date as string,
        status: s.status as "upcoming" | "active" | "completed",
        tiered: s.tiered as boolean,
      }));
    },

    async createLeagueSeason(input) {
      const { data, error } = await supabase.from("league_seasons").insert({
        name: input.name,
        start_date: input.startDate,
        end_date: input.endDate,
        status: "upcoming",
        tiered: false,
      }).select().single();
      if (error) throw error;

      const newSeason = {
        id: data.id as string,
        name: data.name as string,
        startDate: data.start_date as string,
        endDate: data.end_date as string,
        status: data.status as "upcoming" | "active" | "completed",
        tiered: data.tiered as boolean,
      };

      // Auto-enroll players: check if there's a previous season
      const { data: prevSeasons } = await supabase
        .from("league_seasons")
        .select("id")
        .neq("id", newSeason.id)
        .order("start_date", { ascending: false })
        .limit(1);

      let playerIdsToEnroll: string[] = [];

      if (!prevSeasons || prevSeasons.length === 0) {
        // Season 1 — enroll ALL players
        const { data: allPlayers } = await supabase.from("players").select("id");
        playerIdsToEnroll = (allPlayers ?? []).map((p: Record<string, string>) => p.id);
      } else {
        // Season 2+ — enroll players from previous season who didn't opt out
        const prevSeasonId = (prevSeasons[0] as Record<string, string>).id;
        const { data: prevEnrollments } = await supabase
          .from("league_season_enrollments")
          .select("player_id, opted_out")
          .eq("season_id", prevSeasonId);
        playerIdsToEnroll = (prevEnrollments ?? [])
          .filter((e: Record<string, unknown>) => !e.opted_out)
          .map((e: Record<string, string>) => e.player_id);
      }

      if (playerIdsToEnroll.length > 0) {
        const enrollments = playerIdsToEnroll.map((pid) => ({
          season_id: newSeason.id,
          player_id: pid,
          opted_out: false,
        }));
        await supabase.from("league_season_enrollments").insert(enrollments);
      }

      return newSeason;
    },

    async closeLeagueSeason(id) {
      const { error } = await supabase.from("league_seasons").update({ status: "completed" }).eq("id", id);
      if (error) throw error;
    },

    // Tournament registrations
    async registerForTournament(playerId, categoryId) {
      const { error } = await supabase
        .from("tournament_registrations")
        .upsert({ player_id: playerId, category_id: categoryId, status: "pending" }, { onConflict: "player_id,category_id" });
      if (error) throw error;
    },

    async withdrawFromTournament(playerId, categoryId) {
      const { error } = await supabase
        .from("tournament_registrations")
        .update({ status: "withdrawn" })
        .eq("player_id", playerId)
        .eq("category_id", categoryId);
      if (error) throw error;
    },

    async getMyRegistrations(playerId) {
      const { data, error } = await supabase
        .from("tournament_registrations")
        .select("category_id, status")
        .eq("player_id", playerId);
      if (error) throw error;
      return (data ?? []).map((r: Record<string, string>) => ({
        categoryId: r.category_id,
        status: r.status,
      }));
    },

    async getRegistrations(categoryId) {
      const { data, error } = await supabase
        .from("tournament_registrations")
        .select("player_id, registered_at, status, players(name)")
        .eq("category_id", categoryId)
        .order("registered_at", { ascending: true });
      if (error) throw error;
      return (data ?? []).map((r: Record<string, unknown>) => ({
        playerId: r.player_id as string,
        playerName: ((r.players as Record<string, string> | null)?.name) ?? "Unknown",
        registeredAt: r.registered_at as string,
        status: r.status as string,
      }));
    },

    async openRegistration(categoryId, deadline) {
      const { error } = await supabase
        .from("categories")
        .update({ registration_open: true, registration_deadline: deadline })
        .eq("id", categoryId);
      if (error) throw error;
    },

    async closeRegistration(categoryId) {
      const { error } = await supabase
        .from("categories")
        .update({ registration_open: false })
        .eq("id", categoryId);
      if (error) throw error;
    },

    async extendRegistrationDeadline(categoryId, newDeadline) {
      const { error } = await supabase
        .from("categories")
        .update({ registration_deadline: newDeadline })
        .eq("id", categoryId);
      if (error) throw error;
    },

    // League season enrollments
    async getSeasonEnrollments(seasonId) {
      const { data, error } = await supabase
        .from("league_season_enrollments")
        .select("player_id, opted_out, players(name)")
        .eq("season_id", seasonId);
      if (error) throw error;
      return (data ?? []).map((e: Record<string, unknown>) => ({
        playerId: e.player_id as string,
        playerName: ((e.players as Record<string, string> | null)?.name) ?? "Unknown",
        optedOut: e.opted_out as boolean,
      }));
    },

    async optOutOfSeason(playerId, seasonId) {
      const { error } = await supabase
        .from("league_season_enrollments")
        .update({ opted_out: true, opted_out_at: new Date().toISOString() })
        .eq("player_id", playerId)
        .eq("season_id", seasonId);
      if (error) throw error;
    },

    async optBackIntoSeason(playerId, seasonId) {
      const { error } = await supabase
        .from("league_season_enrollments")
        .update({ opted_out: false, opted_out_at: null })
        .eq("player_id", playerId)
        .eq("season_id", seasonId);
      if (error) throw error;
    },

    async getEnrollmentPreview(_categoryId) {
      // Count how many players would be auto-enrolled if a new season were created
      const { data: prevSeasons } = await supabase
        .from("league_seasons")
        .select("id")
        .order("start_date", { ascending: false })
        .limit(1);

      if (!prevSeasons || prevSeasons.length === 0) {
        const { count } = await supabase.from("players").select("*", { count: "exact", head: true });
        return { count: count ?? 0 };
      }

      const prevSeasonId = (prevSeasons[0] as Record<string, string>).id;
      const { count } = await supabase
        .from("league_season_enrollments")
        .select("*", { count: "exact", head: true })
        .eq("season_id", prevSeasonId)
        .eq("opted_out", false);
      return { count: count ?? 0 };
    },

    // ── League ratings ──────────────────────────────────────────────────────

    async getLeagueRatings() {
      const { data, error } = await supabase
        .from("league_ratings")
        .select("player_id, rating, games_played, players(name)")
        .order("rating", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((r: Record<string, unknown>) => ({
        playerId: r.player_id as string,
        playerName: ((r.players as Record<string, string>) ?? {}).name ?? "Unknown",
        rating: r.rating as number,
        gamesPlayed: r.games_played as number,
      }));
    },

    async getPlayerLeagueRating(playerId) {
      const { data } = await supabase
        .from("league_ratings")
        .select("*")
        .eq("player_id", playerId)
        .maybeSingle();
      if (!data) return null;
      return {
        playerId: data.player_id,
        rating: data.rating,
        gamesPlayed: data.games_played,
        updatedAt: data.updated_at,
      };
    },

    async createLeagueChallenge(challengerId, challengedId, seasonId) {
      void seasonId;
      const { data, error } = await supabase
        .from("matches")
        .insert({
          match_type: "league",
          player1_id: challengerId,
          player2_id: challengedId,
          stage: "group",
          status: "requested",
          sets: [],
        })
        .select()
        .single();
      if (error) throw error;
      return mapMatch(data);
    },

    async getLeagueMatches(playerId) {
      const { data, error } = await supabase
        .from("matches")
        .select("*")
        .eq("match_type", "league")
        .or(`player1_id.eq.${playerId},player2_id.eq.${playerId}`)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map(mapMatch);
    },

    async completeLeagueMatch(matchId, sets, winnerId) {
      // 1. Load the match
      const { data: matchRow, error: mErr } = await supabase
        .from("matches").select("*").eq("id", matchId).single();
      if (mErr) throw mErr;
      const p1 = matchRow.player1_id as string;
      const p2 = matchRow.player2_id as string;
      const loser = winnerId === p1 ? p2 : p1;

      // 2. Get or initialise ratings (no category — one rating per player)
      async function getOrInitRating(pid: string): Promise<number> {
        const { data } = await supabase
          .from("league_ratings").select("rating").eq("player_id", pid).maybeSingle();
        if (data) return data.rating as number;
        const { data: player } = await supabase.from("players").select("skill_level").eq("id", pid).single();
        const skillMap: Record<string, number> = { advanced: 1200, intermediate: 1000, improver: 800, beginner: 600 };
        const initial = skillMap[(player?.skill_level as string) ?? "beginner"] ?? 1000;
        await supabase.from("league_ratings").upsert({ player_id: pid, rating: initial, games_played: 0 });
        return initial;
      }

      const winnerRating = await getOrInitRating(winnerId);
      const loserRating = await getOrInitRating(loser);

      // 3. Calculate % transfer
      const pct = winnerRating >= loserRating ? 0.03 : 0.05;
      const transfer = Math.round(pct * loserRating);
      const newWinnerRating = winnerRating + transfer;
      const newLoserRating = Math.max(400, loserRating - transfer);

      // 4. Fetch current games_played for increment
      const [wGames, lGames] = await Promise.all([
        supabase.from("league_ratings").select("games_played").eq("player_id", winnerId).single(),
        supabase.from("league_ratings").select("games_played").eq("player_id", loser).single(),
      ]);

      // 5. Upsert updated ratings
      await Promise.all([
        supabase.from("league_ratings").upsert({
          player_id: winnerId, rating: newWinnerRating,
          games_played: (wGames.data?.games_played ?? 0) + 1,
          updated_at: new Date().toISOString(),
        }),
        supabase.from("league_ratings").upsert({
          player_id: loser, rating: newLoserRating,
          games_played: (lGames.data?.games_played ?? 0) + 1,
          updated_at: new Date().toISOString(),
        }),
      ]);

      // 6. Get active season for history
      const { data: seasonData } = await supabase
        .from("league_seasons").select("id").eq("status", "active").maybeSingle();
      const seasonId = (seasonData as Record<string, string> | null)?.id ?? null;

      // 7. Insert rating history
      await supabase.from("league_rating_history").insert([
        { player_id: winnerId, season_id: seasonId, match_id: matchId,
          rating_before: winnerRating, rating_after: newWinnerRating, rating_change: transfer },
        { player_id: loser, season_id: seasonId, match_id: matchId,
          rating_before: loserRating, rating_after: newLoserRating, rating_change: -transfer },
      ]);

      // 8. Complete the match
      const { data, error } = await supabase
        .from("matches")
        .update({ sets, winner_id: winnerId, status: "completed", played_at: new Date().toISOString().split("T")[0] })
        .eq("id", matchId).select().single();
      if (error) throw error;
      return mapMatch(data);
    },

    async logLeagueMatch(player1Id, player2Id, sets, winnerId, seasonId) {
      const match = await this.createLeagueChallenge(player1Id, player2Id, seasonId);
      return await this.completeLeagueMatch(match.id, sets, winnerId);
    },

    // ── Tournament draw ─────────────────────────────────────────────────────

    async generateDraw(categoryId, groupCount, seedPlayerIds) {
      // 1. Get registered players
      const { data: regs, error: regErr } = await supabase
        .from("tournament_registrations")
        .select("player_id")
        .eq("category_id", categoryId)
        .neq("status", "withdrawn");
      if (regErr) throw regErr;
      const allPlayerIds = (regs ?? []).map((r: Record<string, string>) => r.player_id);

      if (allPlayerIds.length === 0) throw new Error("No registered players.");
      if (allPlayerIds.length % groupCount !== 0)
        throw new Error(`${allPlayerIds.length} players cannot be evenly split into ${groupCount} groups.`);

      // 2. Remove existing assignments
      await supabase.from("group_assignments").delete().eq("category_id", categoryId).not("player_id", "is", null);

      // 3. Validate seeds
      const validSeeds = seedPlayerIds.filter((id) => allPlayerIds.includes(id)).slice(0, groupCount);
      const unseeded = allPlayerIds.filter((id) => !validSeeds.includes(id));

      // 4. Shuffle unseeded players (Fisher-Yates)
      for (let i = unseeded.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [unseeded[i], unseeded[j]] = [unseeded[j], unseeded[i]];
      }

      // 5. Shuffle seed assignment to groups
      const shuffledSeeds = [...validSeeds];
      for (let i = shuffledSeeds.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledSeeds[i], shuffledSeeds[j]] = [shuffledSeeds[j], shuffledSeeds[i]];
      }

      // 6. Build groups: one seed per group, then fill with unseeded round-robin
      const groups: string[][] = Array.from({ length: groupCount }, () => []);
      shuffledSeeds.forEach((seed, i) => groups[i].push(seed));
      let idx = 0;
      for (const pid of unseeded) {
        groups[idx % groupCount].push(pid);
        idx++;
      }

      // 7. Insert group_assignments
      const assignments = groups.flatMap((group, gi) =>
        group.map((pid) => ({
          player_id: pid,
          category_id: categoryId,
          group_label: String.fromCharCode(65 + gi),
        }))
      );
      const { error: insertErr } = await supabase.from("group_assignments").insert(assignments);
      if (insertErr) throw insertErr;
    },

    // ── Walkover processing ─────────────────────────────────────────────────

    async getMissedFixtures(categoryId) {
      const { data: cat } = await supabase.from("categories").select("group_deadline").eq("id", categoryId).single();
      if (!cat) return [];
      const deadline = cat.group_deadline as string;
      if (new Date(deadline) >= new Date()) return [];

      // get player name map
      const nameMap = await this.getPlayerNameMap(categoryId);

      // get all group assignments
      const { data: assignments } = await supabase
        .from("group_assignments").select("player_id, group_label").eq("category_id", categoryId).not("player_id", "is", null);
      if (!assignments || assignments.length === 0) return [];

      // get completed/walkover matches
      const { data: played } = await supabase
        .from("matches").select("player1_id, player2_id, group_label, status")
        .eq("category_id", categoryId)
        .in("status", ["completed", "walkover", "incomplete"]);
      const playedPairs = new Set(
        (played ?? []).map((m: Record<string, string>) => [m.player1_id, m.player2_id].sort().join("-"))
      );

      // group players by group_label
      const byGroup = new Map<string, string[]>();
      for (const a of assignments) {
        const g = a.group_label as string;
        const pid = a.player_id as string;
        if (!byGroup.has(g)) byGroup.set(g, []);
        byGroup.get(g)!.push(pid);
      }

      const missed: { player1Id: string; player2Id: string; player1Name: string; player2Name: string; groupLabel: string; deadline: string }[] = [];
      for (const [groupLabel, players] of byGroup) {
        for (let i = 0; i < players.length; i++) {
          for (let j = i + 1; j < players.length; j++) {
            const key = [players[i], players[j]].sort().join("-");
            if (!playedPairs.has(key)) {
              missed.push({
                player1Id: players[i],
                player2Id: players[j],
                player1Name: nameMap.get(players[i]) ?? players[i],
                player2Name: nameMap.get(players[j]) ?? players[j],
                groupLabel,
                deadline,
              });
            }
          }
        }
      }
      return missed;
    },

    async awardWalkover(categoryId, groupLabel, winnerId, loserId) {
      const { data, error } = await supabase
        .from("matches")
        .insert({
          match_type: "tournament",
          category_id: categoryId,
          group_label: groupLabel,
          player1_id: winnerId,
          player2_id: loserId,
          stage: "group",
          status: "walkover",
          winner_id: winnerId,
          sets: [],
          played_at: new Date().toISOString().split("T")[0],
        })
        .select().single();
      if (error) throw error;
      return mapMatch(data);
    },
  };
}
