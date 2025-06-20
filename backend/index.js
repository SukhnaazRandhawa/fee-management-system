const express = require('express');
const cors = require('cors');
require('dotenv').config({ path: './.env' });

const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // for parsing application/json

// Log the JWT_SECRET to check if it's loaded
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'Loaded' : 'Not Loaded');

// Health check route
app.get('/', (req, res) => {
    res.send('Fee Management Backend is running!');
});

const authRoutes = require('./routes/auth');
const classRoutes = require('./routes/classes');
const studentRoutes = require('./routes/students');
const paymentRoutes = require('./routes/payments');

app.use('/api/auth', authRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/payments', paymentRoutes);

const PORT = process.env.PORT || 5050;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); 