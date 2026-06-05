import { useSupabase } from "../supabase/config";
import { createMockService } from "./mock-service";
import { createSupabaseService } from "./supabase-service";
import type { TournamentService } from "./types";

export type { TournamentService } from "./types";
export type { LockedBracketData } from "./types";

let _service: TournamentService | null = null;

export function getService(): TournamentService {
  if (!_service) {
    _service = useSupabase ? createSupabaseService() : createMockService();
  }
  return _service;
}
