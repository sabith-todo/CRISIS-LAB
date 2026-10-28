-- ============================================
-- CRISIS LAB — Clean Supabase Schema
-- Run this in the Supabase SQL Editor.
-- ============================================

-- 1. CREATE TABLES ----------------------------------
create table if not exists public.players (
    id         uuid primary key default gen_random_uuid(),
    username   text not null unique,
    password   text not null,
    team_name  text not null,
    role       text not null default 'player',
    created_at timestamptz not null default now()
);

create table if not exists public.team_scores (
    id           uuid primary key default gen_random_uuid(),
    team_name    text not null unique,
    total_points integer not null default 0,
    solved_count integer not null default 0,
    easy         integer not null default 0,
    medium       integer not null default 0,
    hard         integer not null default 0,
    last_solve   timestamptz,
    updated_at   timestamptz not null default now()
);

-- 2. ENABLE ROW LEVEL SECURITY ----------------------
alter table public.players enable row level security;
alter table public.team_scores enable row level security;

-- 3. POLICIES (so the anon key can work) ------------
drop policy if exists "players_select" on public.players;
create policy "players_select" on public.players
    for select using (true);

drop policy if exists "players_insert" on public.players;
create policy "players_insert" on public.players
    for insert with check (true);

drop policy if exists "scores_select" on public.team_scores;
create policy "scores_select" on public.team_scores
    for select using (true);

drop policy if exists "scores_insert" on public.team_scores;
create policy "scores_insert" on public.team_scores
    for insert with check (true);

drop policy if exists "scores_update" on public.team_scores;
create policy "scores_update" on public.team_scores
    for update using (true) with check (true);
</content>
