const { z } = require('zod');

// ── Assessment validation schemas ───────────────────────────────────────────

const createAssessmentSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters').max(200),
  description: z.string().max(5000, 'Description is too long').optional().nullable(),
  type: z.enum(['INITIAL', 'COURSE', 'FINAL', 'PRACTICE']),
  difficulty: z
    .enum(['BEGINNER', 'EASY', 'MEDIUM', 'HARD', 'EXPERT'])
    .default('BEGINNER'),
  passingScore: z
    .number()
    .min(0, 'Passing score must be between 0 and 100')
    .max(100, 'Passing score must be between 0 and 100')
    .default(60),
  timeLimitMinutes: z
    .number()
    .int()
    .positive('Time limit must be a positive integer')
    .optional()
    .nullable(),
  courseId: z.number().int().positive('Course ID must be a positive integer').optional().nullable(),
  lessonId: z.number().int().positive('Lesson ID must be a positive integer').optional().nullable(),
  questions: z
    .array(
      z.object({
        questionText: z.string().min(1, 'Question text is required'),
        type: z.enum(['MCQ', 'TRUE_FALSE', 'SHORT_ANSWER']),
        difficulty: z
          .enum(['BEGINNER', 'EASY', 'MEDIUM', 'HARD', 'EXPERT'])
          .default('BEGINNER'),
        points: z.number().int().positive('Points must be a positive integer').default(1),
        explanation: z.string().max(5000).optional().nullable(),
        correctAnswer: z.string().max(5000).optional().nullable(),
        acceptedAnswers: z
          .array(z.string().max(5000, 'Accepted answer is too long'))
          .optional()
          .default([]),
        options: z
          .array(
            z.object({
              optionText: z.string().min(1, 'Option text is required'),
              isCorrect: z.boolean().default(false)
            })
          )
          .optional()
          .default([])
      })
    )
    .optional()
    .default([])
});

const updateAssessmentSchema = z.object({
  title: z.string().min(2).max(200).optional(),
  description: z.string().max(5000).optional().nullable(),
  type: z.enum(['INITIAL', 'COURSE', 'FINAL', 'PRACTICE']).optional(),
  difficulty: z.enum(['BEGINNER', 'EASY', 'MEDIUM', 'HARD', 'EXPERT']).optional(),
  passingScore: z
    .number()
    .min(0)
    .max(100)
    .optional(),
  timeLimitMinutes: z.number().int().positive().optional().nullable(),
  courseId: z.number().int().positive().optional().nullable(),
  lessonId: z.number().int().positive().optional().nullable()
});

const assessmentQuerySchema = z.object({
  page: z
    .string()
    .regex(/^\d+$/, 'Page must be a positive integer')
    .transform((val) => Math.max(1, parseInt(val, 10)))
    .default('1'),
  limit: z
    .string()
    .regex(/^\d+$/, 'Limit must be a positive integer')
    .transform((val) => Math.min(100, Math.max(1, parseInt(val, 10))))
    .default('10'),
  courseId: z.string().regex(/^\d+$/, 'Course ID must be a valid integer').optional().transform((val) => parseInt(val, 10)),
  lessonId: z.string().regex(/^\d+$/, 'Lesson ID must be a valid integer').optional().transform((val) => parseInt(val, 10)),
  type: z.enum(['INITIAL', 'COURSE', 'FINAL', 'PRACTICE']).optional(),
  difficulty: z.enum(['BEGINNER', 'EASY', 'MEDIUM', 'HARD', 'EXPERT']).optional()
});

const assessmentIdParamSchema = z.object({
  id: z
    .string()
    .regex(/^\d+$/, 'Assessment ID must be a valid integer')
    .transform((val) => parseInt(val, 10))
});

const attemptIdParamSchema = z.object({
  attemptId: z
    .string()
    .regex(/^\d+$/, 'Attempt ID must be a valid integer')
    .transform((val) => parseInt(val, 10))
});

const submitAssessmentSchema = z.object({
  answers: z
    .array(
      z.object({
        questionId: z
          .preprocess((v) => Number(v), z.number().int().positive('Question ID must be a valid integer'))
          .optional(),
        selectedOptionId: z
          .preprocess((v) => (v === undefined || v === null ? null : Number(v)), z.number().int().positive('Option ID must be a valid integer'))
          .optional()
          .nullable(),
        answerText: z.string().optional().nullable()
      })
    )
    .min(1, 'At least one answer is required')
});

module.exports = {
  createAssessmentSchema,
  updateAssessmentSchema,
  assessmentQuerySchema,
  assessmentIdParamSchema,
  attemptIdParamSchema,
  submitAssessmentSchema
};
