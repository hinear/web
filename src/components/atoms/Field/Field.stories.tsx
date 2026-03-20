import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Field } from "@/components/atoms/Field";

function FieldPreview() {
  return (
    <div className="w-[280px] rounded-[16px] bg-[var(--app-color-surface-0)] p-6">
      <Field placeholder="Input text" />
    </div>
  );
}

const meta = {
  component: Field,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
  args: {
    placeholder: "Input text",
  },
} satisfies Meta<typeof Field>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const PenPreview: StoryObj<typeof FieldPreview> = {
  render: () => <FieldPreview />,
  parameters: {
    controls: {
      disable: true,
    },
  },
};
