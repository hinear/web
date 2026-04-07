"use server";

import { redirect } from "next/navigation";

import { requireAuthRedirect } from "@/features/auth/actions/require-auth-redirect";
import { assertProjectKey } from "@/features/projects/lib/project-key";
import { getUpdateProjectErrorMessage } from "@/features/projects/lib/update-project-error-message";
import { getServerProjectsRepository } from "@/features/projects/repositories/server-projects-repository";
import type { ProjectType } from "@/features/projects/types";
import { getAuthenticatedActorIdOrNull } from "@/lib/supabase/server-auth";

function buildSettingsRedirect(
  projectId: string,
  params: Record<string, string>
) {
  const search = new URLSearchParams(params);
  return `/projects/${projectId}/settings?${search.toString()}`;
}

function readProjectType(value: FormDataEntryValue | null): ProjectType {
  return value === "personal" ? "personal" : "team";
}

export async function updateProjectAction(
  projectId: string,
  formData: FormData
) {
  const actorId = await getAuthenticatedActorIdOrNull();

  if (!actorId) {
    return requireAuthRedirect(`/projects/${projectId}/settings`);
  }

  const repository = await getServerProjectsRepository();
  const members = await repository.listProjectMembers(projectId);
  const actorMembership = members.find((member) => member.id === actorId);

  if (!actorMembership || actorMembership.role !== "owner") {
    return redirect(
      buildSettingsRedirect(projectId, {
        projectError: "Only project owners can update project details.",
      })
    );
  }

  const rawName = String(formData.get("name") ?? "").trim();
  const rawKey = String(formData.get("key") ?? "");
  const type = readProjectType(formData.get("type"));
  const pendingInvitationCount = Number(
    formData.get("pendingInvitationCount") ?? 0
  );
  const otherMemberCount = Math.max(
    0,
    members.filter((member) => member.id !== actorId).length
  );

  if (!rawName) {
    return redirect(
      buildSettingsRedirect(projectId, {
        projectError: "Project name is required.",
      })
    );
  }

  let key: string;

  try {
    key = assertProjectKey(rawKey);
  } catch (error) {
    return redirect(
      buildSettingsRedirect(projectId, {
        projectError:
          error instanceof Error
            ? error.message
            : "Project key must contain only uppercase letters and numbers.",
      })
    );
  }

  if (
    type === "personal" &&
    (otherMemberCount > 0 || pendingInvitationCount > 0)
  ) {
    return redirect(
      buildSettingsRedirect(projectId, {
        projectError:
          "Remove other members and clear pending invitations before switching to a personal project.",
      })
    );
  }

  try {
    await repository.updateProject({
      key,
      name: rawName,
      projectId,
      type,
    });

    return redirect(
      buildSettingsRedirect(projectId, {
        projectNotice: "Project details updated.",
      })
    );
  } catch (error) {
    return redirect(
      buildSettingsRedirect(projectId, {
        projectError: getUpdateProjectErrorMessage(error),
      })
    );
  }
}
