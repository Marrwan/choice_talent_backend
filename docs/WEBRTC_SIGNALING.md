# WebRTC Multi-Peer Signaling Implementation

## Overview

The backend now supports enhanced WebRTC multi-peer signaling through Socket.IO with proper call room management and message relay capabilities. This implementation allows multiple participants to establish WebRTC connections through a centralized signaling server.

## Key Features

### 1. Call Room Management
- **Room Creation**: Automatic creation of call rooms when users join
- **Participant Tracking**: Maintains active participant lists per room using Set data structures
- **Metadata Storage**: Stores room metadata including call type, creation time, and creator info
- **Automatic Cleanup**: Removes empty rooms and cleans up disconnected participants

### 2. Signaling Message Types

#### Offer Messages (`webrtc:offer`)
- Relays WebRTC offers between specific participants
- Validates both sender and receiver are in the same call room
- Includes SDP information and metadata

#### Answer Messages (`webrtc:answer`) 
- Relays WebRTC answers between specific participants
- Room validation ensures secure message delivery
- Maintains connection state information

#### ICE Candidate Messages (`webrtc:ice-candidate`)
- Supports both targeted and broadcast ICE candidate delivery
- Handles race conditions for disconnected participants
- Includes SDP line index and media ID for proper connection establishment

### 3. Room Operations

#### Join Room (`webrtc:join-room`)
- Creates or joins existing call rooms
- Notifies existing participants of new joiners
- Returns participant list and room metadata to new joiners

#### Leave Room (`webrtc:leave-room`)
- Graceful removal from call rooms
- Notifies remaining participants of departure
- Automatic cleanup of empty rooms

## Data Structures

### Call Rooms Map
```javascript
callRooms: Map<string, {
  participants: Set<string>,  // Set of socket IDs
  metadata: {
    callType: string,
    createdAt: string,
    createdBy: string,
    // Additional metadata...
  }
}>
```

### Socket to Room Mapping
```javascript
socketToCallRoom: Map<string, string>  // socketId -> callRoomId
```

## Socket Events

### Client to Server Events

| Event | Description | Data |
|-------|-------------|------|
| `webrtc:join-room` | Join or create a call room | `{ callRoomId, callType?, metadata? }` |
| `webrtc:leave-room` | Leave a call room | `{ callRoomId }` |
| `webrtc:offer` | Send WebRTC offer | `{ callRoomId, targetSocketId, offer, sdpMid?, sdpMLineIndex? }` |
| `webrtc:answer` | Send WebRTC answer | `{ callRoomId, targetSocketId, answer }` |
| `webrtc:ice-candidate` | Send ICE candidate | `{ callRoomId, targetSocketId?, candidate, sdpMid?, sdpMLineIndex? }` |

### Server to Client Events

| Event | Description | Data |
|-------|-------------|------|
| `webrtc:room-joined` | Confirmation of room join | `{ callRoomId, participantCount, existingParticipants, metadata }` |
| `webrtc:room-left` | Confirmation of room leave | `{ callRoomId }` |
| `webrtc:participant-joined` | New participant joined | `{ callRoomId, participant }` |
| `webrtc:participant-left` | Participant left | `{ callRoomId, participant }` |
| `webrtc:offer` | Received WebRTC offer | `{ callRoomId, fromSocketId, fromUserId, offer, ... }` |
| `webrtc:answer` | Received WebRTC answer | `{ callRoomId, fromSocketId, fromUserId, answer }` |
| `webrtc:ice-candidate` | Received ICE candidate | `{ callRoomId, fromSocketId, fromUserId, candidate, ... }` |
| `webrtc:signaling-error` | Signaling error occurred | `{ error, details?, timestamp }` |

## Error Handling

### Validation Checks
- **Room Membership**: Validates both sender and receiver are in the specified room
- **Authentication**: All participants must be authenticated users
- **Message Format**: Validates required fields in signaling messages

### Error Responses
- **Room Not Found**: When attempting to signal in non-existent rooms
- **Participant Not Found**: When targeting non-existent participants
- **Invalid Message**: When signaling data is malformed

## Integration with Existing Features

### Compatibility
- Works alongside existing group call functionality
- Maintains compatibility with legacy signaling events
- Preserves existing authentication and user management

### Cleanup Integration
- Integrates with existing disconnect handlers
- Maintains consistent state across different call types
- Proper resource cleanup on unexpected disconnections

## Usage Example

### Client-Side Implementation
```javascript
// Join a call room
socket.emit('webrtc:join-room', {
  callRoomId: 'call_123',
  callType: 'video',
  metadata: { groupId: 'group_456' }
});

// Send an offer
socket.emit('webrtc:offer', {
  callRoomId: 'call_123',
  targetSocketId: 'socket_789',
  offer: rtcPeerConnection.localDescription
});

// Handle incoming offers
socket.on('webrtc:offer', async (data) => {
  await rtcPeerConnection.setRemoteDescription(data.offer);
  const answer = await rtcPeerConnection.createAnswer();
  
  socket.emit('webrtc:answer', {
    callRoomId: data.callRoomId,
    targetSocketId: data.fromSocketId,
    answer: answer
  });
});
```

## Monitoring and Logging

### Debug Information
- All signaling events are logged with participant details
- Room state changes are tracked and logged
- Connection and disconnection events include cleanup information

### Performance Metrics
- Participant count per room
- Message relay statistics
- Room lifecycle tracking

## Security Considerations

### Authentication
- All WebRTC signaling requires authenticated Socket.IO connections
- JWT token validation on initial connection
- User identity verification for all signaling messages

### Room Isolation
- Participants can only signal within rooms they've joined
- Cross-room signaling is prevented and logged as errors
- Automatic cleanup prevents resource leaks

## Future Enhancements

### Potential Improvements
- Room-level permissions and moderation
- Bandwidth optimization for large groups
- Recording and analytics integration
- Advanced error recovery mechanisms
- Load balancing for high-traffic scenarios

## Testing

The implementation has been tested for:
- ✅ Basic room management operations
- ✅ Signaling message relay functionality  
- ✅ Participant join/leave scenarios
- ✅ Cleanup and resource management
- ✅ Error handling and validation
- ✅ Integration with existing features

This enhanced WebRTC signaling system provides a robust foundation for multi-peer video/audio calling functionality in the application.
