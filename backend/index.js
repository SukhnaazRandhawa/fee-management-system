const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
require('dotenv').config({ path: './.env' });

const app = express();

// Render sits in front of this app as a reverse proxy; without this,
// express-rate-limit (and req.ip generally) would see Render's proxy IP
// instead of the real client IP, bucketing every user together.
app.set('trust proxy', 1);

// Middleware
app.use(helmet());
app.use(cors({
  origin: [
    'https://billorafrontend.vercel.app' // replace with your actual Vercel domain if different
  ],
  credentials: true
}));
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
const dashboardRoutes = require('./routes/dashboard');
const reportRoutes = require('./routes/reports');

app.use('/api/auth', authRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);

const PORT = process.env.PORT || 5050;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); 