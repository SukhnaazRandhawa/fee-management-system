const express = require('express');
const db = require('../db');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// @route   GET /api/classes
// @desc    Get all classes for the logged-in school
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const schoolId = req.school.schoolId;
    const classes = await db.query('SELECT * FROM classes WHERE school_id = $1 ORDER BY name ASC', [schoolId]);
    res.json(classes.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/classes/:id
// @desc    Update a class's details
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    let { name, monthly_fee, annual_fee } = req.body;
    const classId = req.params.id;
    const schoolId = req.school.schoolId;

    // First, verify this class belongs to the logged-in school
    const classResult = await db.query('SELECT school_id FROM classes WHERE id = $1', [classId]);
    if (classResult.rows.length === 0) {
      return res.status(404).json({ error: 'Class not found' });
    }
    if (classResult.rows[0].school_id !== schoolId) {
      return res.status(403).json({ error: 'User not authorized to update this class' });
    }

    name = name.trim().toLowerCase();
    // Update the class
    const updatedClass = await db.query(
      'UPDATE classes SET name = $1, monthly_fee = $2, annual_fee = $3 WHERE id = $4 RETURNING *',
      [name, monthly_fee, annual_fee, classId]
    );

    res.json(updatedClass.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      // Unique violation
      return res.status(409).json({ error: 'Class already exists.' });
    }
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/classes/:id
// @desc    Get a single class by its ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;
    const schoolId = req.school.schoolId;

    const classResult = await db.query(
      'SELECT * FROM classes WHERE id = $1 AND school_id = $2',
      [id, schoolId]
    );

    if (classResult.rows.length === 0) {
      return res.status(404).json({ error: 'Class not found or not authorized.' });
    }

    res.json(classResult.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/classes
// @desc    Add a new class for the logged-in school
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const schoolId = req.school.schoolId;
    let { name, monthly_fee, annual_fee } = req.body;
    if (!name || !monthly_fee || !annual_fee) {
      return res.status(400).json({ error: 'All fields are required.' });
    }
    name = name.trim().toLowerCase();
    const newClass = await db.query(
      'INSERT INTO classes (school_id, name, monthly_fee, annual_fee) VALUES ($1, $2, $3, $4) RETURNING *',
      [schoolId, name, monthly_fee, annual_fee]
    );
    res.status(201).json(newClass.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      // Unique violation
      return res.status(409).json({ error: 'Class already exists.' });
    }
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/classes/:classId/import-students
// @desc    Import students from previous year/class into this class
// @access  Private (principal or staff)
router.post('/:classId/import-students', protect, async (req, res) => {
  try {
    const { classId } = req.params;
    const { sourceClassId, studentIds } = req.body; // studentIds: array of archived_students.id
    const schoolId = req.school.schoolId;

    // 1. Determine previous academic year
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const prevSessionStartYear = currentMonth < 3 ? currentDate.getFullYear() - 2 : currentDate.getFullYear() - 1;
    const prevSessionEndYear = prevSessionStartYear + 1;
    const prevAcademicYear = `${prevSessionStartYear}-${prevSessionEndYear}`;

    // 2. For each selected archived student, import into students table
    let imported = [];
    for (const archivedId of studentIds) {
      // Get archived student
      const result = await db.query(
        `SELECT * FROM archived_students WHERE id = $1 AND class_id = $2 AND academic_year = $3 AND school_id = $4`,
        [archivedId, sourceClassId, prevAcademicYear, schoolId]
      );
      if (result.rows.length === 0) continue;
      const archived = result.rows[0];
      // Insert into students table
      const newStudentResult = await db.query(
        `INSERT INTO students (student_id, class_id, name, father_name, mother_name, email, phone, previous_year_balance, status, registration_date)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'active',NOW()) RETURNING *`,
        [archived.student_id, classId, archived.name, archived.father_name, archived.mother_name, archived.email, archived.phone, archived.final_balance]
      );
      imported.push(newStudentResult.rows[0]);
    }
    res.json({ message: 'Students imported successfully.', imported });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error during student import.' });
  }
});

// @route   GET /api/classes/:classId/fee-history
// @desc    Get fee history for a class and academic year
// @access  Private (principal or staff)
router.get('/:classId/fee-history', protect, async (req, res) => {
  try {
    const { classId } = req.params;
    const { year } = req.query; // academic year string, e.g., '2025-2026'
    const schoolId = req.school.schoolId;
    if (!year) {
      return res.status(400).json({ error: 'Academic year is required.' });
    }
    // Get archived students for this class and year
    const studentsResult = await db.query(
      `SELECT * FROM archived_students WHERE class_id = $1 AND academic_year = $2 AND school_id = $3`,
      [classId, year, schoolId]
    );
    const students = studentsResult.rows;
    // For each student, get their payments
    for (const student of students) {
      const paymentsResult = await db.query(
        `SELECT amount_paid, payment_date, payment_method FROM archived_payments WHERE archived_student_id = $1 ORDER BY payment_date ASC`,
        [student.id]
      );
      student.payments = paymentsResult.rows;
    }
    res.json({ students });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching fee history.' });
  }
});

// @route   GET /api/classes/:classId/fee-history-years
// @desc    Get all available academic years for a class from archived_students
// @access  Private (principal or staff)
router.get('/:classId/fee-history-years', protect, async (req, res) => {
  try {
    const { classId } = req.params;
    const schoolId = req.school.schoolId;
    const yearsResult = await db.query(
      `SELECT DISTINCT academic_year FROM archived_students WHERE class_id = $1 AND school_id = $2 ORDER BY academic_year DESC`,
      [classId, schoolId]
    );
    const years = yearsResult.rows.map(r => r.academic_year);
    res.json({ years });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching years.' });
  }
});

module.exports = router;