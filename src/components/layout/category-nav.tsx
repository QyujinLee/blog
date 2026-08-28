"use client";

import Link from "next/link";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useCategoryGroups } from "@/hooks/use-category-groups";

export function CategoryNav() {
  const categories = useCategoryGroups();

  return (
    <nav className="flex flex-col gap-1">
      <Link
        href="/posts"
        className="rounded-lg px-2.5 py-2 text-sm font-medium hover:bg-muted hover:text-foreground"
      >
        전체 글
      </Link>
      <Link
        href="/about"
        className="rounded-lg px-2.5 py-2 text-sm font-medium hover:bg-muted hover:text-foreground"
      >
        소개
      </Link>
      <Accordion>
        {categories.map((category) => (
          <AccordionItem key={category.slug} value={category.slug}>
            <AccordionTrigger>{category.label}</AccordionTrigger>
            <AccordionContent>
              <ul className="flex flex-col gap-1.5 text-muted-foreground">
                {category.tags.map((tag) => (
                  <li key={tag.name}>
                    <Link
                      href={`/search?tags=${encodeURIComponent(tag.name)}`}
                      className="flex items-center justify-between hover:underline"
                    >
                      <span>#{tag.name}</span>
                      <span className="font-mono text-xs">({tag.count})</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </nav>
  );
}
