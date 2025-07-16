const express = require('express');
const db = require('../db');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Function to generate a unique student ID
const generateStudentId = async () => {
  let isUnique = false;
  let studentId;
  while (!isUnique) {
    // Generate a random 7-digit number
    const randomPart = Math.floor(1000000 + Math.random() * 9000000);
    studentId = `SID-${randomPart}`;
    const { rows } = await db.query('SELECT id FROM students WHERE student_id = $1', [studentId]);
    if (rows.length === 0) {
      isUnique = true;
    }
  }
  return studentId;
};

// @route   POST /api/students/register
// @desc    Register a new student
// @access  Private
router.post('/register', protect, async (req, res) => {
  try {
    const { class_id, name, father_name, mother_name, email, phone, address } = req.body;

    // Basic validation
    if (!class_id || !name || !father_name || !mother_name || !phone) {
      return res.status(400).json({ error: 'Please fill all required fields.' });
    }

    const student_id = await generateStudentId();

    const newStudent = await db.query(
      `INSERT INTO students (student_id, class_id, name, father_name, mother_name, email, phone, address)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [student_id, class_id, name, father_name, mother_name, email, phone, address || null]
    );

    res.status(201).json(newStudent.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/students
// @desc    Get all students for a specific class
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        const { classId } = req.query;
        if (!classId) {
            return res.status(400).json({ error: 'Class ID is required.' });
        }

        const students = await db.query(
            'SELECT * FROM students WHERE class_id = $1 ORDER BY name ASC',
            [classId]
        );

        res.json(students.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/students/search
// @desc    Search for a student by various criteria
// @access  Private
router.post('/search', protect, async (req, res) => {
    try {
        const schoolId = req.school.schoolId;
        const { student_id, name, phone } = req.body;

        let queryText = `SELECT s.*, c.name as class_name 
                         FROM students s
                         JOIN classes c ON s.class_id = c.id
                         WHERE c.school_id = $1`;
        
        const queryParams = [schoolId];
        let paramIndex = 2;

        if (student_id) {
            queryText += ` AND s.student_id = $${paramIndex++}`;
            queryParams.push(student_id);
        } else if (name && phone) {
            queryText += ` AND s.name ILIKE $${paramIndex++}`;
            queryParams.push(`%${name}%`);
            queryText += ` AND s.phone = $${paramIndex++}`;
            queryParams.push(phone);
        } else {
            return res.status(400).json({ 
                error: 'Invalid search. Please search by Student ID, or by both Student Name and Phone Number.' 
            });
        }
        
        const result = await db.query(queryText, queryParams);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'No student found matching your criteria.' });
        }
        if (result.rows.length > 1) {
            return res.status(409).json({ error: 'Multiple students found. Please be more specific.' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   PUT /api/students/:id
// @desc    Update a student's information
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;
    const { class_id, name, father_name, mother_name, email, phone, previous_year_balance, status, address } = req.body;
    // Only update fields that are provided
    const updateFields = [];
    const updateValues = [];
    let idx = 1;

    if (class_id) { updateFields.push(`class_id = $${idx++}`); updateValues.push(class_id); }
    if (name) { updateFields.push(`name = $${idx++}`); updateValues.push(name); }
    if (father_name) { updateFields.push(`father_name = $${idx++}`); updateValues.push(father_name); }
    if (mother_name) { updateFields.push(`mother_name = $${idx++}`); updateValues.push(mother_name); }
    if (email !== undefined) { updateFields.push(`email = $${idx++}`); updateValues.push(email); }
    if (phone) { updateFields.push(`phone = $${idx++}`); updateValues.push(phone); }
    if (previous_year_balance !== undefined) { updateFields.push(`previous_year_balance = $${idx++}`); updateValues.push(previous_year_balance); }
    if (status) { updateFields.push(`status = $${idx++}`); updateValues.push(status); }
    if (address !== undefined) { updateFields.push(`address = $${idx++}`); updateValues.push(address); }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update.' });
    }

    updateValues.push(id);

    const result = await db.query(
      `UPDATE students SET ${updateFields.join(', ')} WHERE id = $${idx} RETURNING *`,
      updateValues
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found.' });
    }

    const updatedStudent = result.rows[0];
    // Update archived_students with the same student_id
    await db.query(
      `UPDATE archived_students
       SET name = $1, father_name = $2, mother_name = $3, email = $4, phone = $5, address = $6
       WHERE student_id = $7`,
      [
        updatedStudent.name,
        updatedStudent.father_name,
        updatedStudent.mother_name,
        updatedStudent.email,
        updatedStudent.phone,
        updatedStudent.address,
        updatedStudent.student_id
      ]
    );
    res.json(updatedStudent);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error during student update.' });
  }
});

// @route   DELETE /api/students/:id
// @desc    Delete a student
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;
    // Optionally, you can check if the student exists first
    const result = await db.query('DELETE FROM students WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found.' });
    }
    res.json({ message: 'Student deleted successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error during student deletion.' });
  }
});

// The old /find/:studentId route is now replaced by the /search route.

module.exports = router; 