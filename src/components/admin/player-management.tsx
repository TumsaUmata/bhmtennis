"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/lib/supabase/client";

interface PlayerRow {
  id: string;
  name: string;
  email: string | null;
  isAdmin: boolean;
  categoryId: string | null;
  categoryName: string | null;
  groupLabel: string | null;
}

interface Category {
  id: string;
  name: string;
  groupCount: number;
}

interface RegisteredPlayer {
  id: string;
  name: string;
}

function groupLabels(groupCount: number): string[] {
  return Array.from({ length: groupCount }, (_, i) => String.fromCharCode(65 + i));
}

export function PlayerManagement() {
  const [players, setPlayers] = useState<PlayerRow[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [registered, setRegistered] = useState<RegisteredPlayer[]>([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Singles form
  const [sCategoryId, setSCategoryId] = useState("");
  const [sPlayerId, setSPlayerId] = useState("");
  const [sGroup, setSGroup] = useState("A");

  // Doubles form
  const [dPlayer1Id, setDPlayer1Id] = useState("");
  const [dPlayer2Id, setDPlayer2Id] = useState("");
  const [dGuestName, setDGuestName] = useState("");
  const [dPlayer2IsGuest, setDPlayer2IsGuest] = useState(false);
  const [dGroup, setDGroup] = useState("A");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [playersRes, catsRes] = await Promise.all([
        supabase.from("players").select(`
          id, name, email, is_admin,
          group_assignments ( group_label, categories ( id, name ) )
        `).order("name"),
        supabase.from("categories").select("id, name, group_count").order("name"),
      ]);

      const rows: PlayerRow[] = (playersRes.data ?? []).map((p: any) => {
        const assignment = p.group_assignments?.[0] ?? null;
        return {
          id: p.id,
          name: p.name,
          email: p.email ?? null,
          isAdmin: p.is_admin ?? false,
          categoryId: assignment?.categories?.id ?? null,
          categoryName: assignment?.categories?.name ?? null,
          groupLabel: assignment?.group_label ?? null,
        };
      });

      const cats: Category[] = (catsRes.data ?? []).map((c: any) => ({
        id: c.id,
        name: c.name,
        groupCount: c.group_count,
      }));

      setPlayers(rows);
      setCategories(cats);
      setRegistered(rows.map((p) => ({ id: p.id, name: p.name })));

      if (cats.length > 0 && !sCategoryId) setSCategoryId(cats[0].id);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const selectedSCategory = categories.find((c) => c.id === sCategoryId);
  const sGroups = selectedSCategory ? groupLabels(selectedSCategory.groupCount) : ["A"];

  // Players not yet assigned to the selected singles category
  const unassignedForCategory = registered.filter(
    (p) => !players.find((row) => row.id === p.id && row.categoryId === sCategoryId)
  );

  async function handleSinglesAssign() {
    if (!sPlayerId || !sCategoryId || !sGroup) return;
    setBusy(true);
    setError(null);
    try {
      const { error } = await supabase
        .from("group_assignments")
        .insert({ player_id: sPlayerId, category_id: sCategoryId, group_label: sGroup });
      if (error) throw error;
      setSPlayerId("");
      await load();
    } catch (e: any) {
      setError(e.message ?? "Failed to assign player");
    } finally {
      setBusy(false);
    }
  }

  async function handleDoublesAssign() {
    if (!dPlayer1Id) return;
    if (!dPlayer2IsGuest && !dPlayer2Id) return;
    if (dPlayer2IsGuest && !dGuestName.trim()) return;
    setBusy(true);
    setError(null);
    try {
      let player2Id = dPlayer2Id;

      if (dPlayer2IsGuest) {
        // Create a guest player row (no auth account)
        const { data, error } = await supabase
          .from("players")
          .insert({ name: dGuestName.trim() })
          .select("id")
          .single();
        if (error) throw error;
        player2Id = data.id;
      }

      // Create the doubles team (trigger sets team_name automatically)
      const { data: team, error: teamError } = await supabase
        .from("doubles_teams")
        .insert({ player1_id: dPlayer1Id, player2_id: player2Id, team_name: "", category_id: "mixed-doubles" })
        .select("id")
        .single();
      if (teamError) throw teamError;

      // Assign the team to the group
      const { error: assignError } = await supabase
        .from("group_assignments")
        .insert({ team_id: team.id, category_id: "mixed-doubles", group_label: dGroup });
      if (assignError) throw assignError;

      setDPlayer1Id("");
      setDPlayer2Id("");
      setDGuestName("");
      setDPlayer2IsGuest(false);
      await load();
    } catch (e: any) {
      setError(e.message ?? "Failed to assign team");
    } finally {
      setBusy(false);
    }
  }

  const filteredPlayers = filter === "all" ? players : players.filter((p) => p.categoryId === filter);
  const categoryOptions = Array.from(
    new Map(players.filter((p) => p.categoryId).map((p) => [p.categoryId!, p.categoryName!]))
  );

  if (loading) {
    return <p className="text-sm text-muted-foreground py-4 text-center">Loading…</p>;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Assign to Group</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="singles">
            <TabsList className="mb-4">
              <TabsTrigger value="singles" className="text-xs">Singles</TabsTrigger>
              <TabsTrigger value="doubles" className="text-xs">Doubles</TabsTrigger>
            </TabsList>

            <TabsContent value="singles">
              <div className="space-y-3">
                <Select value={sCategoryId} onValueChange={(v) => { if (v) { setSCategoryId(v); setSGroup("A"); setSPlayerId(""); } }}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.filter((c) => c.id !== "mixed-doubles").map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="flex gap-2">
                  <Select value={sPlayerId} onValueChange={(v) => { if (v) setSPlayerId(v); }}>
                    <SelectTrigger className="h-8 text-xs flex-1">
                      <SelectValue placeholder="Player" />
                    </SelectTrigger>
                    <SelectContent>
                      {unassignedForCategory.length === 0
                        ? <SelectItem value="_none" disabled>No unassigned players</SelectItem>
                        : unassignedForCategory.map((p) => (
                          <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))
                      }
                    </SelectContent>
                  </Select>

                  <Select value={sGroup} onValueChange={(v) => { if (v) setSGroup(v); }}>
                    <SelectTrigger className="h-8 text-xs w-28">
                      <SelectValue placeholder="Group" />
                    </SelectTrigger>
                    <SelectContent>
                      {sGroups.map((g) => (
                        <SelectItem key={g} value={g}>Group {g}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {error && <p className="text-xs text-destructive">{error}</p>}

                <Button
                  className="w-full"
                  size="sm"
                  disabled={busy || !sPlayerId || sPlayerId === "_none"}
                  onClick={handleSinglesAssign}
                >
                  {busy ? "Assigning…" : "Assign to Group"}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="doubles">
              <div className="space-y-3">
                <Select value={dPlayer1Id} onValueChange={(v) => { if (v) setDPlayer1Id(v); }}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Player 1 (registered)" />
                  </SelectTrigger>
                  <SelectContent>
                    {registered.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="space-y-2">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => { setDPlayer2IsGuest(false); setDGuestName(""); }}
                      className={`flex-1 rounded-md border px-3 py-1.5 text-xs transition-colors ${!dPlayer2IsGuest ? "bg-primary text-primary-foreground border-primary" : "text-muted-foreground hover:bg-muted"}`}
                    >
                      Registered
                    </button>
                    <button
                      type="button"
                      onClick={() => { setDPlayer2IsGuest(true); setDPlayer2Id(""); }}
                      className={`flex-1 rounded-md border px-3 py-1.5 text-xs transition-colors ${dPlayer2IsGuest ? "bg-primary text-primary-foreground border-primary" : "text-muted-foreground hover:bg-muted"}`}
                    >
                      Guest (no account)
                    </button>
                  </div>

                  {dPlayer2IsGuest ? (
                    <Input
                      className="h-8 text-xs"
                      placeholder="Partner name"
                      value={dGuestName}
                      onChange={(e) => setDGuestName(e.target.value)}
                    />
                  ) : (
                    <Select value={dPlayer2Id} onValueChange={(v) => { if (v) setDPlayer2Id(v); }}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Player 2 (registered)" />
                      </SelectTrigger>
                      <SelectContent>
                        {registered.filter((p) => p.id !== dPlayer1Id).map((p) => (
                          <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <Select value={dGroup} onValueChange={(v) => { if (v) setDGroup(v); }}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Group" />
                  </SelectTrigger>
                  <SelectContent>
                    {groupLabels(categories.find((c) => c.id === "mixed-doubles")?.groupCount ?? 1).map((g) => (
                      <SelectItem key={g} value={g}>Group {g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {error && <p className="text-xs text-destructive">{error}</p>}

                <Button
                  className="w-full"
                  size="sm"
                  disabled={busy || !dPlayer1Id || (!dPlayer2IsGuest && !dPlayer2Id) || (dPlayer2IsGuest && !dGuestName.trim())}
                  onClick={handleDoublesAssign}
                >
                  {busy ? "Assigning…" : "Create Doubles Team"}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold">Players ({filteredPlayers.length})</CardTitle>
            <Select value={filter} onValueChange={(v) => setFilter(v ?? "all")}>
              <SelectTrigger className="w-36 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {categoryOptions.map(([id, name]) => (
                  <SelectItem key={id} value={id}>{name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {filteredPlayers.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No players yet</p>
          ) : (
            <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
              {filteredPlayers.map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-lg border p-2.5 text-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-medium truncate">{p.name}</span>
                    {p.isAdmin && <Badge className="text-[10px] shrink-0">Admin</Badge>}
                    {p.email && <span className="text-[10px] text-muted-foreground truncate hidden sm:block">{p.email}</span>}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    {p.categoryName && (
                      <Badge variant="outline" className="text-[10px]">{p.categoryName}</Badge>
                    )}
                    {p.groupLabel && (
                      <Badge variant="outline" className="text-[10px]">Group {p.groupLabel}</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
