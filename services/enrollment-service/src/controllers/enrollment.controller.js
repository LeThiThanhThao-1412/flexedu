// services/enrollment-service/src/controllers/enrollment.controller.js
const { PrismaClient } = require('@prisma/client');
const redisClient = require('../config/redis');
const axios = require('axios');
const prisma = new PrismaClient();

class EnrollmentController {
  // Đăng ký khóa học
  async enroll(req, res) {
    try {
      const { courseId } = req.params;
      const userId = req.headers['x-user-id'];

      if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      // Kiểm tra đã đăng ký chưa
      const existing = await prisma.enrollment.findUnique({
        where: {
          userId_courseId: { userId, courseId }
        }
      });

      if (existing) {
        return res.status(400).json({ 
          success: false, 
          message: 'Already enrolled' 
        });
      }

      // Tạo enrollment
      const enrollment = await prisma.enrollment.create({
        data: { userId, courseId, progress: 0 }
      });

      // Xóa cache khi có đăng ký mới
      await redisClient.del(`enrollments:${userId}`);
      await redisClient.del(`progress:${userId}:${courseId}`);

      res.status(201).json({
        success: true,
        data: enrollment
      });
    } catch (error) {
      console.error('Enroll error:', error);
      res.status(500).json({ success: false, message: 'Internal error' });
    }
  }

  // Lấy danh sách khóa học đã đăng ký
  // services/enrollment-service/src/controllers/enrollment.controller.js

// services/enrollment-service/src/controllers/enrollment.controller.js

async getMyCourses(req, res) {
  try {
    const userId = req.headers['x-user-id'];
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // 1. Kiểm tra Cache Redis (Giữ nguyên)
    const cacheKey = `enrollments:${userId}:${page}:${limit}`;
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) return res.json({ success: true, data: JSON.parse(cachedData) });

    // 2. Lấy danh sách Enrollment từ DB (Không dùng include)
    const enrollments = await prisma.enrollment.findMany({
      where: { userId },
      skip,
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' }
    });

    // 3. GỌI API SANG COURSE-SERVICE ĐỂ LẤY THÔNG TIN CHI TIẾT
    // Chúng ta dùng Promise.all để gọi nhiều request cùng lúc cho nhanh
    const formattedEnrollments = await Promise.all(
      enrollments.map(async (en) => {
        try {
          // URL này trỏ đến course-service bên trong mạng Docker
          const courseResponse = await axios.get(
            `http://course-service:3003/api/courses/${en.courseId}`
          );
          
          return {
            ...en,
            course: courseResponse.data.data // Lấy title, thumbnail thật từ course-service
          };
        } catch (err) {
          // Nếu course-service lỗi hoặc không tìm thấy, trả về fallback
          return {
            ...en,
            course: { title: "Khóa học không tồn tại hoặc chưa Publish", thumbnail: null }
          };
        }
      })
    );

    const total = await prisma.enrollment.count({ where: { userId } });
    const result = {
      enrollments: formattedEnrollments,
      pagination: { page: parseInt(page), limit: parseInt(limit), total }
    };

    await redisClient.set(cacheKey, JSON.stringify(result), 300);
    res.json({ success: true, data: result });

  } catch (error) {
    console.error('Get my courses error:', error);
    res.status(500).json({ success: false, message: "Internal error" });
  }
}
  // Cập nhật tiến độ bài học
  async updateLessonProgress(req, res) {
    try {
      const { lessonId, completed, totalLessons, lessonIds } = req.body;
      const userId = req.headers['x-user-id'];
      const courseId = req.params.courseId;

      // Cập nhật lesson progress
      const progress = await prisma.lessonProgress.upsert({
        where: { userId_lessonId: { userId, lessonId } },
        update: { completed, completedAt: completed ? new Date() : null },
        create: { userId, lessonId, completed, completedAt: completed ? new Date() : null }
      });

      if (totalLessons) {
        const completedCount = await prisma.lessonProgress.count({
          where: { userId, completed: true, lessonId: { in: lessonIds || [] } }
        });
        
        const progressPercent = (completedCount / totalLessons) * 100;
        
        await prisma.enrollment.update({
          where: { userId_courseId: { userId, courseId } },
          data: { 
            progress: progressPercent,
            completedAt: progressPercent === 100 ? new Date() : null
          }
        });

        // Cache progress summary dưới dạng chuỗi JSON
        await redisClient.set(`progress:${userId}:${courseId}`, JSON.stringify({ progressPercent }), {
          EX: 3600
        });
      }

      res.json({ success: true, data: progress });
    } catch (error) {
      console.error('Update progress error:', error);
      res.status(500).json({ success: false, message: 'Internal error' });
    }
  }

  // Lấy tiến độ học tập
  async getProgress(req, res) {
    try {
      const { courseId } = req.params;
      const userId = req.headers['x-user-id'];

      const cacheKey = `progress:${userId}:${courseId}`;
      let cachedProgress = await redisClient.get(cacheKey);

      if (cachedProgress) {
        // Parse từ JSON [Sửa lỗi 500]
        return res.json({ success: true, data: JSON.parse(cachedProgress) });
      }

      const enrollment = await prisma.enrollment.findUnique({
        where: { userId_courseId: { userId, courseId } },
        select: { progress: true, completedAt: true }
      });

      const progress = enrollment || { progress: 0, completedAt: null };
      
      // Lưu vào Redis dưới dạng JSON
      await redisClient.set(cacheKey, JSON.stringify(progress), {
        EX: 3600
      });

      res.json({ success: true, data: progress });
    } catch (error) {
      console.error('Get progress error:', error);
      res.status(500).json({ success: false, message: 'Internal error' });
    }
  }
}

module.exports = new EnrollmentController();