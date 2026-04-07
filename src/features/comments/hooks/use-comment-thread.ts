import { useCallback, useState } from "react";

interface UseCommentThreadOptions {
  rootCommentId: string;
  onReply?: (
    rootCommentId: string,
    body: string,
    parentCommentId?: string
  ) => void | Promise<void>;
}

export function useCommentThread({
  rootCommentId,
  onReply,
}: UseCommentThreadOptions) {
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [isReplying, setIsReplying] = useState(false);

  const handleReply = useCallback(
    async (body: string) => {
      if (!onReply) return;

      setIsReplying(true);
      try {
        await onReply(rootCommentId, body, replyToId || undefined);
        setReplyToId(null);
      } finally {
        setIsReplying(false);
      }
    },
    [onReply, rootCommentId, replyToId]
  );

  const handleReplyClick = useCallback((commentId: string) => {
    setReplyToId(commentId);
  }, []);

  const handleCancelReply = useCallback(() => {
    setReplyToId(null);
  }, []);

  return {
    replyToId,
    isReplying,
    handleReply,
    handleReplyClick,
    handleCancelReply,
  };
}
