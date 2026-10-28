# Supabase Setup Guide for CRISIS LAB

This guide shows how to connect Supabase to your **login page** and **scoreboard** so it stores sign-in names, team names, points, and updates the live ranking.

---

## Step 1 — Create a Supabase Project (Free)

1. Go to **https://supabase.com** and sign up (free).
2. Click **New Project**.
3. Give it a name (e.g. `crisis-lab`), set a strong database password, and choose a region.
4. Once created, open **Settings → API** (or **Project Settings → API**).
5. Copy two values:
   - **Project URL** (e.g. `https://xyzcompany.supabase.co`)
   - **anon public key** (the long `eyJ...` string)

---

## Step 2 — Create the Database Tables

Open the **SQL Editor** in your Supabase dashboard and run this script:

```sql
-- ============================================
-- 1. PLAYERS TABLE (sign-in names + team names)
-- ============================================
create table if not exists public.players (
  id uuid primary key default gen_random_uuid(),
  username text unique not null,          -- sign-in name
  password text not null,                 -- store hashed in production
  team_name text not null,                -- team name
  role text default 'player',             -- 'admin' or 'player'
  created_at timestamptz default now()
);

-- ============================================
-- 2. TEAM SCORES TABLE (points + ranking data)
-- ============================================
create table if not exists public.team_scores (
  id uuid primary key default gen_random_uuid(),
  team_name text unique not null,          -- team name
  total_points int default 0,              -- total points earned
  solved_count int default 0,              -- challenges solved
  easy int default 0,                      -- easy solved
  medium int default 0,                    -- medium solved
  hard int default 0,                      -- hard solved
  last_solve timestamptz,                  -- last solve time
  updated_at timestamptz default now()
);

-- ============================================
-- 3. RANKING VIEW (live leaderboard, sorted)
-- ============================================
create or replace view public.leaderboard as
select
  team_name,
  total_points,
  solved_count,
  easy,
  medium,
  hard,
  last_solve,
  row_number() over (order by total_points desc, last_solve asc) as rank
from public.team_scores
order by total_points desc, last_solve asc;
```

---

## Step 3 — Enable Row Level Security (RLS)

For a public competition scoreboard, allow anyone to read the leaderboard but control writes.

In the SQL Editor, run:

```sql
-- Allow public read of leaderboard
alter table public.team_scores enable row level security;
create policy "read scores" on public.team_scores
  for select using (true);

-- Allow public insert (new teams) and update (score changes)
create policy "insert scores" on public.team_scores
  for insert with check (true);

create policy "update scores" on public.team_scores
  for update using (true) with check (true);

-- Allow public read of players (for login) - do NOT allow public writes
alter table public.players enable row level security;
create policy "read players" on public.players
  for select using (true);
```

> ⚠️ **Security note:** For a real event, do NOT use the anon key for writes. Use Supabase Auth (email/password) and a service-role key on a backend server to protect passwords. This setup is for a simple demo/competition where the anon key is acceptable.

---

## Step 4 — Add the Supabase JS Library

Supabase loads its client from a CDN. Add this script tag **before** your custom scripts in any page that uses it:

```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
```

Then include your config and client files:

```html
<script src="assets/js/supabase-config.js"></script>
<script src="assets/js/supabase-client.js"></script>
```

---

## Step 5 — Fill In Your Credentials (.env)

Your keys are stored in an **environment file** so they aren't committed to git.

1. In the project root, copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Open `.env` and fill in your real Supabase values:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY_HERE
   NEXT_PUBLIC_SUPABASE_USERS_TABLE=players
   NEXT_PUBLIC_SUPABASE_SCORES_TABLE=team_scores
   ```

> `.env` is already git-ignored (see `.gitignore` → `.env*`), so your keys stay private. `.env.example` is the committed template.

**How the app reads these:** `assets/js/supabase-config.js` reads `NEXT_PUBLIC_*` environment variables. When you run via Next.js (`npm run dev`) or deploy to Vercel, the `.env` file is loaded automatically. If you're opening the static HTML files directly in a browser, the config falls back to the placeholder values — in that case set the values directly in `supabase-config.js`.

---

## Step 6 — Test

1. Open `login.html` in your browser.
2. Sign in with a team name / username + password.
3. Open `scoreboard.html` — the team should appear in the ranking table.
4. When a player solves a challenge and earns points, `SupabaseClient.updateScore()` updates the `team_scores` row, and the scoreboard re-renders in real time.

---

## How It Works (File Map)

| File | Purpose |
|------|---------|
| `assets/js/supabase-config.js` | Your URL + anon key + table names |
| `assets/js/supabase-client.js` | Login, register, score update, realtime scoreboard logic |
| `login.html` | Uses `SupabaseClient.login()` to verify credentials |
| `scoreboard.html` | Uses `SupabaseClient.loadScoreboard()` + realtime subscription |

---

## API Reference (SupabaseClient)

```js
// Sign in
await SupabaseClient.login(username, password);

// Register a new team
await SupabaseClient.register(username, password, teamName);

// Update score after a challenge is solved
await SupabaseClient.updateScore(team_name, { total_points, solved_count, easy, medium, hard });
