// services/auth-service/src/controllers/auth.controller.js
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const JWTService = require('../services/jwt.service');
const redisClient = require('../config/redis');

const prisma = new PrismaClient();

class AuthController {
  // Đăng ký
  async register(req, res) {
    try {
      const { email, password, name, role } = req.body;

      // Kiểm tra email đã tồn tại
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email already exists'
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      const userRole = role === 'INSTRUCTOR' ? 'INSTRUCTOR' : 'STUDENT';
      const isActive = userRole === 'STUDENT'; // Student mặc định true
      // Tạo user
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          role: userRole,
          isActive: isActive // Gán trạng thái vào đây
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          createdAt: true
        }
      });
      // 3. Nếu là Instructor, thông báo cần chờ duyệt
      if (!isActive) {
        return res.status(201).json({
          success: true,
          message: 'Registration successful! Your instructor account is pending admin approval.',
          data: { user }
        });
      }
      // Tạo token
      const tokens = JWTService.generateTokens({
        userId: user.id,
        email: user.email,
        role: user.role
      });

      // Lưu refresh token
      await prisma.refreshToken.create({
        data: {
          token: tokens.refreshToken,
          userId: user.id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }
      });

      // Cache user
      await redisClient.set(`user:${user.id}`, user, 3600);

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user,
          ...tokens
        }
      });
    } catch (error) {
      console.error('Register error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Đăng nhập
  async login(req, res) {
    try {
      const { email, password } = req.body;

      // Tìm user
      const user = await prisma.user.findUnique({
        where: { email }
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Kiểm tra password
      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Tạo token
      const tokens = JWTService.generateTokens({
        userId: user.id,
        email: user.email,
        role: user.role
      });

      // Lưu refresh token
      await prisma.refreshToken.create({
        data: {
          token: tokens.refreshToken,
          userId: user.id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }
      });

      // Update last login
      await prisma.user.update({
        where: { id: user.id },
        data: { updatedAt: new Date() }
      });

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role
          },
          ...tokens
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Refresh token
  async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body;

      // Kiểm tra trong database
      const tokenRecord = await prisma.refreshToken.findUnique({
        where: { token: refreshToken },
        include: { user: true }
      });

      if (!tokenRecord || tokenRecord.revokedAt) {
        return res.status(401).json({
          success: false,
          message: 'Invalid refresh token'
        });
      }

      if (tokenRecord.expiresAt < new Date()) {
        return res.status(401).json({
          success: false,
          message: 'Refresh token expired'
        });
      }

      // Verify token
      const decoded = JWTService.verifyRefreshToken(refreshToken);

      // Tạo access token mới
      const newAccessToken = jwt.sign(
        { userId: decoded.userId, email: decoded.email, role: decoded.role },
        process.env.JWT_SECRET,
        { expiresIn: '15m' }
      );

      res.json({
        success: true,
        data: { accessToken: newAccessToken }
      });
    } catch (error) {
      res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }
  }

  // Verify token (cho API Gateway)
  async verifyToken(req, res) {
    try {
      const token = req.headers.authorization?.split(' ')[1];

      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'No token provided'
        });
      }

      const decoded = JWTService.verifyAccessToken(token);

      // Get user from cache
      let user = await redisClient.get(`user:${decoded.userId}`);
      
      if (!user) {
        user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          select: { id: true, email: true, name: true, role: true, isActive: true }
        });
      }

      if (!user || !user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'User not found or inactive'
        });
      }

      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          code: 'TOKEN_EXPIRED',
          message: 'Token expired'
        });
      }
      
      res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
  }
  async approveInstructor(req, res) {
    try {
      const { instructorId } = req.params;

      // Tìm và cập nhật trạng thái
      const updatedUser = await prisma.user.update({
        where: { id: instructorId },
        data: { isActive: true },
        select: { id: true, email: true, name: true, role: true, isActive: true }
      });

      // Xóa cache cũ trong Redis để User cập nhật trạng thái mới ngay lập tức
      await redisClient.del(`user:${instructorId}`);

      res.json({
        success: true,
        message: `Instructor ${updatedUser.name} has been approved.`,
        data: updatedUser
      });
    } catch (error) {
      if (error.code === 'P2025') {
        return res.status(404).json({ success: false, message: 'Instructor not found' });
      }
      res.status(500).json({ success: false, message: error.message });
    }
  }
  // services/auth-service/src/controllers/auth.controller.js
// Thêm method này vào class AuthController

// Lấy danh sách giảng viên chờ duyệt (isActive = false)
async getPendingInstructors(req, res) {
  try {
    // Chỉ admin mới được xem
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }

    const pendingInstructors = await prisma.user.findMany({
      where: {
        role: 'INSTRUCTOR',
        isActive: false
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      data: pendingInstructors
    });
  } catch (error) {
    console.error('Get pending instructors error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}
}

module.exports = new AuthController();