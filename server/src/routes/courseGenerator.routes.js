const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');

const {
  generateCourse,
  generateCoursesFromGaps
} = require('../controllers/courseGenerator.controller');

// POST /api/course-generator/generate - Generate a course for a skill gap
router.post('/generate', authenticate, generateCourse);

// POST /api/course-generator/generate-from-gaps - Generate courses for all gaps
router.post('/generate-from-gaps', authenticate, generateCoursesFromGaps);

module.exports = router;
