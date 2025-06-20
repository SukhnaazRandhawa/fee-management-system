const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../db');
const jwt = require('jsonwebtoken');

const router = express.Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, numClasses, password } = req.body;
    if (!name || !numClasses || !password) {
      return res.status(400).json({ error: 'All fields are required.' });
    }
    // Check if school already exists
    const schoolExists = await db.query('SELECT * FROM schools WHERE name = $1', [name]);
    if (schoolExists.rows.length > 0) {
      return res.status(409).json({ error: 'School already exists.' });
    }
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    // Insert school
    const schoolResult = await db.query(
      'INSERT INTO schools (name, password) VALUES ($1, $2) RETURNING id',
      [name, hashedPassword]
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

module.exports = router; 