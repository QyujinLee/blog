import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ThemeToggle } from "./theme-toggle";

const meta = {
  title: "Layout/ThemeToggle",
  component: ThemeToggle,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
} satisfies Meta<typeof ThemeToggle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
