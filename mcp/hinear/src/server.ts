import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { resolveSession } from "./lib/auth";
import { readEnv } from "./lib/env";
import { registerAddCommentTool } from "./tools/add-comment";
import { registerBatchUpdateIssuesTool } from "./tools/batch-update-issues";
import { registerCreateGitHubBranchTool } from "./tools/create-github-branch";
import { registerCreateIssueTool } from "./tools/create-issue";
import { registerCreateLabelTool } from "./tools/create-label";
import { registerDeleteLabelTool } from "./tools/delete-label";
import { registerGetIssueDetailTool } from "./tools/get-issue-detail";
import { registerInviteMemberTool } from "./tools/invite-member";
import { registerLinkGitHubIssueTool } from "./tools/link-github-issue";
import { registerLinkGitHubPRTool } from "./tools/link-github-pr";
import { registerListLabelsTool } from "./tools/list-labels";
import { registerListMembersTool } from "./tools/list-members";
import { registerListProjectsTool } from "./tools/list-projects";
import { registerRemoveMemberTool } from "./tools/remove-member";
import { registerSearchIssuesTool } from "./tools/search-issues";
import { registerUpdateIssueStatusTool } from "./tools/update-issue-status";
import { registerUpdateLabelTool } from "./tools/update-label";
import { registerUpdateMemberRoleTool } from "./tools/update-member-role";

export function createServer(transport = "streamable-http") {
  const env = readEnv();
  const session = resolveSession();

  const server = new McpServer({
    name: "hinear",
    version: "0.2.0",
  });

  registerListProjectsTool(server);
  registerSearchIssuesTool(server);
  registerGetIssueDetailTool(server);
  registerCreateIssueTool(server);
  registerUpdateIssueStatusTool(server);
  registerAddCommentTool(server);
  registerListLabelsTool(server);
  registerCreateLabelTool(server);
  registerUpdateLabelTool(server);
  registerDeleteLabelTool(server);
  registerBatchUpdateIssuesTool(server);
  registerListMembersTool(server);
  registerInviteMemberTool(server);
  registerUpdateMemberRoleTool(server);
  registerRemoveMemberTool(server);
  registerCreateGitHubBranchTool(server);
  registerLinkGitHubIssueTool(server);
  registerLinkGitHubPRTool(server);

  server.tool(
    "hinear_mcp_status",
    "Return basic status information for the local Hinear MCP process.",
    {},
    async () => ({
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              ok: true,
              transport,
              accessTokenConfigured: Boolean(session.accessToken),
              appOrigin: env.appOrigin,
              supabaseUrlConfigured: Boolean(env.supabaseUrl),
              supabaseAnonKeyConfigured: Boolean(env.supabaseAnonKey),
              userIdConfigured: Boolean(session.userId),
              implementedTools: [
                "list_projects",
                "search_issues",
                "get_issue_detail",
                "create_issue",
                "update_issue_status",
                "add_comment",
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
              ],
              scaffoldedTools: [],
              note: "The Hinear MCP MVP is connected and ready for local use once auth and Supabase env are configured.",
            },
            null,
            2
          ),
        },
      ],
    })
  );

  return server;
}
