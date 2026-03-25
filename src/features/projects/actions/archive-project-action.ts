"use server";

import { SupabaseProjectsRepository } from "@/features/projects/repositories/supabase-projects-repository";
import { createClient } from "@/lib/supabase/server-client";

// Archive flag - could be added to projects table later
// For now, we'll use a different approach (e.g., adding to archived projects list)

export async function archiveProjectAction(
  projectId: string,
  userId: string
): Promise<void> {
  const supabase = await createClient();
  const repository = new SupabaseProjectsRepository(supabase);

  // Check if user is owner
  const hasAccess = await repository.checkProjectAccess(projectId, userId);

  if (!hasAccess) {
    throw new Error("프로젝트에 접근할 권한이 없습니다.");
  }

  // For now, archive means removing user from project
  // In the future, this could be an actual archive flag
  // This is a simplified implementation

  // TODO: Implement proper archiving when archive column is added to projects table
  throw new Error(
    "아카이브 기능은 아직 구현되지 않았습니다. " +
      "나중에 projects 테이블에 archived_at 컬럼이 추가되면 구현될 예정입니다."
  );

  // Future implementation:
  // const { error } = await supabase
  //   .from("projects")
  //   .update({ archived_at: new Date().toISOString() })
  //   .eq("id", projectId);

  // revalidatePath("/projects", "layout");
}
