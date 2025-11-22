export const FETCH_ME_QUERY = `
  query FetchMe($token: String!) {
    fetchMe(token: $token) {
      id
      token
      username
      profilePicUrl
      sobrietyStartAt
      timezone
      milestonesNotified
      notificationsEnabled
      streaks{
       startAt
        endAt
      }
      profilePic {
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
