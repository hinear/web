import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SidebarDesktop } from "@/components/organisms/SidebarDesktop";

const meta = {
  component: SidebarDesktop,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
  args: {
    appName: "Hinear",
    dashboardLabel: "Open dashboard",
    projectLabel: "Project",
    projectSubtitle: "Personal Project",
    projectTitle: "Web App",
  },
} satisfies Meta<typeof SidebarDesktop>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const ProjectWorkspace: Story = {
  args: {
    projectSubtitle: "Team workspace",
    projectTitle: "Mobile App",
    primaryNavigation: ["issues", "triage", "active", "roadmap"],
  },
  parameters: {
    controls: {
      exclude: ["primaryNavigation"],
    },
  },
};
