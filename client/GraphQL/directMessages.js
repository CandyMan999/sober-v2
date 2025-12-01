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

export const DIRECT_MESSAGE_SUBSCRIPTION = gql`
  subscription DirectMessageReceived($roomId: ID!) {
    directMessageReceived(roomId: $roomId) {
      id
      text
      createdAt
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
