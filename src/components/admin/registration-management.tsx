"use client";

import { useState, useEffect, useCallback } from "react";
import { Users, CalendarDays, ToggleLeft, ToggleRight, ChevronDown, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { getService } from "@/lib/services";
import type { Category } from "@/lib/types";
import { DrawGenerator } from "./draw-generator";
import { WalkoverManager } from "./walkover-manager";

const CATEGORY_SLUGS = [
  { slug: "mens-singles", label: "Men's Singles" },
  { slug: "womens-singles", label: "Women's Singles" },
  { slug: "mixed-doubles", label: "Mixed Doubles" },
];

interface Registration {
  playerId: string;
  playerName: string;
  registeredAt: string;
  status: string;
}

interface CategoryRegistrationCardProps {
  category: Category;
  onUpdated: () => void;
}

function CategoryRegistrationCard({ category, onUpdated }: CategoryRegistrationCardProps) {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loadingRegs, setLoadingRegs] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [deadlineEdit, setDeadlineEdit] = useState(false);
  const [newDeadline, setNewDeadline] = useState(category.registrationDeadline ?? "");
  const [error, setError] = useState("");
  const [hasExistingDraw, setHasExistingDraw] = useState(false);

  const loadRegistrations = useCallback(async () => {
    setLoadingRegs(true);
    try {
      const regs = await getService().getRegistrations(category.id);
      setRegistrations(regs);
    } finally {
      setLoadingRegs(false);
    }
  }, [category.id]);

  const checkExistingDraw = useCallback(async () => {
    try {
      const assignments = await getService().getGroupAssignments(category.id);
      setHasExistingDraw(assignments.length > 0);
    } catch {
      setHasExistingDraw(false);
    }
  }, [category.id]);

  useEffect(() => {
    if (expanded) loadRegistrations();
  }, [expanded, loadRegistrations]);

  useEffect(() => {
    if (!category.registrationOpen) {
      checkExistingDraw();
    }
  }, [category.registrationOpen, checkExistingDraw]);

  async function handleOpenRegistration() {
    if (!newDeadline) {
      setError("Set a deadline before opening registration.");
      setDeadlineEdit(true);
      return;
    }
    setError("");
    setBusy(true);
    try {
      await getService().openRegistration(category.id, newDeadline);
      onUpdated();
    } finally {
      setBusy(false);
    }
  }

  async function handleCloseRegistration() {
    setBusy(true);
    try {
      await getService().closeRegistration(category.id);
      onUpdated();
    } finally {
      setBusy(false);
    }
  }

  async function handleExtendDeadline() {
    if (!newDeadline) {
      setError("Please enter a new deadline.");
      return;
    }
    setError("");
    setBusy(true);
    try {
      await getService().extendRegistrationDeadline(category.id, newDeadline);
      setDeadlineEdit(false);
      onUpdated();
    } finally {
      setBusy(false);
    }
  }

  const isOpen = category.registrationOpen ?? false;
  const deadline = category.registrationDeadline;
  const activeRegs = registrations.filter((r) => r.status !== "withdrawn");

  return (
    <div className="space-y-3">
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">{category.name}</CardTitle>
          <div className="flex items-center gap-2">
            <Badge
              variant={isOpen ? "default" : "secondary"}
              className={isOpen ? "bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-400" : "text-xs"}
            >
              {isOpen ? "Open" : "Closed"}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-xs text-muted-foreground flex items-center gap-4">
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {registrations.filter((r) => r.status !== "withdrawn").length} registered
          </span>
          {deadline && (
            <span className="flex items-center gap-1">
              <CalendarDays className="h-3 w-3" />
              Deadline: {new Date(deadline).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
            </span>
          )}
          {!deadline && <span className="text-amber-600">No deadline set</span>}
        </div>

        {/* Deadline editor */}
        {(deadlineEdit || !deadline) && (
          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={newDeadline}
              onChange={(e) => setNewDeadline(e.target.value)}
              className="h-7 text-xs flex-1"
              placeholder="Set deadline"
            />
            {deadline && (
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={handleExtendDeadline} disabled={busy}>
                Save
              </Button>
            )}
            {deadline && (
              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setDeadlineEdit(false)}>
                Cancel
              </Button>
            )}
          </div>
        )}

        {error && <p className="text-xs text-destructive">{error}</p>}

        <div className="flex flex-wrap gap-2">
          {!isOpen && (
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 text-xs"
              onClick={handleOpenRegistration}
              disabled={busy}
            >
              <ToggleRight className="h-3.5 w-3.5" />
              Open Registration
            </Button>
          )}
          {isOpen && (
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 text-xs text-muted-foreground"
              onClick={handleCloseRegistration}
              disabled={busy}
            >
              <ToggleLeft className="h-3.5 w-3.5" />
              Close Registration
            </Button>
          )}
          {deadline && !deadlineEdit && (
            <Button
              size="sm"
              variant="ghost"
              className="gap-1.5 text-xs"
              onClick={() => { setDeadlineEdit(true); setNewDeadline(deadline); }}
            >
              <CalendarDays className="h-3.5 w-3.5" />
              {isOpen ? "Extend Deadline" : "Change Deadline"}
            </Button>
          )}
        </div>

        {/* Registration list toggle */}
        <button
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          {expanded ? "Hide" : "Show"} registered players
        </button>

        {expanded && (
          <div className="space-y-1 mt-1">
            {loadingRegs ? (
              <p className="text-xs text-muted-foreground py-2 text-center">Loading…</p>
            ) : activeRegs.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2 text-center">No registrations yet.</p>
            ) : (
              <div className="rounded-lg border overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left px-3 py-2 font-medium text-muted-foreground">Player</th>
                      <th className="text-left px-3 py-2 font-medium text-muted-foreground">Registered</th>
                      <th className="text-left px-3 py-2 font-medium text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {registrations.map((r) => (
                      <tr key={r.playerId} className="border-t">
                        <td className="px-3 py-2 font-medium">{r.playerName}</td>
                        <td className="px-3 py-2 text-muted-foreground">
                          {r.registeredAt
                            ? new Date(r.registeredAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })
                            : "—"}
                        </td>
                        <td className="px-3 py-2">
                          <Badge
                            variant={r.status === "confirmed" ? "default" : r.status === "withdrawn" ? "secondary" : "outline"}
                            className={
                              r.status === "confirmed"
                                ? "bg-green-100 text-green-700 border-green-300 text-[10px]"
                                : r.status === "withdrawn"
                                ? "text-[10px] line-through opacity-60"
                                : "text-[10px]"
                            }
                          >
                            {r.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>

    {!isOpen && (
      <>
        <DrawGenerator
          categoryId={category.id}
          categoryName={category.name}
          registeredCount={activeRegs.length}
          hasExistingDraw={hasExistingDraw}
        />
        <WalkoverManager
          categoryId={category.id}
          categoryName={category.name}
        />
      </>
    )}
    </div>
  );
}

export function RegistrationManagement() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const cats = await getService().getCategories();
      setCategories(cats);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return <p className="text-sm text-muted-foreground py-4 text-center">Loading…</p>;
  }

  // Show only the 3 known categories (in order)
  const orderedCats = CATEGORY_SLUGS
    .map(({ slug }) => categories.find((c) => c.slug === slug))
    .filter((c): c is Category => !!c);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Manage tournament registration for each category.
      </p>
      {orderedCats.map((cat) => (
        <CategoryRegistrationCard key={cat.id} category={cat} onUpdated={load} />
      ))}
    </div>
  );
}
