
import api from './api';

export const coursesService = {
  // Fetch all published courses
  getCourses: async () => {
    const response = await api.get('/courses');
    return response.data;
  },

  // Enroll in a course
  enrollCourse: async (courseId) => {
    const response = await api.post(`/courses/${courseId}/enroll`);
    return response.data;
  }
};
