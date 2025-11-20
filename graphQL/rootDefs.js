const { gql } = require("apollo-server-express");

const rootDefs = gql`
  type User {
    id: ID!
    token: String!
    username: String
    profilePic: Picture
    profilePicUrl: String
    sobrietyStartAt: String
    social: Social
    relapses: [Relapse!]
    milestonesNotified: [Int!]
    milestoneNotificationsEnabled: Boolean
    timezone: String
    createdAt: String
    updatedAt: String
  }

  type Relapse {
    at: String!
    note: String
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
  type City {
    name: String
    bar: [Venue]
    liquor: [Venue]
    lat: Float
    long: Float
  }

  type Bar {
    name: String
    lat: Float
    long: Float
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

  type Query {
    me(token: String!): User
    rooms: [Room!]
    room(id: ID!): Room
    users: [User!]
  }

  type DirectUploadImage {
    uploadURL: String!
    id: String!
  }

  type Mutation {
    updateUserProfile(
      token: String!
      username: String
      profilePicUrl: String
      sobrietyStartAt: String
      timezone: String
    ): User!
    directUpload: DirectUploadImage!
    addRelapse(token: String!, note: String): User!
    createRoom(name: String!): Room!
    sendComment(
      roomId: ID!
      text: String!
      token: String!
      replyTo: ID
    ): Comment!
    addPicture(token: String!, url: String!, publicId: String): Picture!
    deletePhoto(token: String!, photoId: ID!): User!
  }
`;

module.exports = rootDefs;
