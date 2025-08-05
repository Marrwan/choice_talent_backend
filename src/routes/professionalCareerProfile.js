const express = require('express');
const router = express.Router();
const multer = require('multer');
const { authenticateToken: protect } = require('../middleware/auth');
const professionalCareerProfileController = require('../controllers/professionalCareerProfileController');

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
});

// Routes
router.get('/', protect, professionalCareerProfileController.getProfile);
router.post('/', protect, upload.single('profilePicture'), professionalCareerProfileController.createOrUpdateProfile);
router.put('/', protect, upload.single('profilePicture'), professionalCareerProfileController.createOrUpdateProfile);
router.delete('/', protect, professionalCareerProfileController.deleteProfile);

module.exports = router; 