const { z } = require('zod');

// Reusable enums from the Prisma schema (kept in sync with prisma/schema.prisma)
const DIFFICULTY_LEVELS = ['BEGINNER', 'EASY', 'MEDIUM', 'HARD', 'EXPERT'];
const COURSE_STATUSES = ['DRAFT', 'PUBLISHED', 'ARCHIVED'];
const ASSESSMENT_TYPES = ['INITIAL', 'COURSE', 'FINAL', 'PRACTICE'];
const QUESTION_TYPES = ['MCQ', 'TRUE_FALSE', 'SHORT_ANSWER'];

// ── Course validation schemas ───────────────────────────────────────────────

const courseBaseFields = {
  title: z.string().min(2, 'Title must be at least 2 characters').max(200),
  description: z.string().max(5000, 'Description is too long').optional().nullable(),
  category: z.string().min(1, 'Category is required').max(100),
  difficulty: z.enum(DIFFICULTY_LEVELS, `Difficulty must be one of: ${DIFFICULTY_LEVELS.join(', ')}`),
  estimatedDurationMinutes: z
    .number()
    .int()
    .positive('Estimated duration must be a positive integer')
    .optional()
    .nullable(),
  status: z.enum(COURSE_STATUSES, `Status must be one of: ${COURSE_STATUSES.join(', ')}`)
};

const createCourseSchema = z.object({
  ...courseBaseFields,
  status: z.enum(COURSE_STATUSES).default('DRAFT'),
  skills: z
    .array(z.number().int().positive('Skill ID must be a positive integer'))
    .optional()
    .default([]),
  lessons: z
    .array(
      z.object({
        title: z.string().min(1, 'Lesson title is required').max(200),
        description: z.string().max(5000).optional().nullable(),
        content: z.string().optional().nullable(),
        position: z.number().int().nonnegative().default(0),
        durationMinutes: z
          .number()
          .int()
          .positive('Duration must be a positive integer')
          .optional()
          .nullable()
      })
    )
    .optional()
    .default([])
});

const updateCourseSchema = z.object({
  title: z.string().min(2).max(200).optional(),
  description: z.string().max(5000).optional().nullable(),
  category: z.string().min(1).max(100).optional(),
  difficulty: z.enum(DIFFICULTY_LEVELS).optional(),
  estimatedDurationMinutes: z
    .number()
    .int()
    .positive()
    .optional()
    .nullable(),
  status: z.enum(COURSE_STATUSES).optional()
});

const courseQuerySchema = z.object({
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
  search: z.string().max(200).optional(),
  category: z.string().max(100).optional(),
  difficulty: z.enum(DIFFICULTY_LEVELS).optional(),
  status: z.enum(COURSE_STATUSES).optional(),
  sort: z
    .enum(['createdAt', 'title', 'difficulty', 'status'])
    .default('createdAt')
    .optional()
});

const courseIdParamSchema = z.object({
  id: z
    .string()
    .regex(/^\d+$/, 'Course ID must be a valid integer')
    .transform((val) => parseInt(val, 10))
});

const lessonIdParamSchema = z.object({
  lessonId: z
    .string()
    .regex(/^\d+$/, 'Lesson ID must be a valid integer')
    .transform((val) => parseInt(val, 10))
});

const lessonProgressSchema = z.object({
  status: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED']),
  progressPercentage: z
    .number()
    .min(0, 'Progress must be between 0 and 100')
    .max(100, 'Progress must be between 0 and 100')
    .optional(),
  timeSpentSeconds: z
    .number()
    .int()
    .nonnegative()
    .optional()
});

module.exports = {
  DIFFICULTY_LEVELS,
  COURSE_STATUSES,
  ASSESSMENT_TYPES,
  QUESTION_TYPES,
  createCourseSchema,
  updateCourseSchema,
  courseQuerySchema,
  courseIdParamSchema,
  lessonIdParamSchema,
  lessonProgressSchema
};
