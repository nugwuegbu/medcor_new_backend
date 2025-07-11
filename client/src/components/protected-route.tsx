import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  onUnauthorized?: () => void;
}

export function ProtectedRoute({ children, allowedRoles, onUnauthorized }: ProtectedRouteProps) {
  const { isAuthenticated, user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated && onUnauthorized) {
      onUnauthorized();
    }
  }, [isAuthenticated, isLoading, onUnauthorized]);

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
        <p className="text-gray-600">Please log in to access this page.</p>
      </div>
    );
  }

  // Check role authorization
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
        <p className="text-gray-600">
          You don't have permission to access this page. Required roles: {allowedRoles.join(", ")}
        </p>
        <p className="text-sm text-gray-500 mt-2">Your role: {user.role}</p>
      </div>
    );
  }

  return <>{children}</>;
}