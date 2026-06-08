"use client";

import { useState, useEffect, useMemo } from "react";
import { MatchStoreContext, createMatchStore } from "@/lib/match-store";
import { CurrentUserContext, GUEST_USER, isGuest, type CurrentUser } from "@/lib/current-user";
import { supabase } from "@/lib/supabase/client";
import { getCurrentUser } from "@/lib/supabase/auth";

export function Providers({ children }: { children: React.ReactNode }) {
  const store = useMemo(() => createMatchStore(), []);
  const [currentUser, setCurrentUser] = useState<CurrentUser>(GUEST_USER);

  useEffect(() => {
    async function loadUser() {
      try {
        const player = await getCurrentUser();
        if (player) {
          setCurrentUser((prev) => {
            if (!isGuest(prev) && prev.id === player.id && prev.name === player.name && prev.isAdmin === (player.is_admin ?? false)) return prev;
            return { id: player.id, name: player.name, isAdmin: player.is_admin ?? false };
          });
        }
      } catch {
        await supabase.auth.signOut();
      }
    }
    loadUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_OUT") {
        setCurrentUser(GUEST_USER);
      } else if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "USER_UPDATED") {
        try {
          const player = await getCurrentUser();
          if (player) {
            setCurrentUser((prev) => {
              if (!isGuest(prev) && prev.id === player.id && prev.name === player.name && prev.isAdmin === (player.is_admin ?? false)) return prev;
              return { id: player.id, name: player.name, isAdmin: player.is_admin ?? false };
            });
          } else {
            setCurrentUser(GUEST_USER);
          }
        } catch {
          await supabase.auth.signOut();
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
