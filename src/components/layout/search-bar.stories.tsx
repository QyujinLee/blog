import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { SearchBar } from "./search-bar";

const meta = {
  title: "Layout/SearchBar",
  component: SearchBar,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
  args: { onSearch: fn() },
} satisfies Meta<typeof SearchBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  render: (args) => <SearchBar {...args} className="w-80" />,
};

export const WithValue: Story = {
  render: (args) => <SearchBar {...args} defaultValue="Redis 캐시" className="w-80" />,
};
