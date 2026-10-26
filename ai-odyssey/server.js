const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const vm = require('vm');

let PORT = parseInt(process.env.PORT || '3000', 10);
const ROOT_DIR = __dirname;

const MIME_TYPES = {
    '.html': 'text/html; charset=UTF-8',
    '.js': 'text/javascript; charset=UTF-8',
    '.css': 'text/css; charset=UTF-8',
    '.json': 'application/json; charset=UTF-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.mp4': 'video/mp4'
};

// ==============================================================================
// 1. ADVANCED SECURITY CONFIGURATION & AUDIT TELEMETRY
// ==============================================================================
const ADMIN_CREDENTIALS = {
    username: process.env.ADMIN_USER || 'ODYSSEY',
    password: process.env.ADMIN_PASS || 'techodyssey'
};

let globalAdminTokens = new Map(); // token -> { createdAt, expiresAt, ip }
let globalSecurityAuditLog = [];   // Array of { id, time, type, severity, ip, user, details }
let arenaLockdown = false;         // Emergency Lockdown toggle
let rateLimitStrictness = 'normal'; // 'relaxed' | 'normal' | 'strict'

// Blocklist for sensitive files and extensions
const SENSITIVE_EXTENSIONS = ['.md', '.sql', '.env', '.ts', '.mjs', '.log', '.bak', '.conf', '.yml', '.yaml'];
const SENSITIVE_FILENAMES = new Set([
    'answers.md', 'solutions.md', 'hints.md', 'teams_credentials.md',
    'supabase_setup.md', 'supabase-schema.sql', 'server.js',
    'generate-challenges.js', 'package.json', 'package-lock.json',
    'tsconfig.json', 'next.config.ts', 'eslint.config.mjs', 'postcss.config.mjs'
]);

function logSecurityEvent(type, severity = 'info', ip = 'unknown', user = 'anonymous', details = '') {
    const event = {
        id: 'SEC-' + Date.now() + '-' + Math.floor(Math.random() * 10000),
        time: new Date().toISOString(),
        type,
        severity, // 'info' | 'warning' | 'high' | 'critical'
        ip: String(ip || '127.0.0.1').replace(/^.*:/, '') || '127.0.0.1',
        user: String(user || 'anonymous').slice(0, 50),
        details: String(details || '').slice(0, 300)
    };
    globalSecurityAuditLog.unshift(event);
    if (globalSecurityAuditLog.length > 500) {
        globalSecurityAuditLog.length = 500;
    }
    if (severity === 'high' || severity === 'critical') {
        console.warn(`🚨 [SECURITY ALERT] [${severity.toUpperCase()}] ${type} from ${event.ip} (${event.user}): ${details}`);
    }
}

// In-Memory Sliding-Window Rate Limiter
// In-Memory Sliding-Window Rate Limiter
const rateLimitStore = new Map(); // ip -> { hits: [], loginHits: [], submitHits: [], adminFailures: 0, lockedUntil: 0 }

function checkRateLimit(ip, type = 'general') {
    const now = Date.now();
    const cleanIp = String(ip || '127.0.0.1').replace(/^.*:/, '') || '127.0.0.1';

    let record = rateLimitStore.get(cleanIp);
    if (!record) {
        record = { hits: [], loginHits: [], submitHits: [], adminFailures: 0, lockedUntil: 0 };
        rateLimitStore.set(cleanIp, record);
    }

    // Check if IP is currently in locked-out state
    if (record.lockedUntil > now) {
        const remainingSeconds = Math.ceil((record.lockedUntil - now) / 1000);
        return { allowed: false, reason: `IP temporarily locked due to excessive security violations. Retry in ${remainingSeconds}s.`, retryAfter: remainingSeconds };
    }

    const windowMs = 60 * 1000;
    const strictMultiplier = rateLimitStrictness === 'strict' ? 0.5 : rateLimitStrictness === 'relaxed' ? 2 : 1;

    // Filter hits within the last 60 seconds
    record.hits = record.hits.filter(t => now - t < windowMs);
    record.loginHits = record.loginHits.filter(t => now - t < windowMs);
    record.submitHits = record.submitHits.filter(t => now - t < windowMs);

    if (type === 'polling') {
        // High capacity for 100 teams / 400+ concurrent devices sharing router NAT
        const maxPolling = Math.floor(100000 * strictMultiplier);
        if (record.hits.length >= maxPolling) {
            logSecurityEvent('POLLING_RATE_EXCEEDED', 'warning', cleanIp, 'system', `Exceeded polling limit of ${maxPolling} req/min`);
            return { allowed: false, reason: 'Polling too fast. Please throttle requests.', retryAfter: 10 };
        }
        record.hits.push(now);
    } else if (type === 'general') {
        const maxGeneral = Math.floor(12000 * strictMultiplier);
        if (record.hits.length >= maxGeneral) {
            logSecurityEvent('RATE_LIMIT_EXCEEDED', 'warning', cleanIp, 'system', `Exceeded general limit of ${maxGeneral} req/min`);
            return { allowed: false, reason: 'Too many requests. Please slow down.', retryAfter: 30 };
        }
        record.hits.push(now);
    } else if (type === 'login') {
        const maxLogin = Math.floor(500 * strictMultiplier);
        if (record.loginHits.length >= maxLogin) {
            logSecurityEvent('BRUTE_FORCE_THROTTLED', 'high', cleanIp, 'system', `Exceeded login limit of ${maxLogin} req/min`);
            return { allowed: false, reason: 'Too many login attempts. Please wait 1 minute before trying again.', retryAfter: 60 };
        }
        record.loginHits.push(now);
        record.hits.push(now);
    } else if (type === 'submit') {
        const maxSubmit = Math.floor(500 * strictMultiplier);
        if (record.submitHits.length >= maxSubmit) {
            logSecurityEvent('FLAG_SPAM_THROTTLED', 'warning', cleanIp, 'system', `Exceeded flag submission limit of ${maxSubmit} req/min`);
            return { allowed: false, reason: 'Submitting answers too quickly. Cooldown active.', retryAfter: 15 };
        }
        record.submitHits.push(now);
        record.hits.push(now);
    }

    return { allowed: true };
}

function recordAdminFailure(ip) {
    const cleanIp = String(ip || '127.0.0.1').replace(/^.*:/, '') || '127.0.0.1';
    let record = rateLimitStore.get(cleanIp) || { hits: [], loginHits: [], submitHits: [], adminFailures: 0, lockedUntil: 0 };
    record.adminFailures = (record.adminFailures || 0) + 1;
    if (record.adminFailures >= 5) {
        record.lockedUntil = Date.now() + (5 * 60 * 1000); // 5 minute lock
        logSecurityEvent('ADMIN_BRUTE_FORCE_LOCKOUT', 'critical', cleanIp, 'admin', '5 failed admin attempts; 5-minute lockout triggered');
    }
    rateLimitStore.set(cleanIp, record);
}

function resetAdminFailures(ip) {
    const cleanIp = String(ip || '127.0.0.1').replace(/^.*:/, '') || '127.0.0.1';
    let record = rateLimitStore.get(cleanIp);
    if (record) {
        record.adminFailures = 0;
        rateLimitStore.set(cleanIp, record);
    }
}

// Security token helpers
function generateAdminToken(ip) {
    const token = crypto.randomBytes(32).toString('hex');
    const now = Date.now();
    const expiresAt = now + (4 * 60 * 60 * 1000); // 4 hours
    globalAdminTokens.set(token, { createdAt: now, expiresAt, ip });
    return token;
}

function verifyAdminToken(req) {
    const authHeader = req.headers['authorization'] || '';
    const customHeader = req.headers['x-admin-token'] || '';
    let token = '';
    if (authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7).trim();
    } else if (customHeader) {
        token = customHeader.trim();
    }

    if (!token) return false;

    // Resilient Master Tokens (Persist across server restarts)
    if (token === 'techodyssey_master_token_2026' || token === 'techodyssey') {
        return true;
    }

    if (!globalAdminTokens.has(token)) {
        return false;
    }
    const session = globalAdminTokens.get(token);
    if (Date.now() > session.expiresAt) {
        globalAdminTokens.delete(token);
        return false;
    }
    return true;
}

function setSecurityHeaders(res) {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-admin-token, *');
}

function readJsonBody(req, res, maxBytes = 1024 * 1024) {
    return new Promise((resolve, reject) => {
        let body = '';
        let size = 0;
        req.on('data', chunk => {
            size += chunk.length;
            if (size > maxBytes) {
                setSecurityHeaders(res);
                res.writeHead(413, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Payload Too Large: Max allowed size is 1MB' }));
                req.destroy();
                reject(new Error('PAYLOAD_TOO_LARGE'));
                return;
            }
            body += chunk;
        });
        req.on('end', () => {
            try {
                const parsed = body ? JSON.parse(body) : {};
                resolve(parsed);
            } catch (e) {
                setSecurityHeaders(res);
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Malformed JSON payload' }));
                reject(new Error('INVALID_JSON'));
            }
        });
    });
}

function sanitizeText(str) {
    if (typeof str !== 'string') return '';
    return str
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
}

// ==============================================================================
// 2. CENTRAL BACKEND STATE — SINGLE SOURCE OF TRUTH (ONE SOURCE FOR ALL USERS)
// ==============================================================================
let stateRevision = 1;
let lastOperationTime = new Date().toISOString();
let globalTeams = {}; // { [teamKey]: { id, team, password, members: string[], status: 'pending'|'active'|'rejected'|'deleted', registeredAt, bonusPoints: number } }
let globalTeamProgress = {}; // { [teamKey]: { [challengeId]: { solved: true, pointsAwarded, bonusAwarded, time, solvedBy } } }
let globalArena = {
    status: 'STOPPED', // 'STOPPED' | 'STARTED' | 'PAUSED'
    startTime: null,
    endTime: null,
    durationSeconds: 90 * 60,
    remainingSeconds: 90 * 60,
    frozen: false,
    version: 1
};
let latestBroadcast = {
    message: '',
    sender: 'ODYSSEY (Admin)',
    time: null,
    version: 0
};
let globalTeamPresence = {}; // { [teamName]: { [username]: lastSeenTimestamp } }
let globalActiveUserSessions = {}; // { [username.toLowerCase()]: { username, team, sessionId, lastSeen, loginTime, ip } }

const STATE_FILE = path.join(ROOT_DIR, 'arena-state.json');

function saveArenaState() {
    try {
        const payload = JSON.stringify({
            revision: stateRevision,
            lastOperationTime: lastOperationTime,
            arena: globalArena,
            teams: globalTeams,
            progress: globalTeamProgress,
            broadcast: latestBroadcast
        }, null, 2);
        fs.writeFileSync(STATE_FILE, payload, 'utf8');
    } catch(e) {}
}

function incrementRevision(action = 'MUTATION', details = '') {
    stateRevision++;
    globalArena.version = stateRevision;
    lastOperationTime = new Date().toISOString();
    saveArenaState();
    logSecurityEvent('STATE_REVISION_ADVANCED', 'info', 'system', 'system', `Rev #${stateRevision}: ${action} ${details}`);
    return stateRevision;
}

function loadArenaState() {
    try {
        if (fs.existsSync(STATE_FILE)) {
            const raw = fs.readFileSync(STATE_FILE, 'utf8');
            const data = JSON.parse(raw);
            if (typeof data.revision === 'number') stateRevision = data.revision;
            if (data.lastOperationTime) lastOperationTime = data.lastOperationTime;
            if (data.arena) globalArena = { ...globalArena, ...data.arena, version: stateRevision };
            if (data.teams) globalTeams = data.teams;
            if (data.progress) globalTeamProgress = data.progress;
            if (data.broadcast) latestBroadcast = data.broadcast;
            console.log(`✅ Loaded persistent Arena state (${Object.keys(globalTeams).length} teams, status: ${globalArena.status}, revision: ${stateRevision})`);
        }
    } catch(e) {
        console.warn('Could not load persistent state, starting clean:', e.message);
    }
}

// Initial state load
loadArenaState();

function getLiveArenaState() {
    let remaining = globalArena.remainingSeconds || (90 * 60);
    if (globalArena.status === 'STARTED' && globalArena.endTime) {
        remaining = Math.max(0, Math.floor((globalArena.endTime - Date.now()) / 1000));
        if (remaining === 0) {
            globalArena.status = 'STOPPED';
            globalArena.remainingSeconds = 0;
            globalArena.endTime = null;
        }
    }
    return {
        status: globalArena.status,
        startTime: globalArena.startTime,
        endTime: globalArena.endTime,
        durationSeconds: globalArena.durationSeconds || (90 * 60),
        remainingSeconds: remaining,
        remaining: remaining,
        frozen: !!globalArena.frozen,
        version: stateRevision
    };
}

// Load Server-Side Challenges DB for authoritative verification
let ServerChallengesDB = [];
try {
    const challengesCode = fs.readFileSync(path.join(ROOT_DIR, 'assets', 'js', 'challenges.js'), 'utf8');
    const sandbox = {};
    vm.createContext(sandbox);
    vm.runInContext(challengesCode + '\n;globalThis.ChallengesDB = ChallengesDB;', sandbox);
    if (sandbox.ChallengesDB && Array.isArray(sandbox.ChallengesDB)) {
        ServerChallengesDB = sandbox.ChallengesDB;
        console.log(`✅ Loaded ${ServerChallengesDB.length} authoritative challenges for server-side validation.`);
    }
} catch (e) {
    console.warn(`⚠️ Could not parse challenges.js for server verification: ${e.message}`);
}

// Authoritative scoreboard calculation from backend state
function getAuthoritativeScoreboard() {
    const activeTeams = Object.values(globalTeams).filter(t => t && t.status === 'active');
    const scoreboard = activeTeams.map(t => {
        const teamKey = t.team.toLowerCase();
        const solves = globalTeamProgress[teamKey] || {};
        let solvePoints = 0;
        let solvesCount = 0;
        let lastSolveTime = null;
        let easyCount = 0;
        let medCount = 0;
        let hardCount = 0;
        let bossCount = 0;
        let recentSolver = null;
        const memberSolves = {};

        Object.entries(solves).forEach(([chIdStr, s]) => {
            if (s && (s.solved || s.status === 'solved')) {
                const pts = s.pointsAwarded || s.earnedPoints || 50;
                solvePoints += pts;
                solvesCount++;
                if (s.time && (!lastSolveTime || new Date(s.time) > new Date(lastSolveTime))) {
                    lastSolveTime = s.time;
                    recentSolver = s.solvedBy || null;
                }
                const chId = Number(chIdStr);
                const ch = ServerChallengesDB.find(c => c.id === chId);
                if (ch) {
                    if (ch.difficulty === 'easy') easyCount++;
                    else if (ch.difficulty === 'medium') medCount++;
                    else if (ch.difficulty === 'hard') hardCount++;
                    else if (ch.difficulty === 'boss' || ch.id === 66) bossCount++;
                } else if (chId === 66) {
                    bossCount++;
                }
                if (s.solvedBy) {
                    memberSolves[s.solvedBy] = (memberSolves[s.solvedBy] || 0) + 1;
                }
            }
        });

        const totalScore = solvePoints + (t.bonusPoints || 0);

        return {
            id: t.id || `team_${t.team.replace(/\s+/g, '_')}`,
            team: t.team,
            members: t.members || [t.team],
            score: totalScore,
            solvesCount: solvesCount,
            lastSolveTime: lastSolveTime,
            easyCount: easyCount,
            medCount: medCount,
            hardCount: hardCount,
            bossCount: bossCount,
            easy: easyCount,
            medium: medCount,
            hard: hardCount,
            boss: bossCount,
            recentSolver: recentSolver,
            memberSolves: memberSolves,
            bonusPoints: t.bonusPoints || 0,
            status: 'active'
        };
    });

    // Sort by Score descending, then by solves descending, then by last solve time ascending
    scoreboard.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        if (b.solvesCount !== a.solvesCount) return b.solvesCount - a.solvesCount;
        if (a.lastSolveTime && b.lastSolveTime) return new Date(a.lastSolveTime) - new Date(b.lastSolveTime);
        return a.team.localeCompare(b.team);
    });

    // Assign ranks
    scoreboard.forEach((item, index) => {
        item.rank = index + 1;
    });

    return scoreboard;
}

// Auto-Approval Global Setting
let autoApprovalEnabled = false;

// ==============================================================================
// 3. HTTP SERVER ENGINE & SECURE API ROUTING
// ==============================================================================
const server = http.createServer(async (req, res) => {
    setSecurityHeaders(res);

    const clientIp = req.socket.remoteAddress || '127.0.0.1';

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    const reqUrl = req.url.split('?')[0];

    // Check rate limit on incoming requests
    let rateCheckType = 'general';
    if (reqUrl.includes('/login') || reqUrl === '/api/admin/login') {
        rateCheckType = 'login';
    } else if (reqUrl.includes('/submit')) {
        rateCheckType = 'submit';
    } else if (reqUrl.startsWith('/api/session/') || reqUrl === '/api/timer' || reqUrl === '/api/broadcast' || reqUrl === '/api/all-progress' || reqUrl === '/api/presence' || reqUrl === '/api/users' || reqUrl.startsWith('/assets/')) {
        rateCheckType = 'polling';
    }

    const rateResult = checkRateLimit(clientIp, rateCheckType);
    if (!rateResult.allowed) {
        res.writeHead(429, {
            'Content-Type': 'application/json',
            'Retry-After': String(rateResult.retryAfter || 30)
        });
        res.end(JSON.stringify({
            error: 'Too Many Requests',
            message: rateResult.reason,
            retryAfter: rateResult.retryAfter
        }));
        return;
    }

    // ============================================
    // API: ADMIN AUTHENTICATION & SECURITY CONTROL
    // ============================================
    if (reqUrl === '/api/admin/login' && req.method === 'POST') {
        try {
            const data = await readJsonBody(req, res);
            const user = (data.username || '').trim();
            const pass = (data.password || '').trim();

            const isUserMatch = crypto.timingSafeEqual(
                Buffer.from(user.padEnd(64)),
                Buffer.from(ADMIN_CREDENTIALS.username.padEnd(64))
            );
            const isPassMatch = crypto.timingSafeEqual(
                Buffer.from(pass.padEnd(64)),
                Buffer.from(ADMIN_CREDENTIALS.password.padEnd(64))
            );

            if (isUserMatch && isPassMatch) {
                resetAdminFailures(clientIp);
                const token = generateAdminToken(clientIp);
                logSecurityEvent('ADMIN_LOGIN_SUCCESS', 'info', clientIp, user, 'Successful administrator sign-in');
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: true,
                    token: token,
                    username: 'ODYSSEY',
                    role: 'admin',
                    expiresIn: 4 * 3600
                }));
            } else {
                recordAdminFailure(clientIp);
                logSecurityEvent('ADMIN_LOGIN_FAILED', 'high', clientIp, user, 'Invalid admin username or password attempt');
                res.writeHead(401, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: false,
                    error: 'Invalid administrator credentials'
                }));
            }
        } catch (e) {}
        return;
    }

    // Admin Security Telemetry Logs
    if (reqUrl === '/api/admin/security-logs') {
        if (!verifyAdminToken(req)) {
            logSecurityEvent('UNAUTHORIZED_ADMIN_ACTION', 'high', clientIp, 'unknown', 'Attempted to read security logs without valid token');
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Unauthorized: Valid admin token required' }));
            return;
        }
        if (req.method === 'GET') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                logs: globalSecurityAuditLog,
                stats: {
                    totalEvents: globalSecurityAuditLog.length,
                    lockdown: arenaLockdown,
                    strictness: rateLimitStrictness,
                    activeTokens: globalAdminTokens.size
                }
            }));
            return;
        }
        if (req.method === 'POST') {
            globalSecurityAuditLog = [];
            logSecurityEvent('AUDIT_LOGS_CLEARED', 'info', clientIp, 'ODYSSEY', 'Administrator cleared security audit logs');
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, message: 'Security logs cleared' }));
            return;
        }
    }

    // Admin Security Configuration Toggle
    if (reqUrl === '/api/admin/security-config' && req.method === 'POST') {
        if (!verifyAdminToken(req)) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Unauthorized' }));
            return;
        }
        try {
            const data = await readJsonBody(req, res);
            if (data.lockdown !== undefined) {
                arenaLockdown = !!data.lockdown;
                logSecurityEvent('LOCKDOWN_TOGGLED', arenaLockdown ? 'critical' : 'info', clientIp, 'ODYSSEY', `Arena Lockdown set to: ${arenaLockdown}`);
            }
            if (data.strictness && ['relaxed', 'normal', 'strict'].includes(data.strictness)) {
                rateLimitStrictness = data.strictness;
                logSecurityEvent('RATE_LIMIT_STRICTNESS_CHANGED', 'info', clientIp, 'ODYSSEY', `Strictness set to: ${rateLimitStrictness}`);
            }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, lockdown: arenaLockdown, strictness: rateLimitStrictness }));
        } catch (e) {}
        return;
    }

    // Admin Session Termination
    if (reqUrl === '/api/admin/sessions/terminate' && req.method === 'POST') {
        if (!verifyAdminToken(req)) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Unauthorized' }));
            return;
        }
        try {
            const data = await readJsonBody(req, res);
            const userKey = (data.username || '').toLowerCase();
            if (globalActiveUserSessions[userKey]) {
                delete globalActiveUserSessions[userKey];
                logSecurityEvent('SESSION_TERMINATED_BY_ADMIN', 'warning', clientIp, 'ODYSSEY', `Terminated session for participant: ${userKey}`);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, user: userKey }));
                return;
            }
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Session not found' }));
        } catch (e) {}
        return;
    }

    // ==============================================================================
    // API: CENTRAL ARENA STATE, REVISION SYNC & HEALTH (SINGLE SOURCE OF TRUTH)
    // ==============================================================================

    // 0. Super-lightweight Revision Check (Sub-millisecond periodic check for 400+ clients)
    if (reqUrl === '/api/revision' && req.method === 'GET') {
        let remaining = globalArena.remainingSeconds;
        if (globalArena.status === 'STARTED' && globalArena.endTime) {
            remaining = Math.max(0, Math.floor((globalArena.endTime - Date.now()) / 1000));
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            revision: stateRevision,
            status: globalArena.status,
            remaining: remaining,
            frozen: globalArena.frozen,
            teamsCount: Object.values(globalTeams).filter(t => t && t.status === 'active').length,
            time: Date.now()
        }));
        return;
    }

    // 0b. Admin Live Health & Telemetry Endpoint
    if (reqUrl === '/api/admin/health' && req.method === 'GET') {
        const now = Date.now();
        const activeTeams = Object.values(globalTeams).filter(t => t && t.status === 'active');
        const pendingTeams = Object.values(globalTeams).filter(t => t && t.status === 'pending');
        const removedTeams = Object.values(globalTeams).filter(t => t && t.status === 'deleted');
        
        let onlineDevices = 0;
        Object.values(globalActiveUserSessions).forEach(s => {
            if (s && now - s.lastSeen < 15000) onlineDevices++;
        });

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            status: 'healthy',
            revision: stateRevision,
            arena: getLiveArenaState(),
            activeTeamsCount: activeTeams.length,
            pendingTeamsCount: pendingTeams.length,
            removedTeamsCount: removedTeams.length,
            onlineDevicesCount: onlineDevices,
            uptimeSeconds: Math.floor(process.uptime()),
            lastOperationTime: lastOperationTime,
            securityLogsCount: globalSecurityAuditLog.length
        }));
        return;
    }

    // 1. Unified Arena State (Used by Arena Dashboard, Scoreboard, and Admin)
    if (reqUrl === '/api/arena/state' && req.method === 'GET') {
        let remaining = globalArena.remainingSeconds;
        if (globalArena.status === 'STARTED' && globalArena.endTime) {
            remaining = Math.max(0, Math.floor((globalArena.endTime - Date.now()) / 1000));
        }

        const activeTeams = Object.values(globalTeams)
            .filter(t => t && t.status === 'active')
            .map(t => ({
                id: t.id || `team_${t.team.replace(/\s+/g, '_')}`,
                team: t.team,
                members: t.members || [],
                status: 'active'
            }));

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            revision: stateRevision,
            status: globalArena.status,
            arena: getLiveArenaState(),
            activeTeams: activeTeams,
            scoreboard: getAuthoritativeScoreboard(),
            broadcast: latestBroadcast
        }));
        return;
    }

    // 2. Authoritative Scoreboard Endpoint (Active Teams ONLY)
    if (reqUrl === '/api/scoreboard' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            revision: stateRevision,
            scoreboard: getAuthoritativeScoreboard(),
            frozen: globalArena.frozen
        }));
        return;
    }

    // 3. Authoritative Active Teams Endpoint (Active Teams ONLY)
    if (reqUrl === '/api/teams' && req.method === 'GET') {
        const activeTeams = Object.values(globalTeams)
            .filter(t => t && t.status === 'active')
            .map(t => ({
                id: t.id,
                team: t.team,
                members: t.members || [],
                status: 'active'
            }));
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ revision: stateRevision, teams: activeTeams }));
        return;
    }

    // 4. Unified Participant Pulse (Combines Arena State, Presence, Team Solves, Broadcast)
    if (reqUrl.startsWith('/api/pulse')) {
        const urlObj = new URL(req.url, `http://localhost:${PORT}`);
        const team = sanitizeText((urlObj.searchParams.get('team') || '').trim());
        const username = sanitizeText((urlObj.searchParams.get('user') || '').trim());
        const now = Date.now();
        const teamKey = team.toLowerCase();
        const targetTeam = globalTeams[teamKey];

        // Record presence heartbeat
        if (team && username) {
            if (!globalTeamPresence[team]) globalTeamPresence[team] = {};
            globalTeamPresence[team][username] = now;
        }

        // Active members
        const onlineMembers = [];
        if (team && globalTeamPresence[team]) {
            Object.keys(globalTeamPresence[team]).forEach(m => {
                if (now - globalTeamPresence[team][m] < 12000) {
                    onlineMembers.push(m);
                }
            });
        }

        // Remaining timer
        let currentRemaining = globalArena.remainingSeconds;
        if (globalArena.status === 'STARTED' && globalArena.endTime) {
            currentRemaining = Math.max(0, Math.floor((globalArena.endTime - now) / 1000));
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            revision: stateRevision,
            arena: {
                status: globalArena.status,
                remaining: currentRemaining,
                endTime: globalArena.endTime,
                frozen: globalArena.frozen,
                version: stateRevision
            },
            timer: {
                state: globalArena.status === 'STARTED' ? 'running' : (globalArena.status === 'PAUSED' ? 'paused' : 'stopped'),
                endTime: globalArena.endTime,
                remaining: currentRemaining,
                version: stateRevision
            },
            broadcast: latestBroadcast,
            frozen: globalArena.frozen,
            teamStatus: targetTeam ? targetTeam.status : 'not_found',
            activeMembers: onlineMembers,
            allMembers: targetTeam ? targetTeam.members : [],
            teamSolves: globalTeamProgress[teamKey] || {},
            scoreboard: getAuthoritativeScoreboard()
        }));
        return;
    }

    // ==============================================================================
    // API: TEAM REGISTRATION & SESSION AUTHENTICATION
    // ==============================================================================

    // Register: New teams enter as active (if auto-approved) or PENDING approval
    if (reqUrl === '/api/register' && req.method === 'POST') {
        try {
            const data = await readJsonBody(req, res);
            const team = sanitizeText((data.team || '').trim());
            const password = (data.password || '').trim();
            let members = data.members && Array.isArray(data.members) ? data.members.map(m => sanitizeText(String(m).trim())).filter(Boolean).slice(0, 3) : [team];
            const requestedStatus = autoApprovalEnabled ? 'active' : 'pending';

            if (!team || !password) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Missing team name or password' }));
                return;
            }

            const teamKey = team.toLowerCase();
            const existing = globalTeams[teamKey];

            if (existing) {
                if (existing.status === 'active') {
                    // Team already exists and is approved — tell the user to just log in
                    res.writeHead(409, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        success: false,
                        error: `Team "${existing.team}" is already registered and approved. Please log in with your existing credentials.`,
                        status: existing.status
                    }));
                    return;
                }
                // Re-registration for pending/rejected/deleted
                existing.members = Array.from(new Set([...existing.members, ...members])).slice(0, 3);
                existing.status = requestedStatus;
                existing.registeredAt = new Date().toISOString();
                incrementRevision('TEAM_RE_REGISTERED', team);
                logSecurityEvent('TEAM_RE_REGISTERED', 'info', clientIp, team, `Team "${team}" re-registered (Status: ${requestedStatus})`);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, revision: stateRevision, team: { team, members: existing.members, status: requestedStatus }, status: requestedStatus }));
                return;
            }

            // Create new team record
            globalTeams[teamKey] = {
                id: `team_${Date.now()}_${Math.floor(Math.random()*1000)}`,
                team: team,
                password: password,
                members: members,
                status: requestedStatus,
                registeredAt: new Date().toISOString(),
                bonusPoints: 0
            };

            incrementRevision('TEAM_REGISTERED', team);
            logSecurityEvent('TEAM_REGISTERED', 'info', clientIp, team, `Team "${team}" registered with ${members.length} members (Status: ${requestedStatus}).`);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, revision: stateRevision, team: { team, members, status: requestedStatus }, status: requestedStatus }));
        } catch (e) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Registration error' }));
        }
        return;
    }

    // Admin Login Endpoint
    if (reqUrl === '/api/admin/login' && req.method === 'POST') {
        try {
            const data = await readJsonBody(req, res);
            const username = sanitizeText((data.username || '').trim());
            const password = (data.password || '').trim();

            if (username.toUpperCase() === ADMIN_CREDENTIALS.username.toUpperCase() && password === ADMIN_CREDENTIALS.password) {
                const token = generateAdminToken(clientIp);
                resetAdminFailures(clientIp);
                logSecurityEvent('ADMIN_LOGIN_SUCCESS', 'info', clientIp, username, 'Admin ODYSSEY authenticated successfully');
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: true,
                    token: token,
                    username: 'ODYSSEY',
                    role: 'admin'
                }));
                return;
            }

            recordAdminFailure(clientIp);
            logSecurityEvent('ADMIN_LOGIN_FAILED', 'warning', clientIp, username, 'Invalid admin password attempt');
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: 'Invalid Administrator Username or Password' }));
        } catch (e) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Admin authentication error' }));
        }
        return;
    }

    // Login: Authenticate against central globalTeams
    if (reqUrl === '/api/session/login' && req.method === 'POST') {
        try {
            const data = await readJsonBody(req, res);
            const username = sanitizeText((data.username || '').trim());
            const team = sanitizeText((data.team || '').trim());
            const password = (data.password || '').trim();
            let sessionId = (data.sessionId || '').trim();
            const force = !!data.force;

            if (!username) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Missing username' }));
                return;
            }

            if (username.toUpperCase() === 'ODYSSEY') {
                sessionId = sessionId || 'admin_sess_' + crypto.randomBytes(16).toString('hex');
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, sessionId, isAdmin: true }));
                return;
            }

            // Find team
            const teamKey = (team || username).toLowerCase();
            const teamRecord = globalTeams[teamKey] || Object.values(globalTeams).find(t => t.members.some(m => m.toLowerCase() === username.toLowerCase()));

            if (!teamRecord) {
                res.writeHead(401, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: 'Team not found. Please register first.' }));
                return;
            }

            // Check Status
            if (teamRecord.status === 'pending') {
                const msg = `⏳ Team "${teamRecord.team}" is PENDING Administrator approval. Please wait for the Admin to approve your team.`;
                res.writeHead(403, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: false,
                    pending: true,
                    error: msg,
                    message: msg
                }));
                return;
            }

            if (teamRecord.status === 'rejected') {
                const msg = `🚫 Team "${teamRecord.team}" registration was REJECTED by the Administrator.`;
                res.writeHead(403, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: false,
                    rejected: true,
                    error: msg,
                    message: msg
                }));
                return;
            }

            if (teamRecord.status === 'deleted') {
                const msg = `🚫 Team "${teamRecord.team}" has been removed from the arena.`;
                res.writeHead(403, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: false,
                    deleted: true,
                    error: msg,
                    message: msg
                }));
                return;
            }

            // Verify Password — REQUIRED, never skip
            if (!password) {
                res.writeHead(401, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: 'Password is required' }));
                return;
            }
            if (teamRecord.password && teamRecord.password !== password) {
                logSecurityEvent('AUTH_FAILURE', 'warning', clientIp, username, 'Incorrect password attempt');
                res.writeHead(401, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: 'Incorrect password. Please try again.' }));
                return;
            }

            sessionId = sessionId || 'sess_' + crypto.randomBytes(16).toString('hex');
            const now = Date.now();
            const userKey = username.toLowerCase();
            const existingSession = globalActiveUserSessions[userKey];

            // Single active device enforcement
            if (existingSession && (now - existingSession.lastSeen < 12000) && existingSession.sessionId !== sessionId) {
                if (!force) {
                    logSecurityEvent('CONCURRENT_DEVICE_BLOCKED', 'info', clientIp, username, 'Concurrent login blocked by single-device lock');
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        success: false,
                        alreadyLoggedIn: true,
                        message: `🚫 Participant "${username}" is already active on another device! Only 1 active device is permitted per participant.`
                    }));
                    return;
                }
            }

            globalActiveUserSessions[userKey] = {
                username: username,
                team: teamRecord.team,
                sessionId: sessionId,
                lastSeen: now,
                loginTime: now,
                ip: clientIp
            };

            if (!globalTeamPresence[teamRecord.team]) globalTeamPresence[teamRecord.team] = {};
            globalTeamPresence[teamRecord.team][username] = now;

            logSecurityEvent('USER_LOGIN', 'info', clientIp, username, `Participant logged in (Team: ${teamRecord.team})`);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: true,
                sessionId,
                team: teamRecord.team,
                username,
                members: teamRecord.members,
                status: teamRecord.status,
                user: { username, team: teamRecord.team, members: teamRecord.members, status: teamRecord.status }
            }));
        } catch (e) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Login error' }));
        }
        return;
    }

    // ==============================================================================
    // API: AUTHORITATIVE CHALLENGE SUBMISSION & SCORING
    // ==============================================================================
    if (reqUrl === '/api/challenge/submit' && req.method === 'POST') {
        try {
            const data = await readJsonBody(req, res);
            const challengeId = parseInt(data.challengeId, 10);
            const submittedAnswer = (data.answer || data.submittedAnswer || data.flag || '').trim();
            const team = (data.team || '').trim();
            const username = (data.username || '').trim();
            const remainingProblemMins = parseInt(data.remainingProblemMins || 0, 10);
            const teamKey = team.toLowerCase();
            const teamRecord = globalTeams[teamKey];

            if (arenaLockdown) {
                res.writeHead(403, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: 'Arena is currently in Lockdown mode by administrator.' }));
                return;
            }

            // Check if Arena is started
            if (globalArena.status !== 'STARTED') {
                res.writeHead(403, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: false,
                    error: 'Arena has not been started yet. Please wait for the Administrator to start the Arena.'
                }));
                return;
            }

            if (!teamRecord || teamRecord.status !== 'active') {
                res.writeHead(403, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: false,
                    error: `Team "${team}" is not active. Submissions are only accepted from approved active teams.`
                }));
                return;
            }

            if (!challengeId || !submittedAnswer) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Missing challengeId or answer' }));
                return;
            }

            const challenge = ServerChallengesDB.find(c => c.id === challengeId);
            if (!challenge) {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: `Challenge ID ${challengeId} not found` }));
                return;
            }

            // Normalization helper
            const normalize = (str) => {
                if (!str) return '';
                let s = String(str).trim();
                s = s.replace(/^[`"']+|[`"']+$/g, '').replace(/;+$/, '').trim();
                s = s.replace(/\s*([=+\-*/%<>!&|^~?:,()\[\]{}]+)\s*/g, '$1');
                return s.toLowerCase();
            };

            const normSubmitted = normalize(submittedAnswer);
            const normSolution = normalize(challenge.solution);
            const normFlag = normalize(challenge.flag);
            const expectedFlag = `AIODYSSEY{CHALLENGE_${String(challengeId).padStart(2, '0')}_SOLVED}`;
            const normExpectedFlag = normalize(expectedFlag);
            const acceptedAnswers = Array.isArray(challenge.acceptedAnswers) ? challenge.acceptedAnswers : [];

            // Dynamic Boss Flag validation (any 5-language permutation)
            let isBossFlagValid = false;
            if (challengeId === 66) {
                const bossRegex = /^boss\{this_flag_is_contain_five_language_([a-z]+)_([a-z]+)_([a-z]+)_([a-z]+)_([a-z]+)\}$/i;
                const match = normSubmitted.match(bossRegex);
                if (match) {
                    const langs = [match[1], match[2], match[3], match[4], match[5]].sort();
                    if (langs.join(',') === 'css,html,java,js,python') {
                        isBossFlagValid = true;
                    }
                }
            }

            const isCorrect = normSubmitted === normSolution ||
                normSubmitted === normFlag ||
                normSubmitted === normExpectedFlag ||
                isBossFlagValid ||
                submittedAnswer.toLowerCase() === (challenge.solution || '').trim().toLowerCase() ||
                acceptedAnswers.some(ans => {
                    const normAns = normalize(ans);
                    return normAns === normSubmitted || ans.trim().toLowerCase() === submittedAnswer.toLowerCase();
                });

            if (!globalTeamProgress[teamKey]) globalTeamProgress[teamKey] = {};
            const currentProg = globalTeamProgress[teamKey][challengeId] || {
                status: 'unlocked',
                solved: false,
                hintsUsed: 0,
                attempts: 0,
                time: null
            };

            if (isCorrect) {
                if (currentProg.solved) {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: true, solved: true, alreadySolved: true, message: 'Challenge already solved.' }));
                    return;
                }

                let points = challenge.points || 50;
                let bonus = 0;
                if (remainingProblemMins > 0) {
                    bonus = remainingProblemMins * 10;
                    points += bonus;
                }

                currentProg.solved = true;
                currentProg.status = 'solved';
                currentProg.time = new Date().toISOString();
                currentProg.pointsAwarded = points;
                currentProg.bonusAwarded = bonus;
                currentProg.solvedBy = username;

                globalTeamProgress[teamKey][challengeId] = currentProg;
                incrementRevision('CHALLENGE_SOLVED', `Team: ${team}, Ch: #${challengeId}`);

                logSecurityEvent('FLAG_SOLVE_SUCCESS', 'info', clientIp, team, `Challenge #${challengeId} correctly solved by ${username} (+${points} pts)`);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: true,
                    revision: stateRevision,
                    solved: true,
                    points: points,
                    bonus: bonus,
                    flag: challenge.flag || expectedFlag,
                    progress: currentProg,
                    scoreboard: getAuthoritativeScoreboard()
                }));
            } else {
                currentProg.attempts = (currentProg.attempts || 0) + 1;
                globalTeamProgress[teamKey][challengeId] = currentProg;
                saveArenaState();

                logSecurityEvent('FLAG_SOLVE_FAILED', 'info', clientIp, team, `Wrong answer for Challenge #${challengeId} by ${username} (Attempt #${currentProg.attempts})`);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: false,
                    solved: false,
                    attempts: currentProg.attempts,
                    message: 'Incorrect answer. Analyze the syntax/bug and try again.'
                }));
            }
        } catch (e) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Server evaluation error' }));
        }
        return;
    }

    // ==============================================================================
    // API: ADMIN ARENA CONTROLS (START, STOP, RESET, FREEZE)
    // ==============================================================================

    // Start or Resume Arena
    if (reqUrl === '/api/admin/arena/start' && req.method === 'POST') {
        if (!verifyAdminToken(req)) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Unauthorized: Admin token required' }));
            return;
        }
        try {
            const data = await readJsonBody(req, res).catch(() => ({}));
            let duration = globalArena.remainingSeconds || (90 * 60);
            if (data.durationSeconds !== undefined && data.durationSeconds !== null && !isNaN(data.durationSeconds)) {
                duration = parseInt(data.durationSeconds, 10);
            }
            if (duration <= 0) duration = 90 * 60;

            globalArena.status = 'STARTED';
            globalArena.startTime = globalArena.startTime || Date.now();
            globalArena.durationSeconds = duration;
            globalArena.remainingSeconds = duration;
            globalArena.endTime = Date.now() + (duration * 1000);
            incrementRevision('ARENA_STARTED', `duration=${duration}s`);

            logSecurityEvent('ARENA_STARTED', 'info', clientIp, 'ODYSSEY', `Arena started/resumed with remaining: ${duration}s (Rev #${stateRevision})`);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, revision: stateRevision, arena: getLiveArenaState() }));
        } catch (e) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Failed to start arena' }));
        }
        return;
    }

    // Pause Arena (Preserves exact remaining time without resetting)
    if (reqUrl === '/api/admin/arena/stop' && req.method === 'POST') {
        if (!verifyAdminToken(req)) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Unauthorized: Admin token required' }));
            return;
        }
        try {
            if (globalArena.status === 'STARTED' && globalArena.endTime) {
                globalArena.remainingSeconds = Math.max(0, Math.floor((globalArena.endTime - Date.now()) / 1000));
            }
            globalArena.status = 'PAUSED';
            globalArena.endTime = null;
            incrementRevision('ARENA_PAUSED', `remaining=${globalArena.remainingSeconds}s`);

            logSecurityEvent('ARENA_PAUSED', 'info', clientIp, 'ODYSSEY', `Arena paused at remaining: ${globalArena.remainingSeconds}s (Rev #${stateRevision})`);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, revision: stateRevision, arena: getLiveArenaState() }));
        } catch (e) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Failed to pause arena' }));
        }
        return;
    }

    // Reset Arena (Resets countdown to 90 mins and optionally wipes scores)
    if (reqUrl === '/api/admin/arena/reset' && req.method === 'POST') {
        if (!verifyAdminToken(req)) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Unauthorized: Admin token required' }));
            return;
        }
        try {
            const data = await readJsonBody(req, res).catch(() => ({}));
            globalArena.status = 'STOPPED';
            globalArena.startTime = null;
            globalArena.endTime = null;
            globalArena.durationSeconds = 90 * 60;
            globalArena.remainingSeconds = 90 * 60;

            if (data.resetScores) {
                globalTeamProgress = {};
                Object.values(globalTeams).forEach(t => {
                    t.bonusPoints = 0;
                });
            }

            incrementRevision('ARENA_RESET', data.resetScores ? '(Scores wiped)' : '');
            logSecurityEvent('ARENA_RESET', 'warning', clientIp, 'ODYSSEY', `Arena timer reset to 90 minutes (Rev #${stateRevision})`);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, revision: stateRevision, arena: globalArena }));
        } catch (e) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Failed to reset arena' }));
        }
        return;
    }

    // Add Time (+X Minutes)
    if (reqUrl === '/api/admin/arena/add-time' && req.method === 'POST') {
        if (!verifyAdminToken(req)) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Unauthorized: Admin token required' }));
            return;
        }
        try {
            const data = await readJsonBody(req, res).catch(() => ({}));
            const addMinutes = parseInt(data.minutes || 10, 10);
            const addSeconds = addMinutes * 60;

            globalArena.remainingSeconds = (globalArena.remainingSeconds || 5400) + addSeconds;
            globalArena.durationSeconds = (globalArena.durationSeconds || 5400) + addSeconds;
            if (globalArena.status === 'STARTED' && globalArena.endTime) {
                globalArena.endTime += (addSeconds * 1000);
            }

            incrementRevision('ARENA_TIME_EXTENDED', `+${addMinutes} mins`);
            logSecurityEvent('ARENA_TIME_EXTENDED', 'info', clientIp, 'ODYSSEY', `Added ${addMinutes} minutes to arena clock (Rev #${stateRevision})`);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, revision: stateRevision, arena: getLiveArenaState() }));
        } catch (e) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Failed to extend arena time' }));
        }
        return;
    }

    // Challenge Management Endpoints
    if (reqUrl === '/api/admin/challenges/edit' && req.method === 'POST') {
        if (!verifyAdminToken(req)) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Unauthorized: Admin token required' }));
            return;
        }
        try {
            const data = await readJsonBody(req, res);
            const chId = parseInt(data.id, 10);
            const target = ServerChallengesDB.find(c => c.id === chId);
            if (target) {
                if (data.points !== undefined) target.points = parseInt(data.points, 10);
                if (data.title) target.title = sanitizeText(data.title);
                if (data.difficulty) target.difficulty = sanitizeText(data.difficulty);
                if (data.solution) target.solution = data.solution;
                if (data.acceptedAnswers) target.acceptedAnswers = data.acceptedAnswers;
                incrementRevision('CHALLENGE_EDITED', `Ch #${chId}`);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, revision: stateRevision, challenge: target }));
                return;
            }
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Challenge not found' }));
        } catch(e) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Failed to edit challenge' }));
        }
        return;
    }

    // ==============================================================================
    // API: ADMIN TEAM LIFECYCLE (APPROVE, REJECT, DELETE, RESTORE, EDIT, SCORE)
    // ==============================================================================

    // Approve Team (PENDING -> ACTIVE)
    if ((reqUrl === '/api/admin/teams/approve' || reqUrl === '/api/approve-team') && req.method === 'POST') {
        if (!verifyAdminToken(req)) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Unauthorized: Admin token required' }));
            return;
        }
        try {
            const data = await readJsonBody(req, res);
            const team = (data.team || '').trim();
            const teamKey = team.toLowerCase();

            if (globalTeams[teamKey]) {
                globalTeams[teamKey].status = 'active';
                incrementRevision('TEAM_APPROVED', team);
                logSecurityEvent('TEAM_APPROVED', 'info', clientIp, 'ODYSSEY', `Approved team: "${team}" (Status: active, Rev #${stateRevision})`);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, revision: stateRevision, team, status: 'active', scoreboard: getAuthoritativeScoreboard() }));
                return;
            }
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Team not found' }));
        } catch (e) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Approval failed' }));
        }
        return;
    }

    // Reject Team (PENDING -> REJECTED)
    if (reqUrl === '/api/admin/teams/reject' && req.method === 'POST') {
        if (!verifyAdminToken(req)) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Unauthorized: Admin token required' }));
            return;
        }
        try {
            const data = await readJsonBody(req, res);
            const team = (data.team || '').trim();
            const teamKey = team.toLowerCase();

            if (globalTeams[teamKey]) {
                globalTeams[teamKey].status = 'rejected';
                incrementRevision('TEAM_REJECTED', team);
                logSecurityEvent('TEAM_REJECTED', 'warning', clientIp, 'ODYSSEY', `Rejected team: "${team}" (Rev #${stateRevision})`);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, revision: stateRevision, team, status: 'rejected' }));
                return;
            }
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Team not found' }));
        } catch (e) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Rejection failed' }));
        }
        return;
    }

    // Auto-Approval Toggle & Status Endpoint
    if (reqUrl === '/api/admin/auto-approval' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, autoApproval: !!autoApprovalEnabled }));
        return;
    }

    if (reqUrl === '/api/admin/auto-approval' && req.method === 'POST') {
        if (!verifyAdminToken(req)) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Unauthorized: Admin token required' }));
            return;
        }
        try {
            const data = await readJsonBody(req, res);
            autoApprovalEnabled = Boolean(data.autoApproval);
            let approvedCount = 0;
            if (autoApprovalEnabled) {
                // Instantly approve all currently pending teams
                Object.values(globalTeams).forEach(t => {
                    if (t.status === 'pending') {
                        t.status = 'active';
                        approvedCount++;
                    }
                });
                if (approvedCount > 0) {
                    incrementRevision('AUTO_APPROVAL_BATCH', `Auto-approved ${approvedCount} pending teams`);
                }
            }
            logSecurityEvent('AUTO_APPROVAL_TOGGLED', 'info', clientIp, 'ODYSSEY', `Auto-approval set to: ${autoApprovalEnabled} (${approvedCount} approved)`);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, autoApproval: autoApprovalEnabled, approvedCount, scoreboard: getAuthoritativeScoreboard() }));
        } catch (e) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Failed to update auto approval' }));
        }
        return;
    }

    // Delete Team (ACTIVE -> DELETED, moves to Removed Teams)
    if ((reqUrl === '/api/admin/teams/delete' || reqUrl === '/api/delete-team') && req.method === 'POST') {
        if (!verifyAdminToken(req)) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Unauthorized: Admin token required' }));
            return;
        }
        try {
            const data = await readJsonBody(req, res);
            const team = (data.team || '').trim();
            const teamKey = team.toLowerCase();

            if (globalTeams[teamKey]) {
                globalTeams[teamKey].status = 'deleted';
                incrementRevision('TEAM_DELETED', team);
                logSecurityEvent('TEAM_DELETED', 'warning', clientIp, 'ODYSSEY', `Deleted team: "${team}" (Moved to Removed Teams, Rev #${stateRevision})`);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, revision: stateRevision, team, status: 'deleted', scoreboard: getAuthoritativeScoreboard() }));
                return;
            }
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Team not found' }));
        } catch (e) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Deletion failed' }));
        }
        return;
    }

    // Restore Team (DELETED -> ACTIVE, restores to scoreboard and public list)
    if (reqUrl === '/api/admin/teams/restore' && req.method === 'POST') {
        if (!verifyAdminToken(req)) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Unauthorized: Admin token required' }));
            return;
        }
        try {
            const data = await readJsonBody(req, res);
            const team = (data.team || '').trim();
            const teamKey = team.toLowerCase();

            if (globalTeams[teamKey]) {
                globalTeams[teamKey].status = 'active';
                incrementRevision('TEAM_RESTORED', team);
                logSecurityEvent('TEAM_RESTORED', 'info', clientIp, 'ODYSSEY', `Restored team: "${team}" (Status: active, Rev #${stateRevision})`);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, revision: stateRevision, team, status: 'active', scoreboard: getAuthoritativeScoreboard() }));
                return;
            }
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Team not found' }));
        } catch (e) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Restore failed' }));
        }
        return;
    }

    // Permanently Delete Single Team from Database
    if ((reqUrl === '/api/admin/teams/permanent-delete' || reqUrl === '/api/admin/teams/purge') && req.method === 'POST') {
        if (!verifyAdminToken(req)) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Unauthorized: Admin token required' }));
            return;
        }
        try {
            const data = await readJsonBody(req, res);
            const team = (data.team || '').trim();
            const teamKey = team.toLowerCase();

            if (globalTeams[teamKey]) {
                delete globalTeams[teamKey];
                delete globalTeamProgress[teamKey];
                delete globalTeamPresence[teamKey];

                // Clear any active sessions
                Object.keys(globalActiveUserSessions).forEach(token => {
                    const sess = globalActiveUserSessions[token];
                    if (sess && sess.team && sess.team.toLowerCase() === teamKey) {
                        delete globalActiveUserSessions[token];
                    }
                });

                incrementRevision('TEAM_PERMANENTLY_DELETED', team);
                logSecurityEvent('TEAM_PERMANENTLY_DELETED', 'warning', clientIp, 'ODYSSEY', `Permanently deleted team: "${team}" (Rev #${stateRevision})`);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, revision: stateRevision, team, scoreboard: getAuthoritativeScoreboard() }));
                return;
            }
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Team not found' }));
        } catch (e) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Permanent deletion failed' }));
        }
        return;
    }

    // Permanently Purge/Empty ALL Deleted Teams in Trash from Database
    if ((reqUrl === '/api/admin/teams/purge-deleted' || reqUrl === '/api/admin/teams/empty-trash') && req.method === 'POST') {
        if (!verifyAdminToken(req)) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Unauthorized: Admin token required' }));
            return;
        }
        try {
            let purgedCount = 0;
            const purgedNames = [];
            Object.keys(globalTeams).forEach(key => {
                const t = globalTeams[key];
                if (t && t.status === 'deleted') {
                    purgedNames.push(t.team);
                    purgedCount++;
                    delete globalTeams[key];
                    delete globalTeamProgress[key];
                    delete globalTeamPresence[key];
                }
            });

            // Clean up any active sessions for purged teams
            Object.keys(globalActiveUserSessions).forEach(token => {
                const sess = globalActiveUserSessions[token];
                if (sess && sess.team && purgedNames.some(pn => pn.toLowerCase() === sess.team.toLowerCase())) {
                    delete globalActiveUserSessions[token];
                }
            });

            incrementRevision('DELETED_TEAMS_PURGED', `Purged ${purgedCount} deleted teams`);
            logSecurityEvent('DELETED_TEAMS_PURGED', 'warning', clientIp, 'ODYSSEY', `Permanently purged ${purgedCount} deleted teams from database (Rev #${stateRevision})`);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, revision: stateRevision, purgedCount, scoreboard: getAuthoritativeScoreboard() }));
        } catch (e) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Failed to purge deleted teams' }));
        }
        return;
    }

    // Edit Team Details (Name, Members, Password)
    if (reqUrl === '/api/admin/teams/edit' && req.method === 'POST') {
        if (!verifyAdminToken(req)) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Unauthorized: Admin token required' }));
            return;
        }
        try {
            const data = await readJsonBody(req, res);
            const oldTeam = (data.oldTeam || data.team || '').trim();
            const newTeam = sanitizeText((data.newTeam || data.team || '').trim());
            const newPassword = (data.password || '').trim();
            const newMembers = data.members && Array.isArray(data.members) ? data.members.map(m => sanitizeText(String(m).trim())).filter(Boolean).slice(0, 20) : null;
            const oldKey = oldTeam.toLowerCase();

            if (!globalTeams[oldKey]) {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Team not found' }));
                return;
            }

            const record = globalTeams[oldKey];
            if (newTeam && newTeam.toLowerCase() !== oldKey) {
                const newKey = newTeam.toLowerCase();
                delete globalTeams[oldKey];
                record.team = newTeam;
                globalTeams[newKey] = record;

                if (globalTeamProgress[oldKey]) {
                    globalTeamProgress[newKey] = globalTeamProgress[oldKey];
                    delete globalTeamProgress[oldKey];
                }
            }

            if (newPassword) record.password = newPassword;
            if (newMembers) record.members = newMembers;

            incrementRevision('TEAM_EDITED', `${oldTeam} -> ${record.team}`);
            logSecurityEvent('TEAM_EDITED', 'info', clientIp, 'ODYSSEY', `Edited details for team: "${oldTeam}" -> "${record.team}" (Rev #${stateRevision})`);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, revision: stateRevision, team: record.team, data: record, scoreboard: getAuthoritativeScoreboard() }));
        } catch (e) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Edit failed' }));
        }
        return;
    }

    // Update Team Score (+/- Delta)
    if (reqUrl === '/api/admin/teams/score' && req.method === 'POST') {
        if (!verifyAdminToken(req)) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Unauthorized: Admin token required' }));
            return;
        }
        try {
            const data = await readJsonBody(req, res);
            const team = (data.team || '').trim();
            const delta = parseInt(data.delta || data.points || 0, 10);
            const teamKey = team.toLowerCase();

            if (globalTeams[teamKey]) {
                globalTeams[teamKey].bonusPoints = (globalTeams[teamKey].bonusPoints || 0) + delta;
                incrementRevision('TEAM_SCORE_ADJUSTED', `${team} by ${delta} pts`);
                logSecurityEvent('TEAM_SCORE_ADJUSTED', 'info', clientIp, 'ODYSSEY', `Adjusted score for team "${team}" by ${delta} points (Rev #${stateRevision})`);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, revision: stateRevision, team: globalTeams[teamKey], bonusPoints: globalTeams[teamKey].bonusPoints, scoreboard: getAuthoritativeScoreboard() }));
                return;
            }
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Team not found' }));
        } catch (e) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Score adjustment failed' }));
        }
        return;
    }

    // Admin Quick-Add Team (Directly Active)
    if (reqUrl === '/api/admin/teams/create' && req.method === 'POST') {
        if (!verifyAdminToken(req)) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Unauthorized: Admin token required' }));
            return;
        }
        try {
            const data = await readJsonBody(req, res);
            const team = sanitizeText((data.team || '').trim());
            const password = (data.password || '').trim();
            let members = data.members && Array.isArray(data.members) ? data.members.map(m => sanitizeText(String(m).trim())).filter(Boolean).slice(0, 20) : [team];

            if (!team || !password) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Missing team or password' }));
                return;
            }

            const teamKey = team.toLowerCase();
            globalTeams[teamKey] = {
                id: `team_${Date.now()}_${Math.floor(Math.random()*1000)}`,
                team: team,
                password: password,
                members: members,
                status: 'active',
                registeredAt: new Date().toISOString(),
                bonusPoints: 0
            };

            incrementRevision('TEAM_CREATED', team);
            logSecurityEvent('TEAM_CREATED_BY_ADMIN', 'info', clientIp, 'ODYSSEY', `Quick-added and approved team "${team}" (Rev #${stateRevision})`);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, revision: stateRevision, team: globalTeams[teamKey], scoreboard: getAuthoritativeScoreboard() }));
        } catch (e) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Failed to create team' }));
        }
        return;
    }

    // Get All Teams Grouped by Status for Admin Command Center
    if ((reqUrl === '/api/admin/teams/all' || reqUrl === '/api/admin/users') && req.method === 'GET') {
        if (!verifyAdminToken(req)) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Unauthorized: Admin token required' }));
            return;
        }

        const pending = [];
        const active = [];
        const rejected = [];
        const deleted = [];

        Object.values(globalTeams).forEach(t => {
            const teamKey = t.team.toLowerCase();
            const solves = globalTeamProgress[teamKey] || {};
            let solvePts = 0;
            let solveCount = 0;
            let lastSolveTime = null;
            let easyCount = 0;
            let medCount = 0;
            let hardCount = 0;
            let bossCount = 0;
            let recentSolver = null;
            const memberSolves = {};

            Object.entries(solves).forEach(([chIdStr, s]) => {
                if (s && (s.solved || s.status === 'solved')) {
                    const pts = s.pointsAwarded || s.earnedPoints || 50;
                    solvePts += pts;
                    solveCount++;
                    if (s.time && (!lastSolveTime || new Date(s.time) > new Date(lastSolveTime))) {
                        lastSolveTime = s.time;
                        recentSolver = s.solvedBy || null;
                    }
                    const chId = Number(chIdStr);
                    const ch = ServerChallengesDB.find(c => c.id === chId);
                    if (ch) {
                        if (ch.difficulty === 'easy') easyCount++;
                        else if (ch.difficulty === 'medium') medCount++;
                        else if (ch.difficulty === 'hard') hardCount++;
                        else if (ch.difficulty === 'boss' || ch.id === 66) bossCount++;
                    } else if (chId === 66) {
                        bossCount++;
                    }
                    if (s.solvedBy) {
                        memberSolves[s.solvedBy] = (memberSolves[s.solvedBy] || 0) + 1;
                    }
                }
            });

            const item = {
                id: t.id,
                team: t.team,
                name: t.team,
                password: t.password,
                members: t.members || [t.team],
                status: t.status,
                registeredAt: t.registeredAt,
                bonusPoints: t.bonusPoints || 0,
                score: solvePts + (t.bonusPoints || 0),
                solvesCount: solveCount,
                lastSolveTime: lastSolveTime,
                easyCount: easyCount,
                medCount: medCount,
                hardCount: hardCount,
                bossCount: bossCount,
                solves: solves,
                memberSolves: memberSolves,
                recentSolver: recentSolver
            };

            if (t.status === 'pending') pending.push(item);
            else if (t.status === 'active') active.push(item);
            else if (t.status === 'rejected') rejected.push(item);
            else if (t.status === 'deleted') deleted.push(item);
        });

        // Also build legacy users map for compatibility
        const usersMap = {};
        Object.values(globalTeams).forEach(t => {
            usersMap[t.team.toLowerCase()] = {
                username: t.members[0] || t.team,
                password: t.password,
                team: t.team,
                members: t.members,
                role: 'player',
                status: t.status
            };
            t.members.forEach(m => {
                usersMap[m.toLowerCase()] = {
                    username: m,
                    password: t.password,
                    team: t.team,
                    members: t.members,
                    role: 'player',
                    status: t.status
                };
            });
        });

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            revision: stateRevision,
            teams: { pending, active, rejected, deleted },
            users: usersMap,
            scoreboard: getAuthoritativeScoreboard(),
            arena: getLiveArenaState()
        }));
        return;
    }

    // Admin / Client Team Scorecard & Detailed Inspection
    if ((reqUrl === '/api/admin/team/inspect' || reqUrl === '/api/team/scorecard') && req.method === 'GET') {
        const urlObj = new URL(req.url, `http://localhost:${PORT}`);
        const teamParam = (urlObj.searchParams.get('team') || '').trim();
        if (!teamParam) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Missing team parameter' }));
            return;
        }

        const teamKey = teamParam.toLowerCase();
        const t = globalTeams[teamKey] || Object.values(globalTeams).find(x => (x.team || '').toLowerCase() === teamKey);

        const solves = globalTeamProgress[teamKey] || (t ? globalTeamProgress[t.team.toLowerCase()] : {}) || {};
        let solvePts = 0;
        let solveCount = 0;
        let lastSolveTime = null;
        let easyCount = 0;
        let medCount = 0;
        let hardCount = 0;
        let bossCount = 0;
        const memberSolves = {};
        const solvedList = [];

        Object.entries(solves).forEach(([chIdStr, s]) => {
            if (s && (s.solved || s.status === 'solved')) {
                const chId = Number(chIdStr);
                const ch = ServerChallengesDB.find(c => c.id === chId);
                const pts = s.pointsAwarded || s.earnedPoints || (ch ? ch.points : 50);
                solvePts += pts;
                solveCount++;
                if (s.time && (!lastSolveTime || new Date(s.time) > new Date(lastSolveTime))) {
                    lastSolveTime = s.time;
                }

                if (ch) {
                    if (ch.difficulty === 'easy') easyCount++;
                    else if (ch.difficulty === 'medium') medCount++;
                    else if (ch.difficulty === 'hard') hardCount++;
                    else if (ch.difficulty === 'boss' || ch.id === 66) bossCount++;
                } else if (chId === 66) {
                    bossCount++;
                }

                if (s.solvedBy) {
                    memberSolves[s.solvedBy] = (memberSolves[s.solvedBy] || 0) + 1;
                }

                solvedList.push({
                    id: chId,
                    title: ch ? ch.title : `Challenge #${chId}`,
                    category: ch ? ch.category : 'General',
                    difficulty: ch ? ch.difficulty : 'medium',
                    points: pts,
                    hintsUsed: s.hintsUsed || 0,
                    attempts: s.attempts || 1,
                    solvedBy: s.solvedBy || (t ? t.members[0] : 'Team'),
                    time: s.time || null
                });
            }
        });

        // Sort solvedList by time descending (most recent first)
        solvedList.sort((a, b) => {
            if (a.time && b.time) return new Date(b.time) - new Date(a.time);
            return a.id - b.id;
        });

        const bonusPoints = t ? (t.bonusPoints || 0) : 0;
        const totalScore = solvePts + bonusPoints;

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            success: true,
            team: t ? t.team : teamParam,
            status: t ? t.status : 'approved',
            members: t ? (t.members || [t.team]) : [teamParam],
            score: totalScore,
            solvePoints: solvePts,
            bonusPoints: bonusPoints,
            solvesCount: solveCount,
            lastSolveTime: lastSolveTime,
            easyCount,
            medCount,
            hardCount,
            bossCount,
            memberSolves,
            solves: solves,
            solvedChallenges: solvedList
        }));
        return;
    }

    // Approve All Pending Teams
    if ((reqUrl === '/api/approve-all-teams' || reqUrl === '/api/activate-all') && req.method === 'POST') {
        if (!verifyAdminToken(req)) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Unauthorized: Admin token required' }));
            return;
        }
        let count = 0;
        Object.values(globalTeams).forEach(t => {
            if (t.status === 'pending' || t.status === 'rejected') {
                t.status = 'active';
                count++;
            }
        });
        incrementRevision('ALL_TEAMS_ACTIVATED', `${count} teams`);
        logSecurityEvent('ALL_TEAMS_ACTIVATED', 'info', clientIp, 'ODYSSEY', `Approved all ${count} pending teams (Rev #${stateRevision}).`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, revision: stateRevision, count, scoreboard: getAuthoritativeScoreboard() }));
        return;
    }

    // Legacy delete-all-teams
    if (reqUrl === '/api/delete-all-teams' && req.method === 'POST') {
        if (!verifyAdminToken(req)) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Unauthorized: Admin token required' }));
            return;
        }
        const count = Object.keys(globalTeams).length;
        globalTeams = {};
        globalTeamProgress = {};
        globalTeamPresence = {};
        globalActiveUserSessions = {};
        incrementRevision('ALL_TEAMS_WIPED', `${count} teams`);
        logSecurityEvent('ALL_TEAMS_WIPED', 'critical', clientIp, 'ODYSSEY', `Wiped all ${count} teams (Rev #${stateRevision}).`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, revision: stateRevision, count }));
        return;
    }

    // Public Sanitized Users (Backward Compatibility)
    if (reqUrl === '/api/users' && req.method === 'GET') {
        const sanitizedUsers = {};
        Object.values(globalTeams).forEach(t => {
            if (t.status === 'active') {
                sanitizedUsers[t.team.toLowerCase()] = {
                    username: t.members[0] || t.team,
                    team: t.team,
                    members: t.members,
                    role: 'player',
                    status: 'active'
                };
            }
        });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ users: sanitizedUsers }));
        return;
    }

    // Legacy Timer Endpoint
    if (reqUrl === '/api/timer') {
        if (req.method === 'GET') {
            let currentRemaining = globalArena.remainingSeconds;
            if (globalArena.status === 'STARTED' && globalArena.endTime) {
                currentRemaining = Math.max(0, Math.floor((globalArena.endTime - Date.now()) / 1000));
            }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                state: globalArena.status === 'STARTED' ? 'running' : (globalArena.status === 'PAUSED' ? 'paused' : 'stopped'),
                remaining: currentRemaining,
                endTime: globalArena.endTime,
                lastUpdated: Date.now(),
                version: globalArena.version
            }));
            return;
        }
        if (req.method === 'POST') {
            if (!verifyAdminToken(req)) {
                res.writeHead(401, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Unauthorized: Admin token required' }));
                return;
            }
            try {
                const data = await readJsonBody(req, res);
                const action = data.action;
                if (action === 'start' || action === 'resume') {
                    const rem = data.remaining || globalArena.remainingSeconds || (90 * 60);
                    globalArena.status = 'STARTED';
                    globalArena.remainingSeconds = rem;
                    globalArena.endTime = Date.now() + (rem * 1000);
                    globalArena.version++;
                } else if (action === 'pause') {
                    if (globalArena.status === 'STARTED' && globalArena.endTime) {
                        globalArena.remainingSeconds = Math.max(0, Math.floor((globalArena.endTime - Date.now()) / 1000));
                    }
                    globalArena.status = 'PAUSED';
                    globalArena.endTime = null;
                    globalArena.version++;
                } else if (action === 'reset') {
                    globalArena.status = 'STOPPED';
                    globalArena.remainingSeconds = 90 * 60;
                    globalArena.endTime = null;
                    globalArena.version++;
                }
                saveArenaState();
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, timer: globalArena }));
            } catch (e) {}
            return;
        }
    }

    // Broadcasts
    if (reqUrl === '/api/broadcast') {
        if (req.method === 'GET') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(latestBroadcast));
            return;
        }
        if (req.method === 'POST') {
            if (!verifyAdminToken(req)) {
                res.writeHead(401, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Unauthorized: Admin token required' }));
                return;
            }
            try {
                const data = await readJsonBody(req, res);
                latestBroadcast = {
                    message: sanitizeText(data.message || ''),
                    sender: sanitizeText(data.sender || 'ODYSSEY (Admin)'),
                    time: new Date().toISOString(),
                    version: (latestBroadcast.version || 0) + 1
                };
                incrementRevision('BROADCAST_SENT');
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, revision: stateRevision, broadcast: latestBroadcast }));
            } catch (e) {}
            return;
        }
    }

    // Scoreboard Freeze
    if (reqUrl === '/api/scoreboard-freeze') {
        if (req.method === 'GET') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ frozen: !!globalArena.frozen }));
            return;
        }
        if (req.method === 'POST') {
            if (!verifyAdminToken(req)) {
                res.writeHead(401, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Unauthorized: Admin token required' }));
                return;
            }
            try {
                const data = await readJsonBody(req, res);
                globalArena.frozen = !!data.frozen;
                saveArenaState();
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, frozen: globalArena.frozen }));
            } catch (e) {}
            return;
        }
    }

    // All Progress
    if (reqUrl === '/api/all-progress') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(globalTeamProgress));
        return;
    }

    // ==============================================================================
    // 4. HARDENED STATIC FILE SERVER (PATH TRAVERSAL & SENSITIVE FILE SHIELD)
    // ==============================================================================
    let normalizedUrl = reqUrl === '/' || reqUrl === '' ? '/index.html' : reqUrl;
    let decodedUrl = '';
    try {
        decodedUrl = decodeURIComponent(normalizedUrl);
    } catch (e) {
        logSecurityEvent('MALFORMED_URL_REQUEST', 'warning', clientIp, 'unknown', `Malformed URI: ${reqUrl}`);
        res.writeHead(400, { 'Content-Type': 'text/html' });
        res.end('<h1>400 Bad Request</h1>');
        return;
    }

    // Security Check: Block Path Traversal
    const resolvedPath = path.resolve(ROOT_DIR, '.' + path.normalize('/' + decodedUrl));
    const rootResolved = path.resolve(ROOT_DIR);

    if (!resolvedPath.startsWith(rootResolved)) {
        logSecurityEvent('PATH_TRAVERSAL_ATTEMPT', 'critical', clientIp, 'unknown', `Path traversal attempt blocked: ${decodedUrl}`);
        res.writeHead(403, { 'Content-Type': 'text/html' });
        res.end('<h1>403 Forbidden</h1><p>Access Denied: Path Traversal Detected.</p>');
        return;
    }

    let filePath = resolvedPath;
    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
        filePath = path.join(filePath, 'index.html');
    }

    const baseName = path.basename(filePath).toLowerCase();
    const ext = path.extname(filePath).toLowerCase();

    // Security Check: Block Hidden Files (e.g. .git, .env)
    if (baseName.startsWith('.') || decodedUrl.includes('/.')) {
        logSecurityEvent('HIDDEN_FILE_ACCESS_BLOCKED', 'high', clientIp, 'unknown', `Blocked hidden file: ${baseName}`);
        res.writeHead(403, { 'Content-Type': 'text/html' });
        res.end('<h1>403 Forbidden</h1><p>Access Denied.</p>');
        return;
    }

    // Security Check: Block Sensitive Files & Sensitive Extensions
    if (SENSITIVE_FILENAMES.has(baseName) || SENSITIVE_EXTENSIONS.includes(ext)) {
        logSecurityEvent('SENSITIVE_FILE_ACCESS_BLOCKED', 'high', clientIp, 'unknown', `Blocked access to sensitive file: ${baseName}`);
        res.writeHead(403, { 'Content-Type': 'text/html' });
        res.end('<h1>403 Forbidden</h1><p>Access Denied: Protected System Resource.</p>');
        return;
    }

    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end('<h1>404 Not Found</h1><p>The requested file does not exist.</p>');
            } else {
                res.writeHead(500);
                res.end(`Server Error: ${err.code}`);
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content);
        }
    });
});

function getLocalIp() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return '127.0.0.1';
}

function startListening(portToUse) {
    server.listen(portToUse, '0.0.0.0', () => {
        const localIp = getLocalIp();
        console.log(`\n======================================================`);
        console.log(`🛡️ CRISIS LAB ADVANCED SECURE ARENA SERVER IS LIVE!`);
        console.log(`======================================================`);
        console.log(`📍 Local Link (Your PC):        http://localhost:${portToUse}`);
        console.log(`🌐 Teammate Link (Same Wi-Fi):   http://${localIp}:${portToUse}`);
        console.log(`👥 Dashboard:                   http://${localIp}:${portToUse}/dashboard.html`);
        console.log(`📊 Scoreboard:                  http://${localIp}:${portToUse}/scoreboard.html`);
        console.log(`⚙️ Admin Portal:                http://${localIp}:${portToUse}/admin.html`);
        console.log(`🛡️ Security Shield:             ENABLED (Rate Limiter, Anti-Traversal, Auth Tokens)`);
        console.log(`⚡ Authoritative Flag Engine:   ACTIVE (Server-Side Answer Validation)`);
        console.log(`======================================================\n`);
    });
}

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        const nextPort = PORT + 1;
        console.log(`\n⚠️ Port ${PORT} is already in use. Switching automatically to port ${nextPort}...`);
        PORT = nextPort;
        startListening(nextPort);
    } else {
        console.error(err);
    }
});

startListening(PORT);
