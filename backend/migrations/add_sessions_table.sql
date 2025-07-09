CREATE TABLE IF NOT EXISTS sessions (
    id SERIAL PRIMARY KEY,
    academic_year VARCHAR(9) NOT NULL UNIQUE, -- e.g., '2025-2026'
    is_current BOOLEAN DEFAULT FALSE
); 