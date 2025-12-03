import { createContext } from "react";

const CommentSheetContext = createContext({
  openCommentSheet: () => {},
  closeCommentSheet: () => {},
  isCommentSheetVisible: false,
  commentSheetConfig: null,
});

export default CommentSheetContext;
