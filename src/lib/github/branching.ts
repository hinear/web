import type { Issue } from "@/features/issues/types";

function slugifyBranchSegment(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export function buildIssueBranchName(
  issue: Pick<Issue, "identifier" | "title">,
  customTitle?: string
): string {
  const match = issue.identifier.match(/^(.*)-(\d+)$/);
  const prefix = (match?.[1] ?? issue.identifier).toLowerCase();
  const issueNumber = match?.[2] ?? "0";
  const titleSlug =
    slugifyBranchSegment(customTitle ?? issue.title) || "work-item";

  return `${prefix}-${issueNumber}-${titleSlug}`;
}

export function getIssueBranchNamePreview(
  issue: Pick<Issue, "identifier" | "title">,
  customTitle?: string
): string {
  return buildIssueBranchName(issue, customTitle);
}

export function buildPullRequestTitle(
  issue: Pick<Issue, "identifier" | "title">
): string {
  return `${issue.identifier}: ${issue.title}`;
}

export function buildPullRequestBody(
  issue: Pick<Issue, "id" | "identifier" | "projectId" | "title">
): string {
  const appOrigin =
    process.env.APP_ORIGIN?.trim() || "https://hinear.vercel.app";
  const issueUrl = `${appOrigin}/projects/${issue.projectId}/issues/${issue.id}`;

  return [
    `## Summary`,
    ``,
    `- ${issue.title}`,
    ``,
    `## Context`,
    ``,
    `- Hinear issue: [${issue.identifier}](${issueUrl})`,
  ].join("\n");
}

export function buildPullRequestCompareUrl(input: {
  owner: string;
  repo: string;
  baseBranch: string;
  branchName: string;
  title: string;
  body: string;
}): string {
  const comparePath = `${encodeURIComponent(input.baseBranch)}...${encodeURIComponent(input.branchName)}`;
  const params = new URLSearchParams({
    expand: "1",
    title: input.title,
    body: input.body,
  });

  return `https://github.com/${input.owner}/${input.repo}/compare/${comparePath}?${params.toString()}`;
}
