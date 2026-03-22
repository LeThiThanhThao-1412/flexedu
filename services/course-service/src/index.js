// services/course-service/src/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const courseController = require('./controllers/course.controller');
const validate = require('./middleware/validate');
const validators = require('./validators/course.validator');

const app = express();
const PORT = process.env.PORT || 3003;
const { authorize } = require('./middleware/auth.middleware'); // 👈 Thêm dòng này
// Middleware
app.use(cors());
app.use(express.json());

// ========== COURSE ROUTES ==========
app.get('/api/courses/my-courses', courseController.getMyCourses);
app.post('/api/courses',
  authorize(['INSTRUCTOR', 'ADMIN']), 
  validate(validators.createCourseSchema),
  courseController.createCourse
);

app.get('/api/courses',
  courseController.getCourses
);

app.get('/api/courses/:id',
  courseController.getCourseById
);

app.put('/api/courses/:id',
  validate(validators.updateCourseSchema),
  courseController.updateCourse
);
// Thay dòng patch thành:
app.patch('/api/courses/:id/publish', courseController.publishCourse);

// ========== MODULE ROUTES ==========
app.post('/api/courses/:courseId/modules',
  validate(validators.createModuleSchema),
  courseController.addModule
);

// ========== LESSON ROUTES ==========
app.post('/api/modules/:moduleId/lessons',
  validate(validators.createLessonSchema),
  courseController.addLesson
);

// ========== ENROLLMENT ROUTES ==========
app.post('/api/courses/:courseId/enroll',
  courseController.enrollCourse
);

app.post('/api/progress',
  validate(validators.updateProgressSchema),
  courseController.updateProgress
);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});


// Start server
app.listen(PORT, () => {
  console.log(`✅ Course Service running on port ${PORT}`);
});