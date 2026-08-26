const http = require('http');
const path = require('path');

function request(method, urlPath, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const allHeaders = body ? { 'Content-Type': 'application/json', ...headers } : headers;
    const opts = { hostname: 'localhost', port: 3001, path: urlPath, method, headers: allHeaders };
    const req = http.request(opts, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function run() {
  const appModule = require('./dist/app');
  const app = appModule.default || appModule;
  const server = app.listen(3001, async () => {
    console.log('Server started on 3001\n');
    let pass = 0;
    let fail = 0;

    function check(name, condition) {
      if (condition) { pass++; console.log(name + ': PASS'); }
      else { fail++; console.log(name + ': FAIL'); }
    }

    try {
      let r, body, parsed;

      // TEST 1
      console.log('===== TEST 1: Valid Organizer Login =====');
      r = await request('POST', '/api/auth/login', { email: 'organizer@demo.com', password: 'Organizer@123' });
      parsed = JSON.parse(r.body);
      console.log('Status:', r.status, '| role:', parsed.user?.role, '| token:', parsed.token ? 'YES' : 'NO', '| password_hash in response:', r.body.includes('password_hash'));
      check('TEST 1', r.status === 200 && parsed.success && parsed.user?.role === 'ORGANIZER' && !!parsed.token && !r.body.includes('password_hash'));
      const orgToken = parsed.token;

      // TEST 2
      console.log('\n===== TEST 2: Valid Participant Login =====');
      r = await request('POST', '/api/auth/login', { email: 'alice@demo.com', password: 'Participant@123' });
      parsed = JSON.parse(r.body);
      console.log('Status:', r.status, '| role:', parsed.user?.role, '| token:', parsed.token ? 'YES' : 'NO');
      check('TEST 2', r.status === 200 && parsed.success && parsed.user?.role === 'PARTICIPANT' && !!parsed.token);
      const partToken = parsed.token;

      // TEST 3
      console.log('\n===== TEST 3: Wrong Password =====');
      r = await request('POST', '/api/auth/login', { email: 'organizer@demo.com', password: 'wrongpassword' });
      parsed = JSON.parse(r.body);
      console.log('Status:', r.status, '| message:', parsed.message);
      check('TEST 3', r.status === 401);

      // TEST 4
      console.log('\n===== TEST 4: Unknown Email =====');
      r = await request('POST', '/api/auth/login', { email: 'nonexistent@test.com', password: 'anything' });
      parsed = JSON.parse(r.body);
      console.log('Status:', r.status, '| message:', parsed.message);
      check('TEST 4', r.status === 401 && parsed.message === 'Invalid email or password');

      // TEST 5
      console.log('\n===== TEST 5: No Authorization Header =====');
      r = await request('GET', '/api/test/organizer');
      console.log('Status:', r.status);
      check('TEST 5', r.status === 401);

      // TEST 6
      console.log('\n===== TEST 6: Invalid JWT =====');
      r = await request('GET', '/api/test/organizer', null, { Authorization: 'Bearer invalid-token' });
      console.log('Status:', r.status);
      check('TEST 6', r.status === 401);

      // TEST 7
      console.log('\n===== TEST 7: Valid Organizer Authorization =====');
      r = await request('GET', '/api/test/organizer', null, { Authorization: 'Bearer ' + orgToken });
      console.log('Status:', r.status, '| Body:', r.body);
      check('TEST 7', r.status === 200);

      // TEST 8
      console.log('\n===== TEST 8: Participant Cannot Access Organizer =====');
      r = await request('GET', '/api/test/organizer', null, { Authorization: 'Bearer ' + partToken });
      console.log('Status:', r.status, '| Body:', r.body);
      check('TEST 8', r.status === 403);

      // TEST 9
      console.log('\n===== TEST 9: Valid Participant Authorization =====');
      r = await request('GET', '/api/test/participant', null, { Authorization: 'Bearer ' + partToken });
      console.log('Status:', r.status, '| Body:', r.body);
      check('TEST 9', r.status === 200);

      // TEST 10
      console.log('\n===== TEST 10: Organizer Cannot Access Participant =====');
      r = await request('GET', '/api/test/participant', null, { Authorization: 'Bearer ' + orgToken });
      console.log('Status:', r.status, '| Body:', r.body);
      check('TEST 10', r.status === 403);

      // TEST 15
      console.log('\n===== TEST 15: Health Endpoints =====');
      r = await request('GET', '/api/health');
      console.log('GET /api/health:', r.status, '| Body:', r.body);
      check('TEST 15a', r.status === 200);
      r = await request('GET', '/api/health/db');
      console.log('GET /api/health/db:', r.status, '| Body:', r.body);

    } catch (e) {
      console.error('Test error:', e.message);
    }

    console.log('\n===== SUMMARY =====');
    console.log('Passed: ' + pass + '/' + (pass + fail));
    server.close(() => process.exit(0));
  });
}

run();
