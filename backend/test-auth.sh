#!/bin/bash

cd "$(dirname "$0")"

echo "Starting server on port 3001..."
node dist/server.js &
SERVER_PID=$!
sleep 3

echo ""
echo "===== TEST 1: Valid Organizer Login ====="
RESULT=$(curl -s -w "\n%{http_code}" -X POST http://localhost:3001/api/auth/login -H "Content-Type: application/json" -d '{"email":"organizer@demo.com","password":"Organizer@123"}')
CODE=$(echo "$RESULT" | tail -1)
BODY=$(echo "$RESULT" | head -n -1)
echo "Status: $CODE"
echo "Body: $BODY"
if [ "$CODE" = "200" ]; then echo "TEST 1: PASS"; else echo "TEST 1: FAIL"; fi

# Extract organizer token
ORG_TOKEN=$(echo "$BODY" | grep -o '"token":"[^"]*"' | head -1 | cut -d'"' -f4)

echo ""
echo "===== TEST 2: Valid Participant Login ====="
RESULT=$(curl -s -w "\n%{http_code}" -X POST http://localhost:3001/api/auth/login -H "Content-Type: application/json" -d '{"email":"alice@demo.com","password":"Participant@123"}')
CODE=$(echo "$RESULT" | tail -1)
BODY=$(echo "$RESULT" | head -n -1)
echo "Status: $CODE"
echo "Body: $BODY"
if [ "$CODE" = "200" ]; then echo "TEST 2: PASS"; else echo "TEST 2: FAIL"; fi

# Extract participant token
PART_TOKEN=$(echo "$BODY" | grep -o '"token":"[^"]*"' | head -1 | cut -d'"' -f4)

echo ""
echo "===== TEST 3: Wrong Password ====="
RESULT=$(curl -s -w "\n%{http_code}" -X POST http://localhost:3001/api/auth/login -H "Content-Type: application/json" -d '{"email":"organizer@demo.com","password":"wrongpassword"}')
CODE=$(echo "$RESULT" | tail -1)
BODY=$(echo "$RESULT" | head -n -1)
echo "Status: $CODE"
echo "Body: $BODY"
if [ "$CODE" = "401" ]; then echo "TEST 3: PASS"; else echo "TEST 3: FAIL"; fi

echo ""
echo "===== TEST 4: Unknown Email ====="
RESULT=$(curl -s -w "\n%{http_code}" -X POST http://localhost:3001/api/auth/login -H "Content-Type: application/json" -d '{"email":"nonexistent@test.com","password":"anything"}')
CODE=$(echo "$RESULT" | tail -1)
BODY=$(echo "$RESULT" | head -n -1)
echo "Status: $CODE"
echo "Body: $BODY"
if [ "$CODE" = "401" ]; then echo "TEST 4: PASS"; else echo "TEST 4: FAIL"; fi

echo ""
echo "===== TEST 5: No Authorization Header ====="
RESULT=$(curl -s -w "\n%{http_code}" http://localhost:3001/api/test/organizer)
CODE=$(echo "$RESULT" | tail -1)
echo "Status: $CODE"
if [ "$CODE" = "401" ]; then echo "TEST 5: PASS"; else echo "TEST 5: FAIL"; fi

echo ""
echo "===== TEST 6: Invalid JWT ====="
RESULT=$(curl -s -w "\n%{http_code}" http://localhost:3001/api/test/organizer -H "Authorization: Bearer invalid-token")
CODE=$(echo "$RESULT" | tail -1)
echo "Status: $CODE"
if [ "$CODE" = "401" ]; then echo "TEST 6: PASS"; else echo "TEST 6: FAIL"; fi

echo ""
echo "===== TEST 7: Valid Organizer Authorization ====="
RESULT=$(curl -s -w "\n%{http_code}" http://localhost:3001/api/test/organizer -H "Authorization: Bearer $ORG_TOKEN")
CODE=$(echo "$RESULT" | tail -1)
BODY=$(echo "$RESULT" | head -n -1)
echo "Status: $CODE"
echo "Body: $BODY"
if [ "$CODE" = "200" ]; then echo "TEST 7: PASS"; else echo "TEST 7: FAIL"; fi

echo ""
echo "===== TEST 8: Participant Cannot Access Organizer ====="
RESULT=$(curl -s -w "\n%{http_code}" http://localhost:3001/api/test/organizer -H "Authorization: Bearer $PART_TOKEN")
CODE=$(echo "$RESULT" | tail -1)
BODY=$(echo "$RESULT" | head -n -1)
echo "Status: $CODE"
echo "Body: $BODY"
if [ "$CODE" = "403" ]; then echo "TEST 8: PASS"; else echo "TEST 8: FAIL"; fi

echo ""
echo "===== TEST 9: Valid Participant Authorization ====="
RESULT=$(curl -s -w "\n%{http_code}" http://localhost:3001/api/test/participant -H "Authorization: Bearer $PART_TOKEN")
CODE=$(echo "$RESULT" | tail -1)
BODY=$(echo "$RESULT" | head -n -1)
echo "Status: $CODE"
echo "Body: $BODY"
if [ "$CODE" = "200" ]; then echo "TEST 9: PASS"; else echo "TEST 9: FAIL"; fi

echo ""
echo "===== TEST 10: Organizer Cannot Access Participant ====="
RESULT=$(curl -s -w "\n%{http_code}" http://localhost:3001/api/test/participant -H "Authorization: Bearer $ORG_TOKEN")
CODE=$(echo "$RESULT" | tail -1)
BODY=$(echo "$RESULT" | head -n -1)
echo "Status: $CODE"
echo "Body: $BODY"
if [ "$CODE" = "403" ]; then echo "TEST 10: PASS"; else echo "TEST 10: FAIL"; fi

echo ""
echo "===== TEST 15: Health Endpoints ====="
RESULT=$(curl -s -w "\n%{http_code}" http://localhost:3001/api/health)
CODE=$(echo "$RESULT" | tail -1)
echo "GET /api/health Status: $CODE"
if [ "$CODE" = "200" ]; then echo "TEST 15a: PASS"; else echo "TEST 15a: FAIL"; fi

RESULT=$(curl -s -w "\n%{http_code}" http://localhost:3001/api/health/db)
CODE=$(echo "$RESULT" | tail -1)
echo "GET /api/health/db Status: $CODE"
echo "TEST 15b: DB check returned $CODE (503 expected with placeholder creds)"

kill $SERVER_PID 2>/dev/null
wait $SERVER_PID 2>/dev/null
echo ""
echo "===== ALL API TESTS COMPLETE ====="
