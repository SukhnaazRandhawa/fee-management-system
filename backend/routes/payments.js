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

    // 1. Get the student's previous year balance
    const studentData = await db.query('SELECT previous_year_balance FROM students WHERE id = $1', [student_id]);
    let prevBalance = parseFloat(studentData.rows[0].previous_year_balance);
    let paymentAmount = parseFloat(amount_paid);

    // Always record the payment
    const newPaymentResult = await db.query(
      `INSERT INTO payments (student_id, amount_paid, payment_method, academic_year)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [student_id, amount_paid, payment_method, academic_year]
    );

    // Now apply the payment to previous balance and/or current year
    let paymentLeft = parseFloat(amount_paid);
    let prevPaid = 0;
    let currentPaid = 0;

    if (prevBalance > 0) {
        prevPaid = Math.min(paymentLeft, prevBalance);
        prevBalance -= prevPaid;
        paymentLeft -= prevPaid;
        await db.query('UPDATE students SET previous_year_balance = $1 WHERE id = $2', [prevBalance, student_id]);
    }
    if (paymentLeft > 0) {
        currentPaid = paymentLeft;
        // (You may want to update current year fee status here if needed)
    }

    // Fetch school details for receipt
    const schoolResult = await db.query('SELECT name, location FROM schools WHERE id = $1', [schoolId]);
    const schoolDetails = schoolResult.rows[0];

    res.status(201).json({
      ...(newPaymentResult ? newPaymentResult.rows[0] : {}),
      schoolDetails,
      previousBalancePaid: prevPaid,
      currentYearPaid: currentPaid
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