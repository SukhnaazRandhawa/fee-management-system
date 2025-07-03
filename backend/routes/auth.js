const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../db');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');

const router = express.Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, school_email, principal_email, location, numClasses, principal_password, staff_password } = req.body;
    if (!name || !school_email || !principal_email || !location || !numClasses || !principal_password || !staff_password) {
      return res.status(400).json({ error: 'All fields are required.' });
    }
    // Check if school or users already exist
    const schoolExists = await db.query('SELECT * FROM schools WHERE name = $1 OR email = $2', [name, school_email]);
    if (schoolExists.rows.length > 0) {
      return res.status(409).json({ error: 'A school with that name or email already exists.' });
    }
    const userExists = await db.query('SELECT * FROM users WHERE email = $1 OR email = $2', [principal_email, school_email]);
    if (userExists.rows.length > 0) {
      return res.status(409).json({ error: 'A user with that email already exists.' });
    }
    // Hash passwords
    const hashedPrincipalPassword = await bcrypt.hash(principal_password, 10);
    const hashedStaffPassword = await bcrypt.hash(staff_password, 10);
    // Insert school
    const schoolResult = await db.query(
      'INSERT INTO schools (name, email, location, num_classes) VALUES ($1, $2, $3, $4) RETURNING id',
      [name, school_email, location, parseInt(numClasses, 10)]
    );
    const schoolId = schoolResult.rows[0].id;
    // Insert principal user
    await db.query(
      'INSERT INTO users (school_id, email, password, role) VALUES ($1, $2, $3, $4)',
      [schoolId, principal_email, hashedPrincipalPassword, 'principal']
    );
    // Insert staff user
    await db.query(
      'INSERT INTO users (school_id, email, password, role) VALUES ($1, $2, $3, $4)',
      [schoolId, school_email, hashedStaffPassword, 'staff']
    );
    // Insert classes with default names and fees
    const defaultMonthlyFee = 2000;
    const defaultAnnualFee = 5000;
    for (let i = 1; i <= numClasses; i++) {
      await db.query(
        'INSERT INTO classes (school_id, name, monthly_fee, annual_fee) VALUES ($1, $2, $3, $4)',
        [schoolId, `Class ${i}`, defaultMonthlyFee, defaultAnnualFee]
      );
    }
    res.status(201).json({ message: 'School and users registered successfully!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { name, password } = req.body;
    if (!name || !password) {
      return res.status(400).json({ error: 'School name and password are required.' });
    }

    // Find the school by name
    const schoolResult = await db.query('SELECT * FROM schools WHERE name = $1', [name]);
    if (schoolResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const school = schoolResult.rows[0];

    // Compare passwords
    const isPasswordValid = await bcrypt.compare(password, school.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    // Generate JWT (include role)
    const token = jwt.sign(
      { schoolId: school.id, name: school.name, role: school.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' } // Token expires in 1 day
    );

    res.json({ token, schoolName: school.name, role: school.role, message: 'Logged in successfully!' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// POST /api/auth/user-login
router.post('/user-login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }
    // Find the user by email
    const userResult = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }
    const user = userResult.rows[0];
    // Compare passwords
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }
    // Get school name for display
    const schoolResult = await db.query('SELECT name FROM schools WHERE id = $1', [user.school_id]);
    const schoolName = schoolResult.rows.length > 0 ? schoolResult.rows[0].name : '';
    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, schoolId: user.school_id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );
    res.json({ token, schoolName, role: user.role, email: user.email, message: 'Logged in successfully!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// @route   POST /api/auth/forgot-password
// @desc    Request a password reset
// @access  Public
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        // Find the user by email (principal or staff)
        const userResult = await db.query('SELECT * FROM users WHERE email = $1', [email]);

        if (userResult.rows.length === 0) {
            // We send a generic success message to prevent user enumeration
            return res.status(200).json({ message: 'If an account with that email exists, you will receive a password reset link.' });
        }

        const user = userResult.rows[0];

        // Create a reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

        // Set token expiration to 1 hour from now
        const resetExpires = new Date(Date.now() + 3600000); // 1 hour

        await db.query(
            'UPDATE users SET reset_password_token = $1, reset_password_expires = $2 WHERE id = $3',
            [hashedToken, resetExpires, user.id]
        );

        // Create reset URL
        const resetURL = `http://localhost:3000/reset-password/${resetToken}`;
        
        const message = `
            <h1>Password Reset Request</h1>
            <p>You requested a password reset. Please click the link below to set a new password. This link is valid for 1 hour.</p>
            <a href="${resetURL}" target="_blank">Reset Password</a>
            <p>If you did not request this, please ignore this email.</p>
        `;

        try {
            await sendEmail({
                email: user.email,
                subject: 'Your Password Reset Token (Valid for 1 Hour)',
                message
            });
            res.status(200).json({ message: 'A password reset link has been sent to your email.' });
        } catch (emailError) {
            console.error('Email sending error:', emailError);
            // Clear the token if the email fails to prevent a user from being locked out
            await db.query(
                'UPDATE users SET reset_password_token = NULL, reset_password_expires = NULL WHERE id = $1',
                [user.id]
            );
            return res.status(500).json({ error: 'There was an error sending the email. Please try again later.' });
        }

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error during password reset process.' });
    }
});

// @route   POST /api/auth/reset-password/:token
// @desc    Reset a password
// @access  Public
router.post('/reset-password/:token', async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;

        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        const userResult = await db.query(
            'SELECT * FROM users WHERE reset_password_token = $1 AND reset_password_expires > $2',
            [hashedToken, new Date()]
        );

        if (userResult.rows.length === 0) {
            return res.status(400).json({ error: 'Password reset token is invalid or has expired.' });
        }

        const user = userResult.rows[0];

        // Hash the new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Update password and clear reset token fields
        await db.query(
            'UPDATE users SET password = $1, reset_password_token = NULL, reset_password_expires = NULL WHERE id = $2',
            [hashedPassword, user.id]
        );

        res.status(200).json({ message: 'Password has been successfully reset.' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error during password reset.' });
    }
});

module.exports = router; 