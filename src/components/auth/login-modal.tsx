"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useLoginModalStore } from "@/lib/login-modal-store";

export function LoginModal() {
  const isOpen = useLoginModalStore((state) => state.isOpen);
  const close = useLoginModalStore((state) => state.close);
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [pending, setPending] = React.useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        const message = Array.isArray(error.message)
          ? error.message[0]
          : (error.message ?? "로그인에 실패했습니다.");
        toast.error(message);
        return;
      }

      setEmail("");
      setPassword("");
      close();
    } catch {
      toast.error("로그인 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => (open ? undefined : close())}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>로그인</DialogTitle>
          <DialogDescription>소유자 계정으로 로그인합니다.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <Input
            type="email"
            placeholder="이메일"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
          />
          <Input
            type="password"
            placeholder="비밀번호"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
          />
          <Button type="submit" disabled={pending}>
            {pending ? "로그인 중..." : "로그인"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
