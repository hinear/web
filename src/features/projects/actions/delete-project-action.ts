"use server";

import { redirect } from "next/navigation";

import { requireAuthRedirect } from "@/features/auth/actions/require-auth-redirect";
import { getServerProjectsRepository } from "@/features/projects/repositories/server-projects-repository";
import { getAuthenticatedActorIdOrNull } from "@/lib/supabase/server-auth";

export interface DeleteProjectInput {
  projectId: string;
}

function isNextRedirectError(error: unknown): error is { digest: string } {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof error.digest === "string" &&
    error.digest.startsWith("NEXT_REDIRECT;")
  );
}

export async function deleteProjectAction(input: DeleteProjectInput) {
  const actorId = await getAuthenticatedActorIdOrNull();

  if (!actorId) {
    return requireAuthRedirect(`/projects/${input.projectId}/settings`);
  }

  const repository = await getServerProjectsRepository();

  // 프로젝트 존재 여부와 권한 확인
  const project = await repository.getProjectById(input.projectId);

  if (!project) {
    return redirect(
      `/projects/${input.projectId}/settings?projectError=Project+not+found.`
    );
  }

  // 소유자만 삭제 가능
  if (project.createdBy !== actorId) {
    return redirect(
      `/projects/${input.projectId}/settings?projectError=Only+project+owners+can+delete+projects.`
    );
  }

  try {
    await repository.deleteProject({
      projectId: input.projectId,
      deletedBy: actorId,
    });

    // 삭제 후 프로젝트 목록 페이지로 리다이렉트
    return redirect("/projects/overview");
  } catch (error) {
    if (isNextRedirectError(error)) {
      throw error;
    }

    return redirect(
      `/projects/${input.projectId}/settings?projectError=${
        error instanceof Error
          ? encodeURIComponent(error.message)
          : "Failed+to+delete+project."
      }`
    );
  }
}
