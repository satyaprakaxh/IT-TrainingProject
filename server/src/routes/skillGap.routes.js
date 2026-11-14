const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');

const {
  analyzeSkillGap,
  getLatestSkillGap
} = require('../controllers/skillGap.controller');

// POST /api/skill-gap/analyze - Generate skill gap analysis from an attempt
router.post('/analyze', authenticate, analyzeSkillGap);

// GET /api/skill-gap/latest - Get latest skill gap analysis
router.get('/latest', authenticate, getLatestSkillGap);

module.exports = router;
