import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";

interface DjangoUser {
  id: number;
  email: string;
  username: string;
  role: string;
  first_name?: string;
  last_name?: string;
  is_active: boolean;
  is_staff: boolean;
  is_superuser: boolean;
}

interface AuthResponse {
  user: DjangoUser;
}

export function useAuth() {
  const [token, setToken] = useState<string | null>(() => {
    // Initialize token from localStorage immediately
    return localStorage.getItem("medcor_token");
  });
  const queryClient = useQueryClient();

  useEffect(() => {
    const storedToken = localStorage.getItem("medcor_token");
    if (storedToken !== token) {
      setToken(storedToken);
    }
  }, [token]);

  const { data: authData, isLoading, error } = useQuery<AuthResponse>({
    queryKey: ["/api/auth/me"],
    enabled: !!token,
    retry: false,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    queryFn: async () => {
      if (!token) throw new Error("No token");
      
      // Use Django's profile endpoint
      return apiRequest("/api/auth/profile/", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
    },
  });

  const login = (newToken: string, user: DjangoUser) => {
    localStorage.setItem("medcor_token", newToken);
    setToken(newToken);
    queryClient.setQueryData(["/api/auth/me"], { user });
  };

  const logout = () => {
    localStorage.removeItem("medcor_token");
    localStorage.removeItem("medcor_refresh_token");
    setToken(null);
    queryClient.clear();
  };

  const isAuthenticated = !!token && !!authData?.user;
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