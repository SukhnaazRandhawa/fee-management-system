-- schools.country: collected on registration, referenced in auth.js register
ALTER TABLE schools ADD COLUMN IF NOT EXISTS country VARCHAR(255);

-- schools.role: read in auth.js login (school.role) but never populated by any
-- code path today, so it must stay nullable or registration will break.
ALTER TABLE schools ADD COLUMN IF NOT EXISTS role VARCHAR(50);
