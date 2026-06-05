"use client";

import { useState } from "react";
import { useCurrentUser } from "@/lib/current-user";
import { getService } from "@/lib/services";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface Props {
  opponent: { id: string; name: string } | null;
  seasonId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function ChallengeDialog({ opponent, seasonId, onClose, onSuccess }: Props) {
  const currentUser = useCurrentUser();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [succeeded, setSucceeded] = useState(false);

  async function handleConfirm() {
    if (!opponent) return;
    setBusy(true);
    setError(null);
    try {
      await getService().createLeagueChallenge(currentUser.id, opponent.id, seasonId);
      setSucceeded(true);
      onSuccess();
      // Small delay so user sees the success state before dialog closes
      setTimeout(() => {
        setSucceeded(false);
        onClose();
      }, 800);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  function handleOpenChange(open: boolean) {
    if (!open) {
      setError(null);
      setSucceeded(false);
      onClose();
    }
  }

  return (
    <Dialog open={opponent !== null} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Challenge {opponent?.name ?? ""}?</DialogTitle>
          <DialogDescription>
            A match will be created. Arrange the time via WhatsApp.
          </DialogDescription>
        </DialogHeader>

        {succeeded && (
          <p className="text-sm text-green-600 font-medium">Challenge sent successfully!</p>
        )}

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={busy || succeeded}>
            {busy ? "Sending…" : "Send Challenge"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
