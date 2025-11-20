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
