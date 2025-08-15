import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { 
  Calendar, Users, Clock, Settings, LogOut, Menu, X, Home,
  Plus, Search, Filter, Edit, Trash2, Eye, ChevronLeft, ChevronRight,
  CheckCircle, AlertCircle, TrendingUp, Activity, Star, Phone, Mail,
  MapPin, CalendarCheck, UserPlus, Bell, Download, Upload, Save
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

// Demo Data
const demoAppointments = [
  {
    id: 1,
    patient: { 
      name: 'Sarah Johnson', 
      email: 'sarah.j@email.com', 
      phone: '+1 555-0123',
      image: null 
    },
    date: '2025-01-14',
    time: '09:00 AM',
    type: 'General Checkup',
    status: 'scheduled',
    duration: '30 min'
  },
  {
    id: 2,
    patient: { 
      name: 'Michael Chen', 
      email: 'mchen@email.com', 
      phone: '+1 555-0124',
      image: null 
    },
    date: '2025-01-14',
    time: '10:00 AM',
    type: 'Follow-up',
    status: 'in-progress',
    duration: '45 min'
  },
  {
    id: 3,
    patient: { 
      name: 'Emma Davis', 
      email: 'emma.d@email.com', 
      phone: '+1 555-0125',
      image: null 
    },
    date: '2025-01-14',
    time: '11:30 AM',
    type: 'Consultation',
    status: 'scheduled',
    duration: '60 min'
  },
  {
    id: 4,
    patient: { 
      name: 'James Wilson', 
      email: 'jwilson@email.com', 
      phone: '+1 555-0126',
      image: null 
    },
    date: '2025-01-14',
    time: '02:00 PM',
    type: 'Emergency',
    status: 'completed',
    duration: '30 min'
  },
  {
    id: 5,
    patient: { 
      name: 'Olivia Martinez', 
      email: 'olivia.m@email.com', 
      phone: '+1 555-0127',
      image: null 
    },
    date: '2025-01-15',
    time: '09:30 AM',
    type: 'Routine Checkup',
    status: 'scheduled',
    duration: '30 min'
  }
];

const demoPatients = [
  {
    id: 1,
    name: 'Sarah Johnson',
    email: 'sarah.j@email.com',
    phone: '+1 555-0123',
    age: 32,
    gender: 'Female',
    bloodType: 'O+',
    lastVisit: '2024-12-15',
    nextAppointment: '2025-01-14',
    conditions: ['Hypertension'],
    status: 'active'
  },
  {
    id: 2,
    name: 'Michael Chen',
    email: 'mchen@email.com',
    phone: '+1 555-0124',
    age: 45,
    gender: 'Male',
    bloodType: 'A+',
    lastVisit: '2024-11-20',
    nextAppointment: '2025-01-14',
    conditions: ['Diabetes Type 2', 'High Cholesterol'],
    status: 'active'
  },
  {
    id: 3,
    name: 'Emma Davis',
    email: 'emma.d@email.com',
    phone: '+1 555-0125',
    age: 28,
    gender: 'Female',
    bloodType: 'B+',
    lastVisit: '2024-10-10',
    nextAppointment: '2025-01-14',
    conditions: ['Asthma'],
    status: 'active'
  },
  {
    id: 4,
    name: 'James Wilson',
    email: 'jwilson@email.com',
    phone: '+1 555-0126',
    age: 55,
    gender: 'Male',
    bloodType: 'AB+',
    lastVisit: '2025-01-14',
    nextAppointment: null,
    conditions: ['Arthritis', 'Hypertension'],
    status: 'active'
  },
  {
    id: 5,
    name: 'Olivia Martinez',
    email: 'olivia.m@email.com',
    phone: '+1 555-0127',
    age: 38,
    gender: 'Female',
    bloodType: 'O-',
    lastVisit: '2024-09-05',
    nextAppointment: '2025-01-15',
    conditions: [],
    status: 'active'
  },
  {
    id: 6,
    name: 'William Brown',
    email: 'w.brown@email.com',
    phone: '+1 555-0128',
    age: 62,
    gender: 'Male',
    bloodType: 'A-',
    lastVisit: '2024-08-22',
    nextAppointment: null,
    conditions: ['Heart Disease', 'Diabetes Type 2'],
    status: 'inactive'
  }
];

const timeSlots = [
  '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '12:00 PM', '12:30 PM', '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM',
  '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM'
];

const DoctorDashboardEnhanced: React.FC = () => {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [activeView, setActiveView] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  
  // Dialog states
  const [showNewAppointmentDialog, setShowNewAppointmentDialog] = useState(false);
  const [showEditPatientDialog, setShowEditPatientDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  // Pagination states
  const [currentAppointmentPage, setCurrentAppointmentPage] = useState(1);
  const [currentPatientPage, setCurrentPatientPage] = useState(1);
  const appointmentsPerPage = 5;
  const patientsPerPage = 5;
  
  // Availability states
  type DaySettings = {
    enabled: boolean;
    start: string;
    end: string;
    breaks: never[];
  };
  
  type AvailabilitySettings = {
    [key: string]: DaySettings;
  };
  
  const [availabilitySettings, setAvailabilitySettings] = useState<AvailabilitySettings>({
    monday: { enabled: true, start: '09:00', end: '17:00', breaks: [] },
    tuesday: { enabled: true, start: '09:00', end: '17:00', breaks: [] },
    wednesday: { enabled: true, start: '09:00', end: '17:00', breaks: [] },
    thursday: { enabled: true, start: '09:00', end: '17:00', breaks: [] },
    friday: { enabled: true, start: '09:00', end: '17:00', breaks: [] },
    saturday: { enabled: false, start: '09:00', end: '13:00', breaks: [] },
    sunday: { enabled: false, start: '', end: '', breaks: [] }
  });
  
  // Profile settings state
  const [profileData, setProfileData] = useState({
    name: 'Dr. Emily Johnson',
    email: 'doctor@medcor.ai',
    phone: '+1 555-0100',
    specialization: 'General Practice',
    licenseNumber: 'MD-123456',
    experience: '15 years',
    bio: 'Experienced general practitioner with a focus on preventive care and patient wellness.',
    languages: ['English', 'Spanish'],
    consultationFee: '$150'
  });

  const doctorInfo = {
    name: 'Dr. Emily Johnson',
    specialization: 'General Practice',
    image: null
  };

  const navItems = [
    { id: 'overview', label: 'Overview', icon: Home },
    { id: 'appointments', label: 'Appointments', icon: Calendar },
    { id: 'patients', label: 'My Patients', icon: Users },
    { id: 'availability', label: 'Availability', icon: Clock },
    { id: 'profile', label: 'Profile Settings', icon: Settings }
  ];

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'scheduled': return 'bg-blue-100 text-blue-700';
      case 'in-progress': return 'bg-yellow-100 text-yellow-700';
      case 'completed': return 'bg-green-100 text-green-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const handleLogout = () => {
    toast({
      title: "Logged out",
      description: "You have been successfully logged out."
    });
    setLocation('/login');
  };

  const handleDeleteItem = () => {
    toast({
      title: "Item deleted",
      description: "The item has been successfully deleted."
    });
    setShowDeleteDialog(false);
    setSelectedItem(null);
  };

  // Overview Page Component
  const OverviewPage = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          Welcome back, {doctorInfo.name}!
        </h2>
        <p className="text-gray-500">Here's your practice overview for today</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-purple-500 hover:shadow-lg transition-all">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">Today's Appointments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold text-purple-600">8</div>
              <Calendar className="h-8 w-8 text-purple-400" />
            </div>
            <p className="text-xs text-gray-500 mt-2">3 completed, 5 pending</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-blue-500 hover:shadow-lg transition-all">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">Active Patients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold text-blue-600">245</div>
              <Users className="h-8 w-8 text-blue-400" />
            </div>
            <p className="text-xs text-gray-500 mt-2">+12 this month</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-green-500 hover:shadow-lg transition-all">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">Satisfaction Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold text-green-600">98%</div>
              <Star className="h-8 w-8 text-green-400" />
            </div>
            <Progress value={98} className="mt-2 bg-green-100" />
          </CardContent>
        </Card>

        <Card className="border-l-4 border-orange-500 hover:shadow-lg transition-all">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">Avg. Consultation Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold text-orange-600">28min</div>
              <Clock className="h-8 w-8 text-orange-400" />
            </div>
            <p className="text-xs text-gray-500 mt-2">-5 min from last week</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="cursor-pointer bg-gradient-to-br from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700 transition-all" onClick={() => setActiveView('appointments')}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-100">View All Appointments</p>
                <p className="text-2xl font-bold">{demoAppointments.length}</p>
              </div>
              <CalendarCheck className="h-8 w-8 text-purple-200" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer bg-gradient-to-br from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 transition-all" onClick={() => setActiveView('patients')}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-100">Manage Patients</p>
                <p className="text-2xl font-bold">{demoPatients.length}</p>
              </div>
              <UserPlus className="h-8 w-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer bg-gradient-to-br from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 transition-all" onClick={() => setActiveView('availability')}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-100">Set Availability</p>
                <p className="text-2xl font-bold">Active</p>
              </div>
              <Clock className="h-8 w-8 text-green-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Today's Schedule */}
      <Card className="border-t-4 border-purple-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-purple-500" />
            Today's Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {demoAppointments.slice(0, 4).map((apt) => (
              <div key={apt.id} className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-purple-50 to-blue-50 hover:from-purple-100 hover:to-blue-100 transition-all">
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-full ${apt.status === 'in-progress' ? 'bg-yellow-100' : 'bg-blue-100'}`}>
                    <Clock className={`h-4 w-4 ${apt.status === 'in-progress' ? 'text-yellow-600' : 'text-blue-600'}`} />
                  </div>
                  <div>
                    <p className="font-medium">{apt.patient.name}</p>
                    <p className="text-sm text-gray-500">{apt.time} - {apt.type}</p>
                  </div>
                </div>
                <Badge className={getStatusColor(apt.status)}>{apt.status}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Appointments Page Component
  const AppointmentsPage = () => {
    const filteredAppointments = demoAppointments.filter(apt =>
      apt.patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.type.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const paginatedAppointments = filteredAppointments.slice(
      (currentAppointmentPage - 1) * appointmentsPerPage,
      currentAppointmentPage * appointmentsPerPage
    );

    const totalPages = Math.ceil(filteredAppointments.length / appointmentsPerPage);

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Appointments</h2>
            <p className="text-gray-500">Manage your patient appointments</p>
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Search appointments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64"
            />
            <Button onClick={() => setShowNewAppointmentDialog(true)} className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600">
              <Plus className="h-4 w-4 mr-2" />
              New Appointment
            </Button>
          </div>
        </div>

        <Card className="border-t-4 border-purple-500">
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-gradient-to-r from-purple-50 to-blue-50">
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedAppointments.map((appointment) => (
                  <TableRow key={appointment.id} className="hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-gradient-to-r from-purple-400 to-blue-400 text-white">
                            {appointment.patient.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{appointment.patient.name}</p>
                          <p className="text-sm text-gray-500">{appointment.patient.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{appointment.date}</p>
                        <p className="text-sm text-gray-500">{appointment.time}</p>
                      </div>
                    </TableCell>
                    <TableCell>{appointment.type}</TableCell>
                    <TableCell>{appointment.duration}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(appointment.status)}>
                        {appointment.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-purple-600 hover:text-purple-700 hover:bg-purple-50">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={currentAppointmentPage === 1}
              onClick={() => setCurrentAppointmentPage(prev => prev - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <span className="text-sm text-gray-500 px-3">
              Page {currentAppointmentPage} of {totalPages}
            </span>
            <Button
              size="sm"
              variant="outline"
              disabled={currentAppointmentPage === totalPages}
              onClick={() => setCurrentAppointmentPage(prev => prev + 1)}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    );
  };

  // Patients Page Component
  const PatientsPage = () => {
    const filteredPatients = demoPatients.filter(patient =>
      patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const paginatedPatients = filteredPatients.slice(
      (currentPatientPage - 1) * patientsPerPage,
      currentPatientPage * patientsPerPage
    );

    const totalPages = Math.ceil(filteredPatients.length / patientsPerPage);

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">My Patients</h2>
            <p className="text-gray-500">Manage your patient records</p>
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Search patients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64"
            />
          </div>
        </div>

        <Card className="border-t-4 border-blue-500">
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-gradient-to-r from-blue-50 to-green-50">
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Blood Type</TableHead>
                  <TableHead>Conditions</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedPatients.map((patient) => (
                  <TableRow key={patient.id} className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-green-50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-gradient-to-r from-blue-400 to-green-400 text-white">
                            {patient.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{patient.name}</p>
                          <p className="text-xs text-gray-500">ID: #{patient.id.toString().padStart(5, '0')}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="text-sm flex items-center gap-1">
                          <Mail className="h-3 w-3 text-gray-400" />
                          {patient.email}
                        </p>
                        <p className="text-sm flex items-center gap-1">
                          <Phone className="h-3 w-3 text-gray-400" />
                          {patient.phone}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-red-100 text-red-700">{patient.bloodType}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {patient.conditions.length > 0 ? (
                          patient.conditions.map((condition, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {condition}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-sm text-gray-400">None</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                          onClick={() => {
                            setSelectedItem(patient);
                            setShowEditPatientDialog(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={currentPatientPage === 1}
              onClick={() => setCurrentPatientPage(prev => prev - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <span className="text-sm text-gray-500 px-3">
              Page {currentPatientPage} of {totalPages}
            </span>
            <Button
              size="sm"
              variant="outline"
              disabled={currentPatientPage === totalPages}
              onClick={() => setCurrentPatientPage(prev => prev + 1)}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    );
  };

  // Availability Page Component
  const AvailabilityPage = () => {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Availability Settings</h2>
            <p className="text-gray-500">Configure your working hours and availability</p>
          </div>
          <Button className="bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600">
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>

        <Card className="border-t-4 border-green-500">
          <CardHeader>
            <CardTitle>Weekly Schedule</CardTitle>
            <CardDescription>Set your working hours for each day of the week</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {days.map((day) => (
                <div key={day} className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-green-50 to-teal-50 hover:from-green-100 hover:to-teal-100 transition-all">
                  <div className="flex items-center gap-4 flex-1">
                    <Switch
                      checked={availabilitySettings[day].enabled}
                      onCheckedChange={(checked) => {
                        setAvailabilitySettings(prev => ({
                          ...prev,
                          [day]: { ...prev[day], enabled: checked }
                        }));
                      }}
                    />
                    <Label className="font-medium capitalize w-24">{day}</Label>
                  </div>
                  {availabilitySettings[day].enabled ? (
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Label className="text-sm">From:</Label>
                        <Input
                          type="time"
                          value={availabilitySettings[day].start}
                          onChange={(e) => {
                            setAvailabilitySettings(prev => ({
                              ...prev,
                              [day]: { ...prev[day], start: e.target.value }
                            }));
                          }}
                          className="w-32"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Label className="text-sm">To:</Label>
                        <Input
                          type="time"
                          value={availabilitySettings[day].end}
                          onChange={(e) => {
                            setAvailabilitySettings(prev => ({
                              ...prev,
                              [day]: { ...prev[day], end: e.target.value }
                            }));
                          }}
                          className="w-32"
                        />
                      </div>
                      <Button size="sm" variant="outline" className="text-orange-600 hover:bg-orange-50">
                        <Plus className="h-4 w-4 mr-1" />
                        Add Break
                      </Button>
                    </div>
                  ) : (
                    <div className="text-gray-400">Day Off</div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-orange-500">
          <CardHeader>
            <CardTitle>Blocked Time Slots</CardTitle>
            <CardDescription>Block specific dates and times when you're unavailable</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input type="date" placeholder="Select date" className="flex-1" />
                <Select>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Start time" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeSlots.map(slot => (
                      <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="End time" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeSlots.map(slot => (
                      <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600">
                  <Plus className="h-4 w-4 mr-2" />
                  Block Time
                </Button>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 rounded-lg bg-orange-50">
                  <div>
                    <p className="font-medium">January 20, 2025</p>
                    <p className="text-sm text-gray-500">2:00 PM - 5:00 PM</p>
                  </div>
                  <Button size="sm" variant="ghost" className="text-red-600 hover:bg-red-50">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-orange-50">
                  <div>
                    <p className="font-medium">January 25, 2025</p>
                    <p className="text-sm text-gray-500">All Day</p>
                  </div>
                  <Button size="sm" variant="ghost" className="text-red-600 hover:bg-red-50">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // Profile Settings Page Component
  const ProfileSettingsPage = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Profile Settings</h2>
        <p className="text-gray-500">Manage your professional profile and preferences</p>
      </div>

      <Tabs defaultValue="personal" className="space-y-4">
        <TabsList className="bg-gradient-to-r from-purple-100 to-blue-100">
          <TabsTrigger value="personal">Personal Info</TabsTrigger>
          <TabsTrigger value="professional">Professional</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="personal">
          <Card className="border-t-4 border-purple-500">
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarFallback className="bg-gradient-to-r from-purple-400 to-blue-400 text-white text-xl">
                    EJ
                  </AvatarFallback>
                </Avatar>
                <Button variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  Change Photo
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Full Name</Label>
                  <Input value={profileData.name} onChange={(e) => setProfileData({...profileData, name: e.target.value})} />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input value={profileData.email} onChange={(e) => setProfileData({...profileData, email: e.target.value})} />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input value={profileData.phone} onChange={(e) => setProfileData({...profileData, phone: e.target.value})} />
                </div>
                <div>
                  <Label>Languages</Label>
                  <Input value={profileData.languages.join(', ')} placeholder="English, Spanish" />
                </div>
              </div>
              
              <div>
                <Label>Bio</Label>
                <Textarea 
                  value={profileData.bio} 
                  onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                  className="min-h-[100px]"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="professional">
          <Card className="border-t-4 border-blue-500">
            <CardHeader>
              <CardTitle>Professional Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Specialization</Label>
                  <Input value={profileData.specialization} onChange={(e) => setProfileData({...profileData, specialization: e.target.value})} />
                </div>
                <div>
                  <Label>License Number</Label>
                  <Input value={profileData.licenseNumber} onChange={(e) => setProfileData({...profileData, licenseNumber: e.target.value})} />
                </div>
                <div>
                  <Label>Years of Experience</Label>
                  <Input value={profileData.experience} onChange={(e) => setProfileData({...profileData, experience: e.target.value})} />
                </div>
                <div>
                  <Label>Consultation Fee</Label>
                  <Input value={profileData.consultationFee} onChange={(e) => setProfileData({...profileData, consultationFee: e.target.value})} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card className="border-t-4 border-red-500">
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label>Current Password</Label>
                  <Input type="password" placeholder="Enter current password" />
                </div>
                <div>
                  <Label>New Password</Label>
                  <Input type="password" placeholder="Enter new password" />
                </div>
                <div>
                  <Label>Confirm New Password</Label>
                  <Input type="password" placeholder="Confirm new password" />
                </div>
                <Button className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600">
                  Update Password
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card className="border-t-4 border-green-500">
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Email Notifications</p>
                    <p className="text-sm text-gray-500">Receive appointment reminders via email</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">SMS Notifications</p>
                    <p className="text-sm text-gray-500">Get urgent updates via SMS</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Push Notifications</p>
                    <p className="text-sm text-gray-500">Browser push notifications</p>
                  </div>
                  <Switch />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-30 shadow-sm">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              MedCor Doctor Portal
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full" />
            </Button>
            <Avatar>
              <AvatarFallback className="bg-gradient-to-r from-purple-400 to-blue-400 text-white">
                EJ
              </AvatarFallback>
            </Avatar>
            <div className="hidden md:block">
              <p className="text-sm font-medium">{doctorInfo.name}</p>
              <p className="text-xs text-gray-500">{doctorInfo.specialization}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <aside className={`fixed top-16 left-0 z-10 w-64 h-[calc(100vh-4rem)] bg-white border-r shadow-lg transform transition-transform lg:translate-x-0 flex flex-col ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <nav className="flex-1 p-4 space-y-2 overflow-hidden">
            {navItems.map((item) => (
              <Button
                key={item.id}
                variant={activeView === item.id ? 'default' : 'ghost'}
                className={`w-full justify-start ${
                  activeView === item.id 
                    ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:from-purple-600 hover:to-blue-600' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                onClick={() => {
                  setActiveView(item.id);
                  setSidebarOpen(false);
                }}
              >
                <item.icon className="h-4 w-4 mr-3" />
                {item.label}
              </Button>
            ))}
          </nav>
          
          <div className="p-4 border-t">
            <Button
              variant="ghost"
              className="w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-3" />
              Logout
            </Button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 lg:ml-64 p-6 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            {activeView === 'overview' && <OverviewPage />}
            {activeView === 'appointments' && <AppointmentsPage />}
            {activeView === 'patients' && <PatientsPage />}
            {activeView === 'availability' && <AvailabilityPage />}
            {activeView === 'profile' && <ProfileSettingsPage />}
          </div>
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-5 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* New Appointment Dialog */}
      <Dialog open={showNewAppointmentDialog} onOpenChange={setShowNewAppointmentDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Schedule New Appointment</DialogTitle>
            <DialogDescription>
              Create a new appointment for your patient
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Patient</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select patient" />
                </SelectTrigger>
                <SelectContent>
                  {demoPatients.map(patient => (
                    <SelectItem key={patient.id} value={patient.id.toString()}>
                      {patient.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Date</Label>
              <Input type="date" />
            </div>
            <div>
              <Label>Time</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select time slot" />
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.map(slot => (
                    <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Appointment Type</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="checkup">General Checkup</SelectItem>
                  <SelectItem value="followup">Follow-up</SelectItem>
                  <SelectItem value="consultation">Consultation</SelectItem>
                  <SelectItem value="emergency">Emergency</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea placeholder="Additional notes..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewAppointmentDialog(false)}>
              Cancel
            </Button>
            <Button 
              className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
              onClick={() => {
                toast({
                  title: "Appointment Scheduled",
                  description: "The appointment has been successfully scheduled."
                });
                setShowNewAppointmentDialog(false);
              }}
            >
              Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Patient Dialog */}
      <Dialog open={showEditPatientDialog} onOpenChange={setShowEditPatientDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Patient Information</DialogTitle>
            <DialogDescription>
              Update patient details and medical information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Full Name</Label>
              <Input defaultValue={selectedItem?.name} />
            </div>
            <div>
              <Label>Email</Label>
              <Input defaultValue={selectedItem?.email} />
            </div>
            <div>
              <Label>Phone</Label>
              <Input defaultValue={selectedItem?.phone} />
            </div>
            <div>
              <Label>Blood Type</Label>
              <Select defaultValue={selectedItem?.bloodType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="O+">O+</SelectItem>
                  <SelectItem value="O-">O-</SelectItem>
                  <SelectItem value="A+">A+</SelectItem>
                  <SelectItem value="A-">A-</SelectItem>
                  <SelectItem value="B+">B+</SelectItem>
                  <SelectItem value="B-">B-</SelectItem>
                  <SelectItem value="AB+">AB+</SelectItem>
                  <SelectItem value="AB-">AB-</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Medical Conditions</Label>
              <Textarea defaultValue={selectedItem?.conditions?.join(', ')} placeholder="Enter conditions separated by commas" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditPatientDialog(false)}>
              Cancel
            </Button>
            <Button 
              className="bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600"
              onClick={() => {
                toast({
                  title: "Patient Updated",
                  description: "Patient information has been successfully updated."
                });
                setShowEditPatientDialog(false);
              }}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the selected item.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteItem} className="bg-red-500 hover:bg-red-600">
              Yes, delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default DoctorDashboardEnhanced;