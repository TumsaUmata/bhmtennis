"use client";

import { useState, useEffect, useMemo } from "react";
import { MatchStoreContext, createMatchStore } from "@/lib/match-store";
import { CurrentUserContext, GUEST_USER, type CurrentUser } from "@/lib/current-user";
import { supabase } from "@/lib/supabase/client";
import { getCurrentUser } from "@/lib/supabase/auth";

export function Providers({ children }: { children: React.ReactNode }) {
  const store = useMemo(() => createMatchStore(), []);
  const [currentUser, setCurrentUser] = useState<CurrentUser>(GUEST_USER);

  useEffect(() => {
    async function loadUser() {
      const player = await getCurrentUser();
      if (player) {
        setCurrentUser({ id: player.id, name: player.name, isAdmin: player.is_admin ?? false });
      }
    }
    loadUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === "SIGNED_OUT") {
        setCurrentUser(GUEST_USER);
      } else if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "USER_UPDATED") {
        const player = await getCurrentUser();
        if (player) {
          setCurrentUser({ id: player.id, name: player.name, isAdmin: player.is_admin ?? false });
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <CurrentUserContext value={currentUser}>
      <MatchStoreContext value={store}>
        {children}
      </MatchStoreContext>
    </CurrentUserContext>
  );
}
