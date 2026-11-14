import api from './api';

/**
 * Learning Path Service
 * Wraps all learning path, skill gap, and course generation API calls.
 */
export const learningPathService = {
  /**
   * Generate skill gap analysis from a specific assessment attempt.
   */
  analyzeSkillGap: async (attemptId) => {
    const response = await api.post('/skill-gap/analyze', { attemptId });
    return response.data;
  },

  /**
   * Get the latest skill gap analysis for the logged-in user.
   */
  getLatestSkillGap: async () => {
    const response = await api.get('/skill-gap/latest');
    return response.data;
  },

  /**
   * Generate a personalized course for a specific skill gap.
   */
  generateCourse: async (skillGap) => {
    const response = await api.post('/course-generator/generate', skillGap);
    return response.data;
  },

  /**
   * Generate courses for all high/medium priority skill gaps.
   */
  generateCoursesFromGaps: async (skillGaps) => {
    const response = await api.post(
      '/course-generator/generate-from-gaps',
      { skillGaps }
    );
    return response.data;
  },

  /**
   * Generate a personalized learning path based on latest skill gap analysis.
   */
  generateLearningPath: async () => {
    const response = await api.post('/learning-path/generate');
    return response.data;
  },

  /**
   * Get the logged-in user's active learning path.
   */
  getLearningPath: async () => {
    const response = await api.get('/learning-path');
    return response.data;
  },

  /**
   * Regenerate the learning path (deactivates current, creates new).
   */
  regenerateLearningPath: async () => {
    const response = await api.post('/learning-path/regenerate');
    return response.data;
  },

  /**
   * Update progress on a learning path item (mark course complete/incomplete).
   */
  updateItemProgress: async (pathId, courseId, completed) => {
    const response = await api.post(
      `/learning-path/${pathId}/items/${courseId}/progress`,
      { completed }
    );
    return response.data;
  },

  /**
   * Delete/archive a learning path.
   */
  deleteLearningPath: async (pathId) => {
    const response = await api.delete(`/learning-path/${pathId}`);
    return response.data;
  }
};
