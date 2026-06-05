"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Medal, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getService } from "@/lib/services";
import type { LeagueSeason, LeagueSeasonInput } from "@/lib/types";

const STATUS_LABELS: Record<string, string> = {
  upcoming: "Upcoming",
  active: "Active",
  completed: "Completed",
};

export function LeagueManagement() {
  const [seasons, setSeasons] = useState<LeagueSeason[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [closing, setClosing] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [enrollmentPreview, setEnrollmentPreview] = useState<number | null>(null);

  const [form, setForm] = useState<LeagueSeasonInput>({
    name: "", startDate: "", endDate: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await getService().getLeagueSeasons();
      setSeasons(list);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!showForm) { setEnrollmentPreview(null); return; }
    getService().getEnrollmentPreview("").then((p) => setEnrollmentPreview(p.count));
  }, [showForm]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.startDate || !form.endDate) {
      setError("All fields required.");
      return;
    }
    setError("");
    setSaving(true);
    try {
      await getService().createLeagueSeason(form);
      setForm({ name: "", startDate: "", endDate: "" });
      setShowForm(false);
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create season.");
    } finally {
      setSaving(false);
    }
  }

  async function handleClose(id: string) {
    setClosing(id);
    try {
      await getService().closeLeagueSeason(id);
      await load();
    } finally {
      setClosing(null);
    }
  }

  const activeSeason = seasons.find((s) => s.status === "active");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{seasons.length} season{seasons.length !== 1 ? "s" : ""}</p>
        <Button size="sm" onClick={() => setShowForm((v) => !v)} disabled={!!activeSeason}>
          <Plus className="h-4 w-4" />
          New Season
        </Button>
      </div>

      {activeSeason && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-sm text-amber-600 dark:text-amber-400">
          Close the active season before creating a new one.
        </div>
      )}

      {showForm && !activeSeason && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Create Season</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1 col-span-2">
                  <label className="text-xs font-medium">Season name</label>
                  <Input placeholder="Summer 2026" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">Start date</label>
                  <Input type="date" value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">End date</label>
                  <Input type="date" value={form.endDate} onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))} />
                </div>
              </div>
              {enrollmentPreview !== null && (
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm">
                  <span className="font-medium">{enrollmentPreview}</span>{" "}
                  <span className="text-muted-foreground">
                    {enrollmentPreview === 1 ? "player" : "players"} will be auto-enrolled in this season.
                  </span>
                </div>
              )}
              {error && <p className="text-xs text-destructive">{error}</p>}
              <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={saving}>{saving ? "Creating…" : "Create"}</Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground py-4 text-center">Loading…</p>
      ) : seasons.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
            <Medal className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No seasons yet. Create the first one to open the league.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {seasons.map((s) => (
            <Card key={s.id}>
              <CardContent className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium">{s.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(s.startDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                    {" – "}
                    {new Date(s.endDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={s.status === "active" ? "default" : "secondary"}
                    className={s.status === "active" ? "bg-primary/10 text-primary border-primary/20" : "text-xs"}
                  >
                    {STATUS_LABELS[s.status] ?? s.status}
                  </Badge>
                  {s.status === "active" && (
                    <Button size="sm" variant="outline" onClick={() => handleClose(s.id)} disabled={closing === s.id}>
                      <CheckCircle className="h-3.5 w-3.5" />
                      {closing === s.id ? "Closing…" : "Close"}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
