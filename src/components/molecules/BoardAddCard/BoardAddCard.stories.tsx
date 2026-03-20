import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { BoardAddCard } from "@/components/molecules/BoardAddCard";

function BoardAddCardPreview() {
  return (
    <div className="rounded-[16px] bg-[var(--color-surface-50)] p-6">
      <BoardAddCard />
    </div>
  );
}

const meta = {
  component: BoardAddCard,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
  args: {
    label: "Add card",
  },
} satisfies Meta<typeof BoardAddCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const PenPreview: StoryObj<typeof BoardAddCardPreview> = {
  render: () => <BoardAddCardPreview />,
  parameters: {
    controls: {
      disable: true,
    },
  },
};
