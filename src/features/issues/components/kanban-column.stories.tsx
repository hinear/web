import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { KanbanColumn } from "@/features/issues/components/KanbanColumn";
import type { Issue } from "@/specs/issue-detail.contract";

const triageIssues: Issue[] = [
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
    identifier: "WEB-128",
    title: "대시보드 분석 쿼리를 리팩터링해 타임아웃 스파이크 줄이기",
    status: "Triage",
    priority: "High",
    assignee: { id: "user-2", name: "Doyun" },
    labels: [
      { id: "label-3", name: "Tech debt", color: "#6B7280" },
      { id: "label-4", name: "Analytics", color: "#6D28D9" },
    ],
    description: "",
    dueDate: null,
    comments: [],
    activityLog: [],
    createdAt: "2026-03-20T10:00:00Z",
    updatedAt: "2026-03-20T10:00:00Z",
  },
];

const meta = {
  component: KanbanColumn,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
  args: {
    issues: triageIssues,
    status: "Triage",
  },
} satisfies Meta<typeof KanbanColumn>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Triage: Story = {};

export const Empty: Story = {
  args: {
    issues: [],
  },
};

export const DropTarget: Story = {
  args: {
    forceDropTarget: true,
    isDragging: true,
    issues: [],
  },
};
