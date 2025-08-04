import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { 
  Building2, 
  Users, 
  DollarSign, 
  Activity, 
  Settings,
  TrendingUp,
  Calendar,
  Shield,
  Plus,
  Search,
  Filter,
  Download,
  ChevronRight,
  UserCheck,
  Building,
  CreditCard,
  BarChart3,
  CalendarCheck,
  Receipt,
  UserCog,
  FileText,
  Stethoscope,
  Home,
  LogOut,
  Menu,
  X,
  Bell,
  UserCircle,
  RefreshCw,
  Eye,
  Clock,
  ChevronDown
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format } from 'date-fns';
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

interface TenantSummary {
  id: string;
  name: string;
  domain: string;
  status: 'active' | 'inactive' | 'suspended';
  subscription: {
    plan: string;
    status: string;
    expiresAt: string;
  };
  userCount: number;
  revenue: number;
  lastActive: string;
}

interface DashboardStats {
  totalTenants: number;
  activeTenants: number;
  totalUsers: number;
  monthlyRevenue: number;
  revenueGrowth: number;
  userGrowth: number;
  activeSubscriptions: number;
  churnRate: number;
}

const MedCorAdminDashboard: React.FC = () => {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeSection, setActiveSection] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedHospital, setSelectedHospital] = useState<string | null>(null);

  // Fetch dashboard statistics from superadmin API
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery<DashboardStats>({
    queryKey: ['/api/superadmin/stats'],
  });

  // Fetch tenants from superadmin API
  const { data: tenants, isLoading: tenantsLoading, refetch: refetchTenants } = useQuery<TenantSummary[]>({
    queryKey: ['/api/superadmin/tenants', searchTerm, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      
      return apiRequest(`/api/superadmin/tenants?${params.toString()}`);
    },
  });

  // Navigation items
  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'hospitals', label: 'Hospitals', icon: Building2 },
    { id: 'appointments', label: 'Appointments', icon: CalendarCheck },
    { id: 'billing', label: 'Billing & Revenue', icon: CreditCard },
    { id: 'doctors', label: 'Doctors', icon: Stethoscope },
    { id: 'patients', label: 'Patients', icon: Users },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleExportReport = async () => {
    try {
      const response = await fetch('/api/admin/export', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('medcor_admin_token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `medcor-report-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        toast({
          title: "Report Exported",
          description: "The report has been downloaded successfully.",
        });
      }
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export the report.",
        variant: "destructive",
      });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('medcor_admin_token');
    localStorage.removeItem('medcor_admin_user');
    setLocation('/medcor-admin/login');
  };

  const refreshData = () => {
    refetchStats();
    refetchTenants();
    toast({
      title: "Data Refreshed",
      description: "All data has been updated.",
    });
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Hospitals</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalTenants || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.activeTenants || 0} active
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalUsers?.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">
              +{stats?.userGrowth || 0}% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats?.monthlyRevenue?.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">
              +{stats?.revenueGrowth || 0}% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeSubscriptions || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.churnRate || 0}% churn rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Hospital Activity</CardTitle>
          <CardDescription>Latest updates from your hospital network</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {tenants?.slice(0, 5).map((tenant) => (
              <div key={tenant.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Building2 className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{tenant.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Last active {format(new Date(tenant.lastActive), 'PPp')}
                    </p>
                  </div>
                </div>
                <Badge variant={tenant.status === 'active' ? 'default' : 'secondary'}>
                  {tenant.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderHospitals = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Hospital Management</h2>
          <p className="text-muted-foreground">Manage all hospitals in your network</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Hospital
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search hospitals..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Hospitals Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Hospital Name</TableHead>
                <TableHead>Domain</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Users</TableHead>
                <TableHead>Monthly Revenue</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tenants?.map((tenant) => (
                <TableRow key={tenant.id}>
                  <TableCell className="font-medium">{tenant.name}</TableCell>
                  <TableCell>{tenant.domain}</TableCell>
                  <TableCell>
                    <Badge variant={tenant.status === 'active' ? 'default' : 'secondary'}>
                      {tenant.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {tenant.subscription.plan}
                    </Badge>
                  </TableCell>
                  <TableCell>{tenant.userCount}</TableCell>
                  <TableCell>${tenant.revenue.toLocaleString()}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedHospital(tenant.id)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
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
          <h2 className="text-2xl font-bold">Appointments Overview</h2>
          <p className="text-muted-foreground">Monitor appointments across all hospitals</p>
        </div>
        <Button variant="outline" onClick={refreshData}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Appointment Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Today's Appointments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">342</div>
            <p className="text-xs text-muted-foreground">Across all hospitals</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Upcoming This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,892</div>
            <p className="text-xs text-muted-foreground">Next 7 days</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Completed Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">298</div>
            <p className="text-xs text-muted-foreground">87% completion rate</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Cancellations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">44</div>
            <p className="text-xs text-muted-foreground text-red-600">13% cancellation rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Appointments */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Appointments</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Doctor</TableHead>
                <TableHead>Hospital</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>10:00 AM</TableCell>
                <TableCell>John Smith</TableCell>
                <TableCell>Dr. Sarah Johnson</TableCell>
                <TableCell>City General Hospital</TableCell>
                <TableCell>Consultation</TableCell>
                <TableCell>
                  <Badge variant="outline" className="bg-green-50">Completed</Badge>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>10:30 AM</TableCell>
                <TableCell>Emma Davis</TableCell>
                <TableCell>Dr. Michael Chen</TableCell>
                <TableCell>Memorial Medical Center</TableCell>
                <TableCell>Follow-up</TableCell>
                <TableCell>
                  <Badge variant="outline" className="bg-blue-50">In Progress</Badge>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>11:00 AM</TableCell>
                <TableCell>Robert Wilson</TableCell>
                <TableCell>Dr. Lisa Anderson</TableCell>
                <TableCell>Westside Clinic</TableCell>
                <TableCell>Check-up</TableCell>
                <TableCell>
                  <Badge variant="outline" className="bg-yellow-50">Scheduled</Badge>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );

  const renderBilling = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Billing & Revenue</h2>
          <p className="text-muted-foreground">Financial overview and billing management</p>
        </div>
        <Button onClick={handleExportReport}>
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Revenue Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total Revenue (MTD)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${stats?.monthlyRevenue?.toLocaleString() || 0}</div>
            <div className="flex items-center text-sm text-green-600 mt-2">
              <TrendingUp className="h-4 w-4 mr-1" />
              +{stats?.revenueGrowth || 0}% from last month
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Outstanding Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">$12,450</div>
            <p className="text-sm text-muted-foreground mt-2">14 pending invoices</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Average Revenue per Hospital</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">$908</div>
            <p className="text-sm text-muted-foreground mt-2">Per month</p>
          </CardContent>
        </Card>
      </div>

      {/* Billing Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Hospital</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Invoice</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>{format(new Date(), 'MMM dd, yyyy')}</TableCell>
                <TableCell>City General Hospital</TableCell>
                <TableCell>Professional</TableCell>
                <TableCell>$799.00</TableCell>
                <TableCell>
                  <Badge variant="outline" className="bg-green-50">Paid</Badge>
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm">
                    <Download className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>{format(new Date(Date.now() - 86400000), 'MMM dd, yyyy')}</TableCell>
                <TableCell>Memorial Medical Center</TableCell>
                <TableCell>Enterprise</TableCell>
                <TableCell>$1,499.00</TableCell>
                <TableCell>
                  <Badge variant="outline" className="bg-green-50">Paid</Badge>
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm">
                    <Download className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>{format(new Date(Date.now() - 172800000), 'MMM dd, yyyy')}</TableCell>
                <TableCell>Westside Clinic</TableCell>
                <TableCell>Basic</TableCell>
                <TableCell>$299.00</TableCell>
                <TableCell>
                  <Badge variant="outline" className="bg-yellow-50">Pending</Badge>
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm">
                    <Download className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );

  const renderDoctors = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Doctors Management</h2>
          <p className="text-muted-foreground">Overview of all doctors across hospitals</p>
        </div>
      </div>

      {/* Doctor Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Doctors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">487</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Active Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">312</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">On Leave</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">45</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">New This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">18</div>
          </CardContent>
        </Card>
      </div>

      {/* Doctors Table */}
      <Card>
        <CardHeader>
          <CardTitle>Doctor Directory</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Doctor Name</TableHead>
                <TableHead>Specialization</TableHead>
                <TableHead>Hospital</TableHead>
                <TableHead>Patients</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Dr. Sarah Johnson</TableCell>
                <TableCell>Cardiologist</TableCell>
                <TableCell>City General Hospital</TableCell>
                <TableCell>245</TableCell>
                <TableCell>4.8/5.0</TableCell>
                <TableCell>
                  <Badge variant="outline" className="bg-green-50">Active</Badge>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Dr. Michael Chen</TableCell>
                <TableCell>Neurologist</TableCell>
                <TableCell>Memorial Medical Center</TableCell>
                <TableCell>189</TableCell>
                <TableCell>4.9/5.0</TableCell>
                <TableCell>
                  <Badge variant="outline" className="bg-green-50">Active</Badge>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Dr. Lisa Anderson</TableCell>
                <TableCell>Pediatrician</TableCell>
                <TableCell>Westside Clinic</TableCell>
                <TableCell>312</TableCell>
                <TableCell>4.7/5.0</TableCell>
                <TableCell>
                  <Badge variant="outline" className="bg-yellow-50">On Leave</Badge>
                </TableCell>
              </TableRow>
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
          <h2 className="text-2xl font-bold">Patients Overview</h2>
          <p className="text-muted-foreground">Patient statistics across all hospitals</p>
        </div>
      </div>

      {/* Patient Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Patients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalUsers?.toLocaleString() || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">New This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,234</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Active Patients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8,923</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Satisfaction Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">94.2%</div>
          </CardContent>
        </Card>
      </div>

      {/* Patient Demographics */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Age Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">0-18 years</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div className="bg-purple-600 h-2 rounded-full" style={{ width: '18%' }}></div>
                  </div>
                  <span className="text-sm font-medium">18%</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">19-35 years</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div className="bg-purple-600 h-2 rounded-full" style={{ width: '32%' }}></div>
                  </div>
                  <span className="text-sm font-medium">32%</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">36-50 years</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div className="bg-purple-600 h-2 rounded-full" style={{ width: '28%' }}></div>
                  </div>
                  <span className="text-sm font-medium">28%</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">51+ years</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div className="bg-purple-600 h-2 rounded-full" style={{ width: '22%' }}></div>
                  </div>
                  <span className="text-sm font-medium">22%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Common Conditions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">Hypertension</span>
                <span className="text-sm font-medium">2,341 patients</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Diabetes</span>
                <span className="text-sm font-medium">1,892 patients</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Asthma</span>
                <span className="text-sm font-medium">1,234 patients</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Heart Disease</span>
                <span className="text-sm font-medium">987 patients</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderAnalytics = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Analytics & Insights</h2>
          <p className="text-muted-foreground">Platform performance and trends</p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Platform Usage Trends</CardTitle>
            <CardDescription>Daily active users over the last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
              <BarChart3 className="h-16 w-16 text-gray-400" />
              <span className="ml-4 text-gray-500">Chart placeholder</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue Growth</CardTitle>
            <CardDescription>Monthly revenue trends</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
              <TrendingUp className="h-16 w-16 text-gray-400" />
              <span className="ml-4 text-gray-500">Chart placeholder</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Feature Usage */}
      <Card>
        <CardHeader>
          <CardTitle>Feature Adoption</CardTitle>
          <CardDescription>Most used features across all hospitals</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm">AI Chat Assistant</span>
              <div className="flex items-center gap-2">
                <div className="w-48 bg-gray-200 rounded-full h-2">
                  <div className="bg-purple-600 h-2 rounded-full" style={{ width: '89%' }}></div>
                </div>
                <span className="text-sm font-medium">89%</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Appointment Scheduling</span>
              <div className="flex items-center gap-2">
                <div className="w-48 bg-gray-200 rounded-full h-2">
                  <div className="bg-purple-600 h-2 rounded-full" style={{ width: '76%' }}></div>
                </div>
                <span className="text-sm font-medium">76%</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Face Recognition Login</span>
              <div className="flex items-center gap-2">
                <div className="w-48 bg-gray-200 rounded-full h-2">
                  <div className="bg-purple-600 h-2 rounded-full" style={{ width: '62%' }}></div>
                </div>
                <span className="text-sm font-medium">62%</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Health Analysis Tools</span>
              <div className="flex items-center gap-2">
                <div className="w-48 bg-gray-200 rounded-full h-2">
                  <div className="bg-purple-600 h-2 rounded-full" style={{ width: '54%' }}></div>
                </div>
                <span className="text-sm font-medium">54%</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return renderDashboard();
      case 'hospitals':
        return renderHospitals();
      case 'appointments':
        return renderAppointments();
      case 'billing':
        return renderBilling();
      case 'doctors':
        return renderDoctors();
      case 'patients':
        return renderPatients();
      case 'analytics':
        return renderAnalytics();
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
            <h2 className="text-2xl font-bold">Platform Settings</h2>
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

  if (!localStorage.getItem('medcor_admin_token')) {
    setLocation('/medcor-admin/login');
    return null;
  }

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
              <Shield className="h-8 w-8 text-purple-600" />
              {!sidebarCollapsed && (
                <span className="ml-2 text-xl font-bold">MedCor Admin</span>
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
                  <AvatarImage src="/avatar-placeholder.png" alt="Admin" />
                  <AvatarFallback>MA</AvatarFallback>
                </Avatar>
                {!sidebarCollapsed && (
                  <>
                    <div className="ml-2 text-left">
                      <p className="text-sm font-medium">MedCor Admin</p>
                      <p className="text-xs text-muted-foreground">superadmin@medcor.ai</p>
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
          {statsLoading || tenantsLoading ? (
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
    </div>
  );
};

export default MedCorAdminDashboard;