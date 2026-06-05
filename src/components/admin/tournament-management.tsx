"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Trophy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getService } from "@/lib/services";
import type { Tournament, TournamentInput } from "@/lib/types";

const STATUS_LABELS: Record<string, string> = {
  upcoming: "Upcoming",
  group_stage: "Group Stage",
  knockout: "Knockout",
  completed: "Completed",
};

export function TournamentManagement() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState<TournamentInput>({
    name: "", slug: "", shortName: "", startDate: "", endDate: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await getService().getTournaments();
      setTournaments(list);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function updateForm(field: keyof TournamentInput, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.slug || !form.startDate || !form.endDate) {
      setError("All fields required.");
      return;
    }
    setError("");
    setSaving(true);
    try {
      await getService().createTournament(form);
      setForm({ name: "", slug: "", shortName: "", startDate: "", endDate: "" });
      setShowForm(false);
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create tournament.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{tournaments.length} tournament{tournaments.length !== 1 ? "s" : ""}</p>
        <Button size="sm" onClick={() => setShowForm((v) => !v)}>
          <Plus className="h-4 w-4" />
          New Tournament
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Create Tournament</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1 col-span-2">
                  <label className="text-xs font-medium">Full name</label>
                  <Input placeholder="Blackhorse Mills Tennis Tournament" value={form.name} onChange={(e) => updateForm("name", e.target.value)} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">Short name</label>
                  <Input placeholder="Summer 2026" value={form.shortName} onChange={(e) => updateForm("shortName", e.target.value)} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">Slug (URL)</label>
                  <Input placeholder="2026-summer" value={form.slug} onChange={(e) => updateForm("slug", e.target.value)} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">Start date</label>
                  <Input type="date" value={form.startDate} onChange={(e) => updateForm("startDate", e.target.value)} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">End date</label>
                  <Input type="date" value={form.endDate} onChange={(e) => updateForm("endDate", e.target.value)} />
                </div>
              </div>
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
      ) : tournaments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
            <Trophy className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No tournaments yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {tournaments.map((t) => (
            <Card key={t.id}>
              <CardContent className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium">{t.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {t.slug} · {new Date(t.startDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    {" – "}
                    {new Date(t.endDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
                <Badge variant="secondary" className="text-xs">{STATUS_LABELS[t.status] ?? t.status}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
