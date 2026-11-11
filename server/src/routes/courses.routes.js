
const express = require('express');
const router = express.Router();

const prisma = require('../config/db');
const { authenticate } = require('../middleware/auth.middleware');

// GET /api/courses
// Fetch published courses and the student's lesson progress
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    const courses = await prisma.course.findMany({
      where: {
        status: 'PUBLISHED'
      },
      include: {
        lessons: {
          orderBy: {
            position: 'asc'
          },
          include: {
            progressRecords: {
              where: { userId },
              select: {
                status: true,
                progressPercentage: true,
                completedAt: true
              }
            }
          }
        },
        enrollments: {
          where: { userId },
          select: {
            status: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const formattedCourses = courses.map((course) => {
      const completedLessons = course.lessons.filter(
        (lesson) =>
          lesson.progressRecords[0]?.status === 'COMPLETED'
      ).length;

      return {
        id: course.id,
        title: course.title,
        description: course.description,
        category: course.category,
        difficulty: course.difficulty,
        estimatedDurationMinutes: course.estimatedDurationMinutes,
        isEnrolled: course.enrollments.length > 0,
        enrollmentStatus: course.enrollments[0]?.status || null,
        completedLessons,
        totalLessons: course.lessons.length,
        lessons: course.lessons.map((lesson) => ({
          id: lesson.id,
          title: lesson.title,
          description: lesson.description,
          content: lesson.content,
          position: lesson.position,
          durationMinutes: lesson.durationMinutes,
          status: lesson.progressRecords[0]?.status || 'NOT_STARTED'
        }))
      };
    });

    return res.json({
      success: true,
      courses: formattedCourses
    });

  } catch (error) {
    console.error('Fetch courses error:', error);

    return res.status(500).json({
      success: false,
      message: 'Unable to fetch courses'
    });
  }
});

// POST /api/courses/:courseId/enroll
// Enroll the logged-in student
router.post('/:courseId/enroll', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const courseId = Number(req.params.courseId);

    if (!Number.isInteger(courseId) || courseId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid course ID'
      });
    }

    const course = await prisma.course.findFirst({
      where: {
        id: courseId,
        status: 'PUBLISHED'
      }
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    const enrollment = await prisma.enrollment.upsert({
      where: {
        userId_courseId: {
          userId,
          courseId
        }
      },
      create: {
        userId,
        courseId,
        status: 'ENROLLED'
      },
      update: {}
    });

    return res.json({
      success: true,
      message: 'Successfully enrolled in course',
      enrollment
    });

  } catch (error) {
    console.error('Course enrollment error:', error);

    return res.status(500).json({
      success: false,
      message: 'Unable to enroll in course'
    });
  }
});

module.exports = router;
