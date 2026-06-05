-- BHM Tennis Tournament - Seed Data
-- Run this in Supabase SQL Editor after schema.sql

-- ============================================
-- TOURNAMENT
-- ============================================

insert into tournaments (id, name, start_date, end_date, status) values
  ('bhm-2026', 'Blackhorse Mills Tennis Tournament', '2026-06-15', '2026-08-03', 'group_stage');

-- ============================================
-- CATEGORIES
-- ============================================

insert into categories (id, tournament_id, name, slug, group_count, group_size, advancement_slots, knockout_rounds, group_deadline, qf_deadline, sf_deadline, final_date) values
  ('mens-singles',   'bhm-2026', 'Men''s Singles',  'mens-singles',   4, 6, 2, 3, '2026-07-12', '2026-07-19', '2026-07-26', '2026-08-03'),
  ('womens-singles', 'bhm-2026', 'Women''s Singles', 'womens-singles', 1, 7, 2, 1, '2026-07-27', null, null, '2026-08-03'),
  ('mixed-doubles',  'bhm-2026', 'Mixed Doubles',   'mixed-doubles',  1, 6, 2, 1, '2026-07-27', null, null, '2026-08-03');

-- ============================================
-- PLAYERS
-- Replace names with real participants before going live.
-- Men's Singles: 24 players across 4 groups of 6
-- Women's Singles: 7 players in 1 group
-- ============================================

insert into players (id, name, skill_level) values
  -- Group A
  ('m1',  'James Wilson',    'intermediate'),
  ('m2',  'David Chen',      'intermediate'),
  ('m3',  'Marcus Johnson',  'improver'),
  ('m4',  'Oliver Smith',    'improver'),
  ('m5',  'Ryan Patel',      'beginner'),
  ('m6',  'Tom Brown',       'beginner'),
  -- Group B
  ('m7',  'Alex Thompson',   'advanced'),
  ('m8',  'Ben Martinez',    'intermediate'),
  ('m9',  'Carlos Rivera',   'intermediate'),
  ('m10', 'Daniel Kim',      'improver'),
  ('m11', 'Edward Lee',      'improver'),
  ('m12', 'Frank Garcia',    'beginner'),
  -- Group C
  ('m13', 'George Taylor',   'advanced'),
  ('m14', 'Harry Anderson',  'intermediate'),
  ('m15', 'Ian Wright',      'intermediate'),
  ('m16', 'Jack Robinson',   'improver'),
  ('m17', 'Kevin Murphy',    'improver'),
  ('m18', 'Liam Davis',      'beginner'),
  -- Group D
  ('m19', 'Michael Clark',   'advanced'),
  ('m20', 'Nathan Hall',     'intermediate'),
  ('m21', 'Oscar Young',     'intermediate'),
  ('m22', 'Peter King',      'improver'),
  ('m23', 'Quentin Scott',   'improver'),
  ('m24', 'Robert Adams',    'beginner'),
  -- Women's Singles
  ('w1',  'Sarah Mitchell',  'advanced'),
  ('w2',  'Emma Thompson',   'intermediate'),
  ('w3',  'Lisa Chen',       'intermediate'),
  ('w4',  'Amy Patel',       'improver'),
  ('w5',  'Rachel Kim',      'improver'),
  ('w6',  'Nina Garcia',     'beginner'),
  ('w7',  'Kate Wilson',     'beginner');

-- ============================================
-- GROUP ASSIGNMENTS (singles)
-- ============================================

insert into group_assignments (player_id, category_id, group_label) values
  -- Men's Group A
  ('m1',  'mens-singles', 'A'),
  ('m2',  'mens-singles', 'A'),
  ('m3',  'mens-singles', 'A'),
  ('m4',  'mens-singles', 'A'),
  ('m5',  'mens-singles', 'A'),
  ('m6',  'mens-singles', 'A'),
  -- Men's Group B
  ('m7',  'mens-singles', 'B'),
  ('m8',  'mens-singles', 'B'),
  ('m9',  'mens-singles', 'B'),
  ('m10', 'mens-singles', 'B'),
  ('m11', 'mens-singles', 'B'),
  ('m12', 'mens-singles', 'B'),
  -- Men's Group C
  ('m13', 'mens-singles', 'C'),
  ('m14', 'mens-singles', 'C'),
  ('m15', 'mens-singles', 'C'),
  ('m16', 'mens-singles', 'C'),
  ('m17', 'mens-singles', 'C'),
  ('m18', 'mens-singles', 'C'),
  -- Men's Group D
  ('m19', 'mens-singles', 'D'),
  ('m20', 'mens-singles', 'D'),
  ('m21', 'mens-singles', 'D'),
  ('m22', 'mens-singles', 'D'),
  ('m23', 'mens-singles', 'D'),
  ('m24', 'mens-singles', 'D'),
  -- Women's Group A
  ('w1',  'womens-singles', 'A'),
  ('w2',  'womens-singles', 'A'),
  ('w3',  'womens-singles', 'A'),
  ('w4',  'womens-singles', 'A'),
  ('w5',  'womens-singles', 'A'),
  ('w6',  'womens-singles', 'A'),
  ('w7',  'womens-singles', 'A');

-- ============================================
-- DOUBLES TEAMS (one male + one female per team)
-- ============================================

insert into doubles_teams (id, player1_id, player2_id, team_name, category_id) values
  ('d1', 'm1', 'w1', 'Wilson / Mitchell',  'mixed-doubles'),
  ('d2', 'm2', 'w2', 'Chen / Thompson',    'mixed-doubles'),
  ('d3', 'm3', 'w3', 'Johnson / Chen',     'mixed-doubles'),
  ('d4', 'm4', 'w4', 'Smith / Patel',      'mixed-doubles'),
  ('d5', 'm5', 'w5', 'Patel / Kim',        'mixed-doubles'),
  ('d6', 'm6', 'w6', 'Brown / Garcia',     'mixed-doubles');

-- ============================================
-- GROUP ASSIGNMENTS (doubles)
-- ============================================

insert into group_assignments (team_id, category_id, group_label) values
  ('d1', 'mixed-doubles', 'A'),
  ('d2', 'mixed-doubles', 'A'),
  ('d3', 'mixed-doubles', 'A'),
  ('d4', 'mixed-doubles', 'A'),
  ('d5', 'mixed-doubles', 'A'),
  ('d6', 'mixed-doubles', 'A');

-- ============================================
-- AFTER SIGNING UP: make yourself admin
--
-- 1. Sign up at /signup
-- 2. In Supabase Table Editor → players → find your row → set is_admin = true
--
-- Or run this after signing up (replace the email):
--   update players set is_admin = true where email = 'your@email.com';
-- ============================================

-- ============================================
-- TO CLEAR ALL DATA AND START FRESH:
--
--   delete from group_assignments;
--   delete from doubles_teams;
--   delete from matches;
--   delete from players;
--   delete from categories;
--   delete from tournaments;
-- ============================================
