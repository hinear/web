import { NextResponse } from "next/server";
import { toBoardIssue } from "@/features/issues/lib/issue-contract-adapter";
import {
  getMutationErrorStatus,
  inferMutationErrorCode,
} from "@/features/issues/lib/mutation-error-messages";
import { getServerIssuesRepository } from "@/features/issues/repositories/server-issues-repository";
import { getAuthenticatedActorIdOrNull } from "@/lib/supabase/server-auth";
import { createRequestSupabaseServerClient } from "@/lib/supabase/server-client";

interface RouteContext {
  params: Promise<{
    projectId: string;
  }>;
}

export async function GET(_request: Request, context: RouteContext) {
  if (!(await getAuthenticatedActorIdOrNull())) {
    return NextResponse.json(
      {
        code: "AUTH_REQUIRED",
        error: "Authentication required.",
      },
      { status: 401 }
    );
  }

  try {
    const { projectId } = await context.params;
    const repository = await getServerIssuesRepository();
    const issues = await repository.listIssuesByProject(projectId);
    const assigneeIds = [
      ...new Set(issues.map((issue) => issue.assigneeId).filter(Boolean)),
    ];
    const supabase = await createRequestSupabaseServerClient();
    const { data: profileRows } = assigneeIds.length
      ? await supabase
          .from("profiles")
          .select("id, display_name, avatar_url")
          .in("id", assigneeIds)
      : { data: [] };
    const assigneesById = new Map(
      (profileRows ?? []).map((profile) => [
        profile.id,
        {
          avatarUrl: profile.avatar_url,
          name: profile.display_name?.trim() || profile.id,
        },
      ])
    );

    return NextResponse.json({
      issues: issues.map((issue) =>
        toBoardIssue(
          issue,
          issue.assigneeId ? assigneesById.get(issue.assigneeId) : null
        )
      ),
      total: issues.length,
    });
  } catch (error) {
    const code = inferMutationErrorCode(error);
    const status = getMutationErrorStatus(code);

    return NextResponse.json(
      {
        code,
        error:
          error instanceof Error ? error.message : "Failed to load issues.",
      },
      { status }
    );
  }
}
