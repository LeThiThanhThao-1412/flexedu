// frontend/src/services/course.service.js
import api from './api';

export const courseService = {
  getCourses: async (params = {}) => {
    const response = await api.get('/api/courses', { params });
    return response.data;
  },
  
  getCourseById: async (id) => {
    const response = await api.get(`/api/courses/${id}`);
    return response.data;
  },
  
  createCourse: async (data) => {
    const response = await api.post('/api/courses', data);
    return response.data;
  },
  
  updateCourse: async (id, data) => {
    const response = await api.put(`/api/courses/${id}`, data);
    return response.data;
  },
  
  publishCourse: async (id) => {
    const response = await api.patch(`/api/courses/${id}/publish`);
    return response.data;
  },
  
  getMyCourses: async (params = {}) => {
    const response = await api.get('/api/courses/my-courses', { params });
    return response.data;
  },
  
  addModule: async (courseId, data) => {
    const response = await api.post(`/api/courses/${courseId}/modules`, data);
    return response.data;
  },
  
  updateModule: async (moduleId, data) => {
    const response = await api.put(`/api/modules/${moduleId}`, data);
    return response.data;
  },
  
  deleteModule: async (moduleId) => {
    const response = await api.delete(`/api/modules/${moduleId}`);
    return response.data;
  },
  
  addLesson: async (moduleId, data) => {
    const response = await api.post(`/api/modules/${moduleId}/lessons`, data);
    return response.data;
  },
  
  updateLesson: async (lessonId, data) => {
    const response = await api.put(`/api/lessons/${lessonId}`, data);
    return response.data;
  },
  
  deleteLesson: async (lessonId) => {
    const response = await api.delete(`/api/lessons/${lessonId}`);
    return response.data;
  },
  
  enrollCourse: async (courseId) => {
    const response = await api.post(`/api/courses/${courseId}/enroll`);
    return response.data;
  },
  
  updateProgress: async (data) => {
    const response = await api.post('/api/progress', data);
    return response.data;
  },
  
  getMyEnrollments: async (params = {}) => {
    const response = await api.get('/api/enrollments/my-courses', { params });
    return response.data;
  },
  
  getProgress: async (courseId) => {
    const response = await api.get(`/api/enrollments/${courseId}/progress`);
    return response.data;
  },
  
  getPendingInstructors: async () => {
    const response = await api.get('/api/auth/pending-instructors');
    return response.data;
  },
  
  approveInstructor: async (instructorId) => {
    const response = await api.patch(`/api/auth/approve/${instructorId}`);
    return response.data;
  },

  // ========== ADMIN COURSE MANAGEMENT ==========
  adminGetCourses: async (params = {}) => {
    const response = await api.get('/api/admin/courses', { params });
    return response.data;
  },
  
  adminDeleteCourse: async (courseId) => {
    const response = await api.delete(`/api/admin/courses/${courseId}`);
    return response.data;
  },
  
  adminUpdateCourseStatus: async (courseId, data) => {
    const response = await api.patch(`/api/admin/courses/${courseId}/status`, data);
    return response.data;
  },
};