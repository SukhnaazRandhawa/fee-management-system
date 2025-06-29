-- Table to store archived student data for each academic year
CREATE TABLE IF NOT EXISTS archived_students (
    id SERIAL PRIMARY KEY,
    school_id INTEGER NOT NULL,
    class_id INTEGER NOT NULL,
    academic_year VARCHAR(9) NOT NULL, -- e.g., '2025-2026'
    student_id TEXT NOT NULL,
    name TEXT NOT NULL,
    father_name TEXT NOT NULL,
    mother_name TEXT NOT NULL,
    email TEXT,
    phone TEXT NOT NULL,
    previous_year_balance DECIMAL(10, 2) DEFAULT 0.00,
    final_balance DECIMAL(10, 2) DEFAULT 0.00,
    status VARCHAR(20) DEFAULT 'active',
    registration_date TIMESTAMPTZ,
    graduation_date TIMESTAMPTZ,
    class_name TEXT NOT NULL
);

-- Table to store archived payments for each student/year
CREATE TABLE IF NOT EXISTS archived_payments (
    id SERIAL PRIMARY KEY,
    archived_student_id INTEGER NOT NULL REFERENCES archived_students(id) ON DELETE CASCADE,
    amount_paid DECIMAL(10, 2) NOT NULL,
    payment_date TIMESTAMPTZ DEFAULT NOW(),
    payment_method TEXT NOT NULL
); 