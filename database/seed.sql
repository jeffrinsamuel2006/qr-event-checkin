-- QR Event Check-In System - Seed Data
-- Run this AFTER schema.sql
-- Safe to re-run: clears and re-inserts demo data

-- Clear existing seed data (in reverse dependency order)
DELETE FROM scan_logs;
DELETE FROM checkins;
DELETE FROM attendees;
DELETE FROM events;
DELETE FROM users;

-- ==================================================
-- ORGANIZER (1)
-- ==================================================
INSERT INTO users (id, name, email, password_hash, role) VALUES
('a0000000-0000-0000-0000-000000000001', 'Demo Organizer', 'organizer@demo.com', '$2b$10$XwFg4mzM3GcAp0mIadDC3eyMm6C90dJjDPrNFWi6IJpJwLfJqP4Yq', 'ORGANIZER');

-- ==================================================
-- PARTICIPANTS (5)
-- ==================================================
INSERT INTO users (id, name, email, password_hash, role) VALUES
('b0000000-0000-0000-0000-000000000001', 'Alice Participant', 'alice@demo.com', '$2b$10$.0AvoVOKIaKDgKUQ9TuBl.aSJFSWu5liT8GJZtaPmZu2AzI1k8fDK', 'PARTICIPANT'),
('b0000000-0000-0000-0000-000000000002', 'Bob Participant', 'bob@demo.com', '$2b$10$.0AvoVOKIaKDgKUQ9TuBl.aSJFSWu5liT8GJZtaPmZu2AzI1k8fDK', 'PARTICIPANT'),
('b0000000-0000-0000-0000-000000000003', 'Charlie Participant', 'charlie@demo.com', '$2b$10$.0AvoVOKIaKDgKUQ9TuBl.aSJFSWu5liT8GJZtaPmZu2AzI1k8fDK', 'PARTICIPANT'),
('b0000000-0000-0000-0000-000000000004', 'Diana Participant', 'diana@demo.com', '$2b$10$.0AvoVOKIaKDgKUQ9TuBl.aSJFSWu5liT8GJZtaPmZu2AzI1k8fDK', 'PARTICIPANT'),
('b0000000-0000-0000-0000-000000000005', 'Eve Participant', 'eve@demo.com', '$2b$10$.0AvoVOKIaKDgKUQ9TuBl.aSJFSWu5liT8GJZtaPmZu2AzI1k8fDK', 'PARTICIPANT');

-- ==================================================
-- ACTIVE EVENT (1)
-- ==================================================
INSERT INTO events (id, name, description, event_date, status, created_by) VALUES
('c0000000-0000-0000-0000-000000000001', 'Tech Summit 2026', 'Annual technology conference and hackathon', '2026-08-27 09:00:00+00', 'ACTIVE', 'a0000000-0000-0000-0000-000000000001');

-- ==================================================
-- ATTENDEES (5 participants registered for the event)
-- ==================================================
INSERT INTO attendees (id, event_id, user_id, attendee_code) VALUES
('d0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'ATT-001'),
('d0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 'ATT-002'),
('d0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000003', 'ATT-003'),
('d0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000004', 'ATT-004'),
('d0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000005', 'ATT-005');
