// services/auth-service/src/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authController = require('./controllers/auth.controller');
const validate = require('./middleware/validate');
const validators = require('./validators/auth.validator');

const app = express();
const PORT = process.env.PORT || 3001;
const isAdmin = require('./middleware/admin.middleware'); // Import middleware mới

// Middleware
app.use(cors());
app.use(express.json());

// Routes
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
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});
app.patch('/api/auth/approve/:instructorId', 
  isAdmin, 
  authController.approveInstructor
);
app.get('/api/auth/pending-instructors', 
  isAdmin,  // Middleware kiểm tra admin
  authController.getPendingInstructors
);
// Start server
app.listen(PORT, () => {
  console.log(`✅ Auth Service running on port ${PORT}`);
});