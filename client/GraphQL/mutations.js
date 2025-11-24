// GraphQL/mutations.js
import { gql } from "graphql-request";

export const UPDATE_USER_PROFILE_MUTATION = gql`
  mutation UpdateUserProfile(
    $token: String!
    $username: String
    $profilePicUrl: String
    $sobrietyStartAt: String
    $timezone: String
  ) {
    updateUserProfile(
      token: $token
      username: $username
      profilePicUrl: $profilePicUrl
      sobrietyStartAt: $sobrietyStartAt
      timezone: $timezone
    ) {
      id
      token
      username
      profilePicUrl
      sobrietyStartAt
      timezone
    }
  }
`;

export const RESET_SOBRIETY_MUTATION = gql`
  mutation ResetSobrietyDate($token: String!, $newStartAt: String!) {
    resetSobrietyDate(token: $token, newStartAt: $newStartAt) {
      id
      sobrietyStartAt
      streaks {
        startAt
        endAt
      }
      token
      username
      profilePicUrl
      sobrietyStartAt
      timezone
      milestonesNotified
    }
  }
`;

export const DIRECT_UPLOAD_MUTATION = gql`
  mutation DirectUpload {
    directUpload {
      uploadURL
      id
    }
  }
`;

export const ADD_PICTURE_MUTATION = gql`
  mutation AddPicture($token: String!, $url: String!, $publicId: String) {
    addPicture(token: $token, url: $url, publicId: $publicId) {
      id
      url
      publicId
      user {
        id
        profilePicUrl
      }
    }
  }
`;

export const DELETE_PHOTO_MUTATION = gql`
  mutation DeletePhoto($token: String!, $photoId: ID!) {
    deletePhoto(token: $token, photoId: $photoId) {
      id
      token
      username
      profilePicUrl
      profilePic {
        id
        url
      }
    }
  }
`;

export const ADD_QUOTE_MUTATION = gql`
  mutation AddQuote($text: String!) {
    addQuote(text: $text) {
      id
      text
      isApproved
      isUsed
      likesCount
      commentsCount
      user {
        id
        username
        profilePicUrl
      }
      createdAt
      updatedAt
    }
  }
`;

export const DIRECT_VIDEO_UPLOAD_MUTATION = gql`
  mutation {
    directVideoUpload {
      uploadURL
      uid
    }
  }
`;

export const SEND_POST_MUTATION = gql`
  mutation SendPost(
    $url: String!
    $publicId: String!
    $senderID: ID!
    $text: String
  ) {
    sendPost(url: $url, publicId: $publicId, senderID: $senderID, text: $text) {
      id
      text
      flagged
      createdAt
      updatedAt

      author {
        id
        username
        profilePicUrl
      }

      video {
        id
        url
        publicId
        flagged
        viewsCount
        viewers {
          id
          username
        }
      }

      likesCount
      commentsCount
    }
  }
`;
