const http = require('http');
const assert = require('assert');

const BASE_URL = 'http://localhost:3000';

function makeRequest(path, method = 'GET', body = null, headers = {}) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, BASE_URL);
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                ...headers
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                let parsed = null;
                try {
                    parsed = JSON.parse(data);
                } catch(e) {
                    parsed = data;
                }
                resolve({ status: res.statusCode, data: parsed });
            });
        });

        req.on('error', reject);
        if (body) {
            req.write(typeof body === 'string' ? body : JSON.stringify(body));
        }
        req.end();
    });
}

async function runTests() {
    console.log('🧪 Starting Complete Arena System End-to-End Verification...\n');

    // Step 0: Admin Login
    console.log('1. Testing Admin Authentication...');
    const adminLoginRes = await makeRequest('/api/admin/login', 'POST', { username: 'ODYSSEY', password: 'techodyssey' });
    assert.strictEqual(adminLoginRes.status, 200, 'Admin login failed');
    assert.ok(adminLoginRes.data.token, 'Admin token not received');
    const adminToken = adminLoginRes.data.token;
    const adminHeaders = { 'Authorization': `Bearer ${adminToken}`, 'x-admin-token': adminToken };
    console.log('   ✅ Admin authenticated successfully.\n');

    // Step 1: Arena Controls
    console.log('2. Testing Arena State Machine...');
    // Start Arena
    const startRes = await makeRequest('/api/admin/arena/start', 'POST', { durationSeconds: 5400 }, adminHeaders);
    assert.strictEqual(startRes.status, 200, 'Start arena failed');
    assert.strictEqual(startRes.data.arena.status, 'STARTED', 'Arena status not STARTED');

    // Check Public Arena State
    const pubState = await makeRequest('/api/arena/state');
    assert.strictEqual(pubState.status, 200);
    assert.strictEqual(pubState.data.arena.status, 'STARTED', 'Public arena status mismatch');
    console.log('   ✅ Arena successfully started and public state confirms STARTED.');

    // Stop Arena
    const stopRes = await makeRequest('/api/admin/arena/stop', 'POST', {}, adminHeaders);
    assert.strictEqual(stopRes.status, 200);
    assert.strictEqual(stopRes.data.arena.status, 'STOPPED', 'Arena status not STOPPED');
    console.log('   ✅ Arena successfully stopped.');

    // Restart Arena for problem testing
    await makeRequest('/api/admin/arena/start', 'POST', { durationSeconds: 5400 }, adminHeaders);
    console.log('   ✅ Arena restarted for problem testing.\n');

    // Step 2: Team Registration & Approval Lifecycle
    console.log('3. Testing Team Registration & Admin Approval Flow...');
    const testTeamName = 'ApexWarriors_' + Date.now();
    const testPassword = 'ApexSecretPass99!';
    const testMembers = ['AlphaLead', 'BravoDev', 'CharlieOps'];

    // Register team
    const regRes = await makeRequest('/api/register', 'POST', {
        team: testTeamName,
        password: testPassword,
        members: testMembers
    });
    assert.strictEqual(regRes.status, 200, 'Team registration failed');
    assert.strictEqual(regRes.data.team.status, 'pending', 'New team must be pending');
    console.log('   ✅ Team registered with status: PENDING.');

    // Login attempt while pending must be blocked
    const pendingLoginRes = await makeRequest('/api/session/login', 'POST', {
        team: testTeamName,
        username: testMembers[0],
        password: testPassword
    });
    assert.ok(pendingLoginRes.data.error && pendingLoginRes.data.error.toLowerCase().includes('pending'), 'Error message should state pending approval');
    console.log('   ✅ Pending team blocked from login with appropriate message.');

    // Check Public Teams and Scoreboard: MUST NOT show pending team
    const publicTeamsBefore = await makeRequest('/api/teams');
    const inPublicTeams = publicTeamsBefore.data.teams.some(t => t.team.toLowerCase() === testTeamName.toLowerCase());
    assert.strictEqual(inPublicTeams, false, 'Pending team MUST NOT appear on public team roster');

    const publicScoreboardBefore = await makeRequest('/api/scoreboard');
    const inScoreboard = publicScoreboardBefore.data.scoreboard.some(t => t.team.toLowerCase() === testTeamName.toLowerCase());
    assert.strictEqual(inScoreboard, false, 'Pending team MUST NOT appear on public scoreboard');
    console.log('   ✅ Pending team is hidden from public Team List and Scoreboard.');

    // Admin checks pending teams
    const allTeamsRes = await makeRequest('/api/admin/teams/all', 'GET', null, adminHeaders);
    const inAdminPending = allTeamsRes.data.teams.pending.some(t => t.team.toLowerCase() === testTeamName.toLowerCase());
    assert.strictEqual(inAdminPending, true, 'Team must appear in Admin Pending list');
    console.log('   ✅ Team appears in Admin Pending list.');

    // Admin Approves Team
    const approveRes = await makeRequest('/api/admin/teams/approve', 'POST', { team: testTeamName }, adminHeaders);
    assert.strictEqual(approveRes.status, 200, 'Approve team failed');
    console.log('   ✅ Admin approved team.');

    // Active Team Login
    const activeLoginRes = await makeRequest('/api/session/login', 'POST', {
        team: testTeamName,
        username: testMembers[0],
        password: testPassword
    });
    assert.strictEqual(activeLoginRes.status, 200, 'Approved team login failed');
    assert.strictEqual(activeLoginRes.data.user.team, testTeamName);
    console.log('   ✅ Approved team logged in successfully.');

    // Public Teams and Scoreboard MUST now show active team
    const publicTeamsAfter = await makeRequest('/api/teams');
    const inPublicTeamsAfter = publicTeamsAfter.data.teams.some(t => t.team.toLowerCase() === testTeamName.toLowerCase());
    assert.strictEqual(inPublicTeamsAfter, true, 'Approved team MUST appear on public team roster');

    const publicScoreboardAfter = await makeRequest('/api/scoreboard');
    const inScoreboardAfter = publicScoreboardAfter.data.scoreboard.some(t => t.team.toLowerCase() === testTeamName.toLowerCase());
    assert.strictEqual(inScoreboardAfter, true, 'Approved team MUST appear on public scoreboard');
    console.log('   ✅ Approved team is live on public Team List and Scoreboard.\n');

    // Step 3: Challenge Solving & Scoring
    console.log('4. Testing Problem Solving & Live Score Calculation...');
    // Submit correct answer for challenge 1
    const submitRes = await makeRequest('/api/challenge/submit', 'POST', {
        challengeId: 1,
        answer: 'await asyncio.sleep(0.5)',
        team: testTeamName,
        username: testMembers[0]
    });
    assert.strictEqual(submitRes.status, 200, 'Challenge submission failed');
    assert.strictEqual(submitRes.data.solved, true, 'Challenge 1 should be solved');
    assert.ok(submitRes.data.points > 0, 'Points should be awarded');
    console.log(`   ✅ Challenge 1 solved! Awarded ${submitRes.data.points} pts.`);

    // Duplicate submission should be blocked
    const dupRes = await makeRequest('/api/challenge/submit', 'POST', {
        challengeId: 1,
        answer: 'await asyncio.sleep(0.5)',
        team: testTeamName,
        username: testMembers[0]
    });
    assert.strictEqual(dupRes.data.alreadySolved, true, 'Duplicate solve must be detected');
    console.log('   ✅ Duplicate submission handled correctly.');

    // Step 4: Admin Score Adjustment (+50 pts)
    console.log('5. Testing Admin Manual Score Adjustment (+50 pts)...');
    const scoreRes = await makeRequest('/api/admin/teams/score', 'POST', { team: testTeamName, delta: 50 }, adminHeaders);
    assert.strictEqual(scoreRes.status, 200, 'Score adjustment failed');
    assert.strictEqual(scoreRes.data.team.bonusPoints, 50);

    const scoreboardCheck = await makeRequest('/api/scoreboard');
    const teamEntry = scoreboardCheck.data.scoreboard.find(t => t.team.toLowerCase() === testTeamName.toLowerCase());
    assert.ok(teamEntry, 'Team entry not found in scoreboard');
    assert.strictEqual(teamEntry.score, submitRes.data.points + 50, 'Total score must equal solves + bonusPoints');
    console.log(`   ✅ Scoreboard authoritative score: ${teamEntry.score} pts.\n`);

    // Step 5: Admin Edit Team
    console.log('6. Testing Admin Edit Team...');
    const editedTeamName = testTeamName + '_Edited';
    const editedPassword = 'NewSecretPass123!';
    const editedMembers = ['Leader1', 'Leader2'];

    const editRes = await makeRequest('/api/admin/teams/edit', 'POST', {
        oldTeam: testTeamName,
        newTeam: editedTeamName,
        password: editedPassword,
        members: editedMembers
    }, adminHeaders);
    assert.strictEqual(editRes.status, 200, 'Edit team failed');

    // Login with new credentials
    const editLoginRes = await makeRequest('/api/session/login', 'POST', {
        team: editedTeamName,
        username: editedMembers[0],
        password: editedPassword
    });
    assert.strictEqual(editLoginRes.status, 200, 'Login with edited credentials failed');
    console.log('   ✅ Team name, password, and members updated and verified with login.\n');

    // Step 6: Admin Team Deletion and Restoration
    console.log('7. Testing Admin Team Deletion & Restoration...');
    const delRes = await makeRequest('/api/admin/teams/delete', 'POST', { team: editedTeamName }, adminHeaders);
    assert.strictEqual(delRes.status, 200, 'Delete team failed');

    // Verify team is gone from public endpoints
    const pubTeamsDel = await makeRequest('/api/teams');
    assert.strictEqual(pubTeamsDel.data.teams.some(t => t.team.toLowerCase() === editedTeamName.toLowerCase()), false);

    const pubScoreDel = await makeRequest('/api/scoreboard');
    assert.strictEqual(pubScoreDel.data.scoreboard.some(t => t.team.toLowerCase() === editedTeamName.toLowerCase()), false);

    // Verify team is in Admin Removed Teams
    const adminTeamsDel = await makeRequest('/api/admin/teams/all', 'GET', null, adminHeaders);
    assert.strictEqual(adminTeamsDel.data.teams.deleted.some(t => t.team.toLowerCase() === editedTeamName.toLowerCase()), true);
    console.log('   ✅ Deleted team removed from public views and listed under Admin Removed Teams.');

    // Admin Restores Team
    const restoreRes = await makeRequest('/api/admin/teams/restore', 'POST', { team: editedTeamName }, adminHeaders);
    assert.strictEqual(restoreRes.status, 200, 'Restore team failed');

    const pubTeamsRestored = await makeRequest('/api/teams');
    assert.strictEqual(pubTeamsRestored.data.teams.some(t => t.team.toLowerCase() === editedTeamName.toLowerCase()), true);
    console.log('   ✅ Restored team restored to active state and public views.\n');

    // Step 7: Central Pulse Sync
    console.log('8. Testing /api/pulse endpoint performance & payload...');
    const pulseRes = await makeRequest(`/api/pulse?team=${encodeURIComponent(editedTeamName)}&user=Leader1`);
    assert.strictEqual(pulseRes.status, 200, 'Pulse request failed');
    assert.ok(pulseRes.data.arena, 'Pulse missing arena');
    assert.ok(pulseRes.data.scoreboard, 'Pulse missing scoreboard');
    assert.ok(pulseRes.data.teamSolves, 'Pulse missing teamSolves');
    assert.strictEqual(pulseRes.data.teamStatus, 'active');
    console.log('   ✅ Pulse payload validated with full arena, scoreboard, and team solves data.\n');

    console.log('🎉 ALL TESTS PASSED! 100% COMPLETE AND AUTHORITATIVE STATE VERIFIED.');
}

runTests().catch(err => {
    console.error('❌ TEST FAILED:', err);
    process.exit(1);
});
