-- Add school_id to sessions table
ALTER TABLE sessions ADD COLUMN school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE;

-- Update existing sessions to have a default school_id (for backward compatibility)
-- This assumes school_id 18 (King Edward) as the default
-- UPDATE sessions SET school_id = 18 WHERE school_id IS NULL;

-- Make school_id NOT NULL after setting default values
ALTER TABLE sessions ALTER COLUMN school_id SET NOT NULL;

-- Add unique constraint to ensure one current session per school
ALTER TABLE sessions ADD CONSTRAINT unique_current_session_per_school UNIQUE (school_id, is_current); 