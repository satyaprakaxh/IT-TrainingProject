
const express = require('express');
const router = express.Router();

const prisma = require('../config/db');
const { authenticate } = require('../middleware/auth.middleware');

// ==========================================
// GET /api/dashboard/stats
// Fetch dashboard statistics
// ==========================================

router.get('/stats', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    // 1. Get completed lessons
    const completedLessons = await prisma.lessonProgress.count({
      where: {
        userId,
        status: 'COMPLETED'
      }
    });

    // 2. Get user's skill level
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { skillLevel: true }
    });

    // 3. Get total lessons in enrolled courses
    const totalLessons = await prisma.lesson.count({
      where: {
        course: {
          enrollments: {
            some: { userId }
          }
        }
      }
    });

    // 4. Calculate total XP
    const xpLogs = await prisma.activityLog.findMany({
      where: {
        userId,
        action: 'XP_EARNED'
      },
      select: { metadata: true }
    });

    const xp = xpLogs.reduce((total, log) => {
      const earned = Number(log.metadata?.xp || 0);
      return total + (Number.isFinite(earned) ? earned : 0);
    }, 0);

    // 5. Get lesson completion dates
    const activityLogs = await prisma.activityLog.findMany({
      where: {
        userId,
        action: 'LESSON_COMPLETED'
      },
      select: { createdAt: true },
      orderBy: { createdAt: 'desc' }
    });

    // Use UTC dates consistently
    const activeDays = [
      ...new Set(
        activityLogs.map(log =>
          log.createdAt.toISOString().slice(0, 10)
        )
      )
    ];

    // 6. Calculate daily streak
    let streak = 0;

    if (activeDays.length > 0) {
      const today = new Date();
      const todayString = today.toISOString().slice(0, 10);

      const yesterdayDate = new Date(today);
      yesterdayDate.setUTCDate(yesterdayDate.getUTCDate() - 1);

      const yesterdayString = yesterdayDate.toISOString().slice(0, 10);

      if (
        activeDays[0] === todayString ||
        activeDays[0] === yesterdayString
      ) {
        streak = 1;

        for (let i = 1; i < activeDays.length; i++) {
          const previous = new Date(`${activeDays[i - 1]}T00:00:00Z`);
          const current = new Date(`${activeDays[i]}T00:00:00Z`);

          const difference =
            (previous - current) / (1000 * 60 * 60 * 24);

          if (difference === 1) {
            streak++;
          } else {
            break;
          }
        }
      }
    }

    // 7. Send dashboard statistics
    return res.json({
      success: true,
      stats: {
        streak,
        xp,
        level: user?.skillLevel || 'BEGINNER',
        done: completedLessons,
        total: totalLessons
      }
    });

  } catch (error) {
    console.error('Dashboard stats error:', error);

    return res.status(500).json({
      success: false,
      message: 'Unable to fetch dashboard statistics'
    });
  }
});


// ==========================================
// GET /api/dashboard/skill-map
// Fetch logged-in user's skill map
// ==========================================

router.get('/skill-map', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    const userSkills = await prisma.userSkill.findMany({
      where: { userId },
      include: {
        skill: {
          select: {
            id: true,
            name: true,
            category: true,
            description: true
          }
        }
      },
      orderBy: {
        score: 'desc'
      }
    });

    const skills = userSkills.map((userSkill) => ({
      id: userSkill.skill.id,
      name: userSkill.skill.name,
      category: userSkill.skill.category,
      description: userSkill.skill.description,
      score: Math.max(0, Math.min(100, userSkill.score)),
      level: userSkill.level,
      assessedAt: userSkill.assessedAt
    }));

    const strongestSkill = skills.length > 0
      ? skills[0]
      : null;

    const weakestSkill = skills.length > 0
      ? skills[skills.length - 1]
      : null;

    return res.json({
      success: true,
      skills,
      strongestSkill,
      weakestSkill,
      totalSkills: skills.length
    });

  } catch (error) {
    console.error('Skill map error:', error);

    return res.status(500).json({
      success: false,
      message: 'Unable to fetch skill map'
    });
  }
});


// ==========================================
// POST /api/dashboard/lessons/:lessonId/complete
// Complete lesson and award XP
// ==========================================

router.post('/lessons/:lessonId/complete', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const lessonId = Number(req.params.lessonId);
    const XP_REWARD = 50;

    // Validate lesson ID
    if (!Number.isInteger(lessonId) || lessonId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid lesson ID'
      });
    }

    // Check whether lesson exists
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      select: {
        id: true,
        courseId: true
      }
    });

    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: 'Lesson not found'
      });
    }

    // Check student enrollment
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        userId,
        courseId: lesson.courseId
      }
    });

    if (!enrollment) {
      return res.status(403).json({
        success: false,
        message: 'You are not enrolled in this course'
      });
    }

    // Complete lesson and record XP in one transaction
    const result = await prisma.$transaction(async (tx) => {

      const existingProgress = await tx.lessonProgress.findUnique({
        where: {
          userId_lessonId: {
            userId,
            lessonId
          }
        }
      });

      // Do not award XP twice
      if (existingProgress?.status === 'COMPLETED') {
        return { alreadyCompleted: true };
      }

      const now = new Date();

      // Update lesson progress
      await tx.lessonProgress.upsert({
        where: {
          userId_lessonId: {
            userId,
            lessonId
          }
        },

        create: {
          userId,
          lessonId,
          status: 'COMPLETED',
          progressPercentage: 100,
          timeSpentSeconds: 0,
          completedAt: now
        },

        update: {
          status: 'COMPLETED',
          progressPercentage: 100,
          completedAt: now
        }
      });

      // Record lesson completion
      await tx.activityLog.create({
        data: {
          userId,
          action: 'LESSON_COMPLETED',
          description: 'Completed a lesson',
          metadata: { lessonId }
        }
      });

      // Record XP earned
      await tx.activityLog.create({
        data: {
          userId,
          action: 'XP_EARNED',
          description: 'Earned XP for completing a lesson',
          metadata: {
            lessonId,
            xp: XP_REWARD
          }
        }
      });

      return { alreadyCompleted: false };
    });

    // Already completed
    if (result.alreadyCompleted) {
      return res.json({
        success: true,
        message: 'Lesson was already completed',
        xpEarned: 0
      });
    }

    // Success response
    return res.json({
      success: true,
      message: 'Lesson completed successfully!',
      xpEarned: XP_REWARD
    });

  } catch (error) {
    console.error('Lesson completion error:', error);

    return res.status(500).json({
      success: false,
      message: 'Unable to complete lesson'
    });
  }
});

module.exports = router;
