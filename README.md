# Event Connection API Documentation

## Base URL

`http://localhost:3000`

## Authentication

Most endpoints require authentication using a JWT token.

**Authentication Header Format:**

```
Authorization: Bearer <your_access_token>
```

---

## Table of Contents

1. [Authentication](#1-authentication)
2. [Events](#2-events)
3. [Participants](#3-participants)
4. [Lobbies](#4-lobbies)
5. [Attendance](#5-attendance)
6. [Friends](#6-friends)
7. [Chat](#7-chat)
8. [Filters](#8-filters)
9. [Admin](#9-admin)

---

## 1. Authentication

### Register User

```
POST /user/signup
```

**Request Body:**

```json
{
  "email": "example@email.com",
  "password": "SecurePassword123",
  "role": "participant" // "participant", "organizer", or "admin"
}
```

**Response:**

```json
{
  "message": "Your Account Created Successfully",
  "payload": {
    "_id": "user_id",
    "email": "example@email.com",
    "role": "participant"
  }
}
```

### Login

```
POST /user/login
```

**Request Body:**

```json
{
  "email": "example@email.com",
  "password": "SecurePassword123"
}
```

**Response:**

```json
{
  "message": "Login successful",
  "accessToken": "jwt_access_token",
  "refreshToken": "jwt_refresh_token",
  "user": {
    "id": "user_id",
    "email": "example@email.com",
    "role": "participant"
  }
}
```

### Refresh Token

```
POST /user/refresh
```

**Request:**
The refresh token should be in the cookies.

**Response:**

```json
{
  "accessToken": "new_access_token"
}
```

### Logout

```
POST /user/logout
```

**Response:**
204 No Content

---

## 2. Events

### Create Event

```
POST /events
```

_Requires Authentication_

**Request Body:**

```json
{
  "name": "Tech Conference 2025",
  "description": "Annual technology conference with speakers from around the world",
  "location": "Bengaluru Convention Center",
  "imageUrl": "https://example.com/event-image.jpg",
  "startDate": "2025-06-15T09:00:00.000Z",
  "endDate": "2025-06-17T18:00:00.000Z",
  "category": ["Technology", "Networking"]
}
```

**Response:**

```json
{
  "success": true,
  "message": "Friend request rejected",
  "data": {
    "_id": "friend_request_id",
    "requester": "user_id_requester",
    "recipient": "user_id_recipient",
    "status": "rejected",
    "eventId": "event_id",
    "lobbyId": "lobby_id",
    "lastInteraction": "2025-06-15T12:35:00.000Z",
    "createdAt": "2025-06-15T12:30:00.000Z",
    "updatedAt": "2025-06-15T12:35:00.000Z"
  }
}
```

### Block User

```
POST /friends/block/:userId
```

_Requires Authentication_

**Response:**

```json
{
  "success": true,
  "message": "User has been blocked",
  "data": {
    "_id": "block_relationship_id",
    "requester": "user_id_blocker",
    "recipient": "user_id_blocked",
    "status": "blocked",
    "eventId": "event_id",
    "lobbyId": "lobby_id",
    "lastInteraction": "2025-06-15T12:45:00.000Z"
  }
}
```

### Unblock User

```
DELETE /friends/unblock/:userId
```

_Requires Authentication_

**Response:**

```json
{
  "success": true,
  "message": "User has been unblocked"
}
```

### Get Friend Requests

```
GET /friends/requests
```

_Requires Authentication_

**Response:**

```json
{
  "success": true,
  "data": {
    "received": [
      {
        "_id": "friend_request_id_1",
        "requester": {
          "_id": "user_id_1",
          "name": "John Doe",
          "email": "john@example.com"
        },
        "recipient": "user_id_current",
        "status": "pending",
        "eventId": "event_id",
        "lobbyId": "lobby_id",
        "createdAt": "2025-06-15T12:30:00.000Z",
        "updatedAt": "2025-06-15T12:30:00.000Z"
      }
    ],
    "sent": [
      {
        "_id": "friend_request_id_2",
        "requester": "user_id_current",
        "recipient": {
          "_id": "user_id_2",
          "name": "Jane Smith",
          "email": "jane@example.com"
        },
        "status": "pending",
        "eventId": "event_id",
        "lobbyId": "lobby_id",
        "createdAt": "2025-06-15T12:35:00.000Z",
        "updatedAt": "2025-06-15T12:35:00.000Z"
      }
    ]
  }
}
```

### Get Friends List

```
GET /friends
```

_Requires Authentication_

**Response:**

```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "friendshipId": "friendship_id_1",
      "friend": {
        "_id": "user_id_1",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "eventId": "event_id",
      "lobbyId": "lobby_id",
      "since": "2025-06-15T12:35:00.000Z"
    },
    {
      "friendshipId": "friendship_id_2",
      "friend": {
        "_id": "user_id_2",
        "name": "Jane Smith",
        "email": "jane@example.com"
      },
      "eventId": "event_id",
      "lobbyId": "lobby_id",
      "since": "2025-06-14T16:20:00.000Z"
    }
  ]
}
```

### Get Blocked Users

```
GET /friends/blocked
```

_Requires Authentication_

**Response:**

```json
{
  "success": true,
  "count": 1,
  "data": [
    {
      "_id": "block_relationship_id",
      "requester": "user_id_current",
      "recipient": {
        "_id": "user_id_blocked",
        "name": "Blocked User",
        "email": "blocked@example.com"
      },
      "status": "blocked",
      "eventId": "event_id",
      "lobbyId": "lobby_id",
      "lastInteraction": "2025-06-15T12:45:00.000Z"
    }
  ]
}
```

### Get Potential Friends

```
GET /friends/potential/:lobbyId
```

_Requires Authentication_

**Response:**

```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "user_id_1",
      "name": "Potential Friend 1",
      "email": "potential1@example.com"
    },
    {
      "_id": "user_id_2",
      "name": "Potential Friend 2",
      "email": "potential2@example.com"
    }
  ]
}
```

### Remove Friend

```
DELETE /friends/:friendshipId
```

_Requires Authentication_

**Response:**

```json
{
  "success": true,
  "message": "Friend removed successfully"
}
```

### Check Friendship Status

```
GET /friends/status/:otherUserId
```

_Requires Authentication_

**Response:**

```json
{
  "success": true,
  "data": {
    "status": "accepted",
    "connectionId": "friendship_id",
    "message": "You are friends with this user"
  }
}
```

---

## 7. Chat

### Get Conversations

```
GET /chat/conversations
```

_Requires Authentication_

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "_id": "conversation_id_1",
      "participants": [
        {
          "_id": "user_id_current",
          "name": "Current User",
          "email": "current@example.com"
        },
        {
          "_id": "user_id_other",
          "name": "Other User",
          "email": "other@example.com"
        }
      ],
      "lastMessage": {
        "_id": "message_id",
        "sender": "user_id_other",
        "content": "Hello, how are you?",
        "timestamp": "2025-06-15T14:30:00.000Z",
        "read": false
      },
      "unreadCount": 1,
      "createdAt": "2025-06-15T14:00:00.000Z",
      "updatedAt": "2025-06-15T14:30:00.000Z"
    }
    // More conversations...
  ]
}
```

### Get Messages for a Conversation

```
GET /chat/conversations/:conversationId/messages
```

_Requires Authentication_

**Response:**

```json
{
  "success": true,
  "data": {
    "conversation": {
      "_id": "conversation_id",
      "participants": [
        {
          "_id": "user_id_current",
          "name": "Current User",
          "email": "current@example.com"
        },
        {
          "_id": "user_id_other",
          "name": "Other User",
          "email": "other@example.com"
        }
      ]
    },
    "messages": [
      {
        "_id": "message_id_1",
        "conversation": "conversation_id",
        "sender": {
          "_id": "user_id_current",
          "name": "Current User"
        },
        "content": "Hi there!",
        "timestamp": "2025-06-15T14:20:00.000Z",
        "read": true
      },
      {
        "_id": "message_id_2",
        "conversation": "conversation_id",
        "sender": {
          "_id": "user_id_other",
          "name": "Other User"
        },
        "content": "Hello, how are you?",
        "timestamp": "2025-06-15T14:30:00.000Z",
        "read": false
      }
    ]
  }
}
```

### Create a New Conversation

```
POST /chat/conversations
```

_Requires Authentication_

**Request Body:**

```json
{
  "participantIds": ["user_id_other"]
}
```

**Response:**

```json
{
  "success": true,
  "message": "Conversation created successfully",
  "data": {
    "conversation": {
      "_id": "conversation_id",
      "participants": [
        {
          "_id": "user_id_current",
          "name": "Current User",
          "email": "current@example.com"
        },
        {
          "_id": "user_id_other",
          "name": "Other User",
          "email": "other@example.com"
        }
      ],
      "createdAt": "2025-06-15T15:00:00.000Z",
      "updatedAt": "2025-06-15T15:00:00.000Z"
    }
  }
}
```

### Send a Message

```
POST /chat/conversations/:conversationId/messages
```

_Requires Authentication_

**Request Body:**

```json
{
  "content": "Hello, nice to meet you!"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Message sent successfully",
  "data": {
    "_id": "message_id",
    "conversation": "conversation_id",
    "sender": "user_id_current",
    "content": "Hello, nice to meet you!",
    "timestamp": "2025-06-15T15:10:00.000Z",
    "read": false
  }
}
```

### Mark Messages as Read

```
PUT /chat/conversations/:conversationId/read
```

_Requires Authentication_

**Response:**

```json
{
  "success": true,
  "message": "Messages marked as read",
  "data": {
    "conversationId": "conversation_id",
    "markedCount": 3
  }
}
```

### Delete a Conversation

```
DELETE /chat/conversations/:conversationId
```

_Requires Authentication_

**Response:**

```json
{
  "success": true,
  "message": "Conversation deleted successfully"
}
```

### Get Unread Message Count

```
GET /chat/unread
```

_Requires Authentication_

**Response:**

```json
{
  "success": true,
  "data": {
    "total": 5,
    "conversations": [
      {
        "conversationId": "conversation_id_1",
        "unread": 3
      },
      {
        "conversationId": "conversation_id_2",
        "unread": 2
      }
    ]
  }
}
```

---

## 8. Filters

### Filter by Category

```
GET /filter/:category
```

_Requires Authentication_

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "_id": "event_id_1",
      "name": "Tech Conference 2025",
      "description": "Annual technology conference with speakers from around the world",
      "location": "Bengaluru Convention Center",
      "imageUrl": "https://example.com/event-image.jpg",
      "category": ["Technology", "Networking"],
      "startDate": "2025-06-15T09:00:00.000Z",
      "endDate": "2025-06-17T18:00:00.000Z",
      "createdBy": "user_id",
      "participantCount": 0
    }
    // More events in the specified category...
  ]
}
```

---

## 9. Admin

### Manual Lobby Cleanup

```
POST /admin/cleanup-lobbies
```

_Requires Admin Authentication_

**Response:**

```json
{
  "success": true,
  "message": "Lobby cleanup task executed successfully"
}
```

---

## Socket.IO Events

### Connection

```javascript
socket.on("connect", () => {
  // Connected to the Socket.IO server
});
```

### Authentication

```javascript
socket.emit("authenticate", { token: "jwt_access_token" });
```

### Join Room (for real-time chat)

```javascript
socket.emit("join_room", { conversationId: "conversation_id" });
```

### New Message

```javascript
socket.on("new_message", (message) => {
  // Handle incoming message
  /*
  message = {
    _id: 'message_id',
    conversation: 'conversation_id',
    sender: {
      _id: 'user_id',
      name: 'Sender Name'
    },
    content: 'Message content',
    timestamp: '2025-06-15T15:10:00.000Z',
    read: false
  }
  */
});
```

### Send Message

```javascript
socket.emit("send_message", {
  conversationId: "conversation_id",
  content: "Hello, this is a real-time message!",
});
```

### Friend Request Notification

```javascript
socket.on("friend_request", (data) => {
  // Handle friend request notification
  /*
  data = {
    requestId: 'request_id',
    requester: {
      _id: 'user_id',
      name: 'Requester Name'
    }
  }
  */
});
```

### Lobby Update

```javascript
socket.on("lobby_update", (data) => {
  // Handle lobby updates (join/leave)
  /*
  data = {
    lobbyId: 'lobby_id',
    action: 'join', // or 'leave'
    user: {
      _id: 'user_id',
      name: 'User Name'
    },
    timestamp: '2025-06-15T15:20:00.000Z'
  }
  */
});
```

---

## Error Responses

### 400 Bad Request

```json
{
  "success": false,
  "message": "Missing required fields"
}
```

### 401 Unauthorized

```json
{
  "success": false,
  "message": "Authentication required"
}
```

### 403 Forbidden

```json
{
  "success": false,
  "message": "You don't have permission to perform this action"
}
```

### 404 Not Found

```json
{
  "success": false,
  "message": "Resource not found"
}
```

### 500 Server Error

```json
{
  "success": false,
  "message": "Server Error",
  "errorId": "error_reference_id"
}
```

---

## Security Measures

1. JWT Authentication for API access
2. HTTPS encryption for all communications
3. CORS protection with allowed origins
4. Input validation and sanitization
5. Rate limiting for sensitive endpoints
6. Content Security Policy headers
7. Prevention of common attacks (XSS, CSRF, injection)

---

## Testing & Development

For testing purposes, you can use the `/security-check` endpoint to verify that security headers are properly configured:

```
GET /security-check
```

**Response:**

```json
{
  "success": true,
  "message": "Security check passed",
  "environment": "development",
  "securityHeaders": {
    "contentSecurityPolicy": true,
    "xContentTypeOptions": true,
    "xFrameOptions": true,
    "xXssProtection": true,
    "hsts": true
  }
}
```

---

This documentation covers all the endpoints and functionality available in the Event Connection API. For any additional assistance or information, please contact the API support team.
,
"message": "Event created successfully",
"data": {
"\_id": "event_id",
"name": "Tech Conference 2025",
"description": "Annual technology conference with speakers from around the world",
"location": "Bengaluru Convention Center",
"imageUrl": "https://example.com/event-image.jpg",
"category": ["Technology", "Networking"],
"startDate": "2025-06-15T09:00:00.000Z",
"endDate": "2025-06-17T18:00:00.000Z",
"createdBy": "user_id",
"participantCount": 0
}
}

```

### Get All Events
```

GET /events

````

**Response:**
```json
{
  "success": true,
  "message": "Events retrieved successfully",
  "count": 2,
  "data": [
    {
      "_id": "event_id",
      "name": "Tech Conference 2025",
      "description": "Annual technology conference with speakers from around the world",
      "location": "Bengaluru Convention Center",
      "imageUrl": "https://example.com/event-image.jpg",
      "category": ["Technology", "Networking"],
      "startDate": "2025-06-15T09:00:00.000Z",
      "endDate": "2025-06-17T18:00:00.000Z",
      "createdBy": {
        "_id": "user_id",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "participantCount": 0
    },
    // More events...
  ]
}
````

### Get Event by ID

```
GET /events/:id
```

**Response:**

```json
{
  "success": true,
  "message": "Event retrieved successfully",
  "data": {
    "_id": "event_id",
    "name": "Tech Conference 2025",
    "description": "Annual technology conference with speakers from around the world",
    "location": "Bengaluru Convention Center",
    "imageUrl": "https://example.com/event-image.jpg",
    "category": ["Technology", "Networking"],
    "startDate": "2025-06-15T09:00:00.000Z",
    "endDate": "2025-06-17T18:00:00.000Z",
    "createdBy": {
      "_id": "user_id",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "participantCount": 0
  }
}
```

### Update Event

```
PUT /events/:id
```

_Requires Authentication_

**Request Body:**

```json
{
  "name": "Updated Tech Conference 2025",
  "description": "Updated description",
  "location": "New Venue"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Event updated successfully",
  "data": {
    "_id": "event_id",
    "name": "Updated Tech Conference 2025",
    "description": "Updated description",
    "location": "New Venue",
    "imageUrl": "https://example.com/event-image.jpg",
    "category": ["Technology", "Networking"],
    "startDate": "2025-06-15T09:00:00.000Z",
    "endDate": "2025-06-17T18:00:00.000Z",
    "createdBy": "user_id",
    "participantCount": 0
  }
}
```

### Delete Event

```
DELETE /events/:id
```

_Requires Authentication_

**Response:**

```json
{
  "success": true,
  "message": "Event deleted successfully",
  "data": {
    "_id": "event_id",
    "name": "Updated Tech Conference 2025",
    "description": "Updated description",
    "location": "New Venue",
    "imageUrl": "https://example.com/event-image.jpg",
    "category": ["Technology", "Networking"],
    "startDate": "2025-06-15T09:00:00.000Z",
    "endDate": "2025-06-17T18:00:00.000Z",
    "createdBy": "user_id",
    "participantCount": 0
  }
}
```

### Get Events by Category

```
GET /events/category/:category
```

**Response:**

```json
{
  "success": true,
  "message": "Events in category 'Technology' retrieved successfully",
  "count": 1,
  "data": [
    {
      "_id": "event_id",
      "name": "Tech Conference 2025",
      "description": "Annual technology conference with speakers from around the world",
      "location": "Bengaluru Convention Center",
      "imageUrl": "https://example.com/event-image.jpg",
      "category": ["Technology", "Networking"],
      "startDate": "2025-06-15T09:00:00.000Z",
      "endDate": "2025-06-17T18:00:00.000Z",
      "createdBy": {
        "_id": "user_id",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "participantCount": 0
    }
  ]
}
```

### Get Events by User

```
GET /events/user/:userId
```

_Requires Authentication_

**Response:**

```json
{
  "success": true,
  "message": "User's events retrieved successfully",
  "count": 1,
  "data": [
    {
      "_id": "event_id",
      "name": "Tech Conference 2025",
      "description": "Annual technology conference with speakers from around the world",
      "location": "Bengaluru Convention Center",
      "imageUrl": "https://example.com/event-image.jpg",
      "category": ["Technology", "Networking"],
      "startDate": "2025-06-15T09:00:00.000Z",
      "endDate": "2025-06-17T18:00:00.000Z",
      "createdBy": "user_id",
      "participantCount": 0
    }
  ]
}
```

### Get Upcoming Events

```
GET /events/upcoming/events
```

**Response:**

```json
{
  "success": true,
  "message": "Upcoming events retrieved successfully",
  "count": 2,
  "data": [
    // Events with start dates in the future
  ]
}
```

### Get Past Events

```
GET /events/past/events
```

**Response:**

```json
{
  "success": true,
  "message": "Past events retrieved successfully",
  "count": 1,
  "data": [
    // Events with end dates in the past
  ]
}
```

---

## 3. Participants

### Register as a Participant

```
POST /participants/register
```

_Requires Authentication_

**Request Body:**

```json
{
  "eventId": "event_id",
  "phone": "9876543210" // Optional
}
```

**Response:**

```json
{
  "success": true,
  "message": "Registered as participant successfully",
  "data": {
    "_id": "participant_id",
    "eventId": "event_id",
    "userId": "user_id",
    "code": "1234", // 4-digit verification code
    "phone": "9876543210"
  }
}
```

### Get All Participants (Admin Only)

```
GET /participants
```

_Requires Admin Authentication_

**Response:**

```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "participant_id",
      "userId": {
        "_id": "user_id",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "eventId": {
        "_id": "event_id",
        "title": "Tech Conference 2025",
        "date": "2025-06-15T09:00:00.000Z"
      },
      "code": "1234",
      "phone": "9876543210"
    }
    // More participants...
  ]
}
```

### Get Participant by ID

```
GET /participants/:id
```

_Requires Authentication_

**Response:**

```json
{
  "success": true,
  "data": {
    "_id": "participant_id",
    "userId": {
      "_id": "user_id",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "eventId": {
      "_id": "event_id",
      "title": "Tech Conference 2025",
      "date": "2025-06-15T09:00:00.000Z"
    },
    "code": "1234",
    "phone": "9876543210"
  }
}
```

### Create Participant (Admin Only)

```
POST /participants
```

_Requires Admin Authentication_

**Request Body:**

```json
{
  "userId": "user_id",
  "eventId": "event_id",
  "phone": "9876543210"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "_id": "participant_id",
    "userId": "user_id",
    "eventId": "event_id",
    "code": "123456", // 6-digit code for admin-created participants
    "phone": "9876543210"
  }
}
```

### Update Participant (Admin Only)

```
PUT /participants/:id
```

_Requires Admin Authentication_

**Request Body:**

```json
{
  "phone": "9876543299"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "_id": "participant_id",
    "userId": "user_id",
    "eventId": "event_id",
    "code": "1234",
    "phone": "9876543299"
  }
}
```

### Delete Participant (Admin Only)

```
DELETE /participants/:id
```

_Requires Admin Authentication_

**Response:**

```json
{
  "success": true,
  "message": "Participant deleted successfully"
}
```

### Get Participants by Event

```
GET /participants/event/:eventId
```

_Requires Authentication_

**Response:**

```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "participant_id_1",
      "userId": {
        "_id": "user_id_1",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "eventId": "event_id",
      "code": "1234",
      "phone": "9876543210"
    },
    {
      "_id": "participant_id_2",
      "userId": {
        "_id": "user_id_2",
        "name": "Jane Smith",
        "email": "jane@example.com"
      },
      "eventId": "event_id",
      "code": "5678",
      "phone": "9876543211"
    }
  ]
}
```

### Verify Participant Code

```
POST /participants/verify
```

**Request Body:**

```json
{
  "code": "1234",
  "eventId": "event_id"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "_id": "participant_id",
    "userId": "user_id",
    "eventId": "event_id",
    "code": "1234",
    "phone": "9876543210"
  }
}
```

### Join Group with OTP

```
POST /participants/join/:groupId
```

_Requires Authentication_

**Request Body:**

```json
{
  "code": "1234"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Successfully joined the group",
  "participant": {
    "_id": "participant_id",
    "userId": "user_id",
    "eventId": "event_id",
    "code": "1234",
    "phone": "9876543210"
  }
}
```

### Add Participant to Lobby with OTP Check

```
POST /participants/lobby/:userId/:groupId
```

_Requires Authentication_

**Response:**

```json
{
  "success": true,
  "message": "User added to the group pool",
  "participant": {
    "_id": "participant_id",
    "userId": "user_id",
    "eventId": "event_id",
    "code": "1234",
    "phone": "9876543210"
  },
  "groupLobby": {
    "_id": "group_lobby_id",
    "name": "Tech Discussion Group",
    "members": ["user_id"]
  }
}
```

---

## 4. Lobbies

### Create Lobby

```
POST /lobbies
```

_Requires Authentication_

**Request Body:**

```json
{
  "name": "Tech Discussion Group",
  "eventId": "event_id",
  "description": "A group for discussing technology trends from the conference",
  "maxParticipants": 20,
  "startTime": "2025-06-15T10:00:00.000Z",
  "endTime": "2025-06-15T12:00:00.000Z",
  "meetingUrl": "https://meet.example.com/room123",
  "lobbyType": "general"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Lobby created successfully",
  "data": {
    "_id": "lobby_id",
    "name": "Tech Discussion Group",
    "eventId": "event_id",
    "description": "A group for discussing technology trends from the conference",
    "maxParticipants": 20,
    "participants": [],
    "createdBy": "user_id",
    "startTime": "2025-06-15T10:00:00.000Z",
    "endTime": "2025-06-15T12:00:00.000Z",
    "meetingUrl": "https://meet.example.com/room123",
    "lobbyType": "general"
  }
}
```

### Get All Lobbies (Admin Only)

```
GET /lobbies
```

_Requires Admin Authentication_

**Response:**

```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "lobby_id_1",
      "name": "Tech Discussion Group",
      "description": "A group for discussing technology trends from the conference",
      "eventId": {
        "_id": "event_id",
        "name": "Tech Conference 2025",
        "startDate": "2025-06-15T09:00:00.000Z",
        "endDate": "2025-06-17T18:00:00.000Z"
      },
      "createdBy": {
        "_id": "user_id",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "maxParticipants": 20,
      "participants": [
        {
          "_id": "user_id_1",
          "name": "John Doe",
          "email": "john@example.com"
        },
        {
          "_id": "user_id_2",
          "name": "Jane Smith",
          "email": "jane@example.com"
        }
      ],
      "startTime": "2025-06-15T10:00:00.000Z",
      "endTime": "2025-06-15T12:00:00.000Z",
      "meetingUrl": "https://meet.example.com/room123",
      "lobbyType": "general"
    }
    // More lobbies...
  ]
}
```

### Get My Lobbies

```
GET /lobbies/my-lobbies
```

_Requires Authentication_

**Response:**

```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "lobby_id_1",
      "name": "Tech Discussion Group",
      "description": "A group for discussing technology trends from the conference",
      "eventId": {
        "_id": "event_id",
        "name": "Tech Conference 2025",
        "startDate": "2025-06-15T09:00:00.000Z",
        "endDate": "2025-06-17T18:00:00.000Z"
      },
      "createdBy": {
        "_id": "user_id",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "maxParticipants": 20,
      "startTime": "2025-06-15T10:00:00.000Z",
      "endTime": "2025-06-15T12:00:00.000Z"
    }
    // More lobbies...
  ]
}
```

### Get Lobby by ID

```
GET /lobbies/:id
```

_Requires Authentication_

**Response:**

```json
{
  "success": true,
  "data": {
    "_id": "lobby_id",
    "name": "Tech Discussion Group",
    "description": "A group for discussing technology trends from the conference",
    "eventId": {
      "_id": "event_id",
      "name": "Tech Conference 2025",
      "startDate": "2025-06-15T09:00:00.000Z",
      "endDate": "2025-06-17T18:00:00.000Z"
    },
    "createdBy": {
      "_id": "user_id",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "maxParticipants": 20,
    "participants": [
      {
        "_id": "user_id_1",
        "name": "John Doe",
        "email": "john@example.com"
      },
      {
        "_id": "user_id_2",
        "name": "Jane Smith",
        "email": "jane@example.com"
      }
    ],
    "startTime": "2025-06-15T10:00:00.000Z",
    "endTime": "2025-06-15T12:00:00.000Z",
    "meetingUrl": "https://meet.example.com/room123",
    "lobbyType": "general"
  }
}
```

### Update Lobby

```
PUT /lobbies/:id
```

_Requires Authentication_

**Request Body:**

```json
{
  "name": "Updated Tech Discussion Group",
  "description": "Updated description",
  "maxParticipants": 25
}
```

**Response:**

```json
{
  "success": true,
  "message": "Lobby updated successfully",
  "data": {
    "_id": "lobby_id",
    "name": "Updated Tech Discussion Group",
    "description": "Updated description",
    "maxParticipants": 25
    // Other fields remain the same
  }
}
```

### Delete Lobby

```
DELETE /lobbies/:id
```

_Requires Authentication_

**Response:**

```json
{
  "success": true,
  "message": "Lobby deleted successfully"
}
```

### Join Lobby

```
POST /lobbies/:lobbyId/join
```

_Requires Authentication_

**Request Body:**

```json
{
  "code": "1234" // Verification code from participant registration
}
```

**Response:**

```json
{
  "success": true,
  "message": "Successfully joined the lobby",
  "data": {
    "_id": "lobby_id",
    "name": "Tech Discussion Group",
    "description": "A group for discussing technology trends from the conference",
    "eventId": {
      "_id": "event_id",
      "name": "Tech Conference 2025",
      "startDate": "2025-06-15T09:00:00.000Z",
      "endDate": "2025-06-17T18:00:00.000Z"
    },
    "createdBy": {
      "_id": "user_id_creator",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "participants": [
      {
        "_id": "user_id_1",
        "name": "John Doe",
        "email": "john@example.com"
      },
      {
        "_id": "user_id_2",
        "name": "Jane Smith",
        "email": "jane@example.com"
      },
      {
        "_id": "user_id_joiner",
        "name": "New User",
        "email": "newuser@example.com"
      }
    ]
  }
}
```

### Leave Lobby

```
POST /lobbies/:lobbyId/leave
```

_Requires Authentication_

**Response:**

```json
{
  "success": true,
  "message": "Successfully left the lobby"
}
```

### Get Lobbies by Event

```
GET /lobbies/event/:eventId
```

**Response:**

```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "lobby_id_1",
      "name": "Tech Discussion Group",
      "description": "A group for discussing technology trends from the conference",
      "eventId": {
        "_id": "event_id",
        "name": "Tech Conference 2025",
        "startDate": "2025-06-15T09:00:00.000Z",
        "endDate": "2025-06-17T18:00:00.000Z"
      },
      "createdBy": {
        "_id": "user_id",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "maxParticipants": 20,
      "isPrivate": false,
      "tags": ["technology", "networking", "discussion"]
    }
    // More lobbies...
  ]
}
```

### Get Active Lobbies

```
GET /lobbies/event/:eventId/active
```

**Response:**

```json
{
  "success": true,
  "count": 1,
  "data": [
    {
      "_id": "lobby_id_1",
      "name": "Tech Discussion Group",
      "description": "A group for discussing technology trends from the conference",
      "eventId": {
        "_id": "event_id",
        "name": "Tech Conference 2025",
        "startDate": "2025-06-15T09:00:00.000Z",
        "endDate": "2025-06-17T18:00:00.000Z"
      },
      "createdBy": {
        "_id": "user_id",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "maxParticipants": 20,
      "isPrivate": false,
      "tags": ["technology", "networking", "discussion"],
      "isActive": true,
      "lastActivity": "2025-06-15T11:10:00.000Z"
    }
  ]
}
```

---

## 5. Attendance

### Mark Attendance

```
POST /attendance/mark
```

_Requires Authentication_

**Request Body:**

```json
{
  "userId": "user_id",
  "eventId": "event_id"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Participant marked as present and OTP sent",
  "data": {
    "participantId": "participant_id",
    "isPresent": true,
    "presentTime": "2025-06-15T09:30:00.000Z"
  }
}
```

### Mark Bulk Attendance

```
POST /attendance/mark-bulk
```

_Requires Authentication_

**Request Body:**

```json
{
  "participants": ["user_id_1", "user_id_2", "user_id_3"],
  "eventId": "event_id"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Bulk attendance marking completed",
  "data": {
    "processed": 3,
    "failed": 0,
    "results": [
      {
        "userId": "user_id_1",
        "participantId": "participant_id_1",
        "status": "Marked as present and OTP sent",
        "isPresent": true
      },
      {
        "userId": "user_id_2",
        "participantId": "participant_id_2",
        "status": "Marked as present and OTP sent",
        "isPresent": true
      },
      {
        "userId": "user_id_3",
        "participantId": "participant_id_3",
        "status": "Already marked as present",
        "isPresent": true
      }
    ],
    "errors": []
  }
}
```

### Get Event Attendance

```
GET /attendance/event/:eventId
```

_Requires Authentication_

**Response:**

```json
{
  "success": true,
  "data": {
    "eventId": "event_id",
    "eventName": "Tech Conference 2025",
    "stats": {
      "total": 20,
      "present": 15,
      "absent": 5,
      "presentPercentage": "75.00"
    },
    "participants": [
      {
        "_id": "participant_id_1",
        "userId": {
          "_id": "user_id_1",
          "name": "John Doe",
          "email": "john@example.com"
        },
        "isPresent": true,
        "presentTime": "2025-06-15T09:30:00.000Z",
        "code": "1234"
      }
      // More participants...
    ]
  }
}
```

### Check Attendance Status

```
GET /attendance/check/:userId/:eventId
```

_Requires Authentication_

**Response:**

```json
{
  "success": true,
  "data": {
    "participantId": "participant_id",
    "userId": "user_id",
    "eventId": "event_id",
    "isPresent": true,
    "presentTime": "2025-06-15T09:30:00.000Z",
    "registrationTime": "2025-06-10T14:20:00.000Z"
  }
}
```

---

## 6. Friends

### Send Friend Request

```
POST /friends/request
```

_Requires Authentication_

**Request Body:**

```json
{
  "recipientId": "user_id_recipient",
  "lobbyId": "lobby_id"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Friend request sent successfully",
  "data": {
    "_id": "friend_request_id",
    "requester": "user_id_requester",
    "recipient": "user_id_recipient",
    "status": "pending",
    "eventId": "event_id",
    "lobbyId": "lobby_id",
    "createdAt": "2025-06-15T12:30:00.000Z",
    "updatedAt": "2025-06-15T12:30:00.000Z"
  }
}
```

### Accept Friend Request

```
PUT /friends/accept/:requestId
```

_Requires Authentication_

**Response:**

```json
{
  "success": true,
  "message": "Friend request accepted",
  "data": {
    "_id": "friend_request_id",
    "requester": {
      "_id": "user_id_requester",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "recipient": {
      "_id": "user_id_recipient",
      "name": "Jane Smith",
      "email": "jane@example.com"
    },
    "status": "accepted",
    "eventId": "event_id",
    "lobbyId": "lobby_id",
    "lastInteraction": "2025-06-15T12:35:00.000Z",
    "createdAt": "2025-06-15T12:30:00.000Z",
    "updatedAt": "2025-06-15T12:35:00.000Z"
  }
}
```

### Reject Friend Request

```
PUT /friends/reject/:requestId
```

_Requires Authentication_

**Response:**

```json
{
  "success": true
```
