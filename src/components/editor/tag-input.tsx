"use client";

import * as React from "react";
import { Plus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useTags } from "@/hooks/use-tags";

interface TagInputProps {
  value: string[];
  onChange: (value: string[]) => void;
}

// 태그 다중 입력 — 기존 태그 자동완성 + 새 태그 자유 입력, 이미 선택된 태그는 목록에서 제외
export function TagInput({ value, onChange }: TagInputProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const { data: tags = [] } = useTags();

  const normalizedSearch = search.trim().toLowerCase();
  const filtered = tags.filter(
    (tag) =>
      tag.toLowerCase().includes(normalizedSearch) && !value.includes(tag),
  );
  const alreadyExists =
    tags.some((tag) => tag.toLowerCase() === normalizedSearch) ||
    value.some((tag) => tag.toLowerCase() === normalizedSearch);

  function addTag(tag: string) {
    if (!value.includes(tag)) onChange([...value, tag]);
    setSearch("");
  }

  function removeTag(tag: string) {
    onChange(value.filter((t) => t !== tag));
  }

  return (
    <div className="flex flex-col gap-2">
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {value.map((tag) => (
            <Badge key={tag} variant="secondary" className="gap-1">
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                aria-label={`${tag} 태그 삭제`}
              >
                <X className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-fit font-normal"
            />
          }
        >
          <Plus className="size-3.5" />
          태그 추가
        </PopoverTrigger>
        <PopoverContent className="w-64 p-0">
          <Command shouldFilter={false}>
            <CommandInput
              value={search}
              onValueChange={setSearch}
              placeholder="태그 검색 또는 새로 입력"
            />
            <CommandList>
              <CommandGroup>
                {filtered.map((tag) => (
                  <CommandItem
                    key={tag}
                    value={tag}
                    onSelect={() => addTag(tag)}
                  >
                    {tag}
                  </CommandItem>
                ))}
                {normalizedSearch && !alreadyExists && (
                  <CommandItem
                    value={`__create__${search}`}
                    onSelect={() => addTag(search.trim())}
                  >
                    <Plus />
                    &quot;{search.trim()}&quot; 새 태그로 추가
                  </CommandItem>
                )}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
