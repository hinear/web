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
  getProjectByKey(key: string): Promise<Project | null>;
  listProjects(): Promise<Project[]>;
  listProjectMembers(projectId: string): Promise<ProjectMemberSummary[]>;
  listPendingProjectInvitations(
    projectId: string
  ): Promise<ProjectInvitationSummary[]>;
  removeProjectMember(projectId: string, userId: string): Promise<void>;
  resendProjectInvitation(invitationId: string): Promise<ProjectInvitation>;
  revokeProjectInvitation(invitationId: string): Promise<ProjectInvitation>;

  // 누락됨 - 조회
  listUserProjects(userId: string): Promise<Project[]>;
  listProjectsByType(type: ProjectType): Promise<Project[]>;

  // 누락됨 - 접근 제어 (필수)
  checkProjectAccess(projectId: string, userId: string): Promise<boolean>;
  validateProjectKey(key: string): Promise<boolean>;
  projectExists(key: string): Promise<boolean>;
}

export interface GetProjectByKeyInput {
  key: string;
}

export interface ListUserProjectsInput {
  userId: string;
}

export interface ListProjectsByTypeInput {
  type: ProjectType;
}

export interface CheckProjectAccessInput {
  projectId: string;
  userId: string;
}

export interface ValidateProjectKeyInput {
  key: string;
}

export interface ProjectExistsInput {
  key: string;
}
