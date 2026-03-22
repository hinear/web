import type {
  Project,
  ProjectInvitation,
  ProjectInvitationSummary,
  ProjectMember,
  ProjectMemberSummary,
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

export interface UpdateProjectInput {
  key: string;
  name: string;
  projectId: string;
  type: ProjectType;
}

export interface ProjectsRepository {
  createProject(input: CreateProjectInput): Promise<Project>;
  addProjectMember(member: ProjectMember): Promise<ProjectMember>;
  inviteProjectMember(
    input: InviteProjectMemberInput
  ): Promise<ProjectInvitation>;
  updateProject(input: UpdateProjectInput): Promise<Project>;
  getProjectById(projectId: string): Promise<Project | null>;
  listProjectMembers(projectId: string): Promise<ProjectMemberSummary[]>;
  listPendingProjectInvitations(
    projectId: string
  ): Promise<ProjectInvitationSummary[]>;
  removeProjectMember(projectId: string, userId: string): Promise<void>;
  resendProjectInvitation(invitationId: string): Promise<ProjectInvitation>;
  revokeProjectInvitation(invitationId: string): Promise<ProjectInvitation>;
}
