import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ConflictDialog } from "@/components/molecules/ConflictDialog";

const meta = {
  component: ConflictDialog,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof ConflictDialog>;

export default meta;

type Story = StoryObj<typeof ConflictDialog>;

export const Default: Story = {
  args: {
    currentVersion: 2,
    requestedVersion: 1,
    onDismiss: () => console.log("Dismissed"),
  },
  render: (args) => (
    <div className="flex min-h-[400px] items-center justify-center rounded-[16px] bg-[var(--app-color-surface-0)] p-6">
      <div className="w-full max-w-md">
        <ConflictDialog {...args} />
      </div>
    </div>
  ),
};

export const LargeVersionGap: Story = {
  args: {
    currentVersion: 10,
    requestedVersion: 3,
    onDismiss: () => console.log("Dismissed"),
  },
  render: (args) => (
    <div className="flex min-h-[400px] items-center justify-center rounded-[16px] bg-[var(--app-color-surface-0)] p-6">
      <div className="w-full max-w-md">
        <ConflictDialog {...args} />
      </div>
    </div>
  ),
};
