const express = require('express');
const path = require('path');
const router = express.Router();

const chatController = require('../controllers/chatController');
const { authenticateToken } = require('../middleware/auth');
const { upload, chatUploadsDir, thumbnailsDir } = require('../services/fileUploadService');

/**
 * @route   GET /api/chat/conversations
 * @desc    Get all conversations for the authenticated user
 * @access  Private
 */
router.get('/conversations',
  authenticateToken,
  chatController.getConversations
);

/**
 * @route   GET /api/chat/conversations/:otherUserId
 * @desc    Get or create a conversation with another user
 * @access  Private
 */
router.get('/conversations/:otherUserId',
  authenticateToken,
  chatController.getOrCreateConversation
);

/**
 * @route   GET /api/chat/conversations/id/:conversationId
 * @desc    Get a specific conversation by ID
 * @access  Private
 */
router.get('/conversations/id/:conversationId',
  authenticateToken,
  chatController.getConversationById
);

/**
 * @route   GET /api/chat/conversations/:conversationId/messages
 * @desc    Get messages for a conversation
 * @access  Private
 */
router.get('/conversations/:conversationId/messages',
  authenticateToken,
  chatController.getMessages
);

/**
 * @route   POST /api/chat/conversations/:conversationId/messages
 * @desc    Send a new message to a conversation
 * @access  Private
 */
router.post('/conversations/:conversationId/messages',
  authenticateToken,
  upload.array('attachments', 5), // Allow up to 5 file attachments
  chatController.sendMessage
);

/**
 * @route   PUT /api/chat/messages/:messageId/read
 * @desc    Mark a message as read
 * @access  Private
 */
router.put('/messages/:messageId/read',
  authenticateToken,
  chatController.markMessageAsRead
);

/**
 * @route   DELETE /api/chat/messages/:messageId
 * @desc    Delete a message
 * @access  Private
 */
router.delete('/messages/:messageId',
  authenticateToken,
  chatController.deleteMessage
);

/**
 * @route   GET /api/chat/online-users
 * @desc    Get list of online users
 * @access  Private
 */
router.get('/online-users',
  authenticateToken,
  chatController.getOnlineUsers
);

/**
 * @route   GET /api/chat/files/:filename
 * @desc    Serve uploaded files
 * @access  Private
 */
router.get('/files/:filename',
  authenticateToken,
  (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(chatUploadsDir, filename);
    
    res.sendFile(filePath, (err) => {
      if (err) {
        res.status(404).json({
          success: false,
          message: 'File not found'
        });
      }
    });
  }
);

/**
 * @route   GET /api/chat/thumbnails/:filename
 * @desc    Serve thumbnail images
 * @access  Private
 */
router.get('/thumbnails/:filename',
  authenticateToken,
  (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(thumbnailsDir, filename);
    
    res.sendFile(filePath, (err) => {
      if (err) {
        res.status(404).json({
          success: false,
          message: 'Thumbnail not found'
        });
      }
    });
  }
);

module.exports = router; 