import { spawn } from "node:child_process";
import process from "node:process";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { MCP_ENV_FILE, REPO_ROOT, readEnvFile } from "./shared.js";

const EXPECTED_TOOL_NAMES = [
  "list_projects",
  "search_issues",
  "get_issue_detail",
  "create_issue",
  "update_issue_status",
  "add_comment",
  "hinear_mcp_status",
  "list_labels",
  "create_label",
  "update_label",
  "delete_label",
  "batch_update_issues",
  "list_members",
  "invite_member",
  "update_member_role",
  "remove_member",
  "create_github_branch",
  "link_github_issue",
  "link_github_pr",
] as const;

type ProjectSummary = {
  id: string;
  key: string;
  name: string;
  role?: string;
};

type CreatedIssueSummary = {
  id: string;
  identifier: string;
  project_id: string;
  status: string;
  title: string;
};

function readOption(name: string): string | undefined {
  const flag = `--${name}`;
  const index = process.argv.indexOf(flag);

  if (index === -1) {
    return undefined;
  }

  return process.argv[index + 1]?.trim() || "";
}

function hasFlag(name: string): boolean {
  return process.argv.includes(`--${name}`);
}

function toEnvRecord(entries: Map<string, string>) {
  return Object.fromEntries(entries) as Record<string, string>;
}

function getTextContent(
  result: Awaited<ReturnType<Client["callTool"]>>
): string | null {
  if (!("content" in result)) {
    return null;
  }

  if (!Array.isArray(result.content)) {
    return null;
  }

  const textPart = result.content.find(
    (
      item
    ): item is {
      type: "text";
      text: string;
    } =>
      typeof item === "object" &&
      item !== null &&
      "type" in item &&
      item.type === "text" &&
      "text" in item &&
      typeof item.text === "string"
  );

  return textPart?.text ?? null;
}

function parseJsonText<T>(text: string, label: string): T {
  try {
    return JSON.parse(text) as T;
  } catch (error) {
    throw new Error(
      `${label} returned invalid JSON text: ${
        error instanceof Error ? error.message : "unknown parse error"
      }`
    );
  }
}

function readHost(env: NodeJS.ProcessEnv) {
  return env.HINEAR_MCP_HOST?.trim() || "127.0.0.1";
}

function readPort(env: NodeJS.ProcessEnv) {
  const value = Number.parseInt(env.HINEAR_MCP_PORT ?? "", 10);
  return Number.isFinite(value) ? value : 3334;
}

function readPath(env: NodeJS.ProcessEnv) {
  const value = env.HINEAR_MCP_PATH?.trim();
  return value?.startsWith("/") ? value : "/mcp";
}

async function waitForServer(healthUrl: string, attempts = 40) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await fetch(healthUrl);

      if (response.ok) {
        return;
      }
    } catch {}

    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  throw new Error(`Timed out waiting for MCP server health at ${healthUrl}.`);
}

async function main() {
  const envEntries = readEnvFile(MCP_ENV_FILE);
  const env = {
    ...process.env,
    ...toEnvRecord(envEntries),
  };
  const host = readHost(env);
  const port = readPort(env);
  const endpointPath = readPath(env);
  const serverUrl = `http://${host}:${port}${endpointPath}`;
  const healthUrl = `http://${host}:${port}/health`;
  const client = new Client({
    name: "hinear-smoke-test",
    version: "0.1.0",
  });
  const serverProcess = spawn("pnpm", ["--filter", "@hinear/mcp", "dev"], {
    cwd: REPO_ROOT,
    env,
    stdio: "inherit",
  });
  const transport = new StreamableHTTPClientTransport(new URL(serverUrl));
  const writeMode = hasFlag("write");
  const requestedProjectId = readOption("project-id");

  try {
    await waitForServer(healthUrl);
    await client.connect(transport);

    const toolsResult = await client.listTools();
    const toolNames = toolsResult.tools.map((tool) => tool.name).sort();
    const expectedNames = [...EXPECTED_TOOL_NAMES].sort();
    const missingTools = expectedNames.filter(
      (name) => !toolNames.includes(name)
    );

    if (missingTools.length > 0) {
      throw new Error(`Missing MCP tools: ${missingTools.join(", ")}`);
    }

    const statusResult = await client.callTool({
      name: "hinear_mcp_status",
      arguments: {},
    });
    const statusText = getTextContent(statusResult);

    if (!statusText) {
      throw new Error("Status tool returned no text content.");
    }

    const status = JSON.parse(statusText) as {
      ok?: boolean;
      implementedTools?: string[];
    };

    if (!status.ok) {
      throw new Error("Status tool returned ok=false.");
    }

    const configuredAuth =
      Boolean(env.HINEAR_MCP_ACCESS_TOKEN?.trim()) ||
      Boolean(env.HINEAR_MCP_USER_ID?.trim());

    let listProjectsOutcome = "skipped";
    let searchIssuesOutcome = "skipped";
    let writeOutcome = "skipped";
    let writeIssueIdentifier: string | null = null;

    if (configuredAuth) {
      const projectsResult = await client.callTool({
        name: "list_projects",
        arguments: {
          limit: writeMode ? 20 : 1,
        },
      });

      if ("isError" in projectsResult && projectsResult.isError) {
        throw new Error("list_projects returned an error during smoke test.");
      }

      const projectsText = getTextContent(projectsResult);

      if (!projectsText) {
        throw new Error("list_projects returned no text content.");
      }

      const projectsPayload = parseJsonText<{
        projects?: ProjectSummary[];
      }>(projectsText, "list_projects");
      const firstProjectId = projectsPayload.projects?.[0]?.id;
      const writeProject =
        projectsPayload.projects?.find((project) =>
          requestedProjectId
            ? project.id === requestedProjectId
            : project.role === "owner"
        ) ?? null;

      listProjectsOutcome = "passed";

      if (firstProjectId) {
        const searchIssuesResult = await client.callTool({
          name: "search_issues",
          arguments: {
            limit: 1,
            project_id: firstProjectId,
          },
        });

        if ("isError" in searchIssuesResult && searchIssuesResult.isError) {
          throw new Error("search_issues returned an error during smoke test.");
        }

        searchIssuesOutcome = "passed";
      } else {
        searchIssuesOutcome = "skipped(no project)";
      }

      if (writeMode) {
        if (!writeProject) {
          throw new Error(
            requestedProjectId
              ? `Could not find writable project ${requestedProjectId} in list_projects output.`
              : "Could not find an owner project for write smoke."
          );
        }

        const createIssueResult = await client.callTool({
          name: "create_issue",
          arguments: {
            project_id: writeProject.id,
            title: `[MCP smoke] ${new Date().toISOString()}`,
            description:
              "Automated Hinear MCP write smoke test. This issue can be kept as an audit trace.",
            priority: "low",
            status: "triage",
            labels: ["mcp-smoke"],
          },
        });

        if ("isError" in createIssueResult && createIssueResult.isError) {
          throw new Error("create_issue returned an error during write smoke.");
        }

        const createIssueText = getTextContent(createIssueResult);

        if (!createIssueText) {
          throw new Error("create_issue returned no text content.");
        }

        const createdIssuePayload = parseJsonText<{
          issue?: CreatedIssueSummary;
        }>(createIssueText, "create_issue");
        const createdIssue = createdIssuePayload.issue;

        if (!createdIssue?.id) {
          throw new Error("create_issue returned no issue id.");
        }

        writeIssueIdentifier = createdIssue.identifier;

        const issueDetailResult = await client.callTool({
          name: "get_issue_detail",
          arguments: {
            issue_id: createdIssue.id,
            include_activity: true,
            include_comments: true,
            activity_limit: 5,
            comment_limit: 5,
          },
        });

        if ("isError" in issueDetailResult && issueDetailResult.isError) {
          throw new Error(
            "get_issue_detail returned an error during write smoke."
          );
        }

        const updateStatusResult = await client.callTool({
          name: "update_issue_status",
          arguments: {
            issue_id: createdIssue.id,
            status: "canceled",
            comment_on_change: "Automated MCP smoke test status transition.",
          },
        });

        if ("isError" in updateStatusResult && updateStatusResult.isError) {
          throw new Error(
            "update_issue_status returned an error during write smoke."
          );
        }

        const addCommentResult = await client.callTool({
          name: "add_comment",
          arguments: {
            issue_id: createdIssue.id,
            body: "Automated MCP smoke test comment.",
          },
        });

        if ("isError" in addCommentResult && addCommentResult.isError) {
          throw new Error("add_comment returned an error during write smoke.");
        }

        writeOutcome = `passed(${writeProject.key}:${createdIssue.identifier})`;
      }
    }

    console.log("Hinear MCP smoke test passed.");
    console.log(`- tools: ${toolNames.join(", ")}`);
    console.log(`- status.ok: ${status.ok === true}`);
    console.log(
      `- status.implementedTools: ${(status.implementedTools ?? []).join(", ")}`
    );
    console.log(`- list_projects: ${listProjectsOutcome}`);
    console.log(`- search_issues: ${searchIssuesOutcome}`);
    console.log(`- write: ${writeOutcome}`);
    if (writeIssueIdentifier) {
      console.log(`- write.issue: ${writeIssueIdentifier}`);
    }
    console.log(`- env file: ${MCP_ENV_FILE}`);
  } finally {
    await client.close().catch(() => undefined);
    serverProcess.kill("SIGTERM");
  }
}

void main().catch((error) => {
  console.error(
    error instanceof Error ? error.message : "Unknown smoke test error."
  );
  process.exitCode = 1;
});
