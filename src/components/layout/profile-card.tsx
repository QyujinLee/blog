import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function ProfileCard() {
  return (
    <Link
      href="/about"
      className="flex flex-col items-center gap-3 rounded-lg border border-border bg-card p-4 text-center transition-colors hover:bg-muted"
    >
      <Avatar className="size-40">
        <AvatarImage src="/profile.jpeg" alt="이규진" />
        <AvatarFallback className="text-4xl">G</AvatarFallback>
      </Avatar>
      <div>
        <p className="font-heading font-semibold">gyujin</p>
        <p className="text-sm text-muted-foreground">
          실무에서 마주친 문제와 해결 과정을 정리합니다
        </p>
      </div>
    </Link>
  );
}
