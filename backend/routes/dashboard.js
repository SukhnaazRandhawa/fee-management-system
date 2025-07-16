const express = require('express');
const db = require('../db');
const { protect } = require('../middleware/authMiddleware');
const requirePrincipal = require('../middleware/requirePrincipal');
const { getCurrentAcademicYear } = require('../utils/sessionUtils');

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

        // 2b. Today's collection by payment method
        const todayCollectionByMethodResult = await db.query(
            `SELECT p.payment_method, SUM(p.amount_paid) as total
             FROM payments p
             JOIN students s ON p.student_id = s.id
             JOIN classes c ON s.class_id = c.id
             WHERE c.school_id = $1 AND p.payment_date::date = CURRENT_DATE
             GROUP BY p.payment_method`,
            [schoolId]
        );
        const todayCollectionByMethod = {
            Cash: 0,
            Online: 0,
            Cheque: 0
        };
        todayCollectionByMethodResult.rows.forEach(row => {
            if (row.payment_method && todayCollectionByMethod.hasOwnProperty(row.payment_method)) {
                todayCollectionByMethod[row.payment_method] = parseFloat(row.total) || 0;
            }
        });

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
        const currentDate = new Date();
        //const currentDate = new Date('2026-04-02T10:00:00Z');
        const currentMonth = currentDate.getMonth(); // 0-11 (Jan-Dec)
        const academicSessionStartYear = currentMonth < 3 ? currentDate.getFullYear() - 1 : currentDate.getFullYear();
        const academicSessionEndYear = academicSessionStartYear + 1;
        const academicYearString = `${academicSessionStartYear}-${academicSessionEndYear}`;
        const academicYearCollectionResult = await db.query(
            `SELECT SUM(p.amount_paid) FROM payments p
             JOIN students s ON p.student_id = s.id
             JOIN classes c ON s.class_id = c.id
             WHERE c.school_id = $1 AND p.payment_date >= $2 AND p.payment_date <= $3`,
            [schoolId, `${academicSessionStartYear}-04-01`, `${academicSessionEndYear}-03-31`]
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
                todayCollectionByMethod: {
                    Cash: todayCollectionByMethod.Cash.toFixed(2),
                    Online: todayCollectionByMethod.Online.toFixed(2),
                    Cheque: todayCollectionByMethod.Cheque.toFixed(2)
                },
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
                todayCollectionByMethod: {
                    Cash: todayCollectionByMethod.Cash.toFixed(2),
                    Online: todayCollectionByMethod.Online.toFixed(2),
                    Cheque: todayCollectionByMethod.Cheque.toFixed(2)
                },
                studentsPaidToday,
                totalDue: totalDue.toFixed(2)
            });
        }

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /api/dashboard/session - get current session
router.get('/session', protect, async (req, res) => {
    try {
        const schoolId = req.user.schoolId;
        //console.log('Session request for schoolId:', schoolId);
        
        // Check if we need to auto-start a new session first
        const currentSessionResult = await db.query('SELECT academic_year FROM sessions WHERE school_id = $1 AND is_current = TRUE', [schoolId]);
        //console.log('Current session query result:', currentSessionResult.rows);
        
        if (currentSessionResult.rows.length > 0) {
            const currentSession = currentSessionResult.rows[0].academic_year;
            //console.log('Found current session:', currentSession);
            
            // Check if we should auto-start a new session (May onwards)
            const { shouldAutoStartNewSession, autoStartNewSession } = require('../utils/sessionUtils');
            if (shouldAutoStartNewSession(currentSession)) {
                console.log('Auto-starting new session...');
                await autoStartNewSession(schoolId, currentSession);
                // Get the new session
                const newSessionResult = await db.query('SELECT academic_year FROM sessions WHERE school_id = $1 AND is_current = TRUE', [schoolId]);
                console.log('New session after auto-start:', newSessionResult.rows[0].academic_year);
                res.json({ currentSession: newSessionResult.rows[0].academic_year });
                return;
            }
            
            //console.log('Returning current session:', currentSession);
            res.json({ currentSession: currentSession });
        } else {
            // Fallback: calculate from date
            const fallbackSession = getCurrentAcademicYear();
            //console.log('No session found, using fallback:', fallbackSession);
            res.json({ currentSession: fallbackSession });
        }
    } catch (err) {
        console.error('Error in session endpoint:', err);
        res.status(500).json({ error: 'Server error fetching session.' });
    }
});

// @route   POST /api/dashboard/rollover
// @desc    Archive current year data and start a new session (principal only)
// @access  Private, Principal only
router.post('/rollover', protect, requirePrincipal, async (req, res) => {
    try {
        const schoolId = req.user.schoolId;
        const currentDate = new Date();
        //const currentDate = new Date('2026-04-02T10:00:00Z');

        // 1. Get the current session from the sessions table for this school
        const sessionResult = await db.query('SELECT academic_year FROM sessions WHERE school_id = $1 AND is_current = TRUE LIMIT 1', [schoolId]);
        let currentSession;
        if (sessionResult.rows.length > 0) {
            currentSession = sessionResult.rows[0].academic_year;
        } else {
            // Fallback: calculate from date
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth();
            const startYear = month < 3 ? year - 1 : year;
            const endYear = startYear + 1;
            currentSession = `${startYear}-${endYear}`;
        }

        // 2. Calculate next session
        const [start, end] = currentSession.split('-').map(Number);
        const nextSessionStartYear = end;
        const nextSessionEndYear = nextSessionStartYear + 1;
        const nextSession = `${nextSessionStartYear}-${nextSessionEndYear}`;

        // 3. Only allow rollover if current date is April 1st or later of the next session's start year
        const minRolloverDate = new Date(nextSessionStartYear, 3, 1); // April 1st of next session start year
        //console.log('currentDate:', currentDate, 'minRolloverDate:', minRolloverDate, 'allowRollover:', currentDate >= minRolloverDate);
        if (currentDate < minRolloverDate) {
            return res.status(400).json({ error: `Cannot start ${nextSession} session before April ${nextSessionStartYear}.` });
        }

        // 4. Mark all previous sessions for this school as not current
        await db.query('UPDATE sessions SET is_current = FALSE WHERE school_id = $1', [schoolId]);
        // 5. Insert new session if not exists, set as current
        await db.query('INSERT INTO sessions (academic_year, is_current, school_id) VALUES ($1, TRUE, $2) ON CONFLICT (academic_year, school_id) DO UPDATE SET is_current = TRUE', [nextSession, schoolId]);

        // 6. Get all active students for this school
        const studentsResult = await db.query(
            `SELECT s.*, c.name as class_name FROM students s
             JOIN classes c ON s.class_id = c.id
             WHERE c.school_id = $1 AND s.status = 'active'`,
            [schoolId]
        );
        const students = studentsResult.rows;

        // 7. For each student, archive their data and payments
        for (const student of students) {
            // Get all payments for this student for the current academic year
            const paymentsResult = await db.query(
                `SELECT * FROM payments WHERE student_id = $1 AND academic_year = $2`,
                [student.id, currentSession]
            );
            // Calculate final balance (current balance at end of year)
            const totalPaid = paymentsResult.rows.reduce((sum, p) => sum + parseFloat(p.amount_paid), 0);
            // Get class fee info
            const classResult = await db.query('SELECT * FROM classes WHERE id = $1', [student.class_id]);
            const classInfo = classResult.rows[0];
            let annualFee = parseFloat(classInfo.annual_fee);
            let monthlyFee = parseFloat(classInfo.monthly_fee);
            // Calculate total fees due for the year (April-March)
            let totalFeesDue = annualFee + (monthlyFee * 12);
            let finalBalance = totalFeesDue - totalPaid + parseFloat(student.previous_year_balance);
            // Insert into archived_students
            const archivedStudentResult = await db.query(
                `INSERT INTO archived_students (school_id, class_id, academic_year, student_id, name, father_name, mother_name, email, phone, previous_year_balance, final_balance, status, registration_date, class_name)
                 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING id`,
                [schoolId, student.class_id, currentSession, student.student_id, student.name, student.father_name, student.mother_name, student.email, student.phone, student.previous_year_balance, finalBalance, student.status, student.registration_date, student.class_name]
            );
            const archivedStudentId = archivedStudentResult.rows[0].id;
            // Insert all payments into archived_payments
            for (const payment of paymentsResult.rows) {
                await db.query(
                    `INSERT INTO archived_payments (archived_student_id, amount_paid, payment_date, payment_method)
                     VALUES ($1, $2, $3, $4)`,
                    [archivedStudentId, payment.amount_paid, payment.payment_date, payment.payment_method]
                );
            }
        }

        // 8. Mark all students as inactive and clear their class assignments
        await db.query(`UPDATE students SET status = 'inactive'`);
        // 9. Optionally, clear previous_year_balance for all students (will be set on import)
        await db.query(`UPDATE students SET previous_year_balance = 0`);
        // 10. Delete all classes for this school
        await db.query('DELETE FROM classes WHERE school_id = $1', [schoolId]);

        res.json({ message: `Session rollover complete. ${nextSession} is now current. All data archived and classes cleared for new session.` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error during session rollover.' });
    }
});

module.exports = router; 