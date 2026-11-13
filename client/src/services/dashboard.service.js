
import api from './api';

export const dashboardService = {
  getStats: async () => {
    const response = await api.get('/dashboard/stats');
    return response.data;
  },

  getSkillMap: async () => {
    const response = await api.get('/dashboard/skill-map');
    return response.data;
  },

  completeLesson: async (lessonId) => {
    const response = await api.post(
      `/dashboard/lessons/${lessonId}/complete`
    );
    return response.data;
  },

  chatWithAI: async (question) => {
    const response = await api.post('/ai/chat', {
      question,
    });
    return response.data;
  }
};
