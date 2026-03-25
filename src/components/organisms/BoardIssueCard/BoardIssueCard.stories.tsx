import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { BoardIssueCard } from "@/components/organisms/BoardIssueCard";

const sampleLabels = [
  { id: "label-1", name: "Docs", color: "#6B7280" },
  { id: "label-2", name: "Copy", color: "#6D28D9" },
];

const meta = {
  component: BoardIssueCard,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
  args: {
    issueStatus: "Todo",
    issueKey: "WEB-127",
    priority: "Low",
    issueTitle: "온보딩 성공 메시지용 카피 기준 정리",
    labels: sampleLabels,
    assignee: { id: "user-1", name: "Hana" },
    estimate: "2 pts",
  },
} satisfies Meta<typeof BoardIssueCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const NoMeta: Story = {
  args: {
    assignee: null,
    estimate: undefined,
    issueStatus: "Todo",
    labels: [],
    priority: "No Priority",
  },
};

export const PenPreview: Story = {
  args: {
    issueStatus: "In Progress",
  },
};
