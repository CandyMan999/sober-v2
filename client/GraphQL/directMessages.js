import { gql } from "@apollo/client";

export const MY_DIRECT_ROOMS = `
  query MyDirectRooms {
    myDirectRooms {
      id
      lastMessageAt
      lastMessage {
        id
        text
        createdAt
        isRead
        author {
          id
          username
        }
      }
      users {
        id
        username
        profilePicUrl
      }
      comments {
        id
        text
        createdAt
        isRead
        likesCount
        targetId
        targetType
        replyTo {
          id
        }
        author {
          id
          username
          profilePicUrl
        }
      }
    }
  }
`;

export const DIRECT_ROOM_WITH_USER = `
  query DirectRoomWithUser($userId: ID!) {
    directRoomWithUser(userId: $userId) {
      id
      lastMessageAt
      users {
        id
        username
        profilePicUrl
      }
      comments {
        id
        text
        createdAt
        isRead
        likesCount
        targetId
        targetType
        replyTo {
          id
        }
        author {
          id
          username
          profilePicUrl
        }
      }
    }
  }
`;

export const SEND_DIRECT_MESSAGE = `
  mutation SendDirectMessage($recipientId: ID!, $text: String!, $replyTo: ID) {
    sendDirectMessage(recipientId: $recipientId, text: $text, replyTo: $replyTo) {
      id
      text
      createdAt
      isRead
      likesCount
      targetId
      targetType
      replyTo {
        id
      }
      author {
        id
        username
        profilePicUrl
      }
    }
  }
`;

export const THERAPY_CHAT = `
  mutation TherapyChat($message: String!) {
    therapyChat(message: $message) {
      reply
      userMessage {
        id
        text
        createdAt
        isRead
        likesCount
        targetId
        targetType
        author {
          id
          username
          profilePicUrl
        }
      }
      assistantMessage {
        id
        text
        createdAt
        isRead
        likesCount
        targetId
        targetType
        author {
          id
          username
          profilePicUrl
        }
      }
    }
  }
`;

export const SET_DIRECT_TYPING = `
  mutation SetDirectTyping($roomId: ID!, $isTyping: Boolean!) {
    setDirectTyping(roomId: $roomId, isTyping: $isTyping) {
      roomId
      userId
      username
      profilePicUrl
      isTyping
      lastTypedAt
    }
  }
`;

export const DELETE_DIRECT_ROOM = `
  mutation DeleteDirectRoom($roomId: ID!) {
    deleteDirectRoom(roomId: $roomId)
  }
`;

export const MARK_DIRECT_ROOM_READ = `
  mutation MarkDirectRoomRead($roomId: ID!) {
    markDirectRoomRead(roomId: $roomId) {
      id
      isRead
      text
      createdAt
      targetId
      targetType
      author {
        id
        profilePicUrl
      }
    }
  }
`;

export const DIRECT_MESSAGE_SUBSCRIPTION = gql`
  subscription DirectMessageReceived($roomId: ID!) {
    directMessageReceived(roomId: $roomId) {
      id
      text
      createdAt
      isRead
      likesCount
      targetId
      targetType
      replyTo {
        id
      }
      author {
        id
        username
        profilePicUrl
      }
    }
  }
`;

export const DIRECT_TYPING_SUBSCRIPTION = gql`
  subscription DirectTyping($roomId: ID!) {
    directTyping(roomId: $roomId) {
      roomId
      userId
      username
      profilePicUrl
      isTyping
      lastTypedAt
    }
  }
`;

export const DIRECT_ROOM_UPDATED = gql`
  subscription DirectRoomUpdated {
    directRoomUpdated {
      id
      lastMessageAt
      lastMessage {
        id
        text
        createdAt
        isRead
        author {
          id
          username
        }
      }
      users {
        id
        username
        profilePicUrl
      }
    }
  }
`;
