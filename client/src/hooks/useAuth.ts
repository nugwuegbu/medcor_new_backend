import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";
import type { User } from "@shared/schema";

interface AuthResponse {
  success: boolean;
  user: User;
}

export function useAuth() {
  const [token, setToken] = useState<string | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const storedToken = localStorage.getItem("medcor_token");
    setToken(storedToken);
  }, []);

  const { data: authData, isLoading, error } = useQuery<AuthResponse>({
    queryKey: ["/api/auth/me"],
    enabled: !!token,
    retry: false,
    queryFn: async () => {
      if (!token) throw new Error("No token");
      
      return apiRequest("/api/auth/me", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
    },
  });

  const login = (newToken: string, user: User) => {
    localStorage.setItem("medcor_token", newToken);
    setToken(newToken);
    queryClient.setQueryData(["/api/auth/me"], { success: true, user });
  };

  const logout = () => {
    localStorage.removeItem("medcor_token");
    setToken(null);
    queryClient.clear();
  };

  const isAuthenticated = !!token && !!authData?.success;
  const user = authData?.user;

  return {
    user,
    isAuthenticated,
    isLoading: isLoading && !!token,
    error,
    login,
    logout,
    token,
  };
}