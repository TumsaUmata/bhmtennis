-- Auto-create a players row whenever someone signs up via Supabase Auth.
-- Runs as security definer so it bypasses RLS (no session exists yet
-- when email confirmation is enabled).
--
-- Name and skill_level come from the metadata passed in supabase.auth.signUp().

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.players (auth_user_id, email, name, skill_level)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'skill_level', 'beginner')
  );
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
