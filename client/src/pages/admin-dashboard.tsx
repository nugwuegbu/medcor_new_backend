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
  DollarSign
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

interface AdminStats {
  totalPatients: number;
  totalDoctors: number;
  totalAppointments: number;
  pendingAppointments: number;
  todayAppointments: number;
  monthlyGrowth: number;
}

const sidebarItems = [
  { id: 'overview', label: 'Overview', icon: Home },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'doctors', label: 'Doctors', icon: Stethoscope },
  { id: 'appointments', label: 'Appointments', icon: Calendar },
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
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Export
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Username</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedUsers?.map((user: any) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.email}</TableCell>
                          <TableCell>{user.username}</TableCell>
                          <TableCell>
                            <Badge className={getRoleColor(user.role)}>
                              {user.role}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={user.is_active ? "success" : "secondary"}>
                              {user.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDate(user.created_at)}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button variant="ghost" size="icon">
                                <Edit3 className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => handleDeleteUser(user.id)}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  
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
                    <Button>
                      <Users className="h-4 w-4 mr-2" />
                      Add Doctor
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Specialization</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Patients</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {doctors?.map((doctor: any) => (
                        <TableRow key={doctor.id}>
                          <TableCell className="font-medium">
                            {doctor.first_name} {doctor.last_name}
                          </TableCell>
                          <TableCell>{doctor.email}</TableCell>
                          <TableCell>{doctor.specialization || 'General'}</TableCell>
                          <TableCell>
                            <Badge variant="success">Active</Badge>
                          </TableCell>
                          <TableCell>
                            {appointments?.filter((a: any) => a.doctor_id === doctor.id).length || 0}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button variant="ghost" size="icon">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon">
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
                      <Button variant="outline" size="sm">
                        <Calendar className="h-4 w-4 mr-2" />
                        Calendar View
                      </Button>
                      <Button>
                        <Calendar className="h-4 w-4 mr-2" />
                        New Appointment
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
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
                            <div className="flex gap-2">
                              <Button variant="ghost" size="icon">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon">
                                <Edit3 className="h-4 w-4" />
                              </Button>
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
    </div>
  );
}