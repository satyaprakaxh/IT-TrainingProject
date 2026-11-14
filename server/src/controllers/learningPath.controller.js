const {
  generatePersonalizedLearningPath,
  getUserLearningPath,
  updateLearningPathItemProgress,
  deleteLearningPath,
  serviceError
} = require('../services/learningPath.service');

/**
 * Helper: map service errors to HTTP responses
 */
function handleServiceError(res, error) {
  const statusCode = error.statusCode || 500;
  return res.status(statusCode).json({
    success: false,
    message: error.message || 'Internal server error'
  });
}

/**
 * POST /api/learning-path/generate
 * Generate a personalized learning path based on latest skill gap analysis
 */
async function generateLearningPath(req, res) {
  try {
    const userId = req.user.id;

    const result = await generatePersonalizedLearningPath(userId);

    return res.status(201).json({
      success: true,
      message: 'Personalized learning path generated successfully',
      ...result
    });
  } catch (error) {
    console.error('Learning path generation error:', error);
    return handleServiceError(res, error);
  }
}

/**
 * GET /api/learning-path
 * Get the logged-in user's active learning path
 */
async function getLearningPath(req, res) {
  try {
    const userId = req.user.id;

    const path = await getUserLearningPath(userId);

    if (!path) {
      return res.status(404).json({
        success: false,
        message: 'No active learning path found. Generate one first.'
      });
    }

    return res.json({
      success: true,
      learningPath: path
    });
  } catch (error) {
    console.error('Get learning path error:', error);
    return handleServiceError(res, error);
  }
}

/**
 * POST /api/learning-path/:pathId/items/:courseId/progress
 * Update progress on a learning path item (mark course complete/incomplete)
 */
async function updateItemProgress(req, res) {
  try {
    const { pathId, courseId } = req.params;
    const { completed } = req.body;
    const userId = req.user.id;

    if (typeof completed !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'completed field must be a boolean'
      });
    }

    const result = await updateLearningPathItemProgress(
      userId,
      pathId,
      courseId,
      completed
    );

    return res.json({
      success: true,
      message: `Course marked as ${completed ? 'completed' : 'incomplete'}`,
      ...result
    });
  } catch (error) {
    console.error('Update learning path item progress error:', error);
    return handleServiceError(res, error);
  }
}

/**
 * DELETE /api/learning-path/:pathId
 * Delete/archive a learning path
 */
async function removeLearningPath(req, res) {
  try {
    const { pathId } = req.params;
    const userId = req.user.id;

    const result = await deleteLearningPath(userId, pathId);

    return res.json({
      success: true,
      message: 'Learning path deleted successfully',
      ...result
    });
  } catch (error) {
    console.error('Delete learning path error:', error);
    return handleServiceError(res, error);
  }
}

/**
 * POST /api/learning-path/regenerate
 * Regenerate the learning path (deactivates current, creates new)
 */
async function regenerateLearningPath(req, res) {
  try {
    const userId = req.user.id;

    // Deactivate existing active paths
    const prisma = require('../config/db');
    await prisma.learningPath.updateMany({
      where: { userId, status: 'ACTIVE' },
      data: { status: 'COMPLETED' }
    });

    // Generate new path
    const result = await generatePersonalizedLearningPath(userId);

    return res.status(201).json({
      success: true,
      message: 'Learning path regenerated successfully',
      ...result
    });
  } catch (error) {
    console.error('Regenerate learning path error:', error);
    return handleServiceError(res, error);
  }
}

module.exports = {
  generateLearningPath,
  getLearningPath,
  updateItemProgress,
  removeLearningPath,
  regenerateLearningPath
};
