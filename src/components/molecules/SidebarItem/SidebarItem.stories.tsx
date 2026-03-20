import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Folder } from "lucide-react";

import { SidebarItem } from "@/components/molecules/SidebarItem";

function SidebarItemPreview() {
  return (
    <div className="flex w-[280px] flex-col gap-3 rounded-[16px] bg-[var(--color-ink-900)] p-6">
      <SidebarItem variant="issues" />
      <SidebarItem variant="triage" />
      <SidebarItem variant="active" />
      <SidebarItem variant="backlog" />
      <SidebarItem variant="roadmap" />
      <SidebarItem
        icon={<Folder className="h-4 w-4" />}
        kind="project"
        label="Mobile App"
      />
      <SidebarItem
        active
        icon={<Folder className="h-4 w-4" />}
        kind="project"
        label="Web App"
      />
    </div>
  );
}

const meta = {
  component: SidebarItem,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
  args: {
    variant: "issues",
  },
} satisfies Meta<typeof SidebarItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Issues: Story = {};

export const Triage: Story = {
  args: {
    variant: "triage",
  },
};

export const Active: Story = {
  args: {
    variant: "active",
  },
};

export const Backlog: Story = {
  args: {
    variant: "backlog",
  },
};

export const Roadmap: Story = {
  args: {
    variant: "roadmap",
  },
};

export const ProjectDefault: Story = {
  args: {
    icon: <Folder className="h-4 w-4" />,
    kind: "project",
    label: "Mobile App",
  },
};

export const ProjectActive: Story = {
  args: {
    active: true,
    icon: <Folder className="h-4 w-4" />,
    kind: "project",
    label: "Web App",
  },
};

export const PenPreview: StoryObj<typeof SidebarItemPreview> = {
  render: () => <SidebarItemPreview />,
  parameters: {
    controls: {
      disable: true,
    },
  },
};
