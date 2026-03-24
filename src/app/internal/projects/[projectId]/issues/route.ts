import { loadProjectIssuesContainer } from "@/features/issues/containers/load-project-issues-container";
import { IssuesApiPresenter } from "@/features/issues/presenters/issues-api-presenter";
import { getAuthenticatedActorIdOrNull } from "@/lib/supabase/server-auth";
import { createRequestSupabaseServerClient } from "@/lib/supabase/server-client";

interface RouteContext {
  params: Promise<{
    projectId: string;
  }>;
}

export async function GET(_request: Request, context: RouteContext) {
  // 인증 체크
  if (!(await getAuthenticatedActorIdOrNull())) {
    return IssuesApiPresenter.presentAuthRequired();
  }

  const { projectId } = await context.params;
  const supabase = await createRequestSupabaseServerClient();

  // Container: 데이터 페칭
  const result = await loadProjectIssuesContainer(supabase, projectId);

  if (result.error) {
    // Presenter: 에러 응답
    return IssuesApiPresenter.presentError(result.error);
  }

  // Presenter: 성공 응답
  if (!result.data) {
    return IssuesApiPresenter.presentError(new Error("Failed to load issues"));
  }

  return IssuesApiPresenter.presentSuccess(result.data);
}
