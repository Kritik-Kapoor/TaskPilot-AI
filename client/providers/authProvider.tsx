"use client";

import { useCallback, useMemo } from "react";
import { AuthContext } from "@/lib/context/authContext";
import { useQueryClient } from "@tanstack/react-query";
import { logoutUser } from "@/features/(auth)/api";
import { useCurrentUser } from "@/features/(auth)/hooks/useCurrentUser";

type Props = {
  children: React.ReactNode;
};

export function AuthProvider({ children }: Props) {
  const queryClient = useQueryClient();

  const { data: user, isPending } = useCurrentUser();

  const logout = useCallback(async () => {
    try {
      await logoutUser();
    } finally {
      queryClient.removeQueries({
        queryKey: ["me"],
      });
    }
  }, [queryClient]);

  const value = useMemo(
    () => ({
      user: user ?? null,
      isAuthenticated: !!user,
      isLoading: isPending,
      logout,
    }),
    [user, isPending, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
