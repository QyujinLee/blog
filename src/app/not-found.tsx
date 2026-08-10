import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <h1 className="font-heading text-2xl font-bold">글을 찾을 수 없습니다</h1>
      <p className="text-muted-foreground">요청하신 페이지가 존재하지 않거나 삭제되었습니다.</p>
      <Button render={<Link href="/" />} nativeButton={false}>
        홈으로
      </Button>
    </div>
  );
}
