const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');

const { chatWithAI, getWeeklyInsight } = require('../controllers/ai.controller');

router.post('/chat', chatWithAI);
router.get('/weekly-insight', authenticate, getWeeklyInsight);

module.exports = router;
