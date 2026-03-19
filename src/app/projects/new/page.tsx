import { createProjectAction } from "@/features/projects/actions/create-project-action";
import { ProjectCreateScreen } from "@/features/projects/components/project-create-screen";

export default function NewProjectPage() {
  return <ProjectCreateScreen action={createProjectAction} />;
}
