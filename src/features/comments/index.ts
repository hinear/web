/**
 * Comments domain - Comment management for issues
 */

// Actions
export { createCommentAction } from "./actions/create-comment-action";
export { deleteCommentAction } from "./actions/delete-comment-action";
export { getCommentThreadAction } from "./actions/get-comment-thread-action";
export { listCommentsAction } from "./actions/list-comments-action";
export { updateCommentAction } from "./actions/update-comment-action";
// Components
export {
  CommentForm,
  CommentItem,
  CommentList,
  CommentMarkdown,
  CommentThread as CommentThreadView,
} from "./components";
// Contracts
export type {
  CommentsRepository,
  CreateCommentInput,
  DeleteCommentInput,
  GetCommentThreadInput,
  ListCommentsInput,
  PaginatedComments,
  SearchCommentsInput,
  UpdateCommentInput,
} from "./contracts";
export {
  extractMentions,
  isEditedComment,
  isWhitespaceOnly,
  normalizeLineEndings,
  sanitizeCommentBody,
  truncateComment,
} from "./lib/comment-sanitization";

// Lib
export {
  assertValidCreateCommentInput,
  assertValidUpdateCommentInput,
  COMMENT_MAX_LENGTH,
  COMMENT_MIN_LENGTH,
  validateCreateCommentInput,
  validateUpdateCommentInput,
} from "./lib/comment-validation";
export {
  buildCommentTree,
  type CommentSortOrder,
  type FlatComment,
  flattenCommentTree,
  getDescendantIds,
  getThreadStats,
  isRootComment,
  sortComments,
  type ThreadStats,
} from "./lib/thread-management";
// Repository
export { SupabaseCommentsRepository } from "./repositories/SupabaseCommentsRepository";
// Types
export type {
  Comment,
  CommentPermission,
  CommentPermissions,
  CommentThread,
  CommentThreadWithAuthor,
  CommentWithAuthor,
} from "./types";
