const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');

const userController = require('../controllers/userController');
const { authenticateToken } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');

// Configure multer for profile picture uploads
const profilePictureStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/profile-pictures');
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp and random string
    const uniqueSuffix = Date.now() + '-' + crypto.randomBytes(6).toString('hex');
    const ext = path.extname(file.originalname);
    const filename = `${uniqueSuffix}${ext}`;
    cb(null, filename);
  }
});

// Create a simple multer instance for profile picture uploads
const profilePictureUpload = multer({
  storage: profilePictureStorage,
  fileFilter: (req, file, cb) => {
    console.log('[Multer] File filter called for:', file.originalname, 'mimetype:', file.mimetype);
    // Only allow image files
    if (file.mimetype.startsWith('image/')) {
      console.log('[Multer] File accepted:', file.originalname);
      cb(null, true);
    } else {
      console.log('[Multer] File rejected:', file.originalname, 'mimetype:', file.mimetype);
      cb(new Error('Only image files are allowed'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

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

/**
 * @route   POST /api/user/career-profile-picture
 * @desc    Upload career profile picture
 * @access  Private
 */
router.post('/career-profile-picture',
  authenticateToken,
  (req, res, next) => {
    console.log('[Route] Career profile picture upload route hit');
    console.log('[Route] Content-Type header:', req.headers['content-type']);
    console.log('[Route] Request method:', req.method);
    console.log('[Route] Request URL:', req.url);
    next();
  },
  profilePictureUpload.single('profilePicture'),
  (err, req, res, next) => {
    if (err) {
      console.error('[Multer] Error during file upload:', err);
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'File too large. Maximum size is 5MB.'
        });
      }
      if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({
          success: false,
          message: 'Unexpected file field.'
        });
      }
      return res.status(400).json({
        success: false,
        message: 'File upload error: ' + err.message
      });
    }
    next();
  },
  userController.uploadCareerProfilePicture
);

/**
 * @route   DELETE /api/user/career-profile-picture
 * @desc    Delete career profile picture
 * @access  Private
 */
router.delete('/career-profile-picture',
  authenticateToken,
  userController.deleteCareerProfilePicture
);

/**
 * @route   POST /api/user/test-upload
 * @desc    Test file upload endpoint
 * @access  Private
 */
router.post('/test-upload',
  authenticateToken,
  profilePictureUpload.single('testFile'),
  (req, res) => {
    console.log('[Test] Test upload endpoint hit');
    console.log('[Test] File received:', req.file);
    res.json({
      success: true,
      message: 'Test upload successful',
      file: req.file ? {
        filename: req.file.filename,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      } : null
    });
  }
);

module.exports = router; 