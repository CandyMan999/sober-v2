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
  mutation AddPicture(
    $token: String!
    $url: String!
    $publicId: String
    $slot: PictureSlot
  ) {
    addPicture(token: $token, url: $url, publicId: $publicId, slot: $slot) {
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
  mutation DeletePhoto($token: String!, $photoId: ID!, $slot: PictureSlot) {
    deletePhoto(token: $token, photoId: $photoId, slot: $slot) {
      id
      token
      username
      profilePicUrl
      drunkPicUrl
      profilePic {
        id
        url
      }
      drunkPic {
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

export const SEND_POST_MUTATION = gql`
  mutation SendPost($file: Upload!, $senderID: ID!, $text: String) {
    sendPost(file: $file, senderID: $senderID, text: $text) {
      id
      text
      mediaType
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

export const SEND_IMAGE_POST_MUTATION = gql`
  mutation SendImagePost($file: Upload!, $senderID: ID!, $text: String) {
    sendImagePost(file: $file, senderID: $senderID, text: $text) {
      id
      text
      mediaType
      imageUrl
      imagePublicId
      flagged
      createdAt
      updatedAt

      author {
        id
        username
        profilePicUrl
      }

      likesCount
      commentsCount
    }
  }
`;

export const SET_POST_REVIEW_MUTATION = gql`
  mutation SetPostReview($postId: ID!, $review: Boolean!) {
    setPostReview(postId: $postId, review: $review) {
      id
      review
      flagged
    }
  }
`;

export const TOGGLE_LIKE_MUTATION = gql`
  mutation ToggleLike($token: String!, $targetType: LikeTarget!, $targetId: ID!) {
    toggleLike(token: $token, targetType: $targetType, targetId: $targetId) {
      liked
      likesCount
      targetType
      targetId
      like {
        id
        targetType
        targetId
        createdAt
        user {
          id
          username
          profilePicUrl
        }
      }
    }
  }
`;

export { CREATE_POST_COMMENT, CREATE_QUOTE_COMMENT } from "./mutations/comments";
