const express = require('express');
const db = require('../db');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// @route   GET /api/dashboard/summary
// @desc    Get dashboard summary stats for the school
// @access  Private
router.get('/summary', protect, async (req, res) => {
    try {
        const schoolId = req.school.schoolId;

        // 1. Total students
        const totalStudentsResult = await db.query(
            `SELECT COUNT(s.id) FROM students s
             JOIN classes c ON s.class_id = c.id
             WHERE c.school_id = $1`,
            [schoolId]
        );
        const totalStudents = parseInt(totalStudentsResult.rows[0].count, 10);

        // 2. Total amount collected today
        const todayCollectionResult = await db.query(
            `SELECT SUM(p.amount_paid) FROM payments p
             JOIN students s ON p.student_id = s.id
             JOIN classes c ON s.class_id = c.id
             WHERE c.school_id = $1 AND p.payment_date::date = CURRENT_DATE`,
            [schoolId]
        );
        const totalCollectedToday = parseFloat(todayCollectionResult.rows[0].sum) || 0;

        // 3. Current month's collection
        const monthCollectionResult = await db.query(
            `SELECT SUM(p.amount_paid) FROM payments p
             JOIN students s ON p.student_id = s.id
             JOIN classes c ON s.class_id = c.id
             WHERE c.school_id = $1 AND DATE_TRUNC('month', p.payment_date) = DATE_TRUNC('month', CURRENT_DATE)`,
            [schoolId]
        );
        const currentMonthCollection = parseFloat(monthCollectionResult.rows[0].sum) || 0;

        // 4. List of students who paid today
        const studentsPaidTodayResult = await db.query(
            `SELECT s.name, p.amount_paid FROM payments p
             JOIN students s ON p.student_id = s.id
             JOIN classes c ON s.class_id = c.id
             WHERE c.school_id = $1 AND p.payment_date::date = CURRENT_DATE`,
            [schoolId]
        );
        const studentsPaidToday = studentsPaidTodayResult.rows;

        // 5. Total Due Calculation
        const allStudentsResult = await db.query(
            `SELECT s.id as student_db_id, s.registration_date, s.previous_year_balance, c.monthly_fee, c.annual_fee 
             FROM students s JOIN classes c ON s.class_id = c.id WHERE c.school_id = $1`,
            [schoolId]
        );
        const allStudents = allStudentsResult.rows;

        const allPaymentsResult = await db.query(
            `SELECT p.student_id, SUM(p.amount_paid) as total_paid
             FROM payments p JOIN students s ON p.student_id = s.id JOIN classes c ON s.class_id = c.id
             WHERE c.school_id = $1 GROUP BY p.student_id`,
            [schoolId]
        );
        
        const paymentsByStudent = allPaymentsResult.rows.reduce((acc, row) => {
            acc[row.student_id] = parseFloat(row.total_paid);
            return acc;
        }, {});
        
        let totalDue = 0;
        const currentDate = new Date();
        
        for (const student of allStudents) {
            let studentOwes = 0;
            const registrationDate = new Date(student.registration_date);
            
            if (registrationDate > currentDate) continue;

            let academicYearStartYear = currentDate.getMonth() < 3 ? currentDate.getFullYear() - 1 : currentDate.getFullYear();
            const academicYearStart = new Date(academicYearStartYear, 3, 1);

            let chargeStartDate = registrationDate > academicYearStart ? registrationDate : academicYearStart;

            studentOwes += parseFloat(student.annual_fee);
            
            let monthsToCharge = (currentDate.getFullYear() - chargeStartDate.getFullYear()) * 12 + (currentDate.getMonth() - chargeStartDate.getMonth()) + 1;
            studentOwes += monthsToCharge * parseFloat(student.monthly_fee);

            studentOwes += parseFloat(student.previous_year_balance);
            
            const studentPaid = paymentsByStudent[student.student_db_id] || 0;
            totalDue += (studentOwes - studentPaid);
        }

        res.json({
            totalStudents,
            totalCollectedToday: totalCollectedToday.toFixed(2),
            currentMonthCollection: currentMonthCollection.toFixed(2),
            studentsPaidToday,
            totalDue: totalDue.toFixed(2)
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router; 