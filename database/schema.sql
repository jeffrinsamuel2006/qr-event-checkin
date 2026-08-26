-- QR Event Check-In System - Database Schema
-- Run this in Supabase SQL Editor
-- Safe to re-run: uses IF NOT EXISTS / DROP IF EXISTS

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop tables in reverse dependency order (safe to re-run)
DROP TABLE IF EXISTS scan_logs CASCADE;
DROP TABLE IF EXISTS checkins CASCADE;
DROP TABLE IF EXISTS attendees CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ==================================================
-- TABLE: users
-- ==================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('ORGANIZER', 'PARTICIPANT')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- ==================================================
-- TABLE: events
-- ==================================================
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    event_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'UPCOMING' CHECK (status IN ('UPCOMING', 'ACTIVE', 'COMPLETED')),
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- ==================================================
-- TABLE: attendees
-- ==================================================
CREATE TABLE attendees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    attendee_code VARCHAR(20) NOT NULL UNIQUE,
    registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- ==================================================
-- TABLE: checkins
-- ==================================================
CREATE TABLE checkins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    attendee_id UUID NOT NULL REFERENCES attendees(id) ON DELETE CASCADE,
    scanned_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    checked_in_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    CONSTRAINT unique_event_attendee UNIQUE (event_id, attendee_id)
);

-- ==================================================
-- TABLE: scan_logs
-- ==================================================
CREATE TABLE scan_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES events(id) ON DELETE SET NULL,
    code VARCHAR(20) NOT NULL,
    result VARCHAR(30) NOT NULL CHECK (result IN ('SUCCESS', 'DUPLICATE', 'UNKNOWN_ATTENDEE', 'SERVER_ERROR')),
    scanned_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- ==================================================
-- INDEXES
-- ==================================================
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_attendees_attendee_code ON attendees(attendee_code);
CREATE INDEX idx_attendees_event_id ON attendees(event_id);
CREATE INDEX idx_checkins_event_id ON checkins(event_id);
CREATE INDEX idx_checkins_attendee_id ON checkins(attendee_id);
CREATE INDEX idx_checkins_checked_in_at ON checkins(checked_in_at);
CREATE INDEX idx_scan_logs_event_id ON scan_logs(event_id);
CREATE INDEX idx_scan_logs_created_at ON scan_logs(created_at);
