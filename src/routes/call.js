const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');
const {
  createGroupCall,
  joinGroupCall,
  leaveGroupCall,
  endGroupCall,
  getGroupCall,
  updateParticipantMute,
  updateParticipantRole,
  getCallStatus
} = require('../controllers/groupCallController');
const {
  initiateCall,
  acceptCall,
  rejectCall,
  endCall,
  getCall,
  getCallHistory
} = require('../controllers/callController');

// Apply authentication middleware to all routes
router.use(authenticateToken);

/**
 * Regular Call Routes
 */

/**
 * @route   POST /api/calls/initiate
 * @desc    Initiate a call between two users
 * @access  Private
 */
router.post('/initiate', initiateCall);

/**
 * @route   GET /api/calls/history
 * @desc    Get call history for the authenticated user
 * @access  Private
 */
router.get('/history', getCallHistory);

/**
 * @route   GET /api/calls/:callId
 * @desc    Get call details
 * @access  Private
 */
router.get('/:callId', getCall);

/**
 * @route   POST /api/calls/:callId/accept
 * @desc    Accept a call
 * @access  Private
 */
router.post('/:callId/accept', acceptCall);

/**
 * @route   POST /api/calls/:callId/reject
 * @desc    Reject a call
 * @access  Private
 */
router.post('/:callId/reject', rejectCall);

/**
 * @route   POST /api/calls/:callId/end
 * @desc    End a call
 * @access  Private
 */
router.post('/:callId/end', endCall);

/**
 * Group Call Routes
 */

/**
 * @route   POST /api/calls/group/create
 * @desc    Create a new group call
 * @access  Private
 */
router.post(
  '/group/create',
  validate(schemas.createGroupCall),
  createGroupCall
);

/**
 * @route   GET /api/calls/group/:id
 * @desc    Get group call details
 * @access  Private
 */
router.get(
  '/group/:id',
  validate(schemas.groupCallParams, 'params'),
  getGroupCall
);

/**
 * @route   POST /api/calls/group/:id/join
 * @desc    Join a group call
 * @access  Private
 */
router.post(
  '/group/:id/join',
  validate(schemas.groupCallParams, 'params'),
  validate(schemas.joinGroupCall),
  joinGroupCall
);

/**
 * @route   POST /api/calls/group/:id/leave
 * @desc    Leave a group call
 * @access  Private
 */
router.post(
  '/group/:id/leave',
  validate(schemas.groupCallParams, 'params'),
  leaveGroupCall
);

/**
 * @route   POST /api/calls/group/:id/end
 * @desc    End a group call
 * @access  Private
 */
router.post(
  '/group/:id/end',
  validate(schemas.groupCallParams, 'params'),
  endGroupCall
);

/**
 * @route   GET /api/calls/group/:id/status
 * @desc    Get group call status and participants
 * @access  Private
 */
router.get(
  '/group/:id/status',
  validate(schemas.groupCallParams, 'params'),
  getCallStatus
);

/**
 * @route   POST /api/calls/group/:id/participants/:participantId/mute
 * @desc    Update participant mute status
 * @access  Private
 */
router.post(
  '/group/:id/participants/:participantId/mute',
  updateParticipantMute
);

/**
 * @route   POST /api/calls/group/:id/participants/:participantId/role
 * @desc    Update participant role/permissions
 * @access  Private
 */
router.post(
  '/group/:id/participants/:participantId/role',
  updateParticipantRole
);

module.exports = router;
