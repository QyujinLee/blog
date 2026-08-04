import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { LoadingOverlay } from "./loading-overlay";

const meta = {
  title: "Layout/LoadingOverlay",
  component: LoadingOverlay,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof LoadingOverlay>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="h-screen bg-background p-8">
      <p className="text-muted-foreground">로딩 트리거 이전의 배경 화면</p>
      <LoadingOverlay />
    </div>
  ),
};
