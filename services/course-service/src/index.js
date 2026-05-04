require('dotenv').config();
const express = require('express');
const cors = require('cors');
const courseController = require('./controllers/course.controller');
const validate = require('./middleware/validate');
const validators = require('./validators/course.validator');

const app = express();
const PORT = process.env.PORT || 3003;
const { authorize } = require('./middleware/auth.middleware');

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// ========== ADMIN COURSE ROUTES (đặt trước để tránh conflict) ==========
app.get('/api/admin/courses', authorize(['ADMIN']), courseController.adminGetAllCourses);
app.delete('/api/admin/courses/:id', authorize(['ADMIN']), courseController.adminDeleteCourse);
app.patch('/api/admin/courses/:id/status', authorize(['ADMIN']), courseController.adminUpdateCourseStatus);

// ========== LESSON ROUTES ==========
app.get('/api/lessons/:lessonId', courseController.getLessonById);

// ========== COURSE ROUTES ==========
app.get('/api/courses/my-courses', courseController.getMyCourses);
app.get('/api/courses', courseController.getCourses);
app.post('/api/courses', authorize(['INSTRUCTOR', 'ADMIN']), validate(validators.createCourseSchema), courseController.createCourse);
app.get('/api/courses/:id', courseController.getCourseById);
app.put('/api/courses/:id', validate(validators.updateCourseSchema), courseController.updateCourse);
app.patch('/api/courses/:id/publish', courseController.publishCourse);

// ========== MODULE ROUTES ==========
app.post('/api/courses/:courseId/modules', validate(validators.createModuleSchema), courseController.addModule);
app.put('/api/modules/:moduleId', authorize(['INSTRUCTOR', 'ADMIN']), validate(validators.createModuleSchema), courseController.updateModule);
app.delete('/api/modules/:moduleId', authorize(['INSTRUCTOR', 'ADMIN']), courseController.deleteModule);

// ========== LESSON ROUTES ==========
app.post('/api/modules/:moduleId/lessons', validate(validators.createLessonSchema), courseController.addLesson);
app.put('/api/lessons/:lessonId', authorize(['INSTRUCTOR', 'ADMIN']), validate(validators.createLessonSchema), courseController.updateLesson);
app.delete('/api/lessons/:lessonId', authorize(['INSTRUCTOR', 'ADMIN']), courseController.deleteLesson);

// ========== ENROLLMENT ROUTES ==========
app.post('/api/courses/:courseId/enroll', courseController.enrollCourse);
app.post('/api/progress', validate(validators.updateProgressSchema), courseController.updateProgress);
app.get('/api/enrollments/my-courses', courseController.getMyEnrollments);

app.listen(PORT, () => {
  console.log(`✅ Course Service running on port ${PORT}`);
});