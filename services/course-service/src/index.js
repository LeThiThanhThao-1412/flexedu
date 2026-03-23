// services/course-service/src/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const courseController = require('./controllers/course.controller');
const validate = require('./middleware/validate');
const validators = require('./validators/course.validator');

const app = express();
const PORT = process.env.PORT || 3003;
const { authorize } = require('./middleware/auth.middleware');

// Middleware
app.use(cors());
app.use(express.json());

// ========== HEALTH CHECK ==========
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// ========== LESSON ROUTES (ĐẶT TRƯỚC CÁC ROUTE ĐỘNG) ==========
// Lấy chi tiết bài học (hỗ trợ bài học miễn phí)
app.get('/api/lessons/:lessonId', courseController.getLessonById);

// ========== COURSE ROUTES ==========
// Lấy khóa học của riêng giảng viên
app.get('/api/courses/my-courses', courseController.getMyCourses);

// Lấy danh sách khóa học (công khai)
app.get('/api/courses', courseController.getCourses);

// Tạo khóa học
app.post('/api/courses',
  authorize(['INSTRUCTOR', 'ADMIN']), 
  validate(validators.createCourseSchema),
  courseController.createCourse
);

// Lấy chi tiết khóa học (ROUTE ĐỘNG - ĐẶT SAU CÁC ROUTE CỤ THỂ)
app.get('/api/courses/:id', courseController.getCourseById);

// Cập nhật khóa học
app.put('/api/courses/:id',
  validate(validators.updateCourseSchema),
  courseController.updateCourse
);

// Xuất bản khóa học
app.patch('/api/courses/:id/publish', courseController.publishCourse);

// ========== MODULE ROUTES ==========
app.post('/api/courses/:courseId/modules',
  validate(validators.createModuleSchema),
  courseController.addModule
);

// ========== LESSON ROUTES (POST) ==========
app.post('/api/modules/:moduleId/lessons',
  validate(validators.createLessonSchema),
  courseController.addLesson
);

// ========== ENROLLMENT ROUTES ==========
app.post('/api/courses/:courseId/enroll', courseController.enrollCourse);
app.post('/api/progress', validate(validators.updateProgressSchema), courseController.updateProgress);

// Start server
app.listen(PORT, () => {
  console.log(`✅ Course Service running on port ${PORT}`);
});