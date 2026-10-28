# AI Odyssey: CRISIS LAB — Debug the Arena

A full-stack, competitive CTF-style debugging tournament platform and learning arena. Designed for hackathons, collegiate competitions, and developer workshops, CRISIS LAB challenges participants to diagnose and fix real-world bugs across **Python, C, Java, HTML, CSS, and JavaScript** under strict dual-timer constraints with an authoritative real-time scoring engine, live scoreboard, and admin command center.

---

## Table of Contents

- [Overview](#overview)
- [System Architecture](#system-architecture)
  - [Authoritative Backend Engine](#authoritative-backend-engine)
  - [Dual Persistence & Fallback Design](#dual-persistence--fallback-design)
  - [Architecture & Package Configuration Clarification](#architecture--package-configuration-clarification)
- [Key Features](#key-features)
  - [Challenge Arena & Workflow](#challenge-arena--workflow)
  - [Dual-Timer System](#dual-timer-system)
  - [Scoring, Bonuses & Tie-Breaking](#scoring-bonuses--tie-breaking)
  - [AI Engineering Coach](#ai-engineering-coach)
  - [Live Scoreboard & Freeze Mode](#live-scoreboard--freeze-mode)
  - [Admin Command Center & Team Portal](#admin-command-center--team-portal)
  - [Standalone Debug Game](#standalone-debug-game)
- [Challenge Catalog](#challenge-catalog)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation and Setup](#installation-and-setup)
- [Configuration and Environment Variables](#configuration-and-environment-variables)
  - [Server Environment Variables](#server-environment-variables)
  - [Supabase Configuration (Optional Cloud Sync)](#supabase-configuration-optional-cloud-sync)
- [Usage Guide](#usage-guide)
  - [1. Administrator Operations](#1-administrator-operations)
  - [2. Participant / Team Operations](#2-participant--team-operations)
  - [Verified Application Endpoints](#verified-application-endpoints)
- [Testing and Verification](#testing-and-verification)
- [Troubleshooting](#troubleshooting)
- [Security and Fair Play](#security-and-fair-play)
- [Future Roadmap](#future-roadmap)
- [License and Credits](#license-and-credits)

---

## Overview

**CRISIS LAB: Debug the Arena** is an interactive, multi-language debugging tournament platform. Unlike traditional algorithmic competitive programming platforms (which require writing solutions from scratch), CRISIS LAB models realistic production incidents: participants inherit broken codebases, analyze compiler errors or runtime stack traces, inspect visual rendering bugs, and submit precise surgical fixes to restore system invariants.

### Key Objectives
- **Target Audience:** Hackathon teams, computer science students, engineering recruits, and software developers.
- **Team Model:** 1 to 3 members per team sharing synchronized tournament state.
- **Core Problem Solved:** Eliminates the logistical complexity of hosting multi-language debugging hackathons by providing an authoritative flag validation engine, automated team approvals, concurrency enforcement, LAN synchronization, and live leaderboard displays in a single zero-dependency server.

---

## System Architecture

```
                       ┌─────────────────────────────────────────┐
                       │           Client Web Browsers           │
                       │  (Participants, Scoreboard, Admin GUI)  │
                       └────────────────────┬────────────────────┘
                                            │ HTTP / JSON REST
                                            ▼
                       ┌─────────────────────────────────────────┐
                       │        server.js (Node.js Engine)       │
                       │ ─────────────────────────────────────── │
                       │ • Authoritative Flag/Fix Verification   │
                       │ • Rate Limiting & DoS Protection Shield │
                       │ • Session & Concurrency Enforcement     │
                       │ • Multi-Device LAN State Synchronizer   │
                       │ • Static Asset Server & Security Filter │
                       └───────────┬─────────────────┬───────────┘
                                   │                 │
                Local Persistence  ▼                 ▼  Optional Cloud Sync
                    ┌──────────────────┐         ┌────────────────────┐
                    │ arena-state.json │         │  Supabase Cloud DB │
                    │ (In-Memory Sync) │         │ (players, scores)  │
                    └──────────────────┘         └────────────────────┘
```

### Authoritative Backend Engine
The core tournament engine is implemented in `server.js`, a native Node.js HTTP server without external runtime frameworks. The server manages:
- **Authoritative Answer Evaluation:** Validates submissions against `ChallengesDB` (`assets/js/challenges.js`), testing both exact code statements and canonical flag formats with whitespace and token normalization.
- **State Revision Engine:** Employs an incrementing `stateRevision` counter. Clients poll `/api/revision` and conditionally refresh data only when mutations occur, preventing DOM thrashing.
- **Single-Device Session Guard:** Restricts each member account to one active browser session. Simultaneous logins trigger session collision alerts.

### Dual Persistence & Fallback Design
1. **Primary Store (`arena-state.json`):** The server maintains all active teams, solve records, timestamps, timer states, and announcements in memory, asynchronously flushing changes to `arena-state.json`.
2. **Supabase Cloud Database (Optional):** Supports parallel cloud synchronization for user credentials and scoreboard replication via `supabase-client.js` and `supabase-schema.sql`.
3. **Browser Fallback (`localStorage`):** If network connectivity to the central server is interrupted, the client scripts (`main.js`, `login-supabase.js`, `scoreboard-supabase.js`) fall back to local client evaluation to preserve offline resilience.

### Architecture & Package Configuration Clarification

> [!NOTE]
> **Next.js & Package Configuration Notice**
> The project's `package.json` contains dependencies and scripts for Next.js (`"dev": "next dev"`), React, and Tailwind CSS. However, **the actual application architecture is entirely static HTML5, CSS3, vanilla JavaScript, and a native Node.js HTTP server (`server.js`)**.
> 
> There are no Next.js page routes (`pages/` or `app/`), React JSX/TSX components, or Next.js build manifests. Running `npm run dev` or `next dev` will fail or launch an empty Next.js environment that bypasses `server.js` and its API routes.
> 
> **Always launch the platform using:**
> ```bash
> node server.js
> ```

---

## Key Features

### Challenge Arena & Workflow
- **76 Pre-Generated Challenges:** Spanning Python, C, Java, Web (HTML & CSS), JavaScript, and a Grand Boss module.
- **Compiler & Runtime Tracebacks:** Each challenge presents a simulated system module along with exact error outputs, exception logs, or assertion failures.
- **Visual Bug Inspection:** Challenge modules include an interactive visual inspection tool with image preview and local screenshot upload support for UI rendering defects.
- **Dual Flag Submission Format:** Submissions accept either the exact corrected code expression (e.g., `await asyncio.sleep(0.5)`) or the wrapped CTF flag string (`AIODYSSEY{...}`).

### Dual-Timer System
1. **Global Arena Timer (90 Minutes):** A synchronized tournament-wide countdown controlled by the administrator. Broadcast to all clients via `/api/timer`.
2. **Problem Countdown Timers:** Individual timers that enforce time pressure per challenge attempt:
   - **Easy:** 5 minutes (300 seconds)
   - **Medium:** 7 minutes (420 seconds)
   - **Hard & Boss:** 10 minutes (600 seconds)
3. **Team Expiry Lock:** If a problem timer reaches `00:00`, the challenge locks permanently for that team.
4. **Team Solve Synchronization:** When any team member solves a challenge, the solve status propagates across all team members' screens.

### Scoring, Bonuses & Tie-Breaking
- **Base Points by Tier:**
  - Easy: **50 points**
  - Medium: **100 – 150 points**
  - Hard: **200 points**
  - Grand Boss (#66): **1,000 points**
- **Dynamic Bonuses:**
  - **Problem Time Bonus:** `+10 points` for each full minute remaining on the problem countdown clock.
  - **First Blood Bonus:** `+25 points` awarded to the first team across the entire tournament to solve a specific challenge.
  - **No-Hint Bonus:** `+20 points` for solving without expanding hints.
- **Deterministic Leaderboard Ranking:** Teams are sorted by:
  1. `Total Score` (Descending)
  2. `Solved Count` (Descending)
  3. `Last Solve Timestamp` (Ascending / Earliest solve wins ties)
  4. `Team Name` (Alphabetical fallback)

### AI Engineering Coach
Challenge pages feature an embedded **AI Debug Coach** (`assets/js/ai-coach.js`). Operating under strict tournament integrity prompts, the assistant provides conceptual guidance, edge-case analysis, and debugging direction without revealing ready-to-submit answers.

### Live Scoreboard & Freeze Mode
- **Live Leaderboard (`scoreboard.html`):** Renders ranked teams, solve distributions (Easy/Medium/Hard), member-by-member solve contributions, and a live solve feed.
- **Scoreboard Freeze:** Administrators can freeze public scoreboard updates during the final minutes of the competition while the backend continues recording solves in the background.

### Admin Command Center & Team Portal
- **Admin Command Center (`admin.html`):** Protected by master credentials, providing 8 specialized operational panels:
  - *Credentials & Share Hub:* Search team credentials and copy auto-login links.
  - *Live Arena Scoreboard:* Unfrozen administrative scoreboard view.
  - *Teams Monitor & Approvals:* Approve pending teams, reject registrations, soft delete, restore, or permanently purge records. Includes auto-approval toggle.
  - *Timer & Broadcasts:* Start, stop, reset, or add time (`+5m`, `+10m`, `+15m`) to the global arena clock, and dispatch banner broadcasts.
  - *Challenge Database:* Complete inspection view of all 76 challenges, solutions, and hints.
  - *Solves Audit Log:* Real-time chronological audit trail of every solve attempt.
  - *Security Shield & Telemetry:* Live security events, IP rate-limiting adjustments (`relaxed`, `normal`, `strict`), emergency lockdown toggle, and session termination.
  - *Data Backup & Restore:* State JSON export and manual snapshot restoration.
- **Team Share Portal (`teams.html`):** Dedicated admin directory for distributing team credentials, generating 1-click shareable URLs, and tracking member capacity.

### Standalone Debug Game
- **Interactive Micro-Game (`debug-game.html`):** A fast-paced secondary game mode containing 28 focused token-replacement challenges across Python, C, and Java (8 Easy, 10 Medium, 10 Hard).
- **Gameplay:** Participants identify the single incorrect token, keyword, or operator. Includes a streak counter, timer, progressive hints, and code explanations.

---

## Challenge Catalog

The platform includes **76 challenges** organized by language and difficulty tier:

| Category | Challenge Count | Primary Technical Focus |
|:---|:---:|:---|
| **Python** | 17 | Asyncio event loops, closure late-binding, mutable defaults, generator exhaustion, GIL threading, memory leaks |
| **C** | 17 | Pointer arithmetic, buffer overflows, use-after-free, memory allocation (`malloc`/`free`), off-by-one errors |
| **Java** | 16 | Concurrency deadlocks, thread safety, synchronization, stream pipelines, polymorphism, memory reference leaks |
| **Web (HTML/CSS)** | 20 | Flexbox/Grid alignment, stacking context (`z-index`), sticky positioning, form validation, semantic markup |
| **JavaScript** | 5 | Event loop microtasks, prototype pollution, closure scope, floating-point math, promise chaining |
| **Master / Grand Boss** | 1 | Challenge #66: Multi-tier distributed systems architecture hazard |
| **Total** | **76** | **Comprehensive Multi-Stack Debugging** |

### Difficulty Tier Breakdown

| Tier | Challenges | Base Points | Problem Timer | Target Errors to Resolve |
|:---|:---:|:---:|:---:|:---|
| **Easy** | 31 | 50 pts | 5 Minutes | 3 syntax or logic errors |
| **Medium** | 20 | 100–150 pts | 7 Minutes | 7 interdependent errors |
| **Hard** | 24 | 200 pts | 10 Minutes | Advanced architectural & concurrency traps |
| **Grand Boss** | 1 | 1,000 pts | 10 Minutes | Master full-stack invariant failure |

---

## Technology Stack

### Backend & Server Runtime
- **Runtime:** Node.js (v18.0.0 or later; v20+ recommended)
- **Core Server:** Native Node.js `http` module (`server.js`)
- **Sandboxing & Utilities:** `vm`, `crypto`, `fs`, `path`, `os`
- **State Persistence:** Local JSON file engine (`arena-state.json`)

### Frontend
- **Structure:** Semantic HTML5 (`index.html`, `login.html`, `dashboard.html`, `scoreboard.html`, `admin.html`, `teams.html`, `rules.html`, `debug-game.html`)
- **Styling:** Custom CSS3 with CSS Custom Properties, Glassmorphism, CSS Grid, Flexbox, and responsive cyberpunk themes (`assets/css/`)
- **Logic:** Vanilla JavaScript (ES6+ modular controllers: `App`, `TimerManager`, `AnimationManager`, `AICoach`, `DG`)
- **Visuals:** HTML5 Canvas particle system (`assets/js/particles.js`)

### External Services & Tooling
- **Database (Optional Cloud Sync):** Supabase (PostgreSQL with Row Level Security via `@supabase/supabase-js` v2 CDN)
- **Challenge Generation:** Node.js script (`generate-challenges.js`)
- **Testing:** Custom test suites using Node.js assertions (`scratch/*.js`)

---

## Project Structure

```
ai-odyssey/
├── index.html                  # Landing page & hero overview
├── login.html                  # Participant authentication & team registration
├── dashboard.html              # Filterable 76-challenge grid & active team status
├── scoreboard.html             # Live real-time leaderboard & solve stream
├── admin.html                  # Super Admin command center & tournament control
├── teams.html                  # Admin-only team directory & credentials portal
├── rules.html                  # Official competition rules & scoring criteria
├── debug-game.html             # Standalone 28-challenge token bug-hunting game
├── server.js                   # Authoritative Node.js backend server & API
├── arena-state.json            # Central persistent state file (teams, progress, timers)
├── generate-challenges.js      # Build script for generating challenge pages
├── supabase-schema.sql         # Optional PostgreSQL database schema for Supabase
├── SUPABASE_SETUP.md           # Documentation for configuring Supabase
├── package.json                # Project dependencies and script declarations
├── .gitignore                  # Git exclusion rules
│
├── assets/
│   ├── css/
│   │   ├── main.css            # Base design system & typography
│   │   ├── cyberpunk.css       # Neon accents, glow effects & cyber elements
│   │   ├── animations.css      # Keyframes, transitions & particle styles
│   │   └── pages.css           # View-specific layouts (dashboard, admin, login)
│   └── js/
│       ├── server.js           # (Symlink or reference to backend server)
│       ├── challenges.js       # Database of all 76 challenges & valid answers
│       ├── debug-challenges.js # 28 micro-challenges for the debug game
│       ├── debug-game.js       # Game loop logic for debug-game.html
│       ├── main.js             # Main frontend app controller & submission logic
│       ├── timer.js            # Dual-timer synchronization manager
│       ├── admin.js            # Administration portal interactive logic
│       ├── ai-coach.js         # Embedded AI debugging assistant
│       ├── scoreboard-supabase.js # Real-time scoreboard polling & rendering
│       ├── login-supabase.js   # Client login/registration event handlers
│       ├── supabase-client.js  # Supabase client wrapper
│       ├── supabase-config.js  # Supabase connection credentials & fallbacks
│       ├── teams-data.js       # Local team cache & default roster definitions
│       ├── navigation.js       # Mobile navigation & route active state
│       ├── particles.js        # Canvas background particle effects
│       └── theme.js            # Dark/light theme persistence
│
├── challenges/
│   ├── template.html           # Master template for challenge pages
│   ├── README.md               # Challenge directory documentation
│   ├── challenge01/            # Challenge #01 files (index.html, flag.txt)
│   │   ├── index.html
│   │   └── flag.txt
│   └── challenge02/ ... challenge76/
│
└── scratch/                    # Test suites & acceptance verification scripts
    ├── test_fixed_validation.js
    ├── test_final_acceptance_all_requirements.js
    ├── test_complete_arena_flow.js
    ├── test_high_traffic_load.js
    └── test_semicolon_exploit.js
```

---

## Prerequisites

- **Node.js:** `v18.0.0` or higher (verified up to `v24.x`)
- **npm:** `v9.0.0` or higher
- **Web Browser:** Any modern evergreen browser (Google Chrome, Mozilla Firefox, Apple Safari, Microsoft Edge)
- **Local Network (Optional):** Wi-Fi or LAN connection if running a multi-device local tournament

---

## Installation and Setup

### 1. Navigate to Project Directory
```bash
cd ai-odyssey
```

### 2. Install Dependencies (Optional)
The core server (`server.js`) relies solely on native Node.js standard libraries and can run immediately without external packages. If you wish to install the declared npm dependencies:
```bash
npm install
```

### 3. (Optional) Rebuild Challenge Directories
If challenge templates or descriptions are modified, regenerate all 76 challenge directories:
```bash
node generate-challenges.js
```

### 4. Start the Application Server
Run the authoritative Node.js server:
```bash
node server.js
```

Upon startup, the console displays local and network connection URLs:
```text
======================================================
🛡️ CRISIS LAB ADVANCED SECURE ARENA SERVER IS LIVE!
======================================================
📍 Local Link (Your PC):        http://localhost:3000
🌐 Teammate Link (Same Wi-Fi):   http://192.168.1.X:3000
👥 Dashboard:                   http://192.168.1.X:3000/dashboard.html
📊 Scoreboard:                  http://192.168.1.X:3000/scoreboard.html
⚙️ Admin Portal:                http://192.168.1.X:3000/admin.html
🛡️ Security Shield:             ENABLED (Rate Limiter, Anti-Traversal, Auth Tokens)
⚡ Authoritative Flag Engine:   ACTIVE (Server-Side Answer Validation)
======================================================
```

---

## Configuration and Environment Variables

### Server Environment Variables

You can configure the server using standard environment variables:

| Variable | Type | Default | Description |
|:---|:---:|:---:|:---|
| `PORT` | Number | `3000` | Port for the HTTP server. If occupied, the server automatically increments to `PORT + 1`. |
| `ADMIN_USER` | String | `ODYSSEY` | Super Administrator username for `admin.html` access. |
| `ADMIN_PASS` | String | `techodyssey` | Super Administrator password. |

Example running with custom credentials and port:
```bash
PORT=8080 ADMIN_USER="TournamentAdmin" ADMIN_PASS="SecureAdminKey2026" node server.js
```

### Supabase Configuration (Optional Cloud Sync)

If using Supabase for cloud-backed authentication and scoreboard replication:

1. Create a project at [supabase.com](https://supabase.com).
2. Open the **SQL Editor** in the Supabase Dashboard and run the contents of `supabase-schema.sql`.
3. In `Supabase Dashboard -> Database -> Replication`, enable Realtime for the `team_scores` table.
4. Update `assets/js/supabase-config.js` with your project URL and anonymous public key:

```javascript
const SUPABASE_URL = 'https://YOUR_PROJECT_ID.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_ANON_PUBLIC_KEY';

const DB_TABLES = {
  users: 'players',
  scores: 'team_scores'
};
```

> [!CAUTION]
> Never commit real database service-role keys or administrator production passwords to source control.

---

## Usage Guide

### 1. Administrator Operations
1. **Access Admin Portal:** Open `http://localhost:3000/admin.html`.
2. **Authenticate:** Sign in using the admin credentials (default `ODYSSEY` / `techodyssey`).
3. **Approve Teams:** Navigate to the **Teams Monitor & Approvals** tab to approve pending registered teams (or toggle **Auto-Approval**).
4. **Distribute Access:** Use the **Credentials & Share Hub** or `teams.html` to copy 1-click login links for participating teams.
5. **Start Tournament:** In **Timer & Broadcasts**, click **Start 90m Arena**. This unlocks the challenges across all participant screens and starts the synchronized countdown clock.
6. **Freeze Scoreboard:** When approaching the end of the competition, trigger **Freeze Scoreboard** to conceal final placements until the awards ceremony.

### 2. Participant / Team Operations
1. **Registration & Login:** Go to `http://<SERVER_IP>:3000/login.html`.
   - Teams register with a Team Name, Password, and 1 to 3 Member Usernames.
   - Newly registered teams wait in `Pending Approval` until approved by the administrator.
2. **Explore Challenges:** Access `dashboard.html` to browse 76 challenges filterable by language (Python, C, Java, Web, JS), difficulty, or solve status.
3. **Solve & Submit:**
   - Click any unlocked challenge card to open its problem view (`challenges/challengeXX/index.html`).
   - Observe the individual problem timer.
   - Inspect the broken code, description, objective, and error trace.
   - Use the **AI Debug Coach** if conceptual hints are needed.
   - Paste the corrected statement or flag into the submission box and click **Submit Fix**.
4. **Track Rankings:** Monitor team scores, solve counts, and live solve alerts on `scoreboard.html`.

### Verified Application Endpoints

| URL Path | Access Level | Description |
|:---|:---:|:---|
| `/` or `/index.html` | Public | Tournament landing page, quick statistics, and navigation |
| `/login.html` | Public | Participant login and multi-member team registration form |
| `/dashboard.html` | Participant | Filterable challenge grid and active team status bar |
| `/scoreboard.html` | Public | Live scoreboard, member solve stats, and real-time feed |
| `/rules.html` | Public | Official rules, difficulty tiers, and scoring breakdown |
| `/debug-game.html` | Public | 28-challenge standalone token bug-hunting micro-game |
| `/admin.html` | Administrator | 8-panel tournament command center and management console |
| `/teams.html` | Administrator | Team credentials directory and 1-click shareable login portal |
| `/challenges/challengeXX/index.html` | Participant | Dedicated problem page for Challenge #XX (`01` through `76`) |

---

## Testing and Verification

The repository includes automated verification scripts in the `scratch/` directory:

### Run Standalone Challenge Answer Validation
Verifies all 76 challenge solutions and tests for empty string or semicolon injection exploits:
```bash
node scratch/test_fixed_validation.js
```
*Expected Output:* `0 exploits found across all 76 challenges. Legitimate answers verified: 76 / 76 challenges passed.`

### Run Full-System End-to-End Acceptance Test
Ensures all API routes, authentication checks, team approval flows, and rate limiters operate correctly:
1. In one terminal, ensure the server is active:
   ```bash
   node server.js
   ```
2. In a second terminal, execute the acceptance suite:
   ```bash
   node scratch/test_final_acceptance_all_requirements.js
   ```

### Run Complete Arena Flow Verification
Simulates team registration, admin approval, timer initialization, solve submission, and scoreboard calculation:
```bash
node scratch/test_complete_arena_flow.js
```

---

## Troubleshooting

### 1. `EADDRINUSE` Port Conflicts
- **Symptom:** Terminal reports `Port 3000 is already in use`.
- **Resolution:** `server.js` automatically catches this error and switches to the next available port (e.g., `3001`). Alternatively, terminate the conflicting process or set a custom port:
  ```bash
  PORT=3050 node server.js
  ```

### 2. "Competition Arena: Waiting for Administrator"
- **Symptom:** Challenges on `dashboard.html` show a waiting banner, or submission returns HTTP 403.
- **Resolution:** The global arena has not been started. The administrator must log into `admin.html` and click **Start 90m Arena Now**.

### 3. "Team is PENDING Admin approval"
- **Symptom:** Team cannot log in after registration.
- **Resolution:** New teams require administrative authorization by default. The administrator must open `admin.html -> Teams Monitor` and click **Approve** (or enable **Auto-Approval**).

### 4. Single-Device Session Lockout
- **Symptom:** Login reports `"[User]" is already logged in on another device!`.
- **Resolution:** To prevent account sharing across unauthorized machines, each username allows only one active session. Close the session on the previous device or terminate the session from the admin panel (**Security Shield -> Terminate Sessions**).

### 5. `npm run dev` Fails or Shows an Empty Next.js Screen
- **Symptom:** Running `npm run dev` does not launch the CRISIS LAB tournament arena.
- **Resolution:** As noted in the architecture section, the application is not built on Next.js. Start the server using `node server.js`.

---

## Security and Fair Play

- **In-Memory Rate Limiting:** Sliding-window rate limiters restrict polling, login brute-forcing, and flag spamming. Five consecutive failed admin login attempts trigger an automatic 5-minute IP lockout.
- **File Access Restrictions:** `server.js` actively blocks directory traversal attempts and prevents direct HTTP access to hidden files (`.env*`, `.git*`), markdown documentation (`answers.md`, `solutions.md`, `teams_credentials.md`), SQL scripts, and server configuration files.
- **Single Active Session Rule:** Real-time presence tracking disallows concurrent sessions under the same player handle.
- **Sanitized Outputs:** User-generated team names and usernames are sanitized to guard against cross-site scripting (XSS).
- **Submissions Audit Trail:** All flag submissions and administrative actions are logged in memory and visible in the Admin Command Center audit log.

---

## Future Roadmap

1. **Native WebSockets:** Upgrade current HTTP polling (`/api/revision`, `/api/timer`) to WebSocket connections for lower-latency state broadcasts.
2. **Sandboxed Code Execution:** Integrate an isolated container runtime (e.g., Judge0 or WebAssembly runners) to execute participant code dynamically rather than validating token/flag patterns.
3. **Password Hashing:** Upgrade stored team passwords from plain text to cryptographic hashing (bcrypt/argon2).
4. **Automated Dockerization:** Provide a `Dockerfile` and `docker-compose.yml` for single-command production deployment.

---

## License and Credits

- **License:** For educational, hackathon, and CTF competition use.
- **Project:** Developed for the **Crisis Laboratory / AI Odyssey** debugging tournament series.
- **Copyright:** &copy; 2026 Crisis Laboratory. All rights reserved.
