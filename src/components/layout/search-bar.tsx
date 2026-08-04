"use client";

import * as React from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  defaultValue?: string;
  onSearch: (query: string) => void;
  placeholder?: string;
  className?: string;
}

function SearchBar({
  defaultValue = "",
  onSearch,
  placeholder = "검색어를 입력하세요",
  className,
}: SearchBarProps) {
  const [value, setValue] = React.useState(defaultValue);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    onSearch(value.trim());
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "flex items-center gap-1 rounded-full border border-input bg-background py-1 pr-1.5 pl-4",
        className
      )}
    >
      <Input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder}
        aria-label="검색어"
        className="h-8 flex-1 rounded-full border-none bg-transparent px-0 shadow-none focus-visible:ring-0"
      />
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="rounded-full text-muted-foreground"
        disabled={!value}
        onClick={() => setValue("")}
        aria-label="검색어 지우기"
      >
        <X />
      </Button>
      <Button type="submit" size="icon-sm" className="rounded-full" aria-label="검색">
        <Search />
      </Button>
    </form>
  );
}

export { SearchBar };
