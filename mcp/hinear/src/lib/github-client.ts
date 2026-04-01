import { Octokit } from "@octokit/rest";
import { readEnv } from "./env";

/**
 * GitHub client wrapper with rate limit handling
 */
export class GitHubClient {
  private octokit: Octokit;

  constructor() {
    const env = readEnv();

    if (!env.githubToken) {
      throw new Error(
        "GitHub token not found. Set GITHUB_TOKEN environment variable."
      );
    }

    this.octokit = new Octokit({
      auth: env.githubToken,
    });
  }

  /**
   * Get the underlying Octokit instance
   */
  getOctokit(): Octokit {
    return this.octokit;
  }

  /**
   * Check if rate limit is near exhaustion
   */
  async isRateLimitNear(threshold = 100): Promise<boolean> {
    try {
      const { data } = await this.octokit.rest.rateLimit.get();
      const remaining = data.rate.remaining;
      return remaining < threshold;
    } catch (error) {
      console.error("Failed to check rate limit:", error);
      return false;
    }
  }

  /**
   * Parse GitHub repository full name from URL
   * @param url - GitHub URL (issue, PR, or repo URL)
   * @returns Repository full name (owner/repo) or null
   */
  static parseRepoFullName(url: string): string | null {
    const patterns = [
      /https:\/\/github\.com\/([^/]+)\/([^/]+)\/issues\/\d+/,
      /https:\/\/github\.com\/([^/]+)\/([^/]+)\/pull\/\d+/,
      /https:\/\/github\.com\/([^/]+)\/([^/]+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return `${match[1]}/${match[2]}`;
      }
    }

    return null;
  }

  /**
   * Parse GitHub issue number from URL
   * @param url - GitHub issue URL
   * @returns Issue number or null
   */
  static parseIssueNumber(url: string): number | null {
    const pattern = /https:\/\/github\.com\/[^/]+\/[^/]+\/issues\/(\d+)/;
    const match = url.match(pattern);
    return match ? parseInt(match[1], 10) : null;
  }

  /**
   * Parse GitHub PR number from URL
   * @param url - GitHub PR URL
   * @returns PR number or null
   */
  static parsePRNumber(url: string): number | null {
    const pattern = /https:\/\/github\.com\/[^/]+\/[^/]+\/pull\/(\d+)/;
    const match = url.match(pattern);
    return match ? parseInt(match[1], 10) : null;
  }

  /**
   * Create a GitHub branch
   * @param owner - Repository owner
   * @param repo - Repository name
   * @param branchName - New branch name
   * @param baseBranch - Base branch to branch from
   * @returns Created branch reference
   */
  async createBranch(
    owner: string,
    repo: string,
    branchName: string,
    baseBranch: string = "main"
  ): Promise<{ ref: string; url: string }> {
    try {
      // Get base branch SHA
      const { data: baseBranchData } = await this.octokit.rest.git.getRef({
        owner,
        repo,
        ref: `heads/${baseBranch}`,
      });

      const sha = baseBranchData.object.sha;

      // Create new branch
      const { data: newBranch } = await this.octokit.rest.git.createRef({
        owner,
        repo,
        ref: `refs/heads/${branchName}`,
        sha,
      });

      return {
        ref: newBranch.ref,
        url: newBranch.object.url,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to create branch: ${error.message}`);
      }
      throw new Error("Failed to create branch: Unknown error");
    }
  }

  /**
   * Verify GitHub issue exists
   * @param owner - Repository owner
   * @param repo - Repository name
   * @param issueNumber - Issue number
   * @returns Issue data if exists
   */
  async verifyIssue(
    owner: string,
    repo: string,
    issueNumber: number
  ): Promise<{ number: number; title: string; state: string } | null> {
    try {
      const { data } = await this.octokit.rest.issues.get({
        owner,
        repo,
        issue_number: issueNumber,
      });

      return {
        number: data.number,
        title: data.title,
        state: data.state,
      };
    } catch (error) {
      if (error instanceof Error && "status" in error) {
        if ((error as any).status === 404) {
          return null;
        }
      }
      throw error;
    }
  }

  /**
   * Verify GitHub PR exists
   * @param owner - Repository owner
   * @param repo - Repository name
   * @param prNumber - PR number
   * @returns PR data if exists
   */
  async verifyPullRequest(
    owner: string,
    repo: string,
    prNumber: number
  ): Promise<{
    number: number;
    title: string;
    state: string;
    merged: boolean;
  } | null> {
    try {
      const { data } = await this.octokit.rest.pulls.get({
        owner,
        repo,
        pull_number: prNumber,
      });

      return {
        number: data.number,
        title: data.title,
        state: data.state,
        merged: data.merged_at !== null,
      };
    } catch (error) {
      if (error instanceof Error && "status" in error) {
        if ((error as any).status === 404) {
          return null;
        }
      }
      throw error;
    }
  }
}

/**
 * Create a singleton GitHub client instance
 */
let githubClientInstance: GitHubClient | null = null;

export function getGitHubClient(): GitHubClient {
  if (!githubClientInstance) {
    githubClientInstance = new GitHubClient();
  }
  return githubClientInstance;
}
