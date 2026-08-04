import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Badge } from "./badge";

const meta = {
  title: "UI/Badge",
  component: Badge,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { children: "Redis", variant: "default" },
};

export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <Badge variant="default">개발</Badge>
      <Badge variant="secondary">회고</Badge>
      <Badge variant="outline">#Redis</Badge>
      <Badge variant="destructive">삭제됨</Badge>
      <Badge variant="ghost">#캐시</Badge>
    </div>
  ),
};

export const TagList: Story = {
  name: "적용 예시 — 태그 목록",
  render: () => (
    <div className="flex flex-wrap gap-1.5">
      <Badge variant="outline">#Redis</Badge>
      <Badge variant="outline">#캐시</Badge>
      <Badge variant="outline">#백엔드</Badge>
    </div>
  ),
};
