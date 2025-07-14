-- Drop tables if they exist to start from a clean state
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS students;
DROP TABLE IF EXISTS classes;
DROP TABLE IF EXISTS schools;

-- Table for schools
CREATE TABLE schools (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    num_classes INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    reset_password_token TEXT,
    reset_password_expires TIMESTAMPTZ
);

-- Table for classes
CREATE TABLE classes (
    id SERIAL PRIMARY KEY,
    school_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    monthly_fee DECIMAL(10, 2) NOT NULL,
    annual_fee DECIMAL(10, 2) NOT NULL,
    CONSTRAINT fk_school
        FOREIGN KEY(school_id)
        REFERENCES schools(id)
        ON DELETE CASCADE
);

-- Table for students
CREATE TABLE students (
    id SERIAL PRIMARY KEY,
    student_id TEXT UNIQUE NOT NULL,
    class_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    father_name TEXT NOT NULL,
    mother_name TEXT NOT NULL,
    email TEXT,
    phone TEXT NOT NULL,
    previous_year_balance DECIMAL(10, 2) DEFAULT 0.00,
    registration_date TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_class
        FOREIGN KEY(class_id)
        REFERENCES classes(id)
        ON DELETE CASCADE
);

-- Table for payments
CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL,
    amount_paid DECIMAL(10, 2) NOT NULL,
    payment_date TIMESTAMPTZ DEFAULT NOW(),
    payment_method TEXT NOT NULL,
    academic_year VARCHAR(9) NOT NULL, -- e.g., '2024-2025'
    CONSTRAINT fk_student
        FOREIGN KEY(student_id)
        REFERENCES students(id)
        ON DELETE CASCADE
);

--Table for Users 
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    school_id INTEGER,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    reset_password_token TEXT,
    reset_password_expires TIMESTAMPTZ
);