-- students.js's update route has always assumed archived_students has this
-- column (keeping contact info in sync across historical years whenever a
-- student's record is edited), but it was never added when students.address
-- was, causing every student edit to fail after the students table had
-- already committed.
ALTER TABLE archived_students ADD COLUMN IF NOT EXISTS address TEXT;
