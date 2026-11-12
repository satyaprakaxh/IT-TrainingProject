const {
  createAssessmentSchema,
  updateAssessmentSchema,
  assessmentQuerySchema,
  assessmentIdParamSchema,
  attemptIdParamSchema,
  submitAssessmentSchema
} = require('../validations/assessment.validation');
const assessmentService = require('../services/assessment.service');

/** Helper: send a validation error response */
function validationError(res, parsed) {
  return res.status(400).json({
    success: false,
    message: 'Validation failed',
    errors: parsed.error.flatten().fieldErrors
  });
}

/** Helper: map service errors to HTTP responses */
function handleServiceError(res, error) {
  const statusCode = error.statusCode || 500;
  return res.status(statusCode).json({
    success: false,
    message: error.message || 'Internal server error'
  });
}

/** ── GET /api/assessments ──────────────────────────────────────────────── */
async function listAssessments(req, res) {
  try {
    const parsed = assessmentQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return validationError(res, parsed);
    }

    const result = await assessmentService.getAssessments(parsed.data, req.user.id);

    return res.json({
      success: true,
      message: 'Assessments retrieved successfully',
      ...result
    });
  } catch (error) {
    console.error('List assessments error:', error);
    return handleServiceError(res, error);
  }
}

/** ── GET /api/assessments/:id ──────────────────────────────────────────── */
async function getAssessment(req, res) {
  try {
    const parsed = assessmentIdParamSchema.safeParse(req.params);
    if (!parsed.success) {
      return validationError(res, parsed);
    }

    const assessment = await assessmentService.getAssessmentById(
      parsed.data.id,
      req.user.id
    );

    return res.json({
      success: true,
      message: 'Assessment retrieved successfully',
      assessment
    });
  } catch (error) {
    console.error('Get assessment error:', error);
    return handleServiceError(res, error);
  }
}

/** ── GET /api/assessments/:id/questions ────────────────────────────────── */
async function getQuestions(req, res) {
  try {
    const parsed = assessmentIdParamSchema.safeParse(req.params);
    if (!parsed.success) {
      return validationError(res, parsed);
    }

    const questions = await assessmentService.getQuestions(
      parsed.data.id,
      req.user.id
    );

    return res.json({
      success: true,
      message: 'Assessment questions retrieved successfully',
      questions
    });
  } catch (error) {
    console.error('Get questions error:', error);
    return handleServiceError(res, error);
  }
}

/** ── POST /api/assessments ─────────────────────────────────────────────── */
async function createAssessment(req, res) {
  try {
    const parsed = createAssessmentSchema.safeParse(req.body);
    if (!parsed.success) {
      return validationError(res, parsed);
    }

    const assessment = await assessmentService.createAssessment(
      parsed.data,
      req.user.id
    );

    return res.status(201).json({
      success: true,
      message: 'Assessment created successfully',
      assessment
    });
  } catch (error) {
    console.error('Create assessment error:', error);
    return handleServiceError(res, error);
  }
}

/** ── PATCH /api/assessments/:id ────────────────────────────────────────── */
async function updateAssessment(req, res) {
  try {
    const idParsed = assessmentIdParamSchema.safeParse(req.params);
    if (!idParsed.success) {
      return validationError(res, idParsed);
    }

    const bodyParsed = updateAssessmentSchema.safeParse(req.body);
    if (!bodyParsed.success) {
      return validationError(res, bodyParsed);
    }

    const assessment = await assessmentService.updateAssessment(
      idParsed.data.id,
      bodyParsed.data,
      req.user.id,
      req.user.role
    );

    return res.json({
      success: true,
      message: 'Assessment updated successfully',
      assessment
    });
  } catch (error) {
    console.error('Update assessment error:', error);
    return handleServiceError(res, error);
  }
}

/** ── DELETE /api/assessments/:id ───────────────────────────────────────── */
async function deleteAssessment(req, res) {
  try {
    const parsed = assessmentIdParamSchema.safeParse(req.params);
    if (!parsed.success) {
      return validationError(res, parsed);
    }

    await assessmentService.deleteAssessment(parsed.data.id, req.user.id, req.user.role);

    return res.json({
      success: true,
      message: 'Assessment deleted successfully'
    });
  } catch (error) {
    console.error('Delete assessment error:', error);
    return handleServiceError(res, error);
  }
}

/** ── POST /api/assessments/:id/submit ──────────────────────────────────── */
async function submitAssessment(req, res) {
  try {
    const idParsed = assessmentIdParamSchema.safeParse(req.params);
    if (!idParsed.success) {
      return validationError(res, idParsed);
    }

    const bodyParsed = submitAssessmentSchema.safeParse(req.body);
    if (!bodyParsed.success) {
      return validationError(res, bodyParsed);
    }

    const result = await assessmentService.submitAssessment(
      idParsed.data.id,
      req.user.id,
      bodyParsed.data.answers
    );

    return res.json({
      success: true,
      message: 'Assessment submitted successfully',
      result
    });
  } catch (error) {
    console.error('Submit assessment error:', error);
    return handleServiceError(res, error);
  }
}

/** ── GET /api/assessments/:id/attempts ─────────────────────────────────── */
async function getAttempts(req, res) {
  try {
    const parsed = assessmentIdParamSchema.safeParse(req.params);
    if (!parsed.success) {
      return validationError(res, parsed);
    }

    const attempts = await assessmentService.getAttempts(
      parsed.data.id,
      req.user.id
    );

    return res.json({
      success: true,
      message: 'Assessment attempts retrieved successfully',
      attempts
    });
  } catch (error) {
    console.error('Get attempts error:', error);
    return handleServiceError(res, error);
  }
}

/** ── GET /api/assessments/attempts/:attemptId ──────────────────────────── */
async function getAttempt(req, res) {
  try {
    const parsed = attemptIdParamSchema.safeParse(req.params);
    if (!parsed.success) {
      return validationError(res, parsed);
    }

    const attempt = await assessmentService.getAttemptById(
      parsed.data.attemptId,
      req.user.id
    );

    return res.json({
      success: true,
      message: 'Assessment attempt retrieved successfully',
      attempt
    });
  } catch (error) {
    console.error('Get attempt error:', error);
    return handleServiceError(res, error);
  }
}

module.exports = {
  listAssessments,
  getAssessment,
  getQuestions,
  createAssessment,
  updateAssessment,
  deleteAssessment,
  submitAssessment,
  getAttempts,
  getAttempt
};
