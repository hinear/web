import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Button } from "@/components/atoms/Button";

function ButtonPairPreview() {
  return (
    <div className="flex items-center gap-4 rounded-[16px] bg-[var(--app-color-surface-0)] p-6">
      <Button variant="secondary">Cancel</Button>
      <Button variant="primary">Create issue</Button>
    </div>
  );
}

const meta = {
  component: Button,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
  args: {
    children: "Create project",
    size: "sm",
    variant: "primary",
  },
  argTypes: {
    children: {
      control: "text",
    },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {};

export const Secondary: Story = {
  args: {
    variant: "secondary",
  },
};

export const Ghost: Story = {
  args: {
    variant: "ghost",
  },
};

export const Medium: Story = {
  args: {
    size: "md",
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};

export const PenPair: StoryObj<typeof ButtonPairPreview> = {
  render: () => <ButtonPairPreview />,
  parameters: {
    controls: {
      disable: true,
    },
  },
};
