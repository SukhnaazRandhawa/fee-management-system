const express = require('express');
const db = require('../db');
const { protect } = require('../middleware/authMiddleware');
const requirePrincipal = require('../middleware/requirePrincipal');
const { getAcademicSessionYears, getOverdueStudents } = require('../utils/feeUtils');
const { toCsv } = require('../utils/csvUtils');

const router = express.Router();

// @route   GET /api/reports/collections?period=today|month|year
// @desc    CSV export of payments collected in the given period
// @access  Private, Principal only
router.get('/collections', protect, requirePrincipal, async (req, res) => {
    try {
        const schoolId = req.user.schoolId;
        const { period } = req.query;

        let periodClause;
        const params = [schoolId];
        if (period === 'today') {
            periodClause = 'p.payment_date::date = CURRENT_DATE';
        } else if (period === 'month') {
            periodClause = `DATE_TRUNC('month', p.payment_date) = DATE_TRUNC('month', CURRENT_DATE)`;
        } else if (period === 'year') {
            const { startYear, endYear } = getAcademicSessionYears();
            periodClause = 'p.payment_date >= $2 AND p.payment_date <= $3';
            params.push(`${startYear}-04-01`, `${endYear}-03-31`);
        } else {
            return res.status(400).json({ error: 'Invalid period. Use today, month, or year.' });
        }

        const result = await db.query(
            `SELECT s.name, p.amount_paid, p.payment_method, p.payment_date
             FROM payments p
             JOIN students s ON p.student_id = s.id
             JOIN classes c ON s.class_id = c.id
             WHERE c.school_id = $1 AND p.voided_at IS NULL AND ${periodClause}
             ORDER BY p.payment_date DESC`,
            params
        );

        const csv = toCsv(result.rows, [
            { key: 'name', label: 'Student Name' },
            { key: 'amount_paid', label: 'Amount' },
            { key: 'payment_method', label: 'Payment Method' },
            { key: 'payment_date', label: 'Date', format: v => new Date(v).toISOString().split('T')[0] },
        ]);

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="collections-${period}.csv"`);
        res.status(200).send(csv);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error generating collections report.' });
    }
});

// @route   GET /api/reports/dues
// @desc    CSV export of all currently-overdue students
// @access  Private, Principal only
router.get('/dues', protect, requirePrincipal, async (req, res) => {
    try {
        const schoolId = req.user.schoolId;
        const overdueStudents = await getOverdueStudents(schoolId);

        const csv = toCsv(overdueStudents, [
            { key: 'name', label: 'Student Name' },
            { key: 'class_name', label: 'Class' },
            { key: 'amount_overdue', label: 'Amount Overdue', format: v => v.toFixed(2) },
            { key: 'father_name', label: "Father's Name" },
            { key: 'mother_name', label: "Mother's Name" },
            { key: 'phone', label: 'Phone' },
            { key: 'email', label: 'Email' },
        ]);

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="overdue-students.csv"');
        res.status(200).send(csv);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error generating dues report.' });
    }
});

module.exports = router;
