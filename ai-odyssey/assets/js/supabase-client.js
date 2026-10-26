/* ============================================
   CRISIS LAB - Supabase Client
   Handles: login, register, score updates,
   and the realtime scoreboard/ranking.
   ============================================ */

const SupabaseClient = {
    client: null,
    ready: false,

    init() {
        // Only initialise if the Supabase library is loaded and config is set
        if (typeof supabase === 'undefined' || !SUPABASE_URL || SUPABASE_URL.includes('YOUR_SUPABASE_URL')) {
            console.warn('Supabase not configured. Add your URL + anon key in supabase-config.js');
            return;
        }
        try {
            this.client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            this.ready = true;
        } catch (err) {
            console.error('Supabase init failed:', err);
        }
    },

    /* ============================================
       LOGIN
       ============================================ */
    async login(username, password) {
        if (!this.ready) return { success: false, error: 'Supabase not configured.' };

        try {
            const { data, error } = await this.client
                .from(DB_TABLES.users)
                .select('username, password, team_name, role')
                .eq('username', username)
                .maybeSingle();

            if (error) return { success: false, error: error.message };
            if (!data) return { success: false, error: 'Invalid username or password.' };
            if (data.password !== password) return { success: false, error: 'Invalid username or password.' };

            return { success: true, user: data };
        } catch (err) {
            return { success: false, error: err.message || 'Login failed.' };
        }
    },

    /* ============================================
       REGISTER (store username + team name)
       ============================================ */
    async register(username, password, teamName) {
        if (!this.ready) return { success: false, error: 'Supabase not configured.' };

        try {
            // 1. Create the player
            const { data: player, error: playerError } = await this.client
                .from(DB_TABLES.users)
                .insert({ username, password, team_name: teamName, role: 'player' })
                .select()
                .single();

            if (playerError) return { success: false, error: playerError.message };

            // 2. Create a score row for the team (or update if exists)
            const { error: scoreError } = await this.client
                .from(DB_TABLES.scores)
                .upsert({ team_name: teamName, total_points: 0, solved_count: 0, easy: 0, medium: 0, hard: 0 });

            if (scoreError) return { success: false, error: scoreError.message };

            return { success: true, user: player };
        } catch (err) {
            return { success: false, error: err.message || 'Registration failed.' };
        }
    },

    /* ============================================
       UPDATE SCORE (after a challenge is solved)
       ============================================ */
    async updateScore(teamName, scoreData) {
        if (!this.ready) return { success: false, error: 'Supabase not configured.' };

        try {
            const { data, error } = await this.client
                .from(DB_TABLES.scores)
                .upsert({
                    team_name: teamName,
                    total_points: scoreData.total_points || 0,
                    solved_count: scoreData.solved_count || 0,
                    easy: scoreData.easy || 0,
                    medium: scoreData.medium || 0,
                    hard: scoreData.hard || 0,
                    last_solve: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'team_name'
                });

            if (error) return { success: false, error: error.message };
            return { success: true, data };
        } catch (err) {
            return { success: false, error: err.message || 'Failed to update score.' };
        }
    },

    /* ============================================
       LOAD SCOREBOARD (ranked teams)
       ============================================ */
    async loadScoreboard() {
        if (!this.ready) return { success: false, error: 'Supabase not configured.', data: [] };

        try {
            const { data, error } = await this.client
                .from(DB_TABLES.scores)
                .select('team_name, total_points, solved_count, easy, medium, hard, last_solve')
                .order('total_points', { ascending: false })
                .order('last_solve', { ascending: true });

            if (error) return { success: false, error: error.message, data: [] };
            if (!data) return { success: true, data: [] };

            // Assign ranks
            const ranked = data.map((team, index) => ({ ...team, rank: index + 1 }));
            return { success: true, data: ranked };
        } catch (err) {
            return { success: false, error: err.message || 'Failed to load scoreboard.', data: [] };
        }
    },

    /* ============================================
       REALTIME SCOREBOARD SUBSCRIPTION
       Re-renders the table whenever any score changes.
       ============================================ */
    subscribeScoreboard(onChange) {
        if (!this.ready) return null;

        try {
            const channel = this.client
                .channel('scoreboard-changes')
                .on(
                    'postgres_changes',
                    { event: '*', schema: 'public', table: DB_TABLES.scores },
                    () => {
                        if (typeof onChange === 'function') onChange();
                    }
                )
                .subscribe();
            return channel;
        } catch (err) {
            console.error('Subscription error:', err);
            return null;
        }
    }
};

// Auto-initialise when the DOM is ready
document.addEventListener('DOMContentLoaded', () => SupabaseClient.init());
