const http = require('http');

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

async function login(email, password) {
  const r = await request('POST', '/api/auth/login', { email, password });
  const parsed = JSON.parse(r.body);
  return parsed.token;
}

async function run() {
  const appModule = require('./dist/app');
  const app = appModule.default || appModule;
  const server = app.listen(3001, async () => {
    console.log('Server started on 3001\n');
    let pass = 0;
    let fail = 0;

    function check(name, condition, details = '') {
      if (condition) { pass++; console.log(name + ': PASS' + (details ? ' | ' + details : '')); }
      else { fail++; console.log(name + ': FAIL' + (details ? ' | ' + details : '')); }
    }

    try {
      let r, body, parsed;

      // Login all users
      console.log('--- Logging in test users ---');
      const aliceToken = await login('alice@demo.com', 'Participant@123');
      const bobToken = await login('bob@demo.com', 'Participant@123');
      const orgToken = await login('organizer@demo.com', 'Organizer@123');
      console.log('Alice token: ' + (aliceToken ? 'YES' : 'NO'));
      console.log('Bob token: ' + (bobToken ? 'YES' : 'NO'));
      console.log('Organizer token: ' + (orgToken ? 'YES' : 'NO'));
      console.log('');

      // ==========================================================
      // TEST 1 — Alice participant API
      // ==========================================================
      console.log('===== TEST 1 — Alice participant API =====');
      r = await request('GET', '/api/participant/me', null, { Authorization: 'Bearer ' + aliceToken });
      parsed = JSON.parse(r.body);
      const test1Details = `status=${r.status} name=${parsed.participant?.name} role=${parsed.participant?.role} code=${parsed.registration?.attendeeCode} event=${parsed.registration?.event?.name} hasPasswordHash=${r.body.includes('password_hash')}`;
      check('TEST 1', 
        r.status === 200 &&
        parsed.success === true &&
        parsed.participant?.name === 'Alice Participant' &&
        parsed.participant?.role === 'PARTICIPANT' &&
        parsed.registration?.attendeeCode === 'ATT-001' &&
        parsed.registration?.event?.name === 'Tech Summit 2026' &&
        !r.body.includes('password_hash'),
        test1Details
      );

      // ==========================================================
      // TEST 2 — Bob participant API
      // ==========================================================
      console.log('\n===== TEST 2 — Bob participant API =====');
      r = await request('GET', '/api/participant/me', null, { Authorization: 'Bearer ' + bobToken });
      parsed = JSON.parse(r.body);
      const test2Details = `status=${r.status} name=${parsed.participant?.name} code=${parsed.registration?.attendeeCode}`;
      check('TEST 2',
        r.status === 200 &&
        parsed.success === true &&
        parsed.participant?.name === 'Bob Participant' &&
        parsed.registration?.attendeeCode === 'ATT-002' &&
        parsed.registration?.attendeeCode !== 'ATT-001',
        test2Details
      );

      // ==========================================================
      // TEST 3 — Organizer blocked
      // ==========================================================
      console.log('\n===== TEST 3 — Organizer blocked =====');
      r = await request('GET', '/api/participant/me', null, { Authorization: 'Bearer ' + orgToken });
      parsed = JSON.parse(r.body);
      const test3Details = `status=${r.status} message=${parsed.message}`;
      check('TEST 3',
        r.status === 403 &&
        parsed.success === false &&
        parsed.message === 'Access denied',
        test3Details
      );

      // ==========================================================
      // TEST 4 — Missing token
      // ==========================================================
      console.log('\n===== TEST 4 — Missing token =====');
      r = await request('GET', '/api/participant/me');
      parsed = JSON.parse(r.body);
      const test4Details = `status=${r.status} message=${parsed.message}`;
      check('TEST 4',
        r.status === 401,
        test4Details
      );

      // ==========================================================
      // TEST 5 — Invalid token
      // ==========================================================
      console.log('\n===== TEST 5 — Invalid token =====');
      r = await request('GET', '/api/participant/me', null, { Authorization: 'Bearer invalid-token' });
      parsed = JSON.parse(r.body);
      const test5Details = `status=${r.status}`;
      check('TEST 5',
        r.status === 401,
        test5Details
      );

      // ==========================================================
      // TEST 6 — User isolation (Alice with ?userId=Bob)
      // ==========================================================
      console.log('\n===== TEST 6 — User isolation =====');
      // First get Bob's user ID
      r = await request('GET', '/api/participant/me', null, { Authorization: 'Bearer ' + bobToken });
      const bobData = JSON.parse(r.body);
      const bobUserId = bobData.participant?.id;
      console.log('Bob user ID: ' + bobUserId);

      // Now try as Alice with Bob's userId in query
      r = await request('GET', '/api/participant/me?userId=' + bobUserId, null, { Authorization: 'Bearer ' + aliceToken });
      parsed = JSON.parse(r.body);
      const test6Details = `status=${r.status} name=${parsed.participant?.name} code=${parsed.registration?.attendeeCode}`;
      check('TEST 6',
        r.status === 200 &&
        parsed.participant?.name === 'Alice Participant' &&
        parsed.registration?.attendeeCode === 'ATT-001',
        test6Details
      );

      // ==========================================================
      // TEST 7 — QR content (Alice)
      // ==========================================================
      console.log('\n===== TEST 7 — QR content (Alice) =====');
      r = await request('GET', '/api/participant/me', null, { Authorization: 'Bearer ' + aliceToken });
      parsed = JSON.parse(r.body);
      const aliceAttendeeCode = parsed.registration?.attendeeCode;
      const test7Details = `attendeeCode=${aliceAttendeeCode}`;
      check('TEST 7',
        aliceAttendeeCode === 'ATT-001' &&
        !aliceAttendeeCode.includes(parsed.participant?.name) &&
        !aliceAttendeeCode.includes(parsed.participant?.email),
        test7Details
      );

      // ==========================================================
      // TEST 8 — Bob QR (different from Alice)
      // ==========================================================
      console.log('\n===== TEST 8 — Bob QR =====');
      r = await request('GET', '/api/participant/me', null, { Authorization: 'Bearer ' + bobToken });
      parsed = JSON.parse(r.body);
      const bobAttendeeCode = parsed.registration?.attendeeCode;
      const test8Details = `aliceCode=${aliceAttendeeCode} bobCode=${bobAttendeeCode}`;
      check('TEST 8',
        bobAttendeeCode === 'ATT-002' &&
        bobAttendeeCode !== aliceAttendeeCode,
        test8Details
      );

      // ==========================================================
      // TEST 9 — Participant frontend (verify API response has all fields)
      // ==========================================================
      console.log('\n===== TEST 9 — Participant frontend data =====');
      r = await request('GET', '/api/participant/me', null, { Authorization: 'Bearer ' + aliceToken });
      parsed = JSON.parse(r.body);
      const test9Details = `hasParticipant=${!!parsed.participant} hasRegistration=${!!parsed.registration} hasEvent=${!!parsed.registration?.event}`;
      check('TEST 9',
        parsed.success === true &&
        !!parsed.participant?.name &&
        !!parsed.participant?.email &&
        !!parsed.registration?.event?.name &&
        !!parsed.registration?.attendeeCode &&
        !r.body.includes('password_hash'),
        test9Details
      );

      // ==========================================================
      // TEST 10 — Organizer frontend protection
      // ==========================================================
      console.log('\n===== TEST 10 — Organizer frontend protection =====');
      r = await request('GET', '/api/participant/me', null, { Authorization: 'Bearer ' + orgToken });
      parsed = JSON.parse(r.body);
      const test10Details = `status=${r.status}`;
      check('TEST 10',
        r.status === 403,
        test10Details
      );

      // ==========================================================
      // TEST 11 — Authentication regression (run the original tests inline)
      // ==========================================================
      console.log('\n===== TEST 11 — Authentication regression =====');
      let regPass = 0;
      let regFail = 0;

      function regCheck(condition) {
        if (condition) regPass++; else regFail++;
      }

      // Login organizer
      r = await request('POST', '/api/auth/login', { email: 'organizer@demo.com', password: 'Organizer@123' });
      parsed = JSON.parse(r.body);
      regCheck(r.status === 200 && parsed.success && parsed.user?.role === 'ORGANIZER' && !!parsed.token && !r.body.includes('password_hash'));

      // Login participant
      r = await request('POST', '/api/auth/login', { email: 'alice@demo.com', password: 'Participant@123' });
      parsed = JSON.parse(r.body);
      regCheck(r.status === 200 && parsed.success && parsed.user?.role === 'PARTICIPANT' && !!parsed.token);

      // Wrong password
      r = await request('POST', '/api/auth/login', { email: 'organizer@demo.com', password: 'wrongpassword' });
      parsed = JSON.parse(r.body);
      regCheck(r.status === 401);

      // Unknown email
      r = await request('POST', '/api/auth/login', { email: 'nonexistent@test.com', password: 'anything' });
      parsed = JSON.parse(r.body);
      regCheck(r.status === 401 && parsed.message === 'Invalid email or password');

      // No auth header
      r = await request('GET', '/api/test/organizer');
      regCheck(r.status === 401);

      // Invalid JWT
      r = await request('GET', '/api/test/organizer', null, { Authorization: 'Bearer invalid-token' });
      regCheck(r.status === 401);

      // Valid organizer access
      r = await request('GET', '/api/test/organizer', null, { Authorization: 'Bearer ' + orgToken });
      regCheck(r.status === 200);

      // Participant cannot access organizer
      r = await request('GET', '/api/test/organizer', null, { Authorization: 'Bearer ' + aliceToken });
      regCheck(r.status === 403);

      // Valid participant access
      r = await request('GET', '/api/test/participant', null, { Authorization: 'Bearer ' + aliceToken });
      regCheck(r.status === 200);

      // Organizer cannot access participant
      r = await request('GET', '/api/test/participant', null, { Authorization: 'Bearer ' + orgToken });
      regCheck(r.status === 403);

      // Health
      r = await request('GET', '/api/health');
      regCheck(r.status === 200);

      const test11Details = `regression=${regPass}/${regPass + regFail}`;
      check('TEST 11', regFail === 0, test11Details);

    } catch (e) {
      console.error('Test error:', e.message);
    }

    console.log('\n===== PHASE 3 SUMMARY =====');
    console.log('Passed: ' + pass + '/' + (pass + fail));
    server.close(() => process.exit(0));
  });
}

run();
