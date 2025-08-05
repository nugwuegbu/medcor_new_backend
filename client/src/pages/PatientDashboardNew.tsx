import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Calendar,
  Clock,
  User,
  FileText,
  Activity,
  Plus,
  X,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  History,
  Stethoscope,
  Pill,
  Edit,
  Trash2,
  Eye,
  Menu,
  LogOut
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, parseISO, isToday } from 'date-fns';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';
import { useAuth } from '@/hooks/useAuth';
import { API_CONFIG } from '@/config/api';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

// Django API Types
interface DjangoAppointment {
  id: number;
  patient: number;
  patient_name: string;
  doctor: number;
  doctor_name: string;
  slot: number;
  treatment: number;
  treatment_name: string;
  appointment_slot_date: string;
  appointment_slot_start_time: string;
  appointment_slot_end_time: string;
  appointment_status: string;
  status_display: string;
  medical_record?: string;
  created_at: string;
  updated_at: string;
}

interface DjangoTreatment {
  id: number;
  name: string;
  description: string;
  cost: number;
  tenant: number;
  created_at?: string;
  is_active?: boolean;
}

interface DjangoDoctor {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  username?: string;
  role?: string;
  is_active?: boolean;
  is_staff?: boolean;
  created_at?: string;
}

interface DjangoSlot {
  id: number;
  doctor: number;
  doctor_name: string;
  start_time: string;
  end_time: string;
  day_of_week: number;
  day_display: string;
}

interface AppointmentFormData {
  doctor: string;
  treatment: string;
  date: string;
  slot: string;
  symptoms: string;
}

const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem('medcor_token');
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

const PatientDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showAppointmentForm, setShowAppointmentForm] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<DjangoAppointment | null>(null);

  // Form state
  const [appointmentForm, setAppointmentForm] = useState<AppointmentFormData>({
    doctor: '',
    treatment: '',
    date: '',
    slot: '',
    symptoms: ''
  });

  // Fetch appointments for the patient
  const { data: appointments = [], isLoading: appointmentsLoading, refetch: refetchAppointments } = useQuery<DjangoAppointment[]>({
    queryKey: ['/api/appointments/appointments', user?.id],
    queryFn: async () => {
      const data = await apiRequest('/api/appointments/appointments/', {
        headers: getAuthHeaders()
      });
      console.log('Fetched appointments:', data);
      console.log('Current user ID:', user?.id);
      // Handle paginated response structure
      const appointmentsList = data?.results || data;
      const filtered = Array.isArray(appointmentsList) ? appointmentsList : [];
      console.log('Filtered appointments:', filtered);
      return filtered;
    },
    enabled: !!user
  });

  // Fetch upcoming appointments
  const { data: upcomingAppointments = [] } = useQuery<DjangoAppointment[]>({
    queryKey: ['/api/appointments/appointments/upcoming', user?.id],
    queryFn: async () => {
      const data = await apiRequest('/api/appointments/appointments/upcoming/', {
        headers: getAuthHeaders()
      });
      console.log('Upcoming appointments:', data);
      // Handle both array and paginated response
      const appointmentsList = data?.results || data;
      return Array.isArray(appointmentsList) ? appointmentsList : [];
    },
    enabled: !!user
  });

  // Fetch all doctors
  const { data: doctors = [] } = useQuery<DjangoDoctor[]>({
    queryKey: ['/api/auth/doctors'],
    queryFn: async () => {
      const data = await apiRequest('/api/auth/doctors/', {
        headers: getAuthHeaders()
      });
      return Array.isArray(data) ? data : [];
    }
  });

  // Fetch treatments
  const { data: treatments = [] } = useQuery<DjangoTreatment[]>({
    queryKey: ['/api/treatments'],
    queryFn: async () => {
      const data = await apiRequest('/api/treatments/', {
        headers: getAuthHeaders()
      });
      console.log('Fetched treatments:', data);
      // Handle paginated response structure
      const treatmentsList = data?.results || data;
      return Array.isArray(treatmentsList) ? treatmentsList : [];
    }
  });

  // Fetch available slots for selected doctor and date
  const { data: availableSlots = [] } = useQuery<DjangoSlot[]>({
    queryKey: ['/api/appointments/slots/available', appointmentForm.doctor, appointmentForm.date],
    queryFn: async () => {
      if (!appointmentForm.doctor || !appointmentForm.date) return [];
      
      const data = await apiRequest(
        `/api/appointments/slots/available/?doctor_id=${appointmentForm.doctor}&date=${appointmentForm.date}`,
        { headers: getAuthHeaders() }
      );
      return Array.isArray(data) ? data : [];
    },
    enabled: !!appointmentForm.doctor && !!appointmentForm.date
  });

  // Create appointment mutation
  const createAppointmentMutation = useMutation({
    mutationFn: async (data: AppointmentFormData) => {
      const selectedSlot = availableSlots.find(s => s.id.toString() === data.slot);
      if (!selectedSlot) throw new Error('Invalid slot selected');

      const payload = {
        patient: user?.id,
        doctor: parseInt(data.doctor),
        slot: parseInt(data.slot),
        treatment: parseInt(data.treatment),
        appointment_slot_date: data.date,
        appointment_slot_start_time: selectedSlot.start_time,
        appointment_slot_end_time: selectedSlot.end_time,
        appointment_status: 'Pending'
      };

      return apiRequest('/api/appointments/appointments/', {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Appointment booked successfully!"
      });
      setShowAppointmentForm(false);
      resetForm();
      refetchAppointments();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to book appointment",
        variant: "destructive"
      });
    }
  });

  // Update appointment mutation
  const updateAppointmentMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      return apiRequest(`/api/appointments/appointments/${id}/update_status/`, {
        method: 'PATCH',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Appointment updated successfully!"
      });
      refetchAppointments();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update appointment",
        variant: "destructive"
      });
    }
  });

  // Delete appointment mutation
  const deleteAppointmentMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/appointments/appointments/${id}/`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Appointment cancelled successfully!"
      });
      refetchAppointments();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to cancel appointment",
        variant: "destructive"
      });
    }
  });

  const resetForm = () => {
    setAppointmentForm({
      doctor: '',
      treatment: '',
      date: '',
      slot: '',
      symptoms: ''
    });
    setEditingAppointment(null);
  };

  // Calendar helper functions
  const getDaysInMonth = () => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  };

  const getAppointmentsForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return appointments.filter(apt => apt.appointment_slot_date === dateStr);
  };

  const handleLogout = () => {
    logout();
    setLocation('/');
  };

  // Get stats for dashboard
  const stats = {
    totalAppointments: appointments.length,
    upcomingAppointments: upcomingAppointments.length,
    completedAppointments: appointments.filter(a => a.appointment_status === 'Completed').length,
    cancelledAppointments: appointments.filter(a => a.appointment_status === 'Cancelled').length
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'Approved':
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'Cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const sidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Activity },
    { id: 'appointments', label: 'Appointments', icon: Calendar },
    { id: 'medical-history', label: 'Medical History', icon: FileText },
    { id: 'treatments', label: 'Treatment History', icon: Pill },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className={cn(
        "bg-white border-r transition-all duration-300",
        sidebarOpen ? "w-64" : "w-16"
      )}>
        <div className="p-4">
          <div className="flex items-center justify-between">
            <h2 className={cn("font-bold text-xl text-blue-600", !sidebarOpen && "hidden")}>
              MedCor
            </h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
        
        <nav className="mt-8">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "w-full flex items-center px-4 py-3 text-left hover:bg-gray-100 transition-colors",
                activeTab === item.id && "bg-blue-50 text-blue-600 border-r-2 border-blue-600"
              )}
            >
              <item.icon className="h-5 w-5" />
              {sidebarOpen && <span className="ml-3">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className={cn(
          "absolute bottom-4 px-4",
          sidebarOpen ? "left-0 right-0" : "left-2 right-2"
        )}>
          {sidebarOpen ? (
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          ) : (
            <Button
              variant="outline"
              size="icon"
              onClick={handleLogout}
              className="w-10 h-10"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome back, {user?.first_name || 'Patient'}!
            </h1>
            <p className="text-gray-600 mt-2">
              Manage your appointments and health records
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="hidden">
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="appointments">Appointments</TabsTrigger>
              <TabsTrigger value="medical-history">Medical History</TabsTrigger>
              <TabsTrigger value="treatments">Treatments</TabsTrigger>
            </TabsList>

            {/* Dashboard Tab */}
            <TabsContent value="dashboard">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Appointments</CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalAppointments}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.upcomingAppointments}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Completed</CardTitle>
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.completedAppointments}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Cancelled</CardTitle>
                    <X className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.cancelledAppointments}</div>
                  </CardContent>
                </Card>
              </div>

              {/* Upcoming Appointments */}
              <Card>
                <CardHeader>
                  <CardTitle>Upcoming Appointments</CardTitle>
                </CardHeader>
                <CardContent>
                  {upcomingAppointments.length === 0 ? (
                    <p className="text-gray-500">No upcoming appointments</p>
                  ) : (
                    <div className="space-y-4">
                      {upcomingAppointments.slice(0, 5).map((appointment) => (
                        <div key={appointment.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <p className="font-medium">Dr. {appointment.doctor_name}</p>
                            <p className="text-sm text-gray-600">{appointment.treatment_name}</p>
                            <p className="text-sm text-gray-500">
                              {format(parseISO(appointment.appointment_slot_date), 'PPP')} at {appointment.appointment_slot_start_time}
                            </p>
                          </div>
                          <Badge className={getStatusColor(appointment.appointment_status)}>
                            {appointment.status_display}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Appointments Tab */}
            <TabsContent value="appointments">
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold">Appointments</h2>
                  <Dialog open={showAppointmentForm} onOpenChange={setShowAppointmentForm}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Book Appointment
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Book New Appointment</DialogTitle>
                        <DialogDescription>
                          Fill in the details to book a new appointment
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="doctor">Select Doctor</Label>
                          <Select value={appointmentForm.doctor} onValueChange={(value) => setAppointmentForm({ ...appointmentForm, doctor: value })}>
                            <SelectTrigger>
                              <SelectValue placeholder="Choose a doctor" />
                            </SelectTrigger>
                            <SelectContent>
                              {doctors.map((doctor) => (
                                <SelectItem key={doctor.id} value={doctor.id.toString()}>
                                  Dr. {doctor.first_name} {doctor.last_name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="grid gap-2">
                          <Label htmlFor="treatment">Treatment Type</Label>
                          <Select value={appointmentForm.treatment} onValueChange={(value) => setAppointmentForm({ ...appointmentForm, treatment: value })}>
                            <SelectTrigger>
                              <SelectValue placeholder="Choose treatment" />
                            </SelectTrigger>
                            <SelectContent>
                              {treatments.map((treatment) => (
                                <SelectItem key={treatment.id} value={treatment.id.toString()}>
                                  {treatment.name} - ${treatment.cost}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="grid gap-2">
                          <Label htmlFor="date">Appointment Date</Label>
                          <Input
                            type="date"
                            value={appointmentForm.date}
                            onChange={(e) => setAppointmentForm({ ...appointmentForm, date: e.target.value })}
                            min={format(new Date(), 'yyyy-MM-dd')}
                          />
                        </div>

                        {availableSlots.length > 0 && (
                          <div className="grid gap-2">
                            <Label htmlFor="slot">Available Time Slots</Label>
                            <Select value={appointmentForm.slot} onValueChange={(value) => setAppointmentForm({ ...appointmentForm, slot: value })}>
                              <SelectTrigger>
                                <SelectValue placeholder="Choose time slot" />
                              </SelectTrigger>
                              <SelectContent>
                                {availableSlots.map((slot) => (
                                  <SelectItem key={slot.id} value={slot.id.toString()}>
                                    {slot.start_time} - {slot.end_time}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        <div className="grid gap-2">
                          <Label htmlFor="symptoms">Symptoms/Reason for Visit</Label>
                          <Textarea
                            placeholder="Describe your symptoms or reason for visit"
                            value={appointmentForm.symptoms}
                            onChange={(e) => setAppointmentForm({ ...appointmentForm, symptoms: e.target.value })}
                          />
                        </div>

                        <Button
                          onClick={() => createAppointmentMutation.mutate(appointmentForm)}
                          disabled={!appointmentForm.doctor || !appointmentForm.treatment || !appointmentForm.date || !appointmentForm.slot || createAppointmentMutation.isPending}
                        >
                          {createAppointmentMutation.isPending ? 'Booking...' : 'Book Appointment'}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                {/* Calendar View */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Calendar</CardTitle>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setCurrentMonth(new Date())}
                      >
                        Today
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center mb-4">
                      <h3 className="text-lg font-semibold">
                        {format(currentMonth, 'MMMM yyyy')}
                      </h3>
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                        <div key={day} className="text-center text-sm font-medium text-gray-500 p-2">
                          {day}
                        </div>
                      ))}
                      {getDaysInMonth().map((day) => {
                        const appointmentsForDay = getAppointmentsForDate(day);
                        return (
                          <div
                            key={day.toString()}
                            className={cn(
                              "border rounded-lg p-2 min-h-[80px] cursor-pointer hover:bg-gray-50",
                              !isSameMonth(day, currentMonth) && "text-gray-400",
                              isToday(day) && "bg-blue-50 border-blue-500",
                              isSameDay(day, selectedDate || new Date()) && "bg-blue-100"
                            )}
                            onClick={() => setSelectedDate(day)}
                          >
                            <div className="text-sm">{format(day, 'd')}</div>
                            {appointmentsForDay.length > 0 && (
                              <div className="mt-1">
                                {appointmentsForDay.slice(0, 2).map((apt, idx) => (
                                  <div key={idx} className="text-xs truncate text-blue-600">
                                    {apt.appointment_slot_start_time}
                                  </div>
                                ))}
                                {appointmentsForDay.length > 2 && (
                                  <div className="text-xs text-gray-500">
                                    +{appointmentsForDay.length - 2} more
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Appointments List */}
                <Card>
                  <CardHeader>
                    <CardTitle>All Appointments</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {appointmentsLoading ? (
                      <p>Loading appointments...</p>
                    ) : appointments.length === 0 ? (
                      <p className="text-gray-500">No appointments found</p>
                    ) : (
                      <ScrollArea className="h-[400px]">
                        <div className="space-y-4">
                          {appointments.map((appointment) => (
                            <div key={appointment.id} className="border rounded-lg p-4">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="font-semibold">Dr. {appointment.doctor_name}</h4>
                                  <p className="text-sm text-gray-600">{appointment.treatment_name}</p>
                                  <p className="text-sm text-gray-500">
                                    {format(parseISO(appointment.appointment_slot_date), 'PPP')} at {appointment.appointment_slot_start_time}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge className={getStatusColor(appointment.appointment_status)}>
                                    {appointment.status_display}
                                  </Badge>
                                  {appointment.appointment_status === 'Pending' && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => deleteAppointmentMutation.mutate(appointment.id)}
                                    >
                                      Cancel
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Medical History Tab */}
            <TabsContent value="medical-history">
              <Card>
                <CardHeader>
                  <CardTitle>Medical History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {appointments
                      .filter(apt => apt.appointment_status === 'Completed')
                      .map((appointment) => (
                        <div key={appointment.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-semibold">
                              {appointment.treatment_name}
                            </h4>
                            <Badge className="bg-green-100 text-green-800">
                              Completed
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">
                            Dr. {appointment.doctor_name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {format(parseISO(appointment.appointment_slot_date), 'PPP')}
                          </p>
                          {appointment.medical_record && (
                            <div className="mt-2">
                              <Button variant="outline" size="sm">
                                <FileText className="h-4 w-4 mr-2" />
                                View Medical Record
                              </Button>
                            </div>
                          )}
                        </div>
                    ))}
                    {appointments.filter(apt => apt.appointment_status === 'Completed').length === 0 && (
                      <p className="text-gray-500">No medical history available</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Treatment History Tab */}
            <TabsContent value="treatments">
              <Card>
                <CardHeader>
                  <CardTitle>Treatment History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {appointments
                      .filter(apt => apt.appointment_status === 'Completed')
                      .map((appointment) => (
                        <div key={appointment.id} className="border rounded-lg p-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <h4 className="font-semibold mb-2">{appointment.treatment_name}</h4>
                              <div className="space-y-1 text-sm">
                                <p><span className="text-gray-600">Date:</span> {format(parseISO(appointment.appointment_slot_date), 'PPP')}</p>
                                <p><span className="text-gray-600">Doctor:</span> Dr. {appointment.doctor_name}</p>
                                <p><span className="text-gray-600">Time:</span> {appointment.appointment_slot_start_time} - {appointment.appointment_slot_end_time}</p>
                              </div>
                            </div>
                            <div>
                              {treatments.find(t => t.id === appointment.treatment) && (
                                <div className="bg-gray-50 p-3 rounded">
                                  <p className="text-sm font-medium mb-1">Treatment Details</p>
                                  <p className="text-sm text-gray-600">
                                    {treatments.find(t => t.id === appointment.treatment)?.description}
                                  </p>
                                  <p className="text-sm font-semibold mt-2">
                                    Cost: ${treatments.find(t => t.id === appointment.treatment)?.cost}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                    ))}
                    {appointments.filter(apt => apt.appointment_status === 'Completed').length === 0 && (
                      <p className="text-gray-500">No treatment history available</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;