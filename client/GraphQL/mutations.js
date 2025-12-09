// GraphQL/mutations.js
import { gql } from "graphql-request";

export const UPDATE_USER_PROFILE_MUTATION = gql`
  mutation UpdateUserProfile(
    $token: String
    $appleId: String
    $username: String
    $profilePicUrl: String
    $sobrietyStartAt: String
    $timezone: String
    $lat: Float
    $long: Float
    $whyStatement: String
    $social: SocialInput
  ) {
    updateUserProfile(
      token: $token
      appleId: $appleId
      username: $username
      profilePicUrl: $profilePicUrl
      sobrietyStartAt: $sobrietyStartAt
      timezone: $timezone
      lat: $lat
      long: $long
      whyStatement: $whyStatement
      social: $social
    ) {
      id
      token
      username
      appleId
      profilePicUrl
      drunkPicUrl
      sobrietyStartAt
      timezone
      lat
      long
      whyStatement
      followersCount
      followingCount
      buddiesCount
      savedPosts {
        id
      }
      savedQuotes {
        id
      }
      savedQuotes {
        id
      }
      milestonesNotified
      notificationSettings {
        allPushEnabled
        otherUserMilestones
        otherUserComments
        followingPosts
        buddiesNearVenue
        dailyPush
        locationTrackingEnabled
      }
      social {
        instagram {
          handle
          verified
          website
          deeplink {
            app
            web
          }
        }
        tiktok {
          handle
          verified
          website
          deeplink {
            app
            web
          }
        }
        x {
          handle
          verified
          website
          deeplink {
            app
            web
          }
        }
      }
      streaks {
        startAt
        endAt
      }
      profilePic {
        id
        url
        publicId
        provider
      }
      drunkPic {
        id
        url
        publicId
        provider
      }
      createdAt
      updatedAt
    }
  }
`;

export const APPLE_LOGIN_MUTATION = gql`
  mutation AppleLogin($appleId: String!, $token: String) {
    appleLogin(appleId: $appleId, token: $token) {
      id
      appleId
      token
      username
      profilePicUrl
      drunkPicUrl
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_SOCIAL_MUTATION = gql`
  mutation UpdateSocial($token: String!, $platform: SocialPlatform!, $handle: String) {
    updateSocial(token: $token, platform: $platform, handle: $handle) {
      id
      token
      username
      profilePicUrl
      drunkPicUrl
      sobrietyStartAt
      timezone
      lat
      long
      whyStatement
      followersCount
      followingCount
      buddiesCount
      savedPosts {
        id
      }
      milestonesNotified
      notificationSettings {
        allPushEnabled
        otherUserMilestones
        otherUserComments
        followingPosts
        buddiesNearVenue
        dailyPush
        locationTrackingEnabled
      }
      social {
        instagram {
          handle
          verified
          website
          deeplink {
            app
            web
          }
        }
        tiktok {
          handle
          verified
          website
          deeplink {
            app
            web
          }
        }
        x {
          handle
          verified
          website
          deeplink {
            app
            web
          }
        }
      }
      streaks {
        startAt
        endAt
      }
      profilePic {
        id
        url
        publicId
        provider
      }
      drunkPic {
        id
        url
        publicId
        provider
      }
      createdAt
      updatedAt
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

export const UPDATE_NOTIFICATION_SETTINGS_MUTATION = gql`
  mutation UpdateNotificationSettings(
    $token: String!
    $input: NotificationSettingsInput!
  ) {
    updateNotificationSettings(token: $token, input: $input) {
      id
      notificationSettings {
        allPushEnabled
        otherUserMilestones
        otherUserComments
        followingPosts
        buddiesNearVenue
        dailyPush
        locationTrackingEnabled
      }
    }
  }
`;

export const TOGGLE_NOTIFICATION_CATEGORY_MUTATION = gql`
  mutation ToggleNotificationCategory(
    $token: String!
    $category: NotificationCategory!
    $enabled: Boolean!
  ) {
    toggleNotificationCategory(
      token: $token
      category: $category
      enabled: $enabled
    ) {
      allPushEnabled
      otherUserMilestones
      otherUserComments
      followingPosts
      buddiesNearVenue
      dailyPush
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
      lat
      long
      closestCity {
        name
      }

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
      lat
      long
      closestCity {
        name
      }

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

export const DELETE_POST_MUTATION = gql`
  mutation DeletePost($token: String!, $postId: ID!) {
    deletePost(token: $token, postId: $postId)
  }
`;

export const DELETE_QUOTE_MUTATION = gql`
  mutation DeleteQuote($token: String!, $quoteId: ID!) {
    deleteQuote(token: $token, quoteId: $quoteId)
  }
`;

export const DELETE_ACCOUNT_MUTATION = gql`
  mutation DeleteAccount($token: String!) {
    deleteAccount(token: $token)
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

export const MODERATE_POST_MUTATION = gql`
  mutation ModeratePost($token: String!, $postId: ID!, $approve: Boolean!) {
    moderatePost(token: $token, postId: $postId, approve: $approve) {
      id
      text
      mediaType
      imageUrl
      flagged
      review
      adminApproved
      likesCount
      commentsCount
      viewsCount
      createdAt
      author {
        id
        username
        profilePicUrl
      }
      video {
        id
        url
        flagged
        viewsCount
        thumbnailUrl
      }
    }
  }
`;

export const MODERATE_QUOTE_MUTATION = gql`
  mutation ModerateQuote($token: String!, $quoteId: ID!, $approve: Boolean!) {
    moderateQuote(token: $token, quoteId: $quoteId, approve: $approve) {
      id
      text
      isApproved
      isDenied
      createdAt
      user {
        id
        username
        profilePicUrl
      }
    }
  }
`;

export const FOLLOW_USER_MUTATION = gql`
  mutation FollowUser($token: String!, $userId: ID!) {
    followUser(token: $token, userId: $userId) {
      id
      isBuddy
      follower {
        id
      }
      followee {
        id
        username
        profilePicUrl
        isFollowedByViewer
        isBuddyWithViewer
      }
    }
  }
`;

export const UNFOLLOW_USER_MUTATION = gql`
  mutation UnfollowUser($token: String!, $userId: ID!) {
    unfollowUser(token: $token, userId: $userId)
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

export const TOGGLE_SAVE_MUTATION = gql`
  mutation ToggleSave($token: String!, $targetType: SaveTarget!, $targetId: ID!) {
    toggleSave(token: $token, targetType: $targetType, targetId: $targetId) {
      saved
      targetType
      targetId
    }
  }
`;

export const RECORD_POST_VIEW_MUTATION = gql`
  mutation RecordPostView($token: String!, $postId: ID!) {
    recordPostView(token: $token, postId: $postId) {
      id
      viewsCount
      video {
        id
        viewsCount
      }
    }
  }
`;

export { CREATE_POST_COMMENT, CREATE_QUOTE_COMMENT } from "./mutations/comments";
