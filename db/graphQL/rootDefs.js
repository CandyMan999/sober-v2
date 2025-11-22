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
    sobrietyStartAt: String
    streaks: [SobrietyStreak!]
    milestonesNotified: [Int!]
    notificationsEnabled: Boolean
    timezone: String
    createdAt: String
    updatedAt: String
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
    viewed: Boolean
    comment: Comment
    publicId: String
    createdAt: String
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
    author: User
    room: Room
    replyTo: Comment
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
    addPicture(token: String!, url: String!, publicId: String): Picture!
    deletePhoto(token: String!, photoId: ID!): User!
    createRoom(name: String!): Room!
    sendComment(
      roomId: ID!
      text: String!
      token: String!
      replyTo: ID
    ): Comment!
    addVenue(name: String!, type: Place!, lat: Float!, long: Float!): Venue
  }
`;

module.exports = typeDefs;
