import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Users,
  Calendar,
  Pill,
  FileText,
  Clock,
  ChevronRight,
  Menu,
  X,
  Home,
  CalendarPlus,
  History,
  Stethoscope,
  Bell,
  Settings,
  LogOut,
  User,
  Phone,
  Mail,
  MapPin,
  Activity,
  ClipboardList,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';

interface Appointment {
  id: number;
  doctor: {
    id: number;
    first_name: string;
    last_name: string;
    specialization: string;
  };
  appointment_date: string;
  appointment_time: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  reason: string;
  notes?: string;
}

interface Treatment {
  id: number;
  appointment: number;
  diagnosis: string;
  prescription: string;
  notes?: string;
  created_at: string;
  doctor: {
    first_name: string;
    last_name: string;
  };
}

interface MedicalRecord {
  id: number;
  record_type: string;
  description: string;
  file_url?: string;
  created_at: string;
  doctor?: {
    first_name: string;
    last_name: string;
  };
}

interface Doctor {
  id: number;
  first_name: string;
  last_name: string;
  specialization: string;
  is_available: boolean;
}

const PatientDashboard: React.FC = () => {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [bookingReason, setBookingReason] = useState('');

  // Get auth token from correct storage location
  const getAuthHeaders = (): HeadersInit => {
    const token = localStorage.getItem('medcor_token');
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  };

  // Fetch current user data
  const { data: currentUser } = useQuery({
    queryKey: ['/api/auth/me'],
    queryFn: async () => {
      return apiRequest('/api/auth/me', {
        headers: getAuthHeaders()
      });
    }
  });

  // Fetch all appointments
  const { data: allAppointments = [], isLoading: appointmentsLoading, refetch: refetchAppointments } = useQuery<Appointment[]>({
    queryKey: ['/api/appointments/appointments'],
    queryFn: async () => {
      const data = await apiRequest('/api/appointments/appointments/', {
        headers: getAuthHeaders()
      });
      console.log('Patient Dashboard - All appointments:', data);
      return data;
    }
  });

  // Filter appointments for upcoming and history
  const upcomingAppointments = allAppointments.filter(apt => 
    apt.status === 'scheduled' && new Date(apt.appointment_date) >= new Date()
  );
  const appointmentHistory = allAppointments.filter(apt => 
    apt.status === 'completed' || new Date(apt.appointment_date) < new Date()
  );
  const historyLoading = appointmentsLoading;

  // Fetch treatments - temporarily disabled due to 401 errors
  const { data: treatments = [], isLoading: treatmentsLoading } = useQuery<Treatment[]>({
    queryKey: ['/api/treatments'],
    enabled: false, // Temporarily disabled
    queryFn: async () => {
      return apiRequest('/api/treatments/', {
        headers: getAuthHeaders()
      });
    }
  });

  // Fetch medical records - temporarily disabled due to 401 errors
  const { data: medicalRecords = [], isLoading: recordsLoading } = useQuery<MedicalRecord[]>({
    queryKey: ['/api/treatments', 'medical-records'],
    enabled: false, // Temporarily disabled
    queryFn: async () => {
      // Using treatments endpoint as medical records
      const treatmentData = await apiRequest('/api/treatments/', {
        headers: getAuthHeaders()
      });
      // Transform treatments to medical records format
      return treatmentData.map((t: any) => ({
        id: t.id,
        record_type: 'Treatment',
        description: t.diagnosis,
        created_at: t.created_at,
        doctor: t.doctor
      }));
    }
  });

  // Fetch available doctors
  const { data: doctors = [], isLoading: doctorsLoading } = useQuery<Doctor[]>({
    queryKey: ['/api/tenants/users/doctors'],
    queryFn: async () => {
      const doctorData = await apiRequest('/api/tenants/users/doctors/', {
        headers: getAuthHeaders()
      });
      // Transform to expected format
      return doctorData.map((d: any) => ({
        id: d.id,
        first_name: d.first_name || d.username,
        last_name: d.last_name || '',
        specialization: d.specialization || 'General Practice',
        is_available: true
      }));
    }
  });

  // Book appointment mutation
  const bookAppointment = useMutation({
    mutationFn: async (data: {
      doctor_id: string;
      appointment_date: string;
      appointment_time: string;
      reason: string;
    }) => {
      return apiRequest('/api/appointments/appointments/', {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      toast({
        title: "Appointment Booked",
        description: "Your appointment has been scheduled successfully.",
      });
      setBookingDialogOpen(false);
      refetchAppointments();
      // Reset form
      setSelectedDate('');
      setSelectedTime('');
      setSelectedDoctor('');
      setBookingReason('');
    },
    onError: () => {
      toast({
        title: "Booking Failed",
        description: "Failed to book appointment. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Cancel appointment mutation
  const cancelAppointment = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/appointments/appointments/${id}/`, {
        method: 'PATCH',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'cancelled' })
      });
    },
    onSuccess: () => {
      toast({
        title: "Appointment Cancelled",
        description: "Your appointment has been cancelled.",
      });
      refetchAppointments();
    },
    onError: () => {
      toast({
        title: "Cancellation Failed",
        description: "Failed to cancel appointment.",
        variant: "destructive"
      });
    }
  });

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setLocation('/login');
  };

  // Navigation items
  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'appointments', label: 'My Appointments', icon: Calendar },
    { id: 'treatments', label: 'Treatments', icon: Pill },
    { id: 'records', label: 'Medical Records', icon: FileText },
    { id: 'history', label: 'History', icon: History },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'no_show': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled': return <Clock className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
      case 'no_show': return <AlertCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`${sidebarCollapsed ? 'w-16' : 'w-64'} transition-all duration-300 bg-white border-r border-gray-200 flex flex-col`}>
        {/* Logo */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h1 className={`font-bold text-xl text-primary ${sidebarCollapsed ? 'hidden' : 'block'}`}>
              Patient Portal
            </h1>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hover:bg-gray-100"
            >
              {sidebarCollapsed ? <Menu className="h-5 w-5" /> : <X className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {navigationItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    activeSection === item.id
                      ? 'bg-primary text-white'
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {!sidebarCollapsed && <span>{item.label}</span>}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* User Menu */}
        <div className="p-4 border-t border-gray-200">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start gap-2 hover:bg-gray-100">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={currentUser?.user?.profile_image_url} />
                  <AvatarFallback>{currentUser?.user?.username?.slice(0, 2).toUpperCase() || 'PA'}</AvatarFallback>
                </Avatar>
                {!sidebarCollapsed && (
                  <div className="text-left">
                    <p className="text-sm font-medium">{currentUser?.user?.username || 'Patient'}</p>
                    <p className="text-xs text-gray-500">Patient</p>
                  </div>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setActiveSection('profile')}>
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setActiveSection('settings')}>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600">
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
        <header className="bg-white border-b border-gray-200 px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {navigationItems.find(item => item.id === activeSection)?.label || 'Dashboard'}
              </h2>
              <p className="text-sm text-gray-500">
                Welcome back, {currentUser?.user?.username || 'User'}!
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="outline" size="icon">
                <Bell className="h-5 w-5" />
              </Button>
              <Dialog open={bookingDialogOpen} onOpenChange={setBookingDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <CalendarPlus className="mr-2 h-4 w-4" />
                    Book Appointment
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Book New Appointment</DialogTitle>
                    <DialogDescription>
                      Schedule an appointment with one of our doctors.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="doctor">Select Doctor</Label>
                      <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a doctor" />
                        </SelectTrigger>
                        <SelectContent>
                          {doctors?.map((doctor) => (
                            <SelectItem key={doctor.id} value={doctor.id.toString()}>
                              Dr. {doctor.first_name} {doctor.last_name} - {doctor.specialization}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="date">Date</Label>
                      <input
                        type="date"
                        id="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="time">Time</Label>
                      <Select value={selectedTime} onValueChange={setSelectedTime}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select time slot" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="09:00">9:00 AM</SelectItem>
                          <SelectItem value="09:30">9:30 AM</SelectItem>
                          <SelectItem value="10:00">10:00 AM</SelectItem>
                          <SelectItem value="10:30">10:30 AM</SelectItem>
                          <SelectItem value="11:00">11:00 AM</SelectItem>
                          <SelectItem value="11:30">11:30 AM</SelectItem>
                          <SelectItem value="14:00">2:00 PM</SelectItem>
                          <SelectItem value="14:30">2:30 PM</SelectItem>
                          <SelectItem value="15:00">3:00 PM</SelectItem>
                          <SelectItem value="15:30">3:30 PM</SelectItem>
                          <SelectItem value="16:00">4:00 PM</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="reason">Reason for Visit</Label>
                      <Textarea
                        id="reason"
                        value={bookingReason}
                        onChange={(e) => setBookingReason(e.target.value)}
                        placeholder="Please describe your symptoms or reason for consultation"
                        rows={3}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setBookingDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={() => bookAppointment.mutate({
                        doctor_id: selectedDoctor,
                        appointment_date: selectedDate,
                        appointment_time: selectedTime,
                        reason: bookingReason
                      })}
                      disabled={!selectedDoctor || !selectedDate || !selectedTime || !bookingReason}
                    >
                      Book Appointment
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <ScrollArea className="flex-1 p-8">
          {activeSection === 'dashboard' && (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Upcoming Appointments</CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{upcomingAppointments?.length || 0}</div>
                    <p className="text-xs text-muted-foreground">Next 30 days</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Treatments</CardTitle>
                    <Pill className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{treatments?.filter(t => t.created_at > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()).length || 0}</div>
                    <p className="text-xs text-muted-foreground">This month</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Medical Records</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{medicalRecords?.length || 0}</div>
                    <p className="text-xs text-muted-foreground">Total records</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Health Score</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">85%</div>
                    <p className="text-xs text-muted-foreground">Good health</p>
                  </CardContent>
                </Card>
              </div>

              {/* Upcoming Appointments */}
              <Card>
                <CardHeader>
                  <CardTitle>Upcoming Appointments</CardTitle>
                  <CardDescription>Your scheduled appointments for the next 30 days</CardDescription>
                </CardHeader>
                <CardContent>
                  {appointmentsLoading ? (
                    <div className="text-center py-4">Loading appointments...</div>
                  ) : upcomingAppointments && upcomingAppointments.length > 0 ? (
                    <div className="space-y-4">
                      {upcomingAppointments.slice(0, 3).map((appointment) => (
                        <div key={appointment.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                              <Stethoscope className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">Dr. {appointment.doctor.first_name} {appointment.doctor.last_name}</p>
                              <p className="text-sm text-gray-500">{appointment.doctor.specialization}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Calendar className="h-3 w-3 text-gray-400" />
                                <span className="text-xs text-gray-500">
                                  {format(new Date(appointment.appointment_date), 'MMM d, yyyy')} at {appointment.appointment_time}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={getStatusColor(appointment.status)}>
                              {getStatusIcon(appointment.status)}
                              <span className="ml-1 capitalize">{appointment.status}</span>
                            </Badge>
                            {appointment.status === 'scheduled' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => cancelAppointment.mutate(appointment.id)}
                              >
                                Cancel
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 py-4">No upcoming appointments</p>
                  )}
                </CardContent>
              </Card>

              {/* Recent Treatments */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Treatments</CardTitle>
                  <CardDescription>Your latest treatment records</CardDescription>
                </CardHeader>
                <CardContent>
                  {treatmentsLoading ? (
                    <div className="text-center py-4">Loading treatments...</div>
                  ) : treatments && treatments.length > 0 ? (
                    <div className="space-y-4">
                      {treatments.slice(0, 3).map((treatment) => (
                        <div key={treatment.id} className="border-l-4 border-primary pl-4 py-2">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{treatment.diagnosis}</p>
                              <p className="text-sm text-gray-600">{treatment.prescription}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                By Dr. {treatment.doctor.first_name} {treatment.doctor.last_name} • {format(new Date(treatment.created_at), 'MMM d, yyyy')}
                              </p>
                            </div>
                            <ChevronRight className="h-5 w-5 text-gray-400" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 py-4">No treatment records</p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {activeSection === 'appointments' && (
            <Tabs defaultValue="upcoming" className="space-y-4">
              <TabsList>
                <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
              </TabsList>
              
              <TabsContent value="upcoming" className="space-y-4">
                {appointmentsLoading ? (
                  <Card>
                    <CardContent className="text-center py-8">
                      Loading appointments...
                    </CardContent>
                  </Card>
                ) : upcomingAppointments && upcomingAppointments.length > 0 ? (
                  upcomingAppointments.map((appointment) => (
                    <Card key={appointment.id}>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                              <Stethoscope className="h-8 w-8 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-lg">Dr. {appointment.doctor.first_name} {appointment.doctor.last_name}</h3>
                              <p className="text-gray-600">{appointment.doctor.specialization}</p>
                              <div className="flex items-center gap-4 mt-2">
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-4 w-4 text-gray-400" />
                                  <span className="text-sm">{format(new Date(appointment.appointment_date), 'MMMM d, yyyy')}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="h-4 w-4 text-gray-400" />
                                  <span className="text-sm">{appointment.appointment_time}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <Badge className={getStatusColor(appointment.status)}>
                              {getStatusIcon(appointment.status)}
                              <span className="ml-1 capitalize">{appointment.status}</span>
                            </Badge>
                            {appointment.status === 'scheduled' && (
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => cancelAppointment.mutate(appointment.id)}
                              >
                                Cancel Appointment
                              </Button>
                            )}
                          </div>
                        </div>
                        <Separator className="my-4" />
                        <div>
                          <p className="text-sm font-medium text-gray-700">Reason for visit:</p>
                          <p className="text-sm text-gray-600 mt-1">{appointment.reason}</p>
                          {appointment.notes && (
                            <>
                              <p className="text-sm font-medium text-gray-700 mt-3">Notes:</p>
                              <p className="text-sm text-gray-600 mt-1">{appointment.notes}</p>
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Card>
                    <CardContent className="text-center py-8">
                      <p className="text-gray-500">No upcoming appointments</p>
                      <Button className="mt-4" onClick={() => setBookingDialogOpen(true)}>
                        Book an Appointment
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="history" className="space-y-4">
                {historyLoading ? (
                  <Card>
                    <CardContent className="text-center py-8">
                      Loading appointment history...
                    </CardContent>
                  </Card>
                ) : appointmentHistory && appointmentHistory.length > 0 ? (
                  appointmentHistory.map((appointment) => (
                    <Card key={appointment.id} className="opacity-90">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium">Dr. {appointment.doctor.first_name} {appointment.doctor.last_name}</h3>
                            <p className="text-sm text-gray-600">{appointment.doctor.specialization}</p>
                            <p className="text-sm text-gray-500 mt-1">
                              {format(new Date(appointment.appointment_date), 'MMMM d, yyyy')} at {appointment.appointment_time}
                            </p>
                            <p className="text-sm text-gray-600 mt-2">{appointment.reason}</p>
                          </div>
                          <Badge className={getStatusColor(appointment.status)}>
                            {getStatusIcon(appointment.status)}
                            <span className="ml-1 capitalize">{appointment.status}</span>
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Card>
                    <CardContent className="text-center py-8">
                      <p className="text-gray-500">No appointment history</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          )}

          {activeSection === 'treatments' && (
            <div className="space-y-4">
              {treatmentsLoading ? (
                <Card>
                  <CardContent className="text-center py-8">
                    Loading treatments...
                  </CardContent>
                </Card>
              ) : treatments && treatments.length > 0 ? (
                treatments.map((treatment) => (
                  <Card key={treatment.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">{treatment.diagnosis}</CardTitle>
                          <CardDescription>
                            By Dr. {treatment.doctor.first_name} {treatment.doctor.last_name} • {format(new Date(treatment.created_at), 'MMMM d, yyyy')}
                          </CardDescription>
                        </div>
                        <Badge variant="secondary">
                          <ClipboardList className="h-3 w-3 mr-1" />
                          Treatment #{treatment.id}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm font-medium text-gray-700">Prescription:</p>
                          <p className="text-sm text-gray-600 mt-1">{treatment.prescription}</p>
                        </div>
                        {treatment.notes && (
                          <div>
                            <p className="text-sm font-medium text-gray-700">Notes:</p>
                            <p className="text-sm text-gray-600 mt-1">{treatment.notes}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="text-center py-8">
                    <p className="text-gray-500">No treatment records</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {activeSection === 'records' && (
            <div className="space-y-4">
              {recordsLoading ? (
                <Card>
                  <CardContent className="text-center py-8">
                    Loading medical records...
                  </CardContent>
                </Card>
              ) : medicalRecords && medicalRecords.length > 0 ? (
                medicalRecords.map((record) => (
                  <Card key={record.id}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">{record.record_type}</h3>
                          <p className="text-sm text-gray-600 mt-1">{record.description}</p>
                          <p className="text-xs text-gray-500 mt-2">
                            {record.doctor && `By Dr. ${record.doctor.first_name} ${record.doctor.last_name} • `}
                            {format(new Date(record.created_at), 'MMMM d, yyyy')}
                          </p>
                        </div>
                        {record.file_url && (
                          <Button variant="outline" size="sm" asChild>
                            <a href={record.file_url} target="_blank" rel="noopener noreferrer">
                              <FileText className="h-4 w-4 mr-2" />
                              View File
                            </a>
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="text-center py-8">
                    <p className="text-gray-500">No medical records</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {activeSection === 'profile' && (
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Your personal and contact information</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={currentUser?.profile_image_url} />
                      <AvatarFallback className="text-2xl">
                        {currentUser?.first_name?.[0]}{currentUser?.last_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-xl font-semibold">{currentUser?.first_name} {currentUser?.last_name}</h3>
                      <p className="text-gray-500">Patient ID: #{currentUser?.id}</p>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-medium">Contact Information</h4>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">{currentUser?.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">{currentUser?.phone || 'Not provided'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">{currentUser?.address || 'Not provided'}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h4 className="font-medium">Medical Information</h4>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-gray-600">Blood Type</p>
                          <p className="font-medium">{currentUser?.blood_type || 'Not specified'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Allergies</p>
                          <p className="font-medium">{currentUser?.allergies || 'None reported'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Emergency Contact</p>
                          <p className="font-medium">{currentUser?.emergency_contact || 'Not provided'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </ScrollArea>
      </div>
    </div>
  );
};

export default PatientDashboard;