// services/auth-service/src/controllers/auth.controller.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
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
          isActive: isActive
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
      
      // Nếu là Instructor, thông báo cần chờ duyệt
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

  // Lấy danh sách giảng viên chờ duyệt (isActive = false)
  async getPendingInstructors(req, res) {
    try {
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

  async getUserById(req, res) {
    try {
      const { userId } = req.params;
      
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true
        }
      });
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // ========== ADMIN USER MANAGEMENT ==========

  // Lấy tất cả người dùng (cho admin)
  async getAllUsers(req, res) {
    try {
      const { page = 1, limit = 20, role, search } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const where = {};
      
      if (role && role !== 'ALL') where.role = role;
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } }
        ];
      }
      
      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          skip,
          take: parseInt(limit),
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            isActive: true,
            createdAt: true,
            updatedAt: true
          }
        }),
        prisma.user.count({ where })
      ]);
      
      res.json({
        success: true,
        data: {
          users,
          pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / parseInt(limit)) }
        }
      });
    } catch (error) {
      console.error('Get all users error:', error);
      res.status(500).json({ success: false, message: 'Internal error' });
    }
  }

  // Admin cập nhật role user
  async adminUpdateUserRole(req, res) {
    try {
      const { userId } = req.params;
      const { role } = req.body; // STUDENT, INSTRUCTOR, ADMIN
      
      if (!['STUDENT', 'INSTRUCTOR', 'ADMIN'].includes(role)) {
        return res.status(400).json({ success: false, message: 'Invalid role' });
      }
      
      const user = await prisma.user.update({
        where: { id: userId },
        data: { role },
        select: { id: true, email: true, name: true, role: true, isActive: true }
      });
      
      await redisClient.del(`user:${userId}`);
      
      res.json({ success: true, message: 'User role updated', data: user });
    } catch (error) {
      console.error('Admin update user role error:', error);
      res.status(500).json({ success: false, message: 'Internal error' });
    }
  }

  // Admin khóa/mở khóa user
  async adminToggleUserStatus(req, res) {
    try {
      const { userId } = req.params;
      
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { isActive: !user.isActive },
        select: { id: true, email: true, name: true, role: true, isActive: true }
      });
      
      await redisClient.del(`user:${userId}`);
      
      res.json({
        success: true,
        message: `User ${updatedUser.isActive ? 'activated' : 'deactivated'}`,
        data: updatedUser
      });
    } catch (error) {
      console.error('Admin toggle user status error:', error);
      res.status(500).json({ success: false, message: 'Internal error' });
    }
  }

  // Admin xóa user
  async adminDeleteUser(req, res) {
    try {
      const { userId } = req.params;
      
      // Kiểm tra không xóa admin cuối cùng
      const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
      const userToDelete = await prisma.user.findUnique({ where: { id: userId } });
      
      if (userToDelete?.role === 'ADMIN' && adminCount <= 1) {
        return res.status(400).json({ success: false, message: 'Cannot delete the last admin' });
      }
      
      await prisma.refreshToken.deleteMany({ where: { userId } });
      await prisma.user.delete({ where: { id: userId } });
      
      await redisClient.del(`user:${userId}`);
      
      res.json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
      console.error('Admin delete user error:', error);
      res.status(500).json({ success: false, message: 'Internal error' });
    }
  }
}

module.exports = new AuthController();