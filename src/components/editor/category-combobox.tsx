"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useCategories } from "@/hooks/use-categories";

interface CategoryComboboxProps {
  value: string;
  onChange: (value: string) => void;
}

// 기존 카테고리 선택 또는 새로 입력(자유 생성) — 백엔드가 label로 upsert하므로
// 프론트는 목록에 없는 값도 그냥 문자열로 넘기면 됨
export function CategoryCombobox({ value, onChange }: CategoryComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const { data: categories = [], isLoading } = useCategories();

  const normalizedSearch = search.trim().toLowerCase();
  const filtered = categories.filter((category) =>
    category.label.toLowerCase().includes(normalizedSearch),
  );
  const exactMatch = categories.some(
    (category) => category.label.toLowerCase() === normalizedSearch,
  );

  function handleSelect(label: string) {
    onChange(label);
    setSearch("");
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between font-normal"
          />
        }
      >
        <span className={cn(!value && "text-muted-foreground")}>
          {value || "카테고리 선택"}
        </span>
        <ChevronsUpDown className="opacity-50" />
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0">
        <Command shouldFilter={false}>
          <CommandInput
            value={search}
            onValueChange={setSearch}
            placeholder="카테고리 검색 또는 새로 입력"
          />
          <CommandList>
            {filtered.length === 0 && !normalizedSearch && (
              <CommandEmpty>
                {isLoading ? "불러오는 중..." : "카테고리가 없습니다."}
              </CommandEmpty>
            )}
            <CommandGroup>
              {filtered.map((category) => (
                <CommandItem
                  key={category.slug}
                  value={category.label}
                  onSelect={() => handleSelect(category.label)}
                >
                  <Check
                    className={cn(
                      value === category.label ? "opacity-100" : "opacity-0",
                    )}
                  />
                  {category.label}
                </CommandItem>
              ))}
              {normalizedSearch && !exactMatch && (
                <CommandItem
                  value={`__create__${search}`}
                  onSelect={() => handleSelect(search.trim())}
                >
                  <Plus />
                  &quot;{search.trim()}&quot; 새 카테고리로 추가
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
