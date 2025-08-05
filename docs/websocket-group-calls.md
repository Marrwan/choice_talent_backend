# Group Call WebSocket Implementation

This document describes the WebSocket layer implementation for group call functionality.

## Overview

The WebSocket service now handles four main group call events:
- `call:group:create` - Create a new group call
- `call:group:join` - Join an existing group call  
- `call:group:leave` - Leave a group call
- `call:group:end` - End a group call (host only)

## Event Handlers

### 1. `call:group:create`

**Purpose**: Creates a new group call and notifies participants

**Input Data**:
```javascript
{
  groupId: string,           // Required - ID of the group
  callType: string,          // Optional - 'audio' or 'video' (default: 'audio')
  metadata: object,          // Optional - Additional call metadata
  participantIds: array      // Optional - Array of user IDs to invite
}
```

**Behavior**:
- Creates a unique call room ID
- Joins creator to the call room
- Stores call metadata on socket
- Broadcasts `group_call_created` event to participants
- Sends confirmation or error back to creator

**Events Emitted**:
- `group_call_created` (to participants)
- `group_call_create_success` (to creator)
- `group_call_create_error` (to creator on error)

### 2. `call:group:join`

**Purpose**: Allows a user to join an existing group call

**Input Data**:
```javascript
{
  callId: string,            // Required - Call room ID
  groupId: string,           // Required - Group ID
  audioEnabled: boolean,     // Optional - Audio state (default: true)
  videoEnabled: boolean      // Optional - Video state (default: false)
}
```

**Behavior**:
- Joins user to the call room
- Stores call metadata on socket
- Notifies other participants of the join
- Returns current call state to joiner

**Events Emitted**:
- `participant_joined_call` (to other participants)
- `group_call_join_success` (to joiner)
- `group_call_join_error` (to joiner on error)

### 3. `call:group:leave`

**Purpose**: Allows a user to leave a group call

**Input Data**:
```javascript
{
  callId: string,            // Required - Call room ID
  groupId: string            // Required - Group ID
}
```

**Behavior**:
- Removes user from call room
- Notifies other participants
- Ends call if no participants remain
- Clears call metadata from socket

**Events Emitted**:
- `participant_left_call` (to other participants)
- `group_call_ended` (to group if call ends)
- `group_call_leave_success` (to leaver)
- `group_call_leave_error` (to leaver on error)

### 4. `call:group:end`

**Purpose**: Ends a group call (host only)

**Input Data**:
```javascript
{
  callId: string,            // Required - Call room ID
  groupId: string,           // Required - Group ID
  reason: string             // Optional - Reason for ending (default: 'ended_by_host')
}
```

**Behavior**:
- Verifies user is the call host
- Notifies all participants of call end  
- Forces all participants to leave the room
- Clears call metadata from all sockets

**Events Emitted**:
- `group_call_ended` (to all participants and group)
- `group_call_end_success` (to host)
- `group_call_end_error` (to host on error)

## Room Management

### Call Rooms
- Each group call creates a unique room: `group_call_{groupId}_{timestamp}`
- Participants join/leave these rooms for call-specific communication
- Rooms are automatically cleaned up when calls end

### Group Rooms  
- Group-wide notifications use: `group:{groupId}`
- Used for broadcasting call events to all group members
- Managed via `joinGroupRoom()` and `leaveGroupRoom()` methods

## Call State Management

Each socket stores call state in `socket.currentGroupCall`:
```javascript
{
  callRoomId: string,        // Call room identifier
  groupId: string,           // Group identifier
  callType: string,          // 'audio' or 'video'
  role: string,              // 'host' or 'participant'
  status: string,            // 'active', 'joined', etc.
  audioEnabled: boolean,     // Audio state
  videoEnabled: boolean      // Video state
}
```

## Disconnection Handling

When a user disconnects:
- If they were in a group call, other participants are notified
- If the host disconnects, the call is ended automatically
- If the last participant leaves, the call ends
- All call metadata is cleaned up properly

## Error Handling

All handlers include comprehensive error handling:
- Input validation
- Permission checks (host-only operations)
- State verification (user in call, call exists)
- Graceful error responses to clients

## Broadcasting Strategy

Events are broadcast to appropriate channels:
1. **Call participants**: Events within the call room
2. **Group members**: General call notifications to group room
3. **Individual users**: Direct messaging for specific users
4. **Confirmations**: Success/error responses to event originator

## Integration with Existing Controllers

The WebSocket handlers complement the existing REST API controllers:
- `groupCallController.js` handles database operations
- WebSocket handlers manage real-time communication
- Both layers work together for complete call management

## Future Enhancements

Potential improvements:
- Moderator role with host-like permissions
- Call recording events
- Screen sharing events  
- Call quality monitoring
- Participant limit enforcement
- Call scheduling and reminders
