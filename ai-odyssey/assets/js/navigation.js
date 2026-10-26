/* ==============================================================================
   CRISIS LAB — Navigation & Dynamic User Controls Manager
   ============================================================================== */

// Universal Global Logout Handler
window.globalLogout = function() {
    let currentUser = null;
    try {
        const raw = localStorage.getItem('ai-odyssey-current-user');
        if (raw) currentUser = JSON.parse(raw);
    } catch(e) {}

    const sessionId = sessionStorage.getItem('ai-odyssey-session-id') || currentUser?.sessionId;
    if (currentUser && currentUser.username) {
        const prefix = window.location.pathname.includes('/challenges/') ? '../../' : '';
        fetch(`${prefix}api/session/logout`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: currentUser.username, sessionId: sessionId })
        }).catch(() => {});
    }

    localStorage.removeItem('ai-odyssey-current-user');
    sessionStorage.removeItem('ai-odyssey-admin-auth');
    sessionStorage.removeItem('ai-odyssey-session-id');

    if (typeof TimerManager !== 'undefined' && typeof TimerManager.stopArena === 'function') {
        TimerManager.stopArena();
    }

    if (typeof AnimationManager !== 'undefined' && typeof AnimationManager.showToast === 'function') {
        AnimationManager.showToast('Logged out successfully', 'info');
    }

    const isChallengePage = window.location.pathname.includes('/challenges/');
    window.location.href = isChallengePage ? '../../index.html' : 'index.html';
};

window.App = window.App || {};
window.App.logout = window.globalLogout;

const Navigation = {
    init() {
        this.navbar = document.getElementById('navbar');
        this.menuToggle = document.getElementById('menuToggle');
        this.navLinks = document.getElementById('navLinks');
        this.navControls = document.getElementById('navControls') || document.querySelector('.nav-controls');
        
        this.bindEvents();
        this.setActiveLink();
        this.renderUserControls();
        this.handleScroll();
        this.startSessionHeartbeat();
    },

    bindEvents() {
        // Mobile menu toggle
        if (this.menuToggle && this.navLinks) {
            this.menuToggle.addEventListener('click', () => {
                this.menuToggle.classList.toggle('active');
                this.navLinks.classList.toggle('active');
            });

            // Close menu on link click
            this.navLinks.querySelectorAll('.nav-link').forEach(link => {
                link.addEventListener('click', () => {
                    this.menuToggle.classList.remove('active');
                    this.navLinks.classList.remove('active');
                });
            });
        }

        // Scroll handler
        window.addEventListener('scroll', () => this.handleScroll());

        // Listen for storage changes to update navbar user state across tabs
        window.addEventListener('storage', (e) => {
            if (e.key === 'ai-odyssey-current-user') {
                this.renderUserControls();
            }
        });
    },

    handleScroll() {
        if (this.navbar) {
            if (window.scrollY > 50) {
                this.navbar.classList.add('scrolled');
            } else {
                this.navbar.classList.remove('scrolled');
            }
        }
    },

    setActiveLink() {
        const currentPath = window.location.pathname.split('/').pop() || 'index.html';
        this.navLinks?.querySelectorAll('.nav-link').forEach(link => {
            const href = link.getAttribute('href');
            if (href) {
                const linkFile = href.split('/').pop();
                link.classList.toggle('active', linkFile === currentPath);
            }
        });
    },

    renderUserControls() {
        if (!this.navControls) return;

        let currentUser = null;
        const isAdminPage = window.location.pathname.includes('admin.html');
        if (isAdminPage) {
            currentUser = { role: 'admin', username: 'ODYSSEY', team: 'CRISIS LAB ADMIN' };
        } else {
            try {
                const raw = localStorage.getItem('ai-odyssey-current-user');
                if (raw) currentUser = JSON.parse(raw);
            } catch(e) {}
        }

        const isChallengePage = window.location.pathname.includes('/challenges/');
        const prefix = isChallengePage ? '../../' : '';

        // Keep or create timerDisplay
        let timerDisplay = document.getElementById('timerDisplay');
        const timerHtml = timerDisplay ? timerDisplay.outerHTML : `<div class="timer-display" id="timerDisplay" title="Global 90-Minute Arena Timer">⏱ 90:00:00</div>`;

        // Keep menu toggle
        const menuToggleHtml = `<button class="menu-toggle" id="menuToggle" aria-label="Toggle menu"><span></span><span></span><span></span></button>`;

        // Dynamic nav-link adjustment:
        const dashboardNavLink = this.navLinks?.querySelector('a[href*="dashboard.html"]');
        const loginNavLink = this.navLinks?.querySelector('a[href*="login.html"]');
        const adminNavLink = this.navLinks?.querySelector('a[href*="admin.html"]');

        if (currentUser) {
            // User is Logged in: Show Dashboard, Hide Login link
            if (dashboardNavLink) dashboardNavLink.style.display = '';
            if (loginNavLink) loginNavLink.style.display = 'none';
            if (adminNavLink) {
                adminNavLink.style.display = (currentUser.role === 'admin') ? '' : 'none';
            }
        } else {
            // User is Logged out: Show Login link, Hide Dashboard link until logged in
            if (dashboardNavLink) dashboardNavLink.style.display = 'none';
            if (loginNavLink) loginNavLink.style.display = '';
            if (adminNavLink) adminNavLink.style.display = 'none';
        }

        let userHtml = '';

        if (currentUser) {
            const isDQ = localStorage.getItem(`ai-odyssey-team-status-${currentUser.team}`) === 'disqualified';
            if (currentUser.role === 'admin') {
                userHtml = `
                    <div class="user-badge glass" style="display:inline-flex; align-items:center; gap:0.4rem; padding:4px 12px; border-radius:20px; font-size:0.8rem; border:1px solid var(--accent-primary); color:#fff;">
                        <span style="color:var(--accent-primary); font-weight:800;">⚡ Admin:</span> <strong>ODYSSEY</strong>
                    </div>
                    <button class="btn btn-secondary btn-sm" onclick="globalLogout()" style="padding:4px 10px; font-size:0.8rem;">🚪 Logout</button>
                `;
            } else {
                userHtml = `
                    <div class="user-badge glass" style="display:inline-flex; align-items:center; gap:0.4rem; padding:4px 12px; border-radius:20px; font-size:0.8rem; border:1px solid ${isDQ ? 'var(--accent-danger)' : 'var(--accent-primary)'}; color:#fff;">
                        <span style="color:${isDQ ? 'var(--accent-danger)' : 'var(--accent-primary)'}; font-weight:800;">👥 Team:</span>
                        <strong style="${isDQ ? 'text-decoration:line-through; color:var(--accent-danger);' : ''}">${currentUser.team}</strong>
                        <span style="color:var(--text-muted); font-size:0.75rem;">(${currentUser.username})</span>
                    </div>
                    <button class="btn btn-secondary btn-sm" onclick="globalLogout()" style="padding:4px 10px; font-size:0.8rem;">🚪 Logout</button>
                `;
            }
        } else {
            userHtml = `
                <a href="${prefix}login.html" class="btn btn-primary btn-sm glow" style="text-decoration:none; padding:6px 14px; font-size:0.85rem;">
                    🔑 Team Login
                </a>
            `;
        }

        this.navControls.innerHTML = `${timerHtml} ${userHtml} ${menuToggleHtml}`;

        // Ensure timer display is immediately synced
        if (typeof TimerManager !== 'undefined' && typeof TimerManager.updateArenaDisplay === 'function') {
            TimerManager.updateArenaDisplay();
        }

        // Re-bind menu toggle
        this.menuToggle = document.getElementById('menuToggle');
        if (this.menuToggle && this.navLinks) {
            this.menuToggle.onclick = () => {
                this.menuToggle.classList.toggle('active');
                this.navLinks.classList.toggle('active');
            };
        }
    },

    startBroadcastListener() {
        let lastBroadcastVersion = -1;
        const prefix = window.location.pathname.includes('/challenges/') ? '../../' : '';

        setInterval(async () => {
            try {
                const res = await fetch(`${prefix}api/broadcast`, { cache: 'no-store' });
                if (!res.ok) return;
                const data = await res.json();
                if (data && data.version > 0 && data.version !== lastBroadcastVersion) {
                    if (lastBroadcastVersion !== -1 && data.message) {
                        if (typeof AnimationManager !== 'undefined') {
                            AnimationManager.showToast(`📢 BROADCAST from ${data.sender || 'ADMIN'}:\n${data.message}`, 'warning', 8000);
                        } else {
                            alert(`📢 BROADCAST from ${data.sender || 'ADMIN'}:\n\n${data.message}`);
                        }
                    }
                    lastBroadcastVersion = data.version;
                }
            } catch(e) {}
        }, 2500);
    },

    startSessionHeartbeat() {
        let currentUser = null;
        try {
            const raw = localStorage.getItem('ai-odyssey-current-user');
            if (raw) currentUser = JSON.parse(raw);
        } catch(e) {}

        if (!currentUser || currentUser.role === 'admin') return;

        let sessionId = sessionStorage.getItem('ai-odyssey-session-id');
        if (!sessionId && currentUser.sessionId) {
            sessionId = currentUser.sessionId;
            sessionStorage.setItem('ai-odyssey-session-id', sessionId);
        }
        if (!sessionId) {
            if (window.crypto && window.crypto.getRandomValues) {
                const arr = new Uint8Array(16);
                window.crypto.getRandomValues(arr);
                sessionId = 'sess_' + Array.from(arr, b => b.toString(16).padStart(2, '0')).join('');
            } else {
                sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
            }
            sessionStorage.setItem('ai-odyssey-session-id', sessionId);
        }

        const prefix = window.location.pathname.includes('/challenges/') ? '../../' : '';

        // Run heartbeat every 3.5 seconds
        if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
        this.heartbeatInterval = setInterval(async () => {
            const currentRaw = localStorage.getItem('ai-odyssey-current-user');
            if (!currentRaw) return;
            let u = null;
            try { u = JSON.parse(currentRaw); } catch(e) {}
            if (!u || u.role === 'admin') return;

            try {
                const res = await fetch(`${prefix}api/session/heartbeat`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        username: u.username,
                        team: u.team,
                        sessionId: sessionId
                    })
                });

                if (res.ok) {
                    const data = await res.json();
                    if (data && data.valid === false) {
                        // Terminated due to login on another device
                        clearInterval(this.heartbeatInterval);
                        localStorage.removeItem('ai-odyssey-current-user');
                        sessionStorage.removeItem('ai-odyssey-admin-auth');
                        sessionStorage.removeItem('ai-odyssey-session-id');

                        const msg = data.message || `⚠️ SESSION TERMINATED:\n\nUser "${u.username}" logged in from another device.\n\nOnly 1 active device is permitted per participant.`;
                        alert(msg);
                        window.location.href = `${prefix}login.html`;
                    }
                }
            } catch(e) {}
        }, 3500);
    }
};

// Initialize navigation on page load
document.addEventListener('DOMContentLoaded', () => Navigation.init());
