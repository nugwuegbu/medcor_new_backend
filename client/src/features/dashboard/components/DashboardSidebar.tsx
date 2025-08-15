import { NavLink } from 'wouter';
import { 
  Home, 
  Calendar, 
  Users, 
  FileText, 
  Settings, 
  Heart,
  Activity,
  CreditCard,
  BarChart,
  MessageSquare
} from 'lucide-react';
import { UserRole } from '@/types/user';
import { useTenant } from '@/contexts/TenantContext';
import { cn } from '@/lib/utils';

interface SidebarItem {
  label: string;
  icon: React.ElementType;
  href: string;
  roles?: UserRole[];
  feature?: keyof typeof defaultFeatures;
}

const defaultFeatures = {
  appointments: true,
  chat: true,
  medicalRecords: true,
  payments: true,
  analytics: true,
};

const sidebarItems: SidebarItem[] = [
  {
    label: 'Dashboard',
    icon: Home,
    href: '/dashboard',
  },
  {
    label: 'Appointments',
    icon: Calendar,
    href: '/appointments',
    feature: 'appointments',
  },
  {
    label: 'Patients',
    icon: Users,
    href: '/patients',
    roles: ['doctor', 'admin', 'superadmin'],
  },
  {
    label: 'Medical Records',
    icon: FileText,
    href: '/medical-records',
    feature: 'medicalRecords',
  },
  {
    label: 'Chat',
    icon: MessageSquare,
    href: '/chat',
    feature: 'chat',
  },
  {
    label: 'Health Analysis',
    icon: Heart,
    href: '/health-analysis',
    roles: ['patient', 'doctor'],
  },
  {
    label: 'Analytics',
    icon: BarChart,
    href: '/analytics',
    roles: ['admin', 'superadmin'],
    feature: 'analytics',
  },
  {
    label: 'Payments',
    icon: CreditCard,
    href: '/payments',
    roles: ['admin', 'superadmin', 'patient'],
    feature: 'payments',
  },
  {
    label: 'Settings',
    icon: Settings,
    href: '/settings',
  },
];

interface DashboardSidebarProps {
  userRole?: UserRole;
  currentPath: string;
  className?: string;
}

export const DashboardSidebar: React.FC<DashboardSidebarProps> = ({
  userRole,
  currentPath,
  className,
}) => {
  const { tenantConfig } = useTenant();

  const filteredItems = sidebarItems.filter(item => {
    // Check role permissions
    if (item.roles && userRole && !item.roles.includes(userRole)) {
      return false;
    }

    // Check feature flags
    if (item.feature && !tenantConfig.features[item.feature]) {
      return false;
    }

    return true;
  });

  return (
    <nav className={cn("flex flex-col gap-2 p-4", className)}>
      {filteredItems.map((item) => {
        const Icon = item.icon;
        const isActive = currentPath === item.href;

        return (
          <NavLink key={item.href} href={item.href}>
            <a
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </a>
          </NavLink>
        );
      })}
    </nav>
  );
};