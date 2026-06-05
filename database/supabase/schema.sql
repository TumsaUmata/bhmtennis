-- BHM Tennis Tournament - Supabase Schema
-- Run this in Supabase SQL Editor to create all tables

-- ============================================
-- TABLES
-- ============================================

create table tournaments (
  id text primary key default gen_random_uuid()::text,
  name text not null,
  start_date date not null,
  end_date date not null,
  status text not null default 'upcoming'
    check (status in ('upcoming', 'group_stage', 'knockout', 'completed')),
  created_at timestamptz not null default now()
);

create table categories (
  id text primary key default gen_random_uuid()::text,
  tournament_id text not null references tournaments(id) on delete cascade,
  name text not null,
  slug text not null unique,
  group_count integer not null default 1,
  group_size integer not null,
  advancement_slots integer not null default 2,
  knockout_rounds integer not null default 1,
  group_deadline date not null,
  qf_deadline date,
  sf_deadline date,
  final_date date not null,
  registration_open boolean not null default false,
  registration_deadline date
);

create table players (
  id text primary key default gen_random_uuid()::text,
  name text not null,
  email text unique,
  phone text,
  auth_user_id uuid unique references auth.users(id) on delete set null,
  is_admin boolean not null default false,
  skill_level text check (skill_level in ('beginner', 'improver', 'intermediate', 'advanced')),
  created_at timestamptz not null default now()
);

create table doubles_teams (
  id text primary key default gen_random_uuid()::text,
  player1_id text not null references players(id) on delete cascade,
  player2_id text not null references players(id) on delete cascade,
  team_name text not null,
  category_id text not null references categories(id) on delete cascade
);

create table group_assignments (
  id text primary key default gen_random_uuid()::text,
  player_id text references players(id) on delete cascade,      -- singles
  team_id text references doubles_teams(id) on delete cascade,  -- doubles
  category_id text not null references categories(id) on delete cascade,
  group_label text not null,
  seed_number integer,
  constraint group_assignments_player_or_team check (
    (player_id is not null and team_id is null) or
    (player_id is null and team_id is not null)
  ),
  unique (player_id, category_id),
  unique (team_id, category_id)
);

create table tournament_registrations (
  id text primary key default gen_random_uuid()::text,
  player_id text not null references players(id) on delete cascade,
  category_id text not null references categories(id) on delete cascade,
  registered_at timestamptz not null default now(),
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'withdrawn')),
  unique (player_id, category_id)
);

create table matches (
  id text primary key default gen_random_uuid()::text,
  match_type text not null default 'tournament'
    check (match_type in ('tournament', 'league')),
  category_id text not null references categories(id) on delete cascade,
  group_label text,
  player1_id text not null,
  player2_id text not null,
  stage text not null default 'group'
    check (stage in ('group', 'quarterfinal', 'semifinal', 'final')),
  status text not null default 'requested'
    check (status in ('requested', 'confirmed', 'completed', 'incomplete', 'disputed', 'walkover')),
  sets jsonb not null default '[]'::jsonb,
  winner_id text,
  submitted_by text references players(id),
  played_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table locked_brackets (
  id text primary key default gen_random_uuid()::text,
  category_id text not null unique references categories(id) on delete cascade,
  bracket_data jsonb not null,
  locked_at timestamptz not null default now()
);

-- ============================================
-- INDEXES
-- ============================================

create index idx_categories_tournament on categories(tournament_id);
create index idx_group_assignments_category on group_assignments(category_id);
create index idx_group_assignments_player on group_assignments(player_id);
create index idx_matches_category on matches(category_id);
create index idx_matches_category_group on matches(category_id, group_label);
create index idx_matches_player1 on matches(player1_id);
create index idx_matches_player2 on matches(player2_id);
create index idx_matches_status on matches(status);
create index idx_players_auth on players(auth_user_id);
create index idx_registrations_category on tournament_registrations(category_id);
create index idx_registrations_player on tournament_registrations(player_id);

-- ============================================
-- DOUBLES TEAM NAME AUTO-GENERATION
-- Sets team_name to "FirstName1 & FirstName2" on insert
-- ============================================

create or replace function generate_team_name()
returns trigger as $$
declare
  p1_name text;
  p2_name text;
begin
  select name into p1_name from players where id = new.player1_id;
  select name into p2_name from players where id = new.player2_id;
  new.team_name := p1_name || ' & ' || p2_name;
  return new;
end;
$$ language plpgsql;

create trigger doubles_teams_name
  before insert on doubles_teams
  for each row execute function generate_team_name();

-- ============================================
-- ADMIN HELPER FUNCTION (avoids RLS infinite recursion)
-- ============================================

create or replace function is_admin()
returns boolean as $$
  select exists (
    select 1 from players
    where auth_user_id = auth.uid()
    and is_admin = true
  );
$$ language sql security definer;

-- ============================================
-- UPDATED_AT TRIGGER
-- ============================================

create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger matches_updated_at
  before update on matches
  for each row execute function update_updated_at();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

alter table tournaments enable row level security;
alter table categories enable row level security;
alter table players enable row level security;
alter table doubles_teams enable row level security;
alter table group_assignments enable row level security;
alter table matches enable row level security;
alter table locked_brackets enable row level security;
alter table tournament_registrations enable row level security;

-- Public read access (default to public, admin can toggle)
create policy "Public read tournaments" on tournaments for select using (true);
create policy "Public read categories" on categories for select using (true);
create policy "Public read players" on players for select using (true);
create policy "Public read doubles_teams" on doubles_teams for select using (true);
create policy "Public read group_assignments" on group_assignments for select using (true);
create policy "Public read matches" on matches for select using (true);
create policy "Public read locked_brackets" on locked_brackets for select using (true);
create policy "Public read tournament_registrations" on tournament_registrations for select using (true);
create policy "Players register themselves" on tournament_registrations for insert
  with check (auth.uid() in (select auth_user_id from players where id = player_id));
create policy "Players withdraw registration" on tournament_registrations for update
  using (auth.uid() in (select auth_user_id from players where id = player_id));
create policy "Admin full access tournament_registrations" on tournament_registrations for all
  using (exists (select 1 from players where auth_user_id = auth.uid() and is_admin = true));

-- Players can insert matches they're part of
create policy "Players insert matches" on matches for insert
  with check (
    auth.uid() in (
      select auth_user_id from players where id = player1_id
      union
      select auth_user_id from players where id = player2_id
    )
  );

-- Players can update matches they're part of
create policy "Players update own matches" on matches for update
  using (
    auth.uid() in (
      select auth_user_id from players where id = player1_id
      union
      select auth_user_id from players where id = player2_id
    )
  );

-- Admins can do everything (uses is_admin() function to avoid infinite recursion on players table)
create policy "Admin full access tournaments" on tournaments for all using (is_admin());
create policy "Admin full access categories" on categories for all using (is_admin());
create policy "Admin full access players" on players for all using (is_admin());
create policy "Admin full access doubles_teams" on doubles_teams for all using (is_admin());
create policy "Admin full access group_assignments" on group_assignments for all using (is_admin());
create policy "Admin full access matches" on matches for all using (is_admin());
create policy "Admin full access locked_brackets" on locked_brackets for all using (is_admin());

-- Players can register themselves
create policy "Self registration" on players for insert
  with check (auth.uid() = auth_user_id);

-- Players can update their own profile
create policy "Update own profile" on players for update
  using (auth.uid() = auth_user_id);

-- ============================================
-- REALTIME
-- ============================================

alter publication supabase_realtime add table matches;
alter publication supabase_realtime add table locked_brackets;

-- ============================================
-- LEAGUE TABLES (populated when league mode is built)
-- These are included now so the schema is backward compatible
-- and the column structure matches the app's type definitions.
-- ============================================

create table league_seasons (
  id text primary key default gen_random_uuid()::text,
  name text not null,
  category_id text not null references categories(id) on delete cascade,
  start_date date not null,
  end_date date not null,
  tiered boolean not null default false,     -- true = levels active, false = one open league
  status text not null default 'upcoming'
    check (status in ('upcoming', 'active', 'completed')),
  created_at timestamptz not null default now()
);

create table league_divisions (
  id text primary key default gen_random_uuid()::text,
  season_id text not null references league_seasons(id) on delete cascade,
  name text not null,              -- e.g. "Division 1", "Division 2"
  division_order integer not null  -- 1 = top division
);

create table league_division_assignments (
  id text primary key default gen_random_uuid()::text,
  player_id text not null references players(id) on delete cascade,
  division_id text not null references league_divisions(id) on delete cascade,
  season_id text not null references league_seasons(id) on delete cascade,
  unique (player_id, season_id)
);

create table league_ratings (
  id text primary key default gen_random_uuid()::text,
  player_id text not null references players(id) on delete cascade,
  category_id text not null references categories(id) on delete cascade,
  rating integer not null default 1000,
  games_played integer not null default 0,
  updated_at timestamptz not null default now(),
  unique (player_id, category_id)
);

create table league_rating_history (
  id text primary key default gen_random_uuid()::text,
  player_id text not null references players(id) on delete cascade,
  category_id text not null references categories(id) on delete cascade,
  season_id text references league_seasons(id),
  match_id text not null references matches(id) on delete cascade,
  rating_before integer not null,
  rating_after integer not null,
  rating_change integer not null,
  recorded_at timestamptz not null default now()
);

-- Indexes for league tables
create index idx_league_seasons_category on league_seasons(category_id);
create index idx_league_divisions_season on league_divisions(season_id);
create index idx_league_assignments_season on league_division_assignments(season_id);
create index idx_league_assignments_player on league_division_assignments(player_id);
create index idx_league_ratings_player on league_ratings(player_id);
create index idx_league_rating_history_player on league_rating_history(player_id);
create index idx_league_rating_history_season on league_rating_history(season_id);

-- RLS for league tables
alter table league_seasons enable row level security;
alter table league_divisions enable row level security;
alter table league_division_assignments enable row level security;
alter table league_ratings enable row level security;
alter table league_rating_history enable row level security;

create policy "Public read league_seasons" on league_seasons for select using (true);
create policy "Public read league_divisions" on league_divisions for select using (true);
create policy "Public read league_division_assignments" on league_division_assignments for select using (true);
create policy "Public read league_ratings" on league_ratings for select using (true);
create policy "Public read league_rating_history" on league_rating_history for select using (true);

create policy "Admin full access league_seasons" on league_seasons for all
  using (exists (select 1 from players where auth_user_id = auth.uid() and is_admin = true));
create policy "Admin full access league_divisions" on league_divisions for all
  using (exists (select 1 from players where auth_user_id = auth.uid() and is_admin = true));
create policy "Admin full access league_division_assignments" on league_division_assignments for all
  using (exists (select 1 from players where auth_user_id = auth.uid() and is_admin = true));
create policy "Admin full access league_ratings" on league_ratings for all
  using (exists (select 1 from players where auth_user_id = auth.uid() and is_admin = true));
create policy "Admin full access league_rating_history" on league_rating_history for all
  using (exists (select 1 from players where auth_user_id = auth.uid() and is_admin = true));

-- Realtime for league
alter publication supabase_realtime add table league_ratings;
