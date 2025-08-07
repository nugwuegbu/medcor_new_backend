import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
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
  Users, 
  UserCheck, 
  Calendar, 
  FileText, 
  Building, 
  TrendingUp,
  LogOut,
  Search,
  Filter,
  Download,
  MoreVertical,
  Edit3,
  Trash2,
  Eye,
  Home,
  ChevronLeft,
  Menu,
  X,
  Settings,
  BarChart3,
  Stethoscope,
  Activity,
  Package,
  DollarSign,
  CreditCard,
  Receipt,
  Scan,
  Heart
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

interface AdminStats {
  totalPatients: number;
  totalDoctors: number;
  totalAppointments: number;
  pendingAppointments: number;
  todayAppointments: number;
  monthlyGrowth: number;
}

// Form validation schemas
const userFormSchema = z.object({
  email: z.string().email('Invalid email address'),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  role: z.enum(['admin', 'doctor', 'patient', 'clinic']),
  password: z.string().optional(), // Removed minimum length validation
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
});

const patientFormSchema = z.object({
  email: z.string().email('Invalid email address'),
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  phone: z.string().optional(), // Made optional
  date_of_birth: z.string().optional(), // Made optional
  address: z.string().optional(),
  blood_group: z.string().optional(), // Added as optional
  medical_history: z.string().optional(),
  username: z.string().min(3, 'Username must be at least 3 characters'),
});

const doctorFormSchema = z.object({
  email: z.string().email('Invalid email address'),
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().optional(), // Made optional
  specialization: z.string().optional(),
  phone: z.string().optional(),
  license_number: z.string().optional(),
  experience_years: z.union([z.string(), z.number()]).optional(), // Accept both string and number
  username: z.string().optional(), // Added as optional
  password: z.string().optional(), // Added as optional
});

const appointmentFormSchema = z.object({
  patient_id: z.union([z.string(), z.number()]).transform((val) => {
    return typeof val === 'string' ? parseInt(val, 10) : val;
  }),
  doctor_id: z.union([z.string(), z.number()]).transform((val) => {
    return typeof val === 'string' ? parseInt(val, 10) : val;
  }),
  appointment_date: z.string().min(1, 'Date is required'),
  appointment_time: z.string().min(1, 'Time is required'),
  reason: z.string().optional(),
  appointment_type: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(['Pending', 'Approved', 'Completed', 'Cancelled']),
});

const sidebarItems = [
  { id: 'overview', label: 'Overview', icon: Home },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'patients', label: 'Patients', icon: UserCheck },
  { id: 'doctors', label: 'Doctors', icon: Stethoscope },
  { id: 'appointments', label: 'Appointments', icon: Calendar },
  { id: 'medical-records', label: 'Medical Records', icon: FileText },
  { id: 'subscriptions', label: 'Subscriptions', icon: DollarSign },
  { id: 'analysis-tracking', label: 'Analysis Tracking', icon: Activity },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedView, setSelectedView] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userPage, setUserPage] = useState(1);
  const [appointmentPage, setAppointmentPage] = useState(1);
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showFilterDialog, setShowFilterDialog] = useState(false);
  const itemsPerPage = 10;

  // Modal states
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [showViewUserModal, setShowViewUserModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<{type: string, id: number, name: string} | null>(null);
  
  // Form states for different entities
  const [showAddPatientModal, setShowAddPatientModal] = useState(false);
  const [showEditPatientModal, setShowEditPatientModal] = useState(false);
  const [showViewPatientModal, setShowViewPatientModal] = useState(false);
  
  const [showAddDoctorModal, setShowAddDoctorModal] = useState(false);
  const [showEditDoctorModal, setShowEditDoctorModal] = useState(false);
  const [showViewDoctorModal, setShowViewDoctorModal] = useState(false);
  
  const [showAddAppointmentModal, setShowAddAppointmentModal] = useState(false);
  const [showEditAppointmentModal, setShowEditAppointmentModal] = useState(false);
  const [showViewAppointmentModal, setShowViewAppointmentModal] = useState(false);
  
  // Role mapping to handle backend/frontend mismatch
  const mapBackendRole = (role: string): string => {
    const roleMap: Record<string, string> = {
      'user': 'patient',
      'staff': 'doctor',
      'admin': 'admin',
      'clinic': 'clinic',
      'patient': 'patient',
      'doctor': 'doctor'
    };
    return roleMap[role?.toLowerCase()] || role;
  };

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

  // Fetch users - using Django's user endpoint
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['/api/auth/users/'],
    queryFn: () => apiRequest('/api/auth/users/', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
      }
    }),
  });
  
  // Fetch doctors list - using dedicated doctors endpoint
  const { data: doctorsList, isLoading: doctorsLoading } = useQuery({
    queryKey: ['/api/auth/admin/doctors/'],
    queryFn: () => apiRequest('/api/auth/admin/doctors/', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
      }
    }),
  });
  
  // Fetch patients list - using dedicated patients endpoint
  const { data: patientsList, isLoading: patientsLoading } = useQuery({
    queryKey: ['/api/auth/admin/patients/'],
    queryFn: () => apiRequest('/api/auth/admin/patients/', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
      }
    }),
  });

  // Fetch appointments - using Django's appointments endpoint  
  const { data: appointmentsData, isLoading: appointmentsLoading } = useQuery({
    queryKey: ['/appointments/'],
    queryFn: async () => {
      try {
        const response = await apiRequest('/appointments/', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
          }
        });
        // Handle both array and paginated response structures
        return Array.isArray(response) ? response : (response?.results || []);
      } catch (error: any) {
        // Handle 404 gracefully - endpoint might not exist yet
        if (error.message && error.message.includes('404')) {
          console.log('Appointments endpoint not available');
          return [];
        }
        throw error;
      }
    },
    retry: false,
  });
  
  // Ensure appointments is always an array
  const appointments = Array.isArray(appointmentsData) ? appointmentsData : [];

  // Calculate statistics from the fetched data
  const stats: AdminStats = {
    totalPatients: patientsList?.length || 0,
    totalDoctors: doctorsList?.length || 0,
    totalAppointments: appointments?.length || 0,
    pendingAppointments: appointments?.filter((a: any) => 
      a.appointment_status === 'Pending' || a.status === 'Pending'
    ).length || 0,
    todayAppointments: appointments?.filter((a: any) => {
      const today = new Date().toISOString().split('T')[0];
      return a.appointment_slot_date === today || a.appointment_date === today;
    }).length || 0,
    monthlyGrowth: 12.5 // Placeholder for now
  };

  // Use dedicated lists for doctors and patients
  const doctors = doctorsList || [];
  const patients = patientsList || [];
  const statsLoading = usersLoading || appointmentsLoading || doctorsLoading || patientsLoading;

  const handleLogout = async () => {
    // Clear tokens first to prevent any queries from running
    const token = localStorage.getItem('adminToken');
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    localStorage.removeItem('medcor_admin_token');
    localStorage.removeItem('medcor_token');
    
    // Clear query cache to prevent stale data
    queryClient.clear();
    
    try {
      // Call logout endpoint with the token we had
      if (token) {
        await apiRequest('/api/auth/logout/', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      toast({
        title: 'Logged Out',
        description: 'You have been successfully logged out',
      });
      setLocation('/admin/login');
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not scheduled';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Not scheduled';
      
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Not scheduled';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'doctor': return 'bg-blue-100 text-blue-800';
      case 'clinic': return 'bg-green-100 text-green-800';
      case 'patient': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    const statusLower = status?.toLowerCase();
    switch (statusLower) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'approved': return 'bg-blue-100 text-blue-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Export functions
  const exportToCSV = (data: any[], filename: string) => {
    if (!data || data.length === 0) {
      toast({
        title: 'No Data',
        description: 'No data available to export',
        variant: 'destructive',
      });
      return;
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          return typeof value === 'string' && value.includes(',') 
            ? `"${value}"` 
            : value || '';
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    toast({
      title: 'Export Successful',
      description: `Data exported to ${filename}.csv`,
    });
  };

  // Delete mutation with proper cache invalidation
  const deleteMutation = useMutation({
    mutationFn: async ({ type, id }: { type: string; id: number }) => {
      // Use correct endpoints for each type
      const endpoint = type === 'user' ? `/api/auth/users/${id}/` :
                       type === 'patient' ? `/api/auth/users/${id}/` : // Patients are users
                       type === 'doctor' ? `/api/auth/admin/doctors/${id}/` :
                       type === 'appointment' ? `/appointments/${id}/` :
                       `/appointments/${id}/`;
      
      const response = await apiRequest(endpoint, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      
      return { type, id, response };
    },
    onSuccess: (data) => {
      toast({
        title: 'Success',
        description: 'Item deleted successfully',
      });
      
      // Specific cache invalidation based on type
      if (data.type === 'user') {
        queryClient.invalidateQueries({ queryKey: ['/api/auth/users/'] });
      } else if (data.type === 'patient') {
        queryClient.invalidateQueries({ queryKey: ['/api/auth/admin/patients/'] });
      } else if (data.type === 'doctor') {
        queryClient.invalidateQueries({ queryKey: ['/api/auth/admin/doctors/'] });
      } else if (data.type === 'appointment') {
        queryClient.invalidateQueries({ queryKey: ['/appointments/'] });
      }
      
      // Force refetch all data
      queryClient.refetchQueries();
      
      setShowDeleteDialog(false);
      setDeleteTarget(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete item',
        variant: 'destructive',
      });
      setShowDeleteDialog(false);
    },
  });

  const downloadReceipt = (subscription: any) => {
    import('jspdf').then(({ default: jsPDF }) => {
      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(20);
      doc.text('MedCor Healthcare', 105, 20, { align: 'center' });
      doc.setFontSize(16);
      doc.text('Payment Receipt', 105, 30, { align: 'center' });
      
      // Receipt details
      doc.setFontSize(12);
      doc.text(`Receipt ID: #RCP${Math.random().toString(36).substr(2, 9).toUpperCase()}`, 20, 50);
      doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 60);
      
      // Subscriber information
      doc.setFontSize(14);
      doc.text('Subscriber Information', 20, 80);
      doc.setFontSize(12);
      doc.text(`Name: ${subscription.name}`, 20, 90);
      doc.text(`Plan: ${subscription.plan}`, 20, 100);
      doc.text(`Payment Method: ${subscription.paymentMethod}`, 20, 110);
      
      // Payment details
      doc.setFontSize(14);
      doc.text('Payment Details', 20, 130);
      doc.setFontSize(12);
      doc.text(`Amount: ${subscription.amount}`, 20, 140);
      doc.text(`Billing Period: Monthly`, 20, 150);
      doc.text(`Next Billing Date: ${subscription.nextBilling}`, 20, 160);
      doc.text(`Status: ${subscription.status}`, 20, 170);
      
      // Footer
      doc.setFontSize(10);
      doc.text('Thank you for choosing MedCor Healthcare', 105, 200, { align: 'center' });
      doc.text('For questions, contact support@medcor.ai', 105, 210, { align: 'center' });
      
      // Save the PDF
      doc.save(`receipt-${subscription.name}-${new Date().getTime()}.pdf`);
      
      toast({
        title: 'Receipt Downloaded',
        description: 'The receipt has been downloaded successfully.',
      });
    });
  };

  // Filter data based on search and filter options
  const filteredUsers = users?.filter((user: any) => {
    const matchesSearch = user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          user.username?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    return matchesSearch && matchesRole;
  }) || [];

  const filteredAppointments = appointments?.filter((apt: any) => {
    const matchesSearch = apt.patient_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         apt.doctor_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || apt.status === filterStatus;
    return matchesSearch && matchesStatus;
  }) || [];

  // Pagination logic
  const paginatedUsers = filteredUsers.slice(
    (userPage - 1) * itemsPerPage,
    userPage * itemsPerPage
  );
  const totalUserPages = Math.ceil(filteredUsers.length / itemsPerPage);

  const paginatedAppointments = filteredAppointments.slice(
    (appointmentPage - 1) * itemsPerPage,
    appointmentPage * itemsPerPage
  );
  const totalAppointmentPages = Math.ceil(filteredAppointments.length / itemsPerPage);

  // Delete user handler
  const handleDeleteUser = async (userId: number) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    
    try {
      await apiRequest(`/api/auth/users/${userId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/auth/users/'] });
      toast({
        title: 'User Deleted',
        description: 'User has been successfully deleted',
      });
    } catch (error: any) {
      toast({
        title: 'Delete Failed',
        description: error.message || 'Failed to delete user',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-white border-r border-gray-200 transition-transform duration-300 lg:static lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Sidebar Header */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Building className="h-5 w-5 text-white" />
            </div>
            <span className="font-semibold text-gray-900">MedCor Admin</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Enhanced Sidebar Navigation with Icons */}
        <nav className="flex-1 px-3 py-4">
          <div className="space-y-2">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = selectedView === item.id;
              return (
                <Button
                  key={item.id}
                  variant={isActive ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start transition-all duration-200",
                    isActive 
                      ? "bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 hover:from-blue-100 hover:to-blue-200 border-l-4 border-blue-600" 
                      : "hover:bg-gray-100 text-gray-700"
                  )}
                  onClick={() => {
                    setSelectedView(item.id);
                    setMobileMenuOpen(false);
                  }}
                >
                  <Icon className={cn(
                    "mr-3 h-4 w-4",
                    isActive ? "text-blue-600" : "text-gray-500"
                  )} />
                  <span className="font-medium">{item.label}</span>
                  {isActive && (
                    <div className="ml-auto w-1.5 h-1.5 bg-blue-600 rounded-full animate-pulse" />
                  )}
                </Button>
              );
            })}
          </div>
        </nav>

        {/* Sidebar Footer */}
        <div className="border-t border-gray-200 p-4">
          <Button
            variant="outline"
            className="w-full justify-start text-red-600 border-red-200 hover:bg-red-50"
            onClick={handleLogout}
          >
            <LogOut className="mr-3 h-4 w-4" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Enhanced Top Header with Gradient Background */}
        <header className="h-16 bg-gradient-to-r from-white via-gray-50 to-white border-b border-gray-200 px-6 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden hover:bg-gray-100"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                {sidebarItems.find(item => item.id === selectedView)?.label || 'Dashboard'}
              </h1>
              <p className="text-xs text-gray-500">Hospital Administration Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="search"
                placeholder="Search patients, doctors..."
                className="pl-10 w-64 bg-gray-50 border-gray-300 focus:bg-white transition-colors"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setLocation('/')}
              className="hidden sm:flex bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200 hover:from-blue-100 hover:to-blue-200"
            >
              <Eye className="h-4 w-4 mr-2 text-blue-600" />
              <span className="text-blue-700">View Site</span>
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {/* Overview View */}
          {selectedView === 'overview' && (
            <div className="space-y-6">
              {/* Stats Cards with Gradient Backgrounds */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="border-0 shadow-lg overflow-hidden">
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-white">
                    <div className="flex items-center justify-between mb-4">
                      <Users className="h-8 w-8 opacity-80" />
                      <span className="text-xs font-medium bg-white/20 px-2 py-1 rounded-full">
                        +{stats.monthlyGrowth}%
                      </span>
                    </div>
                    <div className="text-3xl font-bold mb-1">{stats.totalPatients}</div>
                    <p className="text-sm opacity-90">Total Patients</p>
                    <p className="text-xs opacity-75 mt-2">Active this month</p>
                  </div>
                </Card>
                
                <Card className="border-0 shadow-lg overflow-hidden">
                  <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 text-white">
                    <div className="flex items-center justify-between mb-4">
                      <Stethoscope className="h-8 w-8 opacity-80" />
                      <span className="text-xs font-medium bg-white/20 px-2 py-1 rounded-full">
                        Online
                      </span>
                    </div>
                    <div className="text-3xl font-bold mb-1">{stats.totalDoctors}</div>
                    <p className="text-sm opacity-90">Active Doctors</p>
                    <p className="text-xs opacity-75 mt-2">Available for consultation</p>
                  </div>
                </Card>
                
                <Card className="border-0 shadow-lg overflow-hidden">
                  <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 text-white">
                    <div className="flex items-center justify-between mb-4">
                      <Calendar className="h-8 w-8 opacity-80" />
                      <span className="text-xs font-medium bg-white/20 px-2 py-1 rounded-full">
                        Today: {stats.todayAppointments}
                      </span>
                    </div>
                    <div className="text-3xl font-bold mb-1">{stats.totalAppointments}</div>
                    <p className="text-sm opacity-90">Total Appointments</p>
                    <p className="text-xs opacity-75 mt-2">This month</p>
                  </div>
                </Card>
                
                <Card className="border-0 shadow-lg overflow-hidden">
                  <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-6 text-white">
                    <div className="flex items-center justify-between mb-4">
                      <Activity className="h-8 w-8 opacity-80" />
                      <span className="text-xs font-medium bg-white/20 px-2 py-1 rounded-full">
                        Urgent
                      </span>
                    </div>
                    <div className="text-3xl font-bold mb-1">{stats.pendingAppointments}</div>
                    <p className="text-sm opacity-90">Pending Review</p>
                    <p className="text-xs opacity-75 mt-2">Require attention</p>
                  </div>
                </Card>
              </div>

              {/* Two Column Layout for Additional Info */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Appointments with Enhanced Design */}
                <Card className="shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-t-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">Recent Appointments</CardTitle>
                        <CardDescription>Latest scheduled appointments</CardDescription>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => setSelectedView('appointments')}>
                        View All →
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="pl-6">Patient</TableHead>
                          <TableHead>Doctor</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {appointments?.slice(0, 5).map((apt: any) => (
                          <TableRow key={apt.id} className="hover:bg-gray-50 transition-colors">
                            <TableCell className="font-medium pl-6">{apt.patient_name || 'N/A'}</TableCell>
                            <TableCell>{apt.doctor_name || 'N/A'}</TableCell>
                            <TableCell className="text-sm">{formatDate(apt.appointment_slot_date || apt.appointment_date)}</TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(apt.appointment_status || apt.status || 'Pending')}>
                                {apt.appointment_status || apt.status || 'Pending'}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card className="shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-t-lg">
                    <CardTitle className="text-lg">Quick Actions</CardTitle>
                    <CardDescription>Common administrative tasks</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-2 gap-4">
                      <Button className="flex flex-col items-center justify-center h-24 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white">
                        <Users className="h-6 w-6 mb-2" />
                        <span className="text-sm">Add Patient</span>
                      </Button>
                      <Button className="flex flex-col items-center justify-center h-24 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white">
                        <Stethoscope className="h-6 w-6 mb-2" />
                        <span className="text-sm">Add Doctor</span>
                      </Button>
                      <Button className="flex flex-col items-center justify-center h-24 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white">
                        <Calendar className="h-6 w-6 mb-2" />
                        <span className="text-sm">Schedule</span>
                      </Button>
                      <Button className="flex flex-col items-center justify-center h-24 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white">
                        <FileText className="h-6 w-6 mb-2" />
                        <span className="text-sm">Reports</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* System Health & Activity Overview */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Activity Feed */}
                <Card className="shadow-lg lg:col-span-2">
                  <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-t-lg">
                    <CardTitle className="text-lg">Activity Feed</CardTitle>
                    <CardDescription>Recent system activities</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">New patient registered</p>
                          <p className="text-xs text-gray-500">John Doe - 5 minutes ago</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">Appointment confirmed</p>
                          <p className="text-xs text-gray-500">Dr. Smith with Patient #1234 - 15 minutes ago</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">Appointment rescheduled</p>
                          <p className="text-xs text-gray-500">ID #5678 moved to tomorrow - 30 minutes ago</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">New doctor onboarded</p>
                          <p className="text-xs text-gray-500">Dr. Johnson joined - 1 hour ago</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* System Health */}
                <Card className="shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-t-lg">
                    <CardTitle className="text-lg">System Health</CardTitle>
                    <CardDescription>Platform status</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">API Status</span>
                        <Badge className="bg-green-100 text-green-800">Operational</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Database</span>
                        <Badge className="bg-green-100 text-green-800">Connected</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Response Time</span>
                        <span className="text-sm text-gray-600">45ms</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Uptime</span>
                        <span className="text-sm text-gray-600">99.9%</span>
                      </div>
                      <div className="pt-4 border-t">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Storage Used</span>
                          <span className="text-sm text-gray-600">2.5 GB / 10 GB</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full" style={{ width: '25%' }}></div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Users View */}
          {selectedView === 'users' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>User Management</CardTitle>
                      <CardDescription>Manage all platform users</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <select
                        className="px-3 py-1 border rounded-md text-sm"
                        value={filterRole}
                        onChange={(e) => {
                          setFilterRole(e.target.value);
                          setUserPage(1);
                        }}
                      >
                        <option value="all">All Roles</option>
                        <option value="admin">Admin</option>
                        <option value="staff">Staff</option>
                        <option value="user">User</option>
                      </select>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => exportToCSV(users || [], 'users')}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Export
                      </Button>
                      <Button onClick={() => setShowAddUserModal(true)}>
                        <Users className="h-4 w-4 mr-2" />
                        Add User
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {usersLoading ? (
                    <div className="flex items-center justify-center h-64">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    </div>
                  ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50">
                          <TableHead className="font-semibold">Email</TableHead>
                          <TableHead className="font-semibold">Username</TableHead>
                          <TableHead className="font-semibold">Role</TableHead>
                          <TableHead className="font-semibold">Status</TableHead>
                          <TableHead className="font-semibold">Created</TableHead>
                          <TableHead className="font-semibold">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedUsers?.map((user: any) => (
                          <TableRow key={user.id} className="hover:bg-gray-50 transition-colors">
                            <TableCell className="font-medium">{user.email}</TableCell>
                            <TableCell>{user.username}</TableCell>
                            <TableCell>
                              <Badge className={getRoleColor(mapBackendRole(user.role))}>
                                {mapBackendRole(user.role)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={user.is_active ? "default" : "secondary"} 
                                     className={user.is_active ? "bg-green-100 text-green-800" : ""}>
                                {user.is_active ? 'Active' : 'Inactive'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm">{formatDate(user.created_at)}</TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-8 w-8"
                                        onClick={() => {
                                          setSelectedUser(user);
                                          setShowViewUserModal(true);
                                        }}
                                      >
                                        <Eye className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>View user details</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                                
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-8 w-8"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          console.log('Edit user clicked:', user);
                                          setSelectedUser(user);
                                          setShowEditUserModal(true);
                                        }}
                                      >
                                        <Edit3 className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Edit user information</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                                
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button 
                                        variant="ghost" 
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => {
                                          setDeleteTarget({ type: 'user', id: user.id, name: user.email });
                                          setShowDeleteDialog(true);
                                        }}
                                      >
                                        <Trash2 className="h-4 w-4 text-red-500" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Delete user</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  )}
                  
                  {/* Pagination Controls */}
                  {totalUserPages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                      <div className="text-sm text-gray-500">
                        Showing {((userPage - 1) * itemsPerPage) + 1} to {Math.min(userPage * itemsPerPage, filteredUsers.length)} of {filteredUsers.length} users
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setUserPage(Math.max(1, userPage - 1))}
                          disabled={userPage === 1}
                        >
                          Previous
                        </Button>
                        <div className="flex items-center gap-1">
                          {[...Array(totalUserPages)].map((_, i) => (
                            <Button
                              key={i + 1}
                              variant={userPage === i + 1 ? "default" : "outline"}
                              size="sm"
                              onClick={() => setUserPage(i + 1)}
                              className="w-8 h-8 p-0"
                            >
                              {i + 1}
                            </Button>
                          ))}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setUserPage(Math.min(totalUserPages, userPage + 1))}
                          disabled={userPage === totalUserPages}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Doctors View */}
          {selectedView === 'doctors' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Doctor Management</CardTitle>
                      <CardDescription>Manage healthcare providers</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => exportToCSV(doctors || [], 'doctors')}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Export
                      </Button>
                      <Button onClick={() => setShowAddDoctorModal(true)}>
                        <Stethoscope className="h-4 w-4 mr-2" />
                        Add Doctor
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {doctorsLoading ? (
                    <div className="flex items-center justify-center h-64">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    </div>
                  ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50">
                          <TableHead className="font-semibold">Name</TableHead>
                          <TableHead className="font-semibold">Email</TableHead>
                          <TableHead className="font-semibold">Specialization</TableHead>
                          <TableHead className="font-semibold">Status</TableHead>
                          <TableHead className="font-semibold">Patients</TableHead>
                          <TableHead className="font-semibold">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {doctors?.map((doctor: any) => (
                          <TableRow key={doctor.id} className="hover:bg-gray-50 transition-colors">
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-gradient-to-br from-teal-400 to-teal-600 rounded-full flex items-center justify-center text-white text-sm">
                                  {doctor.first_name?.[0] || 'D'}
                                </div>
                                <span>{doctor.first_name} {doctor.last_name}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm">{doctor.email}</TableCell>
                            <TableCell>
                              <Badge className="bg-teal-100 text-teal-800">
                                {doctor.specialization || 'General'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className="bg-green-100 text-green-800">Active</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {appointments?.filter((a: any) => a.doctor_id === doctor.id).length || 0}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-8 w-8"
                                        onClick={() => {
                                          setSelectedDoctor(doctor);
                                          setShowViewDoctorModal(true);
                                        }}
                                      >
                                        <Eye className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>View doctor details</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                                
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-8 w-8"
                                        onClick={() => {
                                          setSelectedDoctor(doctor);
                                          setShowEditDoctorModal(true);
                                        }}
                                      >
                                        <Edit3 className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Edit doctor information</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                                
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button 
                                        variant="ghost" 
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => {
                                          setDeleteTarget({ type: 'doctor', id: doctor.id, name: `Dr. ${doctor.first_name} ${doctor.last_name}` });
                                          setShowDeleteDialog(true);
                                        }}
                                      >
                                        <Trash2 className="h-4 w-4 text-red-500" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Delete doctor</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Appointments View */}
          {selectedView === 'appointments' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Appointment Management</CardTitle>
                      <CardDescription>View and manage all appointments</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <select
                        className="px-3 py-1 border rounded-md text-sm"
                        value={filterStatus}
                        onChange={(e) => {
                          setFilterStatus(e.target.value);
                          setAppointmentPage(1);
                        }}
                      >
                        <option value="all">All Status</option>
                        <option value="Pending">Pending</option>
                        <option value="Approved">Approved</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => exportToCSV(appointments || [], 'appointments')}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Export
                      </Button>
                      <Button onClick={() => setShowAddAppointmentModal(true)}>
                        <Calendar className="h-4 w-4 mr-2" />
                        New Appointment
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {appointmentsLoading ? (
                    <div className="flex items-center justify-center h-64">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    </div>
                  ) : (
                  <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Patient</TableHead>
                        <TableHead>Doctor</TableHead>
                        <TableHead>Date & Time</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedAppointments?.map((apt: any) => (
                        <TableRow key={apt.id}>
                          <TableCell className="font-mono text-xs">#{apt.id}</TableCell>
                          <TableCell>{apt.patient_name || 'N/A'}</TableCell>
                          <TableCell>{apt.doctor_name || 'N/A'}</TableCell>
                          <TableCell>{formatDate(apt.appointment_slot_date || apt.appointment_date)}</TableCell>
                          <TableCell>{apt.treat_name || apt.appointment_type || 'General Consultation'}</TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(apt.appointment_status || apt.status)}>
                              {apt.appointment_status || apt.status || 'Pending'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="h-8 w-8"
                                      onClick={() => {
                                        setSelectedAppointment(apt);
                                        setShowViewAppointmentModal(true);
                                      }}
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>View appointment details</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="h-8 w-8"
                                      onClick={() => {
                                        setSelectedAppointment(apt);
                                        setShowEditAppointmentModal(true);
                                      }}
                                    >
                                      <Edit3 className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Edit appointment</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button 
                                      variant="ghost" 
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => {
                                        setDeleteTarget({ type: 'appointment', id: apt.id, name: `Appointment #${apt.id}` });
                                        setShowDeleteDialog(true);
                                      }}
                                    >
                                      <Trash2 className="h-4 w-4 text-red-500" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Cancel appointment</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  
                  {/* Pagination Controls */}
                  {totalAppointmentPages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                      <div className="text-sm text-gray-500">
                        Showing {((appointmentPage - 1) * itemsPerPage) + 1} to {Math.min(appointmentPage * itemsPerPage, filteredAppointments.length)} of {filteredAppointments.length} appointments
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setAppointmentPage(Math.max(1, appointmentPage - 1))}
                          disabled={appointmentPage === 1}
                        >
                          Previous
                        </Button>
                        <div className="flex items-center gap-1">
                          {[...Array(Math.min(5, totalAppointmentPages))].map((_, i) => {
                            const pageNumber = appointmentPage <= 3 ? i + 1 : appointmentPage + i - 2;
                            if (pageNumber <= totalAppointmentPages) {
                              return (
                                <Button
                                  key={pageNumber}
                                  variant={appointmentPage === pageNumber ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => setAppointmentPage(pageNumber)}
                                  className="w-8 h-8 p-0"
                                >
                                  {pageNumber}
                                </Button>
                              );
                            }
                            return null;
                          })}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setAppointmentPage(Math.min(totalAppointmentPages, appointmentPage + 1))}
                          disabled={appointmentPage === totalAppointmentPages}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                  </>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Patients View */}
          {selectedView === 'patients' && (
            <div className="space-y-6">
              <Card className="shadow-lg">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-t-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl font-bold">Patient Management</CardTitle>
                      <CardDescription>Comprehensive patient directory and management</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => exportToCSV(patients || [], 'patients')}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Export List
                      </Button>
                      <Button 
                        className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                        onClick={() => setShowAddPatientModal(true)}
                      >
                        <UserCheck className="h-4 w-4 mr-2" />
                        Add Patient
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  {patientsLoading ? (
                    <div className="flex items-center justify-center h-64">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    </div>
                  ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50">
                          <TableHead className="font-semibold">Patient ID</TableHead>
                          <TableHead className="font-semibold">Name</TableHead>
                          <TableHead className="font-semibold">Email</TableHead>
                          <TableHead className="font-semibold">Phone</TableHead>
                          <TableHead className="font-semibold">Last Visit</TableHead>
                          <TableHead className="font-semibold">Status</TableHead>
                          <TableHead className="font-semibold">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {patients?.map((patient: any) => (
                          <TableRow key={patient.id} className="hover:bg-gray-50 transition-colors">
                            <TableCell className="font-mono text-sm">#{patient.id}</TableCell>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-sm">
                                  {patient.first_name?.[0] || patient.username?.[0] || 'P'}
                                </div>
                                <span>{patient.first_name} {patient.last_name || patient.username}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm">{patient.email}</TableCell>
                            <TableCell className="text-sm">{patient.phone || 'Not provided'}</TableCell>
                            <TableCell className="text-sm">{formatDate(patient.last_visit || patient.created_at)}</TableCell>
                            <TableCell>
                              <Badge className="bg-green-100 text-green-800">Active</Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-8 w-8"
                                        onClick={() => {
                                          setSelectedPatient(patient);
                                          setShowViewPatientModal(true);
                                        }}
                                      >
                                        <Eye className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>View patient details</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                                
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-8 w-8"
                                        onClick={() => {
                                          setSelectedPatient(patient);
                                          setShowEditPatientModal(true);
                                        }}
                                      >
                                        <Edit3 className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Edit patient information</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                                
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button 
                                        variant="ghost" 
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => {
                                          setDeleteTarget({ type: 'patient', id: patient.id, name: `${patient.first_name} ${patient.last_name || patient.username}` });
                                          setShowDeleteDialog(true);
                                        }}
                                      >
                                        <Trash2 className="h-4 w-4 text-red-500" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Delete patient</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Subscription Management View */}
          {selectedView === 'subscriptions' && (
            <div className="space-y-6">
              {/* Subscription Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-0 shadow-lg bg-gradient-to-br from-green-500 to-green-600">
                  <CardContent className="p-6 text-white">
                    <div className="flex items-center justify-between mb-4">
                      <CreditCard className="h-8 w-8 opacity-80" />
                      <Badge className="bg-white/20 text-white">Active</Badge>
                    </div>
                    <div className="text-3xl font-bold mb-1">247</div>
                    <p className="text-sm opacity-90">Active Subscriptions</p>
                    <p className="text-xs opacity-75 mt-2">$45,320 MRR</p>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-500 to-orange-600">
                  <CardContent className="p-6 text-white">
                    <div className="flex items-center justify-between mb-4">
                      <DollarSign className="h-8 w-8 opacity-80" />
                      <Badge className="bg-white/20 text-white">Due</Badge>
                    </div>
                    <div className="text-3xl font-bold mb-1">12</div>
                    <p className="text-sm opacity-90">Pending Payments</p>
                    <p className="text-xs opacity-75 mt-2">$2,450 pending</p>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500 to-purple-600">
                  <CardContent className="p-6 text-white">
                    <div className="flex items-center justify-between mb-4">
                      <Receipt className="h-8 w-8 opacity-80" />
                      <Badge className="bg-white/20 text-white">Monthly</Badge>
                    </div>
                    <div className="text-3xl font-bold mb-1">$52,480</div>
                    <p className="text-sm opacity-90">Total Revenue</p>
                    <p className="text-xs opacity-75 mt-2">+12% from last month</p>
                  </CardContent>
                </Card>
              </div>

              {/* Subscription List */}
              <Card className="shadow-lg">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-t-lg">
                  <CardTitle className="text-xl font-bold">Subscription Records</CardTitle>
                  <CardDescription>Manage patient subscriptions and payment methods</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="font-semibold">Subscriber</TableHead>
                        <TableHead className="font-semibold">Plan</TableHead>
                        <TableHead className="font-semibold">Payment Method</TableHead>
                        <TableHead className="font-semibold">Next Billing</TableHead>
                        <TableHead className="font-semibold">Amount</TableHead>
                        <TableHead className="font-semibold">Status</TableHead>
                        <TableHead className="font-semibold">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[1, 2, 3, 4, 5].map((i) => (
                        <TableRow key={i} className="hover:bg-gray-50 transition-colors">
                          <TableCell className="font-medium">John Doe {i}</TableCell>
                          <TableCell>
                            <Badge className="bg-blue-100 text-blue-800">Premium</Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            <div className="flex items-center gap-2">
                              <CreditCard className="h-4 w-4 text-gray-500" />
                              <span>•••• 4242</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">{formatDate(new Date(Date.now() + i * 86400000).toISOString())}</TableCell>
                          <TableCell className="font-semibold">$199/mo</TableCell>
                          <TableCell>
                            <Badge className="bg-green-100 text-green-800">Active</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" className="h-8 w-8" title="View Details">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8" 
                                title="Download Receipt"
                                onClick={() => downloadReceipt({
                                  name: `John Doe ${i}`,
                                  plan: 'Premium',
                                  paymentMethod: '•••• 4242',
                                  amount: '$199/mo',
                                  nextBilling: formatDate(new Date(Date.now() + i * 86400000).toISOString()),
                                  status: 'Active'
                                })}
                              >
                                <Receipt className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8" title="Edit">
                                <Edit3 className="h-4 w-4" />
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
          )}

          {/* Analysis Tracking View */}
          {selectedView === 'analysis-tracking' && (
            <div className="space-y-6">
              {/* Analysis Overview */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="border-0 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <Scan className="h-8 w-8 text-purple-500" />
                      <Badge className="bg-purple-100 text-purple-800">Face</Badge>
                    </div>
                    <div className="text-2xl font-bold mb-1">342</div>
                    <p className="text-sm text-gray-600">Face Analyses</p>
                    <p className="text-xs text-gray-500 mt-2">Last 30 days</p>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <Activity className="h-8 w-8 text-pink-500" />
                      <Badge className="bg-pink-100 text-pink-800">Hair</Badge>
                    </div>
                    <div className="text-2xl font-bold mb-1">218</div>
                    <p className="text-sm text-gray-600">Hair Analyses</p>
                    <p className="text-xs text-gray-500 mt-2">Last 30 days</p>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <Heart className="h-8 w-8 text-red-500" />
                      <Badge className="bg-red-100 text-red-800">Lips</Badge>
                    </div>
                    <div className="text-2xl font-bold mb-1">156</div>
                    <p className="text-sm text-gray-600">Lips Analyses</p>
                    <p className="text-xs text-gray-500 mt-2">Last 30 days</p>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <TrendingUp className="h-8 w-8 text-green-500" />
                      <Badge className="bg-green-100 text-green-800">Growth</Badge>
                    </div>
                    <div className="text-2xl font-bold mb-1">+24%</div>
                    <p className="text-sm text-gray-600">Usage Increase</p>
                    <p className="text-xs text-gray-500 mt-2">vs last month</p>
                  </CardContent>
                </Card>
              </div>

              {/* Analysis Records */}
              <Card className="shadow-lg">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-t-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl font-bold">Analysis History</CardTitle>
                      <CardDescription>Track all face, hair, and lips analyses from chat widget</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <select className="px-3 py-1 border rounded-md text-sm">
                        <option value="all">All Types</option>
                        <option value="face">Face Analysis</option>
                        <option value="hair">Hair Analysis</option>
                        <option value="lips">Lips Analysis</option>
                      </select>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Export Data
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="font-semibold">Date</TableHead>
                        <TableHead className="font-semibold">Patient</TableHead>
                        <TableHead className="font-semibold">Analysis Type</TableHead>
                        <TableHead className="font-semibold">Results Summary</TableHead>
                        <TableHead className="font-semibold">Recommendations</TableHead>
                        <TableHead className="font-semibold">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[
                        { type: 'face', result: 'Skin Type: Oily, Age: 28', recommendation: 'Use oil-free moisturizer' },
                        { type: 'hair', result: 'Hair Type: Dry, Damage: Moderate', recommendation: 'Deep conditioning treatment' },
                        { type: 'lips', result: 'Hydration: Low, Texture: Dry', recommendation: 'Apply lip balm regularly' },
                        { type: 'face', result: 'Skin Type: Normal, Age: 35', recommendation: 'Maintain current routine' },
                        { type: 'hair', result: 'Hair Type: Normal, Health: Good', recommendation: 'Regular trimming advised' },
                      ].map((analysis, i) => (
                        <TableRow key={i} className="hover:bg-gray-50 transition-colors">
                          <TableCell className="text-sm">{formatDate(new Date(Date.now() - i * 86400000).toISOString())}</TableCell>
                          <TableCell className="font-medium">Patient {i + 1}</TableCell>
                          <TableCell>
                            <Badge className={
                              analysis.type === 'face' ? 'bg-purple-100 text-purple-800' :
                              analysis.type === 'hair' ? 'bg-pink-100 text-pink-800' :
                              'bg-red-100 text-red-800'
                            }>
                              {analysis.type.charAt(0).toUpperCase() + analysis.type.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">{analysis.result}</TableCell>
                          <TableCell className="text-sm">{analysis.recommendation}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Download className="h-4 w-4" />
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
          )}

          {/* Medical Records View */}
          {selectedView === 'medical-records' && (
            <div className="space-y-6">
              <Card className="shadow-lg">
                <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50 rounded-t-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl font-bold">Medical Records Management</CardTitle>
                      <CardDescription>Access and manage patient medical histories</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Search className="h-4 w-4 mr-2" />
                        Search Records
                      </Button>
                      <Button className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700">
                        <FileText className="h-4 w-4 mr-2" />
                        Add Record
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="font-semibold">Record ID</TableHead>
                        <TableHead className="font-semibold">Patient</TableHead>
                        <TableHead className="font-semibold">Date</TableHead>
                        <TableHead className="font-semibold">Type</TableHead>
                        <TableHead className="font-semibold">Doctor</TableHead>
                        <TableHead className="font-semibold">Diagnosis</TableHead>
                        <TableHead className="font-semibold">Status</TableHead>
                        <TableHead className="font-semibold">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[
                        { type: 'Consultation', diagnosis: 'Routine Checkup', status: 'Completed' },
                        { type: 'Lab Results', diagnosis: 'Blood Test - Normal', status: 'Reviewed' },
                        { type: 'Prescription', diagnosis: 'Antibiotics Prescribed', status: 'Active' },
                        { type: 'X-Ray', diagnosis: 'Chest X-Ray Clear', status: 'Completed' },
                        { type: 'Follow-up', diagnosis: 'Post-Surgery Review', status: 'Scheduled' },
                      ].map((record, i) => (
                        <TableRow key={i} className="hover:bg-gray-50 transition-colors">
                          <TableCell className="font-mono text-sm">#MR00{i + 1}</TableCell>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-sm">
                                P{i + 1}
                              </div>
                              <span>Patient {i + 1}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">{formatDate(new Date(Date.now() - i * 172800000).toISOString())}</TableCell>
                          <TableCell>
                            <Badge className="bg-blue-100 text-blue-800">{record.type}</Badge>
                          </TableCell>
                          <TableCell className="text-sm">Dr. Smith</TableCell>
                          <TableCell className="text-sm">{record.diagnosis}</TableCell>
                          <TableCell>
                            <Badge className={
                              record.status === 'Completed' ? 'bg-green-100 text-green-800' :
                              record.status === 'Active' ? 'bg-yellow-100 text-yellow-800' :
                              record.status === 'Scheduled' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }>
                              {record.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" className="h-8 w-8" title="View Record">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8" title="Download">
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8" title="Edit">
                                <Edit3 className="h-4 w-4" />
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
          )}

          {/* Analytics View */}
          {selectedView === 'analytics' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Analytics Dashboard</CardTitle>
                  <CardDescription>Performance metrics and insights</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Monthly Revenue</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">$45,231</div>
                        <p className="text-xs text-green-600">+20.1% from last month</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Appointment Rate</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">89%</div>
                        <p className="text-xs text-green-600">+5% from last week</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Patient Satisfaction</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">4.8/5.0</div>
                        <p className="text-xs text-gray-600">Based on 234 reviews</p>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Settings View */}
          {selectedView === 'settings' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>System Settings</CardTitle>
                  <CardDescription>Configure platform settings and preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold">General Settings</h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">Clinic Name</p>
                          <p className="text-sm text-gray-600">MedCor Healthcare</p>
                        </div>
                        <Button variant="outline" size="sm">Edit</Button>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">Timezone</p>
                          <p className="text-sm text-gray-600">UTC+05:30 (Mumbai)</p>
                        </div>
                        <Button variant="outline" size="sm">Change</Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>

      {/* User Modals */}
      {/* View User Modal */}
      <Dialog open={showViewUserModal} onOpenChange={setShowViewUserModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>Complete information about the user</DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Email</Label>
                  <p className="mt-1 text-sm">{selectedUser.email}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Username</Label>
                  <p className="mt-1 text-sm">{selectedUser.username}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Role</Label>
                  <Badge className={`mt-1 ${getRoleColor(selectedUser.role)}`}>
                    {selectedUser.role}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Status</Label>
                  <Badge variant={selectedUser.is_active ? "default" : "secondary"} 
                         className={`mt-1 ${selectedUser.is_active ? "bg-green-100 text-green-800" : ""}`}>
                    {selectedUser.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">First Name</Label>
                  <p className="mt-1 text-sm">{selectedUser.first_name || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Last Name</Label>
                  <p className="mt-1 text-sm">{selectedUser.last_name || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Created Date</Label>
                  <p className="mt-1 text-sm">{formatDate(selectedUser.created_at)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Last Login</Label>
                  <p className="mt-1 text-sm">{selectedUser.last_login ? formatDate(selectedUser.last_login) : 'Never'}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowViewUserModal(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add User Modal */}
      <Dialog open={showAddUserModal} onOpenChange={setShowAddUserModal}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>Create a new user account</DialogDescription>
          </DialogHeader>
          <UserForm 
            onSubmit={async (data) => {
              try {
                // Include default password in the data being sent
                const userData = {
                  ...data,
                  password: 'TempPass123!' // Default password for all new users
                };
                
                console.log('Creating user with data:', userData); // Debug log
                const response = await apiRequest('/api/auth/users/create/', {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify(userData),
                });
                console.log('User created successfully:', response); // Debug log
                toast({
                  title: 'Success',
                  description: 'User created successfully with default password: TempPass123!',
                });
                queryClient.invalidateQueries({ queryKey: ['/api/auth/users/'] });
                setShowAddUserModal(false);
              } catch (error: any) {
                console.error('Create user failed:', error); // Debug log
                toast({
                  title: 'Error',
                  description: error.message || 'Failed to create user',
                  variant: 'destructive',
                });
              }
            }}
            onCancel={() => setShowAddUserModal(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit User Modal */}
      <Dialog open={showEditUserModal} onOpenChange={setShowEditUserModal}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update user information</DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <UserForm 
              initialData={{
                ...selectedUser,
                role: mapBackendRole(selectedUser.role) // Map role for display
              }}
              onSubmit={async (data) => {
                try {
                  console.log('Updating user with data:', data); // Debug log
                  const response = await apiRequest(`/api/auth/users/${selectedUser.id}/`, {
                    method: 'PATCH',
                    headers: {
                      'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data),
                  });
                  console.log('Update response:', response); // Debug log
                  toast({
                    title: 'Success',
                    description: 'User updated successfully',
                  });
                  queryClient.invalidateQueries({ queryKey: ['/api/auth/users/'] });
                  setShowEditUserModal(false);
                  setSelectedUser(null);
                } catch (error: any) {
                  console.error('Update failed:', error); // Debug log
                  toast({
                    title: 'Error',
                    description: error.message || 'Failed to update user',
                    variant: 'destructive',
                  });
                }
              }}
              onCancel={() => {
                setShowEditUserModal(false);
                setSelectedUser(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete{' '}
              <span className="font-semibold">{deleteTarget?.name}</span> from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowDeleteDialog(false);
              setDeleteTarget(null);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                if (deleteTarget) {
                  deleteMutation.mutate({ type: deleteTarget.type, id: deleteTarget.id });
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Doctor Modals */}
      {/* View Doctor Modal */}
      <Dialog open={showViewDoctorModal} onOpenChange={setShowViewDoctorModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Doctor Details</DialogTitle>
            <DialogDescription>Complete information about the doctor</DialogDescription>
          </DialogHeader>
          {selectedDoctor && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Name</Label>
                  <p className="mt-1 text-sm">{selectedDoctor.first_name} {selectedDoctor.last_name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Email</Label>
                  <p className="mt-1 text-sm">{selectedDoctor.email}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Specialization</Label>
                  <Badge className="mt-1 bg-teal-100 text-teal-800">
                    {selectedDoctor.specialization || 'General Practitioner'}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">License Number</Label>
                  <p className="mt-1 text-sm">{selectedDoctor.license_number || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Phone</Label>
                  <p className="mt-1 text-sm">{selectedDoctor.phone || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Experience</Label>
                  <p className="mt-1 text-sm">{selectedDoctor.experience_years || 0} years</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Department</Label>
                  <p className="mt-1 text-sm">{selectedDoctor.department || 'General'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Consultation Fee</Label>
                  <p className="mt-1 text-sm">${selectedDoctor.consultation_fee || '100'}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowViewDoctorModal(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Doctor Modal */}
      <Dialog open={showAddDoctorModal} onOpenChange={setShowAddDoctorModal}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Add New Doctor</DialogTitle>
            <DialogDescription>Register a new healthcare provider</DialogDescription>
          </DialogHeader>
          <DoctorForm 
            onSubmit={async (data) => {
              try {
                await apiRequest('/api/auth/admin/doctors/', {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify(data),
                });
                toast({
                  title: 'Success',
                  description: 'Doctor created successfully',
                });
                queryClient.invalidateQueries({ queryKey: ['/api/auth/admin/doctors/'] });
                setShowAddDoctorModal(false);
              } catch (error: any) {
                toast({
                  title: 'Error',
                  description: error.message || 'Failed to create doctor',
                  variant: 'destructive',
                });
              }
            }}
            onCancel={() => setShowAddDoctorModal(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Doctor Modal */}
      <Dialog open={showEditDoctorModal} onOpenChange={setShowEditDoctorModal}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit Doctor</DialogTitle>
            <DialogDescription>Update doctor information</DialogDescription>
          </DialogHeader>
          {selectedDoctor && (
            <DoctorForm 
              initialData={selectedDoctor}
              onSubmit={async (data) => {
                try {
                  await apiRequest(`/api/auth/admin/doctors/${selectedDoctor.id}/`, {
                    method: 'PATCH',
                    headers: {
                      'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data),
                  });
                  toast({
                    title: 'Success',
                    description: 'Doctor updated successfully',
                  });
                  queryClient.invalidateQueries({ queryKey: ['/api/auth/admin/doctors/'] });
                  setShowEditDoctorModal(false);
                  setSelectedDoctor(null);
                } catch (error: any) {
                  toast({
                    title: 'Error',
                    description: error.message || 'Failed to update doctor',
                    variant: 'destructive',
                  });
                }
              }}
              onCancel={() => {
                setShowEditDoctorModal(false);
                setSelectedDoctor(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Patient Modals */}
      {/* View Patient Modal */}
      <Dialog open={showViewPatientModal} onOpenChange={setShowViewPatientModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Patient Details</DialogTitle>
            <DialogDescription>Complete patient information and medical history</DialogDescription>
          </DialogHeader>
          {selectedPatient && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Name</Label>
                  <p className="mt-1 text-sm">{selectedPatient.first_name} {selectedPatient.last_name || selectedPatient.username}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Email</Label>
                  <p className="mt-1 text-sm">{selectedPatient.email}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Phone</Label>
                  <p className="mt-1 text-sm">{selectedPatient.phone || 'Not provided'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Date of Birth</Label>
                  <p className="mt-1 text-sm">{selectedPatient.date_of_birth ? formatDate(selectedPatient.date_of_birth) : 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Blood Group</Label>
                  <p className="mt-1 text-sm">{selectedPatient.blood_group || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Registration Date</Label>
                  <p className="mt-1 text-sm">{formatDate(selectedPatient.created_at)}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowViewPatientModal(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Patient Modal */}
      <Dialog open={showAddPatientModal} onOpenChange={setShowAddPatientModal}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Add New Patient</DialogTitle>
            <DialogDescription>Register a new patient</DialogDescription>
          </DialogHeader>
          <PatientForm 
            onSubmit={async (data) => {
              try {
                // Clean up empty fields - remove empty strings for optional fields
                const cleanedData = Object.entries(data).reduce((acc, [key, value]) => {
                  // Don't send empty strings for optional fields
                  if (value === '' && ['date_of_birth', 'phone', 'blood_group', 'address'].includes(key)) {
                    return acc; // Skip empty optional fields
                  }
                  acc[key] = value;
                  return acc;
                }, {} as any);

                // Include default password for new patients
                const patientData = {
                  ...cleanedData,
                  password: 'TempPass123!', // Default password for all new patients
                  role: 'patient' // Ensure role is set
                };
                
                console.log('Creating patient with data:', patientData); // Debug log
                // Use the correct user creation endpoint
                await apiRequest('/api/auth/users/create/', {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify(patientData),
                });
                console.log('Patient created successfully'); // Debug log
                toast({
                  title: 'Success',
                  description: 'Patient created successfully with default password: TempPass123!',
                });
                // Invalidate both user and patient queries to ensure refresh
                queryClient.invalidateQueries({ queryKey: ['/api/auth/users/'] });
                queryClient.invalidateQueries({ queryKey: ['/api/auth/admin/patients/'] });
                setShowAddPatientModal(false);
              } catch (error: any) {
                toast({
                  title: 'Error',
                  description: error.message || 'Failed to create patient',
                  variant: 'destructive',
                });
              }
            }}
            onCancel={() => setShowAddPatientModal(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Patient Modal */}
      <Dialog open={showEditPatientModal} onOpenChange={setShowEditPatientModal}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit Patient</DialogTitle>
            <DialogDescription>Update patient information</DialogDescription>
          </DialogHeader>
          {selectedPatient && (
            <PatientForm 
              initialData={selectedPatient}
              onSubmit={async (data) => {
                try {
                  // Clean up empty fields - remove empty strings for optional fields
                  const cleanedData = Object.entries(data).reduce((acc, [key, value]) => {
                    // Don't send empty strings for optional fields
                    if (value === '' && ['date_of_birth', 'phone', 'blood_group', 'address'].includes(key)) {
                      return acc; // Skip empty optional fields
                    }
                    acc[key] = value;
                    return acc;
                  }, {} as any);

                  console.log('Updating patient with data:', cleanedData); // Debug log
                  // Use the correct user update endpoint
                  await apiRequest(`/api/auth/users/${selectedPatient.id}/`, {
                    method: 'PATCH',
                    headers: {
                      'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(cleanedData),
                  });
                  console.log('Patient updated successfully'); // Debug log
                  toast({
                    title: 'Success',
                    description: 'Patient updated successfully',
                  });
                  queryClient.invalidateQueries({ queryKey: ['/api/auth/admin/patients/'] });
                  queryClient.invalidateQueries({ queryKey: ['/api/auth/users/'] });
                  setShowEditPatientModal(false);
                  setSelectedPatient(null);
                } catch (error: any) {
                  console.error('Update patient failed:', error); // Debug log
                  toast({
                    title: 'Error',
                    description: error.message || 'Failed to update patient',
                    variant: 'destructive',
                  });
                }
              }}
              onCancel={() => {
                setShowEditPatientModal(false);
                setSelectedPatient(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Appointment Modals */}
      {/* View Appointment Modal */}
      <Dialog open={showViewAppointmentModal} onOpenChange={setShowViewAppointmentModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Appointment Details</DialogTitle>
            <DialogDescription>Complete appointment information</DialogDescription>
          </DialogHeader>
          {selectedAppointment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Appointment ID</Label>
                  <p className="mt-1 text-sm font-mono">#{selectedAppointment.id}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Status</Label>
                  <Badge className={`mt-1 ${getStatusColor(selectedAppointment.appointment_status || selectedAppointment.status)}`}>
                    {selectedAppointment.appointment_status || selectedAppointment.status || 'Pending'}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Patient</Label>
                  <p className="mt-1 text-sm">{selectedAppointment.patient_name || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Doctor</Label>
                  <p className="mt-1 text-sm">{selectedAppointment.doctor_name || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Date & Time</Label>
                  <p className="mt-1 text-sm">{formatDate(selectedAppointment.appointment_slot_date || selectedAppointment.appointment_date)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Type</Label>
                  <p className="mt-1 text-sm">{selectedAppointment.treat_name || selectedAppointment.appointment_type || 'General Consultation'}</p>
                </div>
              </div>
              {selectedAppointment.notes && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Notes</Label>
                  <p className="mt-1 text-sm">{selectedAppointment.notes}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowViewAppointmentModal(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Appointment Modal */}
      <Dialog open={showAddAppointmentModal} onOpenChange={setShowAddAppointmentModal}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Schedule New Appointment</DialogTitle>
            <DialogDescription>Create a new appointment booking</DialogDescription>
          </DialogHeader>
          <AppointmentForm 
            patients={patients}
            doctors={doctors}
            onSubmit={async (data) => {
              try {
                // Transform data to match backend expectations
                const appointmentData = {
                  ...data,
                  treat_name: data.appointment_type, // Add treat_name field
                };
                
                await apiRequest('/appointments/', {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify(appointmentData),
                });
                toast({
                  title: 'Success',
                  description: 'Appointment scheduled successfully',
                });
                queryClient.invalidateQueries({ queryKey: ['/appointments/'] });
                setShowAddAppointmentModal(false);
              } catch (error: any) {
                toast({
                  title: 'Error',
                  description: error.message || 'Failed to schedule appointment',
                  variant: 'destructive',
                });
              }
            }}
            onCancel={() => setShowAddAppointmentModal(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Appointment Modal */}
      <Dialog open={showEditAppointmentModal} onOpenChange={setShowEditAppointmentModal}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit Appointment</DialogTitle>
            <DialogDescription>Update appointment details</DialogDescription>
          </DialogHeader>
          {selectedAppointment && (
            <AppointmentForm 
              initialData={selectedAppointment}
              patients={patients}
              doctors={doctors}
              onSubmit={async (data) => {
                try {
                  // Transform data to match backend expectations
                  const appointmentData = {
                    ...data,
                    treat_name: data.appointment_type, // Add treat_name field
                  };
                  
                  await apiRequest(`/appointments/${selectedAppointment.id}/`, {
                    method: 'PATCH',
                    headers: {
                      'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(appointmentData),
                  });
                  toast({
                    title: 'Success',
                    description: 'Appointment updated successfully',
                  });
                  queryClient.invalidateQueries({ queryKey: ['/appointments/'] });
                  setShowEditAppointmentModal(false);
                  setSelectedAppointment(null);
                } catch (error: any) {
                  toast({
                    title: 'Error',
                    description: error.message || 'Failed to update appointment',
                    variant: 'destructive',
                  });
                }
              }}
              onCancel={() => {
                setShowEditAppointmentModal(false);
                setSelectedAppointment(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// User Form Component
function UserForm({ 
  initialData, 
  onSubmit, 
  onCancel 
}: { 
  initialData?: any; 
  onSubmit: (data: any) => void; 
  onCancel: () => void;
}) {
  const form = useForm({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      email: initialData?.email || '',
      username: initialData?.username || '',
      role: initialData?.role || 'patient',
      password: initialData ? '' : 'TempPass123!', // Default password for new users
      first_name: initialData?.first_name || '',
      last_name: initialData?.last_name || '',
    },
  });

  const handleFormSubmit = (data: any) => {
    console.log('UserForm submitting with data:', data);
    // Don't send empty password when editing
    if (initialData && (!data.password || data.password === '')) {
      const { password, ...dataWithoutPassword } = data;
      onSubmit(dataWithoutPassword);
    } else {
      onSubmit(data);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit, (errors) => {
        console.error('Form validation errors:', errors);
      })} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input 
                  placeholder="user@example.com" 
                  {...field} 
                  disabled={!!initialData} // Disable email field when editing
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="username" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="first_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name</FormLabel>
                <FormControl>
                  <Input placeholder="John" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="last_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last Name</FormLabel>
                <FormControl>
                  <Input placeholder="Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Role</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="doctor">Doctor</SelectItem>
                  <SelectItem value="patient">Patient</SelectItem>
                  <SelectItem value="clinic">Clinic</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* Password field removed - using default password 'TempPass123!' for all new users */}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">
            {initialData ? 'Update' : 'Create'} User
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

// Doctor Form Component
function DoctorForm({ 
  initialData, 
  onSubmit, 
  onCancel 
}: { 
  initialData?: any; 
  onSubmit: (data: any) => void; 
  onCancel: () => void;
}) {
  const form = useForm({
    resolver: zodResolver(doctorFormSchema),
    defaultValues: {
      email: initialData?.email || '',
      username: initialData?.username || '',
      password: '',
      first_name: initialData?.first_name || '',
      last_name: initialData?.last_name || '',
      specialization: initialData?.specialization || '',
      license_number: initialData?.license_number || '',
      phone: initialData?.phone || '',
      experience_years: initialData?.experience_years ? String(initialData.experience_years) : '', // Convert to string
      consultation_fee: initialData?.consultation_fee || 100,
    },
  });

  const handleFormSubmit = (data: any) => {
    console.log('DoctorForm submitting with data:', data);
    
    // Clean the data - remove empty fields and convert types if needed
    const cleanedData: any = {};
    
    // Required fields
    cleanedData.email = data.email;
    cleanedData.first_name = data.first_name;
    
    // Optional fields - only add if they have values
    if (data.last_name) cleanedData.last_name = data.last_name;
    if (data.username) cleanedData.username = data.username;
    if (data.specialization) cleanedData.specialization = data.specialization;
    if (data.phone) cleanedData.phone = data.phone;
    if (data.license_number) cleanedData.license_number = data.license_number;
    
    // Convert experience_years to string if it's a number
    if (data.experience_years !== undefined && data.experience_years !== null && data.experience_years !== 0) {
      cleanedData.experience_years = String(data.experience_years);
    }
    
    // Handle consultation_fee if present
    if (data.consultation_fee !== undefined && data.consultation_fee !== null && data.consultation_fee !== 0) {
      cleanedData.consultation_fee = data.consultation_fee;
    }
    
    // Don't send empty password when editing
    if (!initialData || (data.password && data.password !== '')) {
      cleanedData.password = data.password || 'TempPass123!';
    }
    
    console.log('DoctorForm cleaned data:', cleanedData);
    onSubmit(cleanedData);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit, (errors) => {
        console.error('Doctor form validation errors:', errors);
      })} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="first_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name</FormLabel>
                <FormControl>
                  <Input placeholder="John" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="last_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last Name</FormLabel>
                <FormControl>
                  <Input placeholder="Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input 
                  placeholder="doctor@example.com" 
                  {...field} 
                  disabled={!!initialData} // Disable email field when editing
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="specialization"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Specialization</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select specialization" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="general">General Practitioner</SelectItem>
                  <SelectItem value="cardiology">Cardiology</SelectItem>
                  <SelectItem value="pediatrics">Pediatrics</SelectItem>
                  <SelectItem value="orthopedics">Orthopedics</SelectItem>
                  <SelectItem value="dermatology">Dermatology</SelectItem>
                  <SelectItem value="neurology">Neurology</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="license_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>License Number</FormLabel>
                <FormControl>
                  <Input placeholder="MD12345" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone</FormLabel>
                <FormControl>
                  <Input placeholder="+1234567890" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        {/* Password field removed - using default password 'TempPass123!' for all new doctors */}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">
            {initialData ? 'Update' : 'Create'} Doctor
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

// Patient Form Component
function PatientForm({ 
  initialData, 
  onSubmit, 
  onCancel 
}: { 
  initialData?: any; 
  onSubmit: (data: any) => void; 
  onCancel: () => void;
}) {
  const form = useForm({
    resolver: zodResolver(patientFormSchema),
    defaultValues: {
      email: initialData?.email || '',
      username: initialData?.username || '',
      first_name: initialData?.first_name || '',
      last_name: initialData?.last_name || '',
      phone: initialData?.phone || '',
      date_of_birth: initialData?.date_of_birth || '',
      blood_group: initialData?.blood_group || '',
      address: initialData?.address || '',
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="first_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name</FormLabel>
                <FormControl>
                  <Input placeholder="John" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="last_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last Name</FormLabel>
                <FormControl>
                  <Input placeholder="Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input 
                  placeholder="patient@example.com" 
                  {...field}
                  disabled={!!initialData} // Disable email field when editing
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="username" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone</FormLabel>
                <FormControl>
                  <Input placeholder="+1234567890" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="blood_group"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Blood Group</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select blood group" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="A+">A+</SelectItem>
                    <SelectItem value="A-">A-</SelectItem>
                    <SelectItem value="B+">B+</SelectItem>
                    <SelectItem value="B-">B-</SelectItem>
                    <SelectItem value="O+">O+</SelectItem>
                    <SelectItem value="O-">O-</SelectItem>
                    <SelectItem value="AB+">AB+</SelectItem>
                    <SelectItem value="AB-">AB-</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        {/* Password field removed - using default password 'TempPass123!' for all new patients */}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">
            {initialData ? 'Update' : 'Create'} Patient
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

// Appointment Form Component
function AppointmentForm({ 
  initialData, 
  patients,
  doctors,
  onSubmit, 
  onCancel 
}: { 
  initialData?: any;
  patients: any[];
  doctors: any[];
  onSubmit: (data: any) => void; 
  onCancel: () => void;
}) {
  const form = useForm({
    resolver: zodResolver(appointmentFormSchema),
    defaultValues: {
      patient_id: initialData?.patient_id || '',
      doctor_id: initialData?.doctor_id || '',
      appointment_date: initialData?.appointment_date || '',
      appointment_time: initialData?.appointment_time || '',
      appointment_type: initialData?.appointment_type || 'consultation',
      reason: initialData?.reason || '',
      status: initialData?.status || 'Pending',
      notes: initialData?.notes || '',
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="patient_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Patient</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select patient" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {patients?.map((patient) => (
                    <SelectItem key={patient.id} value={patient.id.toString()}>
                      {patient.first_name} {patient.last_name || patient.username}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="doctor_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Doctor</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select doctor" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {doctors?.map((doctor) => (
                    <SelectItem key={doctor.id} value={doctor.id.toString()}>
                      Dr. {doctor.first_name} {doctor.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="appointment_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="appointment_time"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Time</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="appointment_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="consultation">Consultation</SelectItem>
                  <SelectItem value="followup">Follow-up</SelectItem>
                  <SelectItem value="checkup">Check-up</SelectItem>
                  <SelectItem value="emergency">Emergency</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="reason"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Reason for Visit</FormLabel>
              <FormControl>
                <Input placeholder="Reason for appointment..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="Additional notes..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">
            {initialData ? 'Update' : 'Schedule'} Appointment
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}