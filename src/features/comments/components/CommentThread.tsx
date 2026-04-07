import type { CommentThreadWithAuthor } from "@/features/comments/types";
import { useCommentThread } from "../hooks/use-comment-thread";
import { CommentForm } from "./CommentForm";
import { CommentItem } from "./CommentItem";

interface CommentThreadProps {
  thread: CommentThreadWithAuthor;
  currentUserId?: string;
  onReply?: (
    rootCommentId: string,
    body: string,
    parentCommentId?: string
  ) => void | Promise<void>;
  onEdit?: (commentId: string, body: string) => void | Promise<void>;
  onDelete?: (commentId: string) => void | Promise<void>;
  isSubmitting?: boolean;
}

export function CommentThread({
  thread,
  currentUserId,
  onReply,
  onEdit,
  onDelete,
  isSubmitting = false,
}: CommentThreadProps) {
  const {
    replyToId,
    isReplying,
    handleReply,
    handleReplyClick,
    handleCancelReply,
  } = useCommentThread({
    rootCommentId: thread.rootComment.id,
    onReply,
  });

  return (
    <div className="space-y-4">
      {/* Root comment */}
      <CommentItem
        comment={thread.rootComment}
        currentUserId={currentUserId}
        onReply={onReply ? handleReplyClick : undefined}
        onEdit={onEdit}
        onDelete={onDelete}
      />

      {/* Reply form for root comment */}
      {replyToId === thread.rootComment.id && onReply ? (
        <div className="ml-8">
          <CommentForm
            onSubmit={handleReply}
            onCancel={handleCancelReply}
            placeholder={`${thread.rootComment.authorName}님에게 답글 작성...`}
            submitLabel="답글 작성"
            isSubmitting={isReplying || isSubmitting}
          />
        </div>
      ) : null}

      {/* Replies */}
      {thread.replies.length > 0 ? (
        <div className="ml-8 space-y-3">
          {thread.replies.map((reply) => (
            <div key={reply.id}>
              <CommentItem
                comment={reply}
                currentUserId={currentUserId}
                onReply={onReply ? handleReplyClick : undefined}
                onEdit={onEdit}
                onDelete={onDelete}
                depth={0}
              />
              {/* Reply form for nested comments */}
              {replyToId === reply.id && onReply ? (
                <div className="ml-8 mt-3">
                  <CommentForm
                    onSubmit={handleReply}
                    onCancel={handleCancelReply}
                    placeholder={`${reply.authorName}님에게 답글 작성...`}
                    submitLabel="답글 작성"
                    isSubmitting={isReplying || isSubmitting}
                  />
                </div>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}

      {/* Reply count */}
      {thread.replyCount > 0 ? (
        <div className="ml-8 text-sm text-gray-500">
          {thread.replyCount}개의 답글
        </div>
      ) : null}
    </div>
  );
}
