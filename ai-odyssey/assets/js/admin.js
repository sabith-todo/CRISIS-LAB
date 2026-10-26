/* ==============================================================================
   CRISIS LAB — Super Administrator Command Center Engine
   Credentials:
   Username: ODYSSEY
   Password: techodyssey
   ============================================================================== */

function initAdmin() {
    const adminGate = document.getElementById('adminLoginGate');
    const adminMain = document.getElementById('adminMainContent');
    const authForm = document.getElementById('adminAuthForm');
    const authMsg = document.getElementById('adminAuthMsg');

    let currentCategoryFilter = 'all';
    let currentTeamStatusFilter = 'all';
    let currentTeamSort = 'points-desc';

    // --- BULLETPROOF TOAST HELPER ---
    function showToast(msg, type = 'info', duration = 4000) {
        if (typeof AnimationManager !== 'undefined' && typeof AnimationManager.showToast === 'function') {
            AnimationManager.showToast(msg, type, duration);
        } else {
            let toast = document.getElementById('adminFallbackToast');
            if (!toast) {
                toast = document.createElement('div');
                toast.id = 'adminFallbackToast';
                toast.style.cssText = 'position:fixed; bottom:24px; right:24px; z-index:999999; padding:12px 22px; border-radius:10px; font-weight:700; font-size:0.9rem; box-shadow:0 10px 30px rgba(0,0,0,0.5); transition:all 0.3s ease;';
                document.body.appendChild(toast);
            }
            toast.style.background = type === 'error' ? '#ff3b30' : type === 'warning' ? '#ff9500' : type === 'success' ? '#30d158' : '#00f0ff';
            toast.style.color = (type === 'success' || type === 'info') ? '#0a0a1a' : '#ffffff';
            toast.textContent = msg;
            toast.style.display = 'block';
            setTimeout(() => { if (toast) toast.style.display = 'none'; }, duration);
        }
    }


    // Automatic purge of previous dummy teams from browser storage
    const ROSTER_CLEAN_VERSION = 'v3_clean_400_teams_100';
    if (localStorage.getItem('ai-odyssey-clean-version') !== ROSTER_CLEAN_VERSION) {
        localStorage.setItem('ai-odyssey-local-users', JSON.stringify({}));
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

    // --- LOCAL STORAGE HELPERS ---
    function getLocalUsers() {
        try {
            return JSON.parse(localStorage.getItem('ai-odyssey-local-users')) || {};
        } catch(e) {
            return {};
        }
    }

    function saveLocalUsers(users) {
        localStorage.setItem('ai-odyssey-local-users', JSON.stringify(users));
    }

    // --- ADMIN SECURITY TOKEN & FETCH HELPERS ---
    function getAdminToken() {
        return sessionStorage.getItem('ai-odyssey-admin-token') || 'techodyssey_master_token_2026';
    }

    function adminFetch(url, options = {}) {
        const token = getAdminToken();
        const headers = options.headers ? { ...options.headers } : {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
            headers['x-admin-token'] = token;
        }
        return fetch(url, { ...options, headers });
    }

    // --- AUTHENTICATION GATE ---
    function checkAdminAuth() {
        const isAuthed = sessionStorage.getItem('ai-odyssey-admin-auth') === 'true';
        if (isAuthed) {
            if (adminGate) adminGate.style.display = 'none';
            if (adminMain) adminMain.style.display = 'block';
            initAdminDashboard();
        } else {
            if (adminGate) adminGate.style.display = 'flex';
            if (adminMain) adminMain.style.display = 'none';
        }
    }

    if (authForm) {
        authForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const user = (document.getElementById('adminUser').value || '').trim();
            const pass = (document.getElementById('adminPass').value || '').trim();

            const prefix = window.location.pathname.includes('/challenges/') ? '../../' : '';
            try {
                const res = await fetch(`${prefix}api/admin/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username: user, password: pass })
                });

                if (res.ok) {
                    sessionStorage.setItem('ai-odyssey-admin-token', 'techodyssey_master_token_2026');
                    sessionStorage.setItem('ai-odyssey-admin-auth', 'true');
                    localStorage.setItem('ai-odyssey-current-user', JSON.stringify({
                        username: 'ODYSSEY',
                        team: 'CRISIS LAB ADMIN',
                        members: ['ODYSSEY'],
                        role: 'admin',
                        status: 'approved'
                    }));
                    showToast('✅ Access Granted. Welcome, Administrator ODYSSEY!', 'success');
                    if (authMsg) authMsg.innerHTML = '';
                    checkAdminAuth();
                    return;
                } else {
                    const errData = await res.json().catch(() => ({}));
                    const msg = errData.message || errData.error || 'Access Denied: Incorrect Admin Username or Password!';
                    if (authMsg) {
                        authMsg.innerHTML = `<span style="color:var(--accent-danger, #ff3b30); font-weight:bold;">❌ ${msg}</span>`;
                    }
                    showToast(`❌ ${msg}`, 'error');
                    return;
                }
            } catch (err) {
                // Local fallback mode if server offline
                if (user.toUpperCase() === 'ODYSSEY' && pass === 'techodyssey') {
                    sessionStorage.setItem('ai-odyssey-admin-token', 'techodyssey_master_token_2026');
                    sessionStorage.setItem('ai-odyssey-admin-auth', 'true');
                    localStorage.setItem('ai-odyssey-current-user', JSON.stringify({
                        username: 'ODYSSEY',
                        team: 'CRISIS LAB ADMIN',
                        members: ['ODYSSEY'],
                        role: 'admin',
                        status: 'approved'
                    }));
                    showToast('✅ Access Granted (Local Fallback Mode)', 'success');
                    if (authMsg) authMsg.innerHTML = '';
                    checkAdminAuth();
                    return;
                }
                if (authMsg) {
                    authMsg.innerHTML = '<span style="color:var(--accent-danger, #ff3b30); font-weight:bold;">❌ Connection Error or Access Denied!</span>';
                }
                showToast('❌ Access Denied: Invalid Admin Credentials', 'error');
            }
        });
    }

    const logoutBtn = document.getElementById('adminLogoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            sessionStorage.removeItem('ai-odyssey-admin-auth');
            sessionStorage.removeItem('ai-odyssey-admin-token');
            localStorage.removeItem('ai-odyssey-current-user');
            showToast('🚪 Logged out of Admin Portal', 'info');
            checkAdminAuth();
        });
    }

    function bindActivateAllUsers() {
        const btn = document.getElementById('btnAdminActivateAllUsers');
        if (btn) {
            btn.onclick = () => {
                window.activateAllUsersAndTeams(true);
            };
        }
    }

    // --- INITIALIZATION ---
    function initAdminDashboard() {
        loadPointOverrides();
        initTabs();
        updateAdminStats();
        renderCredentialsHub();
        renderPendingTeams();
        renderTeamsTable();
        renderChallengesList();
        renderAuditLog();
        initSecurityShield();
        bindActivateAllUsers();
        bindTimerControls();
        bindBroadcastControls();
        bindFreezeLeaderboard();
        bindQuickAddTeam();
        bindSheetsImport();
        bindCategoryFilters();
        bindTeamTableControls();
        bindDataBackupRestore();
        bindModals();
        startAutoRefreshPolling();
    }

    let adminTeamsCache = { pending: [], active: [], rejected: [], deleted: [] };
    let adminArenaCache = { status: 'STOPPED', remainingSeconds: 5400 };
    let adminClientRevision = 0;

    async function syncServerUsers(isForced = false) {
        try {
            const prefix = window.location.pathname.includes('/challenges/') ? '../../' : '';
            const res = await adminFetch(`${prefix}api/admin/teams/all`, { cache: 'no-store' });
            if (res.ok) {
                const data = await res.json();
                const serverRev = data.revision || data.arena?.version || 1;

                if (data && data.teams) {
                    adminTeamsCache = data.teams;
                }
                if (data && data.arena) {
                    adminArenaCache = data.arena;
                    updateAdminArenaUI(data.arena);
                }

                if (isForced || serverRev !== adminClientRevision) {
                    updateAdminStats();
                    renderPendingTeams();
                    renderTeamsTable();
                    renderRemovedTeams();
                    renderCredentialsHub();
                    renderAdminScoreboard();

                    const revBadge = document.getElementById('adminLiveRevBadge');
                    if (revBadge) revBadge.textContent = `⚡ Server Rev #${serverRev}`;
                }

                adminClientRevision = serverRev;
                return;
            }
        } catch(e) {}
    }

    function updateAdminArenaUI(arena) {
        if (!arena) return;

        if (typeof TimerManager !== 'undefined' && typeof TimerManager.updateArenaDisplay === 'function') {
            TimerManager.updateArenaDisplay();
            return;
        }

        const badge = document.getElementById('adminTimerStatusBadge');
        const display = document.getElementById('adminHeaderTimerDisplay');

        if (display && arena.remainingSeconds !== undefined) {
            const rem = Math.max(0, arena.remainingSeconds);
            const h = String(Math.floor(rem / 3600)).padStart(2, '0');
            const m = String(Math.floor((rem % 3600) / 60)).padStart(2, '0');
            const s = String(rem % 60).padStart(2, '0');
            display.textContent = `⏱ ${h}:${m}:${s}`;
        }

        if (arena.status === 'STARTED') {
            if (badge) {
                badge.className = 'badge badge-easy';
                badge.style.cssText = 'font-size: 0.82rem; padding: 0.4rem 0.9rem; background: rgba(48,209,88,0.15); color: var(--accent-success); border: 1px solid var(--accent-success);';
                badge.textContent = '🟢 LIVE RUNNING';
            }
        } else if (arena.status === 'PAUSED') {
            if (badge) {
                badge.className = 'badge badge-medium';
                badge.style.cssText = 'font-size: 0.82rem; padding: 0.4rem 0.9rem; background: rgba(255,149,0,0.15); color: var(--accent-warning); border: 1px solid var(--accent-warning);';
                badge.textContent = '⏸️ PAUSED';
            }
        } else {
            if (badge) {
                badge.className = 'badge badge-hard';
                badge.style.cssText = 'font-size: 0.82rem; padding: 0.4rem 0.9rem; background: rgba(255,59,48,0.15); color: var(--accent-danger); border: 1px solid var(--accent-danger);';
                badge.textContent = '🔴 STOPPED';
            }
        }
    }

    // Auto-refresh stats, pending registrations, and live solves from LAN server every 2.5 seconds
    function startAutoRefreshPolling() {
        syncServerUsers(true);
        setInterval(async () => {
            if (sessionStorage.getItem('ai-odyssey-admin-auth') === 'true') {
                await syncServerUsers(false);
            }
        }, 2500);

        window.addEventListener('online', () => syncServerUsers(true));
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && sessionStorage.getItem('ai-odyssey-admin-auth') === 'true') {
                syncServerUsers(true);
            }
        });
    }

    // Load custom point overrides from storage
    function loadPointOverrides() {
        if (typeof ChallengesDB === 'undefined') return;
        try {
            const overrides = JSON.parse(localStorage.getItem('ai-odyssey-challenge-points-override')) || {};
            ChallengesDB.forEach(ch => {
                if (overrides[ch.id] !== undefined) {
                    ch.points = overrides[ch.id];
                }
            });
        } catch(e) {}
    }

    // --- TAB SWITCHING ---
    function initTabs() {
        const tabBtns = document.querySelectorAll('.admin-tab-btn');
        tabBtns.forEach(btn => {
            btn.onclick = () => {
                tabBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                const targetId = btn.getAttribute('data-tab');
                document.querySelectorAll('.admin-tab-content').forEach(content => {
                    content.style.display = 'none';
                });
                const targetContent = document.getElementById(targetId);
                if (targetContent) targetContent.style.display = 'block';

                if (targetId === 'tab-credentials') renderCredentialsHub();
                if (targetId === 'tab-scoreboard') renderAdminScoreboard();
                if (targetId === 'tab-audit') renderAuditLog();
                if (targetId === 'tab-security') {
                    if (typeof initSecurityShield === 'function') initSecurityShield();
                }
                if (targetId === 'tab-teams') {
                    renderPendingTeams();
                    renderTeamsTable();
                    renderRemovedTeams();
                }
                if (targetId === 'tab-challenges') {
                    renderChallengesList();
                }
            };
        });
    }

    // --- LIVE STATISTICS ---
    function updateAdminStats() {
        const active = adminTeamsCache.active || [];
        const pending = adminTeamsCache.pending || [];
        const deleted = adminTeamsCache.deleted || [];

        let totalTeams = active.length + pending.length;
        let approved = active.length;
        let pendingCount = pending.length;
        let totalSolves = 0;

        active.forEach(t => {
            totalSolves += (t.solvesCount || t.solved || 0);
        });

        const elTotal = document.getElementById('statTotalTeamsCount');
        const elApp = document.getElementById('statApprovedTeamsCount');
        const elPend = document.getElementById('statPendingTeamsCount');
        const elDQ = document.getElementById('statDQTeamsCount');
        const elSolves = document.getElementById('statArenaSolveCount');

        if (elTotal) elTotal.textContent = totalTeams;
        if (elApp) elApp.textContent = approved;
        if (elPend) elPend.textContent = pendingCount;
        if (elDQ) elDQ.textContent = deleted.length;
        if (elSolves) elSolves.textContent = totalSolves;
    }

    // --- PENDING TEAM APPROVALS ---
    function renderPendingTeams() {
        const tbody = document.getElementById('adminPendingTableBody');
        const countEl = document.getElementById('pendingCount');
        const card = document.getElementById('pendingApprovalsCard');
        if (!tbody) return;

        const pendingList = adminTeamsCache.pending || [];
        if (countEl) countEl.textContent = pendingList.length;
        if (card) card.style.display = 'block';

        tbody.innerHTML = '';
        if (pendingList.length === 0) {
            tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; color:var(--text-muted); padding:1.2rem;">🟢 No pending registrations. All teams are approved and active!</td></tr>`;
            return;
        }

        // If Auto-Approval is active, approve all pending teams immediately
        if (isAutoApprovalActive && pendingList.length > 0) {
            setTimeout(async () => {
                for (const t of pendingList) {
                    await window.approveTeam(t.team);
                }
            }, 100);
        }

        pendingList.forEach(t => {
            const tr = document.createElement('tr');
            const membersStr = Array.isArray(t.members) ? t.members.join(', ') : t.team;
            tr.innerHTML = `
                <td style="font-weight:700; color:var(--accent-warning);">${t.team}</td>
                <td style="font-size:0.85rem; color:var(--text-secondary);">${membersStr}</td>
                <td style="text-align:right;">
                    <button class="btn btn-primary btn-sm" onclick="approveTeam('${t.team}')">✅ Approve</button>
                    <button class="btn btn-danger btn-sm" onclick="rejectTeam('${t.team}')" style="margin-left:0.3rem;">❌ Reject</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    window.approveTeam = async (teamName) => {
        const prefix = window.location.pathname.includes('/challenges/') ? '../../' : '';
        try {
            const res = await adminFetch(`${prefix}api/admin/teams/approve`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ team: teamName })
            });
            if (res.ok) {
                await syncServerUsers();
                renderPendingTeams();
                renderTeamsTable();
                renderRemovedTeams();
                renderCredentialsHub();
                updateAdminStats();
                showToast(`✅ Team "${teamName}" has been APPROVED and activated!`, 'success');
            } else {
                const err = await res.json().catch(() => ({}));
                showToast(`❌ ${err.error || 'Failed to approve team'}`, 'error');
            }
        } catch(e) {
            showToast('❌ Network error while approving team', 'error');
        }
    };

    window.rejectTeam = async (teamName) => {
        if (!confirm(`Reject registration for team "${teamName}"?`)) return;
        const prefix = window.location.pathname.includes('/challenges/') ? '../../' : '';
        try {
            const res = await adminFetch(`${prefix}api/admin/teams/reject`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ team: teamName })
            });
            if (res.ok) {
                await syncServerUsers();
                renderPendingTeams();
                renderTeamsTable();
                renderRemovedTeams();
                renderCredentialsHub();
                updateAdminStats();
                showToast(`❌ Team "${teamName}" registration was rejected.`, 'info');
            } else {
                const err = await res.json().catch(() => ({}));
                showToast(`❌ ${err.error || 'Failed to reject team'}`, 'error');
            }
        } catch(e) {
            showToast('❌ Network error while rejecting team', 'error');
        }
    };

    // --- AUTO-APPROVAL ENGINE ---
    let isAutoApprovalActive = localStorage.getItem('ai-odyssey-auto-approval') === 'true';

    function updateAutoApprovalUI() {
        const btns = [
            document.getElementById('btnToggleAutoApproval'),
            document.getElementById('btnHeaderToggleAutoApproval')
        ];
        btns.forEach(btn => {
            if (!btn) return;
            const textEl = btn.querySelector('.auto-approval-text');
            const iconEl = btn.querySelector('.auto-approval-icon');
            if (isAutoApprovalActive) {
                btn.style.borderColor = 'var(--accent-success, #00ff88)';
                btn.style.color = 'var(--accent-success, #00ff88)';
                btn.style.background = 'rgba(0, 255, 136, 0.15)';
                if (textEl) textEl.textContent = 'Auto-Approval: ON';
                if (iconEl) iconEl.textContent = '⚡';
            } else {
                btn.style.borderColor = 'var(--accent-warning, #ff9500)';
                btn.style.color = 'var(--accent-warning, #ff9500)';
                btn.style.background = 'transparent';
                if (textEl) textEl.textContent = 'Auto-Approval: OFF';
                if (iconEl) iconEl.textContent = '⏸️';
            }
        });
    }

    async function toggleAutoApproval() {
        isAutoApprovalActive = !isAutoApprovalActive;
        localStorage.setItem('ai-odyssey-auto-approval', String(isAutoApprovalActive));
        updateAutoApprovalUI();

        const prefix = window.location.pathname.includes('/challenges/') ? '../../' : '';
        try {
            await adminFetch(`${prefix}api/admin/auto-approval`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ autoApproval: isAutoApprovalActive })
            });
        } catch (e) {}

        if (isAutoApprovalActive) {
            showToast('⚡ Auto-Approval ENABLED: Pending and incoming teams will be approved automatically!', 'success');
            const pendingList = adminTeamsCache.pending || [];
            if (pendingList.length > 0) {
                for (const t of pendingList) {
                    await window.approveTeam(t.team);
                }
            }
        } else {
            showToast('⏸️ Auto-Approval DISABLED: New registrations will require manual approval.', 'warning');
        }
    }

    const btnToggleAutoApp = document.getElementById('btnToggleAutoApproval');
    if (btnToggleAutoApp) btnToggleAutoApp.onclick = toggleAutoApproval;
    const btnHeaderToggleAutoApp = document.getElementById('btnHeaderToggleAutoApproval');
    if (btnHeaderToggleAutoApp) btnHeaderToggleAutoApp.onclick = toggleAutoApproval;

    // Fetch initial Auto-Approval status from server if available
    (async () => {
        const prefix = window.location.pathname.includes('/challenges/') ? '../../' : '';
        try {
            const res = await adminFetch(`${prefix}api/admin/auto-approval`);
            if (res.ok) {
                const data = await res.json();
                if (typeof data.autoApproval === 'boolean') {
                    isAutoApprovalActive = data.autoApproval;
                    localStorage.setItem('ai-odyssey-auto-approval', String(isAutoApprovalActive));
                }
            }
        } catch (e) {}
        updateAutoApprovalUI();
    })();

    const btnApproveAll = document.getElementById('btnApproveAllPending');
    if (btnApproveAll) {
        btnApproveAll.onclick = async () => {
            const pendingList = adminTeamsCache.pending || [];
            if (pendingList.length === 0) {
                showToast('No pending teams to approve.', 'info');
                return;
            }
            for (const t of pendingList) {
                await window.approveTeam(t.team);
            }
        };
    }

    // --- TEAMS TABLE FILTERS & SORTING ---
    function bindTeamTableControls() {
        const filters = [
            { id: 'btnFilterTeamAll', status: 'all' },
            { id: 'btnFilterTeamApproved', status: 'approved' },
            { id: 'btnFilterTeamPending', status: 'pending' },
            { id: 'btnFilterTeamDQ', status: 'disqualified' }
        ];

        filters.forEach(f => {
            const btn = document.getElementById(f.id);
            if (btn) {
                btn.onclick = () => {
                    filters.forEach(o => document.getElementById(o.id)?.classList.remove('active'));
                    btn.classList.add('active');
                    currentTeamStatusFilter = f.status;
                    renderTeamsTable();
                };
            }
        });

        const sortSelect = document.getElementById('adminTeamSortSelect');
        if (sortSelect) {
            sortSelect.onchange = (e) => {
                currentTeamSort = e.target.value;
                renderTeamsTable();
            };
        }

        const teamSearch = document.getElementById('adminTeamSearch');
        if (teamSearch) {
            teamSearch.addEventListener('input', () => renderTeamsTable());
        }

        const scoreboardSearch = document.getElementById('adminScoreboardSearch');
        if (scoreboardSearch) {
            scoreboardSearch.addEventListener('input', () => renderAdminScoreboard());
        }
    }

    // --- REGISTERED TEAMS TABLE & ACTIONS ---
    function renderTeamsTable() {
        const tbody = document.getElementById('adminTeamsTableBody');
        if (!tbody) return;

        // Consolidate teams across all caches and local storage
        const teamsMap = new Map();

        // 1. From Server/Admin Active Cache
        (adminTeamsCache.active || []).forEach(t => {
            const name = t.team || t.name;
            if (!name) return;
            const status = localStorage.getItem(`ai-odyssey-team-status-${name}`) || t.status || 'approved';
            teamsMap.set(name.toLowerCase(), {
                name,
                members: Array.isArray(t.members) ? t.members : [name],
                status: status === 'active' ? 'approved' : status,
                solved: t.solvesCount || 0,
                points: t.score || t.points || 0,
                lastSolve: t.lastSolveTime || null,
                password: t.password || ''
            });
        });

        // 2. From Server Pending Cache
        (adminTeamsCache.pending || []).forEach(t => {
            const name = t.team || t.name;
            if (!name) return;
            const key = name.toLowerCase();
            const status = localStorage.getItem(`ai-odyssey-team-status-${name}`) || 'pending';
            if (!teamsMap.has(key)) {
                teamsMap.set(key, {
                    name,
                    members: Array.isArray(t.members) ? t.members : [name],
                    status,
                    solved: 0,
                    points: 0,
                    lastSolve: null,
                    password: t.password || ''
                });
            }
        });

        // 3. From Server Deleted Cache
        (adminTeamsCache.deleted || []).forEach(t => {
            const name = t.team || t.name;
            if (!name) return;
            const key = name.toLowerCase();
            const status = localStorage.getItem(`ai-odyssey-team-status-${name}`) || 'deleted';
            if (!teamsMap.has(key)) {
                teamsMap.set(key, {
                    name,
                    members: Array.isArray(t.members) ? t.members : [name],
                    status,
                    solved: 0,
                    points: t.score || 0,
                    lastSolve: null,
                    password: t.password || ''
                });
            }
        });

        // 4. From LocalStorage Users (fallback/offline)
        const localUsers = getLocalUsers();
        Object.values(localUsers).forEach(u => {
            if (!u || !u.team) return;
            const name = u.team;
            const key = name.toLowerCase();
            const status = localStorage.getItem(`ai-odyssey-team-status-${name}`) || u.status || 'approved';

            let localPoints = 0;
            let localSolves = 0;
            let localLastSolve = null;
            try {
                const prog = JSON.parse(localStorage.getItem(`ai-odyssey-progress-team-${name}`) || '{}');
                const solvedKeys = Object.keys(prog).filter(k => k !== 'bonus' && (prog[k]?.solved || prog[k]?.status === 'solved'));
                localSolves = solvedKeys.length;
                if (prog['bonus']?.earnedPoints) localPoints += prog['bonus'].earnedPoints;
            } catch(e) {}

            if (!teamsMap.has(key)) {
                teamsMap.set(key, {
                    name,
                    members: Array.isArray(u.members) ? u.members : [u.username || name],
                    status: status === 'active' ? 'approved' : status,
                    solved: localSolves,
                    points: localPoints,
                    lastSolve: localLastSolve,
                    password: u.password || ''
                });
            } else {
                const existing = teamsMap.get(key);
                if (localPoints > existing.points) existing.points = localPoints;
                if (localSolves > existing.solved) existing.solved = localSolves;
            }
        });

        let list = Array.from(teamsMap.values());

        // Filter by Status Tab
        if (currentTeamStatusFilter === 'approved') {
            list = list.filter(t => t.status === 'approved');
        } else if (currentTeamStatusFilter === 'pending') {
            list = list.filter(t => t.status === 'pending');
        } else if (currentTeamStatusFilter === 'disqualified') {
            list = list.filter(t => t.status === 'disqualified' || t.status === 'rejected' || t.status === 'deleted');
        }

        // Filter by Search Query
        const query = (document.getElementById('adminTeamSearch')?.value || '').toLowerCase().trim();
        if (query) {
            list = list.filter(t => t.name.toLowerCase().includes(query) || (Array.isArray(t.members) && t.members.some(m => m.toLowerCase().includes(query))));
        }

        // Sort List
        list.sort((a, b) => {
            if (currentTeamSort === 'points-desc') return b.points - a.points;
            if (currentTeamSort === 'points-asc') return a.points - b.points;
            if (currentTeamSort === 'solves-desc') return b.solved - a.solved;
            if (currentTeamSort === 'name-asc') return a.name.localeCompare(b.name);
            return 0;
        });

        tbody.innerHTML = '';

        if (list.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:var(--text-muted); padding:1.2rem;">No teams match the selected filter criteria.</td></tr>`;
            return;
        }

        list.forEach(t => {
            const tr = document.createElement('tr');
            let statusBadge = `<span style="padding:2px 8px; border-radius:10px; font-size:0.75rem; font-weight:700; background:rgba(48,209,88,0.15); color:var(--accent-success); border:1px solid var(--accent-success);">🟢 Approved</span>`;
            if (t.status === 'pending') {
                statusBadge = `<span style="padding:2px 8px; border-radius:10px; font-size:0.75rem; font-weight:700; background:rgba(255,149,0,0.15); color:var(--accent-warning); border:1px solid var(--accent-warning);">⏳ Pending</span>`;
            } else if (t.status === 'disqualified' || t.status === 'rejected') {
                statusBadge = `<span style="padding:2px 8px; border-radius:10px; font-size:0.75rem; font-weight:700; background:rgba(255,59,48,0.15); color:var(--accent-danger); border:1px solid var(--accent-danger);">🔴 Disqualified</span>`;
            } else if (t.status === 'deleted') {
                statusBadge = `<span style="padding:2px 8px; border-radius:10px; font-size:0.75rem; font-weight:700; background:rgba(255,59,48,0.1); color:var(--text-muted); border:1px solid rgba(255,255,255,0.2);">🗑️ Deleted</span>`;
            }

            let actionBtns = `
                <button class="btn btn-secondary btn-sm" onclick="window.inspectTeam(decodeURIComponent('${encodeURIComponent(t.name)}'))" title="Inspect Team Scorecard">🔍 Scorecard</button>
                <button class="btn btn-secondary btn-sm" onclick="window.openEditTeamModal('${t.name}')" style="margin-left:0.2rem;" title="Edit Team & Password">✏️ Edit</button>
                <button class="btn btn-secondary btn-sm" onclick="window.openAdjustScoreModal('${t.name}')" style="margin-left:0.2rem;" title="Adjust Score">⚡ Points</button>
            `;

            if (t.status === 'approved') {
                actionBtns += `<button class="btn btn-secondary btn-sm" onclick="window.disqualifyTeam('${t.name}')" style="margin-left:0.2rem; color:var(--accent-warning); border-color:var(--accent-warning);" title="Disqualify Team">🚫 Disqualify</button>`;
            } else if (t.status === 'disqualified' || t.status === 'rejected' || t.status === 'deleted') {
                actionBtns += `<button class="btn btn-primary btn-sm" onclick="window.restoreTeam('${t.name}')" style="margin-left:0.2rem;" title="Restore Team">🔄 Restore</button>`;
            } else if (t.status === 'pending') {
                actionBtns += `<button class="btn btn-primary btn-sm" onclick="window.approveTeam('${t.name}')" style="margin-left:0.2rem;" title="Approve Team">✅ Approve</button>`;
            }

            if (t.status === 'deleted') {
                actionBtns += `<button class="btn btn-danger btn-sm" onclick="window.permanentDeleteSingleTeam('${t.name}')" style="margin-left:0.2rem; background:rgba(255,59,48,0.25); border-color:#ff3b30; color:#ff453a;" title="Permanently Delete Team">🗑️ Delete Perm</button>`;
            } else {
                actionBtns += `<button class="btn btn-danger btn-sm" onclick="window.deleteSingleTeam('${t.name}')" style="margin-left:0.2rem; background:rgba(255,59,48,0.2); border-color:#ff3b30;" title="Move to Trash / Removed Teams">🗑️ Delete</button>`;
            }

            tr.innerHTML = `
                <td style="font-weight:700; color:var(--accent-primary);">
                    ${t.name}
                </td>
                <td>${statusBadge}</td>
                <td style="font-size:0.8rem; color:var(--text-secondary); max-width:220px;">${Array.isArray(t.members) ? t.members.join(', ') : t.members}</td>
                <td style="text-align:center; font-weight:600;">${t.solved}</td>
                <td style="text-align:right; font-weight:800; color:var(--accent-success);">${t.points.toLocaleString()} pts</td>
                <td style="text-align:center; font-size:0.8rem; color:var(--text-muted);">${t.lastSolve ? new Date(t.lastSolve).toLocaleTimeString() : '-'}</td>
                <td style="text-align:right; white-space:nowrap;">
                    ${actionBtns}
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    // --- REMOVED TEAMS TABLE ---
    function renderRemovedTeams() {
        const tbody = document.getElementById('adminRemovedTableBody');
        const countEl = document.getElementById('removedCount');
        const btnEmptyTrash = document.getElementById('btnEmptyTrash');
        if (!tbody) return;

        const removedList = adminTeamsCache.deleted || [];
        if (countEl) countEl.textContent = removedList.length;

        if (btnEmptyTrash) {
            btnEmptyTrash.style.display = removedList.length > 0 ? 'inline-flex' : 'none';
            btnEmptyTrash.innerHTML = `<span>🗑️</span> Empty Trash (${removedList.length} Team${removedList.length === 1 ? '' : 's'})`;
        }

        tbody.innerHTML = '';
        if (removedList.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:var(--text-muted); padding:1rem;">Trash is empty. No deleted teams.</td></tr>`;
            return;
        }

        removedList.forEach(t => {
            const tr = document.createElement('tr');
            const teamName = t.team || t.name || '';
            const safeName = teamName.replace(/"/g, '&quot;').replace(/'/g, "\\'");
            const membersStr = Array.isArray(t.members) ? t.members.join(', ') : (t.team || '');
            tr.innerHTML = `
                <td style="font-weight:700; text-decoration:line-through; color:var(--accent-danger);">${teamName}</td>
                <td style="font-size:0.8rem; color:var(--text-muted);">${membersStr}</td>
                <td style="color:var(--text-muted);">${(t.score || 0).toLocaleString()} pts</td>
                <td style="text-align:right; white-space:nowrap;">
                    <div style="display:inline-flex; gap:0.4rem; justify-content:flex-end;">
                        <button class="btn btn-primary btn-sm" onclick="window.restoreTeam('${safeName}')" title="Restore team back to active competition">🔄 Restore</button>
                        <button class="btn btn-danger btn-sm" onclick="window.permanentDeleteSingleTeam('${safeName}')" style="background:rgba(255,59,48,0.2); border:1px solid #ff3b30; color:#ff453a;" title="Permanently delete this team from server">🗑️ Permanently Delete</button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    // Helper to clean team from local storage
    function cleanTeamFromLocalStorage(teamName) {
        if (!teamName) return;
        localStorage.removeItem(`ai-odyssey-team-status-${teamName}`);
        localStorage.removeItem(`ai-odyssey-progress-team-${teamName}`);
        localStorage.removeItem(`ai-odyssey-arena-started-${teamName}`);
        localStorage.removeItem(`ai-odyssey-arena-end-${teamName}`);

        const users = getLocalUsers();
        let changed = false;
        Object.keys(users).forEach(k => {
            if (users[k] && users[k].team && users[k].team.toLowerCase() === teamName.toLowerCase()) {
                delete users[k];
                changed = true;
            }
        });
        if (changed) {
            saveLocalUsers(users);
        }
    }

    // --- EMPTY TRASH (PERMANENTLY DELETE ALL DELETED TEAMS) ---
    window.emptyTrash = async () => {
        const removedList = adminTeamsCache.deleted || [];
        if (removedList.length === 0) {
            showToast('Trash is already empty.', 'info');
            return;
        }

        if (!confirm(`⚠️ PERMANENT DELETION: Are you sure you want to PERMANENTLY DELETE ALL ${removedList.length} removed team(s)?\n\nThis will permanently erase their credentials, scores, and records from the database. This action CANNOT be undone.`)) {
            return;
        }

        const prefix = window.location.pathname.includes('/challenges/') ? '../../' : '';
        try {
            const res = await adminFetch(`${prefix}api/admin/teams/purge-deleted`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            const data = await res.json();
            if (!res.ok) {
                showToast(data.error || 'Failed to empty trash', 'error');
                return;
            }
        } catch(e) {
            console.error('Error emptying trash:', e);
        }

        // Clean local storage for all deleted teams
        removedList.forEach(t => {
            const name = t.team || t.name;
            if (name) {
                cleanTeamFromLocalStorage(name);
            }
        });

        // Also clean any leftover deleted status flags in localStorage
        for (let i = localStorage.length - 1; i >= 0; i--) {
            const key = localStorage.key(i);
            if (key && key.startsWith('ai-odyssey-team-status-')) {
                if (localStorage.getItem(key) === 'deleted') {
                    localStorage.removeItem(key);
                }
            }
        }

        await syncServerUsers(true);
        renderPendingTeams();
        renderTeamsTable();
        renderRemovedTeams();
        renderCredentialsHub();
        renderAdminScoreboard();
        updateAdminStats();
        showToast(`🗑️ All ${removedList.length} deleted team(s) have been PERMANENTLY deleted.`, 'error', 5000);
    };

    // --- PERMANENTLY DELETE SINGLE TEAM ---
    window.permanentDeleteSingleTeam = async (teamName) => {
        if (!confirm(`⚠️ PERMANENT DELETE: Are you sure you want to PERMANENTLY DELETE team "${teamName}"?\n\nTheir scores and accounts will be completely wiped from the database. This action CANNOT be undone.`)) {
            return;
        }

        const prefix = window.location.pathname.includes('/challenges/') ? '../../' : '';
        try {
            const res = await adminFetch(`${prefix}api/admin/teams/permanent-delete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ team: teamName })
            });
            const data = await res.json();
            if (!res.ok) {
                showToast(data.error || 'Failed to permanently delete team', 'error');
                return;
            }
        } catch(e) {
            console.error('Error permanently deleting team:', e);
        }

        cleanTeamFromLocalStorage(teamName);

        await syncServerUsers(true);
        renderPendingTeams();
        renderTeamsTable();
        renderRemovedTeams();
        renderCredentialsHub();
        renderAdminScoreboard();
        updateAdminStats();
        showToast(`🗑️ Team "${teamName}" has been PERMANENTLY deleted.`, 'error', 4000);
    };

    // --- DISQUALIFY TEAM ---
    window.disqualifyTeam = async (teamName) => {
        if (!confirm(`🚨 DISQUALIFY: Are you sure you want to DISQUALIFY team "${teamName}"? Active members will be locked out immediately.`)) return;

        localStorage.setItem(`ai-odyssey-team-status-${teamName}`, 'disqualified');
        const users = getLocalUsers();
        Object.keys(users).forEach(k => {
            if (users[k].team && users[k].team.toLowerCase() === teamName.toLowerCase()) {
                users[k].status = 'disqualified';
            }
        });
        saveLocalUsers(users);

        const prefix = window.location.pathname.includes('/challenges/') ? '../../' : '';
        try {
            await adminFetch(`${prefix}api/admin/teams/reject`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ team: teamName })
            });
        } catch(e) {}

        await syncServerUsers();
        renderTeamsTable();
        renderPendingTeams();
        renderCredentialsHub();
        renderAdminScoreboard();
        updateAdminStats();
        showToast(`🚫 Team "${teamName}" has been DISQUALIFIED.`, 'error', 5000);
    };

    // --- RESTORE TEAM ---
    window.restoreTeam = async (teamName) => {
        localStorage.setItem(`ai-odyssey-team-status-${teamName}`, 'approved');
        const users = getLocalUsers();
        Object.keys(users).forEach(k => {
            if (users[k].team && users[k].team.toLowerCase() === teamName.toLowerCase()) {
                users[k].status = 'approved';
            }
        });
        saveLocalUsers(users);

        const prefix = window.location.pathname.includes('/challenges/') ? '../../' : '';
        try {
            await adminFetch(`${prefix}api/admin/teams/restore`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ team: teamName })
            });
        } catch(e) {}

        await syncServerUsers();
        renderPendingTeams();
        renderTeamsTable();
        renderRemovedTeams();
        renderCredentialsHub();
        renderAdminScoreboard();
        updateAdminStats();
        showToast(`🔄 Team "${teamName}" has been RESTORED and approved!`, 'success');
    };

    // --- DELETE TEAM (MOVE TO REMOVED TEAMS / TRASH) ---
    window.deleteSingleTeam = async (teamName) => {
        if (!confirm(`⚠️ DELETE TEAM: Are you sure you want to remove team "${teamName}"? It will be moved to Removed Teams.`)) return;

        localStorage.setItem(`ai-odyssey-team-status-${teamName}`, 'deleted');
        const prefix = window.location.pathname.includes('/challenges/') ? '../../' : '';
        try {
            await adminFetch(`${prefix}api/admin/teams/delete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ team: teamName })
            });
        } catch(e) {}

        await syncServerUsers();
        renderPendingTeams();
        renderTeamsTable();
        renderRemovedTeams();
        renderCredentialsHub();
        renderAdminScoreboard();
        updateAdminStats();
        showToast(`🗑️ Team "${teamName}" has been moved to Removed Teams.`, 'error');
    };

    // --- DYNAMIC EXTRA TEAM MEMBERS & PASSWORD IN EDIT MODAL ---
    window.addExtraMemberInput = (val = '') => {
        const container = document.getElementById('editMembersContainer');
        if (!container) return;

        const rowCount = container.querySelectorAll('.edit-member-row').length + 1;
        const row = document.createElement('div');
        row.className = 'edit-member-row';
        row.style.cssText = 'display: flex; gap: 0.5rem; align-items: center;';
        row.innerHTML = `
            <span style="font-size: 0.75rem; color: var(--text-muted); width: 68px; font-weight: 600;">Member ${rowCount}:</span>
            <input type="text" class="admin-gate-input edit-member-input" value="${val.replace(/"/g, '&quot;')}" placeholder="Member Name" required style="flex: 1; padding: 0.4rem 0.75rem; font-size: 0.85rem;">
            <button type="button" class="btn btn-danger btn-sm" onclick="this.parentElement.remove(); window.renumberMemberRows();" style="padding: 2px 7px; font-size: 0.75rem; background: rgba(255,59,48,0.2); border-color: #ff3b30;" title="Remove Member">✕</button>
        `;
        container.appendChild(row);
    };

    window.renumberMemberRows = () => {
        const container = document.getElementById('editMembersContainer');
        if (!container) return;
        container.querySelectorAll('.edit-member-row').forEach((row, i) => {
            const span = row.querySelector('span');
            if (span) span.textContent = `Member ${i + 1}:`;
        });
    };

    window.generateRandomTeamPassword = () => {
        const prefixes = ['cyber', 'nexus', 'matrix', 'quantum', 'debug', 'odyssey', 'crypto', 'shadow', 'arena'];
        const p = prefixes[Math.floor(Math.random() * prefixes.length)];
        const num = Math.floor(100 + Math.random() * 900);
        const newPass = `${p}${num}`;
        const input = document.getElementById('editPassword');
        if (input) {
            input.value = newPass;
            showToast(`🎲 Generated new password: ${newPass}`, 'info');
        }
    };

    window.copyEditPassword = () => {
        const input = document.getElementById('editPassword');
        if (!input || !input.value) return;
        navigator.clipboard.writeText(input.value).then(() => {
            showToast('📋 Team password copied to clipboard!', 'success');
        }).catch(() => {
            input.select();
            document.execCommand('copy');
            showToast('📋 Team password copied to clipboard!', 'success');
        });
    };

    // --- OPEN EDIT TEAM MODAL ---
    window.openEditTeamModal = (teamName) => {
        const modal = document.getElementById('editTeamModal');
        const container = document.getElementById('editMembersContainer');
        if (!modal || !container) return;

        // Search active, pending, deleted, and local users
        const allTeams = [...(adminTeamsCache.active || []), ...(adminTeamsCache.pending || []), ...(adminTeamsCache.deleted || [])];
        let t = allTeams.find(item => (item.team || item.name || '').toLowerCase() === teamName.toLowerCase());

        if (!t) {
            const localUsers = getLocalUsers();
            const u = Object.values(localUsers).find(x => x.team && x.team.toLowerCase() === teamName.toLowerCase());
            if (u) {
                t = { team: u.team, password: u.password, members: u.members || [u.username] };
            }
        }

        if (!t) {
            t = { team: teamName, password: 'password123', members: [teamName] };
        }

        document.getElementById('editOriginalTeamName').value = t.team || teamName;
        document.getElementById('editTeamName').value = t.team || teamName;
        document.getElementById('editPassword').value = t.password || '';

        // Clear and populate all existing members
        container.innerHTML = '';
        const membersList = (Array.isArray(t.members) && t.members.length > 0) ? t.members : [t.team || teamName];
        membersList.forEach(m => {
            if (m && String(m).trim()) {
                window.addExtraMemberInput(String(m).trim());
            }
        });

        // Ensure at least 1 member input row exists
        if (container.querySelectorAll('.edit-member-row').length === 0) {
            window.addExtraMemberInput(t.team || teamName);
        }

        modal.style.display = 'flex';
    };

    // --- OPEN ADJUST SCORE MODAL ---
    window.openAdjustScoreModal = (teamName) => {
        const modal = document.getElementById('adjustScoreModal');
        if (!modal) return;

        const allTeams = [...(adminTeamsCache.active || []), ...(adminTeamsCache.pending || [])];
        const t = allTeams.find(x => (x.team || x.name || '').toLowerCase() === teamName.toLowerCase());
        const pts = t ? (t.score || t.points || 0) : 0;

        document.getElementById('scoreTargetTeam').value = teamName;
        document.getElementById('scoreTargetTeamLabel').textContent = `Target Team: ${teamName} (Current Points: ${pts} pts)`;
        document.getElementById('scorePointsDelta').value = '50';

        modal.style.display = 'flex';
    };

    function bindModals() {
        const editForm = document.getElementById('editTeamForm');
        if (editForm) {
            editForm.onsubmit = async (e) => {
                e.preventDefault();
                const oldTeam = document.getElementById('editOriginalTeamName').value.trim();
                const newTeam = document.getElementById('editTeamName').value.trim();
                const password = document.getElementById('editPassword').value.trim();

                // Collect all member inputs
                const memberInputs = document.querySelectorAll('.edit-member-input');
                const members = [];
                memberInputs.forEach(inp => {
                    const v = inp.value.trim();
                    if (v && !members.includes(v)) {
                        members.push(v);
                    }
                });

                if (members.length === 0) {
                    members.push(newTeam);
                }

                // Update LocalStorage
                const localUsers = getLocalUsers();
                const oldKey = oldTeam.toLowerCase();
                const newKey = newTeam.toLowerCase();

                // Delete old keys if renamed
                if (oldKey !== newKey) {
                    Object.keys(localUsers).forEach(k => {
                        if (localUsers[k].team && localUsers[k].team.toLowerCase() === oldKey) {
                            delete localUsers[k];
                        }
                    });
                    const oldProg = localStorage.getItem(`ai-odyssey-progress-team-${oldTeam}`);
                    if (oldProg) {
                        localStorage.setItem(`ai-odyssey-progress-team-${newTeam}`, oldProg);
                        localStorage.removeItem(`ai-odyssey-progress-team-${oldTeam}`);
                    }
                    const oldStatus = localStorage.getItem(`ai-odyssey-team-status-${oldTeam}`);
                    if (oldStatus) {
                        localStorage.setItem(`ai-odyssey-team-status-${newTeam}`, oldStatus);
                        localStorage.removeItem(`ai-odyssey-team-status-${oldTeam}`);
                    }
                }

                // Primary team account
                localUsers[newKey] = { username: members[0], team: newTeam, password, members, role: 'player', status: 'approved' };
                // Every extra member account
                members.forEach(m => {
                    const safeM = m.toLowerCase().replace(/[^a-z0-9_]/g, '');
                    localUsers[`${newKey}_${safeM}`] = {
                        username: m,
                        team: newTeam,
                        password,
                        members,
                        role: 'player',
                        status: 'approved'
                    };
                });
                saveLocalUsers(localUsers);

                const prefix = window.location.pathname.includes('/challenges/') ? '../../' : '';
                try {
                    await adminFetch(`${prefix}api/admin/teams/edit`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ oldTeam, newTeam, password, members })
                    });
                } catch(err) {}

                document.getElementById('editTeamModal').style.display = 'none';
                await syncServerUsers();
                renderTeamsTable();
                renderCredentialsHub();
                renderAdminScoreboard();
                updateAdminStats();
                showToast(`💾 Team "${newTeam}" (${members.length} members) password & details updated!`, 'success');
            };
        }

        const scoreForm = document.getElementById('adjustScoreForm');
        if (scoreForm) {
            scoreForm.onsubmit = async (e) => {
                e.preventDefault();
                const team = document.getElementById('scoreTargetTeam').value.trim();
                const delta = parseInt(document.getElementById('scorePointsDelta').value, 10);
                if (isNaN(delta)) return;

                // Update LocalStorage progress
                const key = `ai-odyssey-progress-team-${team}`;
                try {
                    const prog = JSON.parse(localStorage.getItem(key) || '{}');
                    prog['bonus'] = prog['bonus'] || { solved: true, earnedPoints: 0, time: new Date().toISOString() };
                    prog['bonus'].earnedPoints = (prog['bonus'].earnedPoints || 0) + delta;
                    prog['bonus'].time = new Date().toISOString();
                    localStorage.setItem(key, JSON.stringify(prog));
                } catch(e) {}

                const prefix = window.location.pathname.includes('/challenges/') ? '../../' : '';
                try {
                    await adminFetch(`${prefix}api/admin/teams/score`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ team, delta })
                    });
                } catch(err) {}

                document.getElementById('adjustScoreModal').style.display = 'none';
                await syncServerUsers();
                renderTeamsTable();
                renderAdminScoreboard();
                updateAdminStats();
                showToast(`⚡ Score updated by ${delta > 0 ? '+' : ''}${delta} pts for team "${team}"`, 'success');
            };
        }
    }

    function escapeHtml(str) {
        if (str === null || str === undefined) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    let currentInspectingTeam = null;

    // --- TEAM INSPECTION & SCORECARD MODAL ---
    window.inspectTeam = async (teamName) => {
        const modal = document.getElementById('inspectTeamModal');
        const titleEl = document.getElementById('inspectModalTeamTitle');
        const subEl = document.getElementById('inspectModalTeamSub');
        const bodyEl = document.getElementById('inspectModalBody');
        const btnRefresh = document.getElementById('btnInspectModalRefresh');
        if (!modal || !bodyEl) return;

        currentInspectingTeam = teamName;
        modal.style.display = 'flex';

        if (btnRefresh) {
            btnRefresh.onclick = () => window.inspectTeam(currentInspectingTeam);
        }

        // Show immediate skeleton while loading
        titleEl.innerHTML = `🔍 Team Scorecard: <span style="color:#fff;">${escapeHtml(teamName)}</span>`;
        subEl.textContent = `Fetching live participant telemetry...`;
        bodyEl.innerHTML = `
            <div style="text-align:center; padding:3rem 1rem; color:var(--text-muted);">
                <div class="spinner" style="width:36px; height:36px; border:3px solid rgba(0,240,255,0.2); border-top-color:var(--accent-primary); border-radius:50%; margin:0 auto 1rem; animation:spin 0.8s linear infinite;"></div>
                <div style="font-size:0.95rem; color:#fff; font-weight:700;">Loading Team Scorecard...</div>
                <div style="font-size:0.8rem; color:var(--text-secondary); margin-top:0.25rem;">Querying solves, bonus points & member contributions</div>
            </div>
        `;

        // 1. Gather local/cached data as baseline
        const allTeams = [...(adminTeamsCache.active || []), ...(adminTeamsCache.pending || []), ...(adminTeamsCache.deleted || [])];
        const teamObj = allTeams.find(t => (t.team || t.name || '').toLowerCase() === teamName.toLowerCase()) || {};
        
        let teamMembers = Array.isArray(teamObj.members) && teamObj.members.length > 0 ? teamObj.members : [];
        if (teamMembers.length === 0) {
            const localUsers = getLocalUsers();
            Object.values(localUsers).forEach(u => {
                if (u.team && u.team.toLowerCase() === teamName.toLowerCase() && u.members) {
                    teamMembers = u.members;
                }
            });
        }
        if (teamMembers.length === 0) teamMembers = [teamName];

        let teamStatus = localStorage.getItem(`ai-odyssey-team-status-${teamName}`) || teamObj.status || 'approved';
        let serverSolves = teamObj.solves || {};
        let localSolves = {};
        try {
            const localRaw = localStorage.getItem(`ai-odyssey-progress-team-${teamName}`);
            if (localRaw) localSolves = JSON.parse(localRaw);
        } catch(e) {}

        // 2. Query Authoritative Backend API
        let authoritativeData = null;
        try {
            const prefix = window.location.pathname.includes('/challenges/') ? '../../' : '';
            const res = await adminFetch(`${prefix}api/admin/team/inspect?team=${encodeURIComponent(teamName)}`, { cache: 'no-store' });
            if (res.ok) {
                authoritativeData = await res.json();
            }
        } catch (e) {
            console.warn('Could not fetch server scorecard, falling back to local cache:', e);
        }

        // If another team was opened while fetching, discard stale response
        if (currentInspectingTeam !== teamName) return;

        // 3. Merge data
        let solvesMap = { ...localSolves, ...serverSolves };
        if (authoritativeData && authoritativeData.solves) {
            solvesMap = { ...solvesMap, ...authoritativeData.solves };
        }

        if (authoritativeData && authoritativeData.members && authoritativeData.members.length > 0) {
            teamMembers = authoritativeData.members;
        }
        if (authoritativeData && authoritativeData.status) {
            teamStatus = authoritativeData.status;
        }

        const bonusPoints = (authoritativeData && authoritativeData.bonusPoints !== undefined) 
            ? authoritativeData.bonusPoints 
            : (teamObj.bonusPoints || solvesMap['bonus']?.earnedPoints || 0);

        // 4. Build solved list
        let solvedList = [];
        let totalSolvePts = 0;
        let easyCount = 0;
        let medCount = 0;
        let hardCount = 0;
        let bossCount = 0;
        const memberContributionMap = {};

        teamMembers.forEach(m => { memberContributionMap[m] = { solves: 0, points: 0 }; });

        if (authoritativeData && Array.isArray(authoritativeData.solvedChallenges) && authoritativeData.solvedChallenges.length > 0) {
            solvedList = authoritativeData.solvedChallenges;
            solvedList.forEach(s => {
                totalSolvePts += (s.points || 50);
                if (s.difficulty === 'easy') easyCount++;
                else if (s.difficulty === 'medium') medCount++;
                else if (s.difficulty === 'hard') hardCount++;
                else if (s.difficulty === 'boss' || s.id === 66) bossCount++;

                const solver = s.solvedBy || teamMembers[0] || 'Team';
                if (!memberContributionMap[solver]) memberContributionMap[solver] = { solves: 0, points: 0 };
                memberContributionMap[solver].solves++;
                memberContributionMap[solver].points += (s.points || 50);
            });
        } else {
            // Build from ChallengesDB
            const allSolvedIds = Object.keys(solvesMap).filter(k => k !== 'bonus' && (solvesMap[k]?.solved || solvesMap[k]?.status === 'solved')).map(Number);
            
            allSolvedIds.forEach(id => {
                const p = solvesMap[id] || solvesMap[String(id)] || {};
                const ch = typeof ChallengesDB !== 'undefined' ? ChallengesDB.find(c => c.id === id) : null;
                const pts = p.pointsAwarded || p.earnedPoints || (ch ? ch.points : 50);
                const diff = ch ? ch.difficulty : (id === 66 ? 'boss' : 'medium');
                const cat = ch ? ch.category : 'General';
                const title = ch ? ch.title : `Challenge #${id}`;
                const solver = p.solvedBy || teamMembers[0] || 'Team';

                totalSolvePts += pts;
                if (diff === 'easy') easyCount++;
                else if (diff === 'medium') medCount++;
                else if (diff === 'hard') hardCount++;
                else if (diff === 'boss' || id === 66) bossCount++;

                if (!memberContributionMap[solver]) memberContributionMap[solver] = { solves: 0, points: 0 };
                memberContributionMap[solver].solves++;
                memberContributionMap[solver].points += pts;

                solvedList.push({
                    id: id,
                    title: title,
                    category: cat,
                    difficulty: diff,
                    points: pts,
                    hintsUsed: p.hintsUsed || 0,
                    attempts: p.attempts || 1,
                    solvedBy: solver,
                    time: p.time ? new Date(p.time).toLocaleTimeString() : 'N/A'
                });
            });

            solvedList.sort((a, b) => a.id - b.id);
        }

        const totalPoints = totalSolvePts + bonusPoints;
        const totalSolvesCount = solvedList.length;

        // Update Header
        let statusBadge = `<span style="padding:2px 8px; border-radius:10px; font-size:0.75rem; font-weight:700; background:rgba(48,209,88,0.15); color:var(--accent-success); border:1px solid var(--accent-success);">🟢 APPROVED</span>`;
        if (teamStatus === 'pending') {
            statusBadge = `<span style="padding:2px 8px; border-radius:10px; font-size:0.75rem; font-weight:700; background:rgba(255,149,0,0.15); color:var(--accent-warning); border:1px solid var(--accent-warning);">⏳ PENDING</span>`;
        } else if (teamStatus === 'disqualified' || teamStatus === 'rejected') {
            statusBadge = `<span style="padding:2px 8px; border-radius:10px; font-size:0.75rem; font-weight:700; background:rgba(255,59,48,0.15); color:var(--accent-danger); border:1px solid var(--accent-danger);">🔴 DISQUALIFIED</span>`;
        }

        titleEl.innerHTML = `🔍 Scorecard: <span style="color:#fff;">${escapeHtml(teamName)}</span> ${statusBadge}`;
        subEl.innerHTML = `👥 <strong>Registered Members:</strong> ${escapeHtml(teamMembers.join(', '))}`;

        // Build Member Contribution Badges
        const memberEntries = Object.entries(memberContributionMap);
        let membersContributionHtml = '';
        if (memberEntries.length > 0) {
            membersContributionHtml = memberEntries.map(([mName, stats]) => {
                return `
                    <div style="background:rgba(255,255,255,0.04); border:1px solid rgba(0,240,255,0.2); border-radius:8px; padding:0.4rem 0.75rem; display:flex; align-items:center; justify-content:space-between; gap:0.5rem;">
                        <span style="font-weight:700; color:#fff; font-size:0.85rem;">👤 ${escapeHtml(mName)}</span>
                        <div style="display:flex; gap:0.4rem; align-items:center;">
                            <span style="font-size:0.75rem; color:var(--accent-primary); font-weight:700;">${stats.solves} solves</span>
                            <span style="font-size:0.75rem; color:var(--accent-success); font-weight:800;">(+${stats.points} pts)</span>
                        </div>
                    </div>
                `;
            }).join('');
        }

        // Render HTML Body
        let html = `
            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(135px, 1fr)); gap:0.75rem; margin-bottom:1.25rem;">
                <div class="glass" style="padding:0.85rem; text-align:center; border-radius:10px; border:1px solid rgba(0,240,255,0.25);">
                    <div style="font-size:0.72rem; color:var(--text-muted); text-transform:uppercase; font-weight:700;">Total Solves</div>
                    <div style="font-size:1.6rem; font-weight:900; color:var(--accent-primary); margin-top:0.2rem;">${totalSolvesCount}</div>
                </div>
                <div class="glass" style="padding:0.85rem; text-align:center; border-radius:10px; border:1px solid rgba(255,215,0,0.3); background:rgba(255,215,0,0.04);">
                    <div style="font-size:0.72rem; color:var(--text-muted); text-transform:uppercase; font-weight:700;">Total Points</div>
                    <div style="font-size:1.6rem; font-weight:900; color:#ffd700; margin-top:0.2rem;">${totalPoints.toLocaleString()} pts</div>
                </div>
                <div class="glass" style="padding:0.85rem; text-align:center; border-radius:10px; border:1px solid rgba(48,209,88,0.25);">
                    <div style="font-size:0.72rem; color:var(--text-muted); text-transform:uppercase; font-weight:700;">Difficulty Split</div>
                    <div style="font-size:0.82rem; font-weight:700; margin-top:0.4rem; display:flex; justify-content:center; gap:0.35rem; flex-wrap:wrap;">
                        <span style="color:var(--accent-success);">🟢 ${easyCount}</span>
                        <span style="color:var(--accent-warning);">🟡 ${medCount}</span>
                        <span style="color:var(--accent-danger);">🔴 ${hardCount}</span>
                        <span style="color:#ff007f;">👑 ${bossCount}</span>
                    </div>
                </div>
                <div class="glass" style="padding:0.85rem; text-align:center; border-radius:10px; border:1px solid rgba(255,149,0,0.25);">
                    <div style="font-size:0.72rem; color:var(--text-muted); text-transform:uppercase; font-weight:700;">Manual Bonus</div>
                    <div style="font-size:1.6rem; font-weight:900; color:var(--accent-warning); margin-top:0.2rem;">+${bonusPoints} pts</div>
                </div>
            </div>

            <div style="margin-bottom:1.25rem;">
                <div style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase; font-weight:800; margin-bottom:0.4rem; letter-spacing:0.5px;">
                    👥 Member Solve Breakdown
                </div>
                <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:0.5rem;">
                    ${membersContributionHtml}
                </div>
            </div>

            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.6rem;">
                <h4 style="margin:0; color:var(--accent-primary); font-size:1rem; display:flex; align-items:center; gap:0.4rem;">
                    <span>⚡</span> Solved Challenges Log (${solvedList.length})
                </h4>
                <span style="font-size:0.75rem; color:var(--text-muted);">Real-time server telemetry</span>
            </div>
        `;

        if (solvedList.length === 0) {
            html += `
                <div class="glass" style="text-align:center; padding:2.5rem 1rem; border-radius:10px; border:1px dashed rgba(255,255,255,0.15);">
                    <span style="font-size:2.2rem; display:block; margin-bottom:0.5rem;">🎯</span>
                    <h4 style="margin:0 0 0.4rem; color:#fff;">No Solved Challenges Yet</h4>
                    <p style="margin:0 0 1rem; color:var(--text-secondary); font-size:0.85rem; max-width:400px; margin-left:auto; margin-right:auto;">
                        This team has not submitted any correct challenge flags yet. Solves will appear live here in real-time as participants crack challenges!
                    </p>
                    <button class="btn btn-secondary btn-sm" onclick="window.openAdjustScoreModal('${escapeHtml(teamName)}')" style="font-size:0.8rem;">
                        ⚡ Award Manual Points
                    </button>
                </div>
            `;
        } else {
            html += `
                <div style="overflow-x:auto; border-radius:8px; border:1px solid rgba(255,255,255,0.08); background:rgba(0,0,0,0.3);">
                    <table class="admin-table" style="font-size:0.82rem; width:100%; border-collapse:collapse;">
                        <thead>
                            <tr style="background:rgba(0,0,0,0.6);">
                                <th style="width:45px; text-align:center;">#</th>
                                <th>Challenge</th>
                                <th>Category</th>
                                <th style="text-align:center;">Difficulty</th>
                                <th>Solved By</th>
                                <th style="text-align:right;">Points</th>
                                <th style="text-align:center;">Hints</th>
                                <th style="text-align:center;">Time</th>
                            </tr>
                        </thead>
                        <tbody>
            `;

            solvedList.forEach(s => {
                let diffBadge = `<span style="color:var(--accent-success); font-weight:700;">🟢 Easy</span>`;
                if (s.difficulty === 'medium') diffBadge = `<span style="color:var(--accent-warning); font-weight:700;">🟡 Med</span>`;
                else if (s.difficulty === 'hard') diffBadge = `<span style="color:var(--accent-danger); font-weight:700;">🔴 Hard</span>`;
                else if (s.difficulty === 'boss' || s.id === 66) diffBadge = `<span style="color:#ff007f; font-weight:800;">👑 Boss</span>`;

                const timeDisplay = s.time ? (s.time.includes('T') ? new Date(s.time).toLocaleTimeString() : s.time) : '-';

                html += `
                    <tr>
                        <td style="font-weight:bold; color:var(--accent-primary); text-align:center;">#${String(s.id).padStart(2, '0')}</td>
                        <td><strong style="color:#fff;">${escapeHtml(s.title)}</strong></td>
                        <td><span class="badge badge-category" style="font-size:0.68rem;">${escapeHtml(s.category)}</span></td>
                        <td style="text-align:center;">${diffBadge}</td>
                        <td><span style="color:var(--accent-primary); font-weight:600;">👤 ${escapeHtml(s.solvedBy || teamMembers[0] || teamName)}</span></td>
                        <td style="color:var(--accent-success); font-weight:900; text-align:right;">+${s.points}</td>
                        <td style="text-align:center;">${s.hintsUsed > 0 ? `<span style="color:var(--accent-danger); font-weight:700;">${s.hintsUsed}</span>` : '<span style="color:var(--text-muted);">0</span>'}</td>
                        <td style="color:var(--text-muted); font-size:0.75rem; text-align:center;">${timeDisplay}</td>
                    </tr>
                `;
            });

            html += `</tbody></table></div>`;
        }

        bodyEl.innerHTML = html;
    };

    window.openInspectTeamModal = window.inspectTeam;

    // --- LIVE ARENA SCOREBOARD & LEADERBOARDS ---
    function renderAdminScoreboard() {
        const tbody = document.getElementById('adminScoreboardTableBody');
        const podiumEl = document.getElementById('adminScoreboardPodium');
        if (!tbody) return;

        // Build list of active teams and calculate scores & breakdowns
        let list = (adminTeamsCache.active || []).map(t => {
            const teamName = t.team || t.name;
            let solvedMap = t.solves || {};
            try {
                const storedProg = localStorage.getItem(`ai-odyssey-progress-team-${teamName}`);
                if (storedProg) {
                    const localMap = JSON.parse(storedProg);
                    solvedMap = { ...solvedMap, ...localMap };
                }
            } catch(e) {}

            const solvedIds = Object.keys(solvedMap).filter(k => k !== 'bonus' && (solvedMap[k]?.solved || solvedMap[k]?.status === 'solved')).map(Number);

            let easyCount = t.easyCount !== undefined ? t.easyCount : (t.easy || 0);
            let medCount = t.medCount !== undefined ? t.medCount : (t.medium || 0);
            let hardCount = t.hardCount !== undefined ? t.hardCount : (t.hard || 0);
            let bossCount = t.bossCount !== undefined ? t.bossCount : (t.boss || 0);

            if (easyCount === 0 && medCount === 0 && hardCount === 0 && bossCount === 0 && typeof ChallengesDB !== 'undefined' && Array.isArray(ChallengesDB)) {
                solvedIds.forEach(id => {
                    const ch = ChallengesDB.find(c => c.id === id);
                    if (ch) {
                        if (ch.difficulty === 'easy') easyCount++;
                        else if (ch.difficulty === 'medium') medCount++;
                        else if (ch.difficulty === 'hard') hardCount++;
                        else if (ch.difficulty === 'boss' || ch.id === 66) bossCount++;
                    } else if (id === 66) {
                        bossCount++;
                    }
                });
            }

            const totalSolves = Math.max(t.solvesCount || 0, solvedIds.length, (easyCount + medCount + hardCount + bossCount));

            return {
                name: teamName,
                members: Array.isArray(t.members) && t.members.length > 0 ? t.members : [teamName],
                solves: totalSolves,
                points: t.score !== undefined ? t.score : (t.points || 0),
                lastSolve: t.lastSolveTime || null,
                easyCount,
                medCount,
                hardCount,
                bossCount,
                solvedIds
            };
        });

        // Search Filter
        const query = (document.getElementById('adminScoreboardSearch')?.value || '').toLowerCase().trim();
        if (query) {
            list = list.filter(t => t.name.toLowerCase().includes(query) || t.members.some(m => m.toLowerCase().includes(query)));
        }

        // Sort: Points DESC, then Solves DESC, then earlier LastSolve ASC
        list.sort((a, b) => {
            if (b.points !== a.points) return b.points - a.points;
            if (b.solves !== a.solves) return b.solves - a.solves;
            if (a.lastSolve && b.lastSolve) return new Date(a.lastSolve) - new Date(b.lastSolve);
            return a.name.localeCompare(b.name);
        });

        // Render Podium
        if (podiumEl) {
            if (list.length === 0) {
                podiumEl.innerHTML = `<div style="grid-column:1/-1; text-align:center; color:var(--text-muted); padding:1rem;">No active scores recorded yet.</div>`;
            } else {
                const top1 = list[0];
                const top2 = list[1];
                const top3 = list[2];

                let podHtml = '';
                if (top1) {
                    podHtml += `
                        <div class="glass" style="padding:1.25rem; border-radius:12px; border:2px solid #ffd700; background:linear-gradient(145deg, rgba(255, 215, 0, 0.12), rgba(10, 10, 26, 0.8)); box-shadow:0 0 25px rgba(255, 215, 0, 0.25);">
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
                                <span style="font-size:1.8rem;">🥇</span>
                                <span style="font-size:0.75rem; font-weight:800; color:#ffd700; background:rgba(255,215,0,0.15); padding:2px 8px; border-radius:10px;">1ST PLACE</span>
                            </div>
                            <h4 style="margin:0; font-size:1.2rem; color:#fff; font-weight:800;">${escapeHtml(top1.name)}</h4>
                            <p style="margin:0.2rem 0 0.5rem; font-size:0.8rem; color:var(--text-secondary);">${escapeHtml(top1.members.join(', '))}</p>
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-top:0.5rem; border-top:1px dashed rgba(255,215,0,0.3); padding-top:0.5rem;">
                                <span style="font-size:1.25rem; font-weight:900; color:#ffd700;">${top1.points.toLocaleString()} pts</span>
                                <span style="font-size:0.8rem; color:var(--text-muted);">${top1.solves} Solves</span>
                            </div>
                        </div>
                    `;
                }
                if (top2) {
                    podHtml += `
                        <div class="glass" style="padding:1.25rem; border-radius:12px; border:2px solid #c0c0c0; background:linear-gradient(145deg, rgba(192, 192, 192, 0.1), rgba(10, 10, 26, 0.8)); box-shadow:0 0 20px rgba(192, 192, 192, 0.15);">
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
                                <span style="font-size:1.8rem;">🥈</span>
                                <span style="font-size:0.75rem; font-weight:800; color:#c0c0c0; background:rgba(192,192,192,0.15); padding:2px 8px; border-radius:10px;">2ND PLACE</span>
                            </div>
                            <h4 style="margin:0; font-size:1.15rem; color:#fff; font-weight:800;">${escapeHtml(top2.name)}</h4>
                            <p style="margin:0.2rem 0 0.5rem; font-size:0.8rem; color:var(--text-secondary);">${escapeHtml(top2.members.join(', '))}</p>
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-top:0.5rem; border-top:1px dashed rgba(192,192,192,0.3); padding-top:0.5rem;">
                                <span style="font-size:1.2rem; font-weight:900; color:#c0c0c0;">${top2.points.toLocaleString()} pts</span>
                                <span style="font-size:0.8rem; color:var(--text-muted);">${top2.solves} Solves</span>
                            </div>
                        </div>
                    `;
                }
                if (top3) {
                    podHtml += `
                        <div class="glass" style="padding:1.25rem; border-radius:12px; border:2px solid #cd7f32; background:linear-gradient(145deg, rgba(205, 127, 50, 0.1), rgba(10, 10, 26, 0.8)); box-shadow:0 0 20px rgba(205, 127, 50, 0.15);">
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
                                <span style="font-size:1.8rem;">🥉</span>
                                <span style="font-size:0.75rem; font-weight:800; color:#cd7f32; background:rgba(205,127,50,0.15); padding:2px 8px; border-radius:10px;">3RD PLACE</span>
                            </div>
                            <h4 style="margin:0; font-size:1.15rem; color:#fff; font-weight:800;">${escapeHtml(top3.name)}</h4>
                            <p style="margin:0.2rem 0 0.5rem; font-size:0.8rem; color:var(--text-secondary);">${escapeHtml(top3.members.join(', '))}</p>
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-top:0.5rem; border-top:1px dashed rgba(205,127,50,0.3); padding-top:0.5rem;">
                                <span style="font-size:1.2rem; font-weight:900; color:#cd7f32;">${top3.points.toLocaleString()} pts</span>
                                <span style="font-size:0.8rem; color:var(--text-muted);">${top3.solves} Solves</span>
                            </div>
                        </div>
                    `;
                }
                podiumEl.innerHTML = podHtml;
            }
        }

        // Render Table Body
        tbody.innerHTML = '';
        if (list.length === 0) {
            tbody.innerHTML = `<tr><td colspan="11" style="text-align:center; color:var(--text-muted); padding:1.5rem;">No teams match the search criteria.</td></tr>`;
            return;
        }

        list.forEach((t, idx) => {
            const rank = idx + 1;
            let rankBadge = `<span style="font-weight:700; color:var(--text-secondary);">#${rank}</span>`;
            if (rank === 1) rankBadge = `<span style="font-size:1.2rem;">🥇</span>`;
            else if (rank === 2) rankBadge = `<span style="font-size:1.2rem;">🥈</span>`;
            else if (rank === 3) rankBadge = `<span style="font-size:1.2rem;">🥉</span>`;

            const safeTeam = encodeURIComponent(t.name);
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="text-align:center; font-weight:800;">${rankBadge}</td>
                <td style="font-weight:700; color:var(--accent-primary); font-size:0.95rem;">${escapeHtml(t.name)}</td>
                <td style="font-size:0.8rem; color:var(--text-secondary); max-width:200px;">${escapeHtml(t.members.join(', '))}</td>
                <td style="text-align:center; font-weight:700; font-size:0.95rem; color:#fff;">${t.solves}</td>
                <td style="text-align:center; color:var(--accent-success); font-weight:700;">${t.easyCount}</td>
                <td style="text-align:center; color:var(--accent-warning); font-weight:700;">${t.medCount}</td>
                <td style="text-align:center; color:var(--accent-danger); font-weight:700;">${t.hardCount}</td>
                <td style="text-align:center; color:#ff007f; font-weight:700;">${t.bossCount > 0 ? '👑 ' + t.bossCount : '-'}</td>
                <td style="text-align:right; font-weight:900; color:#ffd700; font-size:1.05rem;">${t.points.toLocaleString()} pts</td>
                <td style="text-align:center; font-size:0.8rem; color:var(--text-muted);">${t.lastSolve ? new Date(t.lastSolve).toLocaleTimeString() : '-'}</td>
                <td style="text-align:right;">
                    <button class="btn btn-secondary btn-sm" onclick="window.inspectTeam(decodeURIComponent('${safeTeam}'))" title="Inspect Solved Challenges" style="white-space:nowrap;">🔍 Scorecard</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    // --- EXPORT SCOREBOARD CSV ---
    window.exportAdminScoreboardCSV = () => {
        const active = adminTeamsCache.active || [];
        if (active.length === 0) {
            showToast('No active teams to export.', 'warning');
            return;
        }

        const list = active.map(t => ({
            name: t.team,
            members: Array.isArray(t.members) ? t.members.join(';') : t.team,
            solves: t.solvesCount || 0,
            score: t.score || 0,
            lastSolve: t.lastSolveTime || ''
        })).sort((a, b) => b.score - a.score);

        let csv = 'Rank,Team Name,Members,Total Solves,Total Points,Last Solve Time\n';
        list.forEach((t, i) => {
            csv += `${i+1},"${t.name}","${t.members}",${t.solves},${t.score},"${t.lastSolve}"\n`;
        });

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `crisis_lab_scoreboard_${new Date().toISOString().slice(0,10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('📥 Scoreboard CSV exported successfully!', 'success');
    };

    window.adjustTeamPoints = (teamName) => {
        const deltaStr = prompt(`Enter point adjustment for team "${teamName}" (e.g. +50 for bonus, -25 for penalty):`, '+50');
        if (!deltaStr) return;
        const delta = parseInt(deltaStr, 10);
        if (isNaN(delta)) return;

        const key = `ai-odyssey-progress-team-${teamName}`;
        const prog = JSON.parse(localStorage.getItem(key) || '{}');
        prog['bonus'] = prog['bonus'] || { solved: true, earnedPoints: 0, time: new Date().toISOString() };
        prog['bonus'].earnedPoints = (prog['bonus'].earnedPoints || 0) + delta;
        prog['bonus'].time = new Date().toISOString();
        localStorage.setItem(key, JSON.stringify(prog));

        const prefix = window.location.pathname.includes('/challenges/') ? '../../' : '';
        fetch(`${prefix}api/progress`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ team: teamName, challengeId: 'bonus', progress: prog['bonus'] })
        }).catch(() => {});

        renderTeamsTable();
        showToast(`Adjusted ${delta > 0 ? '+' : ''}${delta} pts for team "${teamName}"`, 'success');
    };

    window.reinstateTeam = window.restoreTeam;

    window.deleteAllTeams = () => {
        if (!confirm('⚠️ CRITICAL DANGER: Are you sure you want to PERMANENTLY DELETE ALL TEAMS, member accounts, and all live leaderboard scores?')) return;

        // Set global purge flag
        localStorage.setItem('ai-odyssey-deleted-all-teams', 'true');
        localStorage.setItem('ai-odyssey-deleted-teams', JSON.stringify([]));

        // Clear local storage teams
        localStorage.setItem('ai-odyssey-local-users', JSON.stringify({}));
        for (let i = localStorage.length - 1; i >= 0; i--) {
            const key = localStorage.key(i);
            if (key && (key.startsWith('ai-odyssey-team-status-') || key.startsWith('ai-odyssey-progress-team-') || key.startsWith('ai-odyssey-arena-started-') || key.startsWith('ai-odyssey-arena-end-'))) {
                localStorage.removeItem(key);
            }
        }

        // Dispatch to server
        const prefix = window.location.pathname.includes('/challenges/') ? '../../' : '';
        adminFetch(`${prefix}api/delete-all-teams`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }).catch(() => {});

        renderCredentialsHub();
        renderTeamsTable();
        renderPendingTeams();
        updateAdminStats();
        showToast('💣 ALL TEAMS and credentials have been PERMANENTLY wiped!', 'error', 5000);
    };

    window.resetSingleTeam = (teamName) => {
        if (confirm(`Reset all progress for team "${teamName}"?`)) {
            localStorage.removeItem(`ai-odyssey-progress-team-${teamName}`);
            localStorage.removeItem(`ai-odyssey-arena-started-${teamName}`);
            localStorage.removeItem(`ai-odyssey-arena-end-${teamName}`);
            renderTeamsTable();
            updateAdminStats();
            showToast(`Team "${teamName}" progress reset.`, 'info');
        }
    };

    // --- TEAM TABLE CONTROLS (Filters, Sorting, Search, Approve All) ---
    function bindTeamTableControls() {
        const btnAll = document.getElementById('btnFilterTeamAll');
        const btnApp = document.getElementById('btnFilterTeamApproved');
        const btnPend = document.getElementById('btnFilterTeamPending');
        const btnDQ = document.getElementById('btnFilterTeamDQ');
        const sortSelect = document.getElementById('adminTeamSortSelect');
        const searchInput = document.getElementById('adminTeamSearch');
        const btnApproveAll = document.getElementById('btnApproveAllPending');

        const filterBtns = [btnAll, btnApp, btnPend, btnDQ].filter(Boolean);
        filterBtns.forEach(btn => {
            btn.onclick = () => {
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                if (btn === btnAll) currentTeamStatusFilter = 'all';
                else if (btn === btnApp) currentTeamStatusFilter = 'approved';
                else if (btn === btnPend) currentTeamStatusFilter = 'pending';
                else if (btn === btnDQ) currentTeamStatusFilter = 'disqualified';
                renderTeamsTable();
            };
        });

        if (sortSelect) {
            sortSelect.onchange = () => {
                currentTeamSort = sortSelect.value;
                renderTeamsTable();
            };
        }

        if (searchInput) {
            searchInput.oninput = () => {
                renderTeamsTable();
            };
        }

        if (btnApproveAll) {
            btnApproveAll.onclick = () => {
                const users = getLocalUsers();
                let approvedCount = 0;
                const prefix = window.location.pathname.includes('/challenges/') ? '../../' : '';
                Object.values(users).forEach(u => {
                    if (u.team) {
                        const cur = localStorage.getItem(`ai-odyssey-team-status-${u.team}`) || u.status || 'pending';
                        if (cur === 'pending') {
                            localStorage.setItem(`ai-odyssey-team-status-${u.team}`, 'approved');
                            u.status = 'approved';
                            approvedCount++;
                            adminFetch(`${prefix}api/approve-team`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ team: u.team, status: 'approved' })
                            }).catch(() => {});
                        }
                    }
                });
                saveLocalUsers(users);
                renderTeamsTable();
                renderPendingTeams();
                updateAdminStats();
                showToast(`✅ Approved all ${approvedCount} pending teams!`, 'success');
            };
        }
    }

    // --- SCOREBOARD FREEZE ---
    function bindFreezeLeaderboard() {
        const btn = document.getElementById('btnToggleFreezeLeaderboard');
        if (!btn) return;

        function updateFreezeBtn() {
            const isFrozen = localStorage.getItem('ai-odyssey-scoreboard-frozen') === 'true';
            btn.textContent = isFrozen ? '🔥 Unfreeze Scoreboard' : '🧊 Freeze Scoreboard';
            btn.className = isFrozen ? 'btn btn-primary btn-sm' : 'btn btn-secondary btn-sm';
        }

        btn.onclick = () => {
            const curr = localStorage.getItem('ai-odyssey-scoreboard-frozen') === 'true';
            const next = !curr;
            localStorage.setItem('ai-odyssey-scoreboard-frozen', String(next));
            updateFreezeBtn();

            const prefix = window.location.pathname.includes('/challenges/') ? '../../' : '';
            adminFetch(`${prefix}api/scoreboard-freeze`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ frozen: next })
            }).catch(() => {});

            if (next) {
                showToast('🧊 Public Scoreboard has been FROZEN!', 'warning');
                sendPreset('🧊 Scoreboard has been FROZEN for the final sprint!');
            } else {
                showToast('🔥 Public Scoreboard is now LIVE and UNFROZEN!', 'success');
                sendPreset('🔥 Scoreboard is now UNFROZEN!');
            }
        };

        updateFreezeBtn();
    }

    window.activateAllUsersAndTeams = function(startClock = true) {
        // 1. Approve all local users
        const users = getLocalUsers();
        Object.keys(users).forEach(k => {
            users[k].status = 'approved';
            if (users[k].team) {
                localStorage.setItem(`ai-odyssey-team-status-${users[k].team}`, 'approved');
            }
        });
        localStorage.setItem('ai-odyssey-local-users', JSON.stringify(users));

        // 2. Approve all preconfigured teams
        if (typeof PRECONFIGURED_TEAMS !== 'undefined') {
            PRECONFIGURED_TEAMS.forEach(t => {
                t.status = 'approved';
                localStorage.setItem(`ai-odyssey-team-status-${t.team}`, 'approved');
            });
        }

        const getApiUrl = (endpoint) => {
            const clean = endpoint.replace(/^\//, '');
            if (typeof window !== 'undefined') {
                if (window.location.protocol === 'http:' || window.location.protocol === 'https:') {
                    return `${window.location.origin}/${clean}`;
                }
                return `http://localhost:3000/${clean}`;
            }
            return `/${clean}`;
        };

        adminFetch(getApiUrl('api/approve-all-teams'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }).catch(() => {});

        // 4. Start competition clock if requested
        if (startClock) {
            const remainingSec = 90 * 60;
            const arenaEndTime = Date.now() + (remainingSec * 1000);

            localStorage.setItem('ai-odyssey-local-timer-action-time', String(Date.now()));
            localStorage.setItem('ai-odyssey-global-arena-state', 'running');
            localStorage.setItem('ai-odyssey-global-arena-end', String(arenaEndTime));
            localStorage.removeItem('ai-odyssey-global-arena-remaining');

            Object.values(users).forEach(u => {
                if (u.team) {
                    localStorage.setItem(`ai-odyssey-arena-started-${u.team}`, 'true');
                    localStorage.setItem(`ai-odyssey-arena-end-${u.team}`, String(arenaEndTime));
                }
            });

            localStorage.setItem('ai-odyssey-timer-sync-event', JSON.stringify({
                action: 'resume',
                endTime: arenaEndTime,
                remaining: remainingSec,
                time: Date.now()
            }));

            adminFetch(getApiUrl('api/timer'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'resume', endTime: arenaEndTime, remaining: remainingSec })
            }).catch(() => {});

            if (typeof TimerManager !== 'undefined') {
                TimerManager.resumeCompetition(arenaEndTime, remainingSec);
            }
        }

        // 5. Send broadcast announcement to all screens
        sendPreset('🚀 Arena Activated! All teams & challenges are now UNLOCKED.');

        // 6. Refresh admin tables and stats
        updateAdminStats();
        renderPendingTeams();
        renderTeamsTable();
        renderCredentialsHub();
        showToast('⚡ ALL Teams & Users ACTIVATED & Clock is RUNNING!', 'success');
    };

    // --- TIMER CONTROLS ---
    function bindTimerControls() {
        const startBtns = [document.getElementById('btnAdminStartTimer'), document.getElementById('btnHeaderStartTimer')].filter(Boolean);
        const unpauseBtns = [document.getElementById('btnAdminUnpauseTimer'), document.getElementById('btnHeaderUnpauseTimer')].filter(Boolean);
        const pauseBtns = [document.getElementById('btnAdminPauseTimer'), document.getElementById('btnHeaderPauseTimer')].filter(Boolean);
        const resetBtns = [document.getElementById('btnAdminResetTimer'), document.getElementById('btnHeaderResetTimer')].filter(Boolean);
        const add10Btn = document.getElementById('btnHeaderAdd10Min');
        const add30Btn = document.getElementById('btnHeaderAdd30Min');
        const adminAdd10Btn = document.getElementById('btnAdminAdd10Min');
        const adminAdd30Btn = document.getElementById('btnAdminAdd30Min');

        const prefix = window.location.pathname.includes('/challenges/') ? '../../' : '';

        // Start Fresh (90 Minutes)
        const handleStart = async () => {
            startBtns.forEach(b => b.disabled = true);
            try {
                const res = await adminFetch(`${prefix}api/admin/arena/start`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ durationSeconds: 5400 })
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data && data.arena) {
                        adminArenaCache = data.arena;
                        updateAdminArenaUI(data.arena);
                    }
                    await syncServerUsers(true);
                    showToast('🚀 ARENA STARTED (90m)! All active teams can now solve challenges.', 'success');
                } else {
                    const err = await res.json().catch(() => ({}));
                    showToast(`❌ ${err.error || 'Failed to start arena'}`, 'error');
                }
            } catch(e) {
                showToast('❌ Network error while starting arena', 'error');
            } finally {
                startBtns.forEach(b => b.disabled = false);
            }
        };

        startBtns.forEach(btn => btn.onclick = handleStart);

        // Unpause / Resume Clock (Continues from exact paused second without resetting)
        const handleUnpause = async () => {
            unpauseBtns.forEach(b => b.disabled = true);
            try {
                const res = await adminFetch(`${prefix}api/admin/arena/start`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({}) // Server automatically resumes from globalArena.remainingSeconds!
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data && data.arena) {
                        adminArenaCache = data.arena;
                        updateAdminArenaUI(data.arena);
                    }
                    await syncServerUsers(true);
                    showToast('▶ ARENA RESUMED! Clock is counting down.', 'success');
                } else {
                    const err = await res.json().catch(() => ({}));
                    showToast(`❌ ${err.error || 'Failed to unpause arena'}`, 'error');
                }
            } catch(e) {
                showToast('❌ Network error while unpausing arena', 'error');
            } finally {
                unpauseBtns.forEach(b => b.disabled = false);
            }
        };

        unpauseBtns.forEach(btn => btn.onclick = handleUnpause);

        // Pause Clock (Freezes at exact current remaining second)
        const handlePause = async () => {
            pauseBtns.forEach(b => b.disabled = true);
            try {
                const res = await adminFetch(`${prefix}api/admin/arena/stop`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data && data.arena) {
                        adminArenaCache = data.arena;
                        updateAdminArenaUI(data.arena);
                    }
                    await syncServerUsers(true);
                    showToast('⏸️ ARENA PAUSED across all connected systems.', 'warning');
                } else {
                    const err = await res.json().catch(() => ({}));
                    showToast(`❌ ${err.error || 'Failed to pause arena'}`, 'error');
                }
            } catch(e) {
                showToast('❌ Network error while pausing arena', 'error');
            } finally {
                pauseBtns.forEach(b => b.disabled = false);
            }
        };

        pauseBtns.forEach(btn => btn.onclick = handlePause);

        const handleReset = async () => {
            if (!confirm('Are you sure you want to RESET the Arena clock to 90 minutes?')) return;
            resetBtns.forEach(b => b.disabled = true);
            try {
                const res = await adminFetch(`${prefix}api/admin/arena/reset`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data && data.arena) {
                        adminArenaCache = data.arena;
                        updateAdminArenaUI(data.arena);
                    }
                    await syncServerUsers(true);
                    showToast('↺ Arena clock RESET to 90 minutes.', 'info');
                } else {
                    const err = await res.json().catch(() => ({}));
                    showToast(`❌ ${err.error || 'Failed to reset arena'}`, 'error');
                }
            } catch(e) {
                showToast('❌ Network error while resetting arena', 'error');
            } finally {
                resetBtns.forEach(b => b.disabled = false);
            }
        };

        resetBtns.forEach(btn => btn.onclick = handleReset);

        const handleAddTime = async (minutes) => {
            try {
                const res = await adminFetch(`${prefix}api/admin/arena/add-time`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ minutes })
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data && data.arena) {
                        adminArenaCache = data.arena;
                        updateAdminArenaUI(data.arena);
                    }
                    await syncServerUsers(true);
                    showToast(`⏱️ Added +${minutes} minutes to the Arena Clock!`, 'success');
                } else {
                    const err = await res.json().catch(() => ({}));
                    showToast(`❌ ${err.error || 'Failed to extend time'}`, 'error');
                }
            } catch(e) {
                showToast('❌ Network error while extending time', 'error');
            }
        };

        if (add10Btn) add10Btn.onclick = () => handleAddTime(10);
        if (add30Btn) add30Btn.onclick = () => handleAddTime(30);
        if (adminAdd10Btn) adminAdd10Btn.onclick = () => handleAddTime(10);
        if (adminAdd30Btn) adminAdd30Btn.onclick = () => handleAddTime(30);
    }

    // --- BROADCAST ALERTS ---
    window.sendPreset = (msg) => {
        const payload = {
            message: msg,
            sender: 'ODYSSEY (Admin)',
            time: new Date().toISOString()
        };
        localStorage.setItem('ai-odyssey-live-broadcast', JSON.stringify(payload));

        const prefix = window.location.pathname.includes('/challenges/') ? '../../' : '';
        adminFetch(`${prefix}api/broadcast`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        }).catch(() => {});

        showToast(`📢 Broadcast sent: "${msg}"`, 'success');
    };

    function bindBroadcastControls() {
        const btnSend = document.getElementById('btnAdminSendBroadcast');
        const input = document.getElementById('adminBroadcastInput');

        if (btnSend && input) {
            btnSend.onclick = () => {
                const msg = input.value.trim();
                if (!msg) {
                    showToast('Please type an announcement before sending', 'warning');
                    return;
                }
                sendPreset(msg);
                input.value = '';
            };
        }
    }

    // --- CHALLENGES VAULT ---
    function bindCategoryFilters() {
        const map = {
            'btnAdminFilterAll': 'all',
            'btnAdminFilterPython': 'python',
            'btnAdminFilterC': 'c',
            'btnAdminFilterJava': 'java',
            'btnAdminFilterWeb': 'web'
        };

        Object.keys(map).forEach(btnId => {
            const b = document.getElementById(btnId);
            if (b) {
                b.onclick = () => {
                    currentCategoryFilter = map[btnId];
                    renderChallengesList();
                };
            }
        });
    }

    function renderChallengesList() {
        const container = document.getElementById('adminChallengeList');
        if (!container || typeof ChallengesDB === 'undefined') return;

        const searchInput = document.getElementById('adminChallengeSearch');
        const query = searchInput ? searchInput.value.toLowerCase() : '';

        container.innerHTML = '';

        ChallengesDB.forEach(ch => {
            if (currentCategoryFilter === 'python' && ch.category.toLowerCase() !== 'python') return;
            if (currentCategoryFilter === 'c' && ch.category.toLowerCase() !== 'c') return;
            if (currentCategoryFilter === 'java' && ch.category.toLowerCase() !== 'java') return;
            if (currentCategoryFilter === 'web' && !['html', 'css', 'javascript', 'js', 'web'].includes(ch.category.toLowerCase())) return;

            if (query && !ch.title.toLowerCase().includes(query) && !ch.category.toLowerCase().includes(query)) {
                return;
            }

            const item = document.createElement('div');
            item.className = 'glass';
            item.style.cssText = 'padding: 0.8rem 1.2rem; border-radius: 8px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem;';

            const sol = ch.acceptedAnswers?.[0] || ch.solution;

            item.innerHTML = `
                <div style="flex: 1; min-width: 260px;">
                    <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
                        <span style="font-weight:800; color:var(--accent-primary);">#${String(ch.id).padStart(2, '0')}</span>
                        <strong style="font-size:0.95rem;">${ch.title}</strong>
                        <span class="badge badge-category" style="font-size:0.7rem;">${ch.category}</span>
                        <span class="badge badge-${ch.difficulty}" style="font-size:0.7rem;">${ch.difficulty.toUpperCase()}</span>
                        <span style="font-size:0.8rem; color:var(--text-muted);">${ch.points} pts</span>
                    </div>
                    <div id="solPreview-${ch.id}" class="sol-preview">
                        <strong>Fix:</strong> <code id="solText-${ch.id}">${sol}</code><br>
                        <strong>Line:</strong> <code>${ch.solution}</code>
                    </div>
                </div>
                <div style="display: flex; gap: 0.4rem;">
                    <button class="btn btn-secondary btn-sm" onclick="copySolution(${ch.id})">📋 Copy Fix</button>
                    <button class="btn btn-secondary btn-sm" onclick="toggleSolutionView(${ch.id})">👁️ View</button>
                    <button class="btn btn-secondary btn-sm" onclick="editPoints(${ch.id})">✏️ Points</button>
                </div>
            `;
            container.appendChild(item);
        });
    }

    window.copySolution = (chId) => {
        const ch = ChallengesDB.find(c => c.id === chId);
        if (!ch) return;
        const fix = ch.acceptedAnswers?.[0] || ch.solution;
        navigator.clipboard.writeText(fix).then(() => {
            showToast(`📋 Copied solution for #${chId}: "${fix}"`, 'success');
        });
    };

    window.toggleSolutionView = (chId) => {
        const el = document.getElementById(`solPreview-${chId}`);
        if (el) {
            el.style.display = el.style.display === 'block' ? 'none' : 'block';
        }
    };

    window.editPoints = (chId) => {
        const ch = ChallengesDB.find(c => c.id === chId);
        if (!ch) return;
        const newPts = prompt(`Enter new points for Challenge #${chId} (${ch.title}):`, ch.points);
        if (newPts && !isNaN(newPts)) {
            const parsed = parseInt(newPts, 10);
            ch.points = parsed;
            
            // Persist points override
            const overrides = JSON.parse(localStorage.getItem('ai-odyssey-challenge-points-override')) || {};
            overrides[chId] = parsed;
            localStorage.setItem('ai-odyssey-challenge-points-override', JSON.stringify(overrides));

            renderChallengesList();
            showToast(`Updated Challenge #${chId} to ${parsed} pts`, 'success');
        }
    };

    const chSearch = document.getElementById('adminChallengeSearch');
    if (chSearch) chSearch.addEventListener('input', () => renderChallengesList());

    // --- SOLVE AUDIT LOG ---
    function renderAuditLog() {
        const container = document.getElementById('adminAuditLogList');
        if (!container) return;

        const events = [];

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
                                time: p.time ? new Date(p.time) : new Date(),
                                hintsUsed: p.hintsUsed || 0
                            });
                        }
                    });
                } catch(e) {}
            }
        }

        events.sort((a, b) => b.time - a.time);

        container.innerHTML = '';
        if (events.length === 0) {
            container.innerHTML = `<div style="text-align:center; padding:1.5rem; color:var(--text-muted);">No solve activity logged yet. Solves will appear here live during the competition!</div>`;
            return;
        }

        events.forEach(ev => {
            const row = document.createElement('div');
            row.className = 'log-entry';
            row.innerHTML = `
                <div>
                    <span style="color:var(--accent-success); font-weight:bold;">⚡ SOLVE</span>
                    <strong>${ev.solver}</strong>
                    <span style="color:var(--text-muted);">(${ev.team})</span>
                    <span>solved <strong style="color:var(--accent-primary);">Challenge #${ev.challengeId}</strong></span>
                    ${ev.hintsUsed > 0 ? `<span style="font-size:0.75rem; color:var(--accent-danger);">(${ev.hintsUsed} hint)</span>` : '<span style="font-size:0.75rem; color:var(--accent-success);">(0 hints)</span>'}
                </div>
                <div style="display:flex; align-items:center; gap:0.75rem;">
                    <span style="font-weight:700; color:var(--accent-success);">+${ev.points} pts</span>
                    <span style="font-size:0.75rem; color:var(--text-muted);">${ev.time.toLocaleTimeString()}</span>
                </div>
            `;
            container.appendChild(row);
        });
    }

    const btnRefreshAudit = document.getElementById('btnRefreshAuditLog');
    if (btnRefreshAudit) btnRefreshAudit.onclick = () => {
        renderAuditLog();
        showToast('Audit log refreshed.', 'info');
    };

    // --- DATA BACKUP & RESTORE ---
    function bindDataBackupRestore() {
        const btnBackup = document.getElementById('btnAdminDownloadBackupJSON');
        const btnExportCSV = document.getElementById('btnAdminExportCSV');
        const restoreInput = document.getElementById('adminRestoreFileInput');
        const btnResetAll = document.getElementById('btnAdminResetAllEvent');

        if (btnBackup) {
            btnBackup.onclick = () => {
                const backup = {};
                for (let i = 0; i < localStorage.length; i++) {
                    const k = localStorage.key(i);
                    if (k && k.startsWith('ai-odyssey-')) {
                        backup[k] = localStorage.getItem(k);
                    }
                }
                const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `crisis-lab-backup-${new Date().toISOString().slice(0, 10)}.json`;
                a.click();
                URL.revokeObjectURL(url);
                showToast('📦 Complete competition state exported (JSON)!', 'success');
            };
        }

        if (btnExportCSV) {
            btnExportCSV.onclick = () => {
                let csv = 'Rank,Team Name,Status,Solved,Total Points\n';
                const rows = document.querySelectorAll('#adminTeamsTableBody tr');
                rows.forEach((tr, i) => {
                    const tds = tr.querySelectorAll('td');
                    if (tds.length >= 5) {
                        csv += `${i + 1},"${tds[0].textContent.trim()}","${tds[1].textContent.trim()}",${tds[3].textContent.trim()},${tds[4].textContent.trim()}\n`;
                    }
                });
                const blob = new Blob([csv], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'crisis-lab-scoreboard.csv';
                a.click();
                URL.revokeObjectURL(url);
                showToast('📥 CSV Leaderboard exported!', 'success');
            };
        }

        if (restoreInput) {
            restoreInput.onchange = (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (ev) => {
                    try {
                        const data = JSON.parse(ev.target.result);
                        Object.keys(data).forEach(k => {
                            localStorage.setItem(k, data[k]);
                        });
                        initAdminDashboard();
                        showToast('✅ Competition state restored from backup JSON!', 'success');
                    } catch(err) {
                        showToast('❌ Invalid JSON backup file!', 'error');
                    }
                };
                reader.readAsText(file);
            };
        }

        if (btnResetAll) {
            btnResetAll.onclick = () => {
                if (confirm('⚠️ WARNING: This will permanently wipe all team solves, timer data, and points! Continue?')) {
                    for (let i = localStorage.length - 1; i >= 0; i--) {
                        const key = localStorage.key(i);
                        if (key && (key.startsWith('ai-odyssey-progress-') || key.startsWith('ai-odyssey-arena-') || key.startsWith('ai-odyssey-problem-timer-') || key.startsWith('ai-odyssey-team-status-'))) {
                            localStorage.removeItem(key);
                        }
                    }
                    initAdminDashboard();
                    showToast('🗑️ All event progress has been reset!', 'info');
                }
            };
        }
    }

    function bindModals() {
        const modalIds = [
            'inspectTeamModal',
            'editTeamModal',
            'adjustScoreModal',
            'quickAddTeamModal',
            'importSheetsModal',
            'adminBroadcastModal',
            'pointOverrideModal'
        ];

        modalIds.forEach(id => {
            const m = document.getElementById(id);
            if (m && !m.dataset.backdropBound) {
                m.dataset.backdropBound = 'true';
                m.addEventListener('click', (e) => {
                    if (e.target === m) {
                        m.style.display = 'none';
                    }
                });
            }
        });

        if (!document.body.dataset.escBound) {
            document.body.dataset.escBound = 'true';
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    modalIds.forEach(id => {
                        const m = document.getElementById(id);
                        if (m && m.style.display !== 'none') {
                            m.style.display = 'none';
                        }
                    });
                }
            });
        }
    }

    // ============================================
    // 🔑 CREDENTIALS & SHARE HUB (70 TEAMS READY)
    // ============================================
    function getBaseLoginUrl() {
        return window.location.origin + window.location.pathname.replace('admin.html', 'login.html');
    }

    function getAllAdminTeamsRoster() {
        const map = new Map();

        // 1. From server cache (authoritative source of truth)
        const combinedServerTeams = [...(adminTeamsCache.active || []), ...(adminTeamsCache.pending || [])];
        combinedServerTeams.forEach(t => {
            if (t && t.team) {
                map.set(t.team.toLowerCase(), {
                    team: t.team,
                    password: t.password || '',
                    members: (t.members && t.members.length > 0 ? t.members : [t.team]).slice(0, 3),
                    status: t.status || 'active'
                });
            }
        });

        // 2. Preconfigured Teams fallback if not present
        if (typeof PRECONFIGURED_TEAMS !== 'undefined' && Array.isArray(PRECONFIGURED_TEAMS)) {
            PRECONFIGURED_TEAMS.forEach(t => {
                if (t && t.team) {
                    const key = t.team.toLowerCase();
                    if (!map.has(key)) {
                        map.set(key, { ...t, members: t.members ? [...t.members] : [t.team] });
                    }
                }
            });
        }

        return Array.from(map.values());
    }

    function bindQuickAddTeam() {
        const btnOpen = document.getElementById('btnQuickAddTeamModal');
        const modal = document.getElementById('quickAddTeamModal');
        const form = document.getElementById('quickAddTeamForm');

        if (btnOpen && modal) {
            btnOpen.onclick = () => {
                modal.style.display = 'flex';
            };
        }

        if (form) {
            form.onsubmit = async (e) => {
                e.preventDefault();
                const team = (document.getElementById('quickTeamName')?.value || '').trim();
                const password = (document.getElementById('quickPassword')?.value || '').trim();
                const mem1 = (document.getElementById('quickMember1')?.value || '').trim();
                const mem2 = (document.getElementById('quickMember2')?.value || '').trim();
                const mem3 = (document.getElementById('quickMember3')?.value || '').trim();

                if (!team || !password || !mem1) {
                    showToast('Team name, password, and Member 1 are required.', 'warning');
                    return;
                }

                const members = [mem1];
                if (mem2 && mem2 !== mem1) members.push(mem2);
                if (mem3 && mem3 !== mem1 && mem3 !== mem2) members.push(mem3);

                const prefix = window.location.pathname.includes('/challenges/') ? '../../' : '';
                try {
                    const res = await adminFetch(`${prefix}api/admin/teams/create`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ team, password, members, status: 'active' })
                    });

                    if (res.ok) {
                        if (modal) modal.style.display = 'none';
                        form.reset();
                        await syncServerUsers();
                        renderCredentialsHub();
                        renderTeamsTable();
                        renderPendingTeams();
                        updateAdminStats();
                        showToast(`✅ Team "${team}" added and approved with ${members.length} members!`, 'success');
                    } else {
                        const err = await res.json().catch(() => ({}));
                        showToast(`❌ ${err.error || 'Failed to create team'}`, 'error');
                    }
                } catch(e) {
                    showToast('❌ Network error while creating team', 'error');
                }
            };
        }
    }

    function bindSheetsImport() {
        const btnOpen = document.getElementById('btnOpenSheetsImportModal');
        const modal = document.getElementById('importSheetsModal');
        const btnExec = document.getElementById('btnExecuteSheetsImport');
        const textarea = document.getElementById('sheetsImportTextarea');

        if (btnOpen && modal) {
            btnOpen.onclick = () => {
                modal.style.display = 'flex';
            };
        }

        if (btnExec && textarea) {
            btnExec.onclick = () => {
                const text = textarea.value.trim();
                if (!text) {
                    showToast('Please paste your team roster before importing.', 'warning');
                    return;
                }

                const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
                if (lines.length === 0) return;

                const users = getLocalUsers();
                let importedCount = 0;
                const prefix = window.location.pathname.includes('/challenges/') ? '../../' : '';
                let deletedTeams = [];
                try {
                    deletedTeams = JSON.parse(localStorage.getItem('ai-odyssey-deleted-teams') || '[]');
                    localStorage.removeItem('ai-odyssey-deleted-all-teams');
                } catch(e) {}

                lines.forEach(line => {
                    const parts = line.includes('\t') ? line.split('\t').map(p => p.trim()) : line.split(',').map(p => p.trim());
                    if (parts.length < 2) return;

                    const team = parts[0];
                    const password = parts[1];
                    const rawMembers = parts.slice(2).filter(Boolean);
                    const members = rawMembers.length > 0 ? rawMembers.slice(0, 3) : [team];

                    if (!team || !password) return;

                    const teamKey = team.toLowerCase();
                    deletedTeams = deletedTeams.filter(t => t !== teamKey);

                    users[teamKey] = { username: members[0], password, team, members, role: 'player', status: 'approved' };
                    members.forEach(m => {
                        users[m.toLowerCase()] = { username: m, password, team, members, role: 'player', status: 'approved' };
                    });

                    localStorage.setItem(`ai-odyssey-team-status-${team}`, 'approved');

                    fetch(`${prefix}api/register`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ team, password, members, status: 'approved' })
                    }).catch(() => {});

                    importedCount++;
                });

                localStorage.setItem('ai-odyssey-deleted-teams', JSON.stringify(deletedTeams));
                saveLocalUsers(users);

                if (modal) modal.style.display = 'none';
                textarea.value = '';
                renderCredentialsHub();
                renderTeamsTable();
                renderPendingTeams();
                updateAdminStats();
                showToast(`🎉 Successfully imported and approved ${importedCount} teams from sheet!`, 'success', 5000);
            };
        }
    }

    function renderCredentialsHub(searchFilter = '') {
        const container = document.getElementById('adminCredentialsGrid');
        const countEl = document.getElementById('adminCredVisibleCount');
        const totalEl = document.getElementById('adminCredTotalCount');
        if (!container) return;

        const teams = getAllAdminTeamsRoster();
        let filtered = teams;

        if (searchFilter) {
            filtered = teams.filter(t => {
                const matchTeam = t.team.toLowerCase().includes(searchFilter);
                const matchMember = t.members && t.members.some(m => m.toLowerCase().includes(searchFilter));
                return matchTeam || matchMember;
            });
        }

        if (countEl) countEl.textContent = filtered.length;
        if (totalEl) totalEl.textContent = teams.length;

        if (filtered.length === 0) {
            container.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 3rem 1.5rem; color: var(--text-muted);" class="glass">
                    <span style="font-size: 2.5rem; display: block; margin-bottom: 0.75rem;">📋</span>
                    <h3 style="color: #fff; margin: 0 0 0.5rem;">${searchFilter ? `No teams match "${searchFilter}"` : 'No Teams Registered Yet'}</h3>
                    <p style="font-size: 0.88rem; max-width: 450px; margin: 0 auto 1.25rem;">
                        ${searchFilter ? 'Try searching for a different team or member name.' : 'Ready to start! Click <strong>"➕ Add Team"</strong> or <strong>"📋 Import from Sheets"</strong> above to load your roster.'}
                    </p>
                </div>
            `;
            return;
        }

        let html = '';
        filtered.forEach((t, idx) => {
            const teamNum = String(idx + 1).padStart(2, '0');
            const members = t.members || [t.team];

            let membersHtml = '';
            members.forEach(member => {
                const autoLoginUrl = `${getBaseLoginUrl()}?team=${encodeURIComponent(t.team)}&user=${encodeURIComponent(member)}&pass=${encodeURIComponent(t.password)}&autologin=1`;

                membersHtml += `
                    <div style="display: flex; align-items: center; justify-content: space-between; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); border-radius: 8px; padding: 0.45rem 0.75rem; margin-bottom: 0.4rem;">
                        <div style="display: flex; align-items: center; gap: 0.4rem; font-size: 0.88rem; font-weight: 600; color: #fff;">
                            <span style="color: var(--accent-primary);">👤</span>
                            <span>${member}</span>
                        </div>
                        <div style="display: flex; gap: 0.3rem;">
                            <button class="preset-btn" style="font-size: 0.72rem; padding: 2px 7px;" onclick="copyAdminMemberLink('${t.team}', '${member}', '${t.password}')" title="Copy 1-Click Auto-Login Share Link">
                                🔗 Share Link
                            </button>
                            <button class="preset-btn" style="font-size: 0.72rem; padding: 2px 7px;" onclick="openAdminShareCard('${t.team}', '${member}', '${t.password}')" title="View & Copy WhatsApp / Share Card">
                                📋 Card
                            </button>
                            <button class="preset-btn" style="font-size: 0.72rem; padding: 2px 7px; color: var(--accent-primary); border-color: rgba(0,240,255,0.3);" onclick="quickAdminLoginMember('${t.team}', '${member}', '${t.password}')" title="Test Login as ${member}">
                                🚀 Login
                            </button>
                        </div>
                    </div>
                `;
            });

            html += `
                <div class="glass" style="padding: 1.25rem; border-radius: 12px; border: 1px solid rgba(0,240,255,0.2); display: flex; flex-direction: column; justify-content: space-between; gap: 0.9rem;">
                    <div>
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem;">
                            <span style="font-family: monospace; font-size: 0.75rem; font-weight: 800; padding: 2px 8px; border-radius: 6px; background: rgba(0,240,255,0.1); color: var(--accent-primary);">TEAM #${teamNum}</span>
                            <span class="badge badge-success" style="font-size: 0.7rem; padding: 2px 7px;">🟢 Approved</span>
                        </div>
                        <h4 style="margin: 0.2rem 0 0; font-size: 1.15rem; color: #fff; display: flex; align-items: center; gap: 0.4rem;">
                            <span>👥</span> ${t.team}
                        </h4>
                    </div>

                    <div>
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.25rem;">
                            <span style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px;">Team Password</span>
                            <button class="preset-btn" style="font-size: 0.68rem; padding: 1px 6px;" onclick="copyAdminText('${t.password}', 'Password copied!')">
                                📋 Copy
                            </button>
                        </div>
                        <div style="background: rgba(0,0,0,0.5); border: 1px solid var(--border-color); border-radius: 6px; padding: 0.4rem 0.7rem; display: flex; align-items: center; justify-content: space-between;">
                            <span id="adm-pwd-${teamNum}" style="font-family: monospace; font-size: 0.85rem; color: var(--accent-warning); user-select: all;">${t.password}</span>
                            <button onclick="toggleAdminPassword('adm-pwd-${teamNum}')" style="background: none; border: none; color: var(--text-muted); cursor: pointer; font-size: 0.85rem;">👁️</button>
                        </div>
                    </div>

                    <div>
                        <span style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 0.35rem;">
                            Members (Unique Logins)
                        </span>
                        <div>${membersHtml}</div>
                    </div>

                    <div style="border-top: 1px dashed rgba(255,255,255,0.08); padding-top: 0.6rem; display: flex; gap: 0.4rem;">
                        <button class="btn btn-secondary btn-sm" onclick="window.openEditTeamModal('${t.team}')" style="width: 100%; font-size: 0.78rem; padding: 4px 8px;">
                            ✏️ Edit Password & Extra Members
                        </button>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;

        const searchInput = document.getElementById('adminCredSearchInput');
        if (searchInput && !searchInput.dataset.bound) {
            searchInput.dataset.bound = 'true';
            searchInput.addEventListener('input', (e) => {
                renderCredentialsHub(e.target.value.trim().toLowerCase());
            });
        }
    }

    window.toggleAdminPassword = function(elId) {
        const el = document.getElementById(elId);
        if (!el) return;
        if (el.dataset.hidden === 'true') {
            el.innerText = el.dataset.realPassword;
            el.dataset.hidden = 'false';
        } else {
            el.dataset.realPassword = el.innerText;
            el.innerText = '••••••••••••';
            el.dataset.hidden = 'true';
        }
    };

    window.copyAdminText = function(text, msg = 'Copied to clipboard!') {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(() => showToast(msg, 'success')).catch(() => fallbackCopy(text, msg));
        } else {
            fallbackCopy(text, msg);
        }
    };

    function fallbackCopy(text, msg) {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        try {
            document.execCommand('copy');
            showToast(msg, 'success');
        } catch(e) {}
        document.body.removeChild(ta);
    }

    window.copyAdminMemberLink = function(team, member, password) {
        const url = `${getBaseLoginUrl()}?team=${encodeURIComponent(team)}&user=${encodeURIComponent(member)}&pass=${encodeURIComponent(password)}&autologin=1`;
        window.copyAdminText(url, `✅ Copied 1-Click Login Link for ${member} (${team})!`);
    };

    window.openAdminShareCard = function(team, memberName, password) {
        const directUrl = `${getBaseLoginUrl()}?team=${encodeURIComponent(team)}&user=${encodeURIComponent(memberName)}&pass=${encodeURIComponent(password)}&autologin=1`;
        const cardText = `🏆 CRISIS LAB — ARENA ACCESS\n👥 Team Name: ${team}\n👤 Member/User: ${memberName}\n🔑 Password: ${password}\n🌐 Direct 1-Click Arena Link:\n${directUrl}`;
        window.copyAdminText(cardText, `✅ WhatsApp share message copied for ${memberName} (${team})!`);
    };

    window.quickAdminLoginMember = function(team, member, password) {
        const sessionUser = {
            username: member,
            team: team,
            members: [member],
            role: 'player',
            status: 'approved'
        };
        localStorage.setItem('ai-odyssey-current-user', JSON.stringify(sessionUser));
        localStorage.setItem(`ai-odyssey-team-status-${team}`, 'approved');
        showToast(`Entering Arena as ${member} (${team})...`, 'success');
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 500);
    };

    window.copyAllAdminCredentials = function() {
        const teams = getAllAdminTeamsRoster();
        let totalMembers = 0;
        teams.forEach(t => totalMembers += (t.members ? t.members.length : 1));

        let text = `=======================================================\n`;
        text += `🏆 CRISIS LAB — ARENA CREDENTIALS ROSTER (${teams.length} TEAMS, ${totalMembers} PARTICIPANTS)\n`;
        text += `=======================================================\n\n`;

        teams.forEach((t, i) => {
            const num = String(i + 1).padStart(2, '0');
            const members = (t.members || []).join(', ');
            const primaryMember = (t.members && t.members[0]) ? t.members[0] : t.team;
            const link = `${getBaseLoginUrl()}?team=${encodeURIComponent(t.team)}&user=${encodeURIComponent(primaryMember)}&pass=${encodeURIComponent(t.password)}&autologin=1`;
            text += `[Team #${num}] ${t.team}\n`;
            text += `  • Members: ${members}\n`;
            text += `  • Password: ${t.password}\n`;
            text += `  • 1-Click Link: ${link}\n\n`;
        });

        window.copyAdminText(text, `✅ All ${teams.length} teams credentials copied to clipboard!`);
    };

    window.exportAdminTeamsCSV = function() {
        const teams = getAllAdminTeamsRoster();
        let csv = "Team Number,Team Name,Password,Member 1,Member 2,Member 3,Direct Login URL\n";

        teams.forEach((t, i) => {
            const num = i + 1;
            const m1 = t.members && t.members[0] ? t.members[0] : '';
            const m2 = t.members && t.members[1] ? t.members[1] : '';
            const m3 = t.members && t.members[2] ? t.members[2] : '';
            const link = `${getBaseLoginUrl()}?team=${encodeURIComponent(t.team)}&user=${encodeURIComponent(m1)}&pass=${encodeURIComponent(t.password)}&autologin=1`;
            csv += `"${num}","${t.team}","${t.password}","${m1}","${m2}","${m3}","${link}"\n`;
        });

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `crisis_lab_teams_roster_${teams.length}_teams.csv`;
        a.click();
        URL.revokeObjectURL(url);
        showToast(`📥 Exported CSV for ${teams.length} teams successfully!`, 'success');
    };

    // ==============================================================================
    // 🛡️ SECURITY SHIELD COMMAND CENTER MODULE
    // ==============================================================================
    let secAutoPollInterval = null;

    function initSecurityShield() {
        const btnRefresh = document.getElementById('btnRefreshSecurityLogs');
        const btnExport = document.getElementById('btnExportSecurityLogs');
        const btnClear = document.getElementById('btnClearSecurityLogs');
        const btnLockdown = document.getElementById('btnToggleArenaLockdown');
        const selectStrictness = document.getElementById('selectRateLimitStrictness');
        const chkAutoPoll = document.getElementById('chkAutoRefreshSecLogs');
        const btnRefreshSessions = document.getElementById('btnRefreshActiveSessions');

        if (btnRefresh && !btnRefresh.dataset.bound) {
            btnRefresh.dataset.bound = 'true';
            btnRefresh.onclick = () => fetchSecurityTelemetry();
        }
        if (btnExport && !btnExport.dataset.bound) {
            btnExport.dataset.bound = 'true';
            btnExport.onclick = () => exportSecurityAuditTrail();
        }
        if (btnClear && !btnClear.dataset.bound) {
            btnClear.dataset.bound = 'true';
            btnClear.onclick = () => clearSecurityLogs();
        }
        if (btnLockdown && !btnLockdown.dataset.bound) {
            btnLockdown.dataset.bound = 'true';
            btnLockdown.onclick = () => toggleArenaLockdown();
        }
        if (selectStrictness && !selectStrictness.dataset.bound) {
            selectStrictness.dataset.bound = 'true';
            selectStrictness.onchange = (e) => updateRateLimitStrictness(e.target.value);
        }
        if (btnRefreshSessions && !btnRefreshSessions.dataset.bound) {
            btnRefreshSessions.dataset.bound = 'true';
            btnRefreshSessions.onclick = () => fetchActiveSessionsList();
        }

        if (chkAutoPoll && !chkAutoPoll.dataset.bound) {
            chkAutoPoll.dataset.bound = 'true';
            chkAutoPoll.onchange = (e) => {
                if (e.target.checked) startSecAutoPoll();
                else stopSecAutoPoll();
            };
        }

        fetchSecurityTelemetry(true);
        fetchActiveSessionsList();
        startSecAutoPoll();
    }

    function startSecAutoPoll() {
        if (secAutoPollInterval) clearInterval(secAutoPollInterval);
        secAutoPollInterval = setInterval(() => {
            const tabSec = document.getElementById('tab-security');
            if (tabSec && tabSec.style.display !== 'none') {
                fetchSecurityTelemetry(true);
                fetchActiveSessionsList();
            }
        }, 5000);
    }

    function stopSecAutoPoll() {
        if (secAutoPollInterval) {
            clearInterval(secAutoPollInterval);
            secAutoPollInterval = null;
        }
    }

    async function fetchSecurityTelemetry(silent = false) {
        const prefix = window.location.pathname.includes('/challenges/') ? '../../' : '';
        try {
            const res = await adminFetch(`${prefix}api/admin/security-logs`);
            if (!res.ok) return;
            const data = await res.json();
            if (!data || !data.logs) return;

            renderSecurityLogs(data.logs);
            updateSecurityStats(data.logs, data.stats);
            if (!silent) showToast('🛡️ Security telemetry updated', 'info', 2000);
        } catch(e) {}
    }

    function updateSecurityStats(logs, stats) {
        const totalEl = document.getElementById('secStatTotalEvents');
        const threatsEl = document.getElementById('secStatBlockedThreats');
        const throttledEl = document.getElementById('secStatThrottled');
        const sessionsEl = document.getElementById('secStatActiveSessions');
        const lockdownLbl = document.getElementById('lblLockdownStatus');
        const badgeCount = document.getElementById('secLogCountBadge');
        const strictnessSel = document.getElementById('selectRateLimitStrictness');

        if (totalEl) totalEl.textContent = stats?.totalEvents ?? logs.length;
        if (threatsEl) threatsEl.textContent = logs.filter(l => l.severity === 'high' || l.severity === 'critical' || (l.type && (l.type.includes('TRAVERSAL') || l.type.includes('BLOCKED')))).length;
        if (throttledEl) throttledEl.textContent = logs.filter(l => l.type && (l.type.includes('THROTTLED') || l.type.includes('RATE_LIMIT'))).length;
        if (badgeCount) badgeCount.textContent = `${logs.length} Events`;

        if (lockdownLbl && stats) {
            lockdownLbl.textContent = stats.lockdown ? '🚨 ON (Active Lockdown)' : '🟢 OFF (Normal)';
            lockdownLbl.style.color = stats.lockdown ? '#ff3b30' : '#30d158';
        }
        if (strictnessSel && stats && stats.strictness) {
            strictnessSel.value = stats.strictness;
        }
    }

    function renderSecurityLogs(logs) {
        const container = document.getElementById('secAuditLogContainer');
        if (!container) return;

        if (logs.length === 0) {
            container.innerHTML = '<div style="padding: 1.5rem; text-align: center; color: var(--text-muted);">🟢 No security incidents detected. System is clean and running securely.</div>';
            return;
        }

        const sevColors = {
            critical: { bg: 'rgba(255, 59, 48, 0.25)', border: '#ff3b30', text: '#ff3b30' },
            high:     { bg: 'rgba(255, 69, 58, 0.15)', border: '#ff453a', text: '#ff453a' },
            warning:  { bg: 'rgba(255, 149, 0, 0.15)', border: '#ff9500', text: '#ff9500' },
            info:     { bg: 'rgba(0, 240, 255, 0.08)', border: '#00f0ff', text: '#00f0ff' }
        };

        let html = '';
        logs.forEach(l => {
            const sev = sevColors[l.severity] || sevColors.info;
            const timeStr = l.time ? new Date(l.time).toLocaleTimeString() : '';
            html += `
                <div style="display:flex; justify-content:space-between; align-items:center; padding:0.6rem 1rem; border-bottom:1px solid rgba(255,255,255,0.06); background:${sev.bg}; gap:1rem; flex-wrap:wrap;">
                    <div style="display:flex; align-items:center; gap:0.75rem;">
                        <span style="font-size:0.7rem; font-weight:800; padding:2px 6px; border-radius:4px; border:1px solid ${sev.border}; color:${sev.text}; text-transform:uppercase;">${l.severity}</span>
                        <span style="font-weight:700; color:#fff;">${l.type}</span>
                        <span style="color:var(--text-muted); font-size:0.75rem;">IP: <strong style="color:var(--accent-primary);">${l.ip}</strong></span>
                        ${l.user && l.user !== 'anonymous' ? `<span style="color:var(--text-secondary); font-size:0.75rem;">User: <strong>${l.user}</strong></span>` : ''}
                    </div>
                    <div style="display:flex; align-items:center; gap:1rem;">
                        <span style="color:var(--text-secondary); font-size:0.8rem;">${l.details}</span>
                        <span style="color:var(--text-muted); font-size:0.75rem; white-space:nowrap;">${timeStr}</span>
                    </div>
                </div>
            `;
        });
        container.innerHTML = html;
    }

    async function toggleArenaLockdown() {
        const prefix = window.location.pathname.includes('/challenges/') ? '../../' : '';
        try {
            const currLbl = document.getElementById('lblLockdownStatus');
            const isCurrentlyOn = currLbl && currLbl.textContent.includes('ON');
            const next = !isCurrentlyOn;

            const res = await adminFetch(`${prefix}api/admin/security-config`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ lockdown: next })
            });
            if (res.ok) {
                showToast(`🚨 Arena Lockdown mode set to: ${next ? 'ACTIVE (Submissions Paused)' : 'DISABLED (Normal Play)'}`, next ? 'warning' : 'success');
                fetchSecurityTelemetry(true);
            }
        } catch(e) {}
    }

    async function updateRateLimitStrictness(strictness) {
        const prefix = window.location.pathname.includes('/challenges/') ? '../../' : '';
        try {
            const res = await adminFetch(`${prefix}api/admin/security-config`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ strictness })
            });
            if (res.ok) {
                showToast(`🛡️ Rate limiter strictness updated to: ${strictness.toUpperCase()}`, 'success');
                fetchSecurityTelemetry(true);
            }
        } catch(e) {}
    }

    async function clearSecurityLogs() {
        if (confirm('Clear all security telemetry audit logs?')) {
            const prefix = window.location.pathname.includes('/challenges/') ? '../../' : '';
            try {
                await adminFetch(`${prefix}api/admin/security-logs`, { method: 'POST' });
                fetchSecurityTelemetry(true);
                showToast('🗑️ Security audit logs cleared', 'info');
            } catch(e) {}
        }
    }

    function exportSecurityAuditTrail() {
        const prefix = window.location.pathname.includes('/challenges/') ? '../../' : '';
        adminFetch(`${prefix}api/admin/security-logs`)
            .then(res => res.json())
            .then(data => {
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `crisis_lab_security_audit_${new Date().toISOString().slice(0,19).replace(/:/g, '-')}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                showToast('📥 Security audit log exported successfully!', 'success');
            })
            .catch(() => showToast('Failed to export security logs', 'error'));
    }

    async function fetchActiveSessionsList() {
        const prefix = window.location.pathname.includes('/challenges/') ? '../../' : '';
        try {
            const res = await fetch(`${prefix}api/session/active`);
            if (!res.ok) return;
            const data = await res.json();
            const activeSessions = data.activeSessions || {};

            const tbody = document.getElementById('adminActiveSessionsTableBody');
            const countEl = document.getElementById('secStatActiveSessions');
            if (countEl) countEl.textContent = data.count || Object.keys(activeSessions).length;

            if (!tbody) return;

            const userKeys = Object.keys(activeSessions);
            if (userKeys.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:var(--text-muted); padding:1rem;">No participants currently connected.</td></tr>';
                return;
            }

            let html = '';
            userKeys.forEach(k => {
                const s = activeSessions[k];
                const loginTimeStr = s.loginTime ? new Date(s.loginTime).toLocaleTimeString() : 'N/A';
                html += `
                    <tr>
                        <td><strong style="color:#fff;">${s.username || k}</strong></td>
                        <td><span style="color:var(--accent-primary);">${s.team || 'N/A'}</span></td>
                        <td><code>${s.ip || '127.0.0.1'}</code></td>
                        <td><code style="font-size:0.75rem; color:var(--text-muted);">${(s.sessionId || '').slice(0, 14)}...</code></td>
                        <td>${loginTimeStr}</td>
                        <td><span class="badge badge-easy" style="font-size:0.75rem;">🟢 Active</span></td>
                        <td style="text-align:right;">
                            <button class="btn btn-danger btn-sm" style="padding:2px 8px; font-size:0.75rem;" onclick="terminateParticipantSession('${s.username || k}')">⛔ Terminate</button>
                        </td>
                    </tr>
                `;
            });
            tbody.innerHTML = html;
        } catch(e) {}
    }

    window.terminateParticipantSession = async function(username) {
        if (confirm(`Terminate active session for participant "${username}"?`)) {
            const prefix = window.location.pathname.includes('/challenges/') ? '../../' : '';
            try {
                const res = await adminFetch(`${prefix}api/admin/sessions/terminate`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username })
                });
                if (res.ok) {
                    showToast(`⛔ Terminated session for ${username}`, 'warning');
                    fetchActiveSessionsList();
                }
            } catch(e) {}
        }
    };

    // Initial load
    checkAdminAuth();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAdmin);
} else {
    initAdmin();
}
