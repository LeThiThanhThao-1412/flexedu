const JWTService = require('../services/jwt.service');

const isAdmin = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const decoded = JWTService.verifyAccessToken(token);
    
    // Kiểm tra role trong token
    if (decoded.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Access denied. Admins only.' });
    }

    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

module.exports = isAdmin;