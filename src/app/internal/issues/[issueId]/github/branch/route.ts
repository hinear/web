import { NextResponse } from "next/server";
import { SupabaseIssuesRepository } from "@/features/issues/repositories/supabase-issues-repository";
import { SupabaseProjectsRepository } from "@/features/projects/repositories/supabase-projects-repository";
import {
  createGitHubInstallationClientForRepository,
  GitHubAppInstallationRequiredError,
  getGitHubAppInstallationUrl,
  isGitHubAppConfigured,
} from "@/lib/github/app-auth";
import {
  buildIssueBranchName,
  buildPullRequestBody,
  buildPullRequestCompareUrl,
  buildPullRequestTitle,
} from "@/lib/github/branching";
import { getAuthenticatedActorIdOrNull } from "@/lib/supabase/server-auth";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/server-client";

interface RouteContext {
  params: Promise<{
    issueId: string;
  }>;
}

interface CreateBranchBody {
  branchTitle?: string;
}

export async function POST(request: Request, context: RouteContext) {
  const actorId = await getAuthenticatedActorIdOrNull();

  if (!actorId) {
    return NextResponse.json(
      { code: "AUTH_REQUIRED", error: "Authentication required." },
      { status: 401 }
    );
  }

  if (!isGitHubAppConfigured()) {
    return NextResponse.json(
      {
        code: "GITHUB_APP_NOT_CONFIGURED",
        error:
          "GitHub App credentials are not configured on the server (GITHUB_APP_ID, GITHUB_APP_PRIVATE_KEY).",
      },
      { status: 500 }
    );
  }

  const body = (await request
    .json()
    .catch(() => null)) as CreateBranchBody | null;
  const { issueId } = await context.params;
  const supabase = createServiceRoleSupabaseClient();
  const issuesRepository = new SupabaseIssuesRepository(supabase);
  const projectsRepository = new SupabaseProjectsRepository(supabase);
  const issue = await issuesRepository.getIssueById(issueId);

  if (!issue) {
    return NextResponse.json(
      { code: "ISSUE_NOT_FOUND", error: "Issue not found." },
      { status: 404 }
    );
  }

  const hasProjectAccess = await projectsRepository.checkProjectAccess(
    issue.projectId,
    actorId
  );

  if (!hasProjectAccess) {
    return NextResponse.json(
      { code: "FORBIDDEN", error: "You do not have access to this project." },
      { status: 403 }
    );
  }

  const project = await projectsRepository.getProjectById(issue.projectId);

  if (!project) {
    return NextResponse.json(
      { code: "PROJECT_NOT_FOUND", error: "Project not found." },
      { status: 404 }
    );
  }

  if (
    !project.githubIntegrationEnabled ||
    !project.githubRepoOwner ||
    !project.githubRepoName
  ) {
    return NextResponse.json(
      {
        code: "GITHUB_NOT_CONNECTED",
        error: "Connect a GitHub repository in project settings first.",
      },
      { status: 409 }
    );
  }

  try {
    const githubClient = await createGitHubInstallationClientForRepository(
      project.githubRepoOwner,
      project.githubRepoName
    );

    if (!githubClient) {
      return NextResponse.json(
        {
          code: "GITHUB_APP_NOT_CONFIGURED",
          error:
            "GitHub App credentials are not configured on the server (GITHUB_APP_ID, GITHUB_APP_PRIVATE_KEY).",
        },
        { status: 500 }
      );
    }

    const repository = await githubClient.getRepository(
      project.githubRepoOwner,
      project.githubRepoName
    );
    const branchName = buildIssueBranchName(issue, body?.branchTitle);
    let created = false;

    try {
      await githubClient.getBranch(
        project.githubRepoOwner,
        project.githubRepoName,
        branchName
      );
    } catch (error) {
      if (
        !(error instanceof Error) ||
        !error.message.includes("GitHub API error: 404")
      ) {
        throw error;
      }

      const defaultBranch = await githubClient.getBranch(
        project.githubRepoOwner,
        project.githubRepoName,
        repository.default_branch
      );

      await githubClient.createBranch(
        project.githubRepoOwner,
        project.githubRepoName,
        branchName,
        defaultBranch.commit.sha
      );
      created = true;
    }

    const compareUrl = buildPullRequestCompareUrl({
      owner: project.githubRepoOwner,
      repo: project.githubRepoName,
      baseBranch: repository.default_branch,
      branchName,
      title: buildPullRequestTitle(issue),
      body: buildPullRequestBody(issue),
    });

    return NextResponse.json({
      success: true,
      branchName,
      created,
      defaultBranch: repository.default_branch,
      compareUrl,
      repositoryFullName: repository.full_name,
      repositoryUrl: repository.html_url,
    });
  } catch (error) {
    if (error instanceof GitHubAppInstallationRequiredError) {
      return NextResponse.json(
        {
          code: "GITHUB_APP_INSTALL_REQUIRED",
          error:
            "Install the GitHub App on this repository before creating a branch.",
          installUrl: error.installUrl ?? getGitHubAppInstallationUrl(),
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        code: "GITHUB_BRANCH_FAILED",
        error:
          error instanceof Error
            ? error.message
            : "Failed to create GitHub branch.",
      },
      { status: 500 }
    );
  }
}
