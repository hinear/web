import { resolveSession } from "../lib/auth";
import { createMcpActorSupabaseClient } from "../lib/supabase";
import type { ListProjectsInput } from "../schemas/project";

type ProjectMembershipRow = {
  project_id: string;
  role: string;
  projects:
    | {
        id: string;
        key: string;
        name: string;
        type: string;
        created_at: string;
        updated_at: string;
      }
    | {
        id: string;
        key: string;
        name: string;
        type: string;
        created_at: string;
        updated_at: string;
      }[]
    | null;
};

function getFirstProject(projects: ProjectMembershipRow["projects"]): {
  id: string;
  key: string;
  name: string;
  type: string;
  created_at: string;
  updated_at: string;
} | null {
  if (Array.isArray(projects)) {
    return projects[0] ?? null;
  }

  return projects ?? null;
}

export async function listProjects(input: ListProjectsInput) {
  const session = resolveSession();
  const supabase = createMcpActorSupabaseClient(session);

  let actorId = session.userId;

  if (!actorId) {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      throw new Error(
        "Authentication required. Set HINEAR_MCP_ACCESS_TOKEN or HINEAR_MCP_USER_ID."
      );
    }

    actorId = user.id;
  }

  const { data, error } = await supabase
    .from("project_members")
    .select(
      `
        project_id,
        role,
        projects (
          id,
          key,
          name,
          type,
          created_at,
          updated_at
        )
      `
    )
    .eq("user_id", actorId);

  if (error) {
    throw new Error(`Failed to list projects: ${error.message}`);
  }

  const includeArchived = input.include_archived ?? false;
  const normalized = ((data ?? []) as unknown as ProjectMembershipRow[])
    .map((row) => ({
      project: getFirstProject(row.projects),
      role: row.role,
      project_id: row.project_id,
    }))
    .filter((row) => row.project)
    .map((row) => ({
      archived: false,
      created_at: row.project?.created_at ?? null,
      id: row.project?.id ?? row.project_id,
      key: row.project?.key ?? "",
      name: row.project?.name ?? "",
      role: row.role,
      type: row.project?.type ?? "unknown",
      updated_at: row.project?.updated_at ?? null,
    }))
    .filter((project) => includeArchived || !project.archived)
    .sort((a, b) => {
      const left = a.updated_at ?? a.created_at ?? "";
      const right = b.updated_at ?? b.created_at ?? "";
      return right.localeCompare(left);
    });

  const projects =
    typeof input.limit === "number"
      ? normalized.slice(0, input.limit)
      : normalized;

  return {
    projects,
    summary:
      projects.length === 0
        ? "No accessible projects found for the current user."
        : `Found ${projects.length} accessible project${projects.length === 1 ? "" : "s"}.`,
    user_id: actorId,
  };
}
