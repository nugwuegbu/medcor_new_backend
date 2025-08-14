import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  Home,
  Calendar,
  FileText,
  Scan,
  User,
  LogOut,
  Menu,
  X,
  Bell,
  ChevronRight,
  Clock,
  Activity,
  Heart,
  Stethoscope,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Users,
  MessageSquare,
  Pill,
  TestTube,
  Camera,
  BarChart3
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Import sub-pages
import PatientOverview from './PatientOverview';
import PatientAppointments from './PatientAppointments';
import PatientMedicalRecords from './PatientMedicalRecords';
import PatientAnalysisTracking from './PatientAnalysisTracking';
import PatientProfile from './PatientProfile';

interface PatientDashboardProps {}

const PatientDashboard: React.FC<PatientDashboardProps> = () => {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [activeView, setActiveView] = useState('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Demo patient data
  const patientData = {
    id: 1,
    name: 'John Smith',
    email: 'john.smith@email.com',
    avatar: '/api/placeholder/150/150',
    memberSince: '2024-01-15',
    bloodType: 'O+',
    allergies: ['Penicillin', 'Peanuts'],
    emergencyContact: '+1 (555) 123-4567'
  };

  // Navigation items
  const navigationItems = [
    { 
      id: 'overview', 
      label: 'Overview', 
      icon: Home,
      badge: null,
      description: 'Dashboard and quick stats'
    },
    { 
      id: 'appointments', 
      label: 'Appointments', 
      icon: Calendar,
      badge: '2',
      badgeVariant: 'default' as const,
      description: 'View and manage appointments'
    },
    { 
      id: 'medical-records', 
      label: 'Medical Records', 
      icon: FileText,
      badge: null,
      description: 'Access your health records'
    },
    { 
      id: 'analysis-tracking', 
      label: 'Health Analysis', 
      icon: Scan,
      badge: 'NEW',
      badgeVariant: 'secondary' as const,
      description: 'Track your health metrics'
    },
    { 
      id: 'profile', 
      label: 'Profile & Settings', 
      icon: User,
      badge: null,
      description: 'Manage your account'
    }
  ];

  const handleLogout = () => {
    toast({
      title: "Logged out successfully",
      description: "You have been logged out of your account",
    });
    navigate('/login');
  };

  // Notification data
  const notifications = [
    {
      id: 1,
      type: 'appointment',
      message: 'Appointment reminder: Dr. Johnson tomorrow at 10:00 AM',
      time: '1 hour ago',
      unread: true
    },
    {
      id: 2,
      type: 'result',
      message: 'Your lab results are ready to view',
      time: '3 hours ago',
      unread: true
    },
    {
      id: 3,
      type: 'medication',
      message: 'Medication refill reminder: Lisinopril',
      time: '1 day ago',
      unread: false
    }
  ];

  const renderContent = () => {
    switch (activeView) {
      case 'overview':
        return <PatientOverview patientData={patientData} />;
      case 'appointments':
        return <PatientAppointments patientData={patientData} />;
      case 'medical-records':
        return <PatientMedicalRecords patientData={patientData} />;
      case 'analysis-tracking':
        return <PatientAnalysisTracking patientData={patientData} />;
      case 'profile':
        return <PatientProfile patientData={patientData} />;
      default:
        return <PatientOverview patientData={patientData} />;
    }
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        {/* Top Navigation Bar */}
        <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-gray-200">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              >
                {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
              <div className="flex items-center gap-2">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-2">
                  <Heart className="h-5 w-5 text-white" />
                </div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  MedCare Portal
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Notifications */}
              <div className="relative">
                <Button variant="ghost" size="sm" className="relative">
                  <Bell className="h-5 w-5" />
                  {notifications.filter(n => n.unread).length > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {notifications.filter(n => n.unread).length}
                    </span>
                  )}
                </Button>
              </div>

              {/* User Profile */}
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={patientData.avatar} />
                  <AvatarFallback>{patientData.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <div className="hidden md:block">
                  <p className="text-sm font-medium">{patientData.name}</p>
                  <p className="text-xs text-gray-500">Patient</p>
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-gray-600 hover:text-red-600"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="flex">
          {/* Sidebar */}
          <aside className={cn(
            "fixed lg:sticky top-[57px] left-0 z-30 h-[calc(100vh-57px)] w-64 bg-white border-r border-gray-200 transition-transform duration-300",
            isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          )}>
            <ScrollArea className="h-full py-4">
              <div className="px-3 space-y-1">
                {navigationItems.map((item) => (
                  <Tooltip key={item.id}>
                    <TooltipTrigger asChild>
                      <Button
                        variant={activeView === item.id ? "default" : "ghost"}
                        className={cn(
                          "w-full justify-start gap-3 transition-all",
                          activeView === item.id 
                            ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg" 
                            : "hover:bg-gray-100"
                        )}
                        onClick={() => {
                          setActiveView(item.id);
                          setIsSidebarOpen(false);
                        }}
                      >
                        <item.icon className="h-4 w-4" />
                        <span className="flex-1 text-left">{item.label}</span>
                        {item.badge && (
                          <Badge 
                            variant={activeView === item.id ? "secondary" : item.badgeVariant}
                            className={cn(
                              "ml-auto",
                              activeView === item.id && "bg-white/20 text-white"
                            )}
                          >
                            {item.badge}
                          </Badge>
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p>{item.description}</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>

              {/* Quick Actions */}
              <div className="mt-6 px-3">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Quick Actions
                </h3>
                <div className="space-y-1">
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2 text-sm"
                    onClick={() => {
                      setActiveView('appointments');
                      setIsSidebarOpen(false);
                    }}
                  >
                    <Calendar className="h-3 w-3" />
                    Book Appointment
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2 text-sm"
                    onClick={() => {
                      toast({
                        title: "AI Chat Started",
                        description: "Connecting you with our medical AI assistant",
                      });
                    }}
                  >
                    <MessageSquare className="h-3 w-3" />
                    Start AI Chat
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2 text-sm"
                    onClick={() => {
                      setActiveView('analysis-tracking');
                      setIsSidebarOpen(false);
                    }}
                  >
                    <Camera className="h-3 w-3" />
                    Quick Analysis
                  </Button>
                </div>
              </div>

              {/* Health Stats */}
              <div className="mt-6 px-3">
                <Card className="bg-gradient-to-br from-blue-50 to-purple-50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Health Score</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-12 w-12 rounded-full bg-gradient-to-r from-green-400 to-blue-500 flex items-center justify-center text-white font-bold">
                          85
                        </div>
                        <div>
                          <p className="text-sm font-medium">Good</p>
                          <p className="text-xs text-gray-500">+5 from last month</p>
                        </div>
                      </div>
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
          </aside>

          {/* Main Content */}
          <main className="flex-1 lg:ml-0 p-4 lg:p-6">
            <div className="max-w-7xl mx-auto">
              {renderContent()}
            </div>
          </main>
        </div>

        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-20 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </div>
    </TooltipProvider>
  );
};

export default PatientDashboard;