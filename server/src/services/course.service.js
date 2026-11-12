const prisma = require('../config/db');

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

/**
 * Throws an object with { statusCode, message } for the controller to map to HTTP.
 */
function error(statusCode, message) {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
}

/**
 * Ensures the requesting user can mutate a course.
 * ADMIN can manage any course; TRAINER/EMPLOYEE only their own created courses.
 */
function ensureCourseAccess(course, userId, userRole) {
  if (userRole === 'ADMIN') return;
  if (course && course.createdById === userId) return;
  throw error(403, 'Access denied: you do not own this course');
}

/** ── Create course ─────────────────────────────────────────────────────── */
async function createCourse(data, userId) {
  const {
    title,
    description,
    category,
    difficulty,
    estimatedDurationMinutes,
    status = 'DRAFT',
    skills = [],
    lessons = []
  } = data;

  // Validate referenced skills exist
  if (skills.length > 0) {
    const existingSkills = await prisma.skill.findMany({
      where: { id: { in: skills } },
      select: { id: true }
    });
    if (existingSkills.length !== skills.length) {
      throw error(400, 'One or more skill IDs are invalid');
    }
  }

  return prisma.$transaction(async (tx) => {
    const course = await tx.course.create({
      data: {
        title,
        description,
        category,
        difficulty,
        estimatedDurationMinutes,
        status,
        createdById: userId
      }
    });

    // Attach course skills
    if (skills.length > 0) {
      await tx.courseSkill.createMany({
        data: skills.map((skillId) => ({ courseId: course.id, skillId }))
      });
    }

    // Create lessons
    if (lessons.length > 0) {
      await tx.lesson.createMany({
        data: lessons.map((lesson) => ({
          courseId: course.id,
          title: lesson.title,
          description: lesson.description,
          content: lesson.content,
          position: lesson.position,
          durationMinutes: lesson.durationMinutes
        }))
      });
    }

    return course;
  });
}

/** ── List courses (with pagination, search, filter) ────────────────────── */
async function getCourses(query, userId, userRole) {
  const {
    page = DEFAULT_PAGE,
    limit = DEFAULT_LIMIT,
    search,
    category,
    difficulty,
    status,
    sort = 'createdAt'
  } = query;

  const skip = (page - 1) * limit;
  const take = Math.min(limit, MAX_LIMIT);

  const where = {};

  // Visibility rule: employees only see published courses.
  if (userRole === 'EMPLOYEE') {
    where.status = 'PUBLISHED';
  } else if (status) {
    where.status = status;
  }

  if (category) {
    where.category = { contains: category, mode: 'insensitive' };
  }
  if (difficulty) {
    where.difficulty = difficulty;
  }
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { category: { contains: search, mode: 'insensitive' } }
    ];
  }

  const [courses, total] = await prisma.$transaction([
    prisma.course.findMany({
      where,
      skip,
      take,
      orderBy: { [sort]: 'desc' },
      include: {
        _count: { select: { lessons: true, enrollments: true } },
        courseSkills: {
          select: { skill: { select: { id: true, name: true } } }
        },
        enrollments: {
          where: { userId },
          select: { status: true }
        },
        createdBy: {
          select: { id: true, name: true, email: true, role: true }
        }
      }
    }),
    prisma.course.count({ where })
  ]);

  const formatted = courses.map((course) => {
    const skills = course.courseSkills.map((cs) => cs.skill).filter(Boolean);
    const enrollment = course.enrollments[0];
    const lessonCount = course._count.lessons;

    return {
      id: course.id,
      title: course.title,
      description: course.description,
      category: course.category,
      difficulty: course.difficulty,
      status: course.status,
      estimatedDurationMinutes: course.estimatedDurationMinutes,
      createdBy: course.createdBy,
      skills,
      lessonCount,
      enrollmentCount: course._count.enrollments,
      isEnrolled: enrollment ? true : false,
      enrollmentStatus: enrollment ? enrollment.status : null,
      createdAt: course.createdAt,
      updatedAt: course.updatedAt
    };
  });

  return {
    courses: formatted,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}

/** ── Get single course by ID ───────────────────────────────────────────── */
async function getCourseById(id, userId, userRole) {
  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      lessons: {
        orderBy: { position: 'asc' },
        include: {
          progressRecords: {
            where: { userId },
            select: {
              status: true,
              progressPercentage: true,
              timeSpentSeconds: true,
              completedAt: true
            }
          }
        }
      },
      courseSkills: {
        select: { skill: { select: { id: true, name: true, category: true } } }
      },
      enrollments: {
        where: { userId },
        select: { status: true, enrolledAt: true, completedAt: true }
      },
      createdBy: {
        select: { id: true, name: true, email: true, role: true }
      },
      assessments: {
        select: {
          id: true,
          title: true,
          type: true,
          difficulty: true,
          passingScore: true,
          timeLimitMinutes: true
        }
      }
    }
  });

  if (!course) {
    throw error(404, 'Course not found');
  }

  // Visibility: unpublished courses only visible to creator or ADMIN
  if (course.status !== 'PUBLISHED' && userRole !== 'ADMIN' && course.createdById !== userId) {
    throw error(403, 'Access denied: this course is not published');
  }

  const lessons = course.lessons.map((lesson) => {
    const progress = lesson.progressRecords[0];
    return {
      id: lesson.id,
      title: lesson.title,
      description: lesson.description,
      content: lesson.content,
      position: lesson.position,
      durationMinutes: lesson.durationMinutes,
      status: progress ? progress.status : 'NOT_STARTED',
      progressPercentage: progress ? progress.progressPercentage : 0,
      timeSpentSeconds: progress ? progress.timeSpentSeconds : 0,
      completedAt: progress ? progress.completedAt : null
    };
  });

  const completedLessons = lessons.filter((l) => l.status === 'COMPLETED').length;
  const completionPercentage =
    course.lessons.length > 0
      ? Math.round((completedLessons / course.lessons.length) * 100)
      : 0;

  const enrollment = course.enrollments[0];

  return {
    id: course.id,
    title: course.title,
    description: course.description,
    category: course.category,
    difficulty: course.difficulty,
    status: course.status,
    estimatedDurationMinutes: course.estimatedDurationMinutes,
    createdBy: course.createdBy,
    skills: course.courseSkills.map((cs) => cs.skill).filter(Boolean),
    lessons,
    lessonCount: course.lessons.length,
    completedLessons,
    completionPercentage,
    isEnrolled: enrollment ? true : false,
    enrollmentStatus: enrollment ? enrollment.status : null,
    enrolledAt: enrollment ? enrollment.enrolledAt : null,
    completedAt: enrollment ? enrollment.completedAt : null,
    assessments: course.assessments,
    createdAt: course.createdAt,
    updatedAt: course.updatedAt
  };
}

/** ── Update course ─────────────────────────────────────────────────────── */
async function updateCourse(id, data, userId, userRole) {
  const existing = await prisma.course.findUnique({ where: { id } });
  if (!existing) {
    throw error(404, 'Course not found');
  }
  ensureCourseAccess(existing, userId, userRole);

  const { skills, lessons, ...courseFields } = data;

  return prisma.$transaction(async (tx) => {
    const course = await tx.course.update({
      where: { id },
      data: courseFields
    });

    // Replace course skills if provided
    if (Array.isArray(skills)) {
      if (skills.length > 0) {
        const existingSkills = await tx.skill.findMany({
          where: { id: { in: skills } },
          select: { id: true }
        });
        if (existingSkills.length !== skills.length) {
          throw error(400, 'One or more skill IDs are invalid');
        }
      }
      await tx.courseSkill.deleteMany({ where: { courseId: id } });
      if (skills.length > 0) {
        await tx.courseSkill.createMany({
          data: skills.map((skillId) => ({ courseId: id, skillId }))
        });
      }
    }

    // Replace lessons if provided
    if (Array.isArray(lessons)) {
      await tx.lesson.deleteMany({ where: { courseId: id } });
      if (lessons.length > 0) {
        await tx.lesson.createMany({
          data: lessons.map((lesson) => ({
            courseId: id,
            title: lesson.title,
            description: lesson.description,
            content: lesson.content,
            position: lesson.position,
            durationMinutes: lesson.durationMinutes
          }))
        });
      }
    }

    return course;
  });
}

/** ── Delete course ─────────────────────────────────────────────────────── */
async function deleteCourse(id, userId, userRole) {
  const existing = await prisma.course.findUnique({ where: { id } });
  if (!existing) {
    throw error(404, 'Course not found');
  }
  ensureCourseAccess(existing, userId, userRole);

  await prisma.course.delete({ where: { id } });
  return { id };
}

/** ── Publish course ────────────────────────────────────────────────────── */
async function publishCourse(id, userId, userRole) {
  const existing = await prisma.course.findUnique({ where: { id } });
  if (!existing) {
    throw error(404, 'Course not found');
  }
  ensureCourseAccess(existing, userId, userRole);

  const course = await prisma.course.update({
    where: { id },
    data: { status: 'PUBLISHED' }
  });
  return course;
}

/** ── Enroll in course ──────────────────────────────────────────────────── */
async function enrollCourse(courseId, userId) {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { id: true, status: true }
  });
  if (!course) {
    throw error(404, 'Course not found');
  }
  if (course.status !== 'PUBLISHED') {
    throw error(400, 'Only published courses can be enrolled in');
  }

  const enrollment = await prisma.enrollment.upsert({
    where: { userId_courseId: { userId, courseId } },
    create: { userId, courseId, status: 'ENROLLED' },
    update: {}
  });

  return enrollment;
}

/** ── Get lessons of a course ───────────────────────────────────────────── */
async function getCourseLessons(courseId, userId) {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { id: true, status: true, createdById: true }
  });
  if (!course) {
    throw error(404, 'Course not found');
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true }
  });

  if (course.status !== 'PUBLISHED' && user.role !== 'ADMIN' && course.createdById !== userId) {
    throw error(403, 'Access denied: this course is not published');
  }

  const lessons = await prisma.lesson.findMany({
    where: { courseId },
    orderBy: { position: 'asc' },
    include: {
      progressRecords: {
        where: { userId },
        select: {
          status: true,
          progressPercentage: true,
          timeSpentSeconds: true,
          completedAt: true
        }
      },
      _count: { select: { assessments: true } }
    }
  });

  return lessons.map((lesson) => {
    const progress = lesson.progressRecords[0];
    return {
      id: lesson.id,
      title: lesson.title,
      description: lesson.description,
      content: lesson.content,
      position: lesson.position,
      durationMinutes: lesson.durationMinutes,
      status: progress ? progress.status : 'NOT_STARTED',
      progressPercentage: progress ? progress.progressPercentage : 0,
      timeSpentSeconds: progress ? progress.timeSpentSeconds : 0,
      completedAt: progress ? progress.completedAt : null,
      assessmentCount: lesson._count.assessments
    };
  });
}

/** ── Get course progress ───────────────────────────────────────────────── */
async function getCourseProgress(courseId, userId) {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { id: true, status: true }
  });
  if (!course) {
    throw error(404, 'Course not found');
  }

  const lessons = await prisma.lesson.findMany({
    where: { courseId },
    include: {
      progressRecords: {
        where: { userId },
        select: { status: true, progressPercentage: true, completedAt: true }
      }
    }
  });

  const lessonDetails = lessons.map((lesson) => {
    const progress = lesson.progressRecords[0];
    return {
      lessonId: lesson.id,
      title: lesson.title,
      position: lesson.position,
      status: progress ? progress.status : 'NOT_STARTED',
      progressPercentage: progress ? progress.progressPercentage : 0,
      completedAt: progress ? progress.completedAt : null
    };
  });

  const completedLessons = lessonDetails.filter((l) => l.status === 'COMPLETED').length;
  const completionPercentage =
    lessons.length > 0 ? Math.round((completedLessons / lessons.length) * 100) : 0;

  return {
    courseId,
    lessonCount: lessons.length,
    completedLessons,
    completionPercentage,
    lessons: lessonDetails
  };
}

/** ── Update lesson progress ────────────────────────────────────────────── */
async function updateLessonProgress(lessonId, userId, data) {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: { id: true, courseId: true }
  });
  if (!lesson) {
    throw error(404, 'Lesson not found');
  }

  // Ensure user is enrolled in the course
  const enrollment = await prisma.enrollment.findFirst({
    where: { userId, courseId: lesson.courseId }
  });
  if (!enrollment) {
    throw error(403, 'You are not enrolled in this course');
  }

  const { status, progressPercentage, timeSpentSeconds } = data;
  const now = new Date();
  const completed = status === 'COMPLETED';

  const progress = await prisma.lessonProgress.upsert({
    where: { userId_lessonId: { userId, lessonId } },
    create: {
      userId,
      lessonId,
      status: completed ? 'COMPLETED' : 'IN_PROGRESS',
      progressPercentage: completed ? 100 : (progressPercentage || 0),
      timeSpentSeconds: timeSpentSeconds || 0,
      completedAt: completed ? now : null
    },
    update: {
      status: completed ? 'COMPLETED' : 'IN_PROGRESS',
      progressPercentage: completed ? 100 : (progressPercentage || 0),
      timeSpentSeconds: timeSpentSeconds || 0,
      completedAt: completed ? now : null,
      updatedAt: now
    }
  });

  return {
    lessonId,
    status: progress.status,
    progressPercentage: progress.progressPercentage,
    completedAt: progress.completedAt
  };
}

module.exports = {
  createCourse,
  getCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
  publishCourse,
  enrollCourse,
  getCourseLessons,
  getCourseProgress,
  updateLessonProgress
};
