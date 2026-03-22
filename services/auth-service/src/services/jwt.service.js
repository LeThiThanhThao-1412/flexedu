// services/auth-service/src/services/jwt.service.js
const jwt = require('jsonwebtoken');

class JWTService {
  constructor() {
    this.secret = process.env.JWT_SECRET || 'my-secret';
    this.refreshSecret = process.env.JWT_REFRESH_SECRET || 'my-refresh-secret';
  }

  generateTokens(payload) {
    const accessToken = jwt.sign(payload, this.secret, { expiresIn: '15m' });
    const refreshToken = jwt.sign(payload, this.refreshSecret, { expiresIn: '7d' });
    
    return { accessToken, refreshToken };
  }

  verifyAccessToken(token) {
    return jwt.verify(token, this.secret);
  }

  verifyRefreshToken(token) {
    return jwt.verify(token, this.refreshSecret);
  }
}

module.exports = new JWTService();