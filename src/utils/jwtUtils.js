const jwt = require('jsonwebtoken');

/**
 * Generate JWT token for user
 * @param {Object} user - User object
 * @returns {string} - JWT token
 */
const generateToken = (user) => {
  const payload = {
    userId: user.id,
    email: user.email
  };

  return jwt.sign(
    payload,
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '1d'
    }
  );
};

/**
 * Generate refresh token
 * @param {Object} user - User object
 * @returns {string} - Refresh token
 */
const generateRefreshToken = (user) => {
  const payload = {
    userId: user.id,
    type: 'refresh'
  };

  return jwt.sign(
    payload,
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    {
      expiresIn: '7d'
    }
  );
};

/**
 * Verify JWT token
 * @param {string} token - JWT token
 * @param {string} secret - JWT secret (optional, defaults to JWT_SECRET)
 * @returns {Object} - Decoded token payload
 */
const verifyToken = (token, secret = process.env.JWT_SECRET) => {
  return jwt.verify(token, secret);
};

/**
 * Generate password reset token
 * @param {Object} user - User object
 * @returns {string} - Password reset token
 */
const generatePasswordResetToken = (user) => {
  const payload = {
    userId: user.id,
    email: user.email,
    type: 'password_reset'
  };

  return jwt.sign(
    payload,
    process.env.JWT_SECRET + user.passwordHash, // Include password hash for extra security
    {
      expiresIn: '1h' // Password reset tokens expire in 1 hour
    }
  );
};

/**
 * Verify password reset token
 * @param {string} token - Password reset token
 * @param {Object} user - User object
 * @returns {Object} - Decoded token payload
 */
const verifyPasswordResetToken = (token, user) => {
  return jwt.verify(token, process.env.JWT_SECRET + user.passwordHash);
};

module.exports = {
  generateToken,
  generateRefreshToken,
  verifyToken,
  generatePasswordResetToken,
  verifyPasswordResetToken
}; 