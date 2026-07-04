-- School-level login (POST /api/auth/login) was removed; every login is now
-- tied to a real person via /api/auth/user-login. schools.password and
-- schools.role are unused by the app going forward (left in place, no rush
-- to drop). Nothing will ever populate schools.password again, so it can no
-- longer be NOT NULL or POST /api/auth/register would fail on every insert.
ALTER TABLE schools ALTER COLUMN password DROP NOT NULL;
