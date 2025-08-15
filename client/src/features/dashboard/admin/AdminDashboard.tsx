import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import {
  Users,
  UserCheck,
  Calendar,
  FileText,
  DollarSign,
  Activity,
  BarChart3,
  Settings,
  Menu,
  X,
  LogOut,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  AdminOverview,
  PatientsManagement,
  DoctorsManagement,
  AppointmentsManagement,
} from './components';
import { useAdminData } from './hooks/useAdminData';
import { AdminView, AdminSidebarItem } from './types';
import { cn } from '@/lib/utils';

const sidebarItems: AdminSidebarItem[] = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'patients', label: 'Patients', icon: Users },
  { id: 'doctors', label: 'Doctors', icon: UserCheck },
  { id: 'appointments', label: 'Appointments', icon: Calendar },
  { id: 'medical-records', label: 'Medical Records', icon: FileText },
  { id: 'subscriptions', label: 'Subscriptions', icon: DollarSign },
  { id: 'analysis-tracking', label: 'Analysis Tracking', icon: Activity },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export const AdminDashboard: React.FC = () => {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedView, setSelectedView] = useState<AdminView>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Fetch all admin data
  const {
    users,
    doctors,
    patients,
    appointments,
    stats,
    analysisStats,
    activityFeed,
    isLoading,
    refetch,
  } = useAdminData();

  // Check admin authentication
  useEffect(() => {
    const adminToken = localStorage.getItem('adminToken');
    const adminUser = localStorage.getItem('adminUser');
    
    if (!adminToken || !adminUser) {
      setLocation('/admin/login');
      return;
    }

    try {
      const user = JSON.parse(adminUser);
      if (user.role !== 'admin') {
        toast({
          title: 'Unauthorized Access',
          description: 'Admin access required',
          variant: 'destructive',
        });
        setLocation('/admin/login');
      }
    } catch (error) {
      setLocation('/admin/login');
    }
  }, [setLocation, toast]);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    setLocation('/admin/login');
  };

  // Handlers for CRUD operations
  const handleAddPatient = () => {
    // TODO: Implement add patient modal
    toast({
      title: 'Coming Soon',
      description: 'Add patient feature will be available soon',
    });
  };

  const handleEditPatient = (patient: any) => {
    // TODO: Implement edit patient modal
    toast({
      title: 'Edit Patient',
      description: `Editing ${patient.first_name} ${patient.last_name}`,
    });
  };

  const handleDeletePatient = (patient: any) => {
    // TODO: Implement delete patient
    toast({
      title: 'Delete Patient',
      description: `Deleting ${patient.first_name} ${patient.last_name}`,
      variant: 'destructive',
    });
  };

  const handleViewPatient = (patient: any) => {
    // TODO: Implement view patient modal
    toast({
      title: 'View Patient',
      description: `Viewing ${patient.first_name} ${patient.last_name}`,
    });
  };

  // Similar handlers for doctors and appointments
  const handleAddDoctor = () => {
    toast({
      title: 'Coming Soon',
      description: 'Add doctor feature will be available soon',
    });
  };

  const handleEditDoctor = (doctor: any) => {
    toast({
      title: 'Edit Doctor',
      description: `Editing Dr. ${doctor.first_name} ${doctor.last_name}`,
    });
  };

  const handleDeleteDoctor = (doctor: any) => {
    toast({
      title: 'Delete Doctor',
      description: `Deleting Dr. ${doctor.first_name} ${doctor.last_name}`,
      variant: 'destructive',
    });
  };

  const handleViewDoctor = (doctor: any) => {
    toast({
      title: 'View Doctor',
      description: `Viewing Dr. ${doctor.first_name} ${doctor.last_name}`,
    });
  };

  const handleAddAppointment = () => {
    toast({
      title: 'Coming Soon',
      description: 'Add appointment feature will be available soon',
    });
  };

  const handleEditAppointment = (appointment: any) => {
    toast({
      title: 'Edit Appointment',
      description: `Editing appointment #${appointment.id}`,
    });
  };

  const handleDeleteAppointment = (appointment: any) => {
    toast({
      title: 'Delete Appointment',
      description: `Deleting appointment #${appointment.id}`,
      variant: 'destructive',
    });
  };

  const handleViewAppointment = (appointment: any) => {
    toast({
      title: 'View Appointment',
      description: `Viewing appointment #${appointment.id}`,
    });
  };

  const renderContent = () => {
    switch (selectedView) {
      case 'overview':
        return (
          <AdminOverview
            stats={stats}
            analysisStats={analysisStats}
            activityFeed={activityFeed}
            isLoading={isLoading}
          />
        );
      case 'patients':
        return (
          <PatientsManagement
            patients={patients}
            isLoading={isLoading}
            onAdd={handleAddPatient}
            onEdit={handleEditPatient}
            onDelete={handleDeletePatient}
            onView={handleViewPatient}
          />
        );
      case 'doctors':
        return (
          <DoctorsManagement
            doctors={doctors}
            isLoading={isLoading}
            onAdd={handleAddDoctor}
            onEdit={handleEditDoctor}
            onDelete={handleDeleteDoctor}
            onView={handleViewDoctor}
          />
        );
      case 'appointments':
        return (
          <AppointmentsManagement
            appointments={appointments}
            isLoading={isLoading}
            onAdd={handleAddAppointment}
            onEdit={handleEditAppointment}
            onDelete={handleDeleteAppointment}
            onView={handleViewAppointment}
          />
        );
      case 'medical-records':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">Medical Records</h2>
            <p className="text-muted-foreground">Medical records management coming soon...</p>
          </div>
        );
      case 'subscriptions':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">Subscriptions</h2>
            <p className="text-muted-foreground">Subscription management coming soon...</p>
          </div>
        );
      case 'analysis-tracking':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">Analysis Tracking</h2>
            <p className="text-muted-foreground">Analysis tracking coming soon...</p>
          </div>
        );
      case 'analytics':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">Analytics</h2>
            <p className="text-muted-foreground">Analytics dashboard coming soon...</p>
          </div>
        );
      case 'settings':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">Settings</h2>
            <p className="text-muted-foreground">Settings page coming soon...</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden lg:flex flex-col bg-white border-r transition-all duration-300",
          sidebarOpen ? "w-64" : "w-16"
        )}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h1 className={cn(
            "font-bold text-xl transition-opacity",
            sidebarOpen ? "opacity-100" : "opacity-0"
          )}>
            Admin Panel
          </h1>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Menu className="h-4 w-4" />
          </Button>
        </div>
        
        <ScrollArea className="flex-1">
          <nav className="p-2">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.id}
                  variant={selectedView === item.id ? 'secondary' : 'ghost'}
                  className={cn(
                    "w-full justify-start mb-1",
                    !sidebarOpen && "justify-center"
                  )}
                  onClick={() => setSelectedView(item.id)}
                >
                  <Icon className="h-4 w-4" />
                  {sidebarOpen && <span className="ml-2">{item.label}</span>}
                </Button>
              );
            })}
          </nav>
        </ScrollArea>
        
        <Separator />
        
        <div className="p-4">
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start",
              !sidebarOpen && "justify-center"
            )}
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            {sidebarOpen && <span className="ml-2">Logout</span>}
          </Button>
        </div>
      </aside>

      {/* Mobile Menu */}
      <div className={cn(
        "lg:hidden fixed inset-0 z-50 bg-black/50 transition-opacity",
        mobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      )} onClick={() => setMobileMenuOpen(false)}>
        <aside className={cn(
          "fixed left-0 top-0 h-full w-64 bg-white transform transition-transform",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )} onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between p-4 border-b">
            <h1 className="font-bold text-xl">Admin Panel</h1>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileMenuOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <ScrollArea className="flex-1">
            <nav className="p-2">
              {sidebarItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Button
                    key={item.id}
                    variant={selectedView === item.id ? 'secondary' : 'ghost'}
                    className="w-full justify-start mb-1"
                    onClick={() => {
                      setSelectedView(item.id);
                      setMobileMenuOpen(false);
                    }}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {item.label}
                  </Button>
                );
              })}
            </nav>
          </ScrollArea>
          
          <Separator />
          
          <div className="p-4">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </aside>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Mobile Header */}
        <div className="lg:hidden sticky top-0 z-40 bg-white border-b p-4 flex items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="ml-4 font-bold text-xl">Admin Dashboard</h1>
        </div>
        
        {/* Content Area */}
        <div className="p-6">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};