# Testing Guide — QR Event Check-In System

## Setup: Load Additional Test Data

Before testing, run the additional test data in Supabase:

1. Open your Supabase Dashboard → SQL Editor
2. Paste and run the contents of `database/test-data.sql`
3. This adds more users, events, and attendees

## Quick Reference — All Test Accounts

### Organizers

| Email | Password | Notes |
|-------|----------|-------|
| `organizer@demo.com` | `Organizer@123` | Main organizer |
| `sam@demo.com` | `Organizer@123` | Co-organizer |

### Participants

| Email | Password | Attendee Code | Active Event |
|-------|----------|---------------|--------------|
| `alice@demo.com` | `Participant@123` | ATT-001 | Tech Summit 2026 |
| `bob@demo.com` | `Participant@123` | ATT-002 | Tech Summit 2026 |
| `charlie@demo.com` | `Participant@123` | ATT-003 | Tech Summit 2026 |
| `diana@demo.com` | `Participant@123` | ATT-004 | Tech Summit 2026 |
| `eve@demo.com` | `Participant@123` | ATT-005 | Tech Summit 2026 |
| `frank@demo.com` | `Participant@123` | ATT-101 | Tech Summit 2026 |
| `grace@demo.com` | `Participant@123` | ATT-102 | Tech Summit 2026 |
| `hank@demo.com` | `Participant@123` | ATT-103 | Tech Summit 2026 |
| `ivy@demo.com` | `Participant@123` | ATT-104 | Winter Hackathon 2026 |
| `jack@demo.com` | `Participant@123` | ATT-105 | Winter Hackathon 2026 |

### Events

| Event | Status | Registered | Pre-checked-in |
|-------|--------|------------|----------------|
| Tech Summit 2026 | ACTIVE | 11 | 8 (ATT-001 to ATT-005 + ATT-101 to ATT-103) |
| Winter Hackathon 2026 | UPCOMING | 6 | 0 |
| Spring Meetup 2026 | COMPLETED | 3 | 2 |

---

## Test Scenarios

### SCENARIO 1: Organizer Login & Dashboard

**Steps:**
1. Open `http://localhost:5173`
2. Log in as `organizer@demo.com` / `Organizer@123`
3. Observe the Organizer Dashboard

**Expected:**
- Dashboard shows "Tech Summit 2026"
- Status: ACTIVE (green)
- Total Registered: 11
- Checked In: 8
- Remaining: 3
- Attendance %: ~73%
- Table shows 8 checked-in attendees
- "Live" or "Offline" indicator visible
- Refresh button works

---

### SCENARIO 2: Manual Check-In (Success)

**Steps:**
1. As organizer, scroll to "Check-In Attendee" section
2. Type `ATT-004` in the attendee code field
3. Click "Check In"

**Expected:**
- Green success message: "Check-in successful"
- Shows attendee code and timestamp
- Dashboard counts update: Checked In → 9, Remaining → 2
- Diana appears in the checked-in attendees table

---

### SCENARIO 3: Manual Check-In (Duplicate)

**Steps:**
1. Type `ATT-004` again (Diana is already checked in)
2. Click "Check In"

**Expected:**
- Yellow warning message: "Already checked in"
- Dashboard counts do NOT change
- Still shows Checked In: 9

---

### SCENARIO 4: Manual Check-In (Unknown Attendee)

**Steps:**
1. Type `ATT-999` (does not exist)
2. Click "Check In"

**Expected:**
- Red error message: "Unknown attendee code"
- Dashboard counts do NOT change

---

### SCENARIO 5: QR Code Scanner

**Steps:**
1. As organizer, click "📷 Scan QR Code"
2. Camera should activate (allow camera access if prompted)
3. Have a participant show their QR code to the camera

**Expected:**
- Camera feed displays
- QR code is detected
- Check-in processes automatically
- Result shows success/duplicate/unknown
- "Scan Next" button appears to scan another

---

### SCENARIO 6: Participant Portal

**Steps:**
1. Log out of organizer account
2. Log in as `alice@demo.com` / `Participant@123`

**Expected:**
- Shows "Alice Participant" and email
- Event: Tech Summit 2026
- QR code displayed with code ATT-001
- "Download QR" button works
- Status shows check-in status

---

### SCENARIO 7: Participant Cannot Access Organizer Routes

**Steps:**
1. As Alice (participant), try to navigate to `/organizer` in the URL bar

**Expected:**
- Redirects back to participant portal
- Backend returns 403 if somehow accessed

---

### SCENARIO 8: Organizer Cannot Access Participant Routes

**Steps:**
1. Log in as organizer
2. Try to navigate to `/participant` in the URL bar

**Expected:**
- Redirects to organizer dashboard

---

### SCENARIO 9: Wrong Password

**Steps:**
1. Go to login page
2. Enter `organizer@demo.com` with password `wrongpassword`
3. Click Sign In

**Expected:**
- Error: "Invalid email or password"
- Stays on login page

---

### SCENARIO 10: Unknown Email

**Steps:**
1. Enter `unknown@test.com` with any password
2. Click Sign In

**Expected:**
- Error: "Invalid email or password"

---

### SCENARIO 11: Realtime Dashboard Update (Two Browsers)

**Steps:**
1. Open `http://localhost:5173` in **Browser A** — log in as organizer
2. Open `http://localhost:5173` in **Browser B** — log in as organizer
3. In Browser B, check in `ATT-004` (Diana)
4. Look at Browser A's dashboard

**Expected:**
- If Realtime is connected: Browser A updates automatically
- If Realtime is offline: Click Refresh on Browser A to see the update
- Both dashboards show the same data

---

### SCENARIO 12: Concurrent Duplicate Protection

**Steps:**
1. Open two browser tabs as organizer
2. In both tabs, quickly check in `ATT-005` (Eve) at the same time
3. Check the results

**Expected:**
- One tab shows: SUCCESS
- Other tab shows: DUPLICATE (409)
- Dashboard shows exactly one check-in for Eve

---

### SCENARIO 13: Logout & Session

**Steps:**
1. Log in as organizer
2. Note the dashboard loads
3. Click Logout
4. Try to navigate directly to `/organizer`

**Expected:**
- Redirects to login page
- Token is cleared from localStorage

---

### SCENARIO 14: Multiple Organizer Check-Ins

**Steps:**
1. Log in as `sam@demo.com` / `Organizer@123` (co-organizer)
2. Check in `ATT-004` (Diana)
3. View dashboard

**Expected:**
- Check-in succeeds (Sam is also an organizer)
- Dashboard shows "Scanned By: Co-Organizer Sam" for Diana's entry

---

### SCENARIO 15: Participant QR Code Download

**Steps:**
1. Log in as `alice@demo.com`
2. Click "Download QR"
3. Check your downloads folder

**Expected:**
- PNG file downloads named `qr-ATT-001.png`
- Image shows the QR code

---

### SCENARIO 16: Backend Health Endpoints

**Steps:**
Open in browser or use curl:
```
http://localhost:3002/api/health
http://localhost:3002/api/health/db
```

**Expected:**
- `/api/health`: `{"success":true,"message":"Backend is running"}`
- `/api/health/db`: `{"success":true,"database":"connected"}`

---

### SCENARIO 17: API Direct Test (No Browser)

**Steps:**
```bash
# Login
curl -X POST http://localhost:3002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"organizer@demo.com","password":"Organizer@123"}'

# Copy the token, then:
curl http://localhost:3002/api/organizer/dashboard \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected:**
- Login returns 200 with token
- Dashboard returns 200 with event and attendance data

---

## Regression Tests

Run these to verify all phases still pass:

```bash
cd D:\hackthecloud\qr-event-checkin\backend

# Phase 2 — Auth (expect 11/11)
node test-all.js

# Phase 3 — Participant (expect 11/11)
node test-phase3.js

# Phase 4 — Check-in Security (expect 16/16)
node test-phase4.js

# Phase 5 — Dashboard (expect 29/29)
node test-phase5.js
```
