-- ============================================================
-- ADDITIONAL TEST DATA FOR COMPREHENSIVE TESTING
-- ============================================================
-- Run this AFTER seed.sql in Supabase SQL Editor
-- Adds: more users, multiple events, more attendees, check-ins
-- ============================================================

-- ============================================================
-- ADDITIONAL USERS
-- ============================================================
-- Second organizer
INSERT INTO users (id, name, email, password_hash, role) VALUES
('a0000000-0000-0000-0000-000000000002', 'Co-Organizer Sam', 'sam@demo.com', '$2b$10$XwFg4mzM3GcAp0mIadDC3eyMm6C90dJjDPrNFWi6IJpJwLfJqP4Yq', 'ORGANIZER')
ON CONFLICT (email) DO NOTHING;

-- More participants
INSERT INTO users (id, name, email, password_hash, role) VALUES
('b0000000-0000-0000-0000-000000000006', 'Frank Participant', 'frank@demo.com', '$2b$10$.0AvoVOKIaKDgKUQ9TuBl.aSJFSWu5liT8GJZtaPmZu2AzI1k8fDK', 'PARTICIPANT'),
('b0000000-0000-0000-0000-000000000007', 'Grace Participant', 'grace@demo.com', '$2b$10$.0AvoVOKIaKDgKUQ9TuBl.aSJFSWu5liT8GJZtaPmZu2AzI1k8fDK', 'PARTICIPANT'),
('b0000000-0000-0000-0000-000000000008', 'Hank Participant', 'hank@demo.com', '$2b$10$.0AvoVOKIaKDgKUQ9TuBl.aSJFSWu5liT8GJZtaPmZu2AzI1k8fDK', 'PARTICIPANT'),
('b0000000-0000-0000-0000-000000000009', 'Ivy Participant', 'ivy@demo.com', '$2b$10$.0AvoVOKIaKDgKUQ9TuBl.aSJFSWu5liT8GJZtaPmZu2AzI1k8fDK', 'PARTICIPANT'),
('b0000000-0000-0000-0000-000000000010', 'Jack Participant', 'jack@demo.com', '$2b$10$.0AvoVOKIaKDgKUQ9TuBl.aSJFSWu5liT8GJZtaPmZu2AzI1k8fDK', 'PARTICIPANT')
ON CONFLICT (email) DO NOTHING;

-- ============================================================
-- ADDITIONAL EVENTS
-- ============================================================
-- UPCOMING event
INSERT INTO events (id, name, description, event_date, status, created_by) VALUES
('c0000000-0000-0000-0000-000000000002', 'Winter Hackathon 2026', 'Annual winter coding marathon', '2026-12-15 09:00:00+00', 'UPCOMING', 'a0000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- COMPLETED event
INSERT INTO events (id, name, description, event_date, status, created_by) VALUES
('c0000000-0000-0000-0000-000000000003', 'Spring Meetup 2026', 'Developer networking event', '2026-04-10 14:00:00+00', 'COMPLETED', 'a0000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- ATTENDEES FOR UPCOMING EVENT
-- ============================================================
INSERT INTO attendees (id, event_id, user_id, attendee_code) VALUES
('d0000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'ATT-101'),
('d0000000-0000-0000-0000-000000000007', 'c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000006', 'ATT-102'),
('d0000000-0000-0000-0000-000000000008', 'c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000007', 'ATT-103'),
('d0000000-0000-0000-0000-000000000009', 'c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000008', 'ATT-104'),
('d0000000-0000-0000-0000-000000000010', 'c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000009', 'ATT-105'),
('d0000000-0000-0000-0000-000000000011', 'c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000010', 'ATT-106')
ON CONFLICT (attendee_code) DO NOTHING;

-- ============================================================
-- ATTENDEES FOR COMPLETED EVENT
-- ============================================================
INSERT INTO attendees (id, event_id, user_id, attendee_code) VALUES
('d0000000-0000-0000-0000-000000000012', 'c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001', 'ATT-201'),
('d0000000-0000-0000-0000-000000000013', 'c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000002', 'ATT-202'),
('d0000000-0000-0000-0000-000000000014', 'c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000003', 'ATT-203')
ON CONFLICT (attendee_code) DO NOTHING;

-- ============================================================
-- PRE-EXISTING CHECK-INS FOR ACTIVE EVENT (simulates earlier scans)
-- ============================================================
-- Check in Frank, Grace, and Hank for Tech Summit 2026
INSERT INTO checkins (event_id, attendee_id, scanned_by) VALUES
('c0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001'),
('c0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000001'),
('c0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000001')
ON CONFLICT (event_id, attendee_id) DO NOTHING;

-- ============================================================
-- CHECK-INS FOR COMPLETED EVENT
-- ============================================================
INSERT INTO checkins (event_id, attendee_id, scanned_by) VALUES
('c0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000012', 'a0000000-0000-0000-0000-000000000001'),
('c0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000013', 'a0000000-0000-0000-0000-000000000001')
ON CONFLICT (event_id, attendee_id) DO NOTHING;

-- ============================================================
-- SCAN LOGS (various outcomes for realism)
-- ============================================================
INSERT INTO scan_logs (event_id, code, result, scanned_by) VALUES
('c0000000-0000-0000-0000-000000000001', 'ATT-001', 'SUCCESS', 'a0000000-0000-0000-0000-000000000001'),
('c0000000-0000-0000-0000-000000000001', 'ATT-001', 'DUPLICATE', 'a0000000-0000-0000-0000-000000000001'),
('c0000000-0000-0000-0000-000000000001', 'ATT-999', 'UNKNOWN_ATTENDEE', 'a0000000-0000-0000-0000-000000000001'),
('c0000000-0000-0000-0000-000000000001', 'FAKE-CODE', 'UNKNOWN_ATTENDEE', 'a0000000-0000-0000-0000-000000000001')
ON CONFLICT DO NOTHING;

-- ============================================================
-- SUMMARY
-- ============================================================
-- After running this script:
-- Users:        11 (2 organizers + 9 participants)
-- Events:       3  (1 ACTIVE, 1 UPCOMING, 1 COMPLETED)
-- Attendees:    14 (5 for ACTIVE + 6 for UPCOMING + 3 for COMPLETED)
-- Check-ins:    10 (5 original + 3 new for ACTIVE + 2 for COMPLETED)
-- Scan logs:    15+
