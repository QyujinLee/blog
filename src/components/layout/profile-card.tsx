import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function ProfileCard() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-border bg-card p-4 text-center">
      <Avatar size="lg">
        <AvatarFallback>G</AvatarFallback>
      </Avatar>
      <div>
        <p className="font-heading font-semibold">gyujin</p>
        <p className="text-sm text-muted-foreground">
          실무에서 마주친 문제와 해결 과정을 정리합니다
        </p>
      </div>
    </div>
  );
}
