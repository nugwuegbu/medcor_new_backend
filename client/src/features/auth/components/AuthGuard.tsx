import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/types/user';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ROUTES } from '@/constants';

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  redirectTo?: string;
  onUnauthorized?: () => void;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  allowedRoles,
  redirectTo = ROUTES.LOGIN,
  onUnauthorized,
}) => {
  const { isAuthenticated, user, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        if (onUnauthorized) {
          onUnauthorized();
        } else {
          setLocation(redirectTo);
        }
      } else if (allowedRoles && user && !allowedRoles.includes(user.role)) {
        // User is authenticated but doesn't have the required role
        if (onUnauthorized) {
          onUnauthorized();
        } else {
          setLocation('/');
        }
      }
    }
  }, [isAuthenticated, user, loading, allowedRoles, redirectTo, onUnauthorized, setLocation]);

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading..." />;
  }

  if (!isAuthenticated) {
    return null;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};