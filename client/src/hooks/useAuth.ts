import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";

export interface AuthenticatedUser {
  id: string;
  email?: string;
  role?: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  phone?: string;
  isOnboarded?: boolean;
  subscriptionPlan?: string;
  subscriptionStatus?: string;
  username?: string;
}

export function useAuth() {
  const { data: user, isLoading } = useQuery<AuthenticatedUser | null>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
  };
}
