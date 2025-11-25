// schema/typeDefs.js
const { gql } = require("apollo-server-express");

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
    sobrietyStartAt: String
    streaks: [SobrietyStreak!]
    milestonesNotified: [Int!]
    notificationsEnabled: Boolean
    timezone: String
    createdAt: String
    updatedAt: String
  }

  type Quote {
    id: ID!
    text: String!
    isApproved: Boolean
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
    likes: [Like!]!
    comments: [Comment!]!
    createdAt: String
    updatedAt: String
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

  type Social {
    instagram: String
    tiktok: String
    x: String
  }

  type Picture {
    id: ID!
    url: String!
    user: User
    publicId: String
    provider: String
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
    createdAt: String
    updatedAt: String
  }

  type PostConnection {
    posts: [Post!]!
    hasMore: Boolean!
    cursor: String
  }

  type Room {
    id: ID!
    name: String
    createdAt: String
    users: [User!]
    comments: [Comment!]
  }

  type Comment {
    id: ID!
    text: String!
    createdAt: String
    author: User!
    replyTo: Comment
    replies: [Comment!]
    targetType: CommentTarget!
    targetId: ID!
    room: Room
    quote: Quote
    post: Post
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
    getAllPosts(limit: Int, cursor: String): PostConnection!
  }

  type Mutation {
    updateUserProfile(
      token: String!
      username: String
      profilePicUrl: String
      sobrietyStartAt: String
      timezone: String
    ): User!
    resetSobrietyDate(token: String!, newStartAt: String!): User!
    directUpload: DirectUploadImage!
    addPicture(
      token: String!
      url: String!
      publicId: String
      slot: PictureSlot = PROFILE
    ): Picture!
    deletePhoto(token: String!, photoId: ID!, slot: PictureSlot = PROFILE): User!
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
    setPostReview(postId: ID!, review: Boolean!): Post!
  }
`;

module.exports = typeDefs;
