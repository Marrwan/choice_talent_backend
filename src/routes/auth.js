const express = require('express');
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', 
  validate(schemas.register),
  authController.register
);

/**
 * @route   GET /api/auth/activate/:token
 * @desc    Activate user account
 * @access  Public
 */
router.get('/activate/:token', authController.activateAccount);

/**
 * @route   POST /api/auth/resend-activation
 * @desc    Resend activation email
 * @access  Public
 */
router.post('/resend-activation', 
  validate(schemas.forgotPassword), // reuse the same schema as forgot password
  authController.resendActivation
);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login',
  validate(schemas.login),
  authController.login
);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout',
  authenticateToken,
  authController.logout
);

/**
 * @route   GET /api/auth/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/profile',
  authenticateToken,
  authController.getProfile
);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Request password reset
 * @access  Public
 */
router.post('/forgot-password',
  validate(schemas.forgotPassword),
  authController.forgotPassword
);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password using token
 * @access  Public
 */
router.post('/reset-password',
  validate(schemas.resetPassword),
  authController.resetPassword
);

/**
 * @route   POST /api/auth/change-password
 * @desc    Change password (authenticated user)
 * @access  Private
 */
router.post('/change-password',
  validate(schemas.changePassword),
  authenticateToken,
  authController.changePassword
);

module.exports = router; 