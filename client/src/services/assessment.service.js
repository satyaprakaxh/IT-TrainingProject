import api from './api';

/**
 * Assessment Service
 * Wraps all assessment-related API calls for the frontend.
 */
export const assessmentService = {
  /**
   * List assessments with optional pagination/search/filter.
   */
  getAssessments: async (params = {}) => {
    const response = await api.get('/assessments', { params });
    return response.data;
  },

  /**
   * Get a single assessment by ID (questions without correct answers).
   */
  getAssessment: async (id) => {
    const response = await api.get(`/assessments/${id}`);
    return response.data;
  },

  /**
   * Get questions for an assessment (correct answers hidden).
   */
  getQuestions: async (id) => {
    const response = await api.get(`/assessments/${id}/questions`);
    return response.data;
  },

  /**
   * Submit assessment answers.
   */
  submitAssessment: async (id, answers) => {
    const response = await api.post(`/assessments/${id}/submit`, {
      answers
    });
    return response.data;
  },

  /**
   * Get assessment attempt history for the logged-in user.
   */
  getAttempts: async (id) => {
    const response = await api.get(`/assessments/${id}/attempts`);
    return response.data;
  },

  /**
   * Get a single attempt with full responses (after submission).
   */
  getAttempt: async (attemptId) => {
    const response = await api.get(`/assessments/attempts/${attemptId}`);
    return response.data;
  }
};
