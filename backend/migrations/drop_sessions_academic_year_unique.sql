-- sessions.academic_year had a global UNIQUE constraint from before
-- multi-school support was added, blocking any second school from ever
-- having a session row for an academic year another school already has
-- (i.e. almost always, since every school computes "current" the same
-- way). The correct constraint, unique_current_session_per_school
-- UNIQUE (school_id, is_current), already covers per-school uniqueness
-- and stays untouched.
ALTER TABLE sessions DROP CONSTRAINT IF EXISTS sessions_academic_year_key;
