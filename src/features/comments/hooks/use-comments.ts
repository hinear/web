"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Comment } from "@/features/issues/types";

interface CommentWithAuthor extends Comment {
  authorName: string;
  authorAvatarUrl: string | null;
}

/**
 * 댓글 목록 조회 훅
 */
export function useComments(issueId: string) {
  const queryClient = useQueryClient();

  const commentsQuery = useQuery({
    queryKey: ["comments", issueId],
    queryFn: async () => {
      const response = await fetch(`/internal/issues/${issueId}/comments`);
      if (!response.ok) {
        throw new Error("Failed to fetch comments");
      }
      const data = await response.json();
      return data.comments as CommentWithAuthor[];
    },
    enabled: !!issueId,
  });

  const createMutation = useMutation({
    mutationFn: async ({
      issueId,
      body,
    }: {
      issueId: string;
      body: string;
    }) => {
      const response = await fetch(`/internal/issues/${issueId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ body }),
      });

      if (!response.ok) {
        throw new Error("Failed to create comment");
      }

      return response.json();
    },
    onSuccess: () => {
      // 댓글 목록 자동 갱신
      queryClient.invalidateQueries({ queryKey: ["comments", issueId] });
    },
  });

  return {
    comments: commentsQuery.data ?? [],
    loading: commentsQuery.isLoading,
    error: commentsQuery.error as Error | null,
    createComment: createMutation.mutate,
    createError: createMutation.error as Error | null,
  };
}
