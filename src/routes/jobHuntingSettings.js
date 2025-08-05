const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  getJobHuntingSettings,
  createOrUpdateJobHuntingSettings,
  deleteJobHuntingSettings
} = require('../controllers/jobHuntingSettingsController');

// All routes require authentication
router.use(authenticateToken);

// GET /api/job-hunting-settings - Get user's job hunting settings
router.get('/', getJobHuntingSettings);

// POST /api/job-hunting-settings - Create or update job hunting settings
router.post('/', createOrUpdateJobHuntingSettings);

// PUT /api/job-hunting-settings - Update job hunting settings
router.put('/', createOrUpdateJobHuntingSettings);

// DELETE /api/job-hunting-settings - Delete job hunting settings
router.delete('/', deleteJobHuntingSettings);

module.exports = router; 