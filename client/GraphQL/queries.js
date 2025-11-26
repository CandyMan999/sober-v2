export const FETCH_ME_QUERY = `
  query FetchMe($token: String!) {
    fetchMe(token: $token) {
      id
      token
      username
      profilePicUrl
      drunkPicUrl
      sobrietyStartAt
      timezone
      lat
      long
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

export const GET_QUOTES_QUERY = `
  query GetQuotes {
    getQuotes {
      id
      text
      isApproved
      isUsed
      likesCount
      commentsCount
      createdAt
      
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
        likesCount

        author {
          id
          username
          profilePicUrl
        }

        replyTo {
          id
          author {
            id
            username
            profilePicUrl
          }
        }

        likes {
          id
          user {
            id
            username
            profilePicUrl
          }
        }

        replies {
          id
          text
          createdAt
          likesCount
          replyTo {
            id
            author {
              id
              username
              profilePicUrl
            }
          }
          author {
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
          }

          replies {
            id
            text
            createdAt
            likesCount
            author {
              id
              username
              profilePicUrl
            }
            replyTo {
              id
              author {
                id
                username
                profilePicUrl
              }
            }
            likes {
              id
              user {
                id
                username
                profilePicUrl
              }
            }
          }
        }
      }
    }
  }
`;

export const GET_ALL_POSTS = `
  query GetAllPosts(
    $limit: Int
    $cursor: String
    $lat: Float
    $long: Float
    $token: String
    $excludeViewed: Boolean
    $sortByClosest: Boolean
  ) {
    getAllPosts(
      limit: $limit
      cursor: $cursor
      lat: $lat
      long: $long
      token: $token
      excludeViewed: $excludeViewed
      sortByClosest: $sortByClosest
    ) {
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
        viewsCount
        lat
        long
        closestCity {
          id
          name
        }
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
          author {
            id
            username
            profilePicUrl
          }
          createdAt
          likesCount
          likes {
            id
            user {
              id
              username
              profilePicUrl
            }
          }
          replyTo {
            id
            author {
              id
              username
              profilePicUrl
            }
          }
          replies {
            id
            text
            createdAt
            likesCount
            likes {
              id
              user {
                id
                username
                profilePicUrl
              }
            }
            replyTo {
              id
              author {
                id
                username
                profilePicUrl
              }
            }
            author {
              id
              username
              profilePicUrl
            }

            replies {
              id
              text
              createdAt
              likesCount
              likes {
                id
                user {
                  id
                  username
                  profilePicUrl
                }
              }
              author {
                id
                username
                profilePicUrl
              }
              replyTo {
                id
                author {
                  id
                  username
                  profilePicUrl
                }
              }
            }
          }
        }
      }
    }
  }
`;
