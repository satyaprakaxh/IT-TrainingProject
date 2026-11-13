const express = require('express');
const router = express.Router();

const {
  listAssessments,
  getAssessment,
  getQuestions,
  createAssessment,
  updateAssessment,
  deleteAssessment,
  submitAssessment,
  getAttempts,
  getAttempt
} = require('../controllers/assessment.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

// ─── Assessment listing ──────────────────────────────────────────────────
router.get('/', authenticate, listAssessments);

// ─── Assessment CRUD (trainers/admins) ───────────────────────────────────
router.post(
  '/',
  authenticate,
  authorize('ADMIN', 'TRAINER'),
  createAssessment
);

// Registered before /:id so "attempts" is not captured as an assessment id.
router.get('/attempts/:attemptId', authenticate, getAttempt);

router.get('/:id', authenticate, getAssessment);
router.get('/:id/questions', authenticate, getQuestions);

router.patch(
  '/:id',
  authenticate,
  updateAssessment
);

router.delete(
  '/:id',
  authenticate,
  deleteAssessment
);

// ─── Submission ──────────────────────────────────────────────────────────
router.post('/:id/submit', authenticate, submitAssessment);

// ─── Attempt history (student) ───────────────────────────────────────────
router.get('/:id/attempts', authenticate, getAttempts);

module.exports = router;
