// services/course-service/src/controllers/course.controller.js
const { PrismaClient } = require('@prisma/client');
const slugify = require('slugify');
const redisClient = require('../config/redis');

const prisma = new PrismaClient();

class CourseController {
  // ========== COURSE CRUD ==========
  
  async createCourse(req, res) {
    try {
      const { title, description, price, level, categoryId, thumbnail } = req.body;
      const user = req.user;
      
      if (!user) {
        return res.status(401).json({ success: false, message: 'User not authenticated' });
      }
      
      if (user.role === 'INSTRUCTOR' && !user.isActive) {
        return res.status(403).json({
          success: false,
          message: 'Your instructor account is pending admin approval. You cannot create courses yet.'
        });
      }
      
      if (user.role !== 'INSTRUCTOR' && user.role !== 'ADMIN') {
        return res.status(403).json({ success: false, message: 'Only instructors can create courses' });
      }
      
      const instructorId = user.userId || user.id;
      const slug = slugify(title, { lower: true, strict: true });
      
      const existing = await prisma.course.findUnique({ where: { slug } });
      if (existing) {
        return res.status(400).json({ success: false, message: 'Course with similar title already exists' });
      }
      
      const course = await prisma.course.create({
        data: { title, slug, description, price, level, instructorId, categoryId, thumbnail, status: 'DRAFT' },
        include: { category: true }
      });
      
      await redisClient.del('courses:list');
      res.status(201).json({ success: true, message: 'Course created successfully', data: course });
    } catch (error) {
      console.error('Create course error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  async getCourses(req, res) {
    try {
      const { page = 1, limit = 10, status = 'PUBLISHED', category, level, search } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const where = { status: 'PUBLISHED' };
      if (category) where.categoryId = category;
      if (level) where.level = level;
      if (search) where.title = { contains: search, mode: 'insensitive' };
      
      const cacheKey = `courses:list:${page}:${limit}:${status}:${category || 'all'}:${level || 'all'}:${search || 'none'}`;
      let cachedData = await redisClient.get(cacheKey);
      if (cachedData) return res.json({ success: true, data: cachedData });
      
      const [courses, total] = await Promise.all([
        prisma.course.findMany({
          where, skip, take: parseInt(limit), orderBy: { createdAt: 'desc' },
          include: { category: true, _count: { select: { enrollments: true, reviews: true } } }
        }),
        prisma.course.count({ where })
      ]);
      
      const result = { courses, pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / parseInt(limit)) } };
      await redisClient.set(cacheKey, result, 300);
      res.json({ success: true, data: result });
    } catch (error) {
      console.error('Get courses error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  async getCourseById(req, res) {
    try {
      const { id } = req.params;
      const userId = req.headers['x-user-id'];
      const cacheKey = `course:${id}`;
      let course = await redisClient.get(cacheKey);
      
      if (!course) {
        course = await prisma.course.findUnique({
          where: { id },
          include: {
            category: true,
            modules: { include: { lessons: { orderBy: { order: 'asc' } } }, orderBy: { order: 'asc' } },
            _count: { select: { enrollments: true, reviews: true } }
          }
        });
        if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
        await redisClient.set(cacheKey, course, 300);
      }
      
      if (userId) {
        const enrollment = await prisma.enrollment.findUnique({ where: { userId_courseId: { userId, courseId: id } } });
        course = { ...course, isEnrolled: !!enrollment };
      } else {
        course = { ...course, isEnrolled: false };
      }
      res.json({ success: true, data: course });
    } catch (error) {
      console.error('Get course error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  async updateCourse(req, res) {
    try {
      const { id } = req.params;
      const instructorId = req.headers['x-user-id'];
      const updates = req.body;
      
      const course = await prisma.course.findUnique({ where: { id } });
      if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
      if (course.instructorId !== instructorId && req.headers['x-user-role'] !== 'ADMIN') {
        return res.status(403).json({ success: false, message: 'You do not have permission to update this course' });
      }
      
      if (updates.title && updates.title !== course.title) {
        updates.slug = slugify(updates.title, { lower: true, strict: true });
      }
      
      const updatedCourse = await prisma.course.update({ where: { id }, data: updates, include: { category: true } });
      await redisClient.del(`course:${id}`);
      await redisClient.del('courses:list:*');
      res.json({ success: true, message: 'Course updated successfully', data: updatedCourse });
    } catch (error) {
      console.error('Update course error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  async publishCourse(req, res) {
    try {
      const { id } = req.params;
      const instructorId = req.headers['x-user-id'];
      const course = await prisma.course.findUnique({ where: { id }, include: { _count: { select: { modules: true } } } });
      if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
      if (course.instructorId !== instructorId && req.headers['x-user-role'] !== 'ADMIN') {
        return res.status(403).json({ success: false, message: 'No permission' });
      }
      if (course._count.modules === 0) {
        return res.status(400).json({ success: false, message: 'Course must have at least one module to be published' });
      }
      const updatedCourse = await prisma.course.update({ where: { id }, data: { status: 'PUBLISHED' } });
      await redisClient.del('courses:list:*');
      await redisClient.del(`course:${id}`);
      res.json({ success: true, message: 'Course published successfully!', data: updatedCourse });
    } catch (error) {
      console.error('Publish course error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  async getMyCourses(req, res) {
    try {
      const instructorId = req.headers['x-user-id'];
      if (!instructorId) return res.status(400).json({ success: false, message: 'Missing instructorId in headers' });
      const { page = 1, limit = 10, status } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const where = { instructorId };
      if (status && status !== 'ALL') where.status = status;
      
      const courses = await prisma.course.findMany({
        where, skip, take: parseInt(limit), orderBy: { createdAt: 'desc' },
        include: { category: true, _count: { select: { enrollments: true, reviews: true } } }
      });
      const total = await prisma.course.count({ where });
      res.json({ success: true, data: { courses, pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / parseInt(limit)) } } });
    } catch (error) {
      console.error('Get my courses error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  // ========== MODULE MANAGEMENT ==========
  
  async addModule(req, res) {
    try {
      const { courseId } = req.params;
      const { title, description, order } = req.body;
      const module = await prisma.module.create({ data: { title, description, order, courseId } });
      await redisClient.del(`course:${courseId}`);
      res.status(201).json({ success: true, message: 'Module added successfully', data: module });
    } catch (error) {
      console.error('Add module error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  async updateModule(req, res) {
    try {
      const { moduleId } = req.params;
      const { title, description, order } = req.body;
      const instructorId = req.headers['x-user-id'];
      
      const module = await prisma.module.findUnique({ where: { id: moduleId }, include: { course: true } });
      if (!module) return res.status(404).json({ success: false, message: 'Module not found' });
      if (module.course.instructorId !== instructorId && req.headers['x-user-role'] !== 'ADMIN') {
        return res.status(403).json({ success: false, message: 'No permission' });
      }
      
      const updatedModule = await prisma.module.update({ where: { id: moduleId }, data: { title, description, order } });
      await redisClient.del(`course:${module.course.id}`);
      res.json({ success: true, data: updatedModule });
    } catch (error) {
      console.error('Update module error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  async deleteModule(req, res) {
    try {
      const { moduleId } = req.params;
      const instructorId = req.headers['x-user-id'];
      
      const module = await prisma.module.findUnique({ where: { id: moduleId }, include: { course: true } });
      if (!module) return res.status(404).json({ success: false, message: 'Module not found' });
      if (module.course.instructorId !== instructorId && req.headers['x-user-role'] !== 'ADMIN') {
        return res.status(403).json({ success: false, message: 'No permission' });
      }
      
      await prisma.lesson.deleteMany({ where: { moduleId } });
      await prisma.module.delete({ where: { id: moduleId } });
      await redisClient.del(`course:${module.course.id}`);
      res.json({ success: true, message: 'Module deleted successfully' });
    } catch (error) {
      console.error('Delete module error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  // ========== LESSON MANAGEMENT ==========
  
  async addLesson(req, res) {
    try {
      const { moduleId } = req.params;
      const { title, description, type, content, duration, order, isFree } = req.body;
      const lesson = await prisma.lesson.create({
        data: { title, description, type, content, duration, order, isFree, moduleId },
        include: { module: { include: { course: true } } }
      });
      await redisClient.del(`course:${lesson.module.course.id}`);
      res.status(201).json({ success: true, message: 'Lesson added successfully', data: lesson });
    } catch (error) {
      console.error('Add lesson error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  async updateLesson(req, res) {
    try {
      const { lessonId } = req.params;
      const { title, description, type, content, duration, order, isFree } = req.body;
      const instructorId = req.headers['x-user-id'];
      
      const lesson = await prisma.lesson.findUnique({
        where: { id: lessonId },
        include: { module: { include: { course: true } } }
      });
      if (!lesson) return res.status(404).json({ success: false, message: 'Lesson not found' });
      if (lesson.module.course.instructorId !== instructorId && req.headers['x-user-role'] !== 'ADMIN') {
        return res.status(403).json({ success: false, message: 'No permission' });
      }
      
      const updatedLesson = await prisma.lesson.update({ where: { id: lessonId }, data: { title, description, type, content, duration, order, isFree } });
      await redisClient.del(`course:${lesson.module.course.id}`);
      res.json({ success: true, data: updatedLesson });
    } catch (error) {
      console.error('Update lesson error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  async deleteLesson(req, res) {
    try {
      const { lessonId } = req.params;
      const instructorId = req.headers['x-user-id'];
      
      const lesson = await prisma.lesson.findUnique({
        where: { id: lessonId },
        include: { module: { include: { course: true } } }
      });
      if (!lesson) return res.status(404).json({ success: false, message: 'Lesson not found' });
      if (lesson.module.course.instructorId !== instructorId && req.headers['x-user-role'] !== 'ADMIN') {
        return res.status(403).json({ success: false, message: 'No permission' });
      }
      
      await prisma.lesson.delete({ where: { id: lessonId } });
      await redisClient.del(`course:${lesson.module.course.id}`);
      res.json({ success: true, message: 'Lesson deleted successfully' });
    } catch (error) {
      console.error('Delete lesson error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  async getLessonById(req, res) {
    try {
      const { lessonId } = req.params;
      const userId = req.headers['x-user-id'];
      
      if (!lessonId || lessonId.length !== 24) {
        return res.status(400).json({ success: false, message: 'Invalid lesson ID' });
      }
      
      const lesson = await prisma.lesson.findUnique({
        where: { id: lessonId },
        include: { module: { include: { course: true } } }
      });
      
      if (!lesson) return res.status(404).json({ success: false, message: 'Lesson not found' });
      
      if (lesson.isFree) {
        return res.json({ success: true, data: lesson, isFree: true });
      }
      
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Please login to access this lesson' });
      }
      
      const enrollment = await prisma.enrollment.findUnique({
        where: { userId_courseId: { userId, courseId: lesson.module.course.id } }
      });
      
      if (!enrollment) {
        return res.status(403).json({
          success: false,
          message: 'Bạn cần đăng ký khóa học để xem bài học này',
          courseInfo: {
            id: lesson.module.course.id,
            title: lesson.module.course.title,
            price: lesson.module.course.price,
            thumbnail: lesson.module.course.thumbnail
          }
        });
      }
      
      res.json({ success: true, data: lesson, isFree: false });
    } catch (error) {
      console.error('Get lesson error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  // ========== ENROLLMENT & PROGRESS ==========
  
  async enrollCourse(req, res) {
    try {
      const { courseId } = req.params;
      const userId = req.headers['x-user-id'];
      
      const existing = await prisma.enrollment.findUnique({ where: { userId_courseId: { userId, courseId } } });
      if (existing) return res.status(400).json({ success: false, message: 'Already enrolled in this course' });
      
      const enrollment = await prisma.enrollment.create({ data: { userId, courseId, progress: 0 } });
      await prisma.course.update({ where: { id: courseId }, data: { totalStudents: { increment: 1 } } });
      await redisClient.del(`course:${courseId}`);
      res.status(201).json({ success: true, message: 'Enrolled successfully', data: enrollment });
    } catch (error) {
      console.error('Enroll error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  async updateProgress(req, res) {
    try {
      const { lessonId, completed, lessonIds, totalLessons } = req.body;
      const userId = req.headers['x-user-id'];
      
      const progress = await prisma.lessonProgress.upsert({
        where: { userId_lessonId: { userId, lessonId } },
        update: { completed, completedAt: completed ? new Date() : null },
        create: { userId, lessonId, completed, completedAt: completed ? new Date() : null }
      });
      
      const lesson = await prisma.lesson.findUnique({
        where: { id: lessonId },
        include: { module: { include: { course: true } } }
      });
      
      if (totalLessons && lessonIds) {
        const completedLessonsCount = await prisma.lessonProgress.count({
          where: { userId, completed: true, lessonId: { in: lessonIds } }
        });
        const progressPercent = totalLessons > 0 ? (completedLessonsCount / totalLessons) * 100 : 0;
        
        await prisma.enrollment.update({
          where: { userId_courseId: { userId, courseId: lesson.module.course.id } },
          data: { progress: progressPercent, completedAt: progressPercent === 100 ? new Date() : null }
        });
        
        await redisClient.del(`progress:${userId}:${lesson.module.course.id}`);
      }
      
      res.json({ success: true, message: 'Progress updated', data: { progress: progress?.completed || false } });
    } catch (error) {
      console.error('Update progress error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }
}

module.exports = new CourseController();