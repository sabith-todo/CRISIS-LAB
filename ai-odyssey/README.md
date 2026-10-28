# 🚀 AI Odyssey — Debug the Arena

A **CTF-style debugging competition** web app with 50 challenges across HTML, CSS, and JavaScript. Players register a team, solve challenges by fixing broken code, submit flags, and climb a **live Supabase-powered scoreboard**.

---

## ✨ Features

- 🗺️ **50 Challenges** — Easy / Medium / Hard / Boss, each with broken code, hints, and a flag
- 🏁 **Flag Submission** — case-insensitive, with first-blood, no-hint, and time bonuses
- 📊 **Live Scoreboard** — real-time ranking powered by Supabase Realtime
- 👥 **Team Registration & Login** — Supabase-backed accounts
- 🌙 **Cyberpunk Theme** — dark/light toggle, particles, matrix rain, confetti

---

## 📁 Project Structure

```
ai-odyssey/
├── index.html          # Landing page
├── login.html          # Login + Registration (Supabase)
├── dashboard.html      # Challenge grid
├── scoreboard.html     # Live leaderboard
├── admin.html          # Admin panel
├── rules.html          # Rules page
├── challenges/         # 50 generated challenge folders
├── assets/
│   ├── css/            # Stylesheets
│   └── js/             # Application scripts
└── supabase-schema.sql # Database setup script
```

---

## 🔐 How to Fill the Supabase Config

The app connects to Supabase through **two key files**. Here's exactly how to fill them.

### Step 1 — Get your Supabase credentials

1. Go to [supabase.com](https://supabase.com) and sign up (free tier is fine).
2. Click **New Project**, name it, set a database password, choose a region → **Create**.
3. Wait for the project to finish provisioning.
4. In the left sidebar go to **Project Settings → API** (or **Settings → API**).
5. Under **Project API keys**, copy two values:

   | Value | Where it looks like |
   |-------|---------------------|
   | **Project URL** | `https://abcdefghij.supabase.co` |
   | **anon / public** key | `eyJhbGciOiJIUzI1NiIsInR5cCI6...` (long jumble) |

### Step 2 — Fill the `.env` file (recommended)

The project stores secrets in an environment file so they are never committed to git.

```bash
# from the ai-odyssey/ folder
cp .env.example .env
```

Then open **`.env`** and paste your values:

```env
# ============================================
# CRISIS LAB - Environment Variables
# ============================================

# From Supabase: Project Settings -> API -> Project URL
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghij.supabase.co

# From Supabase: Project Settings -> API -> anon / public key
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...

# Table names (keep these unless you edited supabase-schema.sql)
NEXT_PUBLIC_SUPABASE_USERS_TABLE=players
NEXT_PUBLIC_SUPABASE_SCORES_TABLE=team_scores
```

> ✅ `.env` is git-ignored (see `.gitignore` → `.env*`). Your keys stay private.
> `.env.example` is the committed template for other developers.

### Step 3 — Fill `assets/js/supabase-config.js` (static/fallback)

If you open the HTML files **directly in a browser** (double-click or `file://`), `.env` is **not** read — browsers can't access environment files. In that case, put your real values directly in `assets/js/supabase-config.js`:

```js
const SUPABASE_URL = 'https://abcdefghij.supabase.co';          // ← your project URL
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6...';    // ← your anon key

const DB_TABLES = {
  users: 'players',      // register/login table
  scores: 'team_scores'  // scoreboard table
};
```

### Step 4 — Run the SQL schema

Open **Supabase Dashboard → SQL Editor → New query**, paste the contents of **`supabase-schema.sql`**, and click **Run**. This creates:

- `players` table — usernames, team names, passwords
- `team_scores` table — points, solved counts, timing
- `leaderboard` view — pre-sorted ranking
- RLS policies — public read, controlled writes

### Step 5 — Enable Realtime (for live scoreboard)

1. Supabase Dashboard → **Database → Replication**
2. Under **Source**, toggle **Enable Realtime** for the `team_scores` table
3. Click **Save**

### Step 6 — Run & test

```bash
npm install
npm run dev
```

Open `http://localhost:3000/login.html` (or open `login.html` directly), register a team, solve a challenge, and watch your score appear on `scoreboard.html` in real time.

---

## 🔄 How the Config Flows

```
.env  (or fallback values in supabase-config.js)
        │
        ▼
supabase-config.js  → provides SUPABASE_URL, SUPABASE_ANON_KEY, DB_TABLES
        │
        ▼
supabase-client.js  → creates the Supabase client, handles login/register/score sync
        │
        ▼
login.html / scoreboard.html / challenge pages → use SupabaseClient API
```

---

## 🎮 Demo Accounts

> Demo/local-only accounts are used when Supabase is not configured. Once you add real credentials and the `players` table, use your registered accounts instead.

---

## 🛠️ Tech Stack

- **Next.js** (for dev server / env loading)
- **Supabase** (auth, database, realtime)
- **Vanilla JS** (no framework for game logic)
- **CSS** custom properties + animations

---

## 📄 License

For educational / CTF competition use.
</content>

