"use client";

import { useState } from "react";
import Link from "next/link";
import { Shield, Lock } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { PlayerManagement } from "@/components/admin/player-management";
import { MatchManagement } from "@/components/admin/match-management";
import { TournamentControls } from "@/components/admin/tournament-controls";
import { TournamentManagement } from "@/components/admin/tournament-management";
import { LeagueManagement } from "@/components/admin/league-management";
import { RegistrationManagement } from "@/components/admin/registration-management";
import { useCurrentUser, isGuest } from "@/lib/current-user";

export default function AdminPage() {
  const currentUser = useCurrentUser();
  const [, forceUpdate] = useState(0);
  const triggerUpdate = () => forceUpdate((n) => n + 1);

  if (isGuest(currentUser) || !currentUser.isAdmin) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
          <Lock className="h-6 w-6 text-muted-foreground" />
        </div>
        <div className="text-center">
          <p className="font-medium">Admin access required</p>
          <p className="text-sm text-muted-foreground mt-1">
            {isGuest(currentUser) ? "Sign in to continue." : "You don't have admin permissions."}
          </p>
        </div>
        {isGuest(currentUser) && (
          <Link href="/login"><Button>Sign in</Button></Link>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <Shield className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Admin</h1>
          <p className="text-sm text-muted-foreground">Tournament management</p>
        </div>
      </div>

      <Tabs defaultValue="controls">
        <TabsList className="flex w-full overflow-x-auto">
          <TabsTrigger value="controls" className="text-xs font-semibold flex-1">Controls</TabsTrigger>
          <TabsTrigger value="registration" className="text-xs font-semibold flex-1">Registrations</TabsTrigger>
          <TabsTrigger value="matches" className="text-xs font-semibold flex-1">Matches</TabsTrigger>
          <TabsTrigger value="players" className="text-xs font-semibold flex-1">Players</TabsTrigger>
          <TabsTrigger value="tournaments" className="text-xs font-semibold flex-1">Tournaments</TabsTrigger>
          <TabsTrigger value="league" className="text-xs font-semibold flex-1">League</TabsTrigger>
        </TabsList>

        <TabsContent value="controls" className="mt-4">
          <TournamentControls onForceUpdate={triggerUpdate} />
        </TabsContent>

        <TabsContent value="registration" className="mt-4">
          <RegistrationManagement />
        </TabsContent>

        <TabsContent value="matches" className="mt-4">
          <MatchManagement onForceUpdate={triggerUpdate} />
        </TabsContent>

        <TabsContent value="players" className="mt-4">
          <PlayerManagement />
        </TabsContent>

        <TabsContent value="tournaments" className="mt-4">
          <TournamentManagement />
        </TabsContent>

        <TabsContent value="league" className="mt-4">
          <LeagueManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
}
