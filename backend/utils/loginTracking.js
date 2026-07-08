const db = require('../db');

// Records a user's first login of the calendar day. Self-contained error
// handling by design: login tracking must never block or slow down an
// actual login, so any failure here is logged and swallowed, never thrown.
async function recordFirstLoginOfDay(userId) {
    try {
        await db.query(
            `INSERT INTO login_records (user_id, login_date, first_login_at)
             VALUES ($1, CURRENT_DATE, NOW())
             ON CONFLICT (user_id, login_date) DO NOTHING`,
            [userId]
        );
    } catch (err) {
        console.error('Error recording login:', err);
    }
}

module.exports = { recordFirstLoginOfDay };
