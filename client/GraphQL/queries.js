export const FETCH_ME_QUERY = `
  query FetchMe($token: String!) {
    fetchMe(token: $token) {
      id
      token
      username
      profilePicUrl
      drunkPicUrl
      whyStatement
      sobrietyStartAt
      timezone
      lat
      long
      followersCount
      followingCount
      buddiesCount
      savedPosts {
        id
      }
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

export const PROFILE_OVERVIEW_QUERY = `
  query ProfileOverview($token: String!) {
    profileOverview(token: $token) {
      user {
        id
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
        whyStatement
        followersCount
        followingCount
        buddiesCount
        savedPosts {
          id
        }
      }
      posts {
        id
        text
        mediaType
        imageUrl
        flagged
        review
        likesCount
        commentsCount
        createdAt
        video {
          id
          url
          flagged
          viewsCount
          thumbnailUrl
        }
      }
      quotes {
        id
        text
        isApproved
        isDenied
        createdAt
      }
      savedPosts {
        id
        text
        mediaType
        imageUrl
        flagged
        review
        likesCount
        commentsCount
        createdAt
        video {
          id
          url
          flagged
          viewsCount
          thumbnailUrl
        }
      }
    }
  }
`;

export const USER_PROFILE_QUERY = `
  query UserProfile($token: String!, $userId: ID!) {
    userProfile(token: $token, userId: $userId) {
      user {
        id
        username
        profilePicUrl
        drunkPicUrl
        whyStatement
        followersCount
        followingCount
        buddiesCount
        lat
        long
        closestCity {
          id
          name
        }
        profilePic {
          id
          url
        }
        drunkPic {
          id
          url
        }
        isFollowedByViewer
        isBuddyWithViewer
      }
      posts {
        id
        text
        mediaType
        imageUrl
        flagged
        review
        likesCount
        commentsCount
        createdAt
        video {
          id
          url
          flagged
          viewsCount
          thumbnailUrl
        }
      }
      quotes {
        id
        text
        isApproved
        isDenied
        createdAt
      }
      savedPosts {
        id
        text
        mediaType
        imageUrl
        flagged
        review
        likesCount
        commentsCount
        createdAt
        video {
          id
          url
          flagged
          viewsCount
          thumbnailUrl
        }
      }
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
    $mediaType: PostMediaType
    $isMilestone: Boolean
  ) {
    getAllPosts(
      limit: $limit
      cursor: $cursor
      lat: $lat
      long: $long
      token: $token
      excludeViewed: $excludeViewed
      sortByClosest: $sortByClosest
      mediaType: $mediaType
      isMilestone: $isMilestone
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
          isFollowedByViewer
          isBuddyWithViewer
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
        isFollowedByViewer
        isBuddyWithViewer
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
