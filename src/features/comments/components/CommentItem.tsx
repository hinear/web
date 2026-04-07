import { useMemo } from "react";
import { formatCommentDate } from "@/features/comments/lib/comment-formatters";
import { isEditedComment } from "@/features/comments/lib/comment-sanitization";
import type { CommentWithAuthor } from "@/features/comments/types";

interface CommentItemProps {
  comment: CommentWithAuthor;
  currentUserId?: string;
  onReply?: (commentId: string) => void;
  onEdit?: (commentId: string, body: string) => void;
  onDelete?: (commentId: string) => void;
  depth?: number;
}

export function CommentItem({
  comment,
  currentUserId,
  onReply,
  onEdit,
  onDelete,
  depth = 0,
}: CommentItemProps) {
  const canEdit = currentUserId === comment.authorId;
  const canDelete = currentUserId === comment.authorId;
  const edited = useMemo(
    () => isEditedComment(comment.createdAt, comment.updatedAt),
    [comment.createdAt, comment.updatedAt]
  );
  const formattedDate = useMemo(
    () => formatCommentDate(comment.createdAt),
    [comment.createdAt]
  );

  return (
    <div
      className={`border border-gray-200 rounded-lg p-4 bg-white ${depth > 0 ? "ml-8" : ""}`}
      style={{ marginLeft: depth > 0 ? `${depth * 2}rem` : "0" }}
    >
      {/* Author info */}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium text-sm">
          {comment.authorName?.charAt(0).toUpperCase() || "?"}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900">
              {comment.authorName || "Unknown"}
            </span>
            <span className="text-gray-400">·</span>
            <span className="text-sm text-gray-500">{formattedDate}</span>
            {edited ? (
              <>
                <span className="text-gray-400">·</span>
                <span className="text-xs text-gray-400">(편집됨)</span>
              </>
            ) : null}
          </div>
        </div>
      </div>

      {/* Comment body */}
      <div className="text-gray-700 whitespace-pre-wrap break-words mb-3">
        {comment.body}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 text-sm">
        {onReply ? (
          <button
            type="button"
            onClick={() => onReply(comment.id)}
            className="text-gray-500 hover:text-blue-600 transition-colors px-2 py-1 rounded hover:bg-gray-100"
          >
            답글
          </button>
        ) : null}
        {canEdit && onEdit ? (
          <button
            type="button"
            onClick={() => onEdit(comment.id, comment.body)}
            className="text-gray-500 hover:text-blue-600 transition-colors px-2 py-1 rounded hover:bg-gray-100"
          >
            편집
          </button>
        ) : null}
        {canDelete && onDelete ? (
          <button
            type="button"
            onClick={() => onDelete(comment.id)}
            className="text-gray-500 hover:text-red-600 transition-colors px-2 py-1 rounded hover:bg-gray-100"
          >
            삭제
          </button>
        ) : null}
      </div>

      {/* Nested replies */}
      {comment.replies && comment.replies.length > 0 ? (
        <div className="mt-4 space-y-3">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              currentUserId={currentUserId}
              onReply={onReply}
              onEdit={onEdit}
              onDelete={onDelete}
              depth={depth + 1}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
