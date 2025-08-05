import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { format, addDays, startOfWeek, endOfWeek } from 'date-fns';
import { 
  CalendarCheck,
  Clock,
  Users,
  TrendingUp,
  FileText,
  Settings,
  Home,
  LogOut,
  Menu,
  X,
  Bell,
  UserCircle,
  RefreshCw,
  Plus,
  Calendar as CalendarIcon,
  CheckCircle,
  XCircle,
  AlertCircle,
  Stethoscope,
  Activity,
  Pill,
  ChevronDown
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { apiRequest } from '@/lib/queryClient';
import { useLocation } from 'wouter';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { queryClient } from '@/lib/queryClient';

interface Appointment {
  id: number;
  patient: {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
  };
  appointment_date: string;
  appointment_time: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  reason: string;
  notes?: string;
  created_at: string;
}

interface AppointmentStats {
  total: number;
  scheduled: number;
  completed: number;
  cancelled: number;
  no_show: number;
}

interface DoctorSlot {
  id: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
  max_patients: number;
  is_active: boolean;
}

interface Treatment {
  id: number;
  appointment: number;
  diagnosis: string;
  prescription: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

const DoctorDashboard: React.FC = () => {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [treatmentDialogOpen, setTreatmentDialogOpen] = useState(false);
  const [treatmentForm, setTreatmentForm] = useState({
    diagnosis: '',
    prescription: '',
    notes: ''
  });

  // Get auth token and user info
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  };

  // Fetch today's appointments
  const { data: todayAppointments, isLoading: todayLoading, refetch: refetchToday } = useQuery<Appointment[]>({
    queryKey: ['/api/appointments/appointments/today'],
    queryFn: async () => {
      return apiRequest('/api/appointments/appointments/today', {
        headers: getAuthHeaders()
      });
    }
  });

  // Fetch upcoming appointments
  const { data: upcomingAppointments, isLoading: upcomingLoading, refetch: refetchUpcoming } = useQuery<Appointment[]>({
    queryKey: ['/api/appointments/appointments/upcoming'],
    queryFn: async () => {
      return apiRequest('/api/appointments/appointments/upcoming', {
        headers: getAuthHeaders()
      });
    }
  });

  // Fetch appointment statistics
  const { data: appointmentStats, isLoading: statsLoading, refetch: refetchStats } = useQuery<AppointmentStats>({
    queryKey: ['/api/appointments/appointments/statistics'],
    queryFn: async () => {
      return apiRequest('/api/appointments/appointments/statistics', {
        headers: getAuthHeaders()
      });
    }
  });

  // Fetch doctor slots
  const { data: doctorSlots, isLoading: slotsLoading, refetch: refetchSlots } = useQuery<DoctorSlot[]>({
    queryKey: ['/api/appointments/slots'],
    queryFn: async () => {
      return apiRequest('/api/appointments/slots', {
        headers: getAuthHeaders()
      });
    }
  });

  // Update appointment status mutation
  const updateAppointmentStatus = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      return apiRequest(`/api/appointments/appointments/${id}/update_status`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status })
      });
    },
    onSuccess: () => {
      toast({
        title: "Status Updated",
        description: "Appointment status has been updated successfully.",
      });
      refetchToday();
      refetchUpcoming();
      refetchStats();
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update appointment status.",
        variant: "destructive"
      });
    }
  });

  // Create treatment mutation
  const createTreatment = useMutation({
    mutationFn: async (data: { appointment: number; diagnosis: string; prescription: string; notes?: string }) => {
      return apiRequest('/api/treatments/', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      toast({
        title: "Treatment Created",
        description: "Treatment has been recorded successfully.",
      });
      setTreatmentDialogOpen(false);
      setTreatmentForm({ diagnosis: '', prescription: '', notes: '' });
      refetchToday();
    },
    onError: () => {
      toast({
        title: "Creation Failed",
        description: "Failed to create treatment record.",
        variant: "destructive"
      });
    }
  });

  // Navigation items
  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'appointments', label: 'Appointments', icon: CalendarCheck },
    { id: 'patients', label: 'My Patients', icon: Users },
    { id: 'treatments', label: 'Treatments', icon: Pill },
    { id: 'schedule', label: 'My Schedule', icon: Clock },
    { id: 'analytics', label: 'Analytics', icon: Activity },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleLogout = () => {
    localStorage.removeItem('medcor_token');
    localStorage.removeItem('user');
    setLocation('/doctor/login');
  };

  const refreshData = () => {
    refetchToday();
    refetchUpcoming();
    refetchStats();
    refetchSlots();
    toast({
      title: "Data Refreshed",
      description: "All data has been updated.",
    });
  };

  const handleCompleteAppointment = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setTreatmentDialogOpen(true);
  };

  const handleCreateTreatment = () => {
    if (selectedAppointment && treatmentForm.diagnosis && treatmentForm.prescription) {
      createTreatment.mutate({
        appointment: selectedAppointment.id,
        ...treatmentForm
      });
    }
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Appointments</CardTitle>
            <CalendarCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayAppointments?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              {appointmentStats?.scheduled || 0} scheduled
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{appointmentStats?.completed || 0}</div>
            <p className="text-xs text-muted-foreground">
              {appointmentStats?.total ? Math.round((appointmentStats.completed / appointmentStats.total) * 100) : 0}% completion rate
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming This Week</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingAppointments?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Next 7 days</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cancellation Rate</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {appointmentStats?.total ? Math.round((appointmentStats.cancelled / appointmentStats.total) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              {appointmentStats?.cancelled || 0} cancelled
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Today's Appointments */}
      <Card>
        <CardHeader>
          <CardTitle>Today's Appointments</CardTitle>
          <CardDescription>Manage your appointments for today</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {todayAppointments?.map((appointment) => (
                <TableRow key={appointment.id}>
                  <TableCell>{appointment.appointment_time}</TableCell>
                  <TableCell>
                    {appointment.patient.first_name} {appointment.patient.last_name}
                  </TableCell>
                  <TableCell>{appointment.reason}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        appointment.status === 'completed' ? 'default' :
                        appointment.status === 'cancelled' ? 'destructive' :
                        'secondary'
                      }
                    >
                      {appointment.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {appointment.status === 'scheduled' && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleCompleteAppointment(appointment)}
                        >
                          Complete
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => updateAppointmentStatus.mutate({
                            id: appointment.id,
                            status: 'cancelled'
                          })}
                        >
                          Cancel
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );

  const renderAppointments = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Appointments</h2>
          <p className="text-muted-foreground">Manage all your appointments</p>
        </div>
        <Button onClick={refreshData}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="upcoming" className="space-y-4">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="past">Past</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Appointments</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {upcomingAppointments?.map((appointment) => (
                    <TableRow key={appointment.id}>
                      <TableCell>{format(new Date(appointment.appointment_date), 'MMM dd, yyyy')}</TableCell>
                      <TableCell>{appointment.appointment_time}</TableCell>
                      <TableCell>
                        {appointment.patient.first_name} {appointment.patient.last_name}
                      </TableCell>
                      <TableCell>{appointment.reason}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{appointment.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="today" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {todayAppointments?.map((appointment) => (
                    <TableRow key={appointment.id}>
                      <TableCell>{appointment.appointment_time}</TableCell>
                      <TableCell>
                        {appointment.patient.first_name} {appointment.patient.last_name}
                      </TableCell>
                      <TableCell>{appointment.reason}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            appointment.status === 'completed' ? 'default' :
                            appointment.status === 'cancelled' ? 'destructive' :
                            'secondary'
                          }
                        >
                          {appointment.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {appointment.status === 'scheduled' && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleCompleteAppointment(appointment)}
                            >
                              Complete
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateAppointmentStatus.mutate({
                                id: appointment.id,
                                status: 'cancelled'
                              })}
                            >
                              Cancel
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );

  const renderSchedule = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">My Schedule</h2>
          <p className="text-muted-foreground">Manage your availability</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Weekly Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {doctorSlots?.map((slot) => (
                <div key={slot.id} className="flex justify-between items-center p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">
                      {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][slot.day_of_week]}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {slot.start_time} - {slot.end_time}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={slot.is_active ? 'default' : 'secondary'}>
                      {slot.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                    <span className="text-sm">Max: {slot.max_patients}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Calendar View</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              className="rounded-md border"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return renderDashboard();
      case 'appointments':
        return renderAppointments();
      case 'schedule':
        return renderSchedule();
      case 'patients':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">My Patients</h2>
            <Card>
              <CardContent className="py-20 text-center">
                <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Patients section coming soon</p>
              </CardContent>
            </Card>
          </div>
        );
      case 'treatments':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Treatments</h2>
            <Card>
              <CardContent className="py-20 text-center">
                <Pill className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Treatments section coming soon</p>
              </CardContent>
            </Card>
          </div>
        );
      case 'analytics':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Analytics</h2>
            <Card>
              <CardContent className="py-20 text-center">
                <Activity className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Analytics section coming soon</p>
              </CardContent>
            </Card>
          </div>
        );
      case 'settings':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Settings</h2>
            <Card>
              <CardContent className="py-20 text-center">
                <Settings className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Settings section coming soon</p>
              </CardContent>
            </Card>
          </div>
        );
      default:
        return renderDashboard();
    }
  };

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={cn(
        "bg-white border-r transition-all duration-300 flex flex-col",
        sidebarCollapsed ? "w-16" : "w-64"
      )}>
        {/* Logo */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <div className={cn("flex items-center", sidebarCollapsed && "justify-center")}>
              <Stethoscope className="h-8 w-8 text-purple-600" />
              {!sidebarCollapsed && (
                <span className="ml-2 text-xl font-bold">Doctor Portal</span>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="ml-auto"
            >
              {sidebarCollapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 px-3 py-4">
          <nav className="space-y-2">
            {navigationItems.map((item) => (
              <Button
                key={item.id}
                variant={activeSection === item.id ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start",
                  sidebarCollapsed && "justify-center px-2"
                )}
                onClick={() => setActiveSection(item.id)}
              >
                <item.icon className={cn("h-4 w-4", !sidebarCollapsed && "mr-2")} />
                {!sidebarCollapsed && item.label}
              </Button>
            ))}
          </nav>
        </ScrollArea>

        {/* User Menu */}
        <div className="p-4 border-t">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start",
                  sidebarCollapsed && "justify-center px-2"
                )}
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/avatar-placeholder.png" alt={user.username} />
                  <AvatarFallback>{user.first_name?.[0]}{user.last_name?.[0]}</AvatarFallback>
                </Avatar>
                {!sidebarCollapsed && (
                  <>
                    <div className="ml-2 text-left">
                      <p className="text-sm font-medium">Dr. {user.first_name} {user.last_name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                    <ChevronDown className="ml-auto h-4 w-4" />
                  </>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <UserCircle className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold capitalize">{activeSection.replace('-', ' ')}</h1>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon">
                <Bell className="h-5 w-5" />
              </Button>
              <Button variant="outline" onClick={refreshData}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Data
              </Button>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {(todayLoading || upcomingLoading || statsLoading || slotsLoading) ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <Activity className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">Loading data...</p>
              </div>
            </div>
          ) : (
            renderContent()
          )}
        </main>
      </div>

      {/* Treatment Dialog */}
      <Dialog open={treatmentDialogOpen} onOpenChange={setTreatmentDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Complete Appointment</DialogTitle>
            <DialogDescription>
              Record treatment details for {selectedAppointment?.patient.first_name} {selectedAppointment?.patient.last_name}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="diagnosis">Diagnosis</Label>
              <Textarea
                id="diagnosis"
                value={treatmentForm.diagnosis}
                onChange={(e) => setTreatmentForm({ ...treatmentForm, diagnosis: e.target.value })}
                placeholder="Enter diagnosis"
                className="min-h-[100px]"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="prescription">Prescription</Label>
              <Textarea
                id="prescription"
                value={treatmentForm.prescription}
                onChange={(e) => setTreatmentForm({ ...treatmentForm, prescription: e.target.value })}
                placeholder="Enter prescription details"
                className="min-h-[100px]"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Additional Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={treatmentForm.notes}
                onChange={(e) => setTreatmentForm({ ...treatmentForm, notes: e.target.value })}
                placeholder="Any additional notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTreatmentDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateTreatment} 
              disabled={!treatmentForm.diagnosis || !treatmentForm.prescription}
            >
              Complete & Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DoctorDashboard;