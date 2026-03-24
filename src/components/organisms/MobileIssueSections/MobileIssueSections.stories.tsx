import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { MobileIssueSections } from "@/components/organisms/MobileIssueSections";
import type { Issue } from "@/specs/issue-detail.contract";
import type { MobileIssueSectionsProps } from "./MobileIssueSections";

const issues: Issue[] = [
  {
    id: "issue-1",
    identifier: "WEB-127",
    title: "온보딩 성공 메시지용 카피 기준 정리",
    status: "Triage",
    priority: "Low",
    assignee: { id: "user-1", name: "Hana" },
    labels: [
      { id: "label-1", name: "Docs", color: "#6B7280" },
      { id: "label-2", name: "Copy", color: "#6D28D9" },
    ],
    description: "",
    dueDate: null,
    comments: [],
    activityLog: [],
    createdAt: "2026-03-20T09:00:00Z",
    updatedAt: "2026-03-20T09:00:00Z",
  },
  {
    id: "issue-2",
    identifier: "WEB-124",
    title: "인증 리다이렉트 루프 수정",
    status: "In Progress",
    priority: "High",
    assignee: { id: "user-2", name: "Doyun" },
    labels: [
      { id: "label-3", name: "Auth", color: "#6B7280" },
      { id: "label-4", name: "Blocked", color: "#DC2626" },
    ],
    description: "",
    dueDate: null,
    comments: [],
    activityLog: [],
    createdAt: "2026-03-20T10:00:00Z",
    updatedAt: "2026-03-20T10:00:00Z",
  },
  {
    id: "issue-3",
    identifier: "WEB-123",
    title: "사용자 인증 플로우 구현",
    status: "Done",
    priority: "Medium",
    assignee: { id: "user-3", name: "Mina" },
    labels: [],
    description: "",
    dueDate: null,
    comments: [],
    activityLog: [],
    createdAt: "2026-03-20T11:00:00Z",
    updatedAt: "2026-03-20T11:00:00Z",
  },
];

const defaultArgs = {
  issues,
} satisfies MobileIssueSectionsProps;

const meta = {
  component: MobileIssueSections,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
  args: defaultArgs,
  decorators: [
    (Story) => (
      <div className="w-[361px] rounded-[24px] bg-[var(--app-color-surface-0)] p-4">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof MobileIssueSections>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: defaultArgs,
};

export const Empty: Story = {
  args: {
    issues: [],
  },
};
