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
 * Classifies a score into a proficiency level.
 */
function classifyLevel(score) {
  if (score >= 80) return { level: 'EXPERT', strength: 'strong' };
  if (score >= 60) return { level: 'ADVANCED', strength: 'strong' };
  if (score >= 40) return { level: 'INTERMEDIATE', strength: 'moderate' };
  return { level: 'BEGINNER', strength: 'weak' };
}

/**
 * Analyzes a student's assessment attempt responses and existing userSkill
 * records to compute skill gaps.
 *
 * Returns an object with:
 *  - strengths: skills scoring >= 60
 *  - weaknesses: skills scoring 40-59
 *  - missing: skills not yet assessed or scoring < 40
 *  - gaps: computed gap details per skill
 *  - overallScore: average score across assessed skills
 */
async function analyzeSkillGaps(userId, attemptId) {
  // Fetch the attempt with responses and question details
  const attempt = await prisma.assessmentAttempt.findUnique({
    where: { id: attemptId },
    include: {
      responses: {
        include: {
          question: { select: { id: true, questionText: true, type: true, points: true } }
        }
      },
      assessment: { select: { id: true, title: true, type: true } }
    }
  });

  if (!attempt) {
    throw error(404, 'Assessment attempt not found');
  }

  // Verify ownership
  if (attempt.userId !== userId) {
    throw error(403, 'Access denied: this attempt does not belong to you');
  }

  if (attempt.status !== 'EVALUATED') {
    throw error(400, 'Assessment attempt has not been evaluated yet');
  }

  // Fetch all user skills for context
  const userSkills = await prisma.userSkill.findMany({
    where: { userId },
    include: { skill: { select: { id: true, name: true, category: true } } }
  });

  const skillMap = new Map();
  userSkills.forEach((us) => {
    skillMap.set(us.skillId, {
      id: us.skillId,
      name: us.skill.name,
      category: us.skill.category,
      score: us.score,
      level: us.level
    });
  });

  // Aggregate per-skill scores from question responses
  // We use question text/keywords to map responses to skills (simple keyword matching)
  const skillScores = new Map();

  for (const response of attempt.responses) {
    const q = response.question;
    const score = response.pointsAwarded || 0;
    const maxPoints = q.points || 0;

    // Determine skill from question text using keyword heuristics
    const skillName = inferSkillFromQuestion(q.questionText || '');
    let skillEntry = skillMap.get(skillName);

    if (!skillEntry) {
      skillEntry = {
        id: null,
        name: skillName,
        category: 'General',
        score: 0,
        level: 'BEGINNER'
      };
      skillMap.set(skillName, skillEntry);
    }

    if (!skillScores.has(skillName)) {
      skillScores.set(skillName, { total: 0, earned: 0, count: 0 });
    }
    const entry = skillScores.get(skillName);
    entry.total += maxPoints;
    entry.earned += score;
    entry.count += 1;
  }

  // Compute final percentage per skill
  const skillResults = [];
  for (const [name, data] of skillScores.entries()) {
    const pct = data.total > 0 ? Math.round((data.earned / data.total) * 100) : 0;
    const classified = classifyLevel(pct);

    const existing = skillMap.get(name);
    skillResults.push({
      name,
      category: existing?.category || 'General',
      score: pct,
      level: classified.level,
      strength: classified.strength,
      isExisting: !!existing
    });
  }

  // Categorize
  const strengths = skillResults.filter((s) => s.strength === 'strong');
  const weaknesses = skillResults.filter((s) => s.strength === 'moderate');
  const missing = skillResults.filter((s) => s.strength === 'weak');

  const overallScore =
    skillResults.length > 0
      ? Math.round(
          skillResults.reduce((sum, s) => sum + s.score, 0) /
            skillResults.length
        )
      : 0;

  const gaps = skillResults.map((s) => ({
    skill: s.name,
    category: s.category,
    currentScore: s.score,
    level: s.level,
    gap: s.strength === 'weak' ? 100 - s.score : s.strength === 'moderate' ? 60 - s.score : 0,
    priority: s.strength === 'weak' ? 'high' : s.strength === 'moderate' ? 'medium' : 'low'
  }));

  return {
    attemptId,
    assessmentId: attempt.assessment.id,
    assessmentTitle: attempt.assessment.title,
    overallScore,
    strengths,
    weaknesses,
    missing,
    gaps,
    skillCount: skillResults.length,
    assessedAt: new Date()
  };
}

/**
 * Persists or updates a SkillGapAnalysis record for the given attempt.
 */
async function saveSkillGapAnalysis(userId, attemptId, analysis) {
  const existing = await prisma.skillGapAnalysis.findUnique({
    where: { attemptId }
  });

  const data = {
    userId,
    attemptId,
    strengths: analysis.strengths,
    weaknesses: analysis.weaknesses,
    recommendedTopics: analysis.gaps.map((g) => g.skill)
  };

  let result;
  if (existing) {
    result = await prisma.skillGapAnalysis.update({
      where: { attemptId },
      data
    });
  } else {
    result = await prisma.skillGapAnalysis.create({
      data
    });
  }

  return result;
}

/**
 * Gets the latest skill gap analysis for a user.
 */
async function getLatestSkillGapAnalysis(userId) {
  return prisma.skillGapAnalysis.findFirst({
    where: { userId },
    include: {
      attempt: {
        select: { id: true, assessmentId: true, score: true, submittedAt: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
}

function inferSkillFromQuestion(questionText) {
  const q = questionText.toLowerCase();

  const skillKeywords = {
    JavaScript: ['javascript', 'js', 'variable', 'function', 'dom', 'es6', 'arrow', 'callback', 'promise'],
    React: ['react', 'jsx', 'component', 'hook', 'useState', 'useEffect', 'props', 'state'],
    'Node.js': ['node.js', 'nodejs', 'backend', 'server', 'express', 'api', 'npm'],
    Python: ['python', 'django', 'flask', 'pip', 'numpy', 'pandas'],
    'SQL & Databases': ['sql', 'database', 'query', 'table', 'join', 'postgresql', 'mysql'],
    'HTML & CSS': ['html', 'css', 'stylesheet', 'layout', 'responsive', 'dom'],
    'TypeScript': ['typescript', 'ts', 'interface', 'type', 'generic'],
    'Git & Version Control': ['git', 'github', 'commit', 'merge', 'branch', 'version'],
    'Testing & QA': ['test', 'jest', 'testing', 'qa', 'unit test', 'integration'],
    'Deployment & DevOps': ['deploy', 'docker', 'kubernetes', 'ci/cd', 'aws', 'cloud'],
    'UI/UX Design': ['ui', 'ux', 'design', 'figma', 'wireframe', 'prototype'],
    'Cybersecurity': ['security', 'encryption', 'authentication', 'oauth', 'jwt', 'vulnerability'],
    'Data Structures & Algorithms': ['algorithm', 'data structure', 'sorting', 'searching', 'complexity', 'big o'],
    'Cloud Computing': ['cloud', 'aws', 'azure', 'gcp', 'serverless', 'lambda'],
    'Mobile Development': ['mobile', 'android', 'ios', 'flutter', 'react native', 'swift'],
    'Database Design': ['database design', 'schema', 'normalization', 'relational', 'nosql']
  };

  for (const [skill, keywords] of Object.entries(skillKeywords)) {
    if (keywords.some((kw) => q.includes(kw))) {
      return skill;
    }
  }

  return 'General IT';
}

module.exports = {
  analyzeSkillGaps,
  saveSkillGapAnalysis,
  getLatestSkillGapAnalysis,
  classifyLevel,
  error
};
