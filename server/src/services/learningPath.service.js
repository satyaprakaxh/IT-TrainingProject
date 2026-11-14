const prisma = require('../config/db');
const { generateAIResponse, extractJson, error: aiError } = require('./aiGeneration.service');
const {
  getLatestSkillGapAnalysis,
  classifyLevel,
  error: sgError
} = require('./skillGap.service');

/**
 * Throws an object with { statusCode, message } for the controller to map to HTTP.
 */
function serviceError(statusCode, message) {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
}

/**
 * Fetches all available courses from the database to match against skill gaps.
 */
async function getAvailableCourses() {
  return prisma.course.findMany({
    where: { status: 'PUBLISHED' },
    include: {
      courseSkills: { select: { skill: { select: { id: true, name: true } } } },
      _count: { select: { lessons: true } }
    },
    orderBy: [{ difficulty: 'asc' }, { createdAt: 'desc' }]
  });
}

/**
 * Matches a skill gap to existing courses that teach that skill.
 * Returns an array of course matches with relevance scores.
 */
function matchCoursesToGap(skillGap, courses) {
  const skillName = (skillGap.skill || skillGap.name || '').toLowerCase();

  return courses
    .map((course) => {
      const courseSkills = course.courseSkills
        ? course.courseSkills.map((cs) => cs.skill.name.toLowerCase())
        : [];

      const titleDesc = (course.title + ' ' + (course.description || '')).toLowerCase();

      let matchScore = 0;
      let matchedSkills = [];

      // Check if course explicitly teaches this skill
      courseSkills.forEach((cs) => {
        if (skillName === cs || skillName.includes(cs) || cs.includes(skillName)) {
          matchScore += 50;
          matchedSkills.push(cs);
        }
      });

      // Check title/description for skill keywords
      const keywords = skillName.split(' ');
      keywords.forEach((kw) => {
        if (kw.length > 2 && titleDesc.includes(kw)) {
          matchScore += 10;
        }
      });

      // Boost for matching difficulty
      if (skillGap.level === 'BEGINNER' && course.difficulty === 'BEGINNER') matchScore += 20;
      if (skillGap.level === 'INTERMEDIATE' && course.difficulty === 'INTERMEDIATE') matchScore += 20;
      if (skillGap.level === 'ADVANCED' && course.difficulty === 'ADVANCED') matchScore += 20;

      return {
        course,
        matchScore,
        matchedSkills
      };
    })
    .filter((m) => m.matchScore > 0)
    .sort((a, b) => b.matchScore - a.matchScore);
}

/**
 * Generates a personalized course using AI when no suitable existing course
 * is found for a skill gap.
 */
async function generateAICourse(skillGap, userLevel) {
  const prompt = `Create a personalized beginner-to-intermediate course for the skill "${skillGap.skill}".
The student's current level is ${userLevel}. The skill gap priority is ${skillGap.priority}.
Return a JSON object with exactly these fields:
- title: Course title (string)
- description: Course description (string)
- category: "${skillGap.category}"
- difficulty: "${skillGap.level}"
- estimatedDurationMinutes: number (30-300)
- learningObjectives: array of 4-6 strings
- modules: array of module objects, each with: title (string), description (string), lessons (array of lesson objects with title, description, durationMinutes)
- prerequisites: array of strings (things to know before starting)
- tags: array of relevant skill tags

Return ONLY valid JSON, no markdown fences, no extra text.`;

  try {
    const response = await generateAIResponse(prompt, 1500);
    const parsed = extractJson(response);

    if (!parsed) {
      throw serviceError(500, 'AI returned invalid course data');
    }

    // Validate required fields
    if (!parsed.title || !parsed.description || !parsed.modules) {
      throw serviceError(500, 'AI course missing required fields');
    }

    return parsed;
  } catch (err) {
    if (err.statusCode) throw err;
    throw serviceError(500, `AI course generation failed: ${err.message}`);
  }
}

/**
 * Creates a course in the database from AI-generated data.
 */
async function createGeneratedCourse(courseData, userId) {
  return prisma.$transaction(async (tx) => {
    const course = await tx.course.create({
      data: {
        title: courseData.title,
        description: courseData.description,
        category: courseData.category || 'General',
        difficulty: courseData.difficulty || 'BEGINNER',
        estimatedDurationMinutes: courseData.estimatedDurationMinutes || 60,
        status: 'PUBLISHED',
        createdById: userId
      }
    });

    // Create lessons for each module
    if (courseData.modules && Array.isArray(courseData.modules)) {
      let position = 0;
      for (const module of courseData.modules) {
        if (module.lessons && Array.isArray(module.lessons)) {
          for (const lesson of module.lessons) {
            await tx.lesson.create({
              data: {
                courseId: course.id,
                title: lesson.title || 'Untitled Lesson',
                description: lesson.description || '',
                content: lesson.description || '',
                position: position++,
                durationMinutes: lesson.durationMinutes || 15
              }
            });
          }
        }
      }
    }

    return course;
  });
}

/**
 * Generates a complete personalized learning path using AI.
 * Takes skill gaps and existing courses, produces ordered LearningPathItem sequence.
 */
async function generatePathItems(skillGaps, existingCourses, userId) {
  const pathItems = [];
  let totalDuration = 0;
  const usedCourseIds = new Set();

  for (const gap of skillGaps.filter((g) => g.priority !== 'low')) {
    const matches = matchCoursesToGap(gap, existingCourses);

    let selectedCourse = null;
    let isGenerated = false;

    // Find first match that hasn't been used yet
    for (const match of matches) {
      if (!usedCourseIds.has(match.course.id)) {
        selectedCourse = match.course;
        break;
      }
    }

    if (!selectedCourse) {
      // Generate a new AI course for this gap
      try {
        const aiCourse = await generateAICourse(gap, userLevelFromGaps(skillGaps));
        selectedCourse = await createGeneratedCourse(aiCourse, userId);
        isGenerated = true;
      } catch (err) {
        console.warn(`AI course generation failed for ${gap.skill || gap.name}:`, err.message);
        continue;
      }
    }

    if (!selectedCourse) continue;

    usedCourseIds.add(selectedCourse.id);
    totalDuration += selectedCourse.estimatedDurationMinutes || 60;

    pathItems.push({
      courseId: selectedCourse.id,
      position: pathItems.length + 1,
      skillGap: gap.skill || gap.name,
      priority: gap.priority,
      isGenerated
    });
  }

  // Sort by priority: high first, then medium
  pathItems.sort((a, b) => {
    const pOrder = { high: 0, medium: 1, low: 2 };
    return (pOrder[a.priority] || 99) - (pOrder[b.priority] || 99);
  });

  // Re-assign positions after sorting
  pathItems.forEach((item, idx) => {
    item.position = idx + 1;
  });

  return {
    items: pathItems,
    totalDurationMinutes: totalDuration
  };
}

function userLevelFromGaps(skillGaps) {
  const levels = skillGaps.map((g) => g.level);
  if (levels.includes('BEGINNER')) return 'BEGINNER';
  if (levels.includes('INTERMEDIATE')) return 'INTERMEDIATE';
  if (levels.includes('ADVANCED')) return 'ADVANCED';
  return 'EXPERT';
}

/**
 * Main entry point: generates a complete learning path for a user based on
 * their latest skill gap analysis.
 */
async function generatePersonalizedLearningPath(userId) {
  // 1. Get latest skill gap analysis
  const gapAnalysis = await getLatestSkillGapAnalysis(userId);
  if (!gapAnalysis) {
    throw sgError(404, 'No skill gap analysis found. Complete an assessment first.');
  }

  // 2. Reconstruct priority gaps from stored strengths/weaknesses/recommendedTopics
  // The gaps array is not persisted, so rebuild from stored fields
  const weaknessGaps = (gapAnalysis.weaknesses || []).map((w) => ({
    ...w,
    priority: 'medium'
  }));
  const missingGaps = (gapAnalysis.recommendedTopics || []).map((name) => ({
    name,
    category: 'General',
    score: 0,
    level: 'BEGINNER',
    gap: 100,
    priority: 'high'
  }));
  const priorityGaps = [...weaknessGaps, ...missingGaps];

  if (priorityGaps.length === 0) {
    throw serviceError(400, 'No skill gaps found to build a learning path');
  }

  // 3. Get available existing courses
  const existingCourses = await getAvailableCourses();

  // 4. Generate the path structure
  const pathData = await generatePathItems(priorityGaps, existingCourses, userId);

  if (!pathData.items || pathData.items.length === 0) {
    throw serviceError(500, 'Failed to generate any learning path items');
  }

  // 5. Deactivate any existing active learning paths for this user
  await prisma.learningPath.updateMany({
    where: { userId, status: 'ACTIVE' },
    data: { status: 'COMPLETED' }
  });

  // 6. Create the learning path and its items in a transaction
  const learningPath = await prisma.$transaction(async (tx) => {
    const path = await tx.learningPath.create({
      data: {
        title: `Personalized Learning Path - ${new Date().toLocaleDateString()}`,
        description: `AI-generated learning path based on your skill gaps. Focus areas: ${priorityGaps.map((g) => g.skill).join(', ')}.`,
        userId,
        status: 'ACTIVE',
        generatedByAI: true
      }
    });

    await tx.learningPathItem.createMany({
      data: pathData.items.map((item) => ({
        learningPathId: path.id,
        courseId: item.courseId,
        position: item.position
      }))
    });

    return path;
  });

  // 7. Fetch the full path with items and course details
  const fullPath = await prisma.learningPath.findUnique({
    where: { id: learningPath.id },
    include: {
      items: {
        orderBy: { position: 'asc' },
        include: {
          course: {
            select: {
              id: true,
              title: true,
              description: true,
              difficulty: true,
              estimatedDurationMinutes: true,
              category: true,
              courseSkills: {
                select: { skill: { select: { id: true, name: true } } }
              },
              _count: { select: { lessons: true } }
            }
          }
        }
      }
    }
  });

  return {
    learningPath: fullPath,
    skillGapAnalysis: gapAnalysis,
    totalDurationMinutes: pathData.totalDurationMinutes,
    itemCount: pathData.items.length
  };
}

/**
 * Gets a user's active learning path with full details.
 */
async function getUserLearningPath(userId) {
  const path = await prisma.learningPath.findFirst({
    where: { userId, status: 'ACTIVE' },
    include: {
      items: {
        orderBy: { position: 'asc' },
        include: {
          course: {
            select: {
              id: true,
              title: true,
              description: true,
              difficulty: true,
              estimatedDurationMinutes: true,
              category: true,
              courseSkills: {
                select: { skill: { select: { id: true, name: true } } }
              },
              _count: { select: { lessons: true } }
            }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  if (!path) return null;

  // Calculate progress per item based on lesson completions
  const itemsWithProgress = await Promise.all(
    path.items.map(async (item) => {
      const courseId = item.courseId;
      const lessons = await prisma.lesson.findMany({
        where: { courseId },
        select: { id: true }
      });

      const lessonIds = lessons.map((l) => l.id);
      const completedLessons = await prisma.lessonProgress.count({
        where: {
          userId,
          lessonId: { in: lessonIds },
          status: 'COMPLETED'
        }
      });

      const totalLessons = lessons.length;
      const completionPercentage =
        totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

      return {
        ...item,
        isCompleted: completionPercentage === 100 && totalLessons > 0,
        completionPercentage,
        completedLessons,
        totalLessons
      };
    })
  );

  const totalItems = itemsWithProgress.length;
  const completedItems = itemsWithProgress.filter((i) => i.isCompleted).length;
  const pathCompletion = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  return {
    ...path,
    items: itemsWithProgress,
    pathCompletion,
    completedItems,
    totalItems
  };
}

/**
 * Updates progress on a specific learning path item (marks course as completed/incomplete).
 */
async function updateLearningPathItemProgress(userId, learningPathId, courseId, completed) {
  const path = await prisma.learningPath.findFirst({
    where: { id: learningPathId, userId }
  });

  if (!path) {
    throw serviceError(404, 'Learning path not found');
  }

  const item = await prisma.learningPathItem.findFirst({
    where: { learningPathId, courseId }
  });

  if (!item) {
    throw serviceError(404, 'Learning path item not found');
  }

  // Mark all lessons in the course as completed/incomplete
  const lessons = await prisma.lesson.findMany({
    where: { courseId },
    select: { id: true }
  });

  const now = new Date();

  await prisma.$transaction(
    lessons.map((lesson) =>
      prisma.lessonProgress.upsert({
        where: { userId_lessonId: { userId, lessonId: lesson.id } },
        create: {
          userId,
          lessonId: lesson.id,
          status: completed ? 'COMPLETED' : 'NOT_STARTED',
          progressPercentage: completed ? 100 : 0,
          completedAt: completed ? now : null
        },
        update: {
          status: completed ? 'COMPLETED' : 'NOT_STARTED',
          progressPercentage: completed ? 100 : 0,
          completedAt: completed ? now : null
        }
      })
    )
  );

  return { success: true, completed };
}

/**
 * Deletes/archives a learning path.
 */
async function deleteLearningPath(userId, learningPathId) {
  const path = await prisma.learningPath.findFirst({
    where: { id: learningPathId, userId }
  });

  if (!path) {
    throw serviceError(404, 'Learning path not found');
  }

  await prisma.learningPathItem.deleteMany({
    where: { learningPathId }
  });

  await prisma.learningPath.delete({
    where: { id: learningPathId }
  });

  return { id: learningPathId };
}

module.exports = {
  generatePersonalizedLearningPath,
  getUserLearningPath,
  updateLearningPathItemProgress,
  deleteLearningPath,
  getAvailableCourses,
  matchCoursesToGap,
  serviceError
};
