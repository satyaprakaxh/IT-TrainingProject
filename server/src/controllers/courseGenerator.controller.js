const {
  generateAICourse,
  createGeneratedCourse,
  matchCoursesToGap,
  getAvailableCourses,
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
 * POST /api/course-generator/generate
 * Generate a personalized course for a specific skill gap
 */
async function generateCourse(req, res) {
  try {
    const { skillGap } = req.body;
    const userId = req.user.id;

    if (!skillGap || !skillGap.skill) {
      return res.status(400).json({
        success: false,
        message: 'Skill gap data with skill name is required'
      });
    }

    // Determine user level (default to BEGINNER)
    const userLevel = skillGap.level || 'BEGINNER';

    // Check if an existing course matches this skill gap
    const existingCourses = await getAvailableCourses();
    const matches = matchCoursesToGap(skillGap, existingCourses);

    let course;
    let isGenerated = false;

    if (matches.length > 0) {
      course = matches[0].course;
    } else {
      // Generate a new AI course for this gap
      const aiCourse = await generateAICourse(skillGap, userLevel);
      course = await createGeneratedCourse(aiCourse, userId);
      isGenerated = true;
    }

    return res.status(201).json({
      success: true,
      message: isGenerated
        ? 'AI course generated successfully'
        : 'Existing course matched successfully',
      course,
      isGenerated,
      matchedSkills: matches.length > 0 ? matches[0].matchedSkills : []
    });
  } catch (error) {
    console.error('Course generation error:', error);
    return handleServiceError(res, error);
  }
}

/**
 * POST /api/course-generator/generate-from-gaps
 * Generate courses for all high/medium priority skill gaps
 */
async function generateCoursesFromGaps(req, res) {
  try {
    const { skillGaps } = req.body;
    const userId = req.user.id;

    if (!skillGaps || !Array.isArray(skillGaps) || skillGaps.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Skill gaps array is required'
      });
    }

    const existingCourses = await getAvailableCourses();
    const results = [];

    for (const gap of skillGaps.filter((g) => g.priority !== 'low')) {
      const matches = matchCoursesToGap(gap, existingCourses);

      let course;
      let isGenerated = false;

      if (matches.length > 0) {
        course = matches[0].course;
      } else {
        try {
          const aiCourse = await generateAICourse(
            gap,
            gap.level || 'BEGINNER'
          );
          course = await createGeneratedCourse(aiCourse, userId);
          isGenerated = true;
        } catch (err) {
          console.warn(`AI course generation failed for ${gap.skill}:`, err.message);
          results.push({
            skill: gap.skill,
            success: false,
            message: err.message || 'AI generation failed'
          });
          continue;
        }
      }

      results.push({
        skill: gap.skill,
        course,
        isGenerated,
        matchedSkills: matches.length > 0 ? matches[0].matchedSkills : [],
        success: true
      });
    }

    return res.status(201).json({
      success: true,
      message: `Generated ${results.filter((r) => r.success).length} course(s)`,
      results
    });
  } catch (error) {
    console.error('Batch course generation error:', error);
    return handleServiceError(res, error);
  }
}

module.exports = {
  generateCourse,
  generateCoursesFromGaps
};
