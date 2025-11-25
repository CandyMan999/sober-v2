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

export const GET_QUOTES_QUERY = `
  query GetQuotes {
    getQuotes {
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

      likes {
        id
        user {
          id
          username
          profilePicUrl
        }
        createdAt
      }

      comments {
        id
        text
        createdAt

        author {
          id
          username
          profilePicUrl
        }

        replies {
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
  }
`;

export const GET_ALL_POSTS = `
  query GetAllPosts($limit: Int, $cursor: String) {
    getAllPosts(limit: $limit, cursor: $cursor) {
      hasMore
      cursor
      posts {
        id
        text
        mediaType
        imageUrl
        imagePublicId
        flagged
        review
        isMilestone
        milestoneDays
        milestoneTag
        likesCount
        commentsCount
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
        }
        comments {
          id
          text
          author {
            id
            username
            profilePicUrl
          }
          createdAt
        }
      }
    }
  }
`;
