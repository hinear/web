import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { LinearDashboardHeader } from "@/components/organisms/LinearDashboardHeader";
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
      { id: "label-2", name: "Blocked", color: "#DC2626" },
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
    title: "Polish mobile issue list spacing",
    status: "In Progress",
    priority: "Low",
    assignee: null,
    labels: [{ id: "label-3", name: "Mobile", color: "#0F766E" }],
    description: "Tighten section gaps for smaller screens.",
    dueDate: null,
    comments: [],
    activityLog: [],
    createdAt: "2026-03-20T08:00:00Z",
    updatedAt: "2026-03-20T11:00:00Z",
  },
  {
    id: "issue-3",
    identifier: "HIN-103",
    title: "Finalize detail card copy",
    status: "Done",
    priority: "High",
    assignee: { id: "user-2", name: "Mina Lee" },
    labels: [{ id: "label-4", name: "Copy", color: "#6D28D9" }],
    description: "Resolve remaining content mismatches.",
    dueDate: null,
    comments: [],
    activityLog: [],
    createdAt: "2026-03-19T08:00:00Z",
    updatedAt: "2026-03-19T11:00:00Z",
  },
];

const meta = {
  component: LinearDashboardHeader,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
  args: {
    eyebrow: "Web App / Cycle 12",
    issues,
    subtitle: "Focused view of triage, build, and shipped work.",
    title: "Issue board",
  },
  decorators: [
    (Story) => (
      <div className="min-h-screen bg-[var(--app-color-white)] p-8">
        <div className="mx-auto max-w-[960px]">
          <Story />
        </div>
      </div>
    ),
  ],
} satisfies Meta<typeof LinearDashboardHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
