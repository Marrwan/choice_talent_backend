const { GroupCall, CallParticipant, Group, GroupMember, User } = require('../models');
const { createError } = require('../utils/errorUtils');
const { Op } = require('sequelize');
const socketService = require('../services/socketService');

/**
 * Create a new group call
 * POST /calls/group/create
 */
const createGroupCall = async (req, res, next) => {
  try {
    const { group_id, call_type = 'audio', metadata = {} } = req.body;
    const userId = req.user.id;

    // Validate group exists and user is a member
    const group = await Group.findByPk(group_id);
    if (!group) {
      return next(createError(404, 'Group not found'));
    }

    // Check if user is an active member of the group
    const membership = await GroupMember.findOne({
      where: {
        group_id,
        user_id: userId,
        left_at: null
      }
    });

    if (!membership) {
      return next(createError(403, 'You are not a member of this group'));
    }

    // Check if there's already an active call in this group
    const existingCall = await GroupCall.findOne({
      where: {
        group_id,
        status: ['pending', 'active']
      }
    });

    if (existingCall) {
      return next(createError(409, 'There is already an active call in this group'));
    }

    // Create the group call
    const groupCall = await GroupCall.create({
      group_id,
      call_type,
      status: 'pending',
      metadata: {
        ...metadata,
        created_by: userId,
        created_at: new Date().toISOString()
      }
    });

    // Add the creator as the first participant (host)
    const hostParticipant = await CallParticipant.create({
      callId: groupCall.id,
      userId: userId,
      role: 'host',
      status: 'joined',
      joined_at: new Date()
    });

    // Get all active group members to invite
    const activeMembers = await GroupMember.findAll({
      where: {
        group_id,
        left_at: null,
        user_id: { [Op.ne]: userId } // Exclude the creator
      },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'username', 'email', 'realName']
      }]
    });

    // Create participant records for all group members (invited status)
    const participantPromises = activeMembers.map(member => 
      CallParticipant.create({
        callId: groupCall.id,
        userId: member.user_id,
        role: 'participant',
        status: 'invited'
      })
    );

    await Promise.all(participantPromises);

    // Get the complete call data with participants
    const completeCall = await GroupCall.findByPk(groupCall.id, {
      include: [{
        model: CallParticipant,
        as: 'callParticipants',
        include: [{
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'email', 'realName', 'profilePicture']
        }]
      }, {
        model: Group,
        as: 'group',
        attributes: ['id', 'name', 'description', 'avatar_url']
      }]
    });

    // Emit call invitation to all group members via Socket.io
    const invitedUserIds = activeMembers.map(member => member.user_id);
    socketService.emitToUsers(invitedUserIds, 'group_call_invitation', {
      call: completeCall,
      invitedBy: {
        id: userId,
        username: req.user.username,
        realName: req.user.realName
      }
    });

    res.status(201).json({
      success: true,
      message: 'Group call created successfully',
      data: {
        call: completeCall
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Join a group call
 * POST /calls/group/:id/join
 */
const joinGroupCall = async (req, res, next) => {
  try {
    const { id: callId } = req.params;
    const userId = req.user.id;
    const { audio_enabled = true, video_enabled = false } = req.body;

    // Find the group call
    const groupCall = await GroupCall.findByPk(callId, {
      include: [{
        model: Group,
        as: 'group'
      }]
    });

    if (!groupCall) {
      return next(createError(404, 'Group call not found'));
    }

    // Check if call is in a joinable state
    if (groupCall.status === 'ended') {
      return next(createError(400, 'This call has already ended'));
    }

    if (groupCall.status === 'cancelled') {
      return next(createError(400, 'This call has been cancelled'));
    }

    // Check if user is a member of the group
    const membership = await GroupMember.findOne({
      where: {
        group_id: groupCall.group_id,
        user_id: userId,
        left_at: null
      }
    });

    if (!membership) {
      return next(createError(403, 'You are not a member of this group'));
    }

    // Find or create participant record
    let participant = await CallParticipant.findOne({
      where: {
        callId,
        userId
      }
    });

    if (!participant) {
      // Create participant if they weren't originally invited
      participant = await CallParticipant.create({
        callId,
        userId,
        role: 'participant',
        status: 'joined',
        joined_at: new Date(),
        muted: !audio_enabled,
        video_enabled
      });
    } else {
      // Update existing participant
      await participant.update({
        status: 'joined',
        joined_at: new Date(),
        left_at: null,
        muted: !audio_enabled,
        video_enabled
      });
    }

    // Start the call if it's still pending and this is the first join
    if (groupCall.status === 'pending') {
      await groupCall.startCall();
    }

    // Get updated call data with all participants
    const updatedCall = await GroupCall.findByPk(callId, {
      include: [{
        model: CallParticipant,
        as: 'callParticipants',
        include: [{
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'email', 'realName', 'profilePicture']
        }]
      }, {
        model: Group,
        as: 'group',
        attributes: ['id', 'name', 'description', 'avatar_url']
      }]
    });

    // Notify other participants about the new joiner
    const otherParticipants = updatedCall.callParticipants
      .filter(p => p.userId !== userId && p.status === 'joined')
      .map(p => p.userId);

    if (otherParticipants.length > 0) {
      socketService.emitToUsers(otherParticipants, 'participant_joined', {
        callId,
        participant: {
          id: participant.id,
          user: {
            id: req.user.id,
            username: req.user.username,
            realName: req.user.realName,
            profilePicture: req.user.profilePicture
          },
          role: participant.role,
          muted: participant.muted,
          video_enabled: participant.video_enabled,
          joined_at: participant.joined_at
        }
      });
    }

    res.status(200).json({
      success: true,
      message: 'Successfully joined the group call',
      data: {
        call: updatedCall,
        participant
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Leave a group call
 * POST /calls/group/:id/leave
 */
const leaveGroupCall = async (req, res, next) => {
  try {
    const { id: callId } = req.params;
    const userId = req.user.id;

    // Find the group call
    const groupCall = await GroupCall.findByPk(callId);
    if (!groupCall) {
      return next(createError(404, 'Group call not found'));
    }

    // Find the participant record
    const participant = await CallParticipant.findOne({
      where: {
        callId,
        userId,
        status: 'joined'
      }
    });

    if (!participant) {
      return next(createError(400, 'You are not currently in this call'));
    }

  // Update participant status and leave time
  await participant.update({
    status: 'left',
    left_at: new Date()
  });

  // Get remaining active participants
  const activeParticipants = await CallParticipant.findAll({
    where: {
      callId,
      status: 'joined'
    }
  });

    // If this was the host leaving and there are other participants, assign new host
    if (participant.role === 'host' && activeParticipants.length > 0) {
      const newHost = activeParticipants[0];
      await newHost.update({ role: 'host' });
      
      // Notify the new host
      socketService.emitToUser(newHost.userId, 'host_role_assigned', {
        callId,
        message: 'You are now the host of this call'
      });
    }

    // If no participants left, end the call
    if (activeParticipants.length === 0) {
      await groupCall.endCall();
      
      // Create call history record
      await groupCall.createHistoryRecord();
    }

    // Notify other participants about the leave
    const otherParticipantIds = activeParticipants
      .filter(p => p.userId !== userId)
      .map(p => p.userId);

    if (otherParticipantIds.length > 0) {
      socketService.emitToUsers(otherParticipantIds, 'participant_left', {
        callId,
        participantId: participant.id,
        userId,
        username: req.user.username,
        callEnded: activeParticipants.length === 0
      });
    }

    res.status(200).json({
      success: true,
      message: 'Successfully left the group call',
      data: {
        callEnded: activeParticipants.length === 0,
        activeParticipants: activeParticipants.length
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * End a group call
 * POST /calls/group/:id/end
 */
const endGroupCall = async (req, res, next) => {
  try {
    const { id: callId } = req.params;
    const userId = req.user.id;

    // Find the group call
    const groupCall = await GroupCall.findByPk(callId, {
      include: [{
        model: Group,
        as: 'group'
      }]
    });

    if (!groupCall) {
      return next(createError(404, 'Group call not found'));
    }

    // Check if call is already ended
    if (groupCall.status === 'ended') {
      return next(createError(400, 'This call has already ended'));
    }

    // Check if user has permission to end the call
    const participant = await CallParticipant.findOne({
      where: {
        callId,
        userId
      }
    });

    if (!participant) {
      return next(createError(403, 'You are not a participant in this call'));
    }

    // Check if user is host or group admin
    const isHost = participant.role === 'host';
    const isGroupAdmin = await groupCall.group.isUserAdmin(userId);

    if (!isHost && !isGroupAdmin) {
      return next(createError(403, 'Only the call host or group admin can end the call'));
    }

    // Get all active participants before ending
    const activeParticipants = await CallParticipant.findAll({
      where: {
        callId,
        status: 'joined'
      },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'username']
      }]
    });

    // End the call
    await groupCall.endCall();

    // Update all active participants to left status
    await CallParticipant.update(
      { 
        status: 'left',
        left_at: new Date()
      },
      {
        where: {
          callId,
          status: 'joined'
        }
      }
    );

    // Create call history record
    await groupCall.createHistoryRecord();

    // Notify all participants that the call has ended
    const participantIds = activeParticipants.map(p => p.userId);
    if (participantIds.length > 0) {
      socketService.emitToUsers(participantIds, 'call_ended', {
        callId,
        endedBy: {
          id: userId,
          username: req.user.username,
          realName: req.user.realName
        },
        reason: 'ended_by_host',
        timestamp: new Date().toISOString()
      });
    }

    res.status(200).json({
      success: true,
      message: 'Group call ended successfully',
      data: {
        call: {
          id: groupCall.id,
          status: groupCall.status,
          endTime: groupCall.endTime,
          duration: groupCall.getDuration()
        },
        participantsNotified: participantIds.length
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get group call details
 * GET /calls/group/:id
 */
const getGroupCall = async (req, res, next) => {
  try {
    const { id: callId } = req.params;
    const userId = req.user.id;

    const groupCall = await GroupCall.findByPk(callId, {
      include: [{
        model: CallParticipant,
        as: 'callParticipants',
        include: [{
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'email', 'realName', 'profilePicture']
        }]
      }, {
        model: Group,
        as: 'group',
        attributes: ['id', 'name', 'description', 'avatar_url']
      }]
    });

    if (!groupCall) {
      return next(createError(404, 'Group call not found'));
    }

    // Check if user has access to this call (must be group member)
    const membership = await GroupMember.findOne({
      where: {
        group_id: groupCall.group_id,
        user_id: userId,
        left_at: null
      }
    });

    if (!membership) {
      return next(createError(403, 'You do not have access to this call'));
    }

    res.status(200).json({
      success: true,
      data: {
        call: groupCall
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Update participant mute status
 * POST /calls/group/:id/participants/:participantId/mute
 */
const updateParticipantMute = async (req, res, next) => {
  try {
    const { id: callId, participantId } = req.params;
    const { muted } = req.body;
    const userId = req.user.id;

    // Find the group call
    const groupCall = await GroupCall.findByPk(callId);
    if (!groupCall) {
      return next(createError(404, 'Group call not found'));
    }

    // Find the participant to update
    const participant = await CallParticipant.findByPk(participantId);
    if (!participant || participant.callId !== callId) {
      return next(createError(404, 'Participant not found in this call'));
    }

    // Check permissions - user can only mute themselves, or host/moderator can mute others
    const requestingParticipant = await CallParticipant.findOne({
      where: { callId, userId }
    });

    if (!requestingParticipant) {
      return next(createError(403, 'You are not a participant in this call'));
    }

    const canMuteOthers = requestingParticipant.role === 'host' || requestingParticipant.role === 'moderator';
    const isSelf = participant.userId === userId;

    if (!isSelf && !canMuteOthers) {
      return next(createError(403, 'You can only mute/unmute yourself'));
    }

    // Update mute status
    await participant.update({ muted: Boolean(muted) });

    // Notify all participants about the mute change
    const allParticipants = await CallParticipant.findAll({
      where: {
        callId,
        status: 'joined'
      },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'username', 'realName']
      }]
    });

    const participantIds = allParticipants.map(p => p.userId);
    socketService.emitToUsers(participantIds, 'participant_mute_updated', {
      callId,
      participantId: participant.id,
      userId: participant.userId,
      muted: participant.muted,
      updatedBy: {
        id: userId,
        username: req.user.username,
        realName: req.user.realName
      },
      timestamp: new Date().toISOString()
    });

    res.status(200).json({
      success: true,
      message: `Participant ${muted ? 'muted' : 'unmuted'} successfully`,
      data: {
        participant: {
          id: participant.id,
          userId: participant.userId,
          muted: participant.muted
        }
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Update participant permissions/role
 * POST /calls/group/:id/participants/:participantId/role
 */
const updateParticipantRole = async (req, res, next) => {
  try {
    const { id: callId, participantId } = req.params;
    const { role } = req.body;
    const userId = req.user.id;

    // Validate role
    if (!['host', 'moderator', 'participant'].includes(role)) {
      return next(createError(400, 'Invalid role. Must be host, moderator, or participant'));
    }

    // Find the group call
    const groupCall = await GroupCall.findByPk(callId);
    if (!groupCall) {
      return next(createError(404, 'Group call not found'));
    }

    // Find the participant to update
    const participant = await CallParticipant.findByPk(participantId);
    if (!participant || participant.callId !== callId) {
      return next(createError(404, 'Participant not found in this call'));
    }

    // Check permissions - only host can change roles
    const requestingParticipant = await CallParticipant.findOne({
      where: { callId, userId }
    });

    if (!requestingParticipant || requestingParticipant.role !== 'host') {
      return next(createError(403, 'Only the call host can update participant roles'));
    }

    // Prevent host from demoting themselves if they're the only host
    if (requestingParticipant.id === participantId && role !== 'host') {
      const hostCount = await CallParticipant.count({
        where: {
          callId,
          role: 'host',
          status: 'joined'
        }
      });

      if (hostCount <= 1) {
        return next(createError(400, 'Cannot demote the only host. Assign another host first'));
      }
    }

    const oldRole = participant.role;
    await participant.update({ role });

    // Notify all participants about the role change
    const allParticipants = await CallParticipant.findAll({
      where: {
        callId,
        status: 'joined'
      },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'username', 'realName']
      }]
    });

    const participantIds = allParticipants.map(p => p.userId);
    socketService.emitToUsers(participantIds, 'participant_role_updated', {
      callId,
      participantId: participant.id,
      userId: participant.userId,
      oldRole,
      newRole: role,
      updatedBy: {
        id: userId,
        username: req.user.username,
        realName: req.user.realName
      },
      timestamp: new Date().toISOString()
    });

    res.status(200).json({
      success: true,
      message: `Participant role updated to ${role}`,
      data: {
        participant: {
          id: participant.id,
          userId: participant.userId,
          oldRole,
          newRole: role
        }
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get call status and participant information
 * GET /calls/group/:id/status
 */
const getCallStatus = async (req, res, next) => {
  try {
    const { id: callId } = req.params;
    const userId = req.user.id;

    const groupCall = await GroupCall.findByPk(callId, {
      include: [{
        model: CallParticipant,
        as: 'callParticipants',
        include: [{
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'email', 'realName', 'profilePicture']
        }]
      }, {
        model: Group,
        as: 'group',
        attributes: ['id', 'name', 'description', 'avatar_url']
      }]
    });

    if (!groupCall) {
      return next(createError(404, 'Group call not found'));
    }

    // Check if user has access to this call
    const membership = await GroupMember.findOne({
      where: {
        group_id: groupCall.group_id,
        user_id: userId,
        left_at: null
      }
    });

    if (!membership) {
      return next(createError(403, 'You do not have access to this call'));
    }

    // Calculate call statistics
    const activeParticipants = groupCall.callParticipants.filter(p => p.status === 'joined');
    const totalParticipants = groupCall.callParticipants.length;
    const callDuration = groupCall.getDuration();

    res.status(200).json({
      success: true,
      data: {
        call: {
          id: groupCall.id,
          status: groupCall.status,
          callType: groupCall.call_type,
          startTime: groupCall.startTime,
          endTime: groupCall.endTime,
          duration: callDuration,
          group: groupCall.group
        },
        participants: {
          active: activeParticipants.length,
          total: totalParticipants,
          list: groupCall.callParticipants.map(p => ({
            id: p.id,
            user: p.user,
            role: p.role,
            status: p.status,
            muted: p.muted,
            videoEnabled: p.video_enabled,
            joinedAt: p.joined_at,
            leftAt: p.left_at,
            connectionQuality: p.connection_quality
          }))
        }
      }
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  createGroupCall,
  joinGroupCall,
  leaveGroupCall,
  endGroupCall,
  getGroupCall,
  updateParticipantMute,
  updateParticipantRole,
  getCallStatus
};
