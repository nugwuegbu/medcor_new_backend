import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// Updated to support custom options including headers
export async function apiRequest(
  url: string, 
  options: RequestInit = {}
): Promise<any> {
  const { method = "GET", headers: customHeaders = {}, ...restOptions } = options;
  
  // Check for admin token if accessing admin routes
  const isAdminRoute = url.includes('/admin/');
  const adminToken = localStorage.getItem('medcor_admin_token');
  
  const finalHeaders: HeadersInit = {
    "Content-Type": "application/json",
    ...(customHeaders as Record<string, string>),
  };
  
  // Add admin token for admin routes
  if (isAdminRoute && adminToken) {
    (finalHeaders as Record<string, string>)['Authorization'] = `Bearer ${adminToken}`;
  }
  
  const res = await fetch(url, {
    method,
    headers: finalHeaders,
    credentials: "include",
    ...restOptions,
  });

  await throwIfResNotOk(res);
  return await res.json();
}

// Legacy method support for backward compatibility
export async function apiRequestLegacy(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const url = queryKey[0] as string;
    
    // Check for admin token if accessing admin routes
    const isAdminRoute = url.includes('/admin/');
    const adminToken = localStorage.getItem('medcor_admin_token');
    
    const headers: Record<string, string> = {};
    
    // Add admin token for admin routes
    if (isAdminRoute && adminToken) {
      headers['Authorization'] = `Bearer ${adminToken}`;
    }
    
    const res = await fetch(url, {
      credentials: "include",
      headers,
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
