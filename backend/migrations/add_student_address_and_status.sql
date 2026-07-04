-- students.address: collected on registration/update in students.js
ALTER TABLE students ADD COLUMN IF NOT EXISTS address TEXT;

-- students.status: filtered on in dashboard.js rollover ("WHERE s.status = 'active'")
-- but never set by POST /students/register, so it must default to 'active'
-- or newly registered students silently drop out of the year-end rollover.
ALTER TABLE students ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';
