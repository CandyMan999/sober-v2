// GraphQL/mutations.js
export const UPDATE_USER_PROFILE_MUTATION = `
  mutation UpdateUserProfile(
    $token: String!
    $username: String
    $profilePicUrl: String
  ) {
    updateUserProfile(
      token: $token
      username: $username
      profilePicUrl: $profilePicUrl
    ) {
      id
      token
      username
      profilePicUrl
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
