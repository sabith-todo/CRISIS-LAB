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

async function runTrashTest() {
    console.log('================================================================');
    console.log('🗑️ TESTING TRASH & PERMANENT DELETE WORKFLOW');
    console.log('================================================================\n');

    // 1. Super Admin Authentication
    console.log('1. Authenticating Super Admin ODYSSEY...');
    const loginRes = await makeRequest('/api/admin/login', 'POST', { username: 'ODYSSEY', password: 'techodyssey' });
    assert.strictEqual(loginRes.status, 200, 'Super admin login failed');
    const adminToken = loginRes.data.token || 'ODYSSEY_SUPER_ADMIN_KEY_2026_SECURE';
    const adminHeaders = {
        'x-admin-token': adminToken,
        'Authorization': `Bearer ${adminToken}`
    };
    console.log('   ✅ Super Admin authenticated successfully.\n');

    // 2. Create test teams
    console.log('2. Creating test teams: TrashTeamAlpha & TrashTeamBeta...');
    const createA = await makeRequest('/api/admin/teams/create', 'POST', { team: 'TrashTeamAlpha', password: 'passA', members: ['AlphaUser1'] }, adminHeaders);
    assert.strictEqual(createA.status, 200, 'Failed to create TrashTeamAlpha');
    const createB = await makeRequest('/api/admin/teams/create', 'POST', { team: 'TrashTeamBeta', password: 'passB', members: ['BetaUser1'] }, adminHeaders);
    assert.strictEqual(createB.status, 200, 'Failed to create TrashTeamBeta');
    console.log('   ✅ Created active test teams.\n');

    // 3. Move both teams to Removed Teams (Soft delete)
    console.log('3. Deleting both teams (moving to trash/removed teams)...');
    const delA = await makeRequest('/api/admin/teams/delete', 'POST', { team: 'TrashTeamAlpha' }, adminHeaders);
    assert.strictEqual(delA.status, 200, 'Soft delete for TrashTeamAlpha failed');
    const delB = await makeRequest('/api/admin/teams/delete', 'POST', { team: 'TrashTeamBeta' }, adminHeaders);
    assert.strictEqual(delB.status, 200, 'Soft delete for TrashTeamBeta failed');

    const adminTeams1 = await makeRequest('/api/admin/teams/all', 'GET', null, adminHeaders);
    const deletedList1 = adminTeams1.data.teams.deleted.map(t => t.team.toLowerCase());
    assert.ok(deletedList1.includes('trashteamalpha'), 'TrashTeamAlpha must be in deleted list');
    assert.ok(deletedList1.includes('trashteambeta'), 'TrashTeamBeta must be in deleted list');
    console.log('   ✅ Both teams are in Removed Teams (deleted cache).\n');

    // 4. Test Single Team Permanent Deletion
    console.log('4. Permanently deleting single team: TrashTeamAlpha...');
    const permDelRes = await makeRequest('/api/admin/teams/permanent-delete', 'POST', { team: 'TrashTeamAlpha' }, adminHeaders);
    assert.strictEqual(permDelRes.status, 200, 'Permanent delete for TrashTeamAlpha failed');

    const adminTeams2 = await makeRequest('/api/admin/teams/all', 'GET', null, adminHeaders);
    const inActive2 = adminTeams2.data.teams.active.some(t => t.team.toLowerCase() === 'trashteamalpha');
    const inPending2 = adminTeams2.data.teams.pending.some(t => t.team.toLowerCase() === 'trashteamalpha');
    const inDeleted2 = adminTeams2.data.teams.deleted.some(t => t.team.toLowerCase() === 'trashteamalpha');
    assert.strictEqual(inActive2, false, 'TrashTeamAlpha must not be in active');
    assert.strictEqual(inPending2, false, 'TrashTeamAlpha must not be in pending');
    assert.strictEqual(inDeleted2, false, 'TrashTeamAlpha must NOT be in deleted list (permanently wiped)');
    console.log('   ✅ TrashTeamAlpha permanently wiped from database.\n');

    // 5. Verify TrashTeamBeta is still in trash
    const inDeletedBeta = adminTeams2.data.teams.deleted.some(t => t.team.toLowerCase() === 'trashteambeta');
    assert.strictEqual(inDeletedBeta, true, 'TrashTeamBeta should still be in trash');

    // 6. Test Empty Trash (Purge All Deleted Teams)
    console.log('5. Testing Empty Trash (Purge all deleted teams)...');
    const emptyTrashRes = await makeRequest('/api/admin/teams/purge-deleted', 'POST', {}, adminHeaders);
    assert.strictEqual(emptyTrashRes.status, 200, 'Purge deleted teams failed');
    assert.ok(emptyTrashRes.data.purgedCount >= 1, 'Purged count should be at least 1');

    const adminTeams3 = await makeRequest('/api/admin/teams/all', 'GET', null, adminHeaders);
    assert.strictEqual(adminTeams3.data.teams.deleted.length, 0, 'Trash/deleted list must be completely empty');
    console.log('   ✅ All deleted teams permanently purged. Trash is completely empty.\n');

    console.log('================================================================');
    console.log('🎉 ALL TRASH & PERMANENT DELETE TESTS PASSED PERFECTLY!');
    console.log('================================================================');
}

runTrashTest().catch(err => {
    console.error('❌ Test failed:', err);
    process.exit(1);
});
