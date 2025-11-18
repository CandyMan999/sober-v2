const { gql } = require("apollo-server-express");

const typeDefs = gql`
  # =====================
  #        MODELS
  # =====================

  type User {
    id: ID!
    token: String!
    username: String
    profilePic: Picture
    profilePicUrl: String
    sobrietyStartAt: String
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

  # =====================
  #       QUERIES
  # =====================

  type Query {
    # Simple: get current user by device token
    me(token: String!): User

    # Future use (chatrooms, community)
    rooms: [Room!]
    room(id: ID!): Room

    # Optional: useful for debugging
    users: [User!]
  }

  # =====================
  #      INPUT TYPES
  # =====================

  type DirectUploadImage {
    uploadURL: String!
    id: String!
  }

  input UpdateUserInput {
    token: String!
    username: String
    profilePicUrl: String
    sobrietyStartAt: String
    timezone: String
  }

  # =====================
  #     MUTATIONS
  # =====================

  type Mutation {
    # Create or update a user profile
    upsertUserProfile(
      token: String!
      username: String
      profilePicUrl: String
      sobrietyStartAt: String
      timezone: String
    ): User!
    directUpload: DirectUploadImage!

    # Add relapse entry
    addRelapse(token: String!, note: String): User!

    # Room + Chat (future capability)
    createRoom(name: String!): Room!
    sendComment(
      roomId: ID!
      text: String!
      token: String!
      replyTo: ID
    ): Comment!

    # After camera upload flow > will use Cloudflare
    addPicture(token: String!, url: String!, publicId: String): Picture!
  }
`;

module.exports = typeDefs;
