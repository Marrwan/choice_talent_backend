const { Op } = require('sequelize');
const { User, Conversation, Message, MessageAttachment } = require('../models');
const { createError } = require('../utils/errorUtils');
const { processFileUpload } = require('../services/fileUploadService');
const socketService = require('../services/socketService');

/**
 * Get all conversations for the authenticated user
 */
const getConversations = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    const conversations = await Conversation.findAll({
      where: {
        [Op.or]: [
          { participant1Id: userId },
          { participant2Id: userId }
        ]
      },
      include: [
        {
          model: User,
          as: 'participant1',
          attributes: ['id', 'name', 'realName', 'username', 'profilePicture']
        },
        {
          model: User,
          as: 'participant2',
          attributes: ['id', 'name', 'realName', 'username', 'profilePicture']
        },
        {
          model: Message,
          as: 'lastMessage',
          include: [
            {
              model: User,
              as: 'sender',
              attributes: ['id', 'name', 'realName', 'username']
            },
            {
              model: MessageAttachment,
              as: 'attachments',
              attributes: ['id', 'original_name', 'fileType', 'fileUrl', 'thumbnail_url', 'size']
            }
          ]
        }
      ],
      order: [['lastMessageAt', 'DESC']]
    });

    // Format conversations with other participant info
    const formattedConversations = conversations.map(conv => {
      const otherParticipant = conv.participant1Id === userId ? conv.participant2 : conv.participant1;
      const isOnline = socketService.isUserOnline(otherParticipant.id);
      
      return {
        id: conv.id,
        otherParticipant: {
          ...otherParticipant.toJSON(),
          isOnline
        },
        lastMessage: conv.lastMessage,
        lastMessageAt: conv.lastMessageAt,
        isActive: conv.isActive,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt
      };
    });

    res.json({
      success: true,
      data: formattedConversations
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get or create a conversation between two users
 */
const getOrCreateConversation = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { otherUserId } = req.params;

    if (userId === otherUserId) {
      throw createError(400, 'Cannot create conversation with yourself');
    }

    // Check if other user exists
    const otherUser = await User.findByPk(otherUserId);
    if (!otherUser) {
      throw createError(404, 'User not found');
    }

    // Find existing conversation
    let conversation = await Conversation.findOne({
      where: {
        [Op.or]: [
          { participant1Id: userId, participant2Id: otherUserId },
          { participant1Id: otherUserId, participant2Id: userId }
        ]
      },
      include: [
        {
          model: User,
          as: 'participant1',
          attributes: ['id', 'name', 'realName', 'username', 'profilePicture']
        },
        {
          model: User,
          as: 'participant2',
          attributes: ['id', 'name', 'realName', 'username', 'profilePicture']
        }
      ]
    });

    // Create new conversation if it doesn't exist
    if (!conversation) {
      conversation = await Conversation.create({
        participant1Id: userId,
        participant2Id: otherUserId
      });

      // Reload with associations
      conversation = await Conversation.findByPk(conversation.id, {
        include: [
          {
            model: User,
            as: 'participant1',
            attributes: ['id', 'name', 'realName', 'username', 'profilePicture']
          },
          {
            model: User,
            as: 'participant2',
            attributes: ['id', 'name', 'realName', 'username', 'profilePicture']
          }
        ]
      });
    }

    const otherParticipant = conversation.participant1Id === userId ? conversation.participant2 : conversation.participant1;
    const isOnline = socketService.isUserOnline(otherParticipant.id);

    res.json({
      success: true,
      data: {
        id: conversation.id,
        otherParticipant: {
          ...otherParticipant.toJSON(),
          isOnline
        },
        lastMessageAt: conversation.lastMessageAt,
        isActive: conversation.isActive,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a specific conversation by ID
 */
const getConversationById = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { conversationId } = req.params;

    // Find conversation and check if user is a participant
    const conversation = await Conversation.findOne({
      where: {
        id: conversationId,
        [Op.or]: [
          { participant1Id: userId },
          { participant2Id: userId },
          { groupId: { [Op.ne]: null } } // For group conversations, we'll check membership differently
        ]
      },
      include: [
        {
          model: User,
          as: 'participant1',
          attributes: ['id', 'name', 'realName', 'username', 'profilePicture']
        },
        {
          model: User,
          as: 'participant2',
          attributes: ['id', 'name', 'realName', 'username', 'profilePicture']
        }
      ]
    });

    if (!conversation) {
      throw createError(404, 'Conversation not found');
    }

    // Handle group conversations
    if (conversation.type === 'group' && conversation.groupId) {
      const { Group, GroupMember } = require('../models');
      
      // Check if user is a member of the group
      const membership = await GroupMember.findOne({
        where: {
          groupId: conversation.groupId,
          userId: userId,
          leftAt: null
        }
      });

      if (!membership) {
        throw createError(403, 'You are not a member of this group');
      }

      // Get group details
      const group = await Group.findByPk(conversation.groupId, {
        include: [
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'name', 'realName', 'username', 'profilePicture']
          }
        ]
      });

      // Get member count
      const memberCount = await GroupMember.count({
        where: {
          groupId: conversation.groupId,
          leftAt: null
        }
      });

      return res.json({
        success: true,
        data: {
          id: conversation.id,
          type: 'group',
          groupId: conversation.groupId,
          groupName: group.name,
          groupAvatar: group.avatarUrl,
          memberCount,
          lastMessageAt: conversation.lastMessageAt,
          isActive: conversation.isActive,
          createdAt: conversation.createdAt,
          updatedAt: conversation.updatedAt
        }
      });
    }

    // Handle direct conversations
    const otherParticipant = conversation.participant1Id === userId ? conversation.participant2 : conversation.participant1;
    const isOnline = socketService.isUserOnline(otherParticipant.id);

    res.json({
      success: true,
      data: {
        id: conversation.id,
        type: 'direct',
        otherParticipant: {
          ...otherParticipant.toJSON(),
          isOnline
        },
        lastMessageAt: conversation.lastMessageAt,
        isActive: conversation.isActive,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get messages for a conversation
 */
const getMessages = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { conversationId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const offset = (page - 1) * limit;

    // Check if user is part of the conversation
    const conversation = await Conversation.findOne({
      where: {
        id: conversationId,
        [Op.or]: [
          { participant1Id: userId },
          { participant2Id: userId }
        ]
      }
    });

    if (!conversation) {
      throw createError(404, 'Conversation not found');
    }

    const messages = await Message.findAll({
      where: {
        conversationId,
        isDeleted: false
      },
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'name', 'realName', 'username', 'profilePicture']
        },
        {
          model: MessageAttachment,
          as: 'attachments',
          attributes: ['id', 'original_name', 'fileType', 'size', 'fileUrl', 'thumbnail_url']
        },
        {
          model: Message,
          as: 'replyToMessage',
          include: [
            {
              model: User,
              as: 'sender',
              attributes: ['id', 'name', 'realName', 'username']
            }
          ]
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: messages.reverse(), // Return in chronological order
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: await Message.count({
          where: {
            conversationId,
            isDeleted: false
          }
        })
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Send a new message
 */
const sendMessage = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { conversationId } = req.params;
    const { content, messageType = 'text', replyToMessageId } = req.body;

    // Check if user is part of the conversation
    const conversation = await Conversation.findOne({
      where: {
        id: conversationId,
        [Op.or]: [
          { participant1Id: userId },
          { participant2Id: userId }
        ]
      }
    });

    if (!conversation) {
      throw createError(404, 'Conversation not found');
    }

    // Create message
    const message = await Message.create({
      conversationId,
      senderId: userId,
      content,
      messageType,
      replyToMessageId: replyToMessageId || null
    });

    // Process file attachments if any
    let attachments = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const attachmentData = await processFileUpload(file, userId);
        const attachment = await MessageAttachment.create({
          messageId: message.id,
          ...attachmentData
        });
        attachments.push(attachment);
      }
    }

    // Update conversation's last message
    await conversation.update({
      lastMessageId: message.id,
      lastMessageAt: new Date()
    });

    // Load complete message with associations
    const completeMessage = await Message.findByPk(message.id, {
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'name', 'realName', 'username', 'profilePicture']
        },
        {
          model: MessageAttachment,
          as: 'attachments',
          attributes: ['id', 'original_name', 'fileType', 'size', 'fileUrl', 'thumbnail_url']
        },
        {
          model: Message,
          as: 'replyToMessage',
          include: [
            {
              model: User,
              as: 'sender',
              attributes: ['id', 'name', 'realName', 'username']
            }
          ]
        }
      ]
    });

    // Emit real-time message to conversation participants
    socketService.sendToConversation(conversationId, 'new_message', {
      message: completeMessage,
      conversationId
    });

    res.status(201).json({
      success: true,
      data: completeMessage,
      message: 'Message sent successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark message as read
 */
const markMessageAsRead = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { messageId } = req.params;

    const message = await Message.findByPk(messageId, {
      include: [
        {
          model: Conversation,
          as: 'conversation',
          where: {
            [Op.or]: [
              { participant1Id: userId },
              { participant2Id: userId }
            ]
          }
        }
      ]
    });

    if (!message) {
      throw createError(404, 'Message not found');
    }

    // Only mark as read if user is not the sender
    if (message.senderId !== userId && !message.isRead) {
      await message.update({
        isRead: true,
        readAt: new Date()
      });

      // Emit read status to other participant
      socketService.sendToConversation(message.conversationId, 'message_read', {
        messageId: message.id,
        readBy: userId,
        readAt: message.readAt
      });
    }

    res.json({
      success: true,
      message: 'Message marked as read'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a message
 */
const deleteMessage = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { messageId } = req.params;

    const message = await Message.findByPk(messageId, {
      include: [
        {
          model: Conversation,
          as: 'conversation',
          where: {
            [Op.or]: [
              { participant1Id: userId },
              { participant2Id: userId }
            ]
          }
        }
      ]
    });

    if (!message) {
      throw createError(404, 'Message not found');
    }

    // Only sender can delete their own message
    if (message.senderId !== userId) {
      throw createError(403, 'You can only delete your own messages');
    }

    await message.update({
      isDeleted: true,
      deletedAt: new Date()
    });

    // Emit message deletion to conversation participants
    socketService.sendToConversation(message.conversationId, 'message_deleted', {
      messageId: message.id,
      deletedBy: userId
    });

    res.json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get online users
 */
const getOnlineUsers = async (req, res, next) => {
  try {
    const onlineUserIds = socketService.getOnlineUsers();
    
    const onlineUsers = await User.findAll({
      where: {
        id: {
          [Op.in]: onlineUserIds
        }
      },
      attributes: ['id', 'name', 'realName', 'username', 'profilePicture']
    });

    res.json({
      success: true,
      data: onlineUsers
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getConversations,
  getOrCreateConversation,
  getConversationById,
  getMessages,
  sendMessage,
  markMessageAsRead,
  deleteMessage,
  getOnlineUsers
};
