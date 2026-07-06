const db = require('../db');

const academicYearMonths = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];

// Returns { startYear, endYear } for the academic session (Apr-Mar) that
// contains currentDate, e.g. April 2026 -> { startYear: 2026, endYear: 2027 }.
function getAcademicSessionYears(currentDate = new Date()) {
    const currentMonth = currentDate.getMonth(); // 0-11 (Jan-Dec)
    const startYear = currentMonth < 3 ? currentDate.getFullYear() - 1 : currentDate.getFullYear();
    return { startYear, endYear: startYear + 1 };
}

// Total amount due for a student as of now: months elapsed x monthly fee,
// plus the annual fee once the session has started, plus prior-year
// balance, minus what they've already paid this session.
function calculateStudentDue({ previousYearBalance, monthlyFee, annualFee, studentPaid, currentDate = new Date() }) {
    const currentMonth = currentDate.getMonth(); // 0-11 (Jan-Dec)
    // Academic year is Apr-Mar. If current month is Jan-Mar, we're in the
    // session that started last calendar year.
    const academicSessionStartYear = currentMonth < 3 ? currentDate.getFullYear() - 1 : currentDate.getFullYear();

    const monthsPassed = academicYearMonths.filter((_, index) => {
        // index 0 is April, 1 is May ... 9 is Jan, 10 is Feb, 11 is Mar
        const monthDate = new Date(academicSessionStartYear + (index >= 9 ? 1 : 0), (index + 3) % 12, 1);
        return currentDate >= monthDate;
    }).length;

    let totalFeesDueSoFar = 0;
    // Only add the annual fee once the session has started.
    const sessionStartDate = new Date(academicSessionStartYear, 3, 1); // April 1st
    if (currentDate >= sessionStartDate) {
        totalFeesDueSoFar += annualFee;
    }
    totalFeesDueSoFar += monthsPassed * monthlyFee;

    const currentBalance = totalFeesDueSoFar - studentPaid;
    return currentBalance + previousYearBalance;
}

// Returns every student in the school with an outstanding balance
// (amount_overdue > 0), sorted highest-first. Shared by the dashboard's
// /overdue endpoint and the CSV dues report so the computation lives in
// exactly one place.
async function getOverdueStudents(schoolId, currentDate = new Date()) {
    const studentsResult = await db.query(
        `SELECT s.id, s.student_id, s.name, s.phone, s.father_name, s.mother_name, s.email,
                s.previous_year_balance, c.name as class_name, c.monthly_fee, c.annual_fee
         FROM students s
         JOIN classes c ON s.class_id = c.id
         WHERE c.school_id = $1`,
        [schoolId]
    );

    const paymentsResult = await db.query(
        `SELECT p.student_id, SUM(p.amount_paid) as total_paid
         FROM payments p JOIN students s ON p.student_id = s.id JOIN classes c ON s.class_id = c.id
         WHERE c.school_id = $1 AND p.voided_at IS NULL GROUP BY p.student_id`,
        [schoolId]
    );
    const paymentsByStudent = paymentsResult.rows.reduce((acc, row) => {
        acc[row.student_id] = parseFloat(row.total_paid);
        return acc;
    }, {});

    return studentsResult.rows
        .map(student => {
            const studentPaid = paymentsByStudent[student.id] || 0;
            const amountOverdue = calculateStudentDue({
                previousYearBalance: parseFloat(student.previous_year_balance),
                monthlyFee: parseFloat(student.monthly_fee),
                annualFee: parseFloat(student.annual_fee),
                studentPaid,
                currentDate,
            });
            return {
                id: student.id,
                student_id: student.student_id,
                name: student.name,
                class_name: student.class_name,
                father_name: student.father_name,
                mother_name: student.mother_name,
                phone: student.phone,
                email: student.email,
                amount_overdue: amountOverdue,
            };
        })
        .filter(s => s.amount_overdue > 0)
        .sort((a, b) => b.amount_overdue - a.amount_overdue);
}

module.exports = { calculateStudentDue, getAcademicSessionYears, getOverdueStudents };
