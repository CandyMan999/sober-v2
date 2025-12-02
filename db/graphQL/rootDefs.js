// schema/typeDefs.js
const { gql } = require("apollo-server");

const typeDefs = gql`
  """
  User account and sobriety tracking
  """
  type User {
    id: ID!
    token: String!
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
    notificationsEnabled: Boolean
    timezone: String
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

  type PostConnection {
    posts: [Post!]!
    hasMore: Boolean!
    cursor: String
  }

  type ProfileOverview {
    user: User!
    posts: [Post!]!
    quotes: [Quote!]!
    savedPosts: [Post!]!
    savedQuotes: [Quote!]!
  }

  type Room {
    id: ID!
    name: String
    isDirect: Boolean! # NEW
    createdAt: String
    users: [User!]
    comments: [Comment!]
    lastMessageAt: String # optional but nice
    lastMessage: Comment
  }

  type Comment {
    id: ID!
    text: String!
    createdAt: String
    author: User!
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

  type DirectUploadImage {
    uploadURL: String!
    id: String!
  }

  scalar Upload

  type Query {
    me(token: String!): User
    fetchMe(token: String!): User!
    users: [User!]
    rooms: [Room!]
    room(id: ID!): Room
    runPush(token: String!): Token
    getLiquorLocation(
      lat: Float!
      long: Float!
      token: String
      store: String
    ): [Liquor]
    getBarLocation(lat: Float!, long: Float!, token: String, bar: String): [Bar]
    getVenues: [Venue]
    getQuotes: [Quote!]!
    adminFlaggedPosts(token: String!): [Post!]!
    adminPendingQuotes(token: String!): [Quote!]!
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
    ): PostConnection!
    post(postId: ID!, token: String): Post
    quote(quoteId: ID!, token: String): Quote
    profileOverview(token: String!): ProfileOverview!
    userProfile(token: String!, userId: ID!): ProfileOverview!
    myDirectRooms: [Room!]!
    directRoomWithUser(userId: ID!): Room!
  }

  enum SocialPlatform {
    instagram
    tiktok
    x
  }

  type Mutation {
    updateUserProfile(
      token: String!
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
    sendComment(
      roomId: ID!
      text: String!
      token: String!
      replyTo: ID
    ): Comment!
    addVenue(name: String!, type: Place!, lat: Float!, long: Float!): Venue
    addQuote(text: String!): Quote
    sendPost(file: Upload!, senderID: ID!, text: String): Post
    sendImagePost(file: Upload!, senderID: ID!, text: String): Post
    deletePost(token: String!, postId: ID!): Boolean!
    deleteQuote(token: String!, quoteId: ID!): Boolean!
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
    sendDirectMessage(recipientId: ID!, text: String!, replyTo: ID): Comment!
    followUser(token: String!, userId: ID!): Connection!
    unfollowUser(token: String!, userId: ID!): Boolean!
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
  }
`;

module.exports = typeDefs;
