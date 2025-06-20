const express = require('express');
const db = require('../db');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// @route   GET /api/classes
// @desc    Get all classes for the logged-in school
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const schoolId = req.school.schoolId;
    const classes = await db.query('SELECT * FROM classes WHERE school_id = $1 ORDER BY name ASC', [schoolId]);
    res.json(classes.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/classes/:id
// @desc    Update a class's details
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    const { name, monthly_fee, annual_fee } = req.body;
    const classId = req.params.id;
    const schoolId = req.school.schoolId;

    // First, verify this class belongs to the logged-in school
    const classResult = await db.query('SELECT school_id FROM classes WHERE id = $1', [classId]);
    if (classResult.rows.length === 0) {
      return res.status(404).json({ error: 'Class not found' });
    }
    if (classResult.rows[0].school_id !== schoolId) {
      return res.status(403).json({ error: 'User not authorized to update this class' });
    }

    // Update the class
    const updatedClass = await db.query(
      'UPDATE classes SET name = $1, monthly_fee = $2, annual_fee = $3 WHERE id = $4 RETURNING *',
      [name, monthly_fee, annual_fee, classId]
    );

    res.json(updatedClass.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/classes/:id
// @desc    Get a single class by its ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;
    const schoolId = req.school.schoolId;

    const classResult = await db.query(
      'SELECT * FROM classes WHERE id = $1 AND school_id = $2',
      [id, schoolId]
    );

    if (classResult.rows.length === 0) {
      return res.status(404).json({ error: 'Class not found or not authorized.' });
    }

    res.json(classResult.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router; 