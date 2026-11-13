
const prisma = require('../config/db');

function error(statusCode, message) {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
}

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

function getSkillLevel(score) {
  if (score >= 80) return 'EXPERT';
  if (score >= 60) return 'ADVANCED';
  if (score >= 40) return 'INTERMEDIATE';
  return 'BEGINNER';
}

/** CREATE ASSESSMENT */
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

  if (courseId) {
    const course = await prisma.course.findUnique({
      where: { id: courseId }
    });

    if (!course) {
      throw error(404, 'Course not found');
    }
  }

  if (lessonId) {
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      select: { id: true, courseId: true }
    });

    if (!lesson) {
      throw error(404, 'Lesson not found');
    }

    if (courseId && lesson.courseId !== courseId) {
      throw error(400, 'Lesson does not belong to this course');
    }
  }

  for (const question of questions) {
    if (question.type === 'MCQ') {
      const correctCount = (question.options || []).filter(
        option => option.isCorrect
      ).length;

      if (correctCount !== 1) {
        throw error(400, 'MCQ must have exactly one correct option');
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
            create: (question.options || []).map(option => ({
              optionText: option.optionText,
              isCorrect: option.isCorrect
            }))
          }
        }
      });
    }

    return assessment;
  });
}

/** LIST ASSESSMENTS */
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
        _count: {
          select: {
            questions: true,
            attempts: true
          }
        },

        course: {
          select: {
            id: true,
            title: true,
            courseSkills: {
              include: {
                skill: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            }
          }
        },

        lesson: {
          select: {
            id: true,
            title: true
          }
        },

        createdBy: {
          select: {
            id: true,
            name: true
          }
        }
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

      course: a.course
        ? {
            id: a.course.id,
            title: a.course.title,
            skills: a.course.courseSkills.map(
              (item) => item.skill
            )
          }
        : null,

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

/** GET ASSESSMENT */
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
          options: {
            select: {
              id: true,
              optionText: true
            }
          }
        }
      },
      course: {
        select: {
          id: true,
          title: true
        }
      },
      lesson: {
        select: {
          id: true,
          title: true
        }
      },
      createdBy: {
        select: {
          id: true,
          name: true
        }
      }
    }
  });

  if (!assessment) {
    throw error(404, 'Assessment not found');
  }

  return {
    ...assessment,
    questions: sanitizeQuestions(assessment.questions)
  };
}

/** GET QUESTIONS */
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
      options: {
        select: {
          id: true,
          optionText: true
        }
      }
    }
  });

  return sanitizeQuestions(questions);
}

/** UPDATE ASSESSMENT */
async function updateAssessment(id, data, userId, userRole) {
  const existing = await prisma.assessment.findUnique({
    where: { id }
  });

  if (!existing) {
    throw error(404, 'Assessment not found');
  }

  if (userRole !== 'ADMIN' && existing.createdById !== userId) {
    throw error(403, 'Access denied');
  }

  const { questions, ...assessmentFields } = data;

  return prisma.$transaction(async (tx) => {
    const assessment = await tx.assessment.update({
      where: { id },
      data: assessmentFields
    });

    if (Array.isArray(questions)) {
      await tx.questionResponse.deleteMany({
        where: {
          question: {
            assessmentId: id
          }
        }
      });

      await tx.questionOption.deleteMany({
        where: {
          question: {
            assessmentId: id
          }
        }
      });

      await tx.question.deleteMany({
        where: { assessmentId: id }
      });

      for (const question of questions) {
        if (question.type === 'MCQ') {
          const correctCount = (question.options || []).filter(
            option => option.isCorrect
          ).length;

          if (correctCount !== 1) {
            throw error(400, 'MCQ must have exactly one correct option');
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
              create: (question.options || []).map(option => ({
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

/** DELETE ASSESSMENT */
async function deleteAssessment(id, userId, userRole) {
  const existing = await prisma.assessment.findUnique({
    where: { id }
  });

  if (!existing) {
    throw error(404, 'Assessment not found');
  }

  if (userRole !== 'ADMIN' && existing.createdById !== userId) {
    throw error(403, 'Access denied');
  }

  await prisma.assessment.delete({
    where: { id }
  });

  return { id };
}

/** SUBMIT ASSESSMENT AND UPDATE SKILLS */
async function submitAssessment(assessmentId, userId, answers) {
  const assessment = await prisma.assessment.findUnique({
    where: { id: assessmentId },
    select: {
      id: true,
      title: true,
      passingScore: true,
      courseId: true,
      lesson: {
        select: {
          courseId: true
        }
      }
    }
  });

  if (!assessment) {
    throw error(404, 'Assessment not found');
  }

  const questions = await prisma.question.findMany({
    where: { assessmentId },
    include: {
      options: {
        select: {
          id: true,
          isCorrect: true
        }
      }
    }
  });

  const questionMap = new Map(
    questions.map(q => [q.id, q])
  );

  for (const answer of answers) {
    if (!questionMap.has(answer.questionId)) {
      throw error(
        400,
        `Question ${answer.questionId} does not belong to this assessment`
      );
    }
  }

  let totalPoints = 0;
  let earnedPoints = 0;

  const responses = [];

  for (const answer of answers) {
    const question = questionMap.get(answer.questionId);

    totalPoints += question.points;

    let isCorrect = false;

    if (question.type === 'MCQ') {
      const option = question.options.find(
        o => o.id === answer.selectedOptionId
      );

      isCorrect = Boolean(option && option.isCorrect);
    } else {
      const provided = (answer.answerText || '').trim().toLowerCase();
      const expected = (question.correctAnswer || '').trim().toLowerCase();

      isCorrect = provided !== '' && provided === expected;
    }

    const pointsAwarded = isCorrect ? question.points : 0;

    earnedPoints += pointsAwarded;

    responses.push({
      questionId: question.id,
      selectedOptionId: answer.selectedOptionId || null,
      answerText: answer.answerText || null,
      isCorrect,
      pointsAwarded
    });
  }

  const score = totalPoints > 0
    ? Math.round((earnedPoints / totalPoints) * 100)
    : 0;

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
      data: responses.map(r => ({
        attemptId: attempt.id,
        questionId: r.questionId,
        selectedOptionId: r.selectedOptionId,
        answerText: r.answerText,
        isCorrect: r.isCorrect,
        pointsAwarded: r.pointsAwarded
      }))
    });

    const courseId = assessment.courseId || assessment.lesson?.courseId;

    if (courseId) {
      const courseSkills = await tx.courseSkill.findMany({
        where: { courseId },
        select: { skillId: true }
      });

      for (const courseSkill of courseSkills) {
        await tx.userSkill.upsert({
          where: {
            userId_skillId: {
              userId,
              skillId: courseSkill.skillId
            }
          },
          update: {
            score,
            level: getSkillLevel(score),
            assessedAt: new Date()
          },
          create: {
            userId,
            skillId: courseSkill.skillId,
            score,
            level: getSkillLevel(score),
            assessedAt: new Date()
          }
        });
      }
    }

    return {
      attemptId: attempt.id,
      assessmentId: assessment.id,
      assessmentTitle: assessment.title,
      score,
      totalPoints,
      earnedPoints,
      passingScore: assessment.passingScore,
      passed,
      courseId: courseId || null,
      submittedAt: attempt.submittedAt,
      responses
    };
  });
}

/** GET ATTEMPTS */
async function getAttempts(assessmentId, userId) {
  const assessment = await prisma.assessment.findUnique({
    where: { id: assessmentId },
    select: { id: true }
  });

  if (!assessment) {
    throw error(404, 'Assessment not found');
  }

  return prisma.assessmentAttempt.findMany({
    where: {
      userId,
      assessmentId
    },
    orderBy: {
      submittedAt: 'desc'
    },
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
}

/** GET SINGLE ATTEMPT */
async function getAttemptById(attemptId, userId) {
  const attempt = await prisma.assessmentAttempt.findUnique({
    where: { id: attemptId },
    include: {
      assessment: {
        select: {
          id: true,
          title: true,
          passingScore: true
        }
      },
      responses: {
        include: {
          question: {
            select: {
              id: true,
              questionText: true,
              type: true,
              points: true
            }
          },
          selectedOption: {
            select: {
              id: true,
              optionText: true
            }
          }
        }
      }
    }
  });

  if (!attempt) {
    throw error(404, 'Attempt not found');
  }

  if (attempt.userId !== userId) {
    throw error(403, 'Access denied');
  }

  return {
    id: attempt.id,
    assessment: attempt.assessment,
    score: attempt.score,
    totalPoints: attempt.totalPoints,
    earnedPoints: attempt.earnedPoints,
    passed: attempt.passed,
    status: attempt.status,
    durationSeconds: attempt.durationSeconds,
    startedAt: attempt.startedAt,
    submittedAt: attempt.submittedAt,
    responses: attempt.responses.map(r => ({
      id: r.id,
      question: r.question,
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
