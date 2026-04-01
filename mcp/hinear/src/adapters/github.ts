import { resolveSession } from "../lib/auth";
import { GitHubClient, getGitHubClient } from "../lib/github-client";
import { createMcpActorSupabaseClient } from "../lib/supabase";
import type {
  CreateGitHubBranchInput,
  GitHubBranch,
  GitHubIssueLink,
  GitHubPRLink,
  LinkGitHubIssueInput,
  LinkGitHubPRInput,
} from "../schemas/github";

/**
 * Create a GitHub branch for an issue
 */
export async function createGitHubBranch(
  input: CreateGitHubBranchInput
): Promise<{ branch: GitHubBranch }> {
  const session = resolveSession();
  const supabase = createMcpActorSupabaseClient(session);

  // Get issue details
  const { data: issue, error: issueError } = await supabase
    .from("issues")
    .select(
      "identifier, project_id, title, projects!inner(github_repo_full_name)"
    )
    .eq("id", input.issue_id)
    .single();

  if (issueError || !issue) {
    throw new Error("ISSUE_NOT_FOUND");
  }

  const repo = (issue as any).projects?.github_repo_full_name;
  if (!repo) {
    throw new Error("GITHUB_NOT_CONFIGURED");
  }

  // Generate branch name
  const branchName = generateBranchName(issue.identifier, issue.title);

  // Create branch via GitHub API
  const github = getGitHubClient();
  const [owner, repoName] = repo.split("/");

  try {
    await github.createBranch(owner, repoName, branchName, input.base_branch);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("already exists")) {
        throw new Error("BRANCH_ALREADY_EXISTS");
      }
      throw new Error(`GITHUB_API_ERROR: ${error.message}`);
    }
    throw new Error("GITHUB_API_ERROR: Unknown error");
  }

  // Store in database
  const { error: dbError } = await supabase
    .from("github_integrations")
    .insert({
      project_id: issue.project_id,
      issue_id: input.issue_id,
      branch_name: branchName,
      github_repo_full_name: repo,
    })
    .select()
    .single();

  if (dbError) {
    throw new Error("FAILED_TO_STORE_INTEGRATION");
  }

  return {
    branch: {
      name: branchName,
      url: `https://github.com/${repo}/tree/${branchName}`,
      issue_id: input.issue_id,
      issue_identifier: issue.identifier,
    },
  };
}

/**
 * Link a Hinear issue to a GitHub issue
 */
export async function linkGitHubIssue(
  input: LinkGitHubIssueInput
): Promise<{ link: GitHubIssueLink }> {
  const session = resolveSession();
  const supabase = createMcpActorSupabaseClient(session);

  // Parse GitHub URL
  const repo = GitHubClient.parseRepoFullName(input.github_issue_url);
  const githubIssueId = GitHubClient.parseIssueNumber(input.github_issue_url);

  if (!repo || !githubIssueId) {
    throw new Error("INVALID_GITHUB_URL");
  }

  // Get issue details
  const { data: issue, error: issueError } = await supabase
    .from("issues")
    .select("project_id")
    .eq("id", input.issue_id)
    .single();

  if (issueError || !issue) {
    throw new Error("ISSUE_NOT_FOUND");
  }

  // Verify GitHub issue exists
  const github = getGitHubClient();
  const [owner, repoName] = repo.split("/");

  try {
    const exists = await github.verifyIssue(owner, repoName, githubIssueId);
    if (!exists) {
      throw new Error("GITHUB_ISSUE_NOT_FOUND");
    }
  } catch (error) {
    if (error instanceof Error && error.message === "GITHUB_ISSUE_NOT_FOUND") {
      throw error;
    }
    throw new Error("GITHUB_API_ERROR: Failed to verify issue");
  }

  // Check for duplicate
  const { data: existing, error: checkError } = await supabase
    .from("github_integrations")
    .select("id")
    .eq("issue_id", input.issue_id)
    .eq("github_issue_id", githubIssueId)
    .single();

  if (existing && !checkError) {
    throw new Error("ALREADY_LINKED");
  }

  // Store link
  const { data: integration, error: dbError } = await supabase
    .from("github_integrations")
    .insert({
      project_id: issue.project_id,
      issue_id: input.issue_id,
      github_issue_id: githubIssueId,
      github_repo_full_name: repo,
    })
    .select()
    .single();

  if (dbError) {
    throw new Error("FAILED_TO_STORE_LINK");
  }

  return {
    link: {
      id: integration.id,
      issue_id: input.issue_id,
      github_issue_id: githubIssueId,
      github_issue_url: input.github_issue_url,
      github_repo_full_name: repo,
      synced_at: integration.synced_at,
    },
  };
}

/**
 * Link a Hinear issue to a GitHub PR
 */
export async function linkGitHubPR(
  input: LinkGitHubPRInput
): Promise<{ link: GitHubPRLink }> {
  const session = resolveSession();
  const supabase = createMcpActorSupabaseClient(session);

  // Parse GitHub URL
  const repo = GitHubClient.parseRepoFullName(input.github_pr_url);
  const githubPrNumber = GitHubClient.parsePRNumber(input.github_pr_url);

  if (!repo || !githubPrNumber) {
    throw new Error("INVALID_GITHUB_URL");
  }

  // Get issue details
  const { data: issue, error: issueError } = await supabase
    .from("issues")
    .select("project_id")
    .eq("id", input.issue_id)
    .single();

  if (issueError || !issue) {
    throw new Error("ISSUE_NOT_FOUND");
  }

  // Verify GitHub PR exists
  const github = getGitHubClient();
  const [owner, repoName] = repo.split("/");

  try {
    const exists = await github.verifyPullRequest(
      owner,
      repoName,
      githubPrNumber
    );
    if (!exists) {
      throw new Error("GITHUB_PR_NOT_FOUND");
    }
  } catch (error) {
    if (error instanceof Error && error.message === "GITHUB_PR_NOT_FOUND") {
      throw error;
    }
    throw new Error("GITHUB_API_ERROR: Failed to verify PR");
  }

  // Check for duplicate
  const { data: existing, error: checkError } = await supabase
    .from("github_integrations")
    .select("id")
    .eq("issue_id", input.issue_id)
    .eq("github_pr_number", githubPrNumber)
    .single();

  if (existing && !checkError) {
    throw new Error("ALREADY_LINKED");
  }

  // Store link
  const { data: integration, error: dbError } = await supabase
    .from("github_integrations")
    .insert({
      project_id: issue.project_id,
      issue_id: input.issue_id,
      github_pr_number: githubPrNumber,
      github_repo_full_name: repo,
      auto_merge: input.auto_merge ?? false,
    })
    .select()
    .single();

  if (dbError) {
    throw new Error("FAILED_TO_STORE_LINK");
  }

  return {
    link: {
      id: integration.id,
      issue_id: input.issue_id,
      github_pr_number: githubPrNumber,
      github_pr_url: input.github_pr_url,
      github_repo_full_name: repo,
      auto_merge: integration.auto_merge,
      synced_at: integration.synced_at,
    },
  };
}

/**
 * Generate branch name from issue identifier and title
 */
function generateBranchName(identifier: string, title: string): string {
  // Convert title to kebab-case
  const kebabTitle = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .substring(0, 50);

  return `${identifier}-${kebabTitle}`;
}
