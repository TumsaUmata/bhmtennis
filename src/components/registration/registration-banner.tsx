"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { CheckCircle, LogIn, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getService } from "@/lib/services";
import { useCurrentUser, isGuest } from "@/lib/current-user";
import type { Category } from "@/lib/types";

interface RegistrationBannerProps {
  category: Category;
}

export function RegistrationBanner({ category }: RegistrationBannerProps) {
  const currentUser = useCurrentUser();
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (isGuest(currentUser)) {
      setLoading(false);
      return;
    }
    const regs = await getService().getMyRegistrations(currentUser.id);
    const mine = regs.find((r) => r.categoryId === category.id);
    setStatus(mine?.status ?? null);
    setLoading(false);
  }, [currentUser, category.id]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleRegister() {
    if (isGuest(currentUser)) return;
    setBusy(true);
    try {
      await getService().registerForTournament(currentUser.id, category.id);
      setStatus("pending");
    } finally {
      setBusy(false);
    }
  }

  async function handleWithdraw() {
    if (isGuest(currentUser)) return;
    setBusy(true);
    try {
      await getService().withdrawFromTournament(currentUser.id, category.id);
      setStatus("withdrawn");
    } finally {
      setBusy(false);
    }
  }

  // Don't render anything if loading or registration not open and player isn't registered
  if (loading) return null;

  const isOpen = category.registrationOpen ?? false;
  const isRegistered = status === "pending" || status === "confirmed";
  const isWithdrawn = status === "withdrawn";
  const deadline = category.registrationDeadline;

  // Guest user
  if (isGuest(currentUser)) {
    if (!isOpen) return null;
    return (
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex items-center justify-between py-3">
          <p className="text-sm text-muted-foreground">Registration is open for this category.</p>
          <Link href="/login">
            <Button size="sm" variant="outline" className="gap-1.5">
              <LogIn className="h-3.5 w-3.5" />
              Sign in to register
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  // Registration open + registered
  if (isRegistered) {
    return (
      <Card className="border-green-500/30 bg-green-500/5">
        <CardContent className="flex items-center justify-between py-3">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <div>
              <span className="text-sm font-medium text-green-700 dark:text-green-400">
                Registered
              </span>
              {deadline && (
                <span className="text-xs text-muted-foreground ml-2">
                  Deadline: {new Date(deadline).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                </span>
              )}
            </div>
            <Badge
              variant="secondary"
              className={status === "confirmed" ? "bg-green-100 text-green-700 border-green-300" : ""}
            >
              {status === "confirmed" ? "Confirmed" : "Pending"}
            </Badge>
          </div>
          {isOpen && (
            <Button
              size="sm"
              variant="ghost"
              className="gap-1.5 text-muted-foreground hover:text-destructive"
              onClick={handleWithdraw}
              disabled={busy}
            >
              <X className="h-3.5 w-3.5" />
              Withdraw
            </Button>
          )}
          {!isOpen && (
            <Badge variant="secondary" className="text-xs">Registration closed</Badge>
          )}
        </CardContent>
      </Card>
    );
  }

  // Registration open + not registered (or previously withdrawn)
  if (isOpen) {
    return (
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex items-center justify-between py-3">
          <div>
            <p className="text-sm font-medium">Registration is open</p>
            {deadline && (
              <p className="text-xs text-muted-foreground">
                Deadline: {new Date(deadline).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
              </p>
            )}
          </div>
          <Button size="sm" onClick={handleRegister} disabled={busy}>
            {busy ? "Registering…" : isWithdrawn ? "Re-register" : "Register"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Registration closed, and they're not registered (nothing to show)
  return null;
}
