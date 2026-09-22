import { useSyncExternalStore } from "react";
import { useQuery } from "@tanstack/react-query";

interface Session {
  isAuthenticated: boolean;
  role?: string;
  name?: string;
}

export function useSession() {
  const query = useQuery<Session>({
    queryKey: ["session"],
    queryFn: async () => {
      const response = await fetch("/api/auth/session");
      return response.json();
    },
  });

  // 서버는 세션을 모르고 렌더한다. 헤더가 먼저 hydration되며 세션을 받아 두면, 뒤늦게
  // hydration되는 컴포넌트(OwnerOnly, OwnerActions)는 캐시된 세션으로 서버와 다른 화면을
  // 그려 hydration이 깨졌다. hydration 렌더 동안엔 서버와 같은 "모름" 상태로 맞춘다
  // (theme-toggle.tsx와 같은 useSyncExternalStore 패턴 — 클라이언트 이동 시엔 바로 true)
  const hydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  return {
    ...query,
    isLoading: !hydrated || query.isLoading,
    isOwner: hydrated && query.data?.role === "OWNER",
  };
}
