const express = require('express');
const db = require('../db');
const { protect } = require('../middleware/authMiddleware');
const requirePrincipal = require('../middleware/requirePrincipal');

const router = express.Router();

// @route   POST /api/payments
// @desc    Record a payment for a student
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { student_id, amount_paid, payment_method, academic_year } = req.body;
    const schoolId = req.school.schoolId;
    const recordedBy = req.user.userId;

    //console.log('Payment request received:', { student_id, amount_paid, payment_method, academic_year, schoolId });

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

    //console.log('Student data:', { prevBalance, paymentAmount });

    function getPreviousAcademicYear(currentAcademicYear) {
      const [start, end] = currentAcademicYear.split('-').map(Number);
      return `${start - 1}-${start}`;
    }

    const currentAcademicYear = academic_year; // from request
    const previousAcademicYear = getPreviousAcademicYear(currentAcademicYear);

    let paymentLeft = paymentAmount;
    let prevPaid = 0;
    let currentPaid = 0;
    let prevPaymentResult = null;
    let currentPaymentResult = null;

    // If there is previous balance, apply payment to previous year first
    if (prevBalance > 0) {
        prevPaid = Math.min(paymentLeft, prevBalance);
        prevBalance -= prevPaid;
        paymentLeft -= prevPaid;
        await db.query('UPDATE students SET previous_year_balance = $1 WHERE id = $2', [prevBalance, student_id]);

        // Record payment for previous year
        if (prevPaid > 0) {
          prevPaymentResult = await db.query(
            `INSERT INTO payments (student_id, amount_paid, payment_method, academic_year, recorded_by)
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [student_id, prevPaid, payment_method, previousAcademicYear, recordedBy]
          );
          console.log('Previous payment recorded:', prevPaymentResult.rows[0]);
        }
    }

    // If any payment is left and previous balance is now zero, apply to current year
    if (paymentLeft > 0 && prevBalance === 0) {
        currentPaid = paymentLeft;
        currentPaymentResult = await db.query(
          `INSERT INTO payments (student_id, amount_paid, payment_method, academic_year, recorded_by)
           VALUES ($1, $2, $3, $4, $5) RETURNING *`,
          [student_id, currentPaid, payment_method, currentAcademicYear, recordedBy]
        );
        //console.log('Current payment recorded:', currentPaymentResult.rows[0]);
    }

    // Fetch school details for receipt
    const schoolResult = await db.query('SELECT name FROM schools WHERE id = $1', [schoolId]);
    const schoolDetails = schoolResult.rows[0];

    const response = {
      previousPayment: prevPaymentResult ? prevPaymentResult.rows[0] : null,
      currentPayment: currentPaymentResult ? currentPaymentResult.rows[0] : null,
      schoolDetails,
      previousBalancePaid: prevPaid,
      currentYearPaid: currentPaid
    };

    //console.log('Payment response:', response);
    res.status(201).json(response);
  } catch (err) {
    console.error('Payment error:', err);
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
       WHERE s.class_id = $1 AND p.voided_at IS NULL`,
      [classId]
    );

    res.json(payments.rows);
  } catch (err)
  {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/payments/:id/void
// @desc    Void a payment (principal only). Voided payments are kept for
//          audit history and excluded from totals; corrections are made by
//          voiding and re-entering, never by editing or deleting a row.
// @access  Private, Principal only
router.put('/:id/void', protect, requirePrincipal, async (req, res) => {
  try {
    const { id } = req.params;
    const schoolId = req.school.schoolId;

    const paymentResult = await db.query(
      `SELECT p.id, p.voided_at FROM payments p
       JOIN students s ON p.student_id = s.id
       JOIN classes c ON s.class_id = c.id
       WHERE p.id = $1 AND c.school_id = $2`,
      [id, schoolId]
    );
    if (paymentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Payment not found or not authorized.' });
    }
    if (paymentResult.rows[0].voided_at) {
      return res.status(409).json({ error: 'Payment has already been voided.' });
    }

    const updated = await db.query(
      `UPDATE payments SET voided_at = NOW(), voided_by = $1 WHERE id = $2 RETURNING *`,
      [req.user.userId, id]
    );
    res.json(updated.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error during payment void.' });
  }
});

module.exports = router; 