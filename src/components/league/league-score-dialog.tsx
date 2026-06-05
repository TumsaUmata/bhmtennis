"use client";

import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScoreEntry } from "@/components/matches/score-entry";
import { getService } from "@/lib/services";
import type { SetScore } from "@/lib/types";

interface Player { id: string; name: string }

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  seasonId: string;
  currentUser: Player;
  // Pre-filled for completing an existing requested match
  matchId?: string;
  opponent?: Player;
  // Available for free-entry mode (log a match that wasn't arranged here)
  enrolledPlayers?: Player[];
}

export function LeagueScoreDialog({
  open, onClose, onSuccess, seasonId, currentUser,
  matchId, opponent: prefilledOpponent, enrolledPlayers = [],
}: Props) {
  const [opponent, setOpponent] = useState<Player | null>(prefilledOpponent ?? null);
  const [step, setStep] = useState<"select" | "score">(prefilledOpponent ? "score" : "select");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const isFreeEntry = !matchId;

  function handleClose() {
    setOpponent(prefilledOpponent ?? null);
    setStep(prefilledOpponent ? "score" : "select");
    setError("");
    onClose();
  }

  function handleOpponentSelect(playerId: string) {
    const p = enrolledPlayers.find((pl) => pl.id === playerId) ?? null;
    setOpponent(p);
  }

  function handleNext() {
    if (!opponent) { setError("Select an opponent first."); return; }
    setError("");
    setStep("score");
  }

  async function handleSubmit(sets: SetScore[], winnerId: string) {
    if (!opponent) return;
    setSaving(true);
    setError("");
    try {
      if (matchId) {
        await getService().completeLeagueMatch(matchId, sets, winnerId);
      } else {
        await getService().logLeagueMatch(currentUser.id, opponent.id, sets, winnerId, seasonId);
      }
      onSuccess();
      handleClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save match.");
    } finally {
      setSaving(false);
    }
  }

  const othersForSelect = enrolledPlayers.filter((p) => p.id !== currentUser.id);

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {isFreeEntry ? "Log a league match" : `vs ${prefilledOpponent?.name ?? ""}`}
          </DialogTitle>
          <DialogDescription>
            {isFreeEntry
              ? "Record a match you played outside the app."
              : "Enter the result to update ratings."}
          </DialogDescription>
        </DialogHeader>

        {step === "select" && (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Who did you play?</label>
              <select
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm text-foreground transition-colors outline-none focus:border-ring dark:bg-input/30"
                value={opponent?.id ?? ""}
                onChange={(e) => handleOpponentSelect(e.target.value)}
              >
                <option value="" disabled>Select opponent…</option>
                {othersForSelect.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            {error && <p className="text-xs text-destructive">{error}</p>}
            <div className="flex gap-2">
              <Button size="sm" onClick={handleNext} disabled={!opponent}>Next</Button>
              <Button size="sm" variant="ghost" onClick={handleClose}>Cancel</Button>
            </div>
          </div>
        )}

        {step === "score" && opponent && (
          <div className="space-y-3">
            {error && <p className="text-sm text-destructive">{error}</p>}
            {saving && <p className="text-sm text-muted-foreground">Saving…</p>}
            <ScoreEntry
              player1Name={currentUser.name}
              player2Name={opponent.name}
              player1Id={currentUser.id}
              player2Id={opponent.id}
              onSubmit={handleSubmit}
              onCancel={() => {
                if (isFreeEntry) setStep("select");
                else handleClose();
              }}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
