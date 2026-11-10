const express = require('express');
const router = express.Router();
const prisma = require('../config/db'); // Prisma client instance

/**
 * Simple DB connectivity check.
 * Returns 200 with status OK if a connection can be established.
 */
router.get('/status', async (req, res) => {
  try {
    // A lightweight query – check if the DB can respond.
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'OK', message: 'Database connection successful' });
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({ status: 'ERROR', message: 'Unable to connect to database' });
  }
});

module.exports = router;
