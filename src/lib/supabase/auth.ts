import { supabase } from "@/lib/supabase/client";

export async function signUp(
  email: string,
  password: string,
  name: string,
  skillLevel: string
) {
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name, skill_level: skillLevel },
    },
  });

  if (authError) throw authError;
  if (!authData.user) throw new Error("Sign up failed");

  // Player row is created automatically by the handle_new_user DB trigger.
  // No client-side insert needed — avoids the RLS auth.uid() issue when
  // email confirmation is enabled and there's no session yet.

  return { user: authData.user, needsEmailConfirmation: !authData.session };
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data.user;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser() {
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;

  const { data: player } = await supabase
    .from("players")
    .select("*")
    .eq("auth_user_id", data.user.id)
    .maybeSingle();

  return player;
}

export async function isAdmin(): Promise<boolean> {
  const player = await getCurrentUser();
  return player?.is_admin ?? false;
}

export function onAuthStateChange(
  callback: (event: string, session: unknown) => void
) {
  return supabase.auth.onAuthStateChange(callback);
}
