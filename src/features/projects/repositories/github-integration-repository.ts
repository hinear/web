import "server-only";

import type {
  GitHubIntegrationSettings,
  UpdateGitHubIntegrationInput,
} from "@/features/projects/contracts";
import type { AppSupabaseServerClient } from "@/lib/supabase/server-client";

export class GitHubIntegrationRepository {
  constructor(private readonly client: AppSupabaseServerClient) {}

  async updateGitHubIntegration(
    input: UpdateGitHubIntegrationInput
  ): Promise<void> {
    const { error } = await this.client
      .from("projects")
      .update({
        github_integration_enabled: input.enabled,
        github_repo_owner: input.repoOwner,
        github_repo_name: input.repoName,
      } as any)
      .eq("id", input.projectId);

    if (error) {
      throw new Error(`Failed to update GitHub integration: ${error.message}`);
    }
  }

  async getGitHubIntegration(
    projectId: string
  ): Promise<GitHubIntegrationSettings> {
    const { data, error } = await this.client
      .from("projects")
      .select("github_integration_enabled, github_repo_owner, github_repo_name")
      .eq("id", projectId)
      .single();

    if (error) {
      throw new Error(`Failed to load GitHub integration: ${error.message}`);
    }

    return {
      enabled: data.github_integration_enabled ?? false,
      repoOwner: data.github_repo_owner,
      repoName: data.github_repo_name,
      connected: !!(data.github_repo_owner && data.github_repo_name),
    };
  }

  async disconnectGitHubIntegration(projectId: string): Promise<void> {
    const { error } = await this.client
      .from("projects")
      .update({
        github_integration_enabled: false,
        github_repo_owner: null,
        github_repo_name: null,
      })
      .eq("id", projectId);

    if (error) {
      throw new Error(
        `Failed to disconnect GitHub integration: ${error.message}`
      );
    }
  }
}
