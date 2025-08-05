const express = require('express');
const router = express.Router();
const { authenticateToken: protect } = require('../middleware/auth');
const multer = require('multer');
const {
  checkEligibility,
  getSubscriptionPackages,
  createSubscription,
  getUserSubscriptions,
  createPayment,
  uploadProofOfPayment,
  getActivityLogs,
  verifyPayment,
  createActivityLog
} = require('../controllers/jobSubscriptionController');

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only images and PDF files are allowed'), false);
    }
  }
});

// Public routes (no auth required)
router.get('/packages', getSubscriptionPackages);

// Protected routes (auth required)
router.use(protect);

// User routes
router.get('/eligibility', checkEligibility);
router.post('/subscriptions', createSubscription);
router.get('/subscriptions', getUserSubscriptions);
router.post('/payments', createPayment);
router.post('/payments/:paymentId/proof', upload.single('proofOfPayment'), uploadProofOfPayment);
router.get('/activity-logs', getActivityLogs);

// Admin routes (you may want to add admin middleware here)
router.put('/payments/:paymentId/verify', verifyPayment);
router.post('/activity-logs', createActivityLog);

module.exports = router; 