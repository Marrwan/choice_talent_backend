const express = require('express');
const { body, param, query } = require('express-validator');
const emailCampaignController = require('../controllers/emailCampaignController');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Validation middleware
const validateCampaign = [
  body('name')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Campaign name must be between 3 and 100 characters'),
  body('subject')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Subject must be between 5 and 200 characters'),
  body('template')
    .trim()
    .isLength({ min: 50 })
    .withMessage('Template must be at least 50 characters'),
  body('targetAudience')
    .optional()
    .isIn(['incomplete_profiles', 'all_users', 'custom_list'])
    .withMessage('Invalid target audience'),
  body('emailsPerHour')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Emails per hour must be between 1 and 100'),
  body('customEmailList')
    .optional()
    .isArray()
    .withMessage('Custom email list must be an array'),
  body('customEmailList.*')
    .optional()
    .isEmail()
    .withMessage('Invalid email address in custom list'),
  body('scheduledAt')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format for scheduledAt')
];

const validateId = [
  param('id')
    .isUUID()
    .withMessage('Invalid campaign ID')
];

const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];

// Routes
router.use(authenticateToken); // All routes require authentication

// Create campaign
router.post('/', ...validateCampaign, emailCampaignController.createCampaign);

// Create default career profile campaign
router.post('/default-career-profile', emailCampaignController.createDefaultCareerProfileCampaign);

// Get all campaigns
router.get('/', ...validatePagination, emailCampaignController.getAllCampaigns);

// Get campaign by ID
router.get('/:id', ...validateId, emailCampaignController.getCampaignById);

// Get campaign recipients
router.get('/:id/recipients', ...validateId, ...validatePagination, emailCampaignController.getCampaignRecipients);

// Start campaign
router.post('/:id/start', ...validateId, emailCampaignController.startCampaign);

// Pause campaign
router.post('/:id/pause', ...validateId, emailCampaignController.pauseCampaign);

// Resume campaign
router.post('/:id/resume', ...validateId, emailCampaignController.resumeCampaign);

// Send next batch
router.post('/:id/send-batch', ...validateId, emailCampaignController.sendNextBatch);

// Calculate campaign statistics
router.post('/calculate-stats', [
  body('targetAudience')
    .isIn(['incomplete_profiles', 'all_users', 'custom_list'])
    .withMessage('Invalid target audience'),
  body('customEmailList')
    .optional()
    .isArray()
    .withMessage('Custom email list must be an array'),
  body('customEmailList.*')
    .optional()
    .isEmail()
    .withMessage('Invalid email address in custom list')
], emailCampaignController.calculateCampaignStats);

module.exports = router; 