import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Avatar } from "@/components/atoms/Avatar";

const profileImageDataUrl =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
      <rect width="120" height="120" rx="60" fill="#E5ECFF" />
      <circle cx="60" cy="44" r="22" fill="#8BA2FF" />
      <path d="M24 104c8-20 25-32 36-32s28 12 36 32" fill="#5E6AD2" />
    </svg>
  `);

function AvatarRowPreview() {
  return (
    <div className="flex items-center gap-4 rounded-[16px] bg-[var(--app-color-surface-0)] p-6">
      <Avatar fallback="HS" name="Hana Studio" />
      <Avatar name="Kim Min" />
      <Avatar alt="Hana profile" name="Hana" src={profileImageDataUrl} />
    </div>
  );
}

const meta = {
  component: Avatar,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
  args: {
    fallback: "HS",
    name: "Hana Studio",
  },
  argTypes: {
    size: {
      control: { type: "number", min: 16, max: 64, step: 2 },
    },
  },
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Initials: Story = {};

export const NameFallback: Story = {
  args: {
    fallback: undefined,
    name: "Kim Min",
  },
};

export const WithImage: Story = {
  args: {
    alt: "Hana profile",
    name: "Hana",
    src: profileImageDataUrl,
  },
};

export const PenRow: StoryObj<typeof AvatarRowPreview> = {
  render: () => <AvatarRowPreview />,
  parameters: {
    controls: {
      disable: true,
    },
  },
};
