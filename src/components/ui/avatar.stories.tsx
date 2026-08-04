import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";

const meta = {
  title: "UI/Avatar",
  component: Avatar,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Fallback: Story = {
  render: () => (
    <Avatar>
      <AvatarFallback>G</AvatarFallback>
    </Avatar>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Avatar size="sm">
        <AvatarFallback>G</AvatarFallback>
      </Avatar>
      <Avatar size="default">
        <AvatarFallback>G</AvatarFallback>
      </Avatar>
      <Avatar size="lg">
        <AvatarFallback>G</AvatarFallback>
      </Avatar>
    </div>
  ),
};

export const WithImage: Story = {
  render: () => (
    <Avatar>
      <AvatarImage src="https://github.com/shadcn.png" alt="프로필 사진" />
      <AvatarFallback>G</AvatarFallback>
    </Avatar>
  ),
};
