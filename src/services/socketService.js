const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

class SocketService {
  constructor() {
    this.io = null;
    this.connectedUsers = new Map(); // userId -> socketId
    this.userSockets = new Map(); // socketId -> userId
    this.callRooms = new Map(); // callRoomId -> { participants: Set<socketId>, metadata: {} }
    this.socketToCallRoom = new Map(); // socketId -> callRoomId
  }

  /**
   * Initialize Socket.io server
   */
  initialize(server) {
    this.io = new Server(server, {
      cors: {
        origin: [
          'http://localhost:3000',
          'http://localhost:3003',
          'https://myjobhunting.com',
          'https://www.myjobhunting.com',
          process.env.FRONTEND_URL || 'http://localhost:3000'
        ],
        credentials: true
      }
    });

    // Authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        
        if (!token) {
          return next(new Error('Authentication error: No token provided'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findByPk(decoded.userId);
        
        if (!user) {
          return next(new Error('Authentication error: User not found'));
        }

        socket.userId = user.id;
        socket.user = user;
        next();
      } catch (error) {
        next(new Error('Authentication error: Invalid token'));
      }
    });

    // Handle connections
    this.io.on('connection', (socket) => {
      this.handleConnection(socket);
    });

    console.log('Socket.io server initialized');
  }

  /**
   * Handle new socket connection
   */
  handleConnection(socket) {
    const userId = socket.userId;
    
    console.log(`User ${userId} connected with socket ${socket.id}`);
    
    // Store user connection
    this.connectedUsers.set(userId, socket.id);
    this.userSockets.set(socket.id, userId);
    
    // Join user to their personal room
    socket.join(`user:${userId}`);
    
    // Emit user online status
    this.emitUserOnlineStatus(userId, true);
    
    // Handle chat events
    socket.on('join_conversation', (conversationId) => {
      socket.join(`conversation:${conversationId}`);
      console.log(`User ${userId} joined conversation ${conversationId}`);
    });
    
    socket.on('leave_conversation', (conversationId) => {
      socket.leave(`conversation:${conversationId}`);
      console.log(`User ${userId} left conversation ${conversationId}`);
    });
    
    socket.on('send_message', (data) => {
      this.handleSendMessage(socket, data);
    });
    
    socket.on('typing', (data) => {
      this.handleTyping(socket, data);
    });
    
    socket.on('stop_typing', (data) => {
      this.handleStopTyping(socket, data);
    });
    
    socket.on('mark_message_read', (data) => {
      this.handleMarkMessageRead(socket, data);
    });

    // --- Group Call Events ---
    socket.on('call:group:create', (data) => {
      this.handleGroupCallCreate(socket, data);
    });
    
    socket.on('call:group:join', (data) => {
      this.handleGroupCallJoin(socket, data);
    });
    
    socket.on('call:group:leave', (data) => {
      this.handleGroupCallLeave(socket, data);
    });
    
    socket.on('call:group:end', (data) => {
      this.handleGroupCallEnd(socket, data);
    });

    // --- Call Signaling Events ---
    socket.on('initiate-call', (data) => {
      this.handleInitiateCall(socket, data);
    });
    socket.on('initiate-group-call', (data) => {
      this.handleInitiateGroupCall(socket, data);
    });
    socket.on('join-group-call', (data) => {
      this.handleJoinGroupCall(socket, data);
    });
    socket.on('leave-group-call', (data) => {
      this.handleLeaveGroupCall(socket, data);
    });
    socket.on('group-call-signal', (data) => {
      this.handleGroupCallSignaling(socket, data);
    });
    socket.on('add-to-call', (data) => {
      this.handleAddToCall(socket, data);
    });
    socket.on('send-offer', (data) => {
      this.handleSendOffer(socket, data);
    });
    socket.on('send-answer', (data) => {
      this.handleSendAnswer(socket, data);
    });
    socket.on('send-ice-candidate', (data) => {
      this.handleSendIceCandidate(socket, data);
    });
    socket.on('end-call', (data) => {
      this.handleEndCall(socket, data);
    });
    socket.on('reject-call', (data) => {
      this.handleRejectCall(socket, data);
    });
    socket.on('accept-call', (data) => {
      this.handleAcceptCall(socket, data);
    });
    socket.on('call-status-update', (data) => {
      this.handleCallStatusUpdate(socket, data);
    });

    // --- Enhanced WebRTC Multi-Peer Signaling Events ---
    socket.on('webrtc:offer', (data) => {
      this.handleWebRTCOffer(socket, data);
    });
    socket.on('webrtc:answer', (data) => {
      this.handleWebRTCAnswer(socket, data);
    });
    socket.on('webrtc:ice-candidate', (data) => {
      this.handleWebRTCIceCandidate(socket, data);
    });
    socket.on('webrtc:join-room', (data) => {
      this.handleWebRTCJoinRoom(socket, data);
    });
    socket.on('webrtc:leave-room', (data) => {
      this.handleWebRTCLeaveRoom(socket, data);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      this.handleDisconnection(socket);
    });
  }

  /**
   * Handle new message from client
   */
  handleNewMessage(socket, data) {
    const { conversationId, tempMessageId } = data;
    
    // Detailed logging for debugging
    console.log(`\n=== HANDLE NEW MESSAGE ===`);
    console.log(`[Message] User ${socket.userId} (socket: ${socket.id}) sending message`);
    console.log(`[Message] Incoming data:`, JSON.stringify(data, null, 2));
    console.log(`[Message] Target conversation: ${conversationId}`);
    
    const messageData = {
      ...data,
      senderId: socket.userId,
      timestamp: new Date().toISOString()
    };
    
    // Broadcast message to conversation room (excluding sender)
    console.log(`[Message] Broadcasting 'new_message' to conversation:${conversationId}`);
    console.log(`[Message] Message data:`, JSON.stringify(messageData, null, 2));
    socket.to(`conversation:${conversationId}`).emit('new_message', messageData);
    
    // Send confirmation back to sender
    const confirmationData = {
      tempMessageId,
      timestamp: new Date().toISOString()
    };
    console.log(`[Message] Sending confirmation to sender:`, JSON.stringify(confirmationData, null, 2));
    socket.emit('message_sent', confirmationData);
    console.log(`=== END HANDLE NEW MESSAGE ===\n`);
  }

  /**
   * Handle send message event
   */
  async handleSendMessage(socket, data) {
    const { conversationId, content, messageType, tempMessageId } = data;
    
    // Detailed logging for debugging
    console.log(`\n=== HANDLE SEND MESSAGE ===`);
    console.log(`[SendMessage] User ${socket.userId} (socket: ${socket.id}) sending message`);
    console.log(`[SendMessage] Incoming data:`, JSON.stringify(data, null, 2));
    console.log(`[SendMessage] Target conversation: ${conversationId}`);
    
    try {
      // Save message to database
      const { Message, User, MessageAttachment } = require('../models');
      
      const message = await Message.create({
        content,
        message_type: messageType || 'text',
        sender_id: socket.userId,
        conversation_id: conversationId
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
          }
        ]
      });

      // Update conversation's last message
      const { Conversation } = require('../models');
      await Conversation.update(
        { last_message_at: new Date() },
        { where: { id: conversationId } }
      );

      const messageData = {
        message: completeMessage,
        conversationId,
        tempMessageId
      };
      
      // Broadcast message to conversation room (including sender for confirmation)
      console.log(`[SendMessage] Broadcasting 'new_message' to conversation:${conversationId}`);
      console.log(`[SendMessage] Message data:`, JSON.stringify(messageData, null, 2));
      this.io.to(`conversation:${conversationId}`).emit('new_message', messageData);
      
      // Send confirmation back to sender
      const confirmationData = {
        tempMessageId,
        messageId: message.id,
        timestamp: new Date().toISOString()
      };
      console.log(`[SendMessage] Sending confirmation to sender:`, JSON.stringify(confirmationData, null, 2));
      socket.emit('message_sent', confirmationData);
      console.log(`=== END HANDLE SEND MESSAGE ===\n`);
    } catch (error) {
      console.error('[SendMessage] Error saving message:', error);
      // Send error back to sender
      socket.emit('message_error', {
        tempMessageId,
        error: 'Failed to send message'
      });
    }
  }

  /**
   * Handle typing indicator
   */
  handleTyping(socket, data) {
    const { conversationId } = data;
    
    socket.to(`conversation:${conversationId}`).emit('user_typing', {
      userId: socket.userId,
      conversationId,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Handle stop typing indicator
   */
  handleStopTyping(socket, data) {
    const { conversationId } = data;
    
    socket.to(`conversation:${conversationId}`).emit('user_stopped_typing', {
      userId: socket.userId,
      conversationId,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Handle mark message as read
   */
  handleMarkMessageRead(socket, data) {
    const { conversationId, messageId } = data;
    
    socket.to(`conversation:${conversationId}`).emit('message_read', {
      messageId,
      readBy: socket.userId,
      timestamp: new Date().toISOString()
    });
  }

  // --- Call Signaling Handlers ---
  handleInitiateCall(socket, data) {
    const { targetUserId, callType, conversationId, from } = data;
    const fromUserId = socket.userId;
    
    // Detailed logging for debugging
    console.log(`\n=== HANDLE INITIATE CALL ===`);
    console.log(`[Call] User ${fromUserId} (socket: ${socket.id}) initiating ${callType} call to ${targetUserId}`);
    console.log(`[Call] Incoming data:`, JSON.stringify(data, null, 2));
    console.log(`[Call] Target socket ID:`, this.connectedUsers.get(targetUserId) || 'NOT FOUND');
    
    // Forward to target user, including the 'from' object with user details
    const eventData = {
      fromUserId,
      callType,
      conversationId,
      from,
      timestamp: new Date().toISOString()
    };
    
    console.log(`[Call] Emitting 'incoming_call' event with data:`, JSON.stringify(eventData, null, 2));
    const success = this.sendToUser(targetUserId, 'incoming_call', eventData);
    console.log(`[Call] Event emission ${success ? 'SUCCESS' : 'FAILED'} for user ${targetUserId}`);
    console.log(`=== END HANDLE INITIATE CALL ===\n`);
  }
  handleSendOffer(socket, data) {
    const { targetUserId, offer, conversationId } = data;
    const fromUserId = socket.userId;
    
    console.log(`\n=== HANDLE SEND OFFER ===`);
    console.log(`[Call] User ${fromUserId} (socket: ${socket.id}) sending offer to ${targetUserId}`);
    console.log(`[Call] Incoming data:`, JSON.stringify(data, null, 2));
    console.log(`[Call] Target socket ID:`, this.connectedUsers.get(targetUserId) || 'NOT FOUND');
    
    const eventData = {
      fromUserId,
      offer,
      conversationId,
      timestamp: new Date().toISOString()
    };
    
    console.log(`[Call] Emitting 'call_offer_received' event with data:`, JSON.stringify(eventData, null, 2));
    const success = this.sendToUser(targetUserId, 'call_offer_received', eventData);
    console.log(`[Call] Event emission ${success ? 'SUCCESS' : 'FAILED'} for user ${targetUserId}`);
    console.log(`=== END HANDLE SEND OFFER ===\n`);
  }
  handleSendAnswer(socket, data) {
    const { targetUserId, answer, conversationId } = data;
    const fromUserId = socket.userId;
    
    console.log(`\n=== HANDLE SEND ANSWER ===`);
    console.log(`[Call] User ${fromUserId} (socket: ${socket.id}) sending answer to ${targetUserId}`);
    console.log(`[Call] Incoming data:`, JSON.stringify(data, null, 2));
    console.log(`[Call] Target socket ID:`, this.connectedUsers.get(targetUserId) || 'NOT FOUND');
    
    const eventData = {
      fromUserId,
      answer,
      conversationId,
      timestamp: new Date().toISOString()
    };
    
    console.log(`[Call] Emitting 'call_answer_received' event with data:`, JSON.stringify(eventData, null, 2));
    const success = this.sendToUser(targetUserId, 'call_answer_received', eventData);
    console.log(`[Call] Event emission ${success ? 'SUCCESS' : 'FAILED'} for user ${targetUserId}`);
    console.log(`=== END HANDLE SEND ANSWER ===\n`);
  }
  handleSendIceCandidate(socket, data) {
    const { targetUserId, candidate, conversationId } = data;
    const fromUserId = socket.userId;
    this.sendToUser(targetUserId, 'call_ice_candidate_received', {
      fromUserId,
      candidate,
      conversationId,
      timestamp: new Date().toISOString()
    });
  }
  handleEndCall(socket, data) {
    const { targetUserId, conversationId } = data;
    const fromUserId = socket.userId;
    
    console.log(`\n=== HANDLE END CALL ===`);
    console.log(`[Call] User ${fromUserId} (socket: ${socket.id}) ending call with ${targetUserId}`);
    console.log(`[Call] Incoming data:`, JSON.stringify(data, null, 2));
    console.log(`[Call] Target socket ID:`, this.connectedUsers.get(targetUserId) || 'NOT FOUND');
    
    const eventData = {
      fromUserId,
      conversationId,
      timestamp: new Date().toISOString()
    };
    
    console.log(`[Call] Emitting 'call_ended' event with data:`, JSON.stringify(eventData, null, 2));
    const success = this.sendToUser(targetUserId, 'call_ended', eventData);
    console.log(`[Call] Event emission ${success ? 'SUCCESS' : 'FAILED'} for user ${targetUserId}`);
    console.log(`=== END HANDLE END CALL ===\n`);
  }
  handleRejectCall(socket, data) {
    const { targetUserId, conversationId } = data;
    const fromUserId = socket.userId;
    console.log(`[Call] User ${fromUserId} rejecting call from ${targetUserId}`);
    this.sendToUser(targetUserId, 'call_rejected', {
      fromUserId,
      conversationId,
      timestamp: new Date().toISOString()
    });
  }

  handleAcceptCall(socket, data) {
    const { targetUserId, conversationId } = data;
    const fromUserId = socket.userId;
    console.log(`[Call] User ${fromUserId} accepting call from ${targetUserId}`);
    this.sendToUser(targetUserId, 'call_accepted', {
      fromUserId,
      conversationId,
      timestamp: new Date().toISOString()
    });
  }

  handleCallStatusUpdate(socket, data) {
    const { targetUserId, conversationId, status } = data;
    const fromUserId = socket.userId;
    console.log(`[Call] User ${fromUserId} updating call status to ${status}`);
    this.sendToUser(targetUserId, 'call_status_updated', {
      fromUserId,
      conversationId,
      status,
      timestamp: new Date().toISOString()
    });
  }

  // --- Group Call Handlers ---
  handleInitiateGroupCall(socket, data) {
    const { groupId, callType, conversationId, from, participants = [] } = data;
    const fromUserId = socket.userId;
    console.log(`[Group Call] User ${fromUserId} initiating ${callType} group call for group ${groupId}`);

    // Create a call room for this group call
    const callRoomId = `group_call_${groupId}_${Date.now()}`;
    socket.join(callRoomId);

    // Notify all group members except the caller
    participants.forEach(participantId => {
      if (participantId !== fromUserId) {
        this.sendToUser(participantId, 'incoming_group_call', {
          fromUserId,
          groupId,
          callType,
          conversationId,
          from,
          participants,
          callRoomId,
          timestamp: new Date().toISOString()
        });
      }
    });

    // Store call metadata
    socket.currentGroupCall = {
      callRoomId,
      groupId,
      callType,
      participants: [fromUserId],
      initiatedBy: fromUserId
    };
  }

  handleJoinGroupCall(socket, data) {
    const { callRoomId, groupId } = data;
    const userId = socket.userId;
    console.log(`[Group Call] User ${userId} joining group call ${callRoomId}`);
    
    // Join the call room
    socket.join(callRoomId);
    
    // Notify other participants that this user joined
    socket.to(callRoomId).emit('user_joined_group_call', {
      userId,
      callRoomId,
      timestamp: new Date().toISOString()
    });
    
    // Update call metadata
    socket.currentGroupCall = {
      callRoomId,
      groupId,
      userId
    };
  }

  handleLeaveGroupCall(socket, data) {
    const { callRoomId } = data;
    const userId = socket.userId;
    console.log(`[Group Call] User ${userId} leaving group call ${callRoomId}`);
    
    // Leave the call room
    socket.leave(callRoomId);
    
    // Notify other participants that this user left
    socket.to(callRoomId).emit('user_left_group_call', {
      userId,
      callRoomId,
      timestamp: new Date().toISOString()
    });
    
    // Clear call metadata
    delete socket.currentGroupCall;
  }

  handleGroupCallSignaling(socket, data) {
    const { callRoomId, targetUserId, signalType, signalData } = data;
    const fromUserId = socket.userId;
    
    console.log(`[Group Call Signaling] ${signalType} from ${fromUserId} to ${targetUserId}`);
    
    if (targetUserId) {
      // Send to specific user
      this.sendToUser(targetUserId, 'group_call_signal', {
        fromUserId,
        signalType,
        signalData,
        callRoomId,
        timestamp: new Date().toISOString()
      });
    } else {
      // Broadcast to all call participants
      socket.to(callRoomId).emit('group_call_signal', {
        fromUserId,
        signalType,
        signalData,
        callRoomId,
        timestamp: new Date().toISOString()
      });
    }
  }

  handleAddToCall(socket, data) {
    const { targetUserId, callType, conversationId, from, callId } = data;
    const fromUserId = socket.userId;
    console.log(`[Call] User ${fromUserId} adding ${targetUserId} to call ${callId}`);
    
    // Notify the user being added to the call
    this.sendToUser(targetUserId, 'added_to_call', {
      fromUserId,
      callType,
      conversationId,
      from,
      callId,
      timestamp: new Date().toISOString()
    });
  }

  // --- Enhanced WebRTC Multi-Peer Signaling Handlers ---
  
  /**
   * Handle WebRTC join room request
   * Creates or joins a call room for multi-peer connections
   */
  handleWebRTCJoinRoom(socket, data) {
    try {
      const { callRoomId, callType = 'audio', metadata = {} } = data;
      const userId = socket.userId;
      const timestamp = new Date().toISOString();
      
      console.log(`[WebRTC] User ${userId} joining call room ${callRoomId}`);
      
      // Join the socket.io room
      socket.join(callRoomId);
      
      // Initialize call room if it doesn't exist
      if (!this.callRooms.has(callRoomId)) {
        this.callRooms.set(callRoomId, {
          participants: new Set(),
          metadata: {
            callType,
            createdAt: timestamp,
            createdBy: userId,
            ...metadata
          }
        });
      }
      
      // Add socket to call room tracking
      const callRoom = this.callRooms.get(callRoomId);
      callRoom.participants.add(socket.id);
      this.socketToCallRoom.set(socket.id, callRoomId);
      
      // Store call room info on socket
      socket.webrtcCallRoom = {
        callRoomId,
        joinedAt: timestamp,
        callType
      };
      
      // Get existing participants (excluding the joiner)
      const existingParticipants = Array.from(callRoom.participants)
        .filter(socketId => socketId !== socket.id)
        .map(socketId => {
          const participantSocket = this.io.sockets.sockets.get(socketId);
          return participantSocket ? {
            socketId,
            userId: participantSocket.userId,
            username: participantSocket.user?.username,
            realName: participantSocket.user?.realName
          } : null;
        })
        .filter(Boolean);
      
      // Notify existing participants about new joiner
      socket.to(callRoomId).emit('webrtc:participant-joined', {
        callRoomId,
        participant: {
          socketId: socket.id,
          userId,
          username: socket.user.username,
          realName: socket.user.realName
        },
        timestamp
      });
      
      // Send room info and existing participants to the joiner
      socket.emit('webrtc:room-joined', {
        callRoomId,
        participantCount: callRoom.participants.size,
        existingParticipants,
        metadata: callRoom.metadata,
        timestamp
      });
      
      console.log(`[WebRTC] Room ${callRoomId} now has ${callRoom.participants.size} participants`);
      
    } catch (error) {
      console.error(`[WebRTC Error] Join room failed:`, error);
      socket.emit('webrtc:join-room-error', {
        error: 'Failed to join call room',
        details: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
  
  /**
   * Handle WebRTC leave room request
   */
  handleWebRTCLeaveRoom(socket, data) {
    try {
      const { callRoomId } = data;
      const userId = socket.userId;
      const timestamp = new Date().toISOString();
      
      console.log(`[WebRTC] User ${userId} leaving call room ${callRoomId}`);
      
      this.cleanupSocketFromCallRoom(socket, callRoomId);
      
      socket.emit('webrtc:room-left', {
        callRoomId,
        timestamp
      });
      
    } catch (error) {
      console.error(`[WebRTC Error] Leave room failed:`, error);
      socket.emit('webrtc:leave-room-error', {
        error: 'Failed to leave call room',
        details: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
  
  /**
   * Handle WebRTC offer signaling
   */
  handleWebRTCOffer(socket, data) {
    try {
      const { callRoomId, targetSocketId, offer, sdpMid, sdpMLineIndex } = data;
      const fromUserId = socket.userId;
      const timestamp = new Date().toISOString();
      
      console.log(`[WebRTC Signaling] Offer from user ${fromUserId} (${socket.id}) to ${targetSocketId}`);
      
      // Validate that both sockets are in the same call room
      const callRoom = this.callRooms.get(callRoomId);
      if (!callRoom || !callRoom.participants.has(socket.id)) {
        socket.emit('webrtc:signaling-error', {
          error: 'Not in specified call room',
          callRoomId,
          timestamp
        });
        return;
      }
      
      if (!callRoom.participants.has(targetSocketId)) {
        socket.emit('webrtc:signaling-error', {
          error: 'Target participant not in call room',
          callRoomId,
          targetSocketId,
          timestamp
        });
        return;
      }
      
      // Forward offer to target socket
      this.io.to(targetSocketId).emit('webrtc:offer', {
        callRoomId,
        fromSocketId: socket.id,
        fromUserId,
        offer,
        sdpMid,
        sdpMLineIndex,
        timestamp
      });
      
      console.log(`[WebRTC] Offer relayed from ${socket.id} to ${targetSocketId}`);
      
    } catch (error) {
      console.error(`[WebRTC Error] Offer handling failed:`, error);
      socket.emit('webrtc:signaling-error', {
        error: 'Failed to process offer',
        details: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
  
  /**
   * Handle WebRTC answer signaling
   */
  handleWebRTCAnswer(socket, data) {
    try {
      const { callRoomId, targetSocketId, answer } = data;
      const fromUserId = socket.userId;
      const timestamp = new Date().toISOString();
      
      console.log(`[WebRTC Signaling] Answer from user ${fromUserId} (${socket.id}) to ${targetSocketId}`);
      
      // Validate that both sockets are in the same call room
      const callRoom = this.callRooms.get(callRoomId);
      if (!callRoom || !callRoom.participants.has(socket.id)) {
        socket.emit('webrtc:signaling-error', {
          error: 'Not in specified call room',
          callRoomId,
          timestamp
        });
        return;
      }
      
      if (!callRoom.participants.has(targetSocketId)) {
        socket.emit('webrtc:signaling-error', {
          error: 'Target participant not in call room',
          callRoomId,
          targetSocketId,
          timestamp
        });
        return;
      }
      
      // Forward answer to target socket
      this.io.to(targetSocketId).emit('webrtc:answer', {
        callRoomId,
        fromSocketId: socket.id,
        fromUserId,
        answer,
        timestamp
      });
      
      console.log(`[WebRTC] Answer relayed from ${socket.id} to ${targetSocketId}`);
      
    } catch (error) {
      console.error(`[WebRTC Error] Answer handling failed:`, error);
      socket.emit('webrtc:signaling-error', {
        error: 'Failed to process answer',
        details: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
  
  /**
   * Handle WebRTC ICE candidate signaling
   */
  handleWebRTCIceCandidate(socket, data) {
    try {
      const { callRoomId, targetSocketId, candidate, sdpMid, sdpMLineIndex } = data;
      const fromUserId = socket.userId;
      const timestamp = new Date().toISOString();
      
      console.log(`[WebRTC Signaling] ICE candidate from user ${fromUserId} (${socket.id}) to ${targetSocketId}`);
      
      // Validate that both sockets are in the same call room
      const callRoom = this.callRooms.get(callRoomId);
      if (!callRoom || !callRoom.participants.has(socket.id)) {
        socket.emit('webrtc:signaling-error', {
          error: 'Not in specified call room',
          callRoomId,
          timestamp
        });
        return;
      }
      
      // Allow ICE candidates even if target not found (they might have disconnected)
      // But validate that target was at least in the room recently
      if (targetSocketId && !callRoom.participants.has(targetSocketId)) {
        // Still try to send, in case it's a race condition
        console.warn(`[WebRTC] Target ${targetSocketId} not in room, but forwarding ICE candidate anyway`);
      }
      
      // Forward ICE candidate to target socket
      if (targetSocketId) {
        this.io.to(targetSocketId).emit('webrtc:ice-candidate', {
          callRoomId,
          fromSocketId: socket.id,
          fromUserId,
          candidate,
          sdpMid,
          sdpMLineIndex,
          timestamp
        });
        
        console.log(`[WebRTC] ICE candidate relayed from ${socket.id} to ${targetSocketId}`);
      } else {
        // Broadcast to all participants in the room except sender
        socket.to(callRoomId).emit('webrtc:ice-candidate', {
          callRoomId,
          fromSocketId: socket.id,
          fromUserId,
          candidate,
          sdpMid,
          sdpMLineIndex,
          timestamp
        });
        
        console.log(`[WebRTC] ICE candidate broadcasted from ${socket.id} to room ${callRoomId}`);
      }
      
    } catch (error) {
      console.error(`[WebRTC Error] ICE candidate handling failed:`, error);
      socket.emit('webrtc:signaling-error', {
        error: 'Failed to process ICE candidate',
        details: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
  
  /**
   * Clean up socket from call room
   */
  cleanupSocketFromCallRoom(socket, callRoomId = null) {
    try {
      // Get call room ID from socket or parameter
      const roomId = callRoomId || this.socketToCallRoom.get(socket.id);
      
      if (!roomId) {
        return; // Socket not in any call room
      }
      
      const callRoom = this.callRooms.get(roomId);
      if (!callRoom) {
        return; // Room doesn't exist
      }
      
      // Remove socket from room participants
      callRoom.participants.delete(socket.id);
      this.socketToCallRoom.delete(socket.id);
      
      // Leave the socket.io room
      socket.leave(roomId);
      
      // Notify other participants about the departure
      socket.to(roomId).emit('webrtc:participant-left', {
        callRoomId: roomId,
        participant: {
          socketId: socket.id,
          userId: socket.userId,
          username: socket.user?.username,
          realName: socket.user?.realName
        },
        timestamp: new Date().toISOString()
      });
      
      // Clean up empty room
      if (callRoom.participants.size === 0) {
        this.callRooms.delete(roomId);
        console.log(`[WebRTC] Call room ${roomId} cleaned up (empty)`);
      }
      
      // Clear socket's call room info
      delete socket.webrtcCallRoom;
      
      console.log(`[WebRTC] Socket ${socket.id} cleaned up from room ${roomId}`);
      
    } catch (error) {
      console.error(`[WebRTC Error] Cleanup failed:`, error);
    }
  }

  // --- New Group Call Socket Handlers ---
  
  /**
   * Handle group call creation event
   * Event: call:group:create
   */
  async handleGroupCallCreate(socket, data) {
    try {
      const { groupId, callType = 'audio', metadata = {}, participantIds = [] } = data;
      const userId = socket.userId;
      const timestamp = new Date().toISOString();
      
      console.log(`[Socket] User ${userId} creating group call for group ${groupId}`);
      
      // Create a unique call room ID
      const callRoomId = `group_call_${groupId}_${Date.now()}`;
      
      // Join the creator to the call room
      socket.join(callRoomId);
      
      // Store call metadata on socket
      socket.currentGroupCall = {
        callRoomId,
        groupId,
        callType,
        role: 'host',
        status: 'active'
      };
      
      // Broadcast call creation to all group members
      if (participantIds && participantIds.length > 0) {
        const callData = {
          callId: callRoomId,
          groupId,
          callType,
          createdBy: {
            id: userId,
            username: socket.user.username,
            realName: socket.user.realName
          },
          metadata,
          timestamp
        };
        
        // Notify all participants except the creator
        const inviteList = participantIds.filter(id => id !== userId);
        this.emitToUsers(inviteList, 'group_call_created', callData);
        
        // Also broadcast to group room if it exists
        this.io.to(`group:${groupId}`).emit('group_call_created', callData);
      }
      
      // Send confirmation back to creator
      socket.emit('group_call_create_success', {
        callId: callRoomId,
        groupId,
        callType,
        status: 'created',
        timestamp
      });
      
    } catch (error) {
      console.error(`[Socket Error] Group call creation failed:`, error);
      socket.emit('group_call_create_error', {
        error: 'Failed to create group call',
        details: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
  
  /**
   * Handle group call join event
   * Event: call:group:join
   */
  async handleGroupCallJoin(socket, data) {
    try {
      const { callId, groupId, audioEnabled = true, videoEnabled = false } = data;
      const userId = socket.userId;
      const timestamp = new Date().toISOString();
      
      console.log(`[Socket] User ${userId} joining group call ${callId}`);
      
      // Join the call room
      socket.join(callId);
      
      // Store call metadata on socket
      socket.currentGroupCall = {
        callRoomId: callId,
        groupId,
        role: 'participant',
        status: 'joined',
        audioEnabled,
        videoEnabled,
        joinedAt: timestamp
      };
      
      const participantData = {
        userId,
        username: socket.user.username,
        realName: socket.user.realName,
        audioEnabled,
        videoEnabled,
        muted: !audioEnabled,
        videoEnabled,
        joinedAt: timestamp
      };
      
      // Track join time in database (via API call would be better, but for real-time tracking)
      this.trackParticipantJoin(callId, userId, participantData);
      
      // Notify other participants in the call
      socket.to(callId).emit('participant_joined_call', {
        callId,
        groupId,
        participant: participantData,
        timestamp
      });
      
      // Get current participants count for the joiner
      const room = this.io.sockets.adapter.rooms.get(callId);
      const participantCount = room ? room.size : 1;
      
      // Send confirmation back to joiner with current call state
      socket.emit('group_call_join_success', {
        callId,
        groupId,
        participantCount,
        yourParticipantData: participantData,
        timestamp
      });
      
    } catch (error) {
      console.error(`[Socket Error] Group call join failed:`, error);
      socket.emit('group_call_join_error', {
        error: 'Failed to join group call',
        details: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
  
  /**
   * Handle group call leave event
   * Event: call:group:leave
   */
  async handleGroupCallLeave(socket, data) {
    try {
      const { callId, groupId } = data;
      const userId = socket.userId;
      const timestamp = new Date().toISOString();
      
      console.log(`[Socket] User ${userId} leaving group call ${callId}`);
      
      // Get current call metadata
      const currentCall = socket.currentGroupCall;
      
      if (!currentCall || currentCall.callRoomId !== callId) {
        socket.emit('group_call_leave_error', {
          error: 'Not currently in this call',
          timestamp
        });
        return;
      }
      
      // Leave the call room
      socket.leave(callId);
      
      const participantData = {
        userId,
        username: socket.user.username,
        realName: socket.user.realName,
        leftAt: timestamp
      };
      
      // Notify other participants
      socket.to(callId).emit('participant_left_call', {
        callId,
        groupId,
        participant: participantData,
        timestamp
      });
      
      // Check if this was the last participant
      const room = this.io.sockets.adapter.rooms.get(callId);
      const remainingParticipants = room ? room.size : 0;
      
      // If no participants left, broadcast call ended
      if (remainingParticipants === 0) {
        this.io.to(`group:${groupId}`).emit('group_call_ended', {
          callId,
          groupId,
          reason: 'no_participants',
          endedBy: participantData,
          timestamp
        });
      }
      
      // Clear call metadata
      delete socket.currentGroupCall;
      
      // Send confirmation back to leaver
      socket.emit('group_call_leave_success', {
        callId,
        groupId,
        remainingParticipants,
        callEnded: remainingParticipants === 0,
        timestamp
      });
      
    } catch (error) {
      console.error(`[Socket Error] Group call leave failed:`, error);
      socket.emit('group_call_leave_error', {
        error: 'Failed to leave group call',
        details: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
  
  /**
   * Handle group call end event  
   * Event: call:group:end
   */
  async handleGroupCallEnd(socket, data) {
    try {
      const { callId, groupId, reason = 'ended_by_host' } = data;
      const userId = socket.userId;
      const timestamp = new Date().toISOString();
      
      console.log(`[Socket] User ${userId} ending group call ${callId}`);
      
      // Get current call metadata to verify permissions
      const currentCall = socket.currentGroupCall;
      
      if (!currentCall || currentCall.callRoomId !== callId) {
        socket.emit('group_call_end_error', {
          error: 'Not currently in this call',
          timestamp
        });
        return;
      }
      
      // Check if user has permission to end call (host only for now)
      if (currentCall.role !== 'host') {
        socket.emit('group_call_end_error', {
          error: 'Only the call host can end the call',
          timestamp
        });
        return;
      }
      
      const endedByData = {
        userId,
        username: socket.user.username,
        realName: socket.user.realName
      };
      
      // Get all participants before ending the call
      const room = this.io.sockets.adapter.rooms.get(callId);
      const participantCount = room ? room.size : 0;
      
      // Notify all participants that the call is ending
      this.io.to(callId).emit('group_call_ended', {
        callId,
        groupId,
        reason,
        endedBy: endedByData,
        participantCount,
        timestamp
      });
      
      // Force all participants to leave the room
      if (room) {
        for (const socketId of room) {
          const participantSocket = this.io.sockets.sockets.get(socketId);
          if (participantSocket) {
            participantSocket.leave(callId);
            // Clear their call metadata
            delete participantSocket.currentGroupCall;
          }
        }
      }
      
      // Also notify the group room
      this.io.to(`group:${groupId}`).emit('group_call_ended', {
        callId,
        groupId,
        reason,
        endedBy: endedByData,
        participantCount,
        timestamp
      });
      
      // Send confirmation back to the host
      socket.emit('group_call_end_success', {
        callId,
        groupId,
        participantsNotified: participantCount,
        timestamp
      });
      
    } catch (error) {
      console.error(`[Socket Error] Group call end failed:`, error);
      socket.emit('group_call_end_error', {
        error: 'Failed to end group call',
        details: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Emit user online/offline status
   */
  emitUserOnlineStatus(userId, isOnline) {
    this.io.emit('user_status_changed', {
      userId,
      isOnline,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Send message to specific user
   */
  sendToUser(userId, event, data) {
    const socketId = this.connectedUsers.get(userId);
    console.log(`[SendToUser] Attempting to send '${event}' to user ${userId}, socket: ${socketId || 'NOT FOUND'}`);
    console.log(`[SendToUser] Current connected users:`, Array.from(this.connectedUsers.entries()));
    console.log(`[SendToUser] Event data:`, JSON.stringify(data, null, 2));
    
    if (socketId) {
      console.log(`[SendToUser] Emitting '${event}' to socket ${socketId}`);
      console.log(`[SendToUser] Using personal room: user:${userId}`);
      
      // Send to both socketId directly and personal room for redundancy
      this.io.to(socketId).emit(event, data);
      this.io.to(`user:${userId}`).emit(event, data);
      
      console.log(`[SendToUser] Successfully sent '${event}' to user ${userId}`);
      return true;
    }
    
    console.log(`[SendToUser] FAILED to send '${event}' to user ${userId} - user not connected`);
    return false;
  }

  /**
   * Emit message to a specific user (alias for sendToUser)
   */
  emitToUser(userId, event, data) {
    return this.sendToUser(userId, event, data);
  }

  /**
   * Emit message to multiple users
   */
  emitToUsers(userIds, event, data) {
    let successCount = 0;
    userIds.forEach(userId => {
      if (this.sendToUser(userId, event, data)) {
        successCount++;
      }
    });
    return successCount;
  }

  /**
   * Send message to conversation room
   */
  sendToConversation(conversationId, event, data) {
    this.io.to(`conversation:${conversationId}`).emit(event, data);

    // For new_message event, also notify users not in the conversation room
    if (event === 'new_message' && data && data.message && data.conversationId) {
      const message = data.message;
      const conversationId = data.conversationId;
      const participants = [message.senderId];
      if (message.conversation && message.conversation.participant1Id && message.conversation.participant2Id) {
        participants.push(message.conversation.participant1Id, message.conversation.participant2Id);
      } else if (message.participant1Id && message.participant2Id) {
        participants.push(message.participant1Id, message.participant2Id);
      }
      // Remove sender from notification
      const notifyUsers = [...new Set(participants)].filter(id => id !== message.senderId);
      notifyUsers.forEach(userId => {
        // If user is online, emit notification to their personal room
        if (this.isUserOnline(userId)) {
          this.io.to(`user:${userId}`).emit('new_message_notification', {
            conversationId,
            message,
            timestamp: new Date().toISOString()
          });
        }
      });
    }
  }

  /**
   * Send message to group room
   */
  sendToGroup(groupId, event, data) {
    this.io.to(`group:${groupId}`).emit(event, data);
  }

  /**
   * Join user to group room for group-wide notifications
   */
  joinGroupRoom(userId, groupId) {
    const socketId = this.connectedUsers.get(userId);
    if (socketId) {
      const socket = this.io.sockets.sockets.get(socketId);
      if (socket) {
        socket.join(`group:${groupId}`);
        console.log(`User ${userId} joined group room ${groupId}`);
        return true;
      }
    }
    return false;
  }

  /**
   * Leave user from group room
   */
  leaveGroupRoom(userId, groupId) {
    const socketId = this.connectedUsers.get(userId);
    if (socketId) {
      const socket = this.io.sockets.sockets.get(socketId);
      if (socket) {
        socket.leave(`group:${groupId}`);
        console.log(`User ${userId} left group room ${groupId}`);
        return true;
      }
    }
    return false;
  }

  /**
   * Broadcast message to all connected users
   */
  broadcast(event, data) {
    this.io.emit(event, data);
  }

  /**
   * Get online users
   */
  getOnlineUsers() {
    return Array.from(this.connectedUsers.keys());
  }

  /**
   * Check if user is online
   */
  isUserOnline(userId) {
    return this.connectedUsers.has(userId);
  }

  /**
   * Handle user disconnection
   */
  handleDisconnection(socket) {
    const userId = this.userSockets.get(socket.id);
    
    if (userId) {
      console.log(`User ${userId} disconnected`);
      
      // Handle group call cleanup if user was in a call
      if (socket.currentGroupCall) {
        const { callRoomId, groupId, role } = socket.currentGroupCall;
        const timestamp = new Date().toISOString();
        
        console.log(`[Socket] User ${userId} disconnected from group call ${callRoomId}`);
        
        const participantData = {
          userId,
          username: socket.user ? socket.user.username : 'Unknown',
          realName: socket.user ? socket.user.realName : 'Unknown',
          leftAt: timestamp,
          reason: 'disconnected'
        };
        
        // Notify other participants that this user left due to disconnection
        socket.to(callRoomId).emit('participant_left_call', {
          callId: callRoomId,
          groupId,
          participant: participantData,
          timestamp
        });
        
        // Leave the call room
        socket.leave(callRoomId);
        
        // Check if this was the last participant or the host
        const room = this.io.sockets.adapter.rooms.get(callRoomId);
        const remainingParticipants = room ? room.size : 0;
        
        // If no participants left or host disconnected, end the call
        if (remainingParticipants === 0 || role === 'host') {
          this.io.to(callRoomId).emit('group_call_ended', {
            callId: callRoomId,
            groupId,
            reason: role === 'host' ? 'host_disconnected' : 'no_participants',
            endedBy: participantData,
            timestamp
          });
          
          // Also notify the group room
          this.io.to(`group:${groupId}`).emit('group_call_ended', {
            callId: callRoomId,
            groupId,
            reason: role === 'host' ? 'host_disconnected' : 'no_participants',
            endedBy: participantData,
            timestamp
          });
          
          // Clean up all remaining participants' call metadata
          if (room) {
            for (const socketId of room) {
              const participantSocket = this.io.sockets.sockets.get(socketId);
              if (participantSocket) {
                delete participantSocket.currentGroupCall;
                participantSocket.leave(callRoomId);
              }
            }
          }
        }
        
        // Clear the disconnected user's call metadata
        delete socket.currentGroupCall;
      }
      
      // Handle WebRTC call room cleanup if user was in a WebRTC call
      if (socket.webrtcCallRoom || this.socketToCallRoom.has(socket.id)) {
        console.log(`[WebRTC] User ${userId} disconnected from WebRTC call room`);
        this.cleanupSocketFromCallRoom(socket);
      }
      
      // Remove user from connected users
      this.connectedUsers.delete(userId);
      this.userSockets.delete(socket.id);
      
      // Emit user offline status
      this.emitUserOnlineStatus(userId, false);
    }
  }

  /**
   * Track participant join event (could integrate with database)
   */
  trackParticipantJoin(callId, userId, participantData) {
    // This could make a direct database call or emit to an internal event
    // For now, we'll just log it, but this is where you'd persist the join time
    console.log(`[Participant Tracking] User ${userId} joined call ${callId} at ${participantData.joinedAt}`);
    
    // In a production system, you might do something like:
    // await this.updateParticipantStatus(callId, userId, 'joined', participantData.joinedAt);
  }
  
  /**
   * Track participant leave event (could integrate with database)
   */
  trackParticipantLeave(callId, userId, leftAt) {
    console.log(`[Participant Tracking] User ${userId} left call ${callId} at ${leftAt}`);
    
    // In a production system, you might do something like:
    // await this.updateParticipantStatus(callId, userId, 'left', null, leftAt);
  }
  
  /**
   * Track mute/unmute events
   */
  trackMuteEvent(callId, userId, muted, updatedBy) {
    console.log(`[Mute Tracking] User ${userId} ${muted ? 'muted' : 'unmuted'} in call ${callId} by ${updatedBy}`);
  }
  
  /**
   * Track permission/role changes
   */
  trackRoleChange(callId, userId, oldRole, newRole, updatedBy) {
    console.log(`[Role Tracking] User ${userId} role changed from ${oldRole} to ${newRole} in call ${callId} by ${updatedBy}`);
  }

  /**
   * Get socket instance
   */
  getSocket() {
    return this.io;
  }
}

// Export singleton instance
const socketService = new SocketService();
module.exports = socketService;
