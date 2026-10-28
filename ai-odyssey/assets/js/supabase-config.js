/* ============================================
   CRISIS LAB - Supabase Configuration
   ============================================
   Reads credentials from environment variables
   (set them in the .env file, or Vercel/Next.js
   project settings). Falls back to placeholder
   values so the app still loads locally.

   Where to find your values:
   Supabase Dashboard -> Project Settings -> API
   ============================================ */

// Safely read an environment variable, returning a fallback if unavailable.
function env(key, fallback) {
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  return fallback;
}

const SUPABASE_URL = env('NEXT_PUBLIC_SUPABASE_URL', 'https://mdndlskwwjneirxdcjcy.supabase.co');
const SUPABASE_ANON_KEY = env('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kbmRsc2t3d2puZWlyeGRjamN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU4NDYzMDcsImV4cCI6MjEwMTQyMjMwN30.FcnpMu53Ij67MPSU_oW69kc6HZxVQDsFNbZ0ps8xTxM');

// Table names (must match supabase-schema.sql / the SQL you ran)
const DB_TABLES = {
  users: env('NEXT_PUBLIC_SUPABASE_USERS_TABLE', 'players'),       // stores sign-in names, team names, passwords
  scores: env('NEXT_PUBLIC_SUPABASE_SCORES_TABLE', 'team_scores')  // stores team points, solved counts, timing
};

