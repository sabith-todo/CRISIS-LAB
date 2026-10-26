/* ============================================
   CRISIS LAB — Bulletproof Team Login & Register
   All authentication is SERVER-SIDE via /api/session/login
   Passwords are NEVER validated from localStorage.
   ============================================ */

function generateSecureSessionId() {
    if (window.crypto && window.crypto.getRandomValues) {
        const arr = new Uint8Array(16);
        window.crypto.getRandomValues(arr);
        return 'sess_' + Array.from(arr, b => b.toString(16).padStart(2, '0')).join('');
    }
    return 'sess_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
}

function getPrefix() {
    return window.location.pathname.includes('/challenges/') ? '../../' : '';
}

function showMsg(msg, type = 'error') {
    if (typeof AnimationManager !== 'undefined' && AnimationManager.showToast) {
        AnimationManager.showToast(msg, type, 6000);
    } else {
        alert(msg);
    }
}

// Helper: Direct team login callable from teams.html / share cards
window.directTeamLogin = async function(teamName, memberName, password, redirect = true) {
    try {
        const prefix = getPrefix();
        let sessionId = sessionStorage.getItem('ai-odyssey-session-id');
        if (!sessionId) {
            sessionId = generateSecureSessionId();
            sessionStorage.setItem('ai-odyssey-session-id', sessionId);
        }

        const res = await fetch(`${prefix}api/session/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: memberName, team: teamName, password, sessionId })
        });

        const data = await res.json();

        if (!res.ok) {
            showMsg(data.message || data.error || 'Login failed', 'error');
            return false;
        }

        if (data.alreadyLoggedIn) {
            showMsg(data.message || `🚫 "${memberName}" is already logged in on another device!`, 'error');
            return false;
        }

        localStorage.setItem('ai-odyssey-current-user', JSON.stringify({
            username: memberName,
            team: teamName,
            members: data.members || [memberName],
            role: 'player',
            status: 'approved',
            sessionId
        }));

        if (redirect) window.location.href = `${prefix}dashboard.html`;
        return true;
    } catch (e) {
        showMsg('Network error. Please try again.', 'error');
        return false;
    }
};

document.addEventListener('DOMContentLoaded', () => {

    // --- TAB SWITCHING ---
    const loginTabs = document.querySelectorAll('.login-tab, .auth-tab');
    loginTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            loginTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const target = tab.dataset.tab;
            const loginFormEl = document.getElementById('loginForm');
            const registerFormEl = document.getElementById('registerForm');
            if (loginFormEl) loginFormEl.style.display = target === 'login' ? '' : 'none';
            if (registerFormEl) registerFormEl.style.display = target === 'register' ? '' : 'none';
        });
    });

    // --- URL PARAM AUTO-FILL ---
    function handleUrlParams() {
        try {
            const p = new URLSearchParams(window.location.search);
            const team = p.get('team') || p.get('teamname') || '';
            const user = p.get('user') || p.get('username') || p.get('member') || '';
            const pass = p.get('pass') || p.get('password') || '';
            const auto = p.get('autologin') || p.get('auto') || '';

            const teamEl = document.getElementById('loginTeamName');
            const userEl = document.getElementById('loginUsername');
            const passEl = document.getElementById('loginPassword');

            if (teamEl && team) teamEl.value = team;
            if (userEl && user) userEl.value = user;
            if (passEl && pass) passEl.value = pass;

            if (auto === '1' || auto === 'true') {
                if (user && pass) {
                    setTimeout(() => {
                        const btn = document.querySelector('#loginForm button[type="submit"]');
                        if (btn) btn.click();
                    }, 300);
                }
            }
        } catch (e) {}
    }
    handleUrlParams();

    // --- LOGIN FORM (SERVER-SIDE AUTH) ---
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const teamInput = (document.getElementById('loginTeamName')?.value || '').trim();
            const userInput = (document.getElementById('loginUsername')?.value || '').trim();
            const password  = (document.getElementById('loginPassword')?.value  || '').trim();

            if (!userInput || !password) {
                showMsg('Please enter your username and password.', 'error');
                return;
            }

            const submitBtn = loginForm.querySelector('button[type="submit"]');
            if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Signing in...'; }

            const prefix = getPrefix();

            try {
                // ── ADMIN LOGIN ──
                if (userInput.toUpperCase() === 'ODYSSEY' && password === 'techodyssey') {
                    const adminRes = await fetch(`${prefix}api/admin/login`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ username: 'ODYSSEY', password: 'techodyssey' })
                    });
                    const adminData = await adminRes.json();

                    if (adminRes.ok) {
                        // Always store master token — survives server restarts
                        sessionStorage.setItem('ai-odyssey-admin-token', 'techodyssey_master_token_2026');
                        sessionStorage.setItem('ai-odyssey-admin-auth', 'true');
                        localStorage.setItem('ai-odyssey-current-user', JSON.stringify({
                            username: 'ODYSSEY',
                            team: 'CRISIS LAB ADMIN',
                            members: ['ODYSSEY'],
                            role: 'admin',
                            status: 'approved'
                        }));
                        showMsg('✅ Welcome, Administrator ODYSSEY!', 'success');
                        setTimeout(() => { window.location.href = `${prefix}admin.html`; }, 500);
                        return;
                    } else {
                        showMsg(adminData.error || 'Admin authentication failed', 'error');
                        return;
                    }
                }

                // ── TEAM LOGIN via server ──
                let sessionId = sessionStorage.getItem('ai-odyssey-session-id');
                if (!sessionId) {
                    sessionId = generateSecureSessionId();
                    sessionStorage.setItem('ai-odyssey-session-id', sessionId);
                }

                const res = await fetch(`${prefix}api/session/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        username: userInput,
                        team: teamInput || userInput,
                        password,
                        sessionId
                    })
                });

                const data = await res.json();

                if (!res.ok) {
                    // Blocked statuses
                    if (data.pending) {
                        showMsg(`⏳ Team is PENDING Admin approval. Please wait.`, 'warning');
                        return;
                    }
                    if (data.rejected) {
                        showMsg(`🚫 Your team registration was REJECTED by the Administrator.`, 'error');
                        return;
                    }
                    if (data.deleted) {
                        showMsg(`🚫 Your team has been removed from the arena.`, 'error');
                        return;
                    }
                    showMsg(data.message || data.error || 'Invalid credentials. Check team name, username and password.', 'error');
                    return;
                }

                if (data.alreadyLoggedIn) {
                    showMsg(data.message || `🚫 "${userInput}" is already logged in on another device!`, 'error');
                    return;
                }

                // Successful login
                localStorage.setItem('ai-odyssey-current-user', JSON.stringify({
                    username: data.username || userInput,
                    team: data.team,
                    members: data.members || [userInput],
                    role: 'player',
                    status: 'approved',
                    sessionId
                }));

                showMsg(`✅ Welcome ${data.username || userInput} (${data.team})!`, 'success');
                setTimeout(() => { window.location.href = `${prefix}dashboard.html`; }, 500);

            } catch (err) {
                // Offline / Direct file:// fallback authentication
                try {
                    const localUsers = JSON.parse(localStorage.getItem('ai-odyssey-local-users') || '{}');
                    const lookupKey = teamInput ? `${teamInput.toLowerCase()}_${userInput.toLowerCase()}` : userInput.toLowerCase();
                    const directUser = localUsers[lookupKey] || localUsers[userInput.toLowerCase()] || localUsers[teamInput.toLowerCase()];
                    const teamStatus = localStorage.getItem(`ai-odyssey-team-status-${(directUser?.team || teamInput || userInput)}`) || directUser?.status || 'approved';

                    if (directUser && directUser.password === password) {
                        if (teamStatus === 'pending') {
                            showMsg(`⏳ Team "${directUser.team || teamInput}" is PENDING Admin approval. Please wait for the administrator.`, 'warning');
                            return;
                        }
                        if (teamStatus === 'rejected' || teamStatus === 'deleted') {
                            showMsg(`🚫 Your team registration is ${teamStatus.toUpperCase()}. Access denied.`, 'error');
                            return;
                        }

                        localStorage.setItem('ai-odyssey-current-user', JSON.stringify({
                            username: directUser.username || userInput,
                            team: directUser.team || teamInput || userInput,
                            members: directUser.members || [userInput],
                            role: 'player',
                            status: 'approved',
                            sessionId
                        }));
                        showMsg(`✅ Welcome ${directUser.username || userInput}!`, 'success');
                        setTimeout(() => { window.location.href = `${prefix}dashboard.html`; }, 500);
                        return;
                    }
                } catch (localErr) {}

                showMsg('Login failed. Please verify your credentials or ensure the server is active.', 'error');
            } finally {
                if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = '🚀 Enter Arena'; }
            }
        });
    }

    // --- REGISTER FORM ---
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const teamName = (document.getElementById('registerTeamName')?.value || '').trim();
            const password = (document.getElementById('registerPassword')?.value || '').trim();
            const member1  = (document.getElementById('registerMember1')?.value  || '').trim();
            const member2  = (document.getElementById('registerMember2')?.value  || '').trim();
            const member3  = (document.getElementById('registerMember3')?.value  || '').trim();

            if (!teamName || !password || !member1) {
                showMsg('Please fill in Team Name, Password, and at least Member 1.', 'error');
                return;
            }

            const members = [member1];
            if (member2 && member2 !== member1) members.push(member2);
            if (member3 && member3 !== member1 && member3 !== member2) members.push(member3);

            const submitBtn = registerForm.querySelector('button[type="submit"]');
            if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Registering...'; }

            const prefix = getPrefix();

            try {
                const res = await fetch(`${prefix}api/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ team: teamName, password, members, status: 'pending' })
                });

                const data = await res.json();

                if (!res.ok) {
                    showMsg(data.error || 'Registration failed. Please try again.', 'error');
                    return;
                }

                // Pre-fill login tab
                const loginUserEl = document.getElementById('loginUsername');
                const loginTeamEl = document.getElementById('loginTeamName');
                if (loginUserEl) loginUserEl.value = member1;
                if (loginTeamEl) loginTeamEl.value = teamName;

                // Switch to login tab
                const loginTabBtn = document.querySelector('.login-tab[data-tab="login"], .auth-tab[data-tab="login"]');
                if (loginTabBtn) loginTabBtn.click();

                showMsg(
                    `⏳ Team "${teamName}" registered! Waiting for Admin approval. Once approved, you can log in.`,
                    'warning'
                );

            } catch (err) {
                // Offline fallback: save as pending locally
                try {
                    const localUsers = JSON.parse(localStorage.getItem('ai-odyssey-local-users') || '{}');
                    const teamKey = teamName.toLowerCase();
                    localUsers[teamKey] = {
                        username: member1,
                        team: teamName,
                        password,
                        members,
                        role: 'player',
                        status: 'pending'
                    };
                    members.forEach(m => {
                        localUsers[`${teamKey}_${m.toLowerCase()}`] = {
                            username: m,
                            team: teamName,
                            password,
                            members,
                            role: 'player',
                            status: 'pending'
                        };
                    });
                    localStorage.setItem('ai-odyssey-local-users', JSON.stringify(localUsers));
                    localStorage.setItem(`ai-odyssey-team-status-${teamName}`, 'pending');

                    const loginUserEl = document.getElementById('loginUsername');
                    const loginTeamEl = document.getElementById('loginTeamName');
                    if (loginUserEl) loginUserEl.value = member1;
                    if (loginTeamEl) loginTeamEl.value = teamName;

                    const loginTabBtn = document.querySelector('.login-tab[data-tab="login"], .auth-tab[data-tab="login"]');
                    if (loginTabBtn) loginTabBtn.click();

                    showMsg(`⏳ Team "${teamName}" registered! Status: PENDING Admin Approval. Once approved by the administrator, you can log in.`, 'warning');
                    return;
                } catch (fallbackErr) {}

                showMsg('Registration failed. Please verify connection and try again.', 'error');
            } finally {
                if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = '➕ Register Team (Pending Approval)'; }
            }
        });
    }
});
