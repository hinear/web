# Hinear MCP

`@hinear/mcp` is the local `Streamable HTTP` MCP server for Hinear.

## Purpose

This package exposes a comprehensive MCP surface for Hinear workflows:

**Phase 1 (MVP)**:
- listing accessible projects
- searching issues
- reading issue detail
- creating issues
- updating issue status
- adding comments

**Phase 2/3**:
- label management (list, create, update, delete)
- batch issue updates (status, priority, assignee)
- member management (list, invite, update role, remove)
- GitHub integration (create branch, link issue/PR)
- MCP access token authentication

## Commands

```bash
pnpm install
pnpm mcp:hinear:login
pnpm mcp:hinear
pnpm mcp:hinear:typecheck
pnpm mcp:hinear:smoke
```

## Required environment

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `HINEAR_MCP_ACCESS_TOKEN` or `HINEAR_MCP_USER_ID`
- `GITHUB_TOKEN` (optional, for GitHub integration tools)

`HINEAR_MCP_ACCESS_TOKEN` is recommended because it lets the MCP resolve the current user from Supabase and apply project access checks with the same user context.

**MCP Access Tokens** (Phase 2):
You can also issue dedicated MCP access tokens via the web app at `/settings/mcp`. These tokens:
- Are scoped to a specific user
- Support expiration (30d, 90d, never)
- Can be revoked individually
- Are stored securely with SHA-256 hashing

## Login helper

Instead of exporting every variable in your shell, use:

```bash
pnpm mcp:hinear:login
```

The login helper now:

- reuses defaults from the repository root `.env.local` when available
- supports `--email <email>` to resolve `HINEAR_MCP_USER_ID` through `profiles`
- supports `--non-interactive` for scripted setup when required values are already available

Example:

```bash
pnpm mcp:hinear:login --email you@example.com
```

This command prompts for the required values and saves them to:

`mcp/hinear/.env.local`

After that, `pnpm mcp:hinear` automatically loads that file before starting the MCP server.

## Local MCP config

The repository-level `.mcp.json` includes a ready-to-use local server entry:

```json
{
  "mcpServers": {
    "hinear": {
      "type": "http",
      "url": "http://127.0.0.1:3334/mcp"
    }
  }
}
```

Start the local server with `pnpm mcp:hinear`, then point your MCP client at `http://127.0.0.1:3334/mcp`.
The launcher script still loads `mcp/hinear/.env.local`, so the MCP client does not need to forward those env vars directly.

## Implemented tools

**Core (Phase 1)**:
- `hinear_mcp_status`
- `list_projects`
- `search_issues`
- `get_issue_detail`
- `create_issue`
- `update_issue_status`
- `add_comment`

**Label Management (Phase 2)**:
- `list_labels` - List all labels for a project
- `create_label` - Create a new label
- `update_label` - Update label name/color/description
- `delete_label` - Delete a label

**Batch Operations (Phase 2)**:
- `batch_update_issues` - Update multiple issues at once (max 100)

**Member Management (Phase 2)**:
- `list_members` - List all project members
- `invite_member` - Invite a new member
- `update_member_role` - Change member role (owner/member)
- `remove_member` - Remove member or revoke invitation

**GitHub Integration (Phase 3)**:
- `create_github_branch` - Create branch for issue (requires GITHUB_TOKEN)
- `link_github_issue` - Link Hinear issue to GitHub issue
- `link_github_pr` - Link Hinear issue to GitHub PR with auto-merge option

## Current status

The Hinear MCP server is complete with Phase 2/3 features. All 18 tools are connected to real Hinear data paths with proper authentication and access control over Streamable HTTP.

You can also run a local smoke test that starts the HTTP server, verifies the registered tools, and calls `hinear_mcp_status`:

```bash
pnpm mcp:hinear:smoke
```

If `HINEAR_MCP_ACCESS_TOKEN` or `HINEAR_MCP_USER_ID` is configured, the smoke test also exercises `list_projects`.

For a fuller local end-to-end check, `--write` also runs `create_issue`, `get_issue_detail`, `update_issue_status`, and `add_comment` against an owner project:

```bash
pnpm mcp:hinear:smoke --write
```

The repository CI workflow only runs the read smoke path. It expects these GitHub secrets:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `HINEAR_MCP_EMAIL`

Recommended GitHub repository configuration:

- Repository secret `NEXT_PUBLIC_SUPABASE_URL`: the project URL, for example `https://<project-ref>.supabase.co`
- Repository secret `NEXT_PUBLIC_SUPABASE_ANON_KEY`: the public anon key used by the app
- Repository secret `SUPABASE_SERVICE_ROLE_KEY`: required so `pnpm mcp:hinear:login --email ...` can resolve `HINEAR_MCP_USER_ID`
- Repository secret `HINEAR_MCP_EMAIL`: an email address that already exists in `public.profiles`
- Repository variable `APP_ORIGIN`: optional, defaults to `http://localhost:3000` in CI

Setup path in GitHub:

1. Open `Settings`.
2. Go to `Secrets and variables` -> `Actions`.
3. Add the four repository secrets above.
4. Add `APP_ORIGIN` as a repository variable if you want a non-default value.

CI behavior:

- If any required secret is missing, the `MCP Smoke` job is skipped.
- If the smoke job fails, the workflow prints the generated `mcp/hinear/.env.local` key names without exposing values.

The next recommended steps are:
- exercise the server through a real MCP client
- implement GitHub webhook for auto-merge PR → issue closing
- add more batch operations (comments, labels)
- expand GitHub integration (PR status sync, branch protection)
