import "server-only";

import type { AppSupabaseServerClient } from "@/lib/supabase/server-client";

export interface CommentsData {
  comments: Array<{
    id: string;
    body: string;
    createdAt: string;
    authorId: string;
    authorName: string;
    authorAvatarUrl: string | null;
  }>;
}

export interface LoadCommentsResult {
  data: CommentsData | null;
  error: Error | null;
}

/**
 * Container: 댓글 데이터 페칭 로직
 */
export async function loadCommentsContainer(
  supabase: AppSupabaseServerClient,
  issueId: string
): Promise<LoadCommentsResult> {
  try {
    // 병렬로 댓글과 프로필 조회
    // 먼저 댓글 작성자 ID 목록을 가져옴
    const commentsAuthorsResult = await supabase
      .from("comments")
      .select("author_id")
      .eq("issue_id", issueId);

    const authorIds = commentsAuthorsResult.data?.map((c) => c.author_id) ?? [];

    const [commentsResult, profilesResult] = await Promise.all([
      supabase
        .from("comments")
        .select()
        .eq("issue_id", issueId)
        .order("created_at", { ascending: false }),

      supabase
        .from("profiles")
        .select("id, display_name, avatar_url")
        .in("id", authorIds),
    ]);

    if (commentsResult.error) {
      throw new Error(
        `Failed to load comments: ${commentsResult.error.message}`
      );
    }

    // 프로필 매핑
    const profilesById = new Map(
      (profilesResult.data ?? []).map((profile) => [
        profile.id,
        {
          avatarUrl: profile.avatar_url,
          name: profile.display_name?.trim() || profile.id,
        },
      ])
    );

    // 댓글과 작성자 정보 결합
    const commentsWithAuthors = (commentsResult.data ?? []).map((comment) => ({
      id: comment.id,
      body: comment.body,
      createdAt: comment.created_at,
      authorId: comment.author_id,
      authorName:
        profilesById.get(comment.author_id)?.name ?? comment.author_id,
      authorAvatarUrl: profilesById.get(comment.author_id)?.avatarUrl ?? null,
    }));

    return {
      data: {
        comments: commentsWithAuthors,
      },
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error:
        error instanceof Error ? error : new Error("Failed to load comments"),
    };
  }
}
