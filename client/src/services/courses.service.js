
import api from "./api";

export const coursesService = {
  // Get all available courses
  getCourses: async () => {
    const response = await api.get("/courses", {
      params: {
        page: 1,
        limit: 100,
      },
    });

    return response.data;
  },

  // Get course progress
  getCourseProgress: async (courseId) => {
    const response = await api.get(
      `/courses/${courseId}/progress`
    );

    return response.data;
  },

  // Enroll in a course
  enrollCourse: async (courseId) => {
    const response = await api.post(
      `/courses/${courseId}/enroll`
    );

    return response.data;
  },

  // Get course lessons
  getCourseLessons: async (courseId) => {
    const response = await api.get(
      `/courses/${courseId}/lessons`
    );

    return response.data;
  },
};

export default coursesService;
