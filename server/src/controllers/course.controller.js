const {
  createCourseSchema,
  updateCourseSchema,
  courseQuerySchema,
  courseIdParamSchema,
  lessonIdParamSchema,
  lessonProgressSchema
} = require('../validations/course.validation');
const courseService = require('../services/course.service');

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

/** ── GET /api/courses ──────────────────────────────────────────────────── */
async function listCourses(req, res) {
  try {
    const parsed = courseQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return validationError(res, parsed);
    }

    const result = await courseService.getCourses(
      parsed.data,
      req.user.id,
      req.user.role
    );

    return res.json({
      success: true,
      message: 'Courses retrieved successfully',
      ...result
    });
  } catch (error) {
    console.error('List courses error:', error);
    return handleServiceError(res, error);
  }
}

/** ── GET /api/courses/:id ──────────────────────────────────────────────── */
async function getCourse(req, res) {
  try {
    const parsed = courseIdParamSchema.safeParse(req.params);
    if (!parsed.success) {
      return validationError(res, parsed);
    }

    const course = await courseService.getCourseById(
      parsed.data.id,
      req.user.id,
      req.user.role
    );

    return res.json({
      success: true,
      message: 'Course retrieved successfully',
      course
    });
  } catch (error) {
    console.error('Get course error:', error);
    return handleServiceError(res, error);
  }
}

/** ── POST /api/courses ─────────────────────────────────────────────────── */
async function createCourse(req, res) {
  try {
    const parsed = createCourseSchema.safeParse(req.body);
    if (!parsed.success) {
      return validationError(res, parsed);
    }

    const course = await courseService.createCourse(parsed.data, req.user.id);

    return res.status(201).json({
      success: true,
      message: 'Course created successfully',
      course
    });
  } catch (error) {
    console.error('Create course error:', error);
    return handleServiceError(res, error);
  }
}

/** ── PATCH /api/courses/:id ────────────────────────────────────────────── */
async function updateCourse(req, res) {
  try {
    const idParsed = courseIdParamSchema.safeParse(req.params);
    if (!idParsed.success) {
      return validationError(res, idParsed);
    }

    const bodyParsed = updateCourseSchema.safeParse(req.body);
    if (!bodyParsed.success) {
      return validationError(res, bodyParsed);
    }

    const course = await courseService.updateCourse(
      idParsed.data.id,
      bodyParsed.data,
      req.user.id,
      req.user.role
    );

    return res.json({
      success: true,
      message: 'Course updated successfully',
      course
    });
  } catch (error) {
    console.error('Update course error:', error);
    return handleServiceError(res, error);
  }
}

/** ── DELETE /api/courses/:id ───────────────────────────────────────────── */
async function deleteCourse(req, res) {
  try {
    const parsed = courseIdParamSchema.safeParse(req.params);
    if (!parsed.success) {
      return validationError(res, parsed);
    }

    await courseService.deleteCourse(parsed.data.id, req.user.id, req.user.role);

    return res.json({
      success: true,
      message: 'Course deleted successfully'
    });
  } catch (error) {
    console.error('Delete course error:', error);
    return handleServiceError(res, error);
  }
}

/** ── PATCH /api/courses/:id/publish ────────────────────────────────────── */
async function publishCourse(req, res) {
  try {
    const parsed = courseIdParamSchema.safeParse(req.params);
    if (!parsed.success) {
      return validationError(res, parsed);
    }

    const course = await courseService.publishCourse(
      parsed.data.id,
      req.user.id,
      req.user.role
    );

    return res.json({
      success: true,
      message: 'Course published successfully',
      course
    });
  } catch (error) {
    console.error('Publish course error:', error);
    return handleServiceError(res, error);
  }
}

/** ── POST /api/courses/:id/enroll ──────────────────────────────────────── */
async function enrollCourse(req, res) {
  try {
    const parsed = courseIdParamSchema.safeParse(req.params);
    if (!parsed.success) {
      return validationError(res, parsed);
    }

    const enrollment = await courseService.enrollCourse(parsed.data.id, req.user.id);

    return res.json({
      success: true,
      message: 'Successfully enrolled in course',
      enrollment
    });
  } catch (error) {
    console.error('Enroll course error:', error);
    return handleServiceError(res, error);
  }
}

/** ── GET /api/courses/:id/lessons ──────────────────────────────────────── */
async function getCourseLessons(req, res) {
  try {
    const parsed = courseIdParamSchema.safeParse(req.params);
    if (!parsed.success) {
      return validationError(res, parsed);
    }

    const lessons = await courseService.getCourseLessons(parsed.data.id, req.user.id);

    return res.json({
      success: true,
      message: 'Course lessons retrieved successfully',
      lessons
    });
  } catch (error) {
    console.error('Get course lessons error:', error);
    return handleServiceError(res, error);
  }
}

/** ── GET /api/courses/:id/progress ─────────────────────────────────────── */
async function getCourseProgress(req, res) {
  try {
    const parsed = courseIdParamSchema.safeParse(req.params);
    if (!parsed.success) {
      return validationError(res, parsed);
    }

    const progress = await courseService.getCourseProgress(parsed.data.id, req.user.id);

    return res.json({
      success: true,
      message: 'Course progress retrieved successfully',
      progress
    });
  } catch (error) {
    console.error('Get course progress error:', error);
    return handleServiceError(res, error);
  }
}

/** ── POST /api/courses/lessons/:lessonId/progress ──────────────────────── */
async function updateLessonProgress(req, res) {
  try {
    const parsed = lessonIdParamSchema.safeParse(req.params);
    if (!parsed.success) {
      return validationError(res, parsed);
    }

    const bodyParsed = lessonProgressSchema.safeParse(req.body);
    if (!bodyParsed.success) {
      return validationError(res, bodyParsed);
    }

    const progress = await courseService.updateLessonProgress(
      parsed.data.lessonId,
      req.user.id,
      bodyParsed.data
    );

    return res.json({
      success: true,
      message: 'Lesson progress updated successfully',
      progress
    });
  } catch (error) {
    console.error('Update lesson progress error:', error);
    return handleServiceError(res, error);
  }
}

module.exports = {
  listCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
  publishCourse,
  enrollCourse,
  getCourseLessons,
  getCourseProgress,
  updateLessonProgress
};
