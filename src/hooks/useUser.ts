import { useQuery } from "@tanstack/react-query";
import { api } from "~/trpc/react";

export function useUser() {
  const {
    data: user,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: () => api.auth.me.query(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    user,
    isLoading,
    error,
    refetch,
  };
}
