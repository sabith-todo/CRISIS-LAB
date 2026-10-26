/* ============================================
   CRISIS LAB - Live Team Scoreboard System
   Renders real-time rankings for all teams & members
   synchronized across all LAN devices via /api/all-progress
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
    const tbody = document.getElementById('scoreboardBody');
    if (!tbody) return;

    // Helper: Local user accounts store
    function getLocalUsers() {
        try {
            return JSON.parse(localStorage.getItem('ai-odyssey-local-users')) || {};
        } catch(e) {
            return {};
        }
    }

    // Helper to get members for a team
    function getTeamMembers(teamName) {
        const users = getLocalUsers();
        const members = new Set();
        Object.values(users).forEach(u => {
            if (u.team && u.team.toLowerCase() === (teamName || '').toLowerCase()) {
                if (Array.isArray(u.members)) {
                    u.members.forEach(m => members.add(m));
                } else if (u.username) {
                    members.add(u.username);
                }
            }
        });
        if (members.size === 0) members.add(teamName);
        return Array.from(members).slice(0, 3);
    }

    let lastScoreboardHash = '';

    function render(teams) {
        if (!teams || teams.length === 0) {
            tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;color:var(--text-muted);padding:2rem;">
                No registered teams found on the leaderboard yet.
            </td></tr>`;
            return;
        }

        // Fast fingerprint check to avoid unnecessary DOM thrashing
        const currentHash = teams.map(t => `${t.team_name}:${t.total_points}:${t.solved_count}:${t.last_solve}`).join('|');
        if (currentHash === lastScoreboardHash) {
            return; // Data has not changed, keep DOM pristine
        }
        lastScoreboardHash = currentHash;

        tbody.innerHTML = '';

        let totalSolves = 0;
        let topScore = 0;
        let leaderName = teams[0]?.team_name || '-';

        teams.forEach((team, index) => {
            const teamName = team.team_name || team.username || 'Anonymous';
            const status = localStorage.getItem(`ai-odyssey-team-status-${teamName}`) || 'approved';

            // Skip pending teams on public scoreboard
            if (status === 'pending') return;

            const isDQ = status === 'disqualified';
            const rankClass = isDQ ? '' : (index === 0 ? 'rank-1' : index === 1 ? 'rank-2' : index === 2 ? 'rank-3' : '');
            const rankIcon = isDQ ? '🚫' : (index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`);
            
            const teamSolves = team.solved_count || 0;
            totalSolves += teamSolves;
            if (!isDQ && (team.total_points || 0) > topScore) {
                topScore = team.total_points || 0;
                leaderName = teamName;
            }

            const members = team.members || getTeamMembers(teamName);
            const memberBadges = members.slice(0, 3).map(m => {
                const count = team.member_solves?.[m] || 0;
                return `<span style="display:inline-block; margin:2px; padding:2px 8px; border-radius:10px; background:rgba(0,240,255,0.08); border:1px solid rgba(0,240,255,0.25); font-size:0.75rem; color:var(--text-secondary);">👤 ${m}${count > 0 ? ` (${count})` : ''}</span>`;
            }).join('');

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="rank ${rankClass}" style="font-weight:800; font-size:1.1rem; text-align:center;">${rankIcon}</td>
                <td class="team-name" style="padding: 0.8rem 1rem;">
                    <div style="font-weight: 700; font-size: 1.05rem; ${isDQ ? 'color: var(--accent-danger); text-decoration: line-through;' : 'color: var(--accent-primary);'} margin-bottom: 0.25rem;">
                        ${teamName} ${isDQ ? '<span style="font-size:0.75rem; color:var(--accent-danger); border:1px solid var(--accent-danger); padding:2px 6px; border-radius:4px; margin-left:6px; text-decoration:none; display:inline-block;">DISQUALIFIED</span>' : ''}
                    </div>
                    <div style="display: flex; gap: 0.25rem; flex-wrap: wrap;">
                        ${memberBadges}
                    </div>
                </td>
                <td style="text-align: center; font-weight: 700;">${team.solved_count || 0}</td>
                <td style="text-align: center; color: var(--accent-success);">${team.easy || 0}</td>
                <td style="text-align: center; color: var(--accent-warning);">${team.medium || 0}</td>
                <td style="text-align: center; color: var(--accent-danger);">${team.hard || 0}</td>
                <td class="points" style="text-align: right; font-weight: 800; font-size: 1.15rem; ${isDQ ? 'color: var(--accent-danger); text-decoration: line-through;' : 'color: var(--accent-primary);'}">
                    ${(team.total_points || 0).toLocaleString()}
                </td>
                <td style="text-align: center; font-size: 0.85rem; color: var(--text-secondary);">
                    ${team.last_solve ? new Date(team.last_solve).toLocaleTimeString() : '-'}
                </td>
                <td style="font-size: 0.85rem; color: var(--text-primary);">
                    ${team.recent_solver ? `<span style="color:var(--accent-success); font-weight:600;">👤 ${team.recent_solver}</span>` : '<span style="color:var(--text-muted);">-</span>'}
                </td>
            `;

            tbody.appendChild(tr);
        });

        // Update stats widgets
        const statTotalTeams = document.getElementById('statTotalTeams');
        if (statTotalTeams) statTotalTeams.textContent = teams.length;

        const statTotalSolves = document.getElementById('statTotalSolves');
        if (statTotalSolves) statTotalSolves.textContent = totalSolves;

        const statTopScore = document.getElementById('statTopScore');
        if (statTopScore) statTopScore.textContent = `${topScore.toLocaleString()} pts`;

        const statLeaderTeam = document.getElementById('statLeaderTeam');
        if (statLeaderTeam) statLeaderTeam.textContent = leaderName;

        renderLiveFeed(teams);
    }

    function renderLiveFeed(teams) {
        const feedContainer = document.getElementById('liveSolveFeed');
        if (!feedContainer) return;

        const events = [];

        // Collect all solved events across teams from localStorage
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('ai-odyssey-progress-team-')) {
                const teamName = key.replace('ai-odyssey-progress-team-', '');
                try {
                    const prog = JSON.parse(localStorage.getItem(key)) || {};
                    Object.keys(prog).forEach(chId => {
                        const p = prog[chId];
                        if (p && p.solved) {
                            events.push({
                                team: teamName,
                                solver: p.solvedBy || teamName,
                                challengeId: chId,
                                points: p.earnedPoints || 50,
                                time: p.time ? new Date(p.time) : new Date()
                            });
                        }
                    });
                } catch(e) {}
            }
        }

        events.sort((a, b) => b.time - a.time);

        feedContainer.innerHTML = '';
        if (events.length === 0) {
            feedContainer.innerHTML = `<div style="text-align:center; padding:1.5rem; color:var(--text-muted); font-size:0.85rem;">No solves recorded yet. Solves will appear live here as teams complete challenges!</div>`;
            return;
        }

        events.slice(0, 10).forEach(ev => {
            const item = document.createElement('div');
            item.style.cssText = `
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 0.6rem 1rem;
                background: rgba(255, 255, 255, 0.03);
                border: 1px solid rgba(255, 255, 255, 0.06);
                border-radius: 8px;
                font-size: 0.85rem;
            `;
            item.innerHTML = `
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <span style="color: var(--accent-success);">⚡</span>
                    <strong>${ev.solver}</strong>
                    <span style="color: var(--text-muted);">(${ev.team})</span>
                    <span>solved <strong style="color:var(--accent-primary);">Challenge #${ev.challengeId}</strong></span>
                </div>
                <div style="display: flex; align-items: center; gap: 1rem;">
                    <span style="color: var(--accent-success); font-weight: 700;">+${ev.points} pts</span>
                    <span style="color: var(--text-muted); font-size: 0.75rem;">${ev.time.toLocaleTimeString()}</span>
                </div>
            `;
            feedContainer.appendChild(item);
        });
    }

    // Fetch authoritative score ranking directly from central backend
    async function getCombinedScoreboard() {
        const prefix = window.location.pathname.includes('/challenges/') ? '../../' : '';
        try {
            const res = await fetch(`${prefix}api/scoreboard`, { cache: 'no-store' });
            if (res.ok) {
                const data = await res.json();
                if (data && data.scoreboard) {
                    return data.scoreboard.map((item, idx) => ({
                        team_name: item.team,
                        members: item.members || [item.team],
                        total_points: item.score || 0,
                        solved_count: item.solvesCount || 0,
                        easy: item.easy || 0,
                        medium: item.medium || 0,
                        hard: item.hard || 0,
                        last_solve: item.lastSolveTime || null,
                        recent_solver: item.recentSolver || null,
                        member_solves: item.memberSolves || {}
                    }));
                }
            }
        } catch(e) {}
        return [];
    }

    let scoreboardRevision = 0;

    async function load(isForced = false) {
        const prefix = window.location.pathname.includes('/challenges/') ? '../../' : '';
        
        try {
            // Check revision first
            const revRes = await fetch(`${prefix}api/revision`, { cache: 'no-store' });
            if (revRes.ok) {
                const revData = await revRes.json();
                const serverRev = revData.revision || 1;
                
                if (revData.frozen !== undefined) {
                    localStorage.setItem('ai-odyssey-scoreboard-frozen', String(revData.frozen));
                }

                if (!isForced && serverRev === scoreboardRevision) {
                    return; // No changes on server, avoid unnecessary DOM re-renders
                }
                scoreboardRevision = serverRev;
            }
        } catch(e) {}

        const isFrozen = localStorage.getItem('ai-odyssey-scoreboard-frozen') === 'true';
        const frozenBanner = document.getElementById('scoreboardFrozenBanner');
        const liveIndicator = document.getElementById('liveStatusIndicator');
        const liveText = document.getElementById('liveStatusText');

        if (isFrozen) {
            if (frozenBanner) frozenBanner.style.display = 'block';
            if (liveText) {
                liveText.textContent = 'FROZEN';
                liveText.style.color = 'var(--accent-primary)';
            }
            if (liveIndicator) liveIndicator.style.background = 'var(--accent-primary)';

            const frozenData = localStorage.getItem('ai-odyssey-scoreboard-frozen-data');
            if (frozenData) {
                try {
                    render(JSON.parse(frozenData));
                    return;
                } catch(e) {}
            }
        } else {
            if (frozenBanner) frozenBanner.style.display = 'none';
            if (liveText) {
                liveText.textContent = `LIVE UPDATING (Rev #${scoreboardRevision})`;
                liveText.style.color = 'var(--accent-success)';
            }
            if (liveIndicator) liveIndicator.style.background = 'var(--accent-success)';
            localStorage.removeItem('ai-odyssey-scoreboard-frozen-data');
        }

        const data = await getCombinedScoreboard();
        if (isFrozen) localStorage.setItem('ai-odyssey-scoreboard-frozen-data', JSON.stringify(data));
        render(data);
    }

    // Initial load
    load(true);

    // Poll live leaderboard every 2.5 seconds
    setInterval(() => load(false), 2500);

    // Instant recovery on network restore or tab focus
    window.addEventListener('online', () => load(true));
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) load(true);
    });

    // Scoreboard tab filters
    const filterTabs = document.querySelectorAll('.scoreboard-tab');
    filterTabs.forEach(tab => {
        tab.addEventListener('click', async () => {
            filterTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            const filter = tab.dataset.filter;
            const teams = await getCombinedScoreboard();

            if (filter === 'top3') {
                render(teams.slice(0, 3));
            } else if (filter === 'active') {
                render(teams.filter(t => (t.solved_count || 0) > 0));
            } else {
                render(teams);
            }
        });
    });
});
