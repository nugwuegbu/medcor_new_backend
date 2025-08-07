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

  // Fetch appointments - using Django's appointments endpoint  
  const { data: appointments, isLoading: appointmentsLoading } = useQuery({
    queryKey: ['/appointments/'],
    queryFn: async () => {
      try {
        return await apiRequest('/appointments/', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
          }
        });
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

  // Calculate statistics from the fetched data
  const stats: AdminStats = {
    totalPatients: users?.filter((u: any) => u.role === 'patient').length || 0,
    totalDoctors: users?.filter((u: any) => u.role === 'doctor').length || 0,
    totalAppointments: appointments?.length || 0,
    pendingAppointments: appointments?.filter((a: any) => a.status === 'scheduled').length || 0,
    todayAppointments: appointments?.filter((a: any) => {
      const today = new Date().toISOString().split('T')[0];
      return a.appointment_date === today;
    }).length || 0,
    monthlyGrowth: 12.5 // Placeholder for now
  };

  const doctors = users?.filter((u: any) => u.role === 'doctor') || [];
  const patients = users?.filter((u: any) => u.role === 'patient') || [];
  const statsLoading = usersLoading || appointmentsLoading;

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
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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

        {/* Sidebar Navigation */}
        <nav className="flex-1 px-3 py-4">
          <div className="space-y-1">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.id}
                  variant={selectedView === item.id ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start",
                    selectedView === item.id && "bg-blue-50 text-blue-700 hover:bg-blue-100"
                  )}
                  onClick={() => {
                    setSelectedView(item.id);
                    setMobileMenuOpen(false);
                  }}
                >
                  <Icon className="mr-3 h-4 w-4" />
                  {item.label}
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
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-gray-200 px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-semibold text-gray-900">
              {sidebarItems.find(item => item.id === selectedView)?.label || 'Dashboard'}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="search"
                placeholder="Search..."
                className="pl-10 w-64"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setLocation('/')}
              className="hidden sm:flex"
            >
              <Eye className="h-4 w-4 mr-2" />
              View Site
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {/* Overview View */}
          {selectedView === 'overview' && (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalPatients}</div>
                    <p className="text-xs text-muted-foreground">
                      +{stats.monthlyGrowth}% from last month
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Doctors</CardTitle>
                    <Stethoscope className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalDoctors}</div>
                    <p className="text-xs text-muted-foreground">Active practitioners</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Appointments</CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalAppointments}</div>
                    <p className="text-xs text-muted-foreground">
                      {stats.todayAppointments} scheduled today
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pending</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.pendingAppointments}</div>
                    <p className="text-xs text-muted-foreground">Require attention</p>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Appointments</CardTitle>
                  <CardDescription>Latest scheduled appointments</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Patient</TableHead>
                        <TableHead>Doctor</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {appointments?.slice(0, 5).map((apt: any) => (
                        <TableRow key={apt.id}>
                          <TableCell>{apt.patient_name || 'N/A'}</TableCell>
                          <TableCell>{apt.doctor_name || 'N/A'}</TableCell>
                          <TableCell>{formatDate(apt.appointment_date)}</TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(apt.status)}>
                              {apt.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
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
                          <TableCell>{formatDate(apt.appointment_date || apt.appointment_slot_date)}</TableCell>
                          <TableCell>{apt.appointment_type || 'Consultation'}</TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(apt.status || apt.appointment_status)}>
                              {apt.status || apt.appointment_status || 'scheduled'}
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