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
      }
    }
  }
`;
