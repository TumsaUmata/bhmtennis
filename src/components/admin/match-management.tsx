"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Edit2, AlertTriangle } from "lucide-react";
import { useMatchStore } from "@/lib/match-store";
import { categories, mensGroupAssignments } from "@/lib/mock-data";
import { getService } from "@/lib/services";
import type { Player } from "@/lib/types";
import { cn } from "@/lib/utils";

function formatScore(sets: { player1Games: number; player2Games: number; isTiebreak?: boolean }[]) {
  return sets.map((s) => `${s.player1Games}-${s.player2Games}${s.isTiebreak ? "(TB)" : ""}`).join(" ");
}

interface MatchManagementProps {
  onForceUpdate: () => void;
}

export function MatchManagement({ onForceUpdate }: MatchManagementProps) {
  const store = useMatchStore();
  const service = getService();
  const [filter, setFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [allPlayerNames, setAllPlayerNames] = useState<Map<string, string>>(new Map());
  const [categoryNames, setCategoryNames] = useState<Map<string, string>>(new Map(categories.map((c) => [c.id, c.name])));
  const [serviceMatches, setServiceMatches] = useState<typeof store.matches>([]);

  useEffect(() => {
    Promise.all([
      service.getAllPlayerNames(),
      service.getCategories(),
      ...categories.map((c) => service.getMatches(c.id)),
    ]).then(([names, cats, ...matchGroups]) => {
      setAllPlayerNames(names);
      setCategoryNames(new Map(cats.map((c) => [c.id, c.name])));
      setServiceMatches(matchGroups.flat());
    });
  }, []);

  const filtered = serviceMatches.filter((m) => {
    if (filter !== "all" && m.categoryId !== filter) return false;
    if (statusFilter !== "all" && m.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-sm font-semibold">Matches ({filtered.length})</CardTitle>
            <div className="flex gap-2">
              <Select value={filter} onValueChange={(v) => setFilter(v ?? "all")}>
                <SelectTrigger className="w-32 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? "all")}>
                <SelectTrigger className="w-28 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="incomplete">Incomplete</SelectItem>
                  <SelectItem value="walkover">Walkover</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {filtered.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">No matches found</p>
            )}
            {filtered.map((match) => (
              <div
                key={match.id}
                className={cn(
                  "rounded-lg border p-3 text-sm space-y-1.5",
                  match.status === "walkover" && "border-amber-300 bg-amber-50/30"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px]">
                      {categoryNames.get(match.categoryId)}
                    </Badge>
                    {match.groupLabel && match.groupLabel.length === 1 && (
                      <span className="text-[10px] text-muted-foreground">Group {match.groupLabel}</span>
                    )}
                    <Badge
                      variant="secondary"
                      className={cn(
                        "text-[10px]",
                        match.status === "completed" && "bg-primary/10 text-primary",
                        match.status === "incomplete" && "bg-amber-100 text-amber-700",
                        match.status === "walkover" && "bg-amber-200 text-amber-800"
                      )}
                    >
                      {match.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => alert(`Edit match — would open score editor\n(Coming with full integration)`)}
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => {
                        store.deleteMatch(match.id);
                        onForceUpdate();
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className={cn(match.winnerId === match.player1Id && "font-semibold")}>
                      {allPlayerNames.get(match.player1Id) ?? match.player1Id}
                    </span>
                    <span className="text-muted-foreground mx-2">vs</span>
                    <span className={cn(match.winnerId === match.player2Id && "font-semibold")}>
                      {allPlayerNames.get(match.player2Id) ?? match.player2Id}
                    </span>
                  </div>
                  {match.sets.length > 0 && (
                    <span className="text-xs font-mono text-muted-foreground">
                      {formatScore(match.sets)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Assign Walkover</CardTitle>
        </CardHeader>
        <CardContent>
          <WalkoverForm onForceUpdate={onForceUpdate} />
        </CardContent>
      </Card>
    </div>
  );
}

function WalkoverForm({ onForceUpdate }: { onForceUpdate: () => void }) {
  const store = useMatchStore();
  const service = getService();
  const [category, setCategory] = useState("mens-singles");
  const [group, setGroup] = useState("A");
  const [winner, setWinner] = useState("");
  const [loser, setLoser] = useState("");
  const [players, setPlayers] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    service.getPlayerNameMap(category, category === "mens-singles" ? group : "A").then((nameMap) => {
      setPlayers([...nameMap.entries()].map(([id, name]) => ({ id, name })));
      setWinner("");
      setLoser("");
    });
  }, [category, group]);

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Select value={category} onValueChange={(v) => { if (v) { setCategory(v); setWinner(""); setLoser(""); } }}>
          <SelectTrigger className="flex-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {category === "mens-singles" && (
          <Select value={group} onValueChange={(v) => { if (v) { setGroup(v); setWinner(""); setLoser(""); } }}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {["A", "B", "C", "D"].map((g) => (
                <SelectItem key={g} value={g}>Group {g}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
      <div className="flex gap-2">
        <Select value={winner} onValueChange={(v) => setWinner(v ?? "")}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Winner" />
          </SelectTrigger>
          <SelectContent>
            {players.filter((p) => p.id !== loser).map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={loser} onValueChange={(v) => setLoser(v ?? "")}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="No-show" />
          </SelectTrigger>
          <SelectContent>
            {players.filter((p) => p.id !== winner).map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button
        className="w-full gap-1.5"
        variant="outline"
        disabled={!winner || !loser}
        onClick={() => {
          if (!winner || !loser) return;
          store.addWalkover(category, group, winner, loser);
          setWinner("");
          setLoser("");
          onForceUpdate();
        }}
      >
        <AlertTriangle className="h-3.5 w-3.5" />
        Record Walkover
      </Button>
    </div>
  );
}
