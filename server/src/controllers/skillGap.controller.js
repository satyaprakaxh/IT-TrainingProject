const {
  analyzeSkillGaps,
  saveSkillGapAnalysis,
  getLatestSkillGapAnalysis,
  error: sgError
} = require('../services/skillGap.service');

/**
 * Helper: send a validation error response
 */
function validationError(res, parsed) {
  return res.status(400).json({
    success: false,
    message: 'Validation failed',
    errors: parsed.error.flatten().fieldErrors
  });
}

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
 * POST /api/skill-gap/analyze
 * Generate skill gap analysis from a specific assessment attempt
 */
async function analyzeSkillGap(req, res) {
  try {
    const { attemptId } = req.body;
    const userId = req.user.id;

    if (!attemptId) {
      return res.status(400).json({
        success: false,
        message: 'Attempt ID is required'
      });
    }

    const analysis = await analyzeSkillGaps(userId, attemptId);
    const saved = await saveSkillGapAnalysis(userId, attemptId, analysis);

    return res.status(201).json({
      success: true,
      message: 'Skill gap analysis generated successfully',
      analysis: {
        id: saved.id,
        attemptId: saved.attemptId,
        assessmentId: analysis.assessmentId,
        assessmentTitle: analysis.assessmentTitle,
        overallScore: analysis.overallScore,
        strengths: analysis.strengths,
        weaknesses: analysis.weaknesses,
        missing: analysis.missing,
        gaps: analysis.gaps,
        skillCount: analysis.skillCount,
        createdAt: saved.createdAt
      }
    });
  } catch (error) {
    console.error('Skill gap analysis error:', error);
    return handleServiceError(res, error);
  }
}

/**
 * GET /api/skill-gap/latest
 * Get the latest skill gap analysis for the logged-in user
 */
async function getLatestSkillGap(req, res) {
  try {
    const userId = req.user.id;

    const analysis = await getLatestSkillGapAnalysis(userId);

    if (!analysis) {
      return res.status(404).json({
        success: false,
        message: 'No skill gap analysis found. Complete an assessment first.'
      });
    }

    return res.json({
      success: true,
      analysis: {
        id: analysis.id,
        attemptId: analysis.attemptId,
        assessmentId: analysis.attempt?.assessmentId,
        assessmentTitle: analysis.attempt?.assessmentTitle,
        overallScore: analysis.attempt?.score,
        strengths: analysis.strengths,
        weaknesses: analysis.weaknesses,
        recommendedTopics: analysis.recommendedTopics,
        createdAt: analysis.createdAt
      }
    });
  } catch (error) {
    console.error('Get skill gap error:', error);
    return handleServiceError(res, error);
  }
}

module.exports = {
  analyzeSkillGap,
  getLatestSkillGap
};
