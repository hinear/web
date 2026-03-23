import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { KanbanBoard } from "@/features/issues/components/KanbanBoard";
import type { Issue } from "@/specs/issue-detail.contract";

const issues: Issue[] = [
  {
    id: "issue-1",
    identifier: "HIN-101",
    title: "Refine tablet drawer metadata summary",
    status: "Triage",
    priority: "Medium",
    assignee: { id: "user-1", name: "Alex Kim" },
    labels: [
      { id: "label-1", name: "UI", color: "#5E6AD2" },
      { id: "label-2", name: "Tablet", color: "#0F766E" },
    ],
    description: "Bring tablet detail into the compact drawer pattern.",
    dueDate: null,
    comments: [],
    activityLog: [],
    createdAt: "2026-03-20T09:00:00Z",
    updatedAt: "2026-03-20T10:00:00Z",
  },
  {
    id: "issue-2",
    identifier: "HIN-102",
    title: "Add saving state references for desktop and mobile detail",
    status: "Backlog",
    priority: "Low",
    assignee: null,
    labels: [{ id: "label-3", name: "States", color: "#F59E0B" }],
    description: "Add explicit pending feedback variations for detail editing.",
    dueDate: null,
    comments: [],
    activityLog: [],
    createdAt: "2026-03-19T11:00:00Z",
    updatedAt: "2026-03-20T08:20:00Z",
  },
  {
    id: "issue-3",
    identifier: "HIN-103",
    title: "Connect operations settings card to reusable access component",
    status: "Todo",
    priority: "High",
    assignee: { id: "user-2", name: "John Doe" },
    labels: [{ id: "label-4", name: "Components", color: "#DC2626" }],
    description: "Replace local card fragments with imported component refs.",
    dueDate: null,
    comments: [],
    activityLog: [],
    createdAt: "2026-03-18T12:00:00Z",
    updatedAt: "2026-03-20T07:30:00Z",
  },
  {
    id: "issue-4",
    identifier: "HIN-104",
    title: "Polish create project mobile footer spacing",
    status: "In Progress",
    priority: "Urgent",
    assignee: { id: "user-3", name: "Jamie Park" },
    labels: [
      { id: "label-5", name: "Mobile", color: "#2563EB" },
      { id: "label-6", name: "Spacing", color: "#7C3AED" },
    ],
    description: "Stack CTA and helper copy for narrow mobile widths.",
    dueDate: null,
    comments: [],
    activityLog: [],
    createdAt: "2026-03-20T06:00:00Z",
    updatedAt: "2026-03-20T10:30:00Z",
  },
  {
    id: "issue-5",
    identifier: "HIN-105",
    title: "Review invitation accept card layout on small screens",
    status: "Done",
    priority: "Medium",
    assignee: { id: "user-4", name: "Mina Lee" },
    labels: [{ id: "label-7", name: "Review", color: "#16A34A" }],
    dueDate: null,
    description: "Ensure footer buttons and notice card keep readable spacing.",
    comments: [],
    activityLog: [],
    createdAt: "2026-03-17T06:00:00Z",
    updatedAt: "2026-03-19T09:00:00Z",
  },
  {
    id: "issue-6",
    identifier: "HIN-106",
    title: "Remove duplicate standalone invitations page from MVP flow",
    status: "Canceled",
    priority: "No Priority",
    assignee: null,
    labels: [{ id: "label-8", name: "MVP", color: "#6B7280" }],
    description: "Settings now owns member and invite management directly.",
    dueDate: null,
    comments: [],
    activityLog: [],
    createdAt: "2026-03-16T06:00:00Z",
    updatedAt: "2026-03-18T09:00:00Z",
  },
];

const meta = {
  component: KanbanBoard,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    controls: {
      expanded: true,
    },
  },
  args: {
    issues,
    projectId: "test-project",
    onNavigate: (href: string) => {
      console.log(`[Storybook] Navigate to: ${href}`);
    },
    onIssueUpdate: (issueId, updates) => {
      console.log(`[Storybook] Issue update:`, { issueId, updates });
      // Simulate async update
      const originalIssue = issues.find((i) => i.id === issueId)!;
      return Promise.resolve({
        ...originalIssue,
        ...updates,
      });
    },
    onAddCard: (status) => {
      console.log(`[Storybook] Add card to status:`, status);
    },
  },
} satisfies Meta<typeof KanbanBoard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = {};
