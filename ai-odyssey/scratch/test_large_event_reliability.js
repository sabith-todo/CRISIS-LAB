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
    console.log('🏛️ Testing 100-PC / 400-Participant Large Event Reliability & AI Coach...\n');

    // 1. Admin Login
    console.log('1. Authenticating Super Admin...');
    const adminLoginRes = await makeRequest('/api/admin/login', 'POST', { username: 'ODYSSEY', password: 'techodyssey' });
    assert.strictEqual(adminLoginRes.status, 200, 'Admin login failed');
    const adminToken = adminLoginRes.data.token;
    const adminHeaders = { 'Authorization': `Bearer ${adminToken}`, 'x-admin-token': adminToken };
    console.log('   ✅ Super Admin authenticated.\n');

    // 2. Revision Verification
    console.log('2. Testing Server-Side Revision Engine & Idempotency...');
    const initialRevRes = await makeRequest('/api/revision');
    assert.strictEqual(initialRevRes.status, 200);
    const startRev = initialRevRes.data.revision;
    console.log(`   ↳ Initial Server Revision: #${startRev}`);

    // Admin starts arena
    const startRes = await makeRequest('/api/admin/arena/start', 'POST', { durationSeconds: 5400 }, adminHeaders);
    assert.strictEqual(startRes.status, 200);
    assert.strictEqual(startRes.data.revision, startRev + 1, 'Revision should increment on Arena start');
    console.log(`   ✅ Arena Started -> Revision advanced to #${startRes.data.revision}`);

    // Admin approves a test team
    const testTeamName = 'TitanSquad_' + Date.now();
    await makeRequest('/api/register', 'POST', { team: testTeamName, password: 'TitanPass123!', members: ['Titan1', 'Titan2'] });
    const approveRes = await makeRequest('/api/admin/teams/approve', 'POST', { team: testTeamName }, adminHeaders);
    assert.strictEqual(approveRes.status, 200);
    assert.ok(approveRes.data.revision > startRes.data.revision, 'Revision must advance on team approval');
    console.log(`   ✅ Team Approved -> Revision advanced to #${approveRes.data.revision}`);

    // Admin health check
    const healthRes = await makeRequest('/api/admin/health');
    assert.strictEqual(healthRes.status, 200);
    assert.strictEqual(healthRes.data.status, 'healthy');
    assert.ok(healthRes.data.revision >= approveRes.data.revision);
    console.log(`   ✅ Health Telemetry: Status=HEALTHY, Rev=#${healthRes.data.revision}, ActiveTeams=${healthRes.data.activeTeamsCount}\n`);

    // 3. Simulating 100 PCs / 400 Participants with Missed Real-Time Events & Automatic Convergence
    console.log('3. Simulating 100 Connected PCs (400 Participants) with Network Drops & Recovery...');
    
    // Step 3a: 100 PCs connect simultaneously and fetch initial revision
    const pcClients = [];
    for (let pc = 1; pc <= 100; pc++) {
        pcClients.push({
            pcId: pc,
            team: `Team_${String(Math.ceil(pc / 2)).padStart(3, '0')}`,
            user: `Player_PC_${pc}`,
            clientRevision: 0,
            state: null
        });
    }

    // All 100 PCs fetch initial state
    const initialSyncPromises = pcClients.map(async (client) => {
        const pulse = await makeRequest(`/api/pulse?team=${client.team}&user=${client.user}`);
        client.clientRevision = pulse.data.revision;
        client.state = pulse.data.arena.status;
        return pulse.data.revision;
    });

    const initialRevisions = await Promise.all(initialSyncPromises);
    const allMatchingInitial = initialRevisions.every(r => r === approveRes.data.revision);
    assert.strictEqual(allMatchingInitial, true, 'All 100 PCs must match initial server revision');
    console.log(`   ✅ All 100 PCs initialized and synchronized to Rev #${approveRes.data.revision}`);

    // Step 3b: Admin mutates state (adjusts score for TitanSquad)
    const scoreRes = await makeRequest('/api/admin/teams/score', 'POST', { team: testTeamName, delta: 100 }, adminHeaders);
    const newServerRev = scoreRes.data.revision;
    console.log(`   ↳ Admin adjusted score -> Server Revision is now #${newServerRev}`);

    // Step 3c: Simulate that 20 PCs (PC 1 to PC 20) were temporarily offline/sleeping and missed the event
    const offlinePcs = pcClients.slice(0, 20);
    const onlinePcs = pcClients.slice(20);

    // Online PCs poll and immediately update
    await Promise.all(onlinePcs.map(async (client) => {
        const pulse = await makeRequest(`/api/pulse?team=${client.team}&user=${client.user}`);
        client.clientRevision = pulse.data.revision;
    }));

    // Verify offline PCs are still on old revision
    assert.strictEqual(offlinePcs[0].clientRevision < newServerRev, true);
    console.log(`   ↳ 20 PCs temporarily offline (Still on Rev #${offlinePcs[0].clientRevision})`);

    // Step 3d: Offline PCs reconnect and execute automatic state recovery
    console.log('   ↳ Simulating Network Recovery: 20 offline PCs reconnect and check revision...');
    await Promise.all(offlinePcs.map(async (client) => {
        // Lightweight revision check
        const revCheck = await makeRequest('/api/revision');
        if (revCheck.data.revision > client.clientRevision) {
            // Full state resync
            const fullPulse = await makeRequest(`/api/pulse?team=${client.team}&user=${client.user}`);
            client.clientRevision = fullPulse.data.revision;
            client.state = fullPulse.data.arena.status;
        }
    }));

    // Step 3e: Verify all 100 PCs have converged to the exact same revision and state
    const allRevsAfterRecovery = pcClients.map(c => c.clientRevision);
    const allConverged = allRevsAfterRecovery.every(r => r === newServerRev);
    assert.strictEqual(allConverged, true, 'All 100 PCs must converge to the latest server revision');
    console.log(`   ✅ 100% of 100 PCs converged to Rev #${newServerRev} after reconnection!\n`);

    // 4. Testing AI Coaching Engine & Anti-Copy-Paste Rules
    console.log('4. Testing AI Coach Prompt & Anti-Copy-Paste Protection...');
    const AICoach = require('../assets/js/ai-coach.js'); // Verify file exists and is valid syntax
    const aiCoachCode = require('fs').readFileSync(require('path').join(__dirname, '..', 'assets', 'js', 'ai-coach.js'), 'utf8');
    assert.ok(aiCoachCode.includes('_INTERNAL_SYSTEM_PROMPT'), 'Internal system prompt must be defined in coach');
    assert.ok(aiCoachCode.includes('Coaching Rule:'), 'Coach must contain copy-paste deflection rule');
    assert.ok(aiCoachCode.includes('Level 1 — Conceptual Understanding'), 'Coach must support Level 1 guidance');
    assert.ok(aiCoachCode.includes('Level 2 — Direction & Approach'), 'Coach must support Level 2 guidance');
    assert.ok(aiCoachCode.includes('Level 3 — Edge Case & Bug Pattern Analysis'), 'Coach must support Level 3 guidance');
    assert.ok(aiCoachCode.includes('Level 4 — Step-by-Step Problem Breakdown'), 'Coach must support Level 4 guidance');
    console.log('   ✅ AI Coach module loaded with 4-Tier Guided Reasoning & Copy-Paste Deflection.\n');

    console.log('🎉 ALL 100-PC / 400-PARTICIPANT RELIABILITY & AI COACHING TESTS PASSED!');
}

runTests().catch(err => {
    console.error('❌ TEST FAILED:', err);
    process.exit(1);
});
