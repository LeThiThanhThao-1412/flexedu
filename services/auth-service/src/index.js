// services/auth-service/src/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authController = require('./controllers/auth.controller');
const validate = require('./middleware/validate');
const validators = require('./validators/auth.validator');

const app = express();
const PORT = process.env.PORT || 3001;
const isAdmin = require('./middleware/admin.middleware');

// Middleware
app.use(cors());
app.use(express.json());

// ========== ADMIN ROUTES (đặt trước để tránh conflict) ==========
app.get('/api/admin/users', isAdmin, authController.getAllUsers);
app.put('/api/admin/users/:userId/role', isAdmin, authController.adminUpdateUserRole);
app.patch('/api/admin/users/:userId/toggle-status', isAdmin, authController.adminToggleUserStatus);
app.delete('/api/admin/users/:userId', isAdmin, authController.adminDeleteUser);

// ========== PUBLIC ROUTES ==========
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// ========== AUTH ROUTES ==========
app.post('/api/auth/register', 
  validate(validators.registerSchema), 
  authController.register
);

app.post('/api/auth/login',
  validate(validators.loginSchema),
  authController.login
);

app.post('/api/auth/refresh',
  validate(validators.refreshTokenSchema),
  authController.refreshToken
);

app.post('/api/auth/verify', authController.verifyToken);
app.get('/api/auth/user/:userId', authController.getUserById);

// ========== ADMIN APPROVAL ROUTES ==========
app.patch('/api/auth/approve/:instructorId', 
  isAdmin, 
  authController.approveInstructor
);
app.get('/api/auth/pending-instructors', 
  isAdmin,
  authController.getPendingInstructors
);

// Start server
app.listen(PORT, () => {
  console.log(`✅ Auth Service running on port ${PORT}`);
});