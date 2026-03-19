import type {
  Project,
  ProjectInvitation,
  ProjectMember,
  ProjectType,
} from "@/features/projects/types";

export interface CreateProjectInput {
  key: string;
  name: string;
  type: ProjectType;
  createdBy: string;
}

export interface InviteProjectMemberInput {
  projectId: string;
  email: string;
  invitedBy: string;
}

export interface ProjectsRepository {
  createProject(input: CreateProjectInput): Promise<Project>;
  addProjectMember(member: ProjectMember): Promise<ProjectMember>;
  inviteProjectMember(input: InviteProjectMemberInput): Promise<ProjectInvitation>;
  getProjectById(projectId: string): Promise<Project | null>;
}
