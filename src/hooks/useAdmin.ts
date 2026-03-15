import { useQuery } from "@tanstack/react-query";
import { api } from "~/trpc/react";

export function useAdmin() {
  const {
    data: admin,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["adminAuth", "me"],
    queryFn: () => api.adminAuth.me.query(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    admin,
    isLoading,
    error,
    refetch,
  };
}
