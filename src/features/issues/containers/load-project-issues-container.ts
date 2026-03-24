import "server-only";

import type { AppSupabaseServerClient } from "@/lib/supabase/server-client";
import type { TableRow } from "@/lib/supabase/types";
import type { BoardIssue } from "../contracts";
import type { Issue } from "../types";

export interface ProjectIssuesData {
  issues: BoardIssue[];
  total: number;
}

export interface LoadProjectIssuesResult {
  data: ProjectIssuesData | null;
  error: Error | null;
}

/**
 * Container: 데이터 페칭 로직 담당
 * - 이슈 목록 조회
 * - 라벨 데이터 조회
 * - 담당자 프로필 조회
 * - 데이터 변환 및 조립
 */
export async function loadProjectIssuesContainer(
  supabase: AppSupabaseServerClient,
  projectId: string
): Promise<LoadProjectIssuesResult> {
  try {
    // 병렬로 모든 데이터 페칭
    const [issuesResult, labelsResult, issueLabelsResult, profilesResult] =
      await Promise.all([
        // 이슈 목록 조회
        supabase
          .from("issues")
          .select()
          .eq("project_id", projectId)
          .order("issue_number", { ascending: true }),

        // 라벨 목록 조회
        supabase.from("labels").select().eq("project_id", projectId),

        // 이슈-라벨 연결 조회
        supabase
          .from("issue_labels")
          .select("issue_id, label_id")
          .eq("project_id", projectId),

        // 프로필 목록 조회 (담당자 정보용)
        supabase.from("profiles").select("id, display_name, avatar_url"),
      ]);

    // 에러 체크
    if (issuesResult.error) {
      throw new Error(`Failed to load issues: ${issuesResult.error.message}`);
    }

    if (labelsResult.error) {
      throw new Error(`Failed to load labels: ${labelsResult.error.message}`);
    }

    if (issueLabelsResult.error) {
      throw new Error(
        `Failed to load issue labels: ${issueLabelsResult.error.message}`
      );
    }

    // 데이터 매핑
    const issues = (issuesResult.data ?? []).map(mapIssue);
    const labelsById = new Map(
      (labelsResult.data ?? []).map((label) => [label.id, mapLabel(label)])
    );

    // 이슈-라벨 연결 매핑
    const labelsByIssueId = new Map<
      string,
      Array<{ id: string; name: string; color: string }>
    >();

    for (const issue of issues) {
      labelsByIssueId.set(issue.id, []);
    }

    for (const link of issueLabelsResult.data ?? []) {
      const label = labelsById.get(link.label_id);
      if (label) {
        const labels = labelsByIssueId.get(link.issue_id);
        if (labels) {
          labels.push({
            id: label.id,
            name: label.name,
            color: label.color,
          });
        }
      }
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

    // 최종 데이터 조립
    const boardIssues: BoardIssue[] = issues.map((issue) => ({
      id: issue.id,
      identifier: issue.identifier,
      title: issue.title,
      status: issue.status,
      priority: issue.priority,
      assignee: issue.assigneeId
        ? (profilesById.get(issue.assigneeId) ?? null)
        : null,
      labels: labelsByIssueId.get(issue.id) ?? [],
      issueNumber: issue.issueNumber,
      projectId: issue.projectId,
      createdAt: issue.createdAt,
      updatedAt: issue.updatedAt,
    }));

    return {
      data: {
        issues: boardIssues,
        total: boardIssues.length,
      },
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error:
        error instanceof Error
          ? error
          : new Error("Failed to load project issues"),
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

function mapLabel(row: TableRow<"labels">): {
  id: string;
  name: string;
  color: string;
} {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
  };
}
