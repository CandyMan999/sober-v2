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
      milestoneNotificationsEnabled
      social {
        instagram
        tiktok
        x
      }
      relapses {
        at
        note
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
