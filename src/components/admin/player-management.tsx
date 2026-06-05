"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Plus } from "lucide-react";
import { mensPlayers, womensPlayers, doublesTeams, mensGroupAssignments, categories } from "@/lib/mock-data";

const allPlayers = [
  ...mensPlayers.map((p) => ({ ...p, category: "mens-singles", group: mensGroupAssignments.find((a) => a.playerId === p.id)?.groupLabel ?? "" })),
  ...womensPlayers.map((p) => ({ ...p, category: "womens-singles", group: "A" })),
  ...doublesTeams.map((t) => ({ id: t.id, name: t.teamName, category: "mixed-doubles", group: "A" })),
];

export function PlayerManagement() {
  const [filter, setFilter] = useState("all");
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState("mens-singles");
  const [newGroup, setNewGroup] = useState("A");

  const filtered = filter === "all"
    ? allPlayers
    : allPlayers.filter((p) => p.category === filter);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Add Player</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            placeholder="Player name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <div className="flex gap-2">
            <Select value={newCategory} onValueChange={(v) => setNewCategory(v ?? newCategory)}>
              <SelectTrigger className="flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {newCategory === "mens-singles" && (
              <Select value={newGroup} onValueChange={(v) => setNewGroup(v ?? newGroup)}>
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
          <Button
            className="w-full gap-1.5"
            disabled={!newName.trim()}
            onClick={() => {
              alert(`Would add "${newName}" to ${newCategory} Group ${newGroup}\n(Requires Supabase for persistence)`);
              setNewName("");
            }}
          >
            <Plus className="h-3.5 w-3.5" />
            Add Player
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold">Players ({filtered.length})</CardTitle>
            <Select value={filter} onValueChange={(v) => setFilter(v ?? "all")}>
              <SelectTrigger className="w-36 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
            {filtered.map((p) => (
              <div
                key={`${p.category}-${p.id}`}
                className="flex items-center justify-between rounded-lg border p-2.5 text-sm"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium">{p.name}</span>
                  {p.group && (
                    <Badge variant="outline" className="text-[10px]">
                      Group {p.group}
                    </Badge>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive hover:text-destructive"
                  onClick={() => alert(`Would remove ${p.name}\n(Requires Supabase for persistence)`)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
