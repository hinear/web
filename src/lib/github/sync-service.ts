import "server-only";

import type { GitHubApiClient } from "@/lib/github/api-client";
import { createGitHubInstallationClientForRepository } from "@/lib/github/app-auth";
import type { AppSupabaseServerClient } from "@/lib/supabase/server-client";

export interface GitHubSyncServiceInput {
  projectId: string;
  issueId: string;
  issueNumber: number;
  identifier: string;
  title: string;
  description: string;
  status: string;
  labels: Array<{ name: string; color: string }>;
}

function isGitHubIssueSyncEnabled(): boolean {
  const value = process.env.GITHUB_ISSUE_SYNC_ENABLED?.trim().toLowerCase();
  return value === "enabled" || value === "true";
}

export class GitHubSyncService {
  constructor(
    private readonly client: AppSupabaseServerClient,
    private readonly githubClient?: GitHubApiClient
  ) {}

  /**
   * Sync a newly created Hinear issue to GitHub
   */
  async syncIssueToGitHub(input: GitHubSyncServiceInput): Promise<{
    githubIssueId: number;
    githubIssueNumber: number;
  } | null> {
    if (!isGitHubIssueSyncEnabled()) {
      return null;
    }

    // Get project GitHub settings
    const { data: project } = await this.client
      .from("projects")
      .select("github_integration_enabled, github_repo_owner, github_repo_name")
      .eq("id", input.projectId)
      .single();

    if (
      !project ||
      !project.github_integration_enabled ||
      !project.github_repo_owner ||
      !project.github_repo_name
    ) {
      // GitHub integration not enabled for this project
      return null;
    }

    try {
      const apiClient =
        this.githubClient ??
        (await createGitHubInstallationClientForRepository(
          project.github_repo_owner,
          project.github_repo_name
        ));

      if (!apiClient) {
        return null;
      }

      // Map status to GitHub state
      const githubState = this.mapStatusToGitHubState(input.status);

      // Create GitHub Issue
      const githubIssue = await apiClient.createIssue(
        project.github_repo_owner,
        project.github_repo_name,
        {
          title: input.title,
          body: this.buildGitHubIssueBody(input),
          labels: input.labels.map((l) => l.name),
          state: githubState,
        }
      );

      // Update issue with GitHub information
      const { error: updateError } = await this.client
        .from("issues")
        .update({
          github_issue_id: githubIssue.id,
          github_issue_number: githubIssue.number,
          github_synced_at: new Date().toISOString(),
          github_sync_status: "synced",
        } as any)
        .eq("id", input.issueId);

      if (updateError) {
        console.error("Failed to update issue with GitHub info:", updateError);
        throw new Error(`Failed to update issue: ${updateError.message}`);
      }

      return {
        githubIssueId: githubIssue.id,
        githubIssueNumber: githubIssue.number,
      };
    } catch (error) {
      console.error("Failed to sync issue to GitHub:", error);

      // Mark sync as failed
      await this.client
        .from("issues")
        .update({ github_sync_status: "error" } as any)
        .eq("id", input.issueId);

      throw error;
    }
  }

  /**
   * Map Hinear status to GitHub state
   */
  private mapStatusToGitHubState(status: string): "open" | "closed" {
    return ["Done", "Closed", "Canceled"].includes(status) ? "closed" : "open";
  }

  /**
   * Build GitHub issue body with Hinear metadata
   */
  private buildGitHubIssueBody(input: GitHubSyncServiceInput): string {
    const appOrigin = process.env.APP_ORIGIN ?? "https://hinear.com";
    const issueUrl = `${appOrigin}/projects/${input.projectId}/issues/${input.issueId}`;

    return `${input.description}

---

🔗 [View on Hinear](${issueUrl}) | **${input.identifier}**`;
  }

  /**
   * Update GitHub issue when Hinear issue is updated
   */
  async updateGitHubIssue(
    input: GitHubSyncServiceInput & {
      githubIssueId: number;
      githubIssueNumber: number;
    }
  ): Promise<void> {
    if (!isGitHubIssueSyncEnabled()) {
      return;
    }

    const { data: project } = await this.client
      .from("projects")
      .select("github_integration_enabled, github_repo_owner, github_repo_name")
      .eq("id", input.projectId)
      .single();

    if (
      !project ||
      !project.github_integration_enabled ||
      !project.github_repo_owner ||
      !project.github_repo_name
    ) {
      return;
    }

    try {
      const apiClient =
        this.githubClient ??
        (await createGitHubInstallationClientForRepository(
          project.github_repo_owner,
          project.github_repo_name
        ));

      if (!apiClient) {
        return;
      }

      const githubState = this.mapStatusToGitHubState(input.status);

      await apiClient.updateIssue(
        project.github_repo_owner,
        project.github_repo_name,
        input.githubIssueNumber,
        {
          title: input.title,
          body: this.buildGitHubIssueBody(input),
          state: githubState,
        }
      );

      // Update synced timestamp
      await this.client
        .from("issues")
        .update({
          github_synced_at: new Date().toISOString(),
          github_sync_status: "synced",
        } as any)
        .eq("id", input.issueId);
    } catch (error) {
      console.error("Failed to update GitHub issue:", error);

      await this.client
        .from("issues")
        .update({ github_sync_status: "error" } as any)
        .eq("id", input.issueId);

      throw error;
    }
  }
}
