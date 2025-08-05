const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  createGroup,
  getUserGroups,
  getGroup,
  addMembers,
  removeMember,
  leaveGroup,
  updateGroup
} = require('../controllers/groupController');

// Apply authentication middleware to all routes
router.use(authenticateToken);

/**
 * @route   POST /api/groups
 * @desc    Create a new group
 * @access  Private
 */
router.post('/', createGroup);

/**
 * @route   GET /api/groups
 * @desc    Get user's groups
 * @access  Private
 */
router.get('/', getUserGroups);

/**
 * @route   GET /api/groups/:groupId
 * @desc    Get group details
 * @access  Private
 */
router.get('/:groupId', getGroup);

/**
 * @route   PUT /api/groups/:groupId
 * @desc    Update group details
 * @access  Private
 */
router.put('/:groupId', updateGroup);

/**
 * @route   POST /api/groups/:groupId/members
 * @desc    Add members to group
 * @access  Private
 */
router.post('/:groupId/members', addMembers);

/**
 * @route   DELETE /api/groups/:groupId/members/:memberId
 * @desc    Remove member from group
 * @access  Private
 */
router.delete('/:groupId/members/:memberId', removeMember);

/**
 * @route   POST /api/groups/:groupId/leave
 * @desc    Leave group
 * @access  Private
 */
router.post('/:groupId/leave', leaveGroup);

module.exports = router;
