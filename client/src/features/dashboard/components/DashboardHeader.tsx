import { Bell, Search, User, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { User as UserType } from '@/types/user';
import { useTenant } from '@/contexts/TenantContext';
import { getInitials } from '@/utils/formatters';

interface DashboardHeaderProps {
  user: UserType | null;
  onMenuClick?: () => void;
  onLogout?: () => void;
  showSearch?: boolean;
  showNotifications?: boolean;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  user,
  onMenuClick,
  onLogout,
  showSearch = true,
  showNotifications = true,
}) => {
  const { tenantConfig } = useTenant();

  return (
    <div className="flex h-16 items-center px-4 gap-4">
      {/* Mobile Menu Button */}
      {onMenuClick && (
        <Button variant="ghost" size="icon" className="md:hidden" onClick={onMenuClick}>
          <Menu className="h-5 w-5" />
        </Button>
      )}

      {/* Logo/Brand */}
      <div className="flex items-center gap-2">
        {tenantConfig.logo && (
          <img src={tenantConfig.logo} alt={tenantConfig.name} className="h-8 w-auto" />
        )}
        <span className="font-semibold text-lg hidden sm:inline">
          {tenantConfig.branding.companyName}
        </span>
      </div>

      {/* Search Bar */}
      {showSearch && (
        <div className="flex-1 max-w-md mx-auto hidden md:block">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              className="pl-8"
            />
          </div>
        </div>
      )}

      <div className="ml-auto flex items-center gap-2">
        {/* Notifications */}
        {showNotifications && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-[10px] text-white flex items-center justify-center">
                  3
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium">New appointment request</p>
                  <p className="text-xs text-muted-foreground">John Doe requested an appointment</p>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium">Lab results available</p>
                  <p className="text-xs text-muted-foreground">Your recent lab results are ready</p>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              {user?.profileImage ? (
                <img
                  src={user.profileImage}
                  alt={user.name}
                  className="h-10 w-10 rounded-full object-cover"
                />
              ) : (
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-medium">
                    {user ? getInitials(user.name) : <User className="h-5 w-5" />}
                  </span>
                </div>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.name}</p>
                <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuItem>Help & Support</DropdownMenuItem>
            <DropdownMenuSeparator />
            {onLogout && (
              <DropdownMenuItem onClick={onLogout} className="text-red-600">
                Log out
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};