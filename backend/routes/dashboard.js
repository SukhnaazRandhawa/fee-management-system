const express = require('express');
const db = require('../db');
const { protect } = require('../middleware/authMiddleware');
const requirePrincipal = require('../middleware/requirePrincipal');

const router = express.Router();

// @route   GET /api/dashboard/summary
// @desc    Get dashboard summary stats for the school
// @access  Private, Principal or Staff
router.get('/summary', protect, async (req, res) => {
    try {
        const schoolId = req.user.schoolId;
        const role = req.user.role;

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

        // 3b. Current academic year's collection (April to March)
        // Academic year starts in April and ends in March next year
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth(); // 0-11 (Jan-Dec)
        const academicSessionStartYear = currentMonth < 3 ? currentDate.getFullYear() - 1 : currentDate.getFullYear();
        const academicSessionEndYear = academicSessionStartYear + 1;
        const academicYearStart = `${academicSessionStartYear}-04-01`;
        const academicYearEnd = `${academicSessionEndYear}-03-31`;
        const academicYearString = `${academicSessionStartYear}-${academicSessionEndYear}`;
        const academicYearCollectionResult = await db.query(
            `SELECT SUM(p.amount_paid) FROM payments p
             JOIN students s ON p.student_id = s.id
             JOIN classes c ON s.class_id = c.id
             WHERE c.school_id = $1 AND p.payment_date >= $2 AND p.payment_date <= $3`,
            [schoolId, academicYearStart, academicYearEnd]
        );
        const currentAcademicYearCollection = parseFloat(academicYearCollectionResult.rows[0].sum) || 0;
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        const currentMonthName = monthNames[currentMonth];

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
        
        const academicYearMonths = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];

        for (const student of allStudents) {
            const studentPaid = paymentsByStudent[student.student_db_id] || 0;
            const annualFee = parseFloat(student.annual_fee);
            const monthlyFee = parseFloat(student.monthly_fee);

            const currentMonth = currentDate.getMonth(); // 0-11 (Jan-Dec)
            // Academic year is Apr-Mar. If current month is Jan, Feb, or Mar (0,1,2), we are in the academic year that started LAST calendar year.
            const academicSessionStartYear = currentMonth < 3 ? currentDate.getFullYear() - 1 : currentDate.getFullYear();

            // Determine how many months of the session have passed.
            const monthsPassed = academicYearMonths.filter((_, index) => {
                // index 0 is April, 1 is May ... 9 is Jan, 10 is Feb, 11 is Mar
                const monthDate = new Date(academicSessionStartYear + (index >= 9 ? 1 : 0), (index + 3) % 12, 1);
                return currentDate >= monthDate;
            }).length;

            let totalFeesDueSoFar = 0;
            // Only add annual fee if the academic session has started.
            const sessionStartDate = new Date(academicSessionStartYear, 3, 1); // April 1st
            if (currentDate >= sessionStartDate) {
                totalFeesDueSoFar += annualFee;
            }
            
            totalFeesDueSoFar += monthsPassed * monthlyFee;
            
            const currentBalance = totalFeesDueSoFar - studentPaid;
            const studentTotalDue = currentBalance + parseFloat(student.previous_year_balance);

            if (studentTotalDue > 0) {
                totalDue += studentTotalDue;
            }
        }

        // Principal gets all data, staff gets limited data
        if (role === 'principal') {
            res.json({
                totalStudents,
                totalCollectedToday: totalCollectedToday.toFixed(2),
                currentMonthCollection: currentMonthCollection.toFixed(2),
                currentMonthName,
                currentAcademicYearCollection: currentAcademicYearCollection.toFixed(2),
                academicYearString,
                studentsPaidToday,
                totalDue: totalDue.toFixed(2)
            });
        } else {
            res.json({
                totalStudents,
                totalCollectedToday: totalCollectedToday.toFixed(2),
                studentsPaidToday,
                totalDue: totalDue.toFixed(2)
            });
        }

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router; 