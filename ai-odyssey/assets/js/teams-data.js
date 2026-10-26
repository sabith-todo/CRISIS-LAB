/* ==============================================================================
   CRISIS LAB — PRE-CONFIGURED TEAMS & PARTICIPANT ROSTER (100 TEAMS / 400 PARTICIPANTS READY)
   ============================================================================== */

const ROSTER_CLEAN_VERSION = 'v3_clean_400_teams_100';

// Auto-purge old dummy teams from previous testing sessions
(function purgeStaleDummyTeams() {
    if (typeof localStorage === 'undefined') return;
    try {
        if (localStorage.getItem('ai-odyssey-clean-version') !== ROSTER_CLEAN_VERSION) {
            // Force clean wipe of previous dummy teams
            localStorage.setItem('ai-odyssey-local-users', JSON.stringify({}));
            
            // Wipe all stale dummy team progress and status keys
            for (let i = localStorage.length - 1; i >= 0; i--) {
                const key = localStorage.key(i);
                if (key && (
                    key.startsWith('ai-odyssey-team-status-') ||
                    key.startsWith('ai-odyssey-progress-team-') ||
                    key.startsWith('ai-odyssey-arena-started-') ||
                    key.startsWith('ai-odyssey-arena-end-')
                )) {
                    localStorage.removeItem(key);
                }
            }
            localStorage.removeItem('ai-odyssey-deleted-all-teams');
            localStorage.removeItem('ai-odyssey-deleted-teams');
            localStorage.setItem('ai-odyssey-clean-version', ROSTER_CLEAN_VERSION);
        }
    } catch(e) {}
})();

// Clean slate: waiting for user's real 100 teams / 400 participants
const PRECONFIGURED_TEAMS = [];

// Automatically synchronize preconfigured teams to local accounts on load
(function autoSyncPreconfiguredTeams() {
    if (typeof localStorage === 'undefined') return;
    try {
        if (localStorage.getItem('ai-odyssey-deleted-all-teams') === 'true') return;

        const deletedTeams = JSON.parse(localStorage.getItem('ai-odyssey-deleted-teams') || '[]');
        const users = JSON.parse(localStorage.getItem('ai-odyssey-local-users')) || {};
        
        PRECONFIGURED_TEAMS.forEach(t => {
            if (!t || !t.team) return;
            const teamKey = t.team.toLowerCase();
            if (deletedTeams.includes(teamKey)) return;

            const members = t.members && t.members.length > 0 ? t.members.slice(0, 3) : [t.team];
            const status = localStorage.getItem(`ai-odyssey-team-status-${t.team}`) || t.status || 'approved';

            // Register team alias
            users[teamKey] = {
                username: members[0],
                password: t.password,
                team: t.team,
                members: members,
                role: 'player',
                status: status
            };

            // Register individual member logins
            members.forEach(m => {
                const memKey = m.toLowerCase();
                users[memKey] = {
                    username: m,
                    password: t.password,
                    team: t.team,
                    members: members,
                    role: 'player',
                    status: status
                };
            });

            // Set team status
            if (!localStorage.getItem(`ai-odyssey-team-status-${t.team}`)) {
                localStorage.setItem(`ai-odyssey-team-status-${t.team}`, status);
            }
        });

        localStorage.setItem('ai-odyssey-local-users', JSON.stringify(users));
    } catch (e) {
        console.error('Error syncing preconfigured teams:', e);
    }
})();

// Export for Node environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PRECONFIGURED_TEAMS };
}
