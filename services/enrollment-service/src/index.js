// services/enrollment-service/src/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const enrollmentController = require('./controllers/enrollment.controller');

const app = express();
const PORT = process.env.PORT || 3004;

app.use(cors());
app.use(express.json());

// Routes
app.post('/api/enrollments/:courseId', enrollmentController.enroll);
app.get('/api/enrollments/my-courses', enrollmentController.getMyCourses);
app.put('/api/enrollments/:courseId/progress', enrollmentController.updateLessonProgress);
app.get('/api/enrollments/:courseId/progress', enrollmentController.getProgress);

app.get('/health', (req, res) => res.json({ status: 'healthy' }));

app.listen(PORT, () => console.log(`✅ Enrollment Service on port ${PORT}`));