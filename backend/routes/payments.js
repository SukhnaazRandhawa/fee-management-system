const express = require('express');
const db = require('../db');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// @route   POST /api/payments
// @desc    Record a payment for a student
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { student_id, amount_paid, payment_method, academic_year } = req.body;
    const schoolId = req.school.schoolId;

    if (!student_id || !amount_paid || !payment_method || !academic_year) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    // Ensure the student belongs to the logged-in school
    const studentResult = await db.query(
      `SELECT s.id FROM students s
       JOIN classes c ON s.class_id = c.id
       WHERE s.id = $1 AND c.school_id = $2`,
      [student_id, schoolId]
    );
    if (studentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found or not authorized.' });
    }

    // Insert payment
    const newPaymentResult = await db.query(
      `INSERT INTO payments (student_id, amount_paid, payment_method, academic_year)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [student_id, amount_paid, payment_method, academic_year]
    );

    // Fetch school details for receipt
    const schoolResult = await db.query('SELECT name, location FROM schools WHERE id = $1', [schoolId]);
    const schoolDetails = schoolResult.rows[0];

    res.status(201).json({
      ...newPaymentResult.rows[0],
      schoolDetails
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/payments/class/:classId
// @desc    Get all payments for a specific class
// @access  Private
router.get('/class/:classId', protect, async (req, res) => {
  try {
    const { classId } = req.params;
    const schoolId = req.school.schoolId;

    // First, verify this class belongs to the logged-in school
    const classResult = await db.query('SELECT id FROM classes WHERE id = $1 AND school_id = $2', [classId, schoolId]);
    if (classResult.rows.length === 0) {
      return res.status(404).json({ error: 'Class not found or not authorized.' });
    }

    const payments = await db.query(
      `SELECT p.student_id, p.amount_paid, p.payment_date, p.academic_year
       FROM payments p
       JOIN students s ON p.student_id = s.id
       WHERE s.class_id = $1`,
      [classId]
    );

    res.json(payments.rows);
  } catch (err)
  {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router; 