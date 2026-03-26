import "server-only";

export interface GitHubRepository {
  default_branch: string;
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  owner: {
    login: string;
  };
  private: boolean;
  description: string | null;
}

export interface GitHubUser {
  login: string;
  id: number;
}

export interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  body: string | null;
  state: "open" | "closed";
  html_url: string;
}

export interface GitHubBranch {
  name: string;
  commit: {
    sha: string;
  };
}

export class GitHubApiClient {
  constructor(private readonly accessToken: string) {}

  private async fetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`https://api.github.com${endpoint}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        Accept: "application/vnd.github.v3+json",
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`GitHub API error: ${response.status} ${error}`);
    }

    return response.json();
  }

  async listUserRepositories(): Promise<GitHubRepository[]> {
    return this.fetch<GitHubRepository[]>("/user/repos?per_page=100");
  }

  async getRepository(owner: string, name: string): Promise<GitHubRepository> {
    return this.fetch<GitHubRepository>(`/repos/${owner}/${name}`);
  }

  async getBranch(
    owner: string,
    name: string,
    branch: string
  ): Promise<GitHubBranch> {
    return this.fetch<GitHubBranch>(
      `/repos/${owner}/${name}/branches/${encodeURIComponent(branch)}`
    );
  }

  async createBranch(
    owner: string,
    name: string,
    branch: string,
    sha: string
  ): Promise<void> {
    await this.fetch(`/repos/${owner}/${name}/git/refs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ref: `refs/heads/${branch}`,
        sha,
      }),
    });
  }

  async getUser(): Promise<GitHubUser> {
    return this.fetch<GitHubUser>("/user");
  }

  async createWebhook(
    owner: string,
    name: string,
    config: {
      url: string;
      secret: string;
    }
  ): Promise<void> {
    await this.fetch(`/repos/${owner}/${name}/hooks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "web",
        active: true,
        events: ["issues", "issue_comment", "pull_request", "push"],
        config: {
          url: config.url,
          secret: config.secret,
          content_type: "json",
        },
      }),
    });
  }

  async listWebhooks(owner: string, name: string): Promise<any[]> {
    return this.fetch(`/repos/${owner}/${name}/hooks`);
  }

  async deleteWebhook(
    owner: string,
    name: string,
    hookId: number
  ): Promise<void> {
    await this.fetch(`/repos/${owner}/${name}/hooks/${hookId}`, {
      method: "DELETE",
    });
  }

  async createIssue(
    owner: string,
    name: string,
    input: {
      title: string;
      body: string;
      labels?: string[];
      state?: "open" | "closed";
    }
  ): Promise<GitHubIssue> {
    return this.fetch<GitHubIssue>(`/repos/${owner}/${name}/issues`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: input.title,
        body: input.body,
        labels: input.labels ?? [],
      }),
    });
  }

  async updateIssue(
    owner: string,
    name: string,
    issueNumber: number,
    input: {
      title?: string;
      body?: string;
      state?: "open" | "closed";
    }
  ): Promise<GitHubIssue> {
    return this.fetch<GitHubIssue>(
      `/repos/${owner}/${name}/issues/${issueNumber}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(input),
      }
    );
  }
}
