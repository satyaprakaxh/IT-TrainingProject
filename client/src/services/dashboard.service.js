import api from './api';

export const dashboardService = {
  // Fetch dashboard statistics
  getStats: async () => {
    const response = await api.get('/dashboard/stats');
    return response.data;
  },

  // Complete a lesson and earn XP
  completeLesson: async (lessonId) => {
    const response = await api.post(
      `/dashboard/lessons/${lessonId}/complete`
    );
    return response.data;
  }
};