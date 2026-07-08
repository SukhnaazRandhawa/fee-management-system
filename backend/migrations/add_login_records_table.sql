-- Attendance-style login tracking: one row per user per day (first login
-- only), not a full session log. UNIQUE (user_id, login_date) is enforced
-- together with INSERT ... ON CONFLICT DO NOTHING on the write side.
CREATE TABLE IF NOT EXISTS login_records (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    login_date DATE NOT NULL,
    first_login_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, login_date)
);
