const { Call, User, Conversation } = require('../models');
const { createError } = require('../utils/errorUtils');
const { Op } = require('sequelize');
const socketService = require('../services/socketService');

/**
 * Initiate a call between two users
 * POST /calls/initiate
 */
const initiateCall = async (req, res, next) => {
  try {
    const { targetUserId, callType = 'audio', conversationId } = req.body;
    const userId = req.user.id;

    if (userId === targetUserId) {
      return next(createError(400, 'Cannot call yourself'));
    }

    // Check if target user exists
    const targetUser = await User.findByPk(targetUserId, {
      attributes: ['id', 'username', 'realName', 'profilePicture']
    });

    if (!targetUser) {
      return next(createError(404, 'Target user not found'));
    }

    // Check if there's an existing active call between these users
    const existingCall = await Call.findOne({
      where: {
        [Op.or]: [
          { callerId: userId, receiverId: targetUserId, status: { [Op.in]: ['pending', 'active'] } },
          { callerId: targetUserId, receiverId: userId, status: { [Op.in]: ['pending', 'active'] } }
        ]
      }
    });

    if (existingCall) {
      return next(createError(409, 'There is already an active call between these users'));
    }

    // Create call record
    const call = await Call.create({
      callerId: userId,
      receiverId: targetUserId,
      callType,
      conversationId,
      status: 'pending'
    });

    // Get caller info for the notification
    const callerInfo = {
      id: req.user.id,
      username: req.user.username,
      realName: req.user.realName,
      profilePicture: req.user.profilePicture
    };

    // Send call invitation to target user via Socket.io
    const notificationSent = socketService.sendToUser(targetUserId, 'incoming_call', {
      callId: call.id,
      fromUserId: userId,
      callType,
      conversationId,
      from: callerInfo,
      timestamp: new Date().toISOString()
    });

    if (!notificationSent) {
      // Target user is offline, update call status
      await call.update({ status: 'missed' });
      return res.status(200).json({
        success: false,
        message: 'Target user is offline',
        data: { call, userOffline: true }
      });
    }

    res.status(201).json({
      success: true,
      message: 'Call initiated successfully',
      data: { 
        call: {
          id: call.id,
          callType: call.callType,
          status: call.status,
          createdAt: call.createdAt
        },
        targetUser: {
          id: targetUser.id,
          username: targetUser.username,
          realName: targetUser.realName,
          profilePicture: targetUser.profilePicture
        }
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Accept a call
 * POST /calls/:callId/accept
 */
const acceptCall = async (req, res, next) => {
  try {
    const { callId } = req.params;
    const userId = req.user.id;

    const call = await Call.findByPk(callId);
    if (!call) {
      return next(createError(404, 'Call not found'));
    }

    // Only the receiver can accept the call
    if (call.receiverId !== userId) {
      return next(createError(403, 'You are not authorized to accept this call'));
    }

    if (call.status !== 'pending') {
      return next(createError(400, 'Call cannot be accepted in its current state'));
    }

    // Update call status
    await call.update({
      status: 'active',
      acceptedAt: new Date()
    });

    // Notify the caller that call was accepted
    socketService.sendToUser(call.callerId, 'call_accepted', {
      callId: call.id,
      fromUserId: userId,
      conversationId: call.conversationId,
      timestamp: new Date().toISOString()
    });

    res.status(200).json({
      success: true,
      message: 'Call accepted successfully',
      data: { call }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Reject a call
 * POST /calls/:callId/reject
 */
const rejectCall = async (req, res, next) => {
  try {
    const { callId } = req.params;
    const userId = req.user.id;

    const call = await Call.findByPk(callId);
    if (!call) {
      return next(createError(404, 'Call not found'));
    }

    // Only the receiver can reject the call
    if (call.receiverId !== userId) {
      return next(createError(403, 'You are not authorized to reject this call'));
    }

    if (call.status !== 'pending') {
      return next(createError(400, 'Call cannot be rejected in its current state'));
    }

    // Update call status
    await call.update({
      status: 'rejected',
      endedAt: new Date()
    });

    // Notify the caller that call was rejected
    socketService.sendToUser(call.callerId, 'call_rejected', {
      callId: call.id,
      fromUserId: userId,
      conversationId: call.conversationId,
      timestamp: new Date().toISOString()
    });

    res.status(200).json({
      success: true,
      message: 'Call rejected successfully',
      data: { call }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * End a call
 * POST /calls/:callId/end
 */
const endCall = async (req, res, next) => {
  try {
    const { callId } = req.params;
    const userId = req.user.id;

    const call = await Call.findByPk(callId);
    if (!call) {
      return next(createError(404, 'Call not found'));
    }

    // Both caller and receiver can end the call
    if (call.callerId !== userId && call.receiverId !== userId) {
      return next(createError(403, 'You are not authorized to end this call'));
    }

    if (!['pending', 'active'].includes(call.status)) {
      return next(createError(400, 'Call is already ended'));
    }

    // Calculate duration if call was active
    let duration = 0;
    if (call.status === 'active' && call.acceptedAt) {
      duration = Math.floor((new Date() - call.acceptedAt) / 1000);
    }

    // Update call status
    await call.update({
      status: 'ended',
      endedAt: new Date(),
      duration
    });

    // Notify the other participant
    const otherUserId = call.callerId === userId ? call.receiverId : call.callerId;
    socketService.sendToUser(otherUserId, 'call_ended', {
      callId: call.id,
      fromUserId: userId,
      conversationId: call.conversationId,
      reason: 'ended_by_participant',
      timestamp: new Date().toISOString()
    });

    res.status(200).json({
      success: true,
      message: 'Call ended successfully',
      data: { 
        call: {
          id: call.id,
          status: call.status,
          duration,
          endedAt: call.endedAt
        }
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get call details
 * GET /calls/:callId
 */
const getCall = async (req, res, next) => {
  try {
    const { callId } = req.params;
    const userId = req.user.id;

    const call = await Call.findByPk(callId, {
      include: [
        {
          model: User,
          as: 'caller',
          attributes: ['id', 'username', 'realName', 'profilePicture']
        },
        {
          model: User,
          as: 'receiver',
          attributes: ['id', 'username', 'realName', 'profilePicture']
        }
      ]
    });

    if (!call) {
      return next(createError(404, 'Call not found'));
    }

    // Only participants can view call details
    if (call.callerId !== userId && call.receiverId !== userId) {
      return next(createError(403, 'You are not authorized to view this call'));
    }

    res.status(200).json({
      success: true,
      data: { call }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get call history for the authenticated user
 * GET /calls/history
 */
const getCallHistory = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const calls = await Call.findAll({
      where: {
        [Op.or]: [
          { callerId: userId },
          { receiverId: userId }
        ]
      },
      include: [
        {
          model: User,
          as: 'caller',
          attributes: ['id', 'username', 'realName', 'profilePicture']
        },
        {
          model: User,
          as: 'receiver',
          attributes: ['id', 'username', 'realName', 'profilePicture']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const totalCalls = await Call.count({
      where: {
        [Op.or]: [
          { callerId: userId },
          { receiverId: userId }
        ]
      }
    });

    res.status(200).json({
      success: true,
      data: calls,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCalls,
        totalPages: Math.ceil(totalCalls / limit)
      }
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  initiateCall,
  acceptCall,
  rejectCall,
  endCall,
  getCall,
  getCallHistory
};
