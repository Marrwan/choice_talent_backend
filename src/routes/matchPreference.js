const express = require('express');
const router = express.Router();
const { authenticateToken: protect } = require('../middleware/auth');
const { requireMatchmakingAccess } = require('../middleware/subscription');
const matchPreferenceController = require('../controllers/matchPreferenceController');

// Get user's match preference
router.get('/', protect, matchPreferenceController.getMatchPreference);

// Create or update match preference
router.post('/', protect, requireMatchmakingAccess, matchPreferenceController.setMatchPreference);

// Delete match preference
router.delete('/', protect, matchPreferenceController.deleteMatchPreference);

// Find potential matches
router.get('/matches', protect, requireMatchmakingAccess, matchPreferenceController.findMatches);

module.exports = router; 