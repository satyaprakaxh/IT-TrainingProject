
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const prisma = require('./config/db');

const authRoutes = require('./routes/auth.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const coursesRoutes = require('./routes/courses.routes');

const app = express();

// ==========================================
// CORE MIDDLEWARE
// ==========================================

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());

// ==========================================
// API ROUTES
// ==========================================

app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/courses', coursesRoutes);

// ==========================================
// BACKEND HEALTH CHECK
// ==========================================

app.get('/', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'AI Training System Backend API is running'
  });
});

// ==========================================
// DATABASE HEALTH CHECK
// ==========================================

app.get('/api/health/db', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    res.status(200).json({
      success: true,
      status: 'Connected',
      message: 'PostgreSQL database connected successfully'
    });

  } catch (error) {
    console.error('Database connection error:', error.message);

    res.status(500).json({
      success: false,
      status: 'Disconnected',
      message: 'Database connection failed'
    });
  }
});

// ==========================================
// START SERVER
// ==========================================

const PORT = process.env.PORT || 5001;

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

module.exports = app;
