const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const prisma = require('./config/db');

const app = express();

// Core middleware configuration
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true
}));

app.use(express.json());
app.use(cookieParser());

// Backend health check
app.get('/', (req, res) => {
    res.status(200).json({
        status: 'OK',
        message: 'AI Training System Backend API is running'
    });
});

// Database health check
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

const PORT = process.env.PORT || 5001;

if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
        console.log(`Server listening on port ${PORT}`);
    });
}

module.exports = app;