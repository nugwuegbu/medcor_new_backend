import { ReactNode } from 'react';
import { useTenant } from '@/contexts/TenantContext';

interface DashboardLayoutProps {
  children: ReactNode;
  sidebar?: ReactNode;
  header?: ReactNode;
  className?: string;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  sidebar,
  header,
  className = '',
}) => {
  const { tenantConfig } = useTenant();

  return (
    <div className={`min-h-screen bg-background ${className}`}>
      {/* Header */}
      {header && (
        <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          {header}
        </header>
      )}

      <div className="flex h-[calc(100vh-64px)]">
        {/* Sidebar */}
        {sidebar && (
          <aside className="w-64 border-r bg-muted/40">
            {sidebar}
          </aside>
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};