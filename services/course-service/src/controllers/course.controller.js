// services/course-service/src/controllers/course.controller.js
const { PrismaClient } = require('@prisma/client');
const slugify = require('slugify');
const redisClient = require('../config/redis');

const prisma = new PrismaClient();

class CourseController {
  // ========== COURSE CRUD ==========
  
  // services/course-service/src/controllers/course.controller.js
// Sửa method createCourse

async createCourse(req, res) {
  try {
    const { title, description, price, level, categoryId, thumbnail } = req.body;
    
    // Lấy user từ middleware
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }
    
    // 🔥 KIỂM TRA: Giảng viên phải được duyệt
    if (user.role === 'INSTRUCTOR' && !user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your instructor account is pending admin approval. You cannot create courses yet.'
      });
    }
    
    // Instructor phải có role INSTRUCTOR hoặc ADMIN
    if (user.role !== 'INSTRUCTOR' && user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Only instructors can create courses'
      });
    }
    
    const instructorId = user.userId || user.id;
    
    console.log('Creating course for instructor:', instructorId, 'Role:', user.role, 'Active:', user.isActive);
    
    // Tạo slug từ title
    const slug = slugify(title, { lower: true, strict: true });
    
    // Kiểm tra slug đã tồn tại
    const existing = await prisma.course.findUnique({
      where: { slug }
    });
    
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Course with similar title already exists'
      });
    }
    
    // Tạo khóa học
    const course = await prisma.course.create({
      data: {
        title,
        slug,
        description,
        price,
        level,
        instructorId,
        categoryId,
        thumbnail,
        status: 'DRAFT'
      },
      include: {
        category: true
      }
    });
    
    // Xóa cache
    await redisClient.del('courses:list');
    
    res.status(201).json({
      success: true,
      message: 'Course created successfully',
      data: course
    });
  } catch (error) {
    console.error('Create course error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}

  // Lấy danh sách khóa học (có phân trang, filter)
  // services/course-service/src/controllers/course.controller.js

// services/course-service/src/controllers/course.controller.js
// Sửa getCourses để chỉ hiện khóa học của giảng viên đã duyệt

async getCourses(req, res) {
  try {
    const { page = 1, limit = 10, status = 'PUBLISHED', category, level, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Xây dựng filter
    const where = { status: 'PUBLISHED' };
    
    // 🔥 CHỈ HIỆN KHÓA HỌC CỦA GIẢNG VIÊN ĐÃ DUYỆT
    // Lấy danh sách instructor đã duyệt
    // Cách 1: Join với user service (phức tạp)
    // Cách 2: Thêm field instructorIsActive vào course? (cần sync)
    
    // Tạm thời: chỉ hiện khóa học PUBLISHED
    // Khóa học của giảng viên chưa duyệt sẽ không được publish
    
    if (category) {
      where.categoryId = category;
    }
    
    if (level) {
      where.level = level;
    }
    
    if (search) {
      where.title = { contains: search, mode: 'insensitive' };
    }
    
    const cacheKey = `courses:list:${page}:${limit}:${status}:${category || 'all'}:${level || 'all'}:${search || 'none'}`;
    let cachedData = await redisClient.get(cacheKey);
    
    if (cachedData) {
      return res.json({
        success: true,
        data: cachedData
      });
    }
    
    const [courses, total] = await Promise.all([
      prisma.course.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          category: true,
          _count: {
            select: { enrollments: true, reviews: true }
          }
        }
      }),
      prisma.course.count({ where })
    ]);
    
    const result = {
      courses,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    };
    
    await redisClient.set(cacheKey, result, 300);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}
  // Lấy chi tiết khóa học
  async getCourseById(req, res) {
  try {
    const { id } = req.params;
    const userId = req.headers['x-user-id'];

    // Thử lấy dữ liệu cơ bản của khóa học từ cache
    const cacheKey = `course:${id}`;
    let course = await redisClient.get(cacheKey);

    if (!course) {
      course = await prisma.course.findUnique({
        where: { id },
        include: {
          category: true,
          modules: {
            include: {
              lessons: { orderBy: { order: 'asc' } }
            },
            orderBy: { order: 'asc' }
          },
          _count: {
            select: { enrollments: true, reviews: true }
          }
        }
      });

      if (!course) {
        return res.status(404).json({ success: false, message: 'Course not found' });
      }

      // Lưu vào cache dữ liệu thô của khóa học
      await redisClient.set(cacheKey, course, 300);
    }

    // Logic kiểm tra đăng ký (isEnrolled) phải chạy real-time, không nên cache chung
    if (userId) {
      const enrollment = await prisma.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId: userId,
            courseId: id
          }
        }
      });
      // Tạo một bản sao để tránh làm thay đổi object gốc trong một số trường hợp cache
      course = { ...course, isEnrolled: !!enrollment };
    } else {
      course = { ...course, isEnrolled: false };
    }

    res.json({
      success: true,
      data: course
    });
  } catch (error) {
    console.error('Get course error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}
  // Cập nhật khóa học
  async updateCourse(req, res) {
    try {
      const { id } = req.params;
      const instructorId = req.headers['x-user-id'];
      const updates = req.body;

      // Kiểm tra quyền
      const course = await prisma.course.findUnique({
        where: { id }
      });

      if (!course) {
        return res.status(404).json({
          success: false,
          message: 'Course not found'
        });
      }

      if (course.instructorId !== instructorId && req.headers['x-user-role'] !== 'ADMIN') {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to update this course'
        });
      }

      // Cập nhật slug nếu title thay đổi
      if (updates.title && updates.title !== course.title) {
        updates.slug = slugify(updates.title, { lower: true, strict: true });
      }

      const updatedCourse = await prisma.course.update({
        where: { id },
        data: updates,
        include: { category: true }
      });

      // Xóa cache
      await redisClient.del(`course:${id}`);
      await redisClient.del('courses:list:*');

      res.json({
        success: true,
        message: 'Course updated successfully',
        data: updatedCourse
      });
    } catch (error) {
      console.error('Update course error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // ========== MODULE & LESSON MANAGEMENT ==========
  
  // Thêm module
  async addModule(req, res) {
    try {
      const { courseId } = req.params;
      const { title, description, order } = req.body;

      const module = await prisma.module.create({
        data: {
          title,
          description,
          order,
          courseId
        }
      });

      // Xóa cache
      await redisClient.del(`course:${courseId}`);

      res.status(201).json({
        success: true,
        message: 'Module added successfully',
        data: module
      });
    } catch (error) {
      console.error('Add module error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Thêm lesson
  async addLesson(req, res) {
    try {
      const { moduleId } = req.params;
      const { title, description, type, content, duration, order, isFree } = req.body;

      const lesson = await prisma.lesson.create({
        data: {
          title,
          description,
          type,
          content,
          duration,
          order,
          isFree,
          moduleId
        },
        include: {
          module: {
            include: { course: true }
          }
        }
      });

      // Xóa cache
      await redisClient.del(`course:${lesson.module.course.id}`);

      res.status(201).json({
        success: true,
        message: 'Lesson added successfully',
        data: lesson
      });
    } catch (error) {
      console.error('Add lesson error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // ========== ENROLLMENT & PROGRESS ==========
  
  // Đăng ký khóa học
  async enrollCourse(req, res) {
    try {
      const { courseId } = req.params;
      const userId = req.headers['x-user-id'];

      // Kiểm tra đã đăng ký chưa
      const existing = await prisma.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId,
            courseId
          }
        }
      });

      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'Already enrolled in this course'
        });
      }

      // Tạo enrollment
      const enrollment = await prisma.enrollment.create({
        data: {
          userId,
          courseId,
          progress: 0
        }
      });

      // Cập nhật số lượng học viên
      await prisma.course.update({
        where: { id: courseId },
        data: { totalStudents: { increment: 1 } }
      });

      // Xóa cache
      await redisClient.del(`course:${courseId}`);

      res.status(201).json({
        success: true,
        message: 'Enrolled successfully',
        data: enrollment
      });
    } catch (error) {
      console.error('Enroll error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Cập nhật tiến độ học tập
  async updateProgress(req, res) {
    try {
      const { lessonId } = req.body;
      const { completed } = req.body;
      const userId = req.headers['x-user-id'];

      // Cập nhật hoặc tạo progress
      const progress = await prisma.lessonProgress.upsert({
        where: {
          userId_lessonId: {
            userId,
            lessonId
          }
        },
        update: {
          completed,
          completedAt: completed ? new Date() : null
        },
        create: {
          userId,
          lessonId,
          completed,
          completedAt: completed ? new Date() : null
        }
      });

      // Tính toán tiến độ tổng thể của khóa học
      const lesson = await prisma.lesson.findUnique({
        where: { id: lessonId },
        include: {
          module: {
            include: {
              course: true
            }
          }
        }
      });
      const lessonsInCourse = await prisma.lesson.findMany({
      where: {
        module: {
          courseId: lesson.module.course.id
        }
      },
      select: { id: true }
    });

    const lessonIds = lessonsInCourse.map(l => l.id);
    const totalLessons = lessonIds.length;

    // Đếm số lượng tiến độ đã hoàn thành trong danh sách ID trên
    const completedLessonsCount = await prisma.lessonProgress.count({
      where: {
        userId: userId,
        completed: true,
        lessonId: {
          in: lessonIds 
        }
      }
      });
      
      // Tính toán % (Thêm kiểm tra totalLessons > 0 để tránh lỗi chia cho 0)
    const progressPercent = totalLessons > 0 ? (completedLessonsCount / totalLessons) * 100 : 0;

    // ============================================================

    // 3. Cập nhật vào bảng Enrollment (Giữ nguyên đoạn này)
    await prisma.enrollment.update({
      where: {
        userId_courseId: {
          userId,
          courseId: lesson.module.course.id
        }
      },
      data: {
        progress: progressPercent,
        completedAt: progressPercent === 100 ? new Date() : null
      }
    });
      

    

      // Xóa cache
      await redisClient.del(`progress:${userId}:${lesson.module.course.id}`);

      res.json({
        success: true,
        message: 'Progress updated',
        data: { progress: progressPercent }
      });
    } catch (error) {
      console.error('Update progress error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
  // services/course-service/src/controllers/course.controller.js

// Hàm xuất bản khóa học
async publishCourse(req, res) {
  try {
    const { id } = req.params;
    const instructorId = req.headers['x-user-id'];

    // 1. Kiểm tra khóa học có tồn tại không
    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        _count: { select: { modules: true } }
      }
    });

    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    // 2. Kiểm tra quyền (Chỉ Instructor tạo khóa học hoặc Admin mới được publish)
    if (course.instructorId !== instructorId && req.headers['x-user-role'] !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'No permission' });
    }

    // 3. (Optional) Check điều kiện để được publish (ví dụ: phải có ít nhất 1 module)
    if (course._count.modules === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Course must have at least one module to be published' 
      });
    }

    // 4. Cập nhật trạng thái
    const updatedCourse = await prisma.course.update({
      where: { id },
      data: { status: 'PUBLISHED' }
    });

    // 5. Xóa cache danh sách để cập nhật dữ liệu mới cho người dùng
    await redisClient.del('courses:list:*');
    await redisClient.del(`course:${id}`);

    res.json({
      success: true,
      message: 'Course published successfully!',
      data: updatedCourse
    });
  } catch (error) {
    console.error('Publish course error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}
// services/course-service/src/controllers/course.controller.js
// Thêm method mới để lấy khóa học của riêng giảng viên

// Lấy danh sách khóa học của giảng viên đang đăng nhập
async getMyCourses(req, res) {
  try {
    // Lấy instructorId từ header (do API Gateway gửi)
    const instructorId = req.headers['x-user-id'];
    
    if (!instructorId) {
      return res.status(400).json({ // Đổi thành 400 vì lỗi thiếu dữ liệu đầu vào
        success: false,
        message: 'Missing instructorId in headers'
      });
    }
    
    const { page = 1, limit = 10, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Xây dựng filter
    const where = { instructorId };
    if (status && status !== 'ALL') {
      where.status = status;
    }
    
    const courses = await prisma.course.findMany({
      where,
      skip,
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
      include: {
        category: true,
        _count: {
          select: { enrollments: true, reviews: true }
        }
      }
    });
    
    const total = await prisma.course.count({ where });
    
    res.json({
      success: true,
      data: {
        courses,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get my courses error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}
}

module.exports = new CourseController();