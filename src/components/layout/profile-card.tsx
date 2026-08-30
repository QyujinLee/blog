import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function ProfileCard() {
  return (
    <div className="flex flex-col items-center gap-3 p-4 text-center">
      <Link
        href="/about"
        className="opacity-90 transition-opacity hover:opacity-100"
      >
        <Avatar className="size-40">
          <AvatarImage src="/profile.jpeg" alt="이규진" />
          <AvatarFallback className="text-4xl">G</AvatarFallback>
        </Avatar>
      </Link>
      <div>
        <p className="font-heading font-semibold">gyujin</p>
        <p className="text-sm text-muted-foreground">
          실무에서 마주친 문제와
          <br />
          해결 과정을 정리합니다
        </p>
      </div>
    </div>
  );
}
