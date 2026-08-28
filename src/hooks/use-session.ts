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

  return { ...query, isOwner: query.data?.role === "OWNER" };
}
