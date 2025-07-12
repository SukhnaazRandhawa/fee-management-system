const db = require('../db');

// Utility to get current academic year (April-March)
function getCurrentAcademicYear() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth(); // 0=Jan, 3=Apr
    const startYear = month < 3 ? year - 1 : year;
    const endYear = startYear + 1;
    return `${startYear}-${endYear}`;
}

// Function to check if we should auto-start a new session (May onwards)
function shouldAutoStartNewSession(currentSession) {
    const now = new Date();
    const currentMonth = now.getMonth(); // 0=Jan, 4=May
    const currentYear = now.getFullYear();
    
    // Parse current session
    const [start, end] = currentSession.split('-').map(Number);
    
    // If we're in May or later of the end year, we should auto-start
    // Example: Current session is 2025-2026, we're in May 2026 or later
    if (currentMonth >= 4 && currentYear >= end) { // May = 4, June = 5, etc.
        return true;
    }
    
    return false;
}

// Function to initialize sessions table for a specific school if empty
async function initializeSessionsIfEmpty(schoolId) {
    try {
        // Check if this school has any sessions
        const sessionResult = await db.query('SELECT COUNT(*) FROM sessions WHERE school_id = $1', [schoolId]);
        const sessionCount = parseInt(sessionResult.rows[0].count);
        
        if (sessionCount === 0) {
            // Initialize with current academic year for this school
            const currentAcademicYear = getCurrentAcademicYear();
            await db.query('INSERT INTO sessions (academic_year, is_current, school_id) VALUES ($1, TRUE, $2)', [currentAcademicYear, schoolId]);
            // console.log(`Sessions table initialized for school ${schoolId} with current academic year: ${currentAcademicYear}`);
        } else {
            // Check if we need to auto-start a new session (May onwards)
            const currentSessionResult = await db.query('SELECT academic_year FROM sessions WHERE school_id = $1 AND is_current = TRUE', [schoolId]);
            if (currentSessionResult.rows.length > 0) {
                const currentSession = currentSessionResult.rows[0].academic_year;
                
                if (shouldAutoStartNewSession(currentSession)) {
                    // Auto-start new session
                    await autoStartNewSession(schoolId, currentSession);
                }
            }
        }
    } catch (err) {
        console.error('Error initializing sessions table:', err);
    }
}

// Function to auto-start a new session
async function autoStartNewSession(schoolId, currentSession) {
    try {
        const [start, end] = currentSession.split('-').map(Number);
        const nextSession = `${end}-${end + 1}`;
        
        // Mark current session as not current
        await db.query('UPDATE sessions SET is_current = FALSE WHERE school_id = $1 AND is_current = TRUE', [schoolId]);
        
        // Insert new session
        await db.query('INSERT INTO sessions (academic_year, is_current, school_id) VALUES ($1, TRUE, $2)', [nextSession, schoolId]);
        
        console.log(`Auto-started new session ${nextSession} for school ${schoolId}`);
    } catch (err) {
        console.error('Error auto-starting new session:', err);
    }
}

module.exports = {
    getCurrentAcademicYear,
    initializeSessionsIfEmpty,
    shouldAutoStartNewSession,
    autoStartNewSession
}; 