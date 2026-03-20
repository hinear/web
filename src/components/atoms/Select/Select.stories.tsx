import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Select } from "@/components/atoms/Select";

function SelectPreview() {
  return (
    <div className="w-[280px] rounded-[16px] bg-[var(--app-color-surface-0)] p-6">
      <Select defaultValue="value">
        <option value="value">Select value</option>
        <option value="option-2">Option 2</option>
        <option value="option-3">Option 3</option>
      </Select>
    </div>
  );
}

const meta = {
  component: Select,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Select defaultValue="value">
      <option value="value">Select value</option>
      <option value="option-2">Option 2</option>
      <option value="option-3">Option 3</option>
    </Select>
  ),
};

export const PenPreview: StoryObj<typeof SelectPreview> = {
  render: () => <SelectPreview />,
  parameters: {
    controls: {
      disable: true,
    },
  },
};

export const OpenList: Story = {
  render: () => (
    <div className="w-[280px] rounded-[16px] bg-[var(--app-color-surface-0)] p-6">
      <Select defaultOpen defaultValue="option-2">
        <option value="value">Select value</option>
        <option value="option-2">Option 2</option>
        <option value="option-3">Option 3</option>
        <option value="option-4">Option 4</option>
      </Select>
    </div>
  ),
};
