import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Separator } from "./separator";

const meta = {
  title: "UI/Separator",
  component: Separator,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
} satisfies Meta<typeof Separator>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Horizontal: Story = {
  render: () => (
    <div className="w-64">
      <p className="text-sm">프로필</p>
      <Separator className="my-3" />
      <p className="text-sm">카테고리</p>
    </div>
  ),
};

export const Vertical: Story = {
  render: () => (
    <div className="flex h-8 items-center gap-3 text-sm">
      <span>개발</span>
      <Separator orientation="vertical" />
      <span>회고</span>
      <Separator orientation="vertical" />
      <span>독서</span>
    </div>
  ),
};
