// schema/typeDefs.js
const { gql } = require("apollo-server");

const typeDefs = gql`
  """
  User account and sobriety tracking
  """
  type User {
    id: ID!
    token: String
    appleId: String
    username: String
    profilePic: Picture
    profilePicUrl: String
    drunkPic: Picture
    drunkPicUrl: String
    whyStatement: String
    social: Social
    sobrietyStartAt: String
    lat: Float
    long: Float
    closestCity: City
    streaks: [SobrietyStreak!]
    averageRelapseDay: Int
    relapseReminderLastSentAt: String
    milestonesNotified: [Int!]
    notificationSettings: NotificationSettings!
    timezone: String
    trialEndsAt: String
    isTrialExpired: Boolean
    createdAt: String
    updatedAt: String
    followersCount: Int!
    followingCount: Int!
    buddiesCount: Int!
    savedPosts: [Post!]!
    savedQuotes: [Quote!]!
    isFollowedByViewer: Boolean!
    isBuddyWithViewer: Boolean!
    followers: [User!]!
    following: [User!]!
    buddies: [User!]!
    chatRoomStyle: Int
    plan: Plan
  }

  type Connection {
    id: ID!
    follower: User!
    followee: User!
    isBuddy: Boolean!
    createdAt: String
    updatedAt: String
  }

  type Quote {
    id: ID!
    text: String!
    isApproved: Boolean
    isDenied: Boolean
    user: User
    isUsed: Boolean
    likesCount: Int!
    commentsCount: Int!
    likes: [Like!]!
    comments: [Comment!]!
    createdAt: String
    updatedAt: String
  }

  enum CommentTarget {
    ROOM
    QUOTE
    POST
  }

  enum LikeTarget {
    QUOTE
    POST
    COMMENT
  }

  enum SaveTarget {
    POST
    QUOTE
  }

  enum PictureSlot {
    PROFILE
    DRUNK
  }

  enum PostMediaType {
    VIDEO
    IMAGE
  }

  type Post {
    id: ID!
    author: User!
    text: String
    mediaType: PostMediaType!
    video: Video
    imageUrl: String
    imagePublicId: String
    flagged: Boolean!
    review: Boolean!
    isMilestone: Boolean
    milestoneDays: Int
    milestoneTag: String
    """Author's recorded sobriety day when the post was created."""
    daysSober: Int
    likesCount: Int!
    commentsCount: Int!
    viewsCount: Int!
    likes: [Like!]!
    comments: [Comment!]!
    createdAt: String
    updatedAt: String
    lat: Float
    long: Float
    closestCity: City
    adminApproved: Boolean
  }

  type Like {
    id: ID!
    user: User!
    targetType: LikeTarget!
    targetId: ID!
    createdAt: String
  }

  type SobrietyStreak {
    startAt: String!
    endAt: String!
  }

  type SocialDeepLink {
    app: String
    web: String
  }

  type SocialAccount {
    handle: String
    deeplink: SocialDeepLink
    website: String
    verified: Boolean
  }

  type Social {
    instagram: SocialAccount
    tiktok: SocialAccount
    x: SocialAccount
  }

  enum NotificationCategory {
    OTHER_USER_MILESTONES
    OTHER_USER_COMMENTS
    FOLLOWING_POSTS
    BUDDIES_NEAR_VENUE
    DAILY_PUSH
  }

  enum PlanType {
    Free
    Premium
    Unlimited
  }

  type NotificationSettings {
    allPushEnabled: Boolean!
    otherUserMilestones: Boolean!
    otherUserComments: Boolean!
    followingPosts: Boolean!
    buddiesNearVenue: Boolean!
    dailyPush: Boolean!
    locationTrackingEnabled: Boolean!
  }

  type Plan {
    planType: PlanType!
    withWorkBook: Boolean!
    withTherapy: Boolean!
    withAds: Boolean!
  }

  input NotificationSettingsInput {
    allPushEnabled: Boolean
    otherUserMilestones: Boolean
    otherUserComments: Boolean
    followingPosts: Boolean
    buddiesNearVenue: Boolean
    dailyPush: Boolean
    locationTrackingEnabled: Boolean
  }

  input SocialInput {
    instagram: String
    tiktok: String
    x: String
  }

  enum Milestone {
    none
    day7
    day10
    day14
    day30
    day60
    day90
    day180
    day365
  }

  type Picture {
    id: ID!
    url: String!
    user: User
    publicId: String
    provider: String
    milestone: Milestone
    comment: Comment
    createdAt: String
    updatedAt: String
  }
  type Video {
    id: ID!
    url: String!
    sender: User
    receiver: User
    flagged: Boolean
    viewers: [User!]
    post: Post!
    viewsCount: Int!
    publicId: String
    thumbnailUrl: String!
    createdAt: String
    updatedAt: String
  }

  type Notification {
    id: ID!
    type: String!
    title: String!
    description: String
    intent: String
    postId: ID
    quoteId: ID
    commentId: ID
    milestoneDays: Int
    milestoneTag: String
    fromUserId: ID
    fromUsername: String
    fromProfilePicUrl: String
    venueName: String
    venueType: String
    roomId: ID
    roomName: String
    createdAt: String
    read: Boolean!
    dismissed: Boolean!
  }

  type PostConnection {
    posts: [Post!]!
    hasMore: Boolean!
    cursor: String
  }

  type ProfileOverview {
    user: User!
    posts: [Post!]!
    postCursor: String
    hasMorePosts: Boolean!
    quotes: [Quote!]!
    savedPosts: [Post!]!
    savedQuotes: [Quote!]!
  }

  type Room {
    id: ID!
    name: String
    isDirect: Boolean! # NEW
    createdAt: String
    users(limit: Int, offset: Int): [User!]
    comments: [Comment!]
    lastMessageAt: String # optional but nice
    lastMessage: Comment
  }

  type Comment {
    id: ID!
    text: String!
    createdAt: String
    author: User!
    isRead: Boolean!
    likesCount: Int!
    likes: [Like!]!
    replyTo: Comment
    replies: [Comment!]
    targetType: CommentTarget!
    targetId: ID!
    room: Room
    quote: Quote
    post: Post
  }

  type TypingStatus {
    roomId: ID!
    userId: ID!
    username: String
    profilePicUrl: String
    isTyping: Boolean!
    lastTypedAt: String
  }

  enum Place {
    Bar
    Liquor
  }

  type Venue {
    id: ID!
    type: String!
    name: String
    lat: Float!
    long: Float!
    city: City
  }

  type Liquor {
    name: String
    lat: Float
    long: Float
  }

  type Bar {
    name: String
    lat: Float
    long: Float
  }

  type City {
    id: ID!
    name: String
    bar: [Venue]
    liquor: [Venue]
    lat: Float
    long: Float
  }

  type Token {
    token: String
  }

  type BarOrLiquor {
    name: String
    lat: Float
    long: Float
  }

  type DirectUploadImage {
    uploadURL: String!
    id: String!
  }

  scalar Upload

  type Query {
    me(token: String): User
    fetchMe(token: String, appleId: String): User!
    users(limit: Int, offset: Int): [User!]
    rooms: [Room!]
    room(id: ID!): Room
    getQuotes: [Quote!]!
    adminFlaggedPosts(token: String!): [Post!]!
    adminPendingQuotes(token: String!): [Quote!]!
    userNotifications(token: String!): [Notification!]!
    getAllPosts(
      limit: Int
      cursor: String
      lat: Float
      long: Float
      token: String
      excludeViewed: Boolean
      sortByClosest: Boolean
      mediaType: PostMediaType
      isMilestone: Boolean
      minDaysSober: Int
      maxDaysSober: Int
    ): PostConnection!
    userPosts(
      token: String
      appleId: String
      userId: ID!
      limit: Int
      cursor: String
    ): PostConnection!
    post(postId: ID!, token: String, includeFlagged: Boolean): Post
    quote(quoteId: ID!, token: String): Quote
    profileOverview(token: String, appleId: String): ProfileOverview!
    userProfile(
      token: String
      appleId: String
      userId: ID!
    ): ProfileOverview!
    getRooms: [Room!]
    getComments(roomId: ID!): [Comment!]
    myDirectRooms: [Room!]!
    directRoomWithUser(userId: ID!): Room!
    getLiquorLocation(
      lat: Float!
      long: Float!
      token: String
      store: String
    ): [BarOrLiquor]
    getBarLocation(
      lat: Float!
      long: Float!
      token: String
      bar: String
    ): [BarOrLiquor]
  }

  enum SocialPlatform {
    instagram
    tiktok
    x
  }

  type Mutation {
    appleLogin(appleId: String!, token: String): User!
    updateUserProfile(
      token: String
      appleId: String
      username: String
      profilePicUrl: String
      sobrietyStartAt: String
      timezone: String
      lat: Float
      long: Float
      whyStatement: String
      social: SocialInput
    ): User!
    updateSocial(
      token: String!
      platform: SocialPlatform!
      handle: String
    ): User!
    updateNotificationSettings(
      token: String!
      input: NotificationSettingsInput!
    ): User!
    toggleNotificationCategory(
      token: String!
      category: NotificationCategory!
      enabled: Boolean!
    ): NotificationSettings!
    resetSobrietyDate(token: String!, newStartAt: String!): User!
    directUpload: DirectUploadImage!
    addPicture(
      token: String!
      url: String!
      publicId: String
      slot: PictureSlot = PROFILE
    ): Picture!
    deletePhoto(
      token: String!
      photoId: ID!
      slot: PictureSlot = PROFILE
    ): User!
    createRoom(name: String!): Room!
    changeRoom(roomId: ID!, userId: ID!): Room!
    leaveAllRooms(userId: ID!): Boolean!
    createComment(
      text: String!
      userId: ID!
      roomId: ID!
      replyToCommentId: ID
    ): Comment!
    sendComment(
      roomId: ID!
      text: String!
      token: String!
      replyTo: ID
    ): Comment!

    addQuote(text: String!): Quote
    sendPost(file: Upload!, senderID: ID!, text: String): Post
    sendImagePost(file: Upload!, senderID: ID!, text: String): Post
    deletePost(token: String!, postId: ID!): Boolean!
    deleteQuote(token: String!, quoteId: ID!): Boolean!
    deleteAccount(token: String!): Boolean!
    setPostReview(postId: ID!, review: Boolean!): Post!
    moderatePost(token: String!, postId: ID!, approve: Boolean!): Post!
    moderateQuote(token: String!, quoteId: ID!, approve: Boolean!): Quote!
    recordPostView(postId: ID!, token: String!): Post!
    createPostComment(
      token: String!
      postId: ID!
      text: String!
      replyTo: ID
    ): Comment!
    createQuoteComment(
      token: String!
      quoteId: ID!
      text: String!
      replyTo: ID
    ): Comment!
    setDirectTyping(roomId: ID!, isTyping: Boolean!): TypingStatus!
    toggleLike(
      token: String!
      targetType: LikeTarget!
      targetId: ID!
    ): LikePayload!
    toggleSave(
      token: String!
      targetType: SaveTarget!
      targetId: ID!
    ): SavePayload!
    markNotificationRead(token: String!, id: ID!): Notification!
    dismissNotification(token: String!, id: ID!): Notification!
    clearAllNotifications(token: String!, ids: [ID!]!): Boolean!
    deleteDirectRoom(roomId: ID!): Boolean!
    markDirectRoomRead(roomId: ID!): [Comment!]!
    sendDirectMessage(recipientId: ID!, text: String!, replyTo: ID): Comment!
    therapyChat(message: String!): TherapyChatPayload!
    followUser(token: String!, userId: ID!): Connection!
    unfollowUser(token: String!, userId: ID!): Boolean!
    changePlan(userId: ID!, planType: PlanType!): User!
  }

  type TherapyChatPayload {
    reply: String!
    userMessage: Comment
    assistantMessage: Comment
  }

  type LikePayload {
    liked: Boolean!
    likesCount: Int!
    targetType: LikeTarget!
    targetId: ID!
    like: Like
  }

  type SavePayload {
    saved: Boolean!
    targetType: SaveTarget!
    targetId: ID!
  }

  type Subscription {
    directMessageReceived(roomId: ID!): Comment!
    directRoomUpdated: Room!
    directTyping(roomId: ID!): TypingStatus!
    roomCommentCreated(roomId: ID!): Comment!
    roomsUpdated: [Room!]!
  }
`;

module.exports = typeDefs;
