const academicYearMonths = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];

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

module.exports = { calculateStudentDue };
