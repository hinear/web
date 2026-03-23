import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { DrawerIssueDetailPanel } from "@/components/organisms/DrawerIssueDetailPanel";
import type { ActivityLogEntry, Issue } from "@/specs/issue-detail.contract";

const issue: Issue = {
  id: "issue-123",
  identifier: "WEB-123",
  title: "사용자 인증 플로우 구현",
  status: "In Progress",
  priority: "High",
  assignee: {
    id: "user-2",
    name: "Jane Smith",
  },
  labels: [
    { id: "label-1", name: "auth", color: "#7C3AED" },
    { id: "label-2", name: "backend", color: "#059669" },
    { id: "label-3", name: "oauth", color: "#2563EB" },
  ],
  description:
    "Google, GitHub 기반 OAuth2 로그인과 토큰 흐름을 정리합니다.\n- 소셜 로그인\n- 이메일 인증 fallback\n- 콜백 처리",
  dueDate: null,
  comments: [],
  activityLog: [],
  createdAt: "2026-03-18T08:00:00Z",
  updatedAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
};

const activityLog: ActivityLogEntry[] = [
  {
    id: "activity-1",
    actor: { id: "user-2", name: "Jane Smith" },
    createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    summary: "Status changed from Todo to In Progress",
    type: "issue.status.updated",
  },
  {
    id: "activity-2",
    actor: { id: "user-1", name: "Alex Kim" },
    createdAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    summary: "Description updated with callback handling details",
    type: "issue.description.updated",
  },
];

const meta = {
  component: DrawerIssueDetailPanel,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
  args: {
    activityLog,
    createdByName: "Alex Kim",
    issue,
    lastEditedByName: "Jane Smith",
    modeLabel: "Inline edit",
  },
  decorators: [
    (Story) => (
      <div className="flex min-h-screen items-start justify-end bg-[var(--app-color-surface-0)] p-8">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof DrawerIssueDetailPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Minimal: Story = {
  args: {
    activityLog: [],
    issue: {
      ...issue,
      assignee: null,
      labels: [{ id: "label-1", name: "auth", color: "#7C3AED" }],
      priority: "Low",
    },
  },
};
