"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useScrollCollapse } from "@/hooks/use-scroll-collapse";
import { useSession } from "@/hooks/use-session";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/theme-toggle";
import { MobileNav } from "./mobile-nav";
import { SearchBar } from "./search-bar";
import { useLoginModalStore } from "@/lib/login-modal-store";

export function Header() {
  const collapsed = useScrollCollapse(40);
  const [searchOpen, setSearchOpen] = useState(false);
  const router = useRouter();
  const openLoginModal = useLoginModalStore((state) => state.open);
  const { isOwner, data: session } = useSession();
  const queryClient = useQueryClient();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    queryClient.invalidateQueries({ queryKey: ["session"] });
  }

  function handleSearch(query: string) {
    setSearchOpen(false);
    if (query) router.push(`/search?q=${encodeURIComponent(query)}`);
  }

  return (
    <header
      className={cn(
        // 높이는 헤더가 직접 고정 — 안에 든 게 타이틀이든 검색바든 높이가 안 튀도록
        // (h-20 = 사이드바 sticky top-20과 같은 값)
        "sticky top-0 z-40 flex items-center gap-2 px-4 transition-all duration-200 motion-reduce:transition-none",
        collapsed ? "h-12" : "h-20",
      )}
      style={{
        background: "linear-gradient(115deg, var(--rose-quartz), var(--serenity))",
      }}
    >
      {/* 검색창이 펼쳐지면 좁은 화면에선 입력 공간이 안 나와 타이틀/햄버거를 비움 (모바일 검색 표준 패턴) */}
      <div
        className={cn(
          "flex flex-1 items-center",
          searchOpen && "max-sm:hidden",
        )}
      >
        <MobileNav />
      </div>

      <Link
        href="/"
        className={cn(
          "shrink-0 font-heading font-bold tracking-tight transition-all duration-200 motion-reduce:transition-none",
          collapsed ? "text-lg" : "text-2xl",
          searchOpen && "max-sm:hidden",
        )}
        style={{ color: "var(--serenity-900)" }}
      >
        gyujin&apos;s log
      </Link>

      <div className="flex flex-1 items-center justify-end gap-1">
        {searchOpen ? (
          <>
            <SearchBar
              onSearch={handleSearch}
              className="min-w-0 flex-1 bg-background/90 sm:max-w-56"
            />
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="검색 취소"
              onClick={() => setSearchOpen(false)}
            >
              <X />
            </Button>
          </>
        ) : (
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="검색"
            onClick={() => setSearchOpen(true)}
          >
            <Search />
          </Button>
        )}
        <ThemeToggle />
        {isOwner ? (
          <>
            <Avatar size="sm">
              <AvatarFallback>{session?.name?.[0] ?? "G"}</AvatarFallback>
            </Avatar>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              로그아웃
            </Button>
          </>
        ) : (
          <Button variant="outline" size="sm" onClick={openLoginModal}>
            로그인
          </Button>
        )}
      </div>
    </header>
  );
}
