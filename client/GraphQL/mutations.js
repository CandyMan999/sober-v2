// GraphQL/mutations.js
export const UPDATE_USER_PROFILE_MUTATION = `
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
    }
  }
`;

export const DIRECT_UPLOAD_MUTATION = `
  mutation DirectUpload {
    directUpload {
      uploadURL
      id
    }
  }
`;

export const ADD_PICTURE_MUTATION = `
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

export const DELETE_PHOTO_MUTATION = `
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
