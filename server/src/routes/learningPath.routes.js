const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');

const {
  generateLearningPath,
  getLearningPath,
  updateItemProgress,
  removeLearningPath,
  regenerateLearningPath
} = require('../controllers/learningPath.controller');

// POST /api/learning-path/generate - Generate personalized learning path
router.post('/generate', authenticate, generateLearningPath);

// GET /api/learning-path - Get user's active learning path
router.get('/', authenticate, getLearningPath);

// POST /api/learning-path/regenerate - Regenerate learning path
router.post('/regenerate', authenticate, regenerateLearningPath);

// POST /api/learning-path/:pathId/items/:courseId/progress - Update item progress
router.post(
  '/:pathId/items/:courseId/progress',
  authenticate,
  updateItemProgress
);

// DELETE /api/learning-path/:pathId - Delete learning path
router.delete('/:pathId', authenticate, removeLearningPath);

module.exports = router;
