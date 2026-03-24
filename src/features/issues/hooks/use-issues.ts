"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createIssueAction } from "../actions/create-issue-action";
import type {
  BoardIssue,
  CreateIssueInput,
  UpdateIssueInput,
} from "../contracts";

/**
 * 이슈 목록 조회 훅
 * - 프로젝트 ID로 이슈 목록을 조회
 * - React Query로 데이터 캐싱 및 자동 리페치
 */
export function useIssues(projectId: string) {
  const queryClient = useQueryClient();

  const issuesQuery = useQuery({
    queryKey: ["issues", projectId],
    queryFn: async () => {
      const response = await fetch(`/internal/projects/${projectId}/issues`);
      if (!response.ok) {
        throw new Error("Failed to fetch issues");
      }
      return response.json() as Promise<{
        issues: BoardIssue[];
        total: number;
      }>;
    },
    enabled: !!projectId,
  });

  const updateMutation = useMutation({
    mutationFn: async (input: UpdateIssueInput & { issueId: string }) => {
      const response = await fetch(`/internal/issues/${input.issueId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        throw new Error("Failed to update issue");
      }

      return response.json();
    },
    onSuccess: () => {
      // 이슈 목록 자동 갱신
      queryClient.invalidateQueries({ queryKey: ["issues", projectId] });
    },
  });

  return {
    issues: issuesQuery.data?.issues ?? [],
    total: issuesQuery.data?.total ?? 0,
    loading: issuesQuery.isLoading,
    error: issuesQuery.error as Error | null,
    mutationError: updateMutation.error as Error | null,
    updateIssue: updateMutation.mutate,
  };
}

/**
 * 이슈 생성 mutation
 */
export function useCreateIssue() {
  return useMutation({
    mutationFn: async ({
      projectId,
      formData,
    }: {
      projectId: string;
      formData: FormData;
    }) => {
      return createIssueAction(projectId, formData);
    },
  });
}

/**
 * 이슈 업데이트 mutation
 */
export function useUpdateIssue() {
  return useMutation({
    mutationFn: async (input: UpdateIssueInput & { issueId: string }) => {
      const response = await fetch(`/internal/issues/${input.issueId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        throw new Error("Failed to update issue");
      }

      return response.json();
    },
  });
}

/**
 * 이슈 상세 조회 훅
 */
export function useIssueDetail(issueId: string) {
  return useQuery({
    queryKey: ["issue", issueId],
    queryFn: async () => {
      const response = await fetch(`/internal/issues/${issueId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch issue detail");
      }
      return response.json();
    },
    enabled: !!issueId,
  });
}
