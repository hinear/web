import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import {
  OpenDashboardLink,
  ProjectSelect,
  ProjectSwitcher,
} from "@/components/molecules/ProjectSelect";

function ProjectSelectPreview() {
  return (
    <div className="w-[280px] rounded-[16px] bg-[var(--color-ink-900)] p-6">
      <ProjectSelect subtitle="Personal Project" title="Web App" />
    </div>
  );
}

const meta = {
  component: ProjectSelect,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
  args: {
    subtitle: "Personal Project",
    title: "Web App",
  },
} satisfies Meta<typeof ProjectSelect>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const PenPreview: StoryObj<typeof ProjectSelectPreview> = {
  render: () => <ProjectSelectPreview />,
  parameters: {
    controls: {
      disable: true,
    },
  },
};

export const SwitcherOpen: StoryObj<typeof ProjectSwitcher> = {
  render: () => (
    <div className="w-[280px] rounded-[16px] bg-[var(--color-ink-900)] p-6">
      <ProjectSwitcher subtitle="Personal Project" title="Web App" />
    </div>
  ),
  parameters: {
    controls: {
      disable: true,
    },
  },
};

export const SwitcherClosed: StoryObj<typeof ProjectSwitcher> = {
  render: () => (
    <div className="w-[280px] rounded-[16px] bg-[var(--color-ink-900)] p-6">
      <ProjectSwitcher
        open={false}
        subtitle="Personal Project"
        title="Web App"
      />
    </div>
  ),
  parameters: {
    controls: {
      disable: true,
    },
  },
};

export const DashboardLink: StoryObj<typeof OpenDashboardLink> = {
  render: () => (
    <div className="w-[280px] rounded-[16px] bg-[var(--color-ink-900)] p-6">
      <OpenDashboardLink />
    </div>
  ),
  parameters: {
    controls: {
      disable: true,
    },
  },
};
