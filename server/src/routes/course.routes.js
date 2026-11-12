const express = require('express');
const router = express.Router();

const {
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
} = require('../controllers/course.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

// ─── Public-ish (authenticated) course listing ─────────────────────────────
// Employees see only PUBLISHED courses; ADMIN/TRAINER see all statuses.
router.get('/', authenticate, listCourses);

// ─── Course CRUD (trainers/admins) ───────────────────────────────────────
router.post(
  '/',
  authenticate,
  authorize('ADMIN', 'TRAINER'),
  createCourse
);

router.get('/:id', authenticate, getCourse);

router.patch(
  '/:id',
  authenticate,
  updateCourse
);

router.delete(
  '/:id',
  authenticate,
  deleteCourse
);

router.patch(
  '/:id/publish',
  authenticate,
  publishCourse
);

// ─── Enrollment ──────────────────────────────────────────────────────────
router.post('/:id/enroll', authenticate, enrollCourse);

// ─── Lessons ─────────────────────────────────────────────────────────────
router.get('/:id/lessons', authenticate, getCourseLessons);

// ─── Lesson progress ─────────────────────────────────────────────────────
router.get('/:id/progress', authenticate, getCourseProgress);
router.post(
  '/lessons/:lessonId/progress',
  authenticate,
  updateLessonProgress
);

module.exports = router;
