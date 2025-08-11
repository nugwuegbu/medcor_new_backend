import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { API_CONFIG } from "@/config/api";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// Updated to support custom options including headers and Django backend
export async function apiRequest(
  url: string, 
  options: RequestInit = {}
): Promise<any> {
  // Construct full URL if it's a relative path
  const fullUrl = url.startsWith('http') ? url : `${API_CONFIG.BASE_URL}${url}`;
  
  // Check for tokens - use adminToken as primary key for admin routes
  const adminToken = localStorage.getItem('adminToken') || localStorage.getItem('medcor_admin_token');
  const authToken = localStorage.getItem('medcor_token');
  
  // Check if body is FormData - if so, don't set Content-Type (let browser set it)
  const isFormData = options.body instanceof FormData;
  
  // Build headers
  let headers: any = {
    ...options.headers
  };
  
  // Only set Content-Type for non-FormData requests
  if (!isFormData && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }
  
  // Remove Content-Type for FormData to let browser set boundary
  if (isFormData && headers['Content-Type']) {
    delete headers['Content-Type'];
  }
  
  // Add appropriate token (but not for login/logout endpoints)
  const isLoginEndpoint = url.includes('/auth/login') || url.includes('/auth/signup') || url.includes('/auth/admin/login');
  const isLogoutEndpoint = url.includes('/auth/logout');
  
  if (!isLoginEndpoint && !isLogoutEndpoint) {
    // Use admin token for admin routes, medical records, or auth/users endpoint
    if (adminToken && (url.includes('/admin/') || url.includes('/auth/users/') || url.includes('/appointments/') || url.includes('/medical-records/'))) {
      headers['Authorization'] = `Bearer ${adminToken}`;
    } else if (authToken) {
      // Add auth token for all other authenticated routes
      headers['Authorization'] = `Bearer ${authToken}`;
    }
  }
  
  // Build final request options
  const requestOptions: RequestInit = {
    ...options,
    headers,
    credentials: "include",
  };
  
  const res = await fetch(fullUrl, requestOptions);

  await throwIfResNotOk(res);
  
  // Check if response is JSON before parsing
  const contentType = res.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return await res.json();
  } else {
    // If not JSON, likely an error page
    const text = await res.text();
    console.error("Non-JSON response received:", text.substring(0, 200));
    throw new Error("Server error: Invalid response format");
  }
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
    
    // Construct full URL if it's a relative path
    const fullUrl = url.startsWith('http') ? url : `${API_CONFIG.BASE_URL}${url}`;
    
    // Check for tokens - use consistent token key lookup
    const adminToken = localStorage.getItem('adminToken') || localStorage.getItem('medcor_admin_token');
    const authToken = localStorage.getItem('medcor_token');
    
    const headers: Record<string, string> = {};
    
    // Add appropriate token (skip for login/logout endpoints and profile during logout)
    const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/signup') || url.includes('/auth/logout');
    
    if (!isAuthEndpoint) {
      // Use admin token for admin routes or protected endpoints
      if (adminToken && (url.includes('/admin/') || url.includes('/auth/users/') || url.includes('/appointments/') || url.includes('/medical-records/'))) {
        headers['Authorization'] = `Bearer ${adminToken}`;
      } else if (authToken) {
        // Add auth token for all other authenticated routes
        headers['Authorization'] = `Bearer ${authToken}`;
      }
    }
    
    const res = await fetch(fullUrl, {
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
