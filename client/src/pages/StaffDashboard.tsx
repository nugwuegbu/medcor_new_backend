import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { 
  CalendarCheck,
  Clock,
  Users,
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
  Search,
  Phone,
  Mail,
  Activity,
  ChevronDown,
  UserPlus,
  Calendar,
  ClipboardList,
  UserCog,
  Grid,
  List,
  Edit,
  Trash,
  Eye,
  Stethoscope
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
import { queryClient } from '@/lib/queryClient';

interface Patient {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  date_joined: string;
}

interface Doctor {
  id: number;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
  address?: string;
  role: string;
  is_staff: boolean;
  is_active: boolean;
  is_verified: boolean;
  created_at?: string;
  medical_license?: string;
  specialization?: string;
  years_of_experience?: number;
  consultation_fee?: number;
  available_days?: string[];
  working_hours?: {
    start: string;
    end: string;
  };
}

interface Appointment {
  id: number;
  patient: Patient;
  doctor: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
  };
  appointment_date: string;
  appointment_time: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  reason: string;
  notes?: string;
}

interface AppointmentStats {
  total: number;
  scheduled: number;
  completed: number;
  cancelled: number;
  today_count: number;
}

interface Tenant {
  id: number;
  name: string;
  schema_name: string;
}

const StaffDashboard: React.FC = () => {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [appointmentDialogOpen, setAppointmentDialogOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [appointmentForm, setAppointmentForm] = useState({
    patient_id: '',
    doctor_id: '',
    appointment_date: '',
    appointment_time: '',
    reason: ''
  });
  
  // Doctor management states
  const [doctorViewMode, setDoctorViewMode] = useState<'grid' | 'list'>('grid');
  const [doctorDialogOpen, setDoctorDialogOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null);
  const [doctorForm, setDoctorForm] = useState({
    // Required fields
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    // Optional fields
    username: '',
    phone_number: '',
    address: '',
    date_of_birth: '',
    blood_type: '',
    allergies: '',
    emergency_contact: '',
    emergency_phone: '',
    // Doctor-specific fields
    medical_license: '',
    specialization: '',
    years_of_experience: '',
    consultation_fee: '',
    department: '',
    qualifications: '',
    languages_spoken: ''
  });

  // Get auth token
  const getAuthHeaders = (): Record<string, string> => {
    const token = localStorage.getItem('token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  };

  // Get current user and tenant information
  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) {
      try {
        const userData = JSON.parse(user);
        // Get tenant info from user data or make an API call
        // For now, we'll use a default tenant ID
        setCurrentTenant({
          id: userData.tenant_id || 1,
          name: userData.tenant_name || 'Current Hospital',
          schema_name: userData.tenant_schema || 'public'
        });
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }, []);

  // Fetch today's appointments
  const { data: todayAppointments, isLoading: todayLoading, refetch: refetchToday } = useQuery<Appointment[]>({
    queryKey: ['/api/appointments/appointments/today'],
    queryFn: async () => {
      return apiRequest('/api/appointments/appointments/today', {
        headers: getAuthHeaders()
      });
    }
  });

  // Fetch all appointments
  const { data: allAppointments, isLoading: appointmentsLoading, refetch: refetchAppointments } = useQuery<Appointment[]>({
    queryKey: ['/api/appointments/appointments'],
    queryFn: async () => {
      return apiRequest('/api/appointments/appointments', {
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

  // Fetch all users (patients)
  const { data: patients, isLoading: patientsLoading, refetch: refetchPatients } = useQuery<Patient[]>({
    queryKey: ['/api/auth/users/'],
    queryFn: async () => {
      return apiRequest('/api/auth/users/', {
        headers: getAuthHeaders()
      });
    }
  });

  // Fetch doctors
  const { data: doctors, isLoading: doctorsLoading, refetch: refetchDoctors } = useQuery<Doctor[]>({
    queryKey: ['/api/auth/doctors'],
    queryFn: async () => {
      return apiRequest('/api/auth/doctors/', {
        headers: getAuthHeaders()
      });
    }
  });

  // Fetch tenants (for doctor creation)
  const { data: tenants } = useQuery<Tenant[]>({
    queryKey: ['/api/auth/tenants/list'],
    queryFn: async () => {
      const response = await apiRequest('/api/auth/tenants/list/', {
        headers: getAuthHeaders()
      });
      return response.tenants || [];
    }
  });

  // Create appointment mutation
  const createAppointment = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('/api/appointments/appointments', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      toast({
        title: "Appointment Created",
        description: "The appointment has been scheduled successfully.",
      });
      setAppointmentDialogOpen(false);
      setAppointmentForm({
        patient_id: '',
        doctor_id: '',
        appointment_date: '',
        appointment_time: '',
        reason: ''
      });
      refetchAppointments();
      refetchToday();
      refetchStats();
    },
    onError: () => {
      toast({
        title: "Creation Failed",
        description: "Failed to create appointment.",
        variant: "destructive"
      });
    }
  });

  // Create doctor mutation
  const createDoctor = useMutation({
    mutationFn: async (data: any) => {
      // Add tenant_id based on current logged-in hospital
      const doctorData = {
        ...data,
        role: 'doctor',
        tenant_id: currentTenant?.id,
        is_staff: true,
        is_active: true,
        is_verified: true
      };
      
      return apiRequest('/api/auth/users/create/', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(doctorData)
      });
    },
    onSuccess: () => {
      toast({
        title: "Doctor Created",
        description: "The doctor has been added successfully.",
      });
      setDoctorDialogOpen(false);
      setDoctorForm({
        email: '',
        password: '',
        first_name: '',
        last_name: '',
        username: '',
        phone_number: '',
        address: '',
        date_of_birth: '',
        blood_type: '',
        allergies: '',
        emergency_contact: '',
        emergency_phone: '',
        medical_license: '',
        specialization: '',
        years_of_experience: '',
        consultation_fee: '',
        department: '',
        qualifications: '',
        languages_spoken: ''
      });
      refetchDoctors();
    },
    onError: (error: any) => {
      toast({
        title: "Creation Failed",
        description: error.message || "Failed to create doctor.",
        variant: "destructive"
      });
    }
  });

  // Navigation items
  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'appointments', label: 'Appointments', icon: CalendarCheck },
    { id: 'doctors', label: 'Doctors', icon: Stethoscope },
    { id: 'patients', label: 'Patients', icon: Users },
    { id: 'checkin', label: 'Check-In', icon: ClipboardList },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setLocation('/login');
  };

  const refreshData = () => {
    refetchToday();
    refetchAppointments();
    refetchStats();
    refetchPatients();
    refetchDoctors();
    toast({
      title: "Data Refreshed",
      description: "All data has been updated.",
    });
  };

  const handleCreateAppointment = () => {
    if (appointmentForm.patient_id && appointmentForm.doctor_id && 
        appointmentForm.appointment_date && appointmentForm.appointment_time) {
      createAppointment.mutate({
        patient: parseInt(appointmentForm.patient_id),
        doctor: parseInt(appointmentForm.doctor_id),
        appointment_date: appointmentForm.appointment_date,
        appointment_time: appointmentForm.appointment_time,
        reason: appointmentForm.reason || 'General Consultation',
        status: 'scheduled'
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
            <div className="text-2xl font-bold">{appointmentStats?.today_count || 0}</div>
            <p className="text-xs text-muted-foreground">
              {todayAppointments?.filter(a => a.status === 'scheduled').length || 0} pending
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{patients?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Registered patients</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{appointmentStats?.scheduled || 0}</div>
            <p className="text-xs text-muted-foreground">Upcoming appointments</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {todayAppointments?.filter(a => a.status === 'completed').length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Successfully completed</p>
          </CardContent>
        </Card>
      </div>

      {/* Today's Schedule */}
      <Card>
        <CardHeader>
          <CardTitle>Today's Schedule</CardTitle>
          <CardDescription>Appointments scheduled for today</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Doctor</TableHead>
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
                  <TableCell>
                    Dr. {appointment.doctor.first_name} {appointment.doctor.last_name}
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
                    <Button size="sm" variant="outline">
                      View
                    </Button>
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
          <h2 className="text-2xl font-bold">Appointment Management</h2>
          <p className="text-muted-foreground">Schedule and manage patient appointments</p>
        </div>
        <Button onClick={() => setAppointmentDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Appointment
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search appointments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select defaultValue="all">
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Appointments Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Doctor</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allAppointments?.map((appointment) => (
                <TableRow key={appointment.id}>
                  <TableCell>{format(new Date(appointment.appointment_date), 'MMM dd, yyyy')}</TableCell>
                  <TableCell>{appointment.appointment_time}</TableCell>
                  <TableCell>
                    {appointment.patient.first_name} {appointment.patient.last_name}
                  </TableCell>
                  <TableCell>
                    Dr. {appointment.doctor.first_name} {appointment.doctor.last_name}
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
                    <Button size="sm" variant="outline">
                      Manage
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );

  const renderPatients = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Patient Directory</h2>
          <p className="text-muted-foreground">Manage patient information</p>
        </div>
        <Button>
          <UserPlus className="h-4 w-4 mr-2" />
          Add Patient
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Search patients..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Patients Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Joined Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {patients?.filter(patient => 
                patient.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                patient.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                patient.email.toLowerCase().includes(searchTerm.toLowerCase())
              ).map((patient) => (
                <TableRow key={patient.id}>
                  <TableCell className="font-medium">
                    {patient.first_name} {patient.last_name}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      {patient.email}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      {patient.phone || 'N/A'}
                    </div>
                  </TableCell>
                  <TableCell>{format(new Date(patient.date_joined), 'MMM dd, yyyy')}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        View
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          setSelectedPatient(patient);
                          setAppointmentForm({ ...appointmentForm, patient_id: patient.id.toString() });
                          setAppointmentDialogOpen(true);
                        }}
                      >
                        Book
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );

  const renderDoctors = () => (
    <div className="space-y-6">
      {/* Header with view toggle */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Doctor Management</h2>
          <p className="text-muted-foreground">Manage healthcare providers</p>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center border rounded-lg">
            <Button 
              variant={doctorViewMode === 'grid' ? 'default' : 'ghost'} 
              size="sm"
              onClick={() => setDoctorViewMode('grid')}
              className="rounded-r-none"
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button 
              variant={doctorViewMode === 'list' ? 'default' : 'ghost'} 
              size="sm"
              onClick={() => setDoctorViewMode('list')}
              className="rounded-l-none"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          <Dialog open={doctorDialogOpen} onOpenChange={setDoctorDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Add Doctor
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Doctor</DialogTitle>
                <DialogDescription>
                  Add a new doctor to your medical team
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                {/* Basic Information Section */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-700">Basic Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <Label htmlFor="full_name">Full Name *</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          id="first_name"
                          value={doctorForm.first_name}
                          onChange={(e) => setDoctorForm({...doctorForm, first_name: e.target.value})}
                          placeholder="First Name"
                          required
                        />
                        <Input
                          id="last_name"
                          value={doctorForm.last_name}
                          onChange={(e) => setDoctorForm({...doctorForm, last_name: e.target.value})}
                          placeholder="Last Name"
                          required
                        />
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={doctorForm.email}
                        onChange={(e) => setDoctorForm({...doctorForm, email: e.target.value})}
                        placeholder="doctor@hospital.com"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone_number">Phone</Label>
                      <Input
                        id="phone_number"
                        type="tel"
                        value={doctorForm.phone_number}
                        onChange={(e) => setDoctorForm({...doctorForm, phone_number: e.target.value})}
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>
                  </div>
                </div>

                {/* Account Security Section */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-700">Account Security</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="password">Password *</Label>
                      <Input
                        id="password"
                        type="password"
                        value={doctorForm.password}
                        onChange={(e) => setDoctorForm({...doctorForm, password: e.target.value})}
                        placeholder="Minimum 8 characters"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">Must be at least 8 characters</p>
                    </div>
                    <div>
                      <Label htmlFor="username">Username (Optional)</Label>
                      <Input
                        id="username"
                        value={doctorForm.username}
                        onChange={(e) => setDoctorForm({...doctorForm, username: e.target.value})}
                        placeholder="dr.smith"
                      />
                    </div>
                  </div>
                </div>
                {/* Professional Information Section */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-700">Professional Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="specialization">Specialty *</Label>
                      <Select 
                        value={doctorForm.specialization}
                        onValueChange={(value) => setDoctorForm({...doctorForm, specialization: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select specialty" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="General Practice">General Practice</SelectItem>
                          <SelectItem value="Cardiology">Cardiology</SelectItem>
                          <SelectItem value="Neurology">Neurology</SelectItem>
                          <SelectItem value="Orthopedics">Orthopedics</SelectItem>
                          <SelectItem value="Pediatrics">Pediatrics</SelectItem>
                          <SelectItem value="Gynecology">Gynecology</SelectItem>
                          <SelectItem value="Dermatology">Dermatology</SelectItem>
                          <SelectItem value="Psychiatry">Psychiatry</SelectItem>
                          <SelectItem value="Radiology">Radiology</SelectItem>
                          <SelectItem value="Emergency Medicine">Emergency Medicine</SelectItem>
                          <SelectItem value="Internal Medicine">Internal Medicine</SelectItem>
                          <SelectItem value="Surgery">Surgery</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="years_of_experience">Years of Experience</Label>
                      <Input
                        id="years_of_experience"
                        type="number"
                        min="0"
                        value={doctorForm.years_of_experience}
                        onChange={(e) => setDoctorForm({...doctorForm, years_of_experience: e.target.value})}
                        placeholder="10"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="medical_license">Medical License Number</Label>
                      <Input
                        id="medical_license"
                        value={doctorForm.medical_license}
                        onChange={(e) => setDoctorForm({...doctorForm, medical_license: e.target.value})}
                        placeholder="MD123456"
                      />
                    </div>
                    <div>
                      <Label htmlFor="consultation_fee">Consultation Fee ($)</Label>
                      <Input
                        id="consultation_fee"
                        type="number"
                        min="0"
                        value={doctorForm.consultation_fee}
                        onChange={(e) => setDoctorForm({...doctorForm, consultation_fee: e.target.value})}
                        placeholder="150"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="department">Department</Label>
                      <Select 
                        value={doctorForm.department}
                        onValueChange={(value) => setDoctorForm({...doctorForm, department: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Emergency">Emergency</SelectItem>
                          <SelectItem value="Outpatient">Outpatient</SelectItem>
                          <SelectItem value="Inpatient">Inpatient</SelectItem>
                          <SelectItem value="Surgery">Surgery</SelectItem>
                          <SelectItem value="ICU">ICU</SelectItem>
                          <SelectItem value="Laboratory">Laboratory</SelectItem>
                          <SelectItem value="Radiology">Radiology</SelectItem>
                          <SelectItem value="Pharmacy">Pharmacy</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="qualifications">Qualifications</Label>
                      <Input
                        id="qualifications"
                        value={doctorForm.qualifications}
                        onChange={(e) => setDoctorForm({...doctorForm, qualifications: e.target.value})}
                        placeholder="MD, PhD, Board Certified"
                      />
                    </div>
                  </div>
                </div>
                {/* Additional Information Section */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-700">Additional Information</h3>
                  <div>
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={doctorForm.address}
                      onChange={(e) => setDoctorForm({...doctorForm, address: e.target.value})}
                      placeholder="123 Medical Street, City, State, ZIP"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="date_of_birth">Date of Birth</Label>
                      <Input
                        id="date_of_birth"
                        type="date"
                        value={doctorForm.date_of_birth}
                        onChange={(e) => setDoctorForm({...doctorForm, date_of_birth: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="languages_spoken">Languages Spoken</Label>
                      <Input
                        id="languages_spoken"
                        value={doctorForm.languages_spoken}
                        onChange={(e) => setDoctorForm({...doctorForm, languages_spoken: e.target.value})}
                        placeholder="English, Spanish"
                      />
                    </div>
                  </div>
                </div>
                {/* Emergency Contact Section */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-700">Emergency Contact</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="emergency_contact">Contact Name</Label>
                      <Input
                        id="emergency_contact"
                        value={doctorForm.emergency_contact}
                        onChange={(e) => setDoctorForm({...doctorForm, emergency_contact: e.target.value})}
                        placeholder="Jane Doe"
                      />
                    </div>
                    <div>
                      <Label htmlFor="emergency_phone">Contact Phone</Label>
                      <Input
                        id="emergency_phone"
                        type="tel"
                        value={doctorForm.emergency_phone}
                        onChange={(e) => setDoctorForm({...doctorForm, emergency_phone: e.target.value})}
                        placeholder="+1 (555) 987-6543"
                      />
                    </div>
                  </div>
                </div>
                {currentTenant && (
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-sm text-blue-700">
                      <strong>Hospital/Clinic:</strong> {currentTenant.name} (Auto-assigned)
                    </p>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDoctorDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={() => {
                    // Validate required fields
                    if (!doctorForm.email || !doctorForm.password || !doctorForm.first_name || !doctorForm.last_name || !doctorForm.specialization) {
                      toast({
                        title: "Missing Required Fields",
                        description: "Please fill in all required fields marked with *",
                        variant: "destructive"
                      });
                      return;
                    }
                    // Validate password length
                    if (doctorForm.password.length < 8) {
                      toast({
                        title: "Password Too Short",
                        description: "Password must be at least 8 characters long",
                        variant: "destructive"
                      });
                      return;
                    }
                    createDoctor.mutate(doctorForm);
                  }}
                  disabled={!doctorForm.email || !doctorForm.password || !doctorForm.first_name || !doctorForm.last_name || !doctorForm.specialization}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Doctor
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Search doctors..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Grid View */}
      {doctorViewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {doctors?.filter(doctor => 
            doctor.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            doctor.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            doctor.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            doctor.specialization?.toLowerCase().includes(searchTerm.toLowerCase())
          ).map((doctor) => (
            <Card key={doctor.id}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <UserCircle className="h-8 w-8 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-medium">Dr. {doctor.first_name} {doctor.last_name}</h3>
                    <p className="text-sm text-gray-500">{doctor.specialization || 'General Practitioner'}</p>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="truncate">{doctor.email}</span>
                  </div>
                  {doctor.phone_number && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span>{doctor.phone_number}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Badge variant={doctor.is_active ? "default" : "secondary"}>
                      {doctor.is_active ? "Active" : "Inactive"}
                    </Badge>
                    <Badge variant={doctor.is_verified ? "default" : "secondary"}>
                      {doctor.is_verified ? "Verified" : "Unverified"}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* List View */}
      {doctorViewMode === 'list' && (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Specialization</TableHead>
                  <TableHead>License</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {doctors?.filter(doctor => 
                  doctor.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  doctor.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  doctor.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  doctor.specialization?.toLowerCase().includes(searchTerm.toLowerCase())
                ).map((doctor) => (
                  <TableRow key={doctor.id}>
                    <TableCell className="font-medium">
                      Dr. {doctor.first_name} {doctor.last_name}
                    </TableCell>
                    <TableCell>{doctor.email}</TableCell>
                    <TableCell>{doctor.phone_number || 'N/A'}</TableCell>
                    <TableCell>{doctor.specialization || 'General'}</TableCell>
                    <TableCell>{doctor.medical_license || 'N/A'}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Badge variant={doctor.is_active ? "default" : "secondary"}>
                          {doctor.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {(!doctors || doctors.length === 0) && !doctorsLoading && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <UserCog className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium mb-2">No Doctors Found</h3>
            <p className="text-gray-500 text-center mb-4">
              Start by adding your first doctor to the system.
            </p>
            <Button onClick={() => setDoctorDialogOpen(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Add First Doctor
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderCheckIn = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Patient Check-In</h2>
          <p className="text-muted-foreground">Check in patients for their appointments</p>
        </div>
      </div>

      {/* Today's Appointments for Check-In */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Check-Ins</CardTitle>
          <CardDescription>Patients scheduled for today</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Doctor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {todayAppointments?.filter(a => a.status === 'scheduled').map((appointment) => (
                <TableRow key={appointment.id}>
                  <TableCell>{appointment.appointment_time}</TableCell>
                  <TableCell>
                    {appointment.patient.first_name} {appointment.patient.last_name}
                  </TableCell>
                  <TableCell>
                    Dr. {appointment.doctor.first_name} {appointment.doctor.last_name}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">Pending</Badge>
                  </TableCell>
                  <TableCell>
                    <Button size="sm">
                      Check In
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return renderDashboard();
      case 'appointments':
        return renderAppointments();
      case 'doctors':
        return renderDoctors();
      case 'patients':
        return renderPatients();
      case 'checkin':
        return renderCheckIn();
      case 'reports':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Reports</h2>
            <Card>
              <CardContent className="py-20 text-center">
                <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Reports section coming soon</p>
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
              <Activity className="h-8 w-8 text-purple-600" />
              {!sidebarCollapsed && (
                <span className="ml-2 text-xl font-bold">Staff Portal</span>
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
                      <p className="text-sm font-medium">{user.first_name} {user.last_name}</p>
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
          {(todayLoading || appointmentsLoading || statsLoading || patientsLoading) ? (
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

      {/* New Appointment Dialog */}
      <Dialog open={appointmentDialogOpen} onOpenChange={setAppointmentDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Schedule New Appointment</DialogTitle>
            <DialogDescription>
              Create a new appointment for a patient
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="patient">Patient</Label>
              <Select
                value={appointmentForm.patient_id}
                onValueChange={(value) => setAppointmentForm({ ...appointmentForm, patient_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a patient" />
                </SelectTrigger>
                <SelectContent>
                  {patients?.map((patient) => (
                    <SelectItem key={patient.id} value={patient.id.toString()}>
                      {patient.first_name} {patient.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="doctor">Doctor</Label>
              <Select
                value={appointmentForm.doctor_id}
                onValueChange={(value) => setAppointmentForm({ ...appointmentForm, doctor_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a doctor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Dr. Sarah Johnson</SelectItem>
                  <SelectItem value="2">Dr. Michael Chen</SelectItem>
                  <SelectItem value="3">Dr. Lisa Anderson</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={appointmentForm.appointment_date}
                onChange={(e) => setAppointmentForm({ ...appointmentForm, appointment_date: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="time">Time</Label>
              <Input
                id="time"
                type="time"
                value={appointmentForm.appointment_time}
                onChange={(e) => setAppointmentForm({ ...appointmentForm, appointment_time: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="reason">Reason</Label>
              <Input
                id="reason"
                value={appointmentForm.reason}
                onChange={(e) => setAppointmentForm({ ...appointmentForm, reason: e.target.value })}
                placeholder="e.g., General Consultation"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAppointmentDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateAppointment}
              disabled={!appointmentForm.patient_id || !appointmentForm.doctor_id || 
                       !appointmentForm.appointment_date || !appointmentForm.appointment_time}
            >
              Schedule Appointment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StaffDashboard;