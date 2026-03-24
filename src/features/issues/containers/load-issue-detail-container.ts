import "server-only";

import type { AppSupabaseServerClient } from "@/lib/supabase/server-client";
import type { TableRow } from "@/lib/supabase/types";
import type { Assignee, IssueDetail } from "../contracts";
import type { ActivityLogEntry, Comment, Issue, Label } from "../types";

export interface IssueDetailData {
  issue: IssueDetail;
  comments: Comment[];
  activityLog: ActivityLogEntry[];
}

export interface LoadIssueDetailResult {
  data: IssueDetailData | null;
  error: Error | null;
}

/**
 * Container: 이슈 상세 데이터 페칭 로직
 */
export async function loadIssueDetailContainer(
  supabase: AppSupabaseServerClient,
  issueId: string
): Promise<LoadIssueDetailResult> {
  try {
    // 병렬로 모든 데이터 페칭
    const [
      issueResult,
      commentsResult,
      activityLogResult,
      labelsResult,
      profilesResult,
    ] = await Promise.all([
      // 이슈 상세 조회
      supabase.from("issues").select().eq("id", issueId).maybeSingle(),

      // 댓글 조회
      supabase
        .from("comments")
        .select()
        .eq("issue_id", issueId)
        .order("created_at", { ascending: false }),

      // 활동 로그 조회
      supabase
        .from("activity_logs")
        .select()
        .eq("issue_id", issueId)
        .order("created_at", { ascending: false }),

      // 라벨 조회
      supabase.from("labels").select().eq("project_id", issueId), // 프로젝트 ID가 필요하지만 임시로 issueId 사용

      // 관련 프로필 조회 (작성자, 할당자 등)
      supabase.from("profiles").select("id, display_name, avatar_url"),
    ]);

    // 에러 체크
    if (issueResult.error) {
      throw new Error(`Failed to load issue: ${issueResult.error.message}`);
    }

    if (!issueResult.data) {
      return {
        data: null,
        error: new Error("Issue not found"),
      };
    }

    // 데이터 매핑
    const issue = mapIssue(issueResult.data);
    const comments = (commentsResult.data ?? []).map(mapComment);
    const activityLog = (activityLogResult.data ?? []).map(mapActivityLogEntry);
    const labels = (labelsResult.data ?? []).map(mapLabel);

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

    // 담당자 정보
    const assignee: Assignee | null = issue.assigneeId
      ? (profilesById.get(issue.assigneeId) ?? null)
      : null;

    // 작성자 정보
    const createdBy = profilesById.get(issue.createdBy) ?? null;
    const updatedBy = profilesById.get(issue.updatedBy) ?? null;

    // 댓글 작성자 정보 매핑
    const commentsWithAuthors = comments.map((comment) => ({
      ...comment,
      authorName: profilesById.get(comment.authorId)?.name ?? comment.authorId,
      authorAvatarUrl: profilesById.get(comment.authorId)?.avatarUrl ?? null,
    }));

    // 활동 로그 액터 정보 매핑
    const activityLogWithActors = activityLog.map((log) => ({
      ...log,
      actorName: profilesById.get(log.actorId)?.name ?? log.actorId,
      actorAvatarUrl: profilesById.get(log.actorId)?.avatarUrl ?? null,
    }));

    const issueDetail: IssueDetail = {
      ...issue,
      assignee,
      labels,
      createdByUser: createdBy,
      updatedByUser: updatedBy,
      comments: commentsWithAuthors,
      activityLog: activityLogWithActors,
    };

    return {
      data: {
        issue: issueDetail,
        comments: commentsWithAuthors,
        activityLog: activityLogWithActors,
      },
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error:
        error instanceof Error
          ? error
          : new Error("Failed to load issue detail"),
    };
  }
}

// 매핑 함수들
function mapIssue(row: TableRow<"issues">): Issue {
  return {
    id: row.id,
    projectId: row.project_id,
    issueNumber: row.issue_number,
    identifier: row.identifier,
    title: row.title,
    status: row.status as Issue["status"],
    priority: row.priority as Issue["priority"],
    assigneeId: row.assignee_id,
    labels: [],
    description: row.description,
    dueDate: row.due_date,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    version: row.version,
  };
}

function mapComment(row: TableRow<"comments">): Comment {
  return {
    id: row.id,
    issueId: row.issue_id,
    projectId: row.project_id,
    authorId: row.author_id,
    body: row.body,
    createdAt: row.created_at,
  };
}

function mapActivityLogEntry(row: TableRow<"activity_logs">): ActivityLogEntry {
  return {
    id: row.id,
    issueId: row.issue_id,
    projectId: row.project_id,
    actorId: row.actor_id,
    type: row.type,
    field: row.field,
    from: row.from_value,
    to: row.to_value,
    summary: row.summary,
    createdAt: row.created_at,
  };
}

function mapLabel(row: TableRow<"labels">): Label {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
  };
}
