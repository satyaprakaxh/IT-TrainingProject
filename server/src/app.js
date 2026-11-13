
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const prisma = require('./config/db');

const authRoutes = require('./routes/auth.routes');
const courseRoutes = require('./routes/course.routes');
const assessmentRoutes = require('./routes/assessment.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const aiRoutes = require('./routes/ai.routes');

const app = express();

// ==========================================
// CORE MIDDLEWARE
// ==========================================

const configuredClient = process.env.CLIENT_URL || 'http://localhost:5173';

app.use(cors({
  origin(origin, callback) {
    // curl and same-server tools send no Origin header
    if (!origin || origin === configuredClient) {
      return callback(null, true);
    }

    // Vite may move to 5174 when 5173 is already in use
    if (/^http:\/\/localhost:\d+$/.test(origin)) {
      return callback(null, true);
    }

    return callback(null, false);
  },
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());

// ==========================================
// API ROUTES
// ==========================================

app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/assessments', assessmentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/ai', aiRoutes);

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
