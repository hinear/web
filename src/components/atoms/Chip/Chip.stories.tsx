import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Chip } from "@/components/atoms/Chip";

function ChipRowPreview() {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-[16px] bg-[var(--app-color-surface-0)] p-6">
      <Chip variant="neutral">My issues</Chip>
      <Chip variant="accent">Updated today</Chip>
      <Chip variant="outline">7 active</Chip>
      <Chip variant="danger">1 blocked</Chip>
      <Chip size="sm" variant="violet">
        Copy
      </Chip>
    </div>
  );
}

const meta = {
  component: Chip,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
  args: {
    children: "Updated today",
    variant: "accent",
  },
  argTypes: {
    children: {
      control: "text",
    },
  },
} satisfies Meta<typeof Chip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Accent: Story = {};

export const Neutral: Story = {
  args: {
    children: "My issues",
    variant: "neutral",
  },
};

export const Outline: Story = {
  args: {
    children: "7 active",
    variant: "outline",
  },
};

export const Danger: Story = {
  args: {
    children: "1 blocked",
    variant: "danger",
  },
};

export const VioletSmall: Story = {
  args: {
    children: "Copy",
    size: "sm",
    variant: "violet",
  },
};

export const PenRow: StoryObj<typeof ChipRowPreview> = {
  render: () => <ChipRowPreview />,
  parameters: {
    controls: {
      disable: true,
    },
  },
};
