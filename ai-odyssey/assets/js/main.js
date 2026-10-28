/* ============================================
   AI ODYSSEY - Main Application Script
   ============================================ */

const App = {
    init() {
        this.initAuth();
        this.initChallenges();
        this.initScoreboard();
        this.initAdmin();
        this.initFlagSubmission();
        this.initProgressTracking();
    },

    // ============================================
    // AUTH SYSTEM
    // ============================================

initAuth() {
        // Authentication is handled by login-supabase.js (Supabase).
        // Here we only check the session stored in localStorage.
        this.checkAuth();
    },

    currentUser: null,

    checkAuth() {
        const currentPath = window.location.pathname.split('/').pop() || 'index.html';
        const saved = localStorage.getItem('ai-odyssey-current-user');
        
        if (saved) {
            try {
                this.currentUser = JSON.parse(saved);
                this.updateUIForUser();
            } catch (e) {
                console.error('Error parsing user session:', e);
                localStorage.removeItem('ai-odyssey-current-user');
            }
        }
        
        if (!this.currentUser) {
            const isProtectedPage = currentPath === 'dashboard.html' || window.location.pathname.includes('/challenges/');
            if (isProtectedPage) {
                const loginPath = window.location.pathname.includes('/challenges/') ? '../../login.html' : 'login.html';
                window.location.href = loginPath;
                return;
            }
        }

        // Check team approval & disqualification status
        if (this.currentUser && this.currentUser.role !== 'admin') {
            const team = this.getTeamName();
            const status = localStorage.getItem(`ai-odyssey-team-status-${team}`) || this.currentUser.status || 'approved';
            
            // Auto-sync status to current user session
            if (this.currentUser.status !== status) {
                this.currentUser.status = status;
                localStorage.setItem('ai-odyssey-current-user', JSON.stringify(this.currentUser));
            }

            if (status === 'disqualified') {
                this.handleDisqualification();
            } else if (status === 'pending') {
                const isProtectedPage = currentPath === 'dashboard.html' || window.location.pathname.includes('/challenges/');
                if (isProtectedPage) {
                    if (typeof AnimationManager !== 'undefined') {
                        AnimationManager.showToast(`⏳ Team "${team}" is pending Administrator approval.`, 'warning', 6000);
                    }
                    const loginPath = window.location.pathname.includes('/challenges/') ? '../../login.html' : 'login.html';
                    window.location.href = loginPath;
                    return;
                }
            }
        }
    },

    handleDisqualification() {
        if (document.getElementById('disqualificationModal')) return;
        const modal = document.createElement('div');
        modal.id = 'disqualificationModal';
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
            background: rgba(10, 10, 26, 0.96); z-index: 99999;
            display: flex; align-items: center; justify-content: center; padding: 2rem;
            backdrop-filter: blur(10px);
        `;
        modal.innerHTML = `
            <div class="glass" style="max-width: 500px; padding: 2.5rem; border-radius: 16px; text-align: center; border: 1px solid var(--accent-danger, #ff3b30); box-shadow: 0 0 35px rgba(255, 59, 48, 0.3);">
                <div style="font-size: 3.5rem; margin-bottom: 0.5rem;">🚫</div>
                <h2 style="color: var(--accent-danger, #ff3b30); margin: 0 0 1rem;">TEAM DISQUALIFIED</h2>
                <p style="color: var(--text-secondary); line-height: 1.6; margin-bottom: 1.5rem;">
                    Team <strong>${this.getTeamName()}</strong> has been disqualified by an administrator for fair-play rule violations. All competition access has been locked.
                </p>
                <button class="btn btn-secondary" onclick="App.logout()">Exit Competition</button>
            </div>
        `;
        document.body.appendChild(modal);

        if (typeof TimerManager !== 'undefined') {
            TimerManager.stopArena();
            TimerManager.stopProblemTimer();
        }
    },

    updateUIForUser() {
        if (typeof Navigation !== 'undefined' && typeof Navigation.renderUserControls === 'function') {
            Navigation.renderUserControls();
        }
    },

    logout() {
        this.currentUser = null;
        localStorage.removeItem('ai-odyssey-current-user');
        sessionStorage.removeItem('ai-odyssey-admin-auth');
        if (typeof AnimationManager !== 'undefined') {
            AnimationManager.showToast('Logged out successfully', 'info');
        }
        const isChallengePage = window.location.pathname.includes('/challenges/');
        window.location.href = isChallengePage ? '../../index.html' : 'index.html';
    },

    // ============================================
    // CHALLENGES SYSTEM
    // ============================================

    initChallenges() {
        this.loadChallengeProgress();
        this.syncServerProgress();
        this.bindStartArenaButton();
        this.renderChallenges();
        this.bindChallengeFilters();
        this.loadChallengePage();

        // Auto-poll teammate solves every 2.5 seconds
        if (this.progressSyncInterval) clearInterval(this.progressSyncInterval);
        this.progressSyncInterval = setInterval(() => this.syncServerProgress(), 4000);
    },

    bindStartArenaButton() {
        const startBanner = document.getElementById('startArenaBanner');
        const startBtn = document.getElementById('btnAdminStartArenaDashboard');
        const waitingBadge = document.getElementById('arenaBannerWaitingBadge');
        const isStarted = this.isArenaStarted();

        if (startBanner) {
            startBanner.style.display = isStarted ? 'none' : 'flex';
        }

        const isAdmin = (this.currentUser && (this.currentUser.role === 'admin' || this.currentUser.username === 'ODYSSEY')) || localStorage.getItem('ai-odyssey-admin-logged-in') === 'true';

        if (isAdmin && startBtn) {
            startBtn.style.display = 'inline-flex';
            if (waitingBadge) waitingBadge.style.display = 'none';

            startBtn.onclick = () => {
                const arenaEndTime = Date.now() + (90 * 60 * 1000);
                localStorage.setItem('ai-odyssey-global-arena-state', 'running');
                localStorage.setItem('ai-odyssey-global-arena-end', String(arenaEndTime));
                localStorage.removeItem('ai-odyssey-global-arena-remaining');

                const teamName = this.getTeamName();
                localStorage.setItem(`ai-odyssey-arena-started-${teamName}`, 'true');
                localStorage.setItem(`ai-odyssey-arena-end-${teamName}`, String(arenaEndTime));

                localStorage.setItem('ai-odyssey-timer-sync-event', JSON.stringify({
                    action: 'resume',
                    endTime: arenaEndTime,
                    remaining: 90 * 60,
                    time: Date.now()
                }));

                const prefix = window.location.pathname.includes('/challenges/') ? '../../' : '';
                fetch(`${prefix}api/timer`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'start', endTime: arenaEndTime, remaining: 90 * 60 })
                }).catch(() => {});

                if (typeof TimerManager !== 'undefined') {
                    TimerManager.startCompetition(arenaEndTime);
                }

                if (startBanner) startBanner.style.display = 'none';
                if (typeof AnimationManager !== 'undefined') {
                    AnimationManager.showToast('▶ 90-Minute Competition Arena is now LIVE!', 'success');
                }
            };
        }
    },

    getTeamName() {
        return this.currentUser?.team || this.currentUser?.username || 'Team Alpha';
    },

    getUsername() {
        return this.currentUser?.username || 'player1';
    },

    getTeammates() {
        return this.currentUser?.members || [this.getUsername()];
    },

    isArenaStarted() {
        if (this.serverArenaState && this.serverArenaState.status === 'STARTED') {
            return true;
        }
        const globalState = localStorage.getItem('ai-odyssey-global-arena-state');
        return globalState === 'running';
    },

    getProgressKey() {
        return `ai-odyssey-progress-team-${this.getTeamName()}`;
    },

    loadChallengeProgress() {
        const key = this.getProgressKey();
        let saved = localStorage.getItem(key);
        // Fallback for migration from username-based key
        if (!saved) {
            saved = localStorage.getItem(`ai-odyssey-progress-${this.getUsername()}`) || localStorage.getItem('ai-odyssey-progress-player1');
        }
        if (saved) {
            try {
                this.challengeProgress = JSON.parse(saved);
            } catch (e) {
                this.challengeProgress = {};
            }
        } else {
            this.challengeProgress = {};
        }
        
        // Ensure all challenges are initialized
        if (typeof ChallengesDB !== 'undefined' && Array.isArray(ChallengesDB)) {
            ChallengesDB.forEach(ch => {
                if (!this.challengeProgress[ch.id]) {
                    this.challengeProgress[ch.id] = {
                        status: 'unlocked',
                        solved: false,
                        solvedBy: null,
                        hintsUsed: 0,
                        time: null,
                        attempts: 0
                    };
                }
                // Preserve solved / expired / closed status, otherwise default to unlocked
                if (this.challengeProgress[ch.id].status !== 'solved' && 
                    this.challengeProgress[ch.id].status !== 'expired' && 
                    this.challengeProgress[ch.id].status !== 'closed' && 
                    !this.challengeProgress[ch.id].solved) {
                    this.challengeProgress[ch.id].status = 'unlocked';
                }
            });
        }
        this.saveChallengeProgress();
    },

    markChallengeExpired(challengeId) {
        if (!this.challengeProgress[challengeId]) {
            this.challengeProgress[challengeId] = {
                status: 'unlocked',
                solved: false,
                hintsUsed: 0,
                time: null,
                attempts: 0
            };
        }
        const progress = this.challengeProgress[challengeId];
        if (!progress.solved) {
            progress.status = 'expired';
            this.saveChallengeProgress();
        }
        if (typeof AnimationManager !== 'undefined') {
            AnimationManager.showToast('⏱ Time is up for this challenge! It is now closed.', 'error', 3500);
        }
        setTimeout(() => {
            const currentPath = window.location.pathname;
            if (currentPath.includes('/challenges/')) {
                window.location.href = '../../dashboard.html';
            } else {
                window.location.reload();
            }
        }, 1500);
    },

    handleProblemTimeout(challengeId) {
        if (!this.challengeProgress[challengeId]) {
            this.challengeProgress[challengeId] = { status: 'unlocked', solved: false };
        }
        const progress = this.challengeProgress[challengeId];
        if (!progress.solved) {
            progress.status = 'expired';
            this.saveChallengeProgress();
        }

        const flagInput = document.getElementById('flagInput');
        if (flagInput) {
            flagInput.disabled = true;
            flagInput.placeholder = '🔒 Problem time expired';
        }

        const submitBtn = document.querySelector('#flagForm button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = '🔒 Time Expired';
        }
    },

    saveChallengeProgress() {
        const key = this.getProgressKey();
        localStorage.setItem(key, JSON.stringify(this.challengeProgress));

        // Sync with server over LAN so teammates on other machines see the solve immediately
        const prefix = window.location.pathname.includes('/challenges/') ? '../../' : '';
        fetch(`${prefix}api/progress`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ team: this.getTeamName(), progress: this.challengeProgress })
        }).catch(() => {});
    },

    async syncServerProgress() {
        try {
            const prefix = window.location.pathname.includes('/challenges/') ? '../../' : '';
            const team = this.getTeamName();
            const res = await fetch(`${prefix}api/progress?team=${encodeURIComponent(team)}`, { cache: 'no-store' });
            if (res.ok) {
                const data = await res.json();
                if (data && Object.keys(data).length > 0) {
                    let hasChanges = false;
                    Object.keys(data).forEach(chId => {
                        if (data[chId]?.solved && !this.challengeProgress[chId]?.solved) {
                            this.challengeProgress[chId] = data[chId];
                            hasChanges = true;
                        }
                    });
                    if (hasChanges) {
                        const key = this.getProgressKey();
                        localStorage.setItem(key, JSON.stringify(this.challengeProgress));
                        if (typeof this.renderChallenges === 'function') this.renderChallenges();
                        if (typeof this.updateDashboardStats === 'function') this.updateDashboardStats();
                    }
                }
            }
        } catch(e) {}
    },

    getEasyMediumProgress() {
        if (typeof ChallengesDB === 'undefined' || !Array.isArray(ChallengesDB)) {
            return { total: 0, solved: 0, pct: 0, isUnlocked: false };
        }
        const list = ChallengesDB.filter(c => c.difficulty === 'easy' || c.difficulty === 'medium');
        const total = list.length;
        const solved = list.filter(c => this.challengeProgress[c.id]?.solved).length;
        const pct = total > 0 ? Math.round((solved / total) * 100) : 0;
        const isUnlocked = pct >= 40;
        return { total, solved, pct, isUnlocked };
    },

    checkAndTriggerBossActivation() {
        const { isUnlocked, pct } = this.getEasyMediumProgress();
        const team = this.getTeamName();
        const alertKey = `ai-odyssey-boss-alert-shown-${team}`;

        if (isUnlocked && localStorage.getItem(alertKey) !== 'true') {
            localStorage.setItem(alertKey, 'true');
            this.triggerBossActivationModal();
        }
    },

    triggerBossActivationModal() {
        if (document.getElementById('bossActivationOverlay')) return;

        const overlay = document.createElement('div');
        overlay.id = 'bossActivationOverlay';
        overlay.className = 'boss-activation-overlay';
        overlay.innerHTML = `
            <div class="boss-activation-modal glass">
                <div style="font-size: 3.5rem; margin-bottom: 0.5rem; animation: bounce 1s infinite;">🔥</div>
                <h1 style="color: #ff007f; text-shadow: 0 0 20px #ff007f; font-size: 2rem; margin: 0 0 0.5rem; letter-spacing: 2px;">
                    ⚡ BOSS LEVEL ACTIVATED! ⚡
                </h1>
                <p style="color: #ffd700; font-weight: 700; font-size: 1.1rem; margin-bottom: 0.75rem;">
                    🏆 40% Threshold Achieved! Master Arena Unlocked (1,000 PTS)
                </p>
                <p style="color: var(--text-secondary); line-height: 1.6; font-size: 0.95rem; margin-bottom: 1.25rem;">
                    Your team has proven exceptional debugging strength by clearing 40% of standard challenges! 
                    The <strong>Final Master Boss Arena</strong> is now accessible. Try your best to solve the Boss problem to claim 1,000 points and unlock the <em>Boss Slayer Buff</em>!
                </p>
                <div style="display: flex; gap: 0.75rem; justify-content: center; align-items: center;">
                    <button class="btn btn-primary glow" id="btnEnterBossArena" style="background: linear-gradient(135deg, #ff007f, #7b2ff7); padding: 0.75rem 2rem; font-weight: 800;">
                        ⚔️ ACCEPT BOSS CHALLENGE (1,000 PTS)
                    </button>
                    <button class="btn btn-secondary" id="btnDismissBossAlert">
                        ✕ Close (5s)
                    </button>
                </div>
                <div class="boss-countdown-bar" id="bossCountdownBar"></div>
            </div>
        `;
        document.body.appendChild(overlay);

        if (typeof AnimationManager !== 'undefined') {
            AnimationManager.createConfetti();
        }

        const dismiss = () => {
            const el = document.getElementById('bossActivationOverlay');
            if (el) el.remove();
        };

        const enterBtn = document.getElementById('btnEnterBossArena');
        if (enterBtn) {
            enterBtn.onclick = () => {
                dismiss();
                window.location.href = 'challenges/challenge66/index.html';
            };
        }

        const closeBtn = document.getElementById('btnDismissBossAlert');
        if (closeBtn) closeBtn.onclick = dismiss;

        // Auto-dismiss after 5 seconds
        setTimeout(dismiss, 5200);
    },

    showBossDefeatedCelebration(solverName, points = 1000) {
        const team = this.getTeamName();
        localStorage.setItem(`ai-odyssey-boss-slayer-buff-${team}`, 'true');

        const overlay = document.createElement('div');
        overlay.className = 'boss-activation-overlay';
        overlay.style.background = 'rgba(8, 6, 20, 0.97)';
        overlay.innerHTML = `
            <div class="boss-activation-modal glass" style="border-color: #ffd700; box-shadow: 0 0 60px rgba(255, 215, 0, 0.6);">
                <div style="font-size: 4rem; margin-bottom: 0.5rem;">👑</div>
                <h1 style="color: #ffd700; text-shadow: 0 0 25px #ffd700; font-size: 2.1rem; margin: 0 0 0.5rem; letter-spacing: 2px;">
                    YOU ARE A WORTHY OPPONENT!
                </h1>
                <h2 style="color: #00ff88; font-size: 1.3rem; margin: 0 0 1rem;">
                    🏆 FINAL ARENA BOSS DEFEATED BY ${solverName.toUpperCase()}! (+${points} PTS)
                </h2>
                <div style="background: rgba(0, 255, 136, 0.1); border: 1px solid #00ff88; border-radius: 12px; padding: 1rem; margin-bottom: 1.5rem; text-align: left;">
                    <strong style="color: #00ff88; font-size: 1rem;">⚡ SPECIAL BENEFIT ACTIVATED: "BOSS SLAYER BUFF"</strong>
                    <ul style="color: var(--text-primary); font-size: 0.85rem; margin: 0.5rem 0 0 1.25rem; line-height: 1.6;">
                        <li>🎯 -10% Problem Difficulty Reduction on all remaining Medium & Hard tasks</li>
                        <li>⏱ +2 Minutes Bonus Problem Time added to all challenge timers</li>
                        <li>💡 Free diagnostic hints unlocked without point penalties</li>
                    </ul>
                </div>
                <button class="btn btn-primary glow" onclick="this.closest('.boss-activation-overlay').remove()" style="padding: 0.75rem 2.5rem; font-weight: 800; background: #ffd700; color: #0a0a1a;">
                    🚀 CONTINUE DOMINATING THE ARENA
                </button>
            </div>
        `;
        document.body.appendChild(overlay);

        if (typeof AnimationManager !== 'undefined') {
            AnimationManager.createConfetti();
        }
    },

    renderChallenges() {
        const container = document.getElementById('challengesGrid');
        if (!container) return;

        container.innerHTML = '';

        const isStarted = this.isArenaStarted();
        const username = this.getUsername();
        const db = typeof ChallengesDB !== 'undefined' ? ChallengesDB : [];
        const orderedChallenges = typeof getShuffledChallenges === 'function' ? getShuffledChallenges(db, username) : db;

        const { pct, isUnlocked: isBossUnlocked } = this.getEasyMediumProgress();
        this.checkAndTriggerBossActivation();

        orderedChallenges.forEach(ch => {
            const progress = this.challengeProgress[ch.id] || { status: 'unlocked', solved: false };
            const isClosed = progress.solved || progress.status === 'expired' || progress.status === 'closed';
            const isBoss = ch.difficulty === 'boss';
            const isBossLocked = isBoss && !isBossUnlocked && !progress.solved;

            const card = document.createElement('div');
            card.className = `challenge-card glass ${ch.difficulty}`;
            card.dataset.category = (ch.category || '').toLowerCase();
            card.dataset.difficulty = ch.difficulty;
            
            if (isBoss) {
                card.classList.add(isBossLocked ? 'boss-locked' : 'boss-unlocked');
            }

            if (!isStarted || progress.status === 'locked' || isClosed || isBossLocked) card.classList.add('locked');
            if (progress.solved) card.classList.add('completed');

            // Unique per-user challenge title alias
            const displayTitle = typeof getPerUserChallengeTitle === 'function' ? getPerUserChallengeTitle(ch, username) : ch.title;

            // Solver badge
            let solverBadgeHtml = '';
            if (progress.solved) {
                const solver = progress.solvedBy || 'Team';
                const isMe = solver === this.getUsername();
                solverBadgeHtml = `<span class="challenge-status solved" style="font-weight: 700;">✓ Solved by ${isMe ? 'you' : solver}</span>`;
            } else if (!isStarted) {
                solverBadgeHtml = `<span class="challenge-status locked">🔒 Waiting for Admin</span>`;
            } else if (isClosed) {
                solverBadgeHtml = `<span class="challenge-status locked">🔒 Closed</span>`;
            } else if (isBossLocked) {
                solverBadgeHtml = `<span class="challenge-status locked" style="color:var(--accent-danger); border-color:var(--accent-danger); font-weight:700;">🔒 Req 40% Easy+Med (${pct}% done)</span>`;
            } else if (isBoss) {
                solverBadgeHtml = `<span class="challenge-status unlocked" style="color:#ff007f; font-weight:800; border-color:#ff007f;">🔥 BOSS UNLOCKED (1000 PTS)</span>`;
            } else {
                solverBadgeHtml = `<span class="challenge-status unlocked">🔓 Open (${ch.difficulty === 'easy' ? '5m' : ch.difficulty === 'medium' ? '7m' : '10m'})</span>`;
            }

            const pointsDisplay = isBoss ? '1,000 pts (BOSS)' : `${ch.points} pts`;

            card.innerHTML = `
                <div class="challenge-card-header">
                    <span class="challenge-number">#${String(ch.id).padStart(2, '0')}</span>
                    <span class="challenge-points" style="${isBoss ? 'color:#ffd700; font-weight:800;' : ''}">${pointsDisplay}</span>
                </div>
                <h3>${displayTitle}</h3>
                <p>${ch.description}</p>
                <div class="challenge-card-footer">
                    <span class="challenge-category">${ch.category}</span>
                    <span class="badge badge-${ch.difficulty}">${ch.difficulty}</span>
                    ${solverBadgeHtml}
                </div>
            `;

            card.addEventListener('click', () => {
                if (!isStarted) {
                    if (typeof AnimationManager !== 'undefined') {
                        AnimationManager.showToast('⚠️ Waiting for Administrator to start the 90-minute competition arena timer!', 'warning', 4500);
                    }
                    return;
                }
                if (isBossLocked) {
                    if (typeof AnimationManager !== 'undefined') {
                        AnimationManager.showToast(`🔥 BOSS LOCKED: Your team has solved ${pct}% of Easy & Medium challenges. Complete at least 40% to awaken the 1,000-Point Boss!`, 'warning', 6000);
                    }
                    return;
                }
                if (isClosed) {
                    if (typeof AnimationManager !== 'undefined') {
                        AnimationManager.showToast(`🔒 This challenge is already ${progress.solved ? 'solved by ' + (progress.solvedBy || 'team') : 'closed'}!`, 'info');
                    }
                    return;
                }
                if (progress.status === 'locked') {
                    if (typeof AnimationManager !== 'undefined') {
                        AnimationManager.showToast('🔒 Challenge is locked', 'warning');
                    }
                    return;
                }
                window.location.href = `challenges/challenge${String(ch.id).padStart(2, '0')}/index.html`;
            });

            container.appendChild(card);
        });

        this.updateDashboardStats();
    },

    updateDashboardStats() {
        if (typeof ChallengesDB === 'undefined') return;
        const stats = {
            total: ChallengesDB.length,
            solved: Object.values(this.challengeProgress).filter(p => p?.solved).length,
            points: 0,
            easy: 0,
            medium: 0,
            hard: 0
        };

        ChallengesDB.forEach(ch => {
            if (this.challengeProgress[ch.id]?.solved) {
                stats.points += (this.challengeProgress[ch.id].earnedPoints || ch.points);
                if (ch.difficulty === 'easy') stats.easy++;
                else if (ch.difficulty === 'medium') stats.medium++;
                else if (ch.difficulty === 'hard' || ch.difficulty === 'boss') stats.hard++;
            }
        });

        // Update stat displays
        document.querySelectorAll('[data-stat="solved"]').forEach(el => el.textContent = stats.solved);
        document.querySelectorAll('[data-stat="total"]').forEach(el => el.textContent = stats.total);
        document.querySelectorAll('[data-stat="points"]').forEach(el => el.textContent = stats.points);
        document.querySelectorAll('[data-stat="easy"]').forEach(el => el.textContent = stats.easy);
        document.querySelectorAll('[data-stat="medium"]').forEach(el => el.textContent = stats.medium);
        document.querySelectorAll('[data-stat="hard"]').forEach(el => el.textContent = stats.hard);

        const completion = stats.total > 0 ? Math.round((stats.solved / stats.total) * 100) : 0;
        document.querySelectorAll('[data-stat="progress"]').forEach(el => el.textContent = `${completion}%`);

        // Update Team Banner in Dashboard
        const teamNameDisplay = document.getElementById('teamNameDisplay');
        if (teamNameDisplay) teamNameDisplay.textContent = this.getTeamName();

        const activeMemberDisplay = document.getElementById('activeMemberDisplay');
        if (activeMemberDisplay) activeMemberDisplay.textContent = `👤 ${this.getUsername()} (You)`;

        const teamMembersList = document.getElementById('teamMembersList');
        if (teamMembersList) {
            teamMembersList.innerHTML = '';
            const members = this.getTeammates();
            members.forEach(m => {
                const memberSolves = Object.values(this.challengeProgress).filter(p => p?.solved && p?.solvedBy === m).length;
                const isMe = m === this.getUsername();
                const span = document.createElement('span');
                span.style.cssText = `
                    padding: 3px 10px;
                    border-radius: 12px;
                    font-size: 0.8rem;
                    font-weight: 600;
                    background: ${isMe ? 'rgba(0, 240, 255, 0.15)' : 'rgba(255, 255, 255, 0.06)'};
                    border: 1px solid ${isMe ? 'var(--accent-primary)' : 'var(--border-color)'};
                    color: ${isMe ? '#fff' : 'var(--text-secondary)'};
                `;
                span.textContent = `${isMe ? '★ ' : ''}${m}: ${memberSolves} solves`;
                teamMembersList.appendChild(span);
            });
        }
    },

    bindChallengeFilters() {
        const filterBtns = document.querySelectorAll('.filter-btn');
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                const filter = btn.dataset.filter;
                const cards = document.querySelectorAll('.challenge-card');
                
                cards.forEach(card => {
                    const cardCat = (card.dataset.category || '').toLowerCase();
                    const cardDiff = (card.dataset.difficulty || '').toLowerCase();
                    if (filter === 'all') {
                        card.style.display = 'block';
                    } else if (filter === 'easy' || filter === 'medium' || filter === 'hard') {
                        card.style.display = cardDiff === filter ? 'block' : 'none';
                    } else if (filter === 'web') {
                        card.style.display = (cardCat === 'web' || cardCat === 'html' || cardCat === 'css') ? 'block' : 'none';
                    } else if (filter === 'python' || filter === 'c' || filter === 'java' || filter === 'html' || filter === 'css' || filter === 'javascript' || filter === 'js') {
                        card.style.display = (cardCat === filter || (filter === 'javascript' && cardCat === 'js') || (filter === 'js' && cardCat === 'javascript')) ? 'block' : 'none';
                    } else if (filter === 'solved') {
                        card.style.display = card.classList.contains('completed') ? 'block' : 'none';
                    } else if (filter === 'unsolved') {
                        card.style.display = !card.classList.contains('completed') && !card.classList.contains('locked') ? 'block' : 'none';
                    }
                });
            });
        });
    },

    loadChallengePage() {
        // Extract challenge ID from URL
        const match = window.location.pathname.match(/challenge(\d+)/i);
        if (!match || typeof ChallengesDB === 'undefined') return;

        const id = parseInt(match[1]);
        const challenge = ChallengesDB.find(c => c.id === id);
        if (!challenge) return;

        // Check if challenge is already closed or solved — show message but do NOT redirect
        const progress = this.challengeProgress[id];
        if (progress && (progress.solved || progress.status === 'expired' || progress.status === 'closed')) {
            const teamMsg = progress.solved 
                ? `✅ Challenge already solved by ${progress.solvedBy || 'your team'}! (+${progress.earnedPoints || challenge.points} pts)` 
                : '🔒 This challenge has timed out for your team.';
            if (typeof AnimationManager !== 'undefined') {
                AnimationManager.showToast(teamMsg, 'info', 4000);
            }
            // Render but lock the form
            this.renderChallengePage(challenge);
            return;
        }

        this.renderChallengePage(challenge);
    },

    renderChallengePage(challenge) {
        const username = this.currentUser?.username || '';
        const displayTitle = typeof getPerUserChallengeTitle === 'function' ? getPerUserChallengeTitle(challenge, username) : challenge.title;

        // Update page title
        document.title = `Challenge ${challenge.id} - ${displayTitle} | CRISIS LAB`;

        // Fill in challenge details
        document.querySelectorAll('[data-challenge="title"]').forEach(el => el.textContent = displayTitle);
        document.querySelectorAll('[data-challenge="number"]').forEach(el => el.textContent = `#${String(challenge.id).padStart(2, '0')}`);
        document.querySelectorAll('[data-challenge="description"]').forEach(el => el.textContent = challenge.description);
        document.querySelectorAll('[data-challenge="objective"]').forEach(el => el.textContent = challenge.objective);
        document.querySelectorAll('[data-challenge="points"]').forEach(el => el.textContent = `${challenge.points} pts`);
        document.querySelectorAll('[data-challenge="language"]').forEach(el => {
            el.textContent = challenge.category || challenge.language || 'Code';
            el.className = `badge badge-category badge-${(challenge.category || '').toLowerCase()}`;
        });
        document.querySelectorAll('[data-challenge="language-name"]').forEach(el => el.textContent = challenge.category || challenge.language || 'Code');
        document.querySelectorAll('[data-challenge="difficulty"]').forEach(el => {
            el.textContent = challenge.difficulty.toUpperCase();
            el.className = `badge badge-${challenge.difficulty}`;
        });

        // Set error output
        document.querySelectorAll('[data-challenge="error"]').forEach(el => {
            el.textContent = challenge.errorOutput || 'No errors reported.';
        });

        // Render code editors
        this.renderCodeTabs(challenge);

        // Problem Timer & Solver Status
        const progress = this.challengeProgress[challenge.id];
        const solverBanner = document.getElementById('solverBanner');
        const displayEl = document.getElementById('problemTimerDisplay');

        if (progress && progress.solved) {
            if (solverBanner) {
                solverBanner.style.display = 'inline-flex';
                solverBanner.textContent = `✓ Solved by ${progress.solvedBy || 'your team'} (+${progress.earnedPoints || challenge.points} pts)`;
            }
            if (displayEl) {
                displayEl.textContent = '✓ Solved';
                displayEl.style.color = 'var(--accent-success, #30d158)';
            }
            const flagInput = document.getElementById('flagInput');
            if (flagInput) flagInput.disabled = true;
            const submitBtn = document.querySelector('#flagForm button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = `✓ Solved by ${progress.solvedBy || 'team'}`;
            }
        } else {
            if (solverBanner) solverBanner.style.display = 'none';
            // Start problem countdown timer (Easy=5m, Medium=7m, Hard=10m, Boss=15m)
            if (typeof TimerManager !== 'undefined' && typeof TimerManager.startProblemTimer === 'function') {
                const diff = challenge.difficulty === 'boss' ? 'boss' : challenge.difficulty;
                TimerManager.startProblemTimer(challenge.id, diff);
            }
        }

        // Bind hint buttons
        const hint1Btn = document.getElementById('hint1Btn');
        const hint2Btn = document.getElementById('hint2Btn');
        
        if (hint1Btn) {
            hint1Btn.onclick = () => this.showHint(challenge, 1);
        }
        if (hint2Btn) {
            hint2Btn.onclick = () => this.showHint(challenge, 2);
        }

        // Bind Visual Inspection & Image Upload Tool (Challenges 50 to 65 & UI)
        const uploadInput = document.getElementById('challengeImageUpload');
        const visualImg = document.getElementById('challengeVisualImg');
        const visualPlaceholder = document.getElementById('imagePlaceholder');

        if (uploadInput && visualImg) {
            uploadInput.onchange = (e) => {
                const file = e.target.files?.[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (loadEv) => {
                        visualImg.src = loadEv.target.result;
                        visualImg.style.display = 'block';
                        if (visualPlaceholder) visualPlaceholder.style.display = 'none';
                        if (typeof AnimationManager !== 'undefined') {
                            AnimationManager.showToast('🖼️ Inspection image uploaded successfully!', 'success', 3000);
                        }
                    };
                    reader.readAsDataURL(file);
                }
            };
        }

        // Initialize AI Coach for guided problem reasoning & anti-copy-paste coaching
        if (typeof AICoach !== 'undefined' && typeof AICoach.init === 'function') {
            AICoach.init(challenge);
        }
    },

    renderCodeTabs(challenge) {
        const tabsContainer = document.querySelector('.challenge-code-tabs');
        const codeContent = document.querySelector('.code-editor-content');
        const filenameEl = document.getElementById('codeFilename');
        if (!codeContent) return;

        const defaultFilename = challenge.filename || (challenge.category === 'Python' ? 'main.py' : challenge.category === 'C' ? 'solution.c' : 'Main.java');
        const programCode = challenge.code || challenge.brokenPython || challenge.brokenC || challenge.brokenJava || challenge.brokenJS || '';

        if (filenameEl) {
            filenameEl.textContent = defaultFilename;
        }

        if (tabsContainer) {
            tabsContainer.innerHTML = '';
            const tab = document.createElement('button');
            tab.className = 'code-tab active';
            tab.textContent = defaultFilename;
            tabsContainer.appendChild(tab);
        }

        codeContent.innerHTML = this.syntaxHighlight(programCode);
    },

    syntaxHighlight(code) {
        if (!code) return '';
        
        const escapeHtml = (text) => {
            return String(text)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;');
        };

        const keywords = new Set([
            'def','class','return','if','elif','else','for','while','in','import','from','as',
            'pass','break','continue','try','except','finally','raise','with','yield','lambda',
            'global','nonlocal','assert','async','await','public','private','protected','static',
            'final','abstract','void','struct','typedef','sizeof','const','switch','case','default',
            'do','enum','extern','goto','register','signed','union','unsigned','volatile',
            'function','let','var','new','this','typeof','instanceof','delete'
        ]);

        const types = new Set([
            'int','float','double','char','boolean','byte','short','long','String','Integer',
            'Double','Float','Boolean','List','ArrayList','Map','HashMap','Set','HashSet',
            'Object','Node','Thread','BankAccount','Vehicle','Car'
        ]);

        const constants = new Set(['True','False','true','false','None','null','NULL','undefined','NaN']);

        const builtins = new Set([
            'print','printf','scanf','malloc','free','len','range','append','remove','pop','insert',
            'System.out.println','System.out.print','console.log','console.error','document','window'
        ]);

        const lines = code.split('\n');
        return lines.map((line, idx) => {
            let html = '';
            const tokenRegex = /(\/\/.*|#.*|\/\*[\s\S]*?\*\/|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`|\b(?:def|class|return|if|elif|else|for|while|in|import|from|as|pass|break|continue|try|except|finally|raise|with|yield|lambda|global|nonlocal|assert|async|await|public|private|protected|static|final|abstract|void|int|float|double|char|boolean|byte|short|long|String|Integer|Double|Float|Boolean|List|ArrayList|Map|HashMap|Set|HashSet|Object|Node|Thread|BankAccount|Vehicle|Car|struct|typedef|sizeof|const|switch|case|default|do|enum|extern|goto|register|signed|union|unsigned|volatile|function|let|var|new|this|typeof|instanceof|delete)\b|\b(?:True|False|true|false|None|null|NULL|undefined|NaN)\b|\b(?:print|printf|scanf|malloc|free|len|range|append|remove|pop|insert|System\.out\.println|System\.out\.print|console\.log|console\.error|document|window)\b|\b\d+(?:\.\d+)?(?:f|d|L|l)?\b|[^\s\w]+|\w+|\s+)/g;

            let match;
            while ((match = tokenRegex.exec(line)) !== null) {
                const token = match[0];
                if (token.startsWith('//') || token.startsWith('#') || token.startsWith('/*')) {
                    html += `<span class="code-comment">${escapeHtml(token)}</span>`;
                } else if ((token.startsWith('"') && token.endsWith('"')) || 
                           (token.startsWith("'") && token.endsWith("'")) || 
                           (token.startsWith('`') && token.endsWith('`'))) {
                    html += `<span class="code-string">${escapeHtml(token)}</span>`;
                } else if (keywords.has(token)) {
                    html += `<span class="code-keyword">${escapeHtml(token)}</span>`;
                } else if (types.has(token)) {
                    html += `<span class="code-type">${escapeHtml(token)}</span>`;
                } else if (constants.has(token)) {
                    html += `<span class="code-constant">${escapeHtml(token)}</span>`;
                } else if (builtins.has(token)) {
                    html += `<span class="code-builtin">${escapeHtml(token)}</span>`;
                } else if (/^\d+(?:\.\d+)?(?:f|d|L|l)?$/.test(token)) {
                    html += `<span class="code-number">${escapeHtml(token)}</span>`;
                } else {
                    html += escapeHtml(token);
                }
            }

            const lineNum = idx + 1;
            return `<div class="code-line"><span class="line-num">${lineNum}</span><span class="line-code">${html || '&nbsp;'}</span></div>`;
        }).join('');
    },

    showHint(challenge, hintNum) {
        const hintContent = document.getElementById(`hint${hintNum}Content`);
        const hintBtn = document.getElementById(`hint${hintNum}Btn`);
        
        if (!hintContent || !hintBtn) return;

        const hint = hintNum === 1 ? challenge.hint1 : challenge.hint2;
        
        if (hintContent.classList.contains('visible')) {
            hintContent.classList.remove('visible');
        } else {
            hintContent.innerHTML = `<p>${hint}</p>`;
            hintContent.classList.add('visible');
            
            // Track hint usage once
            if (!this.challengeProgress[challenge.id]) {
                this.challengeProgress[challenge.id] = {
                    status: 'unlocked',
                    solved: false,
                    hintsUsed: 0,
                    time: null,
                    attempts: 0
                };
            }
            const progress = this.challengeProgress[challenge.id];
            if (!progress[`hint${hintNum}Used`]) {
                progress[`hint${hintNum}Used`] = true;
                progress.hintsUsed = (progress.hintsUsed || 0) + 1;
                this.saveChallengeProgress();
            }
            
            hintBtn.textContent = `Hint ${hintNum} (Used)`;
            hintBtn.style.borderColor = 'var(--accent-danger)';
            hintBtn.style.color = 'var(--accent-danger)';
        }
    },

    // ============================================
    // DEBUG FIX / CODE SUBMISSION
    // ============================================

    initFlagSubmission() {
        const flagForm = document.getElementById('flagForm') || document.getElementById('debugForm');
        if (flagForm) {
            flagForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const challengeId = parseInt(window.location.pathname.match(/challenge(\d+)/)?.[1]);
                if (isNaN(challengeId) || typeof ChallengesDB === 'undefined') return;
                const challenge = ChallengesDB.find(c => c.id === challengeId);
                if (challenge) {
                    await this.handleFlagSubmission(e, challenge);
                }
            });
        }
    },

    async handleFlagSubmission(e, challenge) {
        if (e) e.preventDefault();
        if (!challenge) return;
        
        const input = document.getElementById('flagInput') || document.getElementById('debugInput');
        if (!input) return;

        const submittedAnswer = input.value.trim();
        if (!submittedAnswer) {
            if (typeof AnimationManager !== 'undefined') {
                AnimationManager.showToast('Please enter a code fix to submit', 'warning');
            }
            return;
        }

        const remainingProblemMins = typeof TimerManager !== 'undefined' ? TimerManager.getRemainingProblemMinutes() : 0;
        const prefix = window.location.pathname.includes('/challenges/') ? '../../' : '';

        // 1. Authoritative Server-Side Answer Verification
        try {
            const submitRes = await fetch(`${prefix}api/challenge/submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    challengeId: challenge.id,
                    answer: submittedAnswer,
                    team: this.getTeamName(),
                    username: this.getUsername(),
                    sessionId: sessionStorage.getItem('ai-odyssey-session-id') || '',
                    remainingProblemMins: remainingProblemMins
                })
            });

            if (submitRes.ok) {
                const submitData = await submitRes.json();
                if (submitData.solved) {
                    await this.handleCorrectFlag(challenge, submitData.points);
                    return;
                } else {
                    this.handleWrongFlag(challenge);
                    if (submitData.message && typeof AnimationManager !== 'undefined') {
                        AnimationManager.showToast(`❌ ${submitData.message}`, 'error', 3000);
                    }
                    return;
                }
            } else if (submitRes.status === 403) {
                const errData = await submitRes.json().catch(() => ({}));
                const msg = errData.error || errData.message || 'Submission blocked.';
                // Check if it's arena-not-started error
                if (msg.toLowerCase().includes('not been started') || msg.toLowerCase().includes('wait for the administrator')) {
                    if (typeof AnimationManager !== 'undefined') {
                        AnimationManager.showToast('⏳ The Arena has NOT been started yet! Ask the Administrator to click "Start Arena" in the Admin Panel first.', 'warning', 8000);
                    }
                } else if (msg.toLowerCase().includes('lockdown')) {
                    if (typeof AnimationManager !== 'undefined') {
                        AnimationManager.showToast('🔒 Arena is in LOCKDOWN mode — submissions are temporarily blocked by the Administrator.', 'warning', 6000);
                    }
                } else if (msg.toLowerCase().includes('not active') || msg.toLowerCase().includes('approved')) {
                    if (typeof AnimationManager !== 'undefined') {
                        AnimationManager.showToast('⚠️ Your team is not yet approved. Please wait for the Admin to approve your team.', 'error', 6000);
                    }
                } else {
                    if (typeof AnimationManager !== 'undefined') {
                        AnimationManager.showToast(`🛡️ ${msg}`, 'warning', 5000);
                    }
                }
                return;
            } else if (submitRes.status === 429) {
                const errData = await submitRes.json().catch(() => ({}));
                if (typeof AnimationManager !== 'undefined') {
                    AnimationManager.showToast('🚦 Too many submissions! Please slow down and try again in a moment.', 'warning', 5000);
                }
                return;
            }
        } catch(err) {
            // Local fallback evaluation if offline
        }

        // 2. Offline / Local Evaluation Fallback
        const username = this.currentUser?.username || '';
        const expectedFlag = typeof generateUserFlag === 'function' ? generateUserFlag(challenge, username) : challenge.flag;

        const normalize = (str) => {
            if (!str) return '';
            let s = String(str).trim();
            s = s.replace(/^[`"']+|[`"']+$/g, '').replace(/;+$/, '').trim();
            s = s.replace(/\s*([=+\-*/%<>!&|^~?:,()\[\]{}]+)\s*/g, '$1');
            return s.toLowerCase();
        };

        const rawSubmitted = submittedAnswer.trim();
        const normSubmitted = normalize(rawSubmitted);
        const normSolution = normalize(challenge.solution);
        const normFlag = normalize(challenge.flag);
        const normExpectedFlag = normalize(expectedFlag);
        
        const acceptedAnswers = (challenge.acceptedAnswers || []).concat(
            (typeof ChallengeAcceptedAnswers !== 'undefined' && ChallengeAcceptedAnswers[challenge.id]) || []
        );

        const isCorrect = normSubmitted === normSolution ||
            normSubmitted === normFlag ||
            normSubmitted === normExpectedFlag ||
            rawSubmitted.toLowerCase() === (challenge.solution || '').trim().toLowerCase() ||
            acceptedAnswers.some(ans => {
                const normAns = normalize(ans);
                return normAns === normSubmitted || ans.trim().toLowerCase() === rawSubmitted.toLowerCase();
            });
        
        if (isCorrect) {
            await this.handleCorrectFlag(challenge);
        } else {
            this.handleWrongFlag(challenge);
        }
    },

    async handleCorrectFlag(challenge, serverAwardedPoints = null) {
        if (!this.challengeProgress[challenge.id]) {
            this.challengeProgress[challenge.id] = {
                status: 'unlocked',
                solved: false,
                hintsUsed: 0,
                time: null,
                attempts: 0
            };
        }
        const progress = this.challengeProgress[challenge.id];
        
        if (progress.solved) {
            if (typeof AnimationManager !== 'undefined') {
                AnimationManager.showToast('This challenge is already solved!', 'info');
            }
            return;
        }

        // Calculate points
        let points = serverAwardedPoints !== null ? serverAwardedPoints : challenge.points;
        
        // Problem Time Bonus (if calculated locally): +10 pts for every minute remaining on the problem timer!
        if (serverAwardedPoints === null) {
            const remainingProblemMins = typeof TimerManager !== 'undefined' ? TimerManager.getRemainingProblemMinutes() : 0;
            if (remainingProblemMins > 0) {
                points += (remainingProblemMins * 10);
            }
        }

        // Stop the problem timer since solved
        if (typeof TimerManager !== 'undefined' && typeof TimerManager.stopProblemTimer === 'function') {
            TimerManager.stopProblemTimer();
        }

        // First blood bonus (first solver tracked in localStorage)
        const firstBloodKey = `ai-odyssey-first-blood-${challenge.id}`;
        if (!localStorage.getItem(firstBloodKey)) {
            points += 25;
            localStorage.setItem(firstBloodKey, 'true');
            if (typeof AnimationManager !== 'undefined') {
                AnimationManager.showToast('🏆 FIRST BLOOD! +25 bonus points!', 'success');
            }
        }

        // No hint bonus
        if ((progress.hintsUsed || 0) === 0) {
            points += 20;
        }

        const solverName = this.getUsername();
        const teamName = this.getTeamName();

        // Update progress with solver attribution
        progress.solved = true;
        progress.solvedBy = solverName;
        progress.team = teamName;
        progress.status = 'solved';
        progress.time = new Date().toISOString();
        progress.earnedPoints = points;
        this.saveChallengeProgress();

        // Show success
        if (typeof AnimationManager !== 'undefined') {
            AnimationManager.showToast(`🎉 Correct! Challenge #${challenge.id} solved by ${solverName}! +${points} pts added to ${teamName}`, 'success', 5000);
            AnimationManager.createConfetti();
        }
        
        // Update UI
        const flagInput = document.getElementById('flagInput');
        if (flagInput) {
            flagInput.value = '';
            flagInput.disabled = true;
        }

        const submitBtn = document.querySelector('#flagForm button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = `✓ Solved by ${solverName}`;
        }
        
        const flagResult = document.getElementById('flagResult');
        if (flagResult) {
            flagResult.innerHTML = `
                <div class="success-message">
                    <span class="checkmark">✅</span>
                    <h3>Bug Fixed by ${solverName}!</h3>
                    <p>Score added to Team: <strong>${teamName}</strong> (+${points} pts)</p>
                    ${(progress.hintsUsed || 0) === 0 ? '<p>🏅 No hint bonus: +20</p>' : ''}
                    ${remainingProblemMins > 0 ? `<p>⏱ Problem Time bonus: +${remainingProblemMins * 10} pts</p>` : ''}
                </div>
            `;
        }

        const solverBanner = document.getElementById('solverBanner');
        if (solverBanner) {
            solverBanner.style.display = 'inline-flex';
            solverBanner.textContent = `✓ Solved by ${solverName} (+${points} pts)`;
        }

        this.updateDashboardStats();

        // Trigger Boss celebration if boss solved, or check if 40% threshold reached
        if (challenge.difficulty === 'boss') {
            this.showBossDefeatedCelebration(solverName, points);
        } else {
            this.checkAndTriggerBossActivation();
        }

        // Push score update to Supabase (if configured)
        await this.syncScoreToSupabase(challenge);
    },

    // Sync the current team's score to Supabase after solving a challenge
    async syncScoreToSupabase(challenge) {
        if (typeof SupabaseClient === 'undefined' || !SupabaseClient.ready) {
            return;
        }

        const currentUser = localStorage.getItem('ai-odyssey-current-user');
        if (!currentUser) return;

        try {
            const user = JSON.parse(currentUser);
            const team = user.team;
            if (!team) return;

            // Recompute the team's totals from challenge progress
            const stats = {
                total_points: 0,
                solved_count: 0,
                easy: 0,
                medium: 0,
                hard: 0
            };

            if (typeof ChallengesDB !== 'undefined') {
                ChallengesDB.forEach(ch => {
                    const progress = this.challengeProgress[ch.id];
                    if (progress?.solved) {
                        stats.total_points += progress.earnedPoints || ch.points;
                        stats.solved_count++;
                        if (ch.difficulty === 'easy') stats.easy++;
                        else if (ch.difficulty === 'medium') stats.medium++;
                        else if (ch.difficulty === 'hard' || ch.difficulty === 'boss') stats.hard++;
                    }
                });
            }

            const result = await SupabaseClient.updateScore(team, stats);
            
            if (result.success) {
                if (typeof AnimationManager !== 'undefined') {
                    AnimationManager.showToast('Score updated on leaderboard!', 'success');
                }
            } else {
                if (typeof AnimationManager !== 'undefined') {
                    AnimationManager.showToast(`Leaderboard sync: ${result.error}`, 'warning');
                }
            }
        } catch (e) {
            console.error('Error syncing score:', e);
        }
    },

    handleWrongFlag(challenge) {
        if (!this.challengeProgress[challenge.id]) {
            this.challengeProgress[challenge.id] = {
                status: 'unlocked',
                solved: false,
                hintsUsed: 0,
                time: null,
                attempts: 0
            };
        }
        const progress = this.challengeProgress[challenge.id];
        progress.attempts = (progress.attempts || 0) + 1;
        this.saveChallengeProgress();

        if (typeof AnimationManager !== 'undefined') {
            AnimationManager.showToast(`❌ Bug fix failed! Attempt ${progress.attempts}`, 'error');
        }
        
        const flagResult = document.getElementById('flagResult');
        if (flagResult) {
            flagResult.innerHTML = `
                <div class="error-message shake">
                    <p>❌ Incorrect fix! The bug remains unresolved.</p>
                    <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.25rem;">Check the single error output and hints. Attempts: ${progress.attempts}</p>
                </div>
            `;
        }
    },

    // ============================================
    // SCOREBOARD
    // ============================================

    initScoreboard() {
        // The scoreboard table is now rendered by scoreboard-supabase.js.
        // Keep only the search filter binding here.
        const searchInput = document.getElementById('scoreboardSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.filterScoreboard(e.target.value));
        }
    },

    filterScoreboard(query) {
        const rows = document.querySelectorAll('#scoreboardBody tr');
        const lowerQuery = query.toLowerCase();
        
        rows.forEach(row => {
            const teamName = row.querySelector('.team-name')?.textContent?.toLowerCase() || '';
            row.style.display = teamName.includes(lowerQuery) ? '' : 'none';
        });
    },

    // ============================================
    // ADMIN PANEL
    // ============================================

    initAdmin() {
        this.renderAdminPanel();
        
        const resetBtn = document.getElementById('resetEvent');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.resetEvent());
        }
        
        const exportBtn = document.getElementById('exportLeaderboard');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportLeaderboard());
        }
    },

    renderAdminPanel() {
        const challengeList = document.getElementById('adminChallengeList');
        if (!challengeList) return;

        challengeList.innerHTML = '';
        
        ChallengesDB.forEach(ch => {
            const progress = this.challengeProgress[ch.id] || { status: 'unlocked', solved: false };
            const item = document.createElement('div');
            item.className = 'admin-challenge-item';
            item.innerHTML = `
                <div class="challenge-info">
                    <span class="num">#${String(ch.id).padStart(2, '0')}</span>
                    <span class="name">${ch.title}</span>
                    <span class="badge badge-${ch.difficulty}">${ch.difficulty}</span>
                    <span class="badge">${ch.points}pts</span>
                    <span class="challenge-status ${progress.solved ? 'solved' : ''}">
                        ${progress.solved ? '✓' : progress.status === 'locked' ? '🔒' : '🔓'}
                    </span>
                </div>
                <div class="challenge-actions">
                    <button class="admin-btn" onclick="App.toggleChallengeLock(${ch.id})">
                        ${progress.status === 'locked' ? 'Unlock' : 'Lock'}
                    </button>
                    <button class="admin-btn success" onclick="App.editChallengePoints(${ch.id})">Edit Points</button>
                </div>
            `;
            challengeList.appendChild(item);
        });
    },

    toggleChallengeLock(id) {
        const progress = this.challengeProgress[id];
        if (progress) {
            progress.status = progress.status === 'locked' ? 'unlocked' : 'locked';
            progress.solved = false;
            this.saveChallengeProgress();
            this.renderAdminPanel();
            AnimationManager.showToast(`Challenge ${id} ${progress.status === 'locked' ? 'locked' : 'unlocked'}`, 'info');
        }
    },

    editChallengePoints(id) {
        const challenge = ChallengesDB.find(c => c.id === id);
        if (!challenge) return;
        
        const newPoints = prompt(`Enter new points for "${challenge.title}":`, challenge.points);
        if (newPoints && !isNaN(newPoints)) {
            challenge.points = parseInt(newPoints);
            AnimationManager.showToast(`Points updated to ${newPoints}`, 'success');
            this.renderAdminPanel();
        }
    },

    resetEvent() {
        if (confirm('Are you sure you want to reset the entire event? This will clear all progress.')) {
            localStorage.removeItem('ai-odyssey-progress');
            localStorage.removeItem('ai-odyssey-timer');
            this.loadChallengeProgress();
            this.renderAdminPanel();
            this.updateDashboardStats();
            AnimationManager.showToast('Event has been reset', 'info');
        }
    },

    exportLeaderboard() {
        const tbody = document.getElementById('scoreboardBody');
        if (!tbody) return;

        let csv = 'Rank,Team,Solved,Easy,Medium,Hard,Total Points,Time\n';
        
        const rows = tbody.querySelectorAll('tr');
        rows.forEach((row, index) => {
            const cells = row.querySelectorAll('td');
            const data = Array.from(cells).map(cell => cell.textContent.trim());
            csv += `${index + 1},${data.join(',')}\n`;
        });

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'ai-odyssey-leaderboard.csv';
        a.click();
        URL.revokeObjectURL(url);
        
        AnimationManager.showToast('Leaderboard exported!', 'success');
    },

    updateTeamStatusBanner() {
        const teamEl = document.getElementById('teamNameDisplay');
        const memberEl = document.getElementById('activeMemberDisplay');
        const membersListEl = document.getElementById('teamMembersList');
        if (!teamEl) return;

        const teamName = this.getTeamName();
        const activeMember = this.getUsername();
        const allMembers = this.getTeammates().slice(0, 3);

        teamEl.textContent = teamName;
        if (memberEl) memberEl.innerHTML = `👤 <strong>${activeMember}</strong> <span style="font-size:0.75rem; color:var(--accent-success);">(You)</span>`;

        if (membersListEl) {
            membersListEl.innerHTML = '';
            allMembers.forEach(m => {
                const isMe = m.toLowerCase() === activeMember.toLowerCase();
                const badge = document.createElement('span');
                badge.className = 'teammate-badge';
                badge.id = `presence-${m.toLowerCase()}`;
                badge.style.cssText = `
                    display: inline-flex; align-items: center; gap: 0.35rem;
                    padding: 3px 10px; border-radius: 12px; font-size: 0.8rem;
                    background: ${isMe ? 'rgba(0, 240, 255, 0.15)' : 'rgba(255, 255, 255, 0.05)'};
                    border: 1px solid ${isMe ? 'var(--accent-primary)' : 'rgba(255, 255, 255, 0.15)'};
                    color: ${isMe ? 'var(--accent-primary)' : 'var(--text-secondary)'};
                `;
                badge.innerHTML = `<span class="presence-dot" style="width:7px; height:7px; border-radius:50%; background:#30d158; display:inline-block;"></span> <strong>${m}</strong>${isMe ? ' (You)' : ''}`;
                membersListEl.appendChild(badge);
            });
        }
    },

    // ============================================
    // PROGRESS & REAL-TIME PRESENCE TRACKING
    // ============================================

    initProgressTracking() {
        this.updateDashboardStats();
        this.updateTeamStatusBanner();
        this.clientRevision = 0;

        const prefix = window.location.pathname.includes('/challenges/') ? '../../' : '';

        // Update connection status badge in UI if container exists
        const updateSyncIndicator = (status = 'connected', text = '') => {
            const badge = document.getElementById('connectionSyncBadge');
            if (!badge) return;
            if (status === 'connected') {
                badge.style.background = 'rgba(48, 209, 88, 0.15)';
                badge.style.borderColor = 'var(--accent-success)';
                badge.style.color = 'var(--accent-success)';
                badge.innerHTML = `<span class="presence-dot" style="background:#30d158; width:7px; height:7px; border-radius:50%; display:inline-block;"></span> ${text || 'Live Sync'}`;
            } else if (status === 'syncing') {
                badge.style.background = 'rgba(0, 240, 255, 0.15)';
                badge.style.borderColor = 'var(--accent-primary)';
                badge.style.color = 'var(--accent-primary)';
                badge.innerHTML = `<span class="presence-dot" style="background:#00f0ff; width:7px; height:7px; border-radius:50%; display:inline-block;"></span> Syncing...`;
            } else if (status === 'reconnecting') {
                badge.style.background = 'rgba(255, 69, 58, 0.15)';
                badge.style.borderColor = 'var(--accent-danger)';
                badge.style.color = 'var(--accent-danger)';
                badge.innerHTML = `<span class="presence-dot" style="background:#ff453a; width:7px; height:7px; border-radius:50%; display:inline-block;"></span> Reconnecting...`;
            }
        };

        // Central Pulse Sync (authoritative arena state, solves, presence, revision)
        const syncPulse = async (isForced = false) => {
            try {
                const team = this.getTeamName();
                const username = this.getUsername();
                if (!team) return;

                if (isForced) updateSyncIndicator('syncing');

                const res = await fetch(`${prefix}api/pulse?team=${encodeURIComponent(team)}&user=${encodeURIComponent(username)}`, { cache: 'no-store' });
                if (!res.ok) {
                    updateSyncIndicator('reconnecting');
                    return;
                }
                const pulse = await res.json();
                const serverRev = pulse.revision || pulse.arena?.version || 1;

                updateSyncIndicator('connected', `Live Sync (Rev #${serverRev})`);

                // 1. Central Arena Status Sync
                if (pulse.arena) {
                    this.serverArenaState = pulse.arena;
                    const startBanner = document.getElementById('startArenaBanner');
                    if (pulse.arena.status === 'STARTED') {
                        localStorage.setItem('ai-odyssey-global-arena-state', 'running');
                        if (startBanner) startBanner.style.display = 'none';
                        if (typeof TimerManager !== 'undefined' && pulse.arena.endTime) {
                            TimerManager.startCompetition(pulse.arena.endTime);
                        }
                    } else if (pulse.arena.status === 'STOPPED') {
                        localStorage.setItem('ai-odyssey-global-arena-state', 'stopped');
                        if (startBanner) startBanner.style.display = 'flex';
                    }
                }

                // 2. Disqualification & Deletion check
                if (pulse.teamStatus === 'disqualified') {
                    this.handleDisqualification();
                    return;
                } else if (pulse.teamStatus === 'deleted') {
                    if (typeof AnimationManager !== 'undefined') {
                        AnimationManager.showToast('⚠️ Your team has been removed by the competition administrator.', 'error', 6000);
                    }
                    this.logout();
                    return;
                }

                // 3. Team Solves Sync (Check if revision changed or forced)
                if (pulse.teamSolves && (isForced || serverRev !== this.clientRevision)) {
                    let hasNewSolve = false;
                    Object.keys(pulse.teamSolves).forEach(chId => {
                        const sp = pulse.teamSolves[chId];
                        const lp = this.challengeProgress[chId];
                        if (sp && sp.solved && (!lp || !lp.solved)) {
                            this.challengeProgress[chId] = sp;
                            hasNewSolve = true;
                            const solver = sp.solvedBy || 'A teammate';
                            const chObj = typeof ChallengesDB !== 'undefined' ? ChallengesDB.find(c => String(c.id) === String(chId)) : null;
                            const chTitle = chObj ? chObj.title : `Challenge #${chId}`;
                            const pts = sp.earnedPoints || (chObj ? chObj.points : 50);
                            if (typeof AnimationManager !== 'undefined') {
                                AnimationManager.showToast(`🎉 ${solver} just solved Challenge #${chId}: "${chTitle}" (+${pts} pts)!`, 'success', 6000);
                            }
                        }
                    });
                    if (hasNewSolve || isForced) {
                        const key = this.getProgressKey();
                        localStorage.setItem(key, JSON.stringify(this.challengeProgress));
                        this.renderChallenges();
                        this.updateDashboardStats();
                    }
                }

                // 4. Update presence member pills
                if (pulse.allMembers && pulse.allMembers.length > 0) {
                    const membersListEl = document.getElementById('teamMembersList');
                    if (membersListEl) {
                        const activeList = pulse.activeMembers || [];
                        membersListEl.innerHTML = '';
                        pulse.allMembers.forEach(m => {
                            const isMe = m.toLowerCase() === this.getUsername().toLowerCase();
                            const isOnline = activeList.some(am => am.toLowerCase() === m.toLowerCase()) || isMe;
                            const badge = document.createElement('span');
                            badge.className = 'teammate-badge';
                            badge.style.cssText = `
                                display: inline-flex; align-items: center; gap: 0.35rem;
                                padding: 3px 10px; border-radius: 12px; font-size: 0.8rem;
                                background: ${isOnline ? (isMe ? 'rgba(0, 240, 255, 0.15)' : 'rgba(48, 209, 88, 0.1)') : 'rgba(255, 255, 255, 0.03)'};
                                border: 1px solid ${isOnline ? (isMe ? 'var(--accent-primary)' : 'var(--accent-success)') : 'rgba(255, 255, 255, 0.1)'};
                                color: ${isOnline ? (isMe ? 'var(--accent-primary)' : '#fff') : 'var(--text-muted)'};
                            `;
                            badge.innerHTML = `<span class="presence-dot" style="width:7px; height:7px; border-radius:50%; background:${isOnline ? '#30d158' : '#666'}; display:inline-block;"></span> <strong>${m}</strong>${isMe ? ' (You)' : isOnline ? ' (Active)' : ''}`;
                            membersListEl.appendChild(badge);
                        });
                    }
                }

                // 5. Live Broadcast Announcement
                if (pulse.broadcast && pulse.broadcast.message) {
                    const lastMsg = sessionStorage.getItem('ai-odyssey-last-broadcast');
                    if (lastMsg !== pulse.broadcast.message) {
                        sessionStorage.setItem('ai-odyssey-last-broadcast', pulse.broadcast.message);
                        if (typeof AnimationManager !== 'undefined') {
                            AnimationManager.showToast(`📢 ADMIN ANNOUNCEMENT: ${pulse.broadcast.message}`, 'warning', 8000);
                        }
                    }
                }

                this.clientRevision = serverRev;
            } catch(e) {
                updateSyncIndicator('reconnecting');
            }
        };

        // Instant initial load
        syncPulse(true);

        // Continuous high-frequency pulse (every 2.5s)
        setInterval(() => syncPulse(false), 2500);

        // Instant reconnection & focus synchronization
        window.addEventListener('online', () => {
            if (typeof AnimationManager !== 'undefined') {
                AnimationManager.showToast('📶 Connection Restored: Synchronizing state...', 'info', 3000);
            }
            syncPulse(true);
        });

        window.addEventListener('offline', () => {
            updateSyncIndicator('reconnecting');
        });

        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                syncPulse(true);
            }
        });

        // Real-time synchronization across teammates & local tabs
        window.addEventListener('storage', (e) => {
            if (e.key === 'ai-odyssey-live-broadcast' && e.newValue) {
                try {
                    const data = JSON.parse(e.newValue);
                    if (typeof AnimationManager !== 'undefined') {
                        AnimationManager.showToast(`📢 ADMIN ANNOUNCEMENT: ${data.message}`, 'warning', 8000);
                    }
                } catch(err) {}
            }
            if (e.key && e.key.includes('ai-odyssey-progress-team')) {
                this.loadChallengeProgress();
                this.renderChallenges();
                this.updateDashboardStats();
                if (typeof AnimationManager !== 'undefined') {
                    AnimationManager.showToast('🔔 Live update: A teammate just solved a challenge!', 'info', 3500);
                }
            }
            if (e.key === 'ai-odyssey-global-arena-state' || e.key === 'ai-odyssey-timer-sync-event') {
                this.bindStartArenaButton();
            }
        });

        window.addEventListener('arena:started', () => {
            const startBanner = document.getElementById('startArenaBanner');
            if (startBanner) startBanner.style.display = 'none';
        });
    }
};

// Initialize app on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => App.init());
} else {
    App.init();
}

