import { gql } from "graphql-request";

export const CREATE_POST_COMMENT = gql`
  mutation CreatePostComment(
    $token: String!
    $postId: ID!
    $text: String!
    $replyTo: ID
  ) {
    createPostComment(
      token: $token
      postId: $postId
      text: $text
      replyTo: $replyTo
    ) {
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
      }
    }
  }
`;

export const CREATE_QUOTE_COMMENT = gql`
  mutation CreateQuoteComment(
    $token: String!
    $quoteId: ID!
    $text: String!
    $replyTo: ID
  ) {
    createQuoteComment(
      token: $token
      quoteId: $quoteId
      text: $text
      replyTo: $replyTo
    ) {
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
      }
    }
  }
`;
