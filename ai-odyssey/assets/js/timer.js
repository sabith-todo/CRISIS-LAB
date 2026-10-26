/* ============================================
   CRISIS LAB / AI ODYSSEY - Dual-Timer Manager
   1. Global 90-Minute Competition Arena Timer
   2. Problem-Specific Countdown Timer (Easy=5m, Medium=7m, Hard=10m)
   Supports Real-Time Multi-Device LAN Synchronization via /api/timer
   ============================================ */

const TimerManager = {
    TOTAL_ARENA_SECONDS: 90 * 60, // 90 minutes = 5400 seconds
    lastServerVersion: -1,
    syncInterval: null,

    // Difficulty-based problem duration (in seconds)
    PROBLEM_DURATIONS: {
        easy: 5 * 60,      // 5 minutes = 300 seconds
        medium: 7 * 60,    // 7 minutes = 420 seconds
        hard: 10 * 60,     // 10 minutes = 600 seconds
        boss: 10 * 60      // 10 minutes = 600 seconds
    },

    // --- Arena State ---
    arena: {
        remaining: 90 * 60,
        isRunning: false,
        isPaused: false,
        interval: null,
    },

    // --- Problem State ---
    problem: {
        challengeId: null,
        difficulty: 'easy',
        totalSeconds: 300,
        remaining: 300,
        isRunning: false,
        isPaused: false,
        interval: null,
    },

    init() {
        this.arena.remaining = this.TOTAL_ARENA_SECONDS;
        this.arena.isRunning = false;
        this.arena.isPaused = false;
        this.bindEvents();
        this.updateArenaDisplay();
        this.startNetworkSync();
    },

    getApiUrl(endpoint) {
        const clean = endpoint.replace(/^\//, '');
        if (typeof window !== 'undefined') {
            if (window.location.protocol === 'http:' || window.location.protocol === 'https:') {
                return `${window.location.origin}/${clean}`;
            }
            return `http://localhost:3000/${clean}`;
        }
        return `/${clean}`;
    },

    // Multi-Device LAN Polling (Sync with Server every 1.5s)
    startNetworkSync() {
        if (this.syncInterval) clearInterval(this.syncInterval);

        const syncWithServer = async () => {
            try {
                const url = this.getApiUrl('api/timer');
                const res = await fetch(url, { cache: 'no-store' });
                if (!res.ok) return;
                const data = await res.json();

                if (!data || !data.state) return;

                if (data.state === 'running' && data.endTime) {
                    const diff = Math.max(0, Math.floor((data.endTime - Date.now()) / 1000));
                    if (diff > 0) {
                        // Only adjust remaining if drift > 2 seconds to avoid visual stutter
                        if (!this.arena.isRunning || Math.abs(this.arena.remaining - diff) > 2) {
                            this.arena.remaining = diff;
                        }
                        this.arena.isRunning = true;
                        this.arena.isPaused = false;

                        if (!this.arena.interval) {
                            this.arena.interval = setInterval(() => {
                                if (this.arena.remaining > 0 && this.arena.isRunning && !this.arena.isPaused) {
                                    this.arena.remaining--;
                                    this.updateArenaDisplay();
                                } else if (this.arena.remaining <= 0) {
                                    this.arena.remaining = 0;
                                    this.arena.isRunning = false;
                                    clearInterval(this.arena.interval);
                                    this.arena.interval = null;
                                    this.updateArenaDisplay();
                                    this.onArenaTimeUp();
                                }
                            }, 1000);
                        }

                        this.updateArenaDisplay();
                        window.dispatchEvent(new CustomEvent('arena:started'));
                        const startBanner = document.getElementById('startArenaBanner');
                        if (startBanner) startBanner.style.display = 'none';
                    } else {
                        this.arena.remaining = 0;
                        this.arena.isRunning = false;
                        this.arena.isPaused = false;
                        if (this.arena.interval) { clearInterval(this.arena.interval); this.arena.interval = null; }
                        this.updateArenaDisplay();
                    }
                } else if (data.state === 'paused') {
                    this.arena.remaining = (data.remaining !== undefined) ? data.remaining : this.arena.remaining;
                    this.arena.isRunning = false;
                    this.arena.isPaused = true;
                    if (this.arena.interval) { clearInterval(this.arena.interval); this.arena.interval = null; }
                    this.updateArenaDisplay();
                } else if (data.state === 'stopped') {
                    this.arena.remaining = (data.remaining !== undefined) ? data.remaining : (this.arena.remaining || 5400);
                    this.arena.isRunning = false;
                    this.arena.isPaused = false;
                    if (this.arena.interval) { clearInterval(this.arena.interval); this.arena.interval = null; }
                    this.updateArenaDisplay();
                }
            } catch(e) {
                // Offline network fallback
            }
        };

        syncWithServer();
        this.syncInterval = setInterval(syncWithServer, 1500);

        window.addEventListener('online', () => syncWithServer());
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) syncWithServer();
        });
    },

    bindEvents() {
        document.addEventListener('timer:start', () => this.startCompetition());
        document.addEventListener('timer:stop', () => this.stopArena());
        document.addEventListener('timer:pause', () => this.pauseCompetition());
        document.addEventListener('timer:reset', () => this.resetCompetition());

        // Real-time synchronization across local browser tabs
        window.addEventListener('storage', (e) => {
            if (e.key === 'ai-odyssey-timer-sync-event' && e.newValue) {
                try {
                    const data = JSON.parse(e.newValue);
                    this.handleSyncEvent(data);
                } catch(err) {}
            }
            if (e.key === 'ai-odyssey-global-arena-state') {
                this.loadArenaState();
            }
        });
    },

    handleSyncEvent(data) {
        if (!data || !data.action) return;

        if (data.action === 'pause') {
            this.pauseCompetition(data.remaining);
        } else if (data.action === 'resume' || data.action === 'start') {
            this.resumeCompetition(data.endTime, data.remaining);
        } else if (data.action === 'reset') {
            this.resetCompetition();
        } else if (data.action === 'extend') {
            this.loadArenaState();
        }
    },

    getTeamName() {
        const currentUserStr = localStorage.getItem('ai-odyssey-current-user');
        let team = 'Team Alpha';
        if (currentUserStr) {
            try { 
                const u = JSON.parse(currentUserStr);
                team = u.team || u.username || 'Team Alpha'; 
            } catch(e) {}
        }
        return team;
    },

    getUsername() {
        const currentUserStr = localStorage.getItem('ai-odyssey-current-user');
        let username = 'player1';
        if (currentUserStr) {
            try { 
                const u = JSON.parse(currentUserStr);
                username = u.username || 'player1'; 
            } catch(e) {}
        }
        return username;
    },

    getArenaEndKey() {
        return `ai-odyssey-arena-end-${this.getTeamName()}`;
    },

    getArenaStartKey() {
        return `ai-odyssey-arena-started-${this.getTeamName()}`;
    },

    isArenaStarted() {
        // Use server-authoritative in-memory state — NOT localStorage
        return this.arena.isRunning || this.arena.isPaused;
    },

    isGlobalRunning() {
        return this.arena.isRunning && !this.arena.isPaused;
    },

    isGlobalPaused() {
        return this.arena.isPaused;
    },

    // ============================================
    // 1. GLOBAL 90-MINUTE ARENA TIMER (ADMIN-CONTROLLED)
    // ============================================

    loadArenaState() {
        // No-op: server-authoritative state is loaded via startNetworkSync() polling.
        // We do NOT read localStorage to determine arena state.
        this.updateArenaDisplay();
    },

    startCompetition(explicitEndTime) {
        // Frontend no longer controls the arena start — admin.js calls /api/admin/arena/start.
        // This method is kept for backwards-compatibility with any direct dispatched events.
        const endTimestamp = explicitEndTime || (Date.now() + this.TOTAL_ARENA_SECONDS * 1000);
        this.arena.remaining = Math.max(0, Math.floor((endTimestamp - Date.now()) / 1000));
        this.arena.isRunning = true;
        this.arena.isPaused = false;
        this.startArena();
    },

    startArena() {
        if (this.arena.interval) {
            clearInterval(this.arena.interval);
        }
        this.arena.isRunning = true;
        this.arena.isPaused = false;

        this.tickArena();
        this.arena.interval = setInterval(() => {
            this.tickArena();
        }, 1000);
    },

    tickArena() {
        // Check paused state using in-memory flag (set by startNetworkSync)
        if (this.arena.isPaused) {
            if (this.arena.interval) {
                clearInterval(this.arena.interval);
                this.arena.interval = null;
            }
            this.arena.isRunning = false;
            this.updateArenaDisplay();
            return;
        }

        // Decrement locally; startNetworkSync re-syncs with server every 1.5s
        this.arena.remaining = Math.max(0, this.arena.remaining - 1);

        this.updateArenaDisplay();

        if (this.arena.remaining <= 0) {
            this.arena.remaining = 0;
            this.stopArena();
            this.onArenaTimeUp();
        }
    },

    pauseCompetition(explicitRemaining) {
        this.arena.isRunning = false;
        this.arena.isPaused = true;

        if (this.arena.interval) {
            clearInterval(this.arena.interval);
            this.arena.interval = null;
        }

        if (explicitRemaining !== undefined && !isNaN(explicitRemaining)) {
            this.arena.remaining = Math.max(0, explicitRemaining);
        }

        // Pause problem timer as well
        this.pauseProblemTimer();
        this.updateArenaDisplay();
    },

    resumeCompetition(newEndTime, remainingSec) {
        this.arena.isPaused = false;
        this.arena.isRunning = true;

        if (newEndTime) {
            this.arena.remaining = Math.max(0, Math.floor((newEndTime - Date.now()) / 1000));
        } else if (remainingSec) {
            this.arena.remaining = remainingSec;
        }

        this.startArena();
        this.resumeProblemTimer();
    },

    stopArena() {
        this.arena.isRunning = false;
        this.arena.isPaused = false;
        if (this.arena.interval) {
            clearInterval(this.arena.interval);
            this.arena.interval = null;
        }
        this.stopProblemTimer();
    },

    resetCompetition() {
        this.stopArena();
        this.stopProblemTimer();
        this.arena.remaining = this.TOTAL_ARENA_SECONDS;
        this.arena.isRunning = false;
        this.arena.isPaused = false;
        this.updateArenaDisplay();
        this.updateProblemTimerDisplay();
        window.dispatchEvent(new CustomEvent('arena:reset'));
    },

    formatTime(totalSec) {
        const total = Math.max(0, totalSec);
        const hours = Math.floor(total / 3600);
        const minutes = Math.floor((total % 3600) / 60);
        const seconds = total % 60;
        const pad = (n) => String(n).padStart(2, '0');

        if (hours > 0) {
            return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
        }
        return `${pad(minutes)}:${pad(seconds)}`;
    },

    getFormattedArenaTime() {
        return this.formatTime(this.arena.remaining);
    },

    getRemainingArenaMinutes() {
        return Math.max(0, Math.floor(this.arena.remaining / 60));
    },

    updateArenaDisplay() {
        const displays = document.querySelectorAll('.timer-display, #timerDisplay, #adminHeaderTimerDisplay');
        const statusBadge = document.getElementById('adminTimerStatusBadge');
        const startBanner = document.getElementById('startArenaBanner');

        // Use ONLY server-authoritative in-memory state (set by startNetworkSync)
        const isRunning = this.arena.isRunning && !this.arena.isPaused;
        const isPaused = this.arena.isPaused;
        const isStarted = isRunning || isPaused;
        const formatted = this.getFormattedArenaTime();

        if (statusBadge) {
            if (isPaused) {
                statusBadge.className = 'badge badge-warning';
                statusBadge.textContent = '⏸ PAUSED';
            } else if (isRunning) {
                statusBadge.className = 'badge badge-easy';
                statusBadge.textContent = '🟢 RUNNING';
            } else {
                statusBadge.className = 'badge badge-hard';
                statusBadge.textContent = '🔴 STOPPED';
            }
        }

        const unpauseHeader = document.getElementById('btnHeaderUnpauseTimer');
        const pauseHeader = document.getElementById('btnHeaderPauseTimer');
        const startHeader = document.getElementById('btnHeaderStartTimer');
        const unpauseAdmin = document.getElementById('btnAdminUnpauseTimer');
        const pauseAdmin = document.getElementById('btnAdminPauseTimer');
        const startAdmin = document.getElementById('btnAdminStartTimer');

        if (isPaused) {
            if (unpauseHeader) unpauseHeader.style.display = 'inline-flex';
            if (pauseHeader) pauseHeader.style.display = 'none';
            if (startHeader) startHeader.style.display = 'none';
            if (unpauseAdmin) unpauseAdmin.style.display = 'inline-flex';
            if (pauseAdmin) pauseAdmin.style.display = 'none';
            if (startAdmin) startAdmin.style.display = 'none';
        } else if (isRunning) {
            if (unpauseHeader) unpauseHeader.style.display = 'none';
            if (pauseHeader) pauseHeader.style.display = 'inline-flex';
            if (startHeader) startHeader.style.display = 'none';
            if (unpauseAdmin) unpauseAdmin.style.display = 'none';
            if (pauseAdmin) pauseAdmin.style.display = 'inline-flex';
            if (startAdmin) startAdmin.style.display = 'none';
        } else {
            // STOPPED (initial 90m start)
            if (unpauseHeader) unpauseHeader.style.display = 'none';
            if (pauseHeader) pauseHeader.style.display = 'none';
            if (startHeader) startHeader.style.display = 'inline-flex';
            if (unpauseAdmin) unpauseAdmin.style.display = 'none';
            if (pauseAdmin) pauseAdmin.style.display = 'none';
            if (startAdmin) startAdmin.style.display = 'inline-flex';
        }

        if (startBanner) {
            startBanner.style.display = isRunning ? 'none' : '';
        }

        if (!displays || displays.length === 0) return;

        displays.forEach(display => {
            display.classList.remove('warning', 'danger', 'pulse-danger', 'paused');

            if (isPaused) {
                display.textContent = `⏸ ${formatted} (PAUSED)`;
                display.classList.add('warning', 'paused');
                display.style.borderColor = 'var(--accent-warning, #ffd700)';
                display.style.color = 'var(--accent-warning, #ffd700)';
            } else if (!isStarted) {
                display.textContent = `⏱ ${formatted}`;
                display.style.borderColor = '';
                display.style.color = '';
            } else {
                display.textContent = `⏱ ${formatted}`;
                display.style.borderColor = '';
                display.style.color = '';

                if (this.arena.remaining <= 300) {
                    display.classList.add('danger', 'pulse-danger');
                } else if (this.arena.remaining <= 900) {
                    display.classList.add('warning');
                }
            }
        });
    },

    onArenaTimeUp() {
        if (typeof AnimationManager !== 'undefined') {
            AnimationManager.showToast('⏱ 90-Minute Arena Concluded! Competition is closed.', 'error', 6000);
        }
        document.dispatchEvent(new CustomEvent('timer:timeup'));

        const flagForm = document.getElementById('flagForm') || document.getElementById('debugForm');
        if (flagForm) {
            const btn = flagForm.querySelector('button[type="submit"]');
            const input = flagForm.querySelector('input');
            if (btn) { btn.disabled = true; btn.textContent = '🔒 Arena Time Expired'; }
            if (input) { input.disabled = true; }
        }
    },

    // ============================================
    // 2. PROBLEM TIMER (BASED ON DIFFICULTY)
    // ============================================

    getProblemTimerKey(challengeId) {
        return `ai-odyssey-problem-timer-${this.getTeamName()}-${challengeId}`;
    },

    startProblemTimer(challengeId, difficulty = 'easy') {
        this.stopProblemTimer();

        this.problem.challengeId = challengeId;
        this.problem.difficulty = (difficulty || 'easy').toLowerCase();
        let total = this.PROBLEM_DURATIONS[this.problem.difficulty] || (5 * 60);

        // Check for Boss Slayer Buff (+2 minutes bonus problem time)
        let team = 'default';
        try {
            const user = JSON.parse(localStorage.getItem('ai-odyssey-current-user') || '{}');
            if (user.team) team = user.team;
        } catch(e) {}
        if (localStorage.getItem(`ai-odyssey-boss-slayer-buff-${team}`) === 'true') {
            total += 120; // +2m bonus!
        }
        this.problem.totalSeconds = total;

        if (this.isGlobalPaused()) {
            this.problem.isPaused = true;
            this.problem.remaining = total;
            this.updateProblemTimerDisplay();
            return;
        }

        const key = this.getProblemTimerKey(challengeId);
        const savedEndTime = localStorage.getItem(key);

        let endTimestamp;
        if (savedEndTime) {
            endTimestamp = parseInt(savedEndTime, 10);
            const remaining = Math.floor((endTimestamp - Date.now()) / 1000);
            if (remaining > 0) {
                this.problem.remaining = remaining;
            } else {
                this.problem.remaining = 0;
                this.updateProblemTimerDisplay();
                this.onProblemTimeUp(challengeId);
                return;
            }
        } else {
            endTimestamp = Date.now() + (total * 1000);
            localStorage.setItem(key, String(endTimestamp));
            this.problem.remaining = total;
        }

        this.problem.isRunning = true;
        this.problem.isPaused = false;
        this.updateProblemTimerDisplay();

        this.problem.interval = setInterval(() => {
            if (this.isGlobalPaused() || this.problem.isPaused) return;

            const currentSaved = localStorage.getItem(key);
            if (currentSaved) {
                const targetEnd = parseInt(currentSaved, 10);
                this.problem.remaining = Math.max(0, Math.floor((targetEnd - Date.now()) / 1000));
            } else {
                this.problem.remaining = Math.max(0, this.problem.remaining - 1);
            }

            this.updateProblemTimerDisplay();

            if (this.problem.remaining <= 0) {
                this.problem.remaining = 0;
                this.stopProblemTimer();
                this.onProblemTimeUp(challengeId);
            }
        }, 1000);
    },

    pauseProblemTimer() {
        this.problem.isPaused = true;
        this.problem.isRunning = false;
        if (this.problem.interval) {
            clearInterval(this.problem.interval);
            this.problem.interval = null;
        }
        this.updateProblemTimerDisplay();
    },

    resumeProblemTimer() {
        if (this.problem.challengeId) {
            const key = this.getProblemTimerKey(this.problem.challengeId);
            const newEnd = Date.now() + (this.problem.remaining * 1000);
            localStorage.setItem(key, String(newEnd));
            this.problem.isRunning = true;
            this.problem.isPaused = false;

            this.problem.interval = setInterval(() => {
                if (this.isGlobalPaused() || this.problem.isPaused) return;

                const currentSaved = localStorage.getItem(key);
                if (currentSaved) {
                    const targetEnd = parseInt(currentSaved, 10);
                    this.problem.remaining = Math.max(0, Math.floor((targetEnd - Date.now()) / 1000));
                } else {
                    this.problem.remaining = Math.max(0, this.problem.remaining - 1);
                }

                this.updateProblemTimerDisplay();

                if (this.problem.remaining <= 0) {
                    this.problem.remaining = 0;
                    this.stopProblemTimer();
                    this.onProblemTimeUp(this.problem.challengeId);
                }
            }, 1000);
        }
    },

    stopProblemTimer() {
        this.problem.isRunning = false;
        this.problem.isPaused = false;
        if (this.problem.interval) {
            clearInterval(this.problem.interval);
            this.problem.interval = null;
        }
    },

    getRemainingProblemMinutes() {
        return Math.max(0, Math.floor(this.problem.remaining / 60));
    },

    getRemainingProblemSeconds() {
        return Math.max(0, this.problem.remaining);
    },

    updateProblemTimerDisplay() {
        const displayEl = document.getElementById('problemTimerDisplay');
        const badgeEl = document.getElementById('problemTimerBadge');
        if (!displayEl) return;

        const formatted = this.formatTime(this.problem.remaining);
        
        if (this.problem.isPaused || this.isGlobalPaused()) {
            displayEl.textContent = `${formatted} (PAUSED)`;
            displayEl.style.color = 'var(--accent-warning, #ff9500)';
            if (badgeEl) {
                badgeEl.classList.add('warning');
                badgeEl.classList.remove('danger', 'pulse-danger');
            }
            return;
        }

        displayEl.textContent = formatted;

        if (badgeEl) {
            badgeEl.classList.remove('warning', 'danger', 'pulse-danger');
            if (this.problem.remaining <= 60) {
                badgeEl.classList.add('danger', 'pulse-danger');
                displayEl.style.color = 'var(--accent-danger, #ff3b30)';
            } else if (this.problem.remaining <= 120) {
                badgeEl.classList.add('warning');
                displayEl.style.color = 'var(--accent-warning, #ff9500)';
            } else {
                displayEl.style.color = 'var(--accent-primary, #00f0ff)';
            }
        }
    },

    onProblemTimeUp(challengeId) {
        if (typeof AnimationManager !== 'undefined') {
            AnimationManager.showToast(`⏱ Problem Time Expired for Challenge #${challengeId}!`, 'warning', 4500);
        }

        const displayEl = document.getElementById('problemTimerDisplay');
        if (displayEl) {
            displayEl.textContent = '00:00 (Time Up)';
            displayEl.style.color = 'var(--accent-danger, #ff3b30)';
        }

        if (typeof App !== 'undefined' && typeof App.handleProblemTimeout === 'function') {
            App.handleProblemTimeout(challengeId);
        }
    }
};

if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => TimerManager.init());
    } else {
        TimerManager.init();
    }
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TimerManager;
}
