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
    const { name, email, numClasses, password } = req.body;
    if (!name || !email || !numClasses || !password) {
      return res.status(400).json({ error: 'All fields are required.' });
    }
    // Check if school already exists
    const schoolExists = await db.query('SELECT * FROM schools WHERE name = $1 OR email = $2', [name, email]);
    if (schoolExists.rows.length > 0) {
      return res.status(409).json({ error: 'A school with that name or email already exists.' });
    }
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    // Insert school
    const schoolResult = await db.query(
      'INSERT INTO schools (name, email, password, num_classes) VALUES ($1, $2, $3, $4) RETURNING id',
      [name, email, hashedPassword, parseInt(numClasses, 10)]
    );
    const schoolId = schoolResult.rows[0].id;
    // Insert classes with default names and fees
    const defaultMonthlyFee = 2000;
    const defaultAnnualFee = 5000;
    for (let i = 1; i <= numClasses; i++) {
      await db.query(
        'INSERT INTO classes (school_id, name, monthly_fee, annual_fee) VALUES ($1, $2, $3, $4)',
        [schoolId, `Class ${i}`, defaultMonthlyFee, defaultAnnualFee]
      );
    }
    res.status(201).json({ message: 'School registered successfully!' });
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

    // Generate JWT
    const token = jwt.sign(
      { schoolId: school.id, name: school.name },
      process.env.JWT_SECRET,
      { expiresIn: '1d' } // Token expires in 1 day
    );

    res.json({ token, schoolName: school.name, message: 'Logged in successfully!' });

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
        const { name, email } = req.body;
        const schoolResult = await db.query('SELECT * FROM schools WHERE name = $1 AND email = $2', [name, email]);

        if (schoolResult.rows.length === 0) {
            // We send a generic success message to prevent user enumeration
            return res.status(200).json({ message: 'If an account with that email and school name exists, you will receive a password reset link.' });
        }

        const school = schoolResult.rows[0];

        // Create a reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

        // Set token expiration to 1 hour from now
        const resetExpires = new Date(Date.now() + 3600000); // 1 hour

        await db.query(
            'UPDATE schools SET reset_password_token = $1, reset_password_expires = $2 WHERE id = $3',
            [hashedToken, resetExpires, school.id]
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
                email: school.email,
                subject: 'Your Password Reset Token (Valid for 1 Hour)',
                message
            });
            res.status(200).json({ message: 'A password reset link has been sent to your email.' });
        } catch (emailError) {
            console.error('Email sending error:', emailError);
            // Clear the token if the email fails to prevent a user from being locked out
            await db.query(
                'UPDATE schools SET reset_password_token = NULL, reset_password_expires = NULL WHERE id = $1',
                [school.id]
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

        const schoolResult = await db.query(
            'SELECT * FROM schools WHERE reset_password_token = $1 AND reset_password_expires > $2',
            [hashedToken, new Date()]
        );

        if (schoolResult.rows.length === 0) {
            return res.status(400).json({ error: 'Password reset token is invalid or has expired.' });
        }

        const school = schoolResult.rows[0];

        // Hash the new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Update password and clear reset token fields
        await db.query(
            'UPDATE schools SET password = $1, reset_password_token = NULL, reset_password_expires = NULL WHERE id = $2',
            [hashedPassword, school.id]
        );

        res.status(200).json({ message: 'Password has been successfully reset.' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error during password reset.' });
    }
});

module.exports = router; 