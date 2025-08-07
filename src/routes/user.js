const express = require('express');
const router = express.Router();

const userController = require('../controllers/userController');
const { authenticateToken } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');

/**
 * @route   GET /api/user/profile
 * @desc    Get user profile
 * @access  Private
 */
router.get('/profile',
  authenticateToken,
  userController.getProfile
);

/**
 * @route   PUT /api/user/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile',
  authenticateToken,
  validate(schemas.updateProfile),
  userController.updateProfile
);

/**
 * @route   POST /api/user/change-password
 * @desc    Change user password
 * @access  Private
 */
router.post('/change-password',
  authenticateToken,
  validate(schemas.changePassword),
  userController.changePassword
);

/**
 * @route   DELETE /api/user/account
 * @desc    Delete user account
 * @access  Private
 */
router.delete('/account',
  authenticateToken,
  userController.deleteAccount
);

/**
 * @route   GET /api/user/dashboard
 * @desc    Get user dashboard data
 * @access  Private
 */
router.get('/dashboard',
  authenticateToken,
  userController.getDashboard
);

/**
 * @route   GET /api/user/list
 * @desc    Get list of users for chat
 * @access  Private
 */
router.get('/list',
  authenticateToken,
  userController.getUsers
);

/**
 * @route   GET /api/user/users
 * @desc    Get all users (for group creation)
 * @access  Private
 */
router.get('/users',
  authenticateToken,
  userController.getUsers
);

/**
 * @route   GET /api/user/search
 * @desc    Search users
 * @access  Private
 */
router.get('/search',
  authenticateToken,
  userController.searchUsers
);

module.exports = router; 