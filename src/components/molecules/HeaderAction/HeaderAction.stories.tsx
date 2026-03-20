import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import {
  HeaderAction,
  HeaderSearchField,
} from "@/components/molecules/HeaderAction";

function HeaderActionRowPreview() {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-[16px] bg-[var(--app-color-surface-0)] p-6">
      <HeaderSearchField label="Search" />
      <HeaderAction icon="filter" label="Filter" variant="filter" />
      <HeaderAction icon="board" label="Board" variant="board" />
      <HeaderAction icon="plus" label="New issue" variant="primary" />
    </div>
  );
}

const meta = {
  component: HeaderAction,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
  args: {
    icon: "filter",
    label: "Filter",
    variant: "filter",
  },
} satisfies Meta<typeof HeaderAction>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FilterAction: Story = {};

export const BoardAction: Story = {
  args: {
    icon: "board",
    label: "Board",
    variant: "board",
  },
};

export const PrimaryAction: Story = {
  args: {
    icon: "plus",
    label: "New issue",
    variant: "primary",
  },
};

export const SearchField: StoryObj<typeof HeaderSearchField> = {
  render: () => <HeaderSearchField label="Search" />,
};

export const PenPreview: StoryObj<typeof HeaderActionRowPreview> = {
  render: () => <HeaderActionRowPreview />,
  parameters: {
    controls: {
      disable: true,
    },
  },
};
