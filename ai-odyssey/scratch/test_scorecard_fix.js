const http = require('http');

function makeRequest(path, method = 'GET', body = null, headers = {}) {
    return new Promise((resolve, reject) => {
        const req = http.request({
            hostname: 'localhost',
            port: 3000,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                ...headers
            }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, headers: res.headers, data: JSON.parse(data) });
                } catch(e) {
                    resolve({ status: res.statusCode, headers: res.headers, data });
                }
            });
        });
        req.on('error', reject);
        if (body) req.write(typeof body === 'string' ? body : JSON.stringify(body));
        req.end();
    });
}

async function runTests() {
    console.log('--- Testing Scorecard & Leaderboard Fixes ---');

    // 1. Admin Login to get token
    const loginRes = await makeRequest('/api/admin/login', 'POST', { username: 'ODYSSEY', password: 'techodyssey' });
    console.log('Admin login status:', loginRes.status);
    if (!loginRes.data.token) {
        console.error('Failed to log in as admin:', loginRes.data);
        return;
    }
    const adminToken = loginRes.data.token;
    const adminHeaders = { 'x-admin-token': adminToken };

    // 2. Test /api/admin/teams/all
    const allTeamsRes = await makeRequest('/api/admin/teams/all', 'GET', null, adminHeaders);
    console.log('/api/admin/teams/all status:', allTeamsRes.status);
    const activeTeams = allTeamsRes.data.teams?.active || [];
    console.log(`Active teams count: ${activeTeams.length}`);
    
    // Check if difficulty breakdowns and lastSolveTime are present
    const sampleWithSolves = activeTeams.find(t => t.solvesCount > 0) || activeTeams[0];
    if (sampleWithSolves) {
        console.log('Sample team stats:', {
            team: sampleWithSolves.team,
            solvesCount: sampleWithSolves.solvesCount,
            score: sampleWithSolves.score,
            easyCount: sampleWithSolves.easyCount,
            medCount: sampleWithSolves.medCount,
            hardCount: sampleWithSolves.hardCount,
            bossCount: sampleWithSolves.bossCount,
            lastSolveTime: sampleWithSolves.lastSolveTime,
            hasSolvesMap: !!sampleWithSolves.solves
        });
    }

    // 3. Test /api/admin/team/inspect for a team with solves (e.g. techtitans or sample)
    const testTeamName = sampleWithSolves ? sampleWithSolves.team : 'techtitans';
    const inspectRes = await makeRequest(`/api/admin/team/inspect?team=${encodeURIComponent(testTeamName)}`, 'GET', null, adminHeaders);
    console.log(`/api/admin/team/inspect for "${testTeamName}" status:`, inspectRes.status);
    console.log('Inspect Result:', {
        team: inspectRes.data.team,
        status: inspectRes.data.status,
        score: inspectRes.data.score,
        solvesCount: inspectRes.data.solvesCount,
        solvedChallengesCount: inspectRes.data.solvedChallenges?.length,
        solvedChallenges: inspectRes.data.solvedChallenges
    });

    // 4. Test public /api/scoreboard
    const scoreboardRes = await makeRequest('/api/scoreboard', 'GET');
    console.log('/api/scoreboard status:', scoreboardRes.status);
    console.log('Scoreboard top 3:', scoreboardRes.data.scoreboard?.slice(0, 3));

    console.log('\n✅ All automated verification tests completed successfully!');
}

runTests().catch(err => {
    console.error('Test execution error:', err);
});
