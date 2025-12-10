export const FETCH_ME_QUERY = `
  query FetchMe($token: String, $appleId: String) {
    fetchMe(token: $token, appleId: $appleId) {
      id
      token
      appleId
      username
      profilePicUrl
      drunkPicUrl
      whyStatement
      sobrietyStartAt
      timezone
      lat
      long
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
      followersCount
      followingCount
      buddiesCount
      averageRelapseDay
      relapseReminderLastSentAt
      savedPosts {
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

export const RANDOM_USERS_QUERY = `
  query RandomUsers($limit: Int, $offset: Int) {
    users(limit: $limit, offset: $offset) {
      id
      username
      profilePicUrl
      profilePic {
        url
      }
    }
  }
`;

export const PROFILE_OVERVIEW_QUERY = `
  query ProfileOverview($token: String, $appleId: String) {
    profileOverview(token: $token, appleId: $appleId) {
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
        followersCount
        followingCount
        buddiesCount
        savedPosts {
          id
        }
        savedQuotes {
          id
        }
        followers {
          id
          username
          profilePicUrl
          isFollowedByViewer
          isBuddyWithViewer
        }
        following {
          id
          username
          profilePicUrl
          isFollowedByViewer
          isBuddyWithViewer
        }
        buddies {
          id
          username
          profilePicUrl
          isFollowedByViewer
          isBuddyWithViewer
        }
      }
      postCursor
      hasMorePosts
      posts {
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
        lat
        long
        closestCity {
          name
        }
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
        adminApproved
        likesCount
        commentsCount
        viewsCount
        createdAt
        lat
        long
        closestCity {
          name
        }
        video {
          id
          url
          flagged
          viewsCount
          thumbnailUrl
        }
      }
      savedQuotes {
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
  }
`;

export const ADMIN_REVIEW_ITEMS_QUERY = `
  query AdminReviewItems($token: String!) {
    adminFlaggedPosts(token: $token) {
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
        flagged
        viewsCount
        thumbnailUrl
      }
    }
    adminPendingQuotes(token: $token) {
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

export const USER_NOTIFICATIONS_QUERY = `
  query UserNotifications($token: String!) {
    userNotifications(token: $token) {
      id
      type
      title
      description
      intent
      postId
      quoteId
      commentId
      milestoneDays
      milestoneTag
      fromUserId
      fromUsername
      fromProfilePicUrl
      venueName
      venueType
      roomId
      roomName
      createdAt
      read
      dismissed
    }
  }
`;

export const MARK_NOTIFICATION_READ_MUTATION = `
  mutation MarkNotificationRead($token: String!, $id: ID!) {
    markNotificationRead(token: $token, id: $id) {
      id
      read
      dismissed
    }
  }
`;

export const DISMISS_NOTIFICATION_MUTATION = `
  mutation DismissNotification($token: String!, $id: ID!) {
    dismissNotification(token: $token, id: $id) {
      id
      read
      dismissed
    }
  }
`;

export const CLEAR_ALL_NOTIFICATIONS_MUTATION = `
  mutation ClearAllNotifications($token: String!, $ids: [ID!]!) {
    clearAllNotifications(token: $token, ids: $ids)
  }
`;

export const USER_PROFILE_QUERY = `
  query UserProfile($token: String, $appleId: String, $userId: ID!) {
    userProfile(token: $token, appleId: $appleId, userId: $userId) {
      user {
        id
        username
        profilePicUrl
        drunkPicUrl
        sobrietyStartAt
        whyStatement
        followersCount
        followingCount
        buddiesCount
        lat
        long
        closestCity {
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
        followers {
          id
          username
          profilePicUrl
          isFollowedByViewer
          isBuddyWithViewer
        }
        following {
          id
          username
          profilePicUrl
          isFollowedByViewer
          isBuddyWithViewer
        }
        buddies {
          id
          username
          profilePicUrl
          isFollowedByViewer
          isBuddyWithViewer
        }
      }
      postCursor
      hasMorePosts
      posts {
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
        lat
        long
        closestCity {
          name
        }
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
        adminApproved
        likesCount
        commentsCount
        viewsCount
        createdAt
        lat
        long
        closestCity {
          name
        }
        video {
          id
          url
          flagged
          viewsCount
          thumbnailUrl
        }
      }
      savedQuotes {
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
  }
`;

export const USER_POSTS_PAGINATED_QUERY = `
  query UserPosts(
    $token: String
    $appleId: String
    $userId: ID!
    $limit: Int
    $cursor: String
  ) {
    userPosts(
      token: $token
      appleId: $appleId
      userId: $userId
      limit: $limit
      cursor: $cursor
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
        adminApproved
        isMilestone
        milestoneDays
        milestoneTag
        likesCount
        commentsCount
        viewsCount
        lat
        long
        closestCity {
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
         isFollowedByViewer
        isBuddyWithViewer
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
        adminApproved
        isMilestone
        milestoneDays
        milestoneTag
        likesCount
        commentsCount
        viewsCount
        lat
        long
        closestCity {
          name
        }
        createdAt
        daysSober
        author {
          id
          username
          profilePicUrl
          drunkPicUrl
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

export const POST_BY_ID_QUERY = `
  query PostById($postId: ID!, $token: String, $includeFlagged: Boolean) {
    post(postId: $postId, token: $token, includeFlagged: $includeFlagged) {
      id
      text
      mediaType
      imageUrl
      flagged
      review
      adminApproved
      likesCount
      commentsCount
      createdAt
      lat
      long
      closestCity {
        name
      }
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
        thumbnailUrl
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
`;

export const QUOTE_BY_ID_QUERY = `
  query QuoteById($quoteId: ID!, $token: String) {
    quote(quoteId: $quoteId, token: $token) {
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
        isFollowedByViewer
        isBuddyWithViewer
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
`;

export const GET_BAR_QUERY = `
query Query($lat: Float!, $long: Float!, $token: String, $bar: String) {
    getBarLocation(lat: $lat, long: $long, token: $token, bar: $bar) {
      name
      lat
      long
    }
  }
`;

export const GET_LIQUOR_STORE_QUERY = `
query Query($lat: Float!, $long: Float!, $token: String, $store: String) {
    getLiquorLocation(lat: $lat, long: $long, token: $token, store: $store) {
      name
      lat
      long
    }
}
`;
