// frontend/src/services/course.service.js
import api from './api';

export const courseService = {
  // Lấy danh sách khóa học
  getCourses: async (params = {}) => {
    const response = await api.get('/api/courses', { params });
    return response.data;
  },
  
  // Lấy chi tiết khóa học
  getCourseById: async (id) => {
    const response = await api.get(`/api/courses/${id}`);
    return response.data;
  },
  
  // Tạo khóa học - KHÔNG CẦN TOKEN, x-user-id tự thêm
  createCourse: async (data) => {
    const response = await api.post('/api/courses', data);
    return response.data;
  },
  
  // Cập nhật khóa học
  updateCourse: async (id, data) => {
    const response = await api.put(`/api/courses/${id}`, data);
    return response.data;
  },
  
  // Xuất bản khóa học
  publishCourse: async (id) => {
    const response = await api.patch(`/api/courses/${id}/publish`);
    return response.data;
  },
  
  // Thêm module
  addModule: async (courseId, data) => {
    const response = await api.post(`/api/courses/${courseId}/modules`, data);
    return response.data;
  },
  
  // Thêm lesson
  addLesson: async (moduleId, data) => {
    const response = await api.post(`/api/modules/${moduleId}/lessons`, data);
    return response.data;
  },
  
  // Đăng ký khóa học
  enrollCourse: async (courseId) => {
    const response = await api.post(`/api/courses/${courseId}/enroll`);
    return response.data;
  },
  
  // Cập nhật tiến độ
  updateProgress: async (data) => {
    const response = await api.post('/api/progress', data);
    return response.data;
  },
  
  // Lấy khóa học đã đăng ký
  getMyEnrollments: async (params = {}) => {
    const response = await api.get('/api/enrollments/my-courses', { params });
    return response.data;
  },
  
  // Lấy tiến độ
  getProgress: async (courseId) => {
    const response = await api.get(`/api/enrollments/${courseId}/progress`);
    return response.data;
  },
  // Lấy danh sách giảng viên chờ duyệt (admin)
getPendingInstructors: async () => {
  const response = await api.get('/api/auth/pending-instructors');
  return response.data;
},

  // Lấy khóa học của giảng viên
  getInstructorCourses: async () => {
    const response = await api.get('/api/courses?status=ALL');
    return response.data;
  },
  createCourse: async (data) => {
  console.log('📤 Sending to backend:', data);
  const response = await api.post('/api/courses', data);
  console.log('📥 Backend response:', response.data);
  return response.data;
},


approveInstructor: async (instructorId) => {
  const response = await api.patch(`/api/auth/approve/${instructorId}`);
  return response.data;
},
getMyCourses: async (params = {}) => {
    const response = await api.get('/api/courses/my-courses', { params });
    return response.data;
  },
  
  // Hoặc sửa lại getInstructorCourses để gọi API đúng
  getInstructorCourses: async () => {
    const response = await api.get('/api/courses/my-courses?status=ALL');
    return response.data;
  },
};