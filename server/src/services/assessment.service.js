const prisma = require('../config/db');

/**
 * Throws an object with { statusCode, message } for the controller to map to HTTP.
 */
function error(statusCode, message) {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
}

/**
 * Removes answer key data from questions so correct answers are never
 * exposed to the client before submission.
 */
function sanitizeQuestions(questions) {
  return questions.map((question) => ({
    id: question.id,
    questionText: question.questionText,
    type: question.type,
    difficulty: question.difficulty,
    points: question.points,
    explanation: question.explanation,
    options: (question.options || []).map((option) => ({
      id: option.id,
      optionText: option.optionText
    }))
  }));
}

/** ── Create assessment (with questions and options) ────────────────────── */
async function createAssessment(data, userId) {
  const {
    title,
    description,
    type,
    difficulty,
    passingScore = 60,
    timeLimitMinutes,
    courseId,
    lessonId,
    questions = []
  } = data;

  // Validate course/lesson references if provided
  if (courseId) {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true }
    });
    if (!course) {
      throw error(404, 'Referenced course not found');
    }
  }
  if (lessonId) {
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      select: { id: true, courseId: true }
    });
    if (!lesson) {
      throw error(404, 'Referenced lesson not found');
    }
    if (courseId && lesson.courseId !== courseId) {
      throw error(400, 'Lesson does not belong to the specified course');
    }
  }

  // Validate MCQ options have at least one correct answer
  for (const question of questions) {
    if (question.type === 'MCQ') {
      const correctCount = (question.options || []).filter((o) => o.isCorrect).length;
      if (correctCount !== 1) {
        throw error(400, 'MCQ questions must have exactly one correct option');
      }
    }
  }

  return prisma.$transaction(async (tx) => {
    const assessment = await tx.assessment.create({
      data: {
        title,
        description,
        type,
        difficulty,
        passingScore,
        timeLimitMinutes,
        courseId,
        lessonId,
        createdById: userId
      }
    });

    if (questions.length > 0) {
      for (const question of questions) {
        await tx.question.create({
          data: {
            assessmentId: assessment.id,
            questionText: question.questionText,
            type: question.type,
            difficulty: question.difficulty,
            points: question.points,
            explanation: question.explanation,
            correctAnswer: question.correctAnswer,
            options: {
              create: (question.options || []).map((option) => ({
                optionText: option.optionText,
                isCorrect: option.isCorrect
              }))
            }
          }
        });
      }
    }

    return assessment;
  });
}

/** ── List assessments ──────────────────────────────────────────────────── */
async function getAssessments(query, userId) {
  const {
    page = 1,
    limit = 10,
    courseId,
    lessonId,
    type,
    difficulty
  } = query;

  const skip = (page - 1) * limit;
  const take = Math.min(limit, 100);

  const where = {};
  if (courseId) where.courseId = courseId;
  if (lessonId) where.lessonId = lessonId;
  if (type) where.type = type;
  if (difficulty) where.difficulty = difficulty;

  const [assessments, total] = await prisma.$transaction([
    prisma.assessment.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { questions: true, attempts: true } },
        course: { select: { id: true, title: true } },
        lesson: { select: { id: true, title: true } },
        createdBy: { select: { id: true, name: true } }
      }
    }),
    prisma.assessment.count({ where })
  ]);

  return {
    assessments: assessments.map((a) => ({
      id: a.id,
      title: a.title,
      description: a.description,
      type: a.type,
      difficulty: a.difficulty,
      passingScore: a.passingScore,
      timeLimitMinutes: a.timeLimitMinutes,
      courseId: a.courseId,
      lessonId: a.lessonId,
      course: a.course,
      lesson: a.lesson,
      createdBy: a.createdBy,
      questionCount: a._count.questions,
      attemptCount: a._count.attempts,
      createdAt: a.createdAt,
      updatedAt: a.updatedAt
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}

/** ── Get assessment by ID (questions without correct answers) ──────────── */
async function getAssessmentById(id, userId) {
  const assessment = await prisma.assessment.findUnique({
    where: { id },
    include: {
      questions: {
        orderBy: { id: 'asc' },
        select: {
          id: true,
          questionText: true,
          type: true,
          difficulty: true,
          points: true,
          explanation: true,
          options: { select: { id: true, optionText: true } }
        }
      },
      course: { select: { id: true, title: true } },
      lesson: { select: { id: true, title: true } },
      createdBy: { select: { id: true, name: true } }
    }
  });

  if (!assessment) {
    throw error(404, 'Assessment not found');
  }

  return {
    id: assessment.id,
    title: assessment.title,
    description: assessment.description,
    type: assessment.type,
    difficulty: assessment.difficulty,
    passingScore: assessment.passingScore,
    timeLimitMinutes: assessment.timeLimitMinutes,
    courseId: assessment.courseId,
    lessonId: assessment.lessonId,
    course: assessment.course,
    lesson: assessment.lesson,
    createdBy: assessment.createdBy,
    questions: sanitizeQuestions(assessment.questions),
    createdAt: assessment.createdAt,
    updatedAt: assessment.updatedAt
  };
}

/** ── Get questions for an assessment (no correct answers) ──────────────── */
async function getQuestions(assessmentId, userId) {
  const assessment = await prisma.assessment.findUnique({
    where: { id: assessmentId },
    select: { id: true }
  });
  if (!assessment) {
    throw error(404, 'Assessment not found');
  }

  const questions = await prisma.question.findMany({
    where: { assessmentId },
    orderBy: { id: 'asc' },
    select: {
      id: true,
      questionText: true,
      type: true,
      difficulty: true,
      points: true,
      explanation: true,
      options: { select: { id: true, optionText: true } }
    }
  });

  return sanitizeQuestions(questions);
}

/** ── Update assessment ─────────────────────────────────────────────────── */
async function updateAssessment(id, data, userId, userRole) {
  const existing = await prisma.assessment.findUnique({ where: { id } });
  if (!existing) {
    throw error(404, 'Assessment not found');
  }
  if (userRole !== 'ADMIN' && existing.createdById !== userId) {
    throw error(403, 'Access denied: you do not own this assessment');
  }

  const { questions, ...assessmentFields } = data;

  return prisma.$transaction(async (tx) => {
    const assessment = await tx.assessment.update({
      where: { id },
      data: assessmentFields
    });

    if (Array.isArray(questions)) {
      // Replace questions and options
      await tx.questionResponse.deleteMany({
        where: { question: { assessmentId: id } }
      });
      await tx.questionOption.deleteMany({ where: { question: { assessmentId: id } } });
      await tx.question.deleteMany({ where: { assessmentId: id } });

      if (questions.length > 0) {
        for (const question of questions) {
          if (question.type === 'MCQ') {
            const correctCount = (question.options || []).filter((o) => o.isCorrect).length;
            if (correctCount !== 1) {
              throw error(400, 'MCQ questions must have exactly one correct option');
            }
          }
          await tx.question.create({
            data: {
              assessmentId: id,
              questionText: question.questionText,
              type: question.type,
              difficulty: question.difficulty,
              points: question.points,
              explanation: question.explanation,
              correctAnswer: question.correctAnswer,
              options: {
                create: (question.options || []).map((option) => ({
                  optionText: option.optionText,
                  isCorrect: option.isCorrect
                }))
              }
            }
          });
        }
      }
    }

    return assessment;
  });
}

/** ── Delete assessment ─────────────────────────────────────────────────── */
async function deleteAssessment(id, userId, userRole) {
  const existing = await prisma.assessment.findUnique({ where: { id } });
  if (!existing) {
    throw error(404, 'Assessment not found');
  }
  if (userRole !== 'ADMIN' && existing.createdById !== userId) {
    throw error(403, 'Access denied: you do not own this assessment');
  }

  await prisma.assessment.delete({ where: { id } });
  return { id };
}

/** ── Submit assessment answers ─────────────────────────────────────────── */
async function submitAssessment(assessmentId, userId, answers) {
  const assessment = await prisma.assessment.findUnique({
    where: { id: assessmentId },
    select: {
      id: true,
      title: true,
      passingScore: true,
      courseId: true
    }
  });
  if (!assessment) {
    throw error(404, 'Assessment not found');
  }

  // Fetch questions with internal answer data (correct answers + option correctness)
  const questions = await prisma.question.findMany({
    where: { assessmentId },
    include: {
      options: { select: { id: true, isCorrect: true } }
    }
  });

  const questionMap = new Map(questions.map((q) => [q.id, q]));

  // Validate all answer questionIds belong to this assessment
  for (const answer of answers) {
    if (!questionMap.has(answer.questionId)) {
      throw error(400, `Question ${answer.questionId} does not belong to this assessment`);
    }
  }

  let totalPoints = 0;
  let earnedPoints = 0;
  const responses = [];

  for (const answer of answers) {
    const question = questionMap.get(answer.questionId);
    totalPoints += question.points;

    let isCorrect = false;
    let pointsAwarded = 0;

    if (question.type === 'MCQ') {
      const option = (question.options || []).find((o) => o.id === answer.selectedOptionId);
      isCorrect = Boolean(option && option.isCorrect);
    } else {
      // TRUE_FALSE or SHORT_ANSWER: compare answer text
      const provided = (answer.answerText || '').trim().toLowerCase();
      const expected = (question.correctAnswer || '').trim().toLowerCase();
      isCorrect = provided !== '' && provided === expected;
    }

    pointsAwarded = isCorrect ? question.points : 0;
    earnedPoints += pointsAwarded;

    responses.push({
      questionId: question.id,
      selectedOptionId: answer.selectedOptionId || null,
      answerText: answer.answerText || null,
      isCorrect,
      pointsAwarded
    });
  }

  const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
  const passed = score >= assessment.passingScore;

  return prisma.$transaction(async (tx) => {
    const attempt = await tx.assessmentAttempt.create({
      data: {
        userId,
        assessmentId,
        score,
        totalPoints,
        earnedPoints,
        passed,
        status: 'EVALUATED',
        submittedAt: new Date()
      }
    });

    await tx.questionResponse.createMany({
      data: responses.map((r) => ({
        attemptId: attempt.id,
        questionId: r.questionId,
        selectedOptionId: r.selectedOptionId,
        answerText: r.answerText,
        isCorrect: r.isCorrect,
        pointsAwarded: r.pointsAwarded
      }))
    });

    return {
      attemptId: attempt.id,
      assessmentId: assessment.id,
      assessmentTitle: assessment.title,
      score,
      totalPoints,
      earnedPoints,
      passingScore: assessment.passingScore,
      passed,
      courseId: assessment.courseId,
      submittedAt: attempt.submittedAt,
      responses: responses.map((r) => ({
        questionId: r.questionId,
        isCorrect: r.isCorrect,
        pointsAwarded: r.pointsAwarded,
        selectedOptionId: r.selectedOptionId,
        answerText: r.answerText
      }))
    };
  });
}

/** ── Get assessment attempts (history) ─────────────────────────────────── */
async function getAttempts(assessmentId, userId) {
  const assessment = await prisma.assessment.findUnique({
    where: { id: assessmentId },
    select: { id: true }
  });
  if (!assessment) {
    throw error(404, 'Assessment not found');
  }

  const attempts = await prisma.assessmentAttempt.findMany({
    where: { userId, assessmentId },
    orderBy: { submittedAt: 'desc' },
    select: {
      id: true,
      score: true,
      totalPoints: true,
      earnedPoints: true,
      passed: true,
      status: true,
      durationSeconds: true,
      startedAt: true,
      submittedAt: true,
      responses: {
        select: {
          id: true,
          questionId: true,
          isCorrect: true,
          pointsAwarded: true
        }
      }
    }
  });

  return attempts;
}

/** ── Get a single attempt with responses ───────────────────────────────── */
async function getAttemptById(attemptId, userId) {
  const attempt = await prisma.assessmentAttempt.findUnique({
    where: { id: attemptId },
    include: {
      assessment: {
        select: { id: true, title: true, passingScore: true }
      },
      responses: {
        include: {
          question: {
            select: { id: true, questionText: true, type: true, points: true }
          },
          selectedOption: {
            select: { id: true, optionText: true }
          }
        }
      }
    }
  });

  if (!attempt) {
    throw error(404, 'Attempt not found');
  }
  if (attempt.userId !== userId) {
    throw error(403, 'Access denied: this attempt does not belong to you');
  }

  return {
    id: attempt.id,
    assessment: {
      id: attempt.assessment.id,
      title: attempt.assessment.title,
      passingScore: attempt.assessment.passingScore
    },
    score: attempt.score,
    totalPoints: attempt.totalPoints,
    earnedPoints: attempt.earnedPoints,
    passed: attempt.passed,
    status: attempt.status,
    durationSeconds: attempt.durationSeconds,
    startedAt: attempt.startedAt,
    submittedAt: attempt.submittedAt,
    responses: attempt.responses.map((r) => ({
      id: r.id,
      question: {
        id: r.question.id,
        questionText: r.question.questionText,
        type: r.question.type,
        points: r.question.points
      },
      selectedOption: r.selectedOption,
      answerText: r.answerText,
      isCorrect: r.isCorrect,
      pointsAwarded: r.pointsAwarded
    }))
  };
}

module.exports = {
  createAssessment,
  getAssessments,
  getAssessmentById,
  getQuestions,
  updateAssessment,
  deleteAssessment,
  submitAssessment,
  getAttempts,
  getAttemptById
};
