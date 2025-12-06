import { gql } from "@apollo/client";

export const GET_ROOMS = `
  query GetRooms {
    getRooms {
      id
      name
      isDirect
      users {
        id
        username
        profilePicUrl
      }
      lastMessageAt
      lastMessage {
        id
        text
        createdAt
        author {
          id
          username
          profilePicUrl
        }
      }
    }
  }
`;

export const CREATE_ROOM = `
  mutation CreateRoom($name: String!) {
    createRoom(name: $name) {
      id
      name
      isDirect
    }
  }
`;

export const CHANGE_ROOM = `
  mutation ChangeRoom($roomId: ID!, $userId: ID!) {
    changeRoom(roomId: $roomId, userId: $userId) {
      id
      name
      users {
        id
        username
      }
      lastMessageAt
    }
  }
`;

export const GET_COMMENTS = `
  query GetComments($roomId: ID!) {
    getComments(roomId: $roomId) {
      id
      text
      createdAt
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

export const CREATE_COMMENT = `
  mutation CreateComment(
    $text: String!
    $userId: ID!
    $roomId: ID!
    $replyToCommentId: ID
  ) {
    createComment(
      text: $text
      userId: $userId
      roomId: $roomId
      replyToCommentId: $replyToCommentId
    ) {
      id
      text
      createdAt
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

export const ROOM_COMMENT_SUBSCRIPTION = gql`
  subscription RoomCommentCreated($roomId: ID!) {
    roomCommentCreated(roomId: $roomId) {
      id
      text
      createdAt
      targetId
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
