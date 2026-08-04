import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./accordion";

const meta = {
  title: "UI/Accordion",
  component: Accordion,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
} satisfies Meta<typeof Accordion>;

export default meta;
type Story = StoryObj<typeof meta>;

function TagLink({ tag, count }: { tag: string; count: number }) {
  return (
    <a
      href={`/search?tags=${encodeURIComponent(tag)}`}
      className="flex items-center justify-between cursor-pointer hover:underline"
    >
      <span>#{tag}</span>
      <span className="font-mono text-xs">({count})</span>
    </a>
  );
}

export const CategoryList: Story = {
  name: "적용 예시 — 사이드바 카테고리",
  render: () => (
    <Accordion defaultValue={["dev"]} className="w-64">
      <AccordionItem value="dev">
        <AccordionTrigger>개발</AccordionTrigger>
        <AccordionContent>
          <ul className="flex flex-col gap-1.5 text-muted-foreground">
            <li>
              <TagLink tag="redis" count={2} />
            </li>
            <li>
              <TagLink tag="이직" count={1} />
            </li>
          </ul>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="essay">
        <AccordionTrigger>회고</AccordionTrigger>
        <AccordionContent>
          <ul className="flex flex-col gap-1.5 text-muted-foreground">
            <li>
              <TagLink tag="2026상반기" count={1} />
            </li>
          </ul>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="books">
        <AccordionTrigger>독서</AccordionTrigger>
        <AccordionContent>
          <p className="text-muted-foreground">아직 글이 없어요.</p>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};
