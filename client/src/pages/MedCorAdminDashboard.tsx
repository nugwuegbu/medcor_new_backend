import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
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
  PieChart,
  LineChart,
  Package
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format } from 'date-fns';
import { apiRequest } from '@/lib/queryClient';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState('30d');

  // Fetch dashboard statistics
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ['/api/admin/stats'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch tenants list
  const { data: tenants, isLoading: tenantsLoading } = useQuery<TenantSummary[]>({
    queryKey: ['/api/admin/tenants', { search: searchTerm, status: statusFilter }],
  });

  // Filter tenants based on search and status
  const filteredTenants = tenants?.filter(tenant => {
    const matchesSearch = tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tenant.domain.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || tenant.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  const handleExportData = async () => {
    try {
      const response = await apiRequest('/api/admin/export', {
        method: 'POST',
        body: JSON.stringify({ dateRange }),
      });
      
      // Handle file download
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `medcor-admin-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      a.click();
      
      toast({
        title: "Export Successful",
        description: "Admin report has been downloaded.",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export admin data.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">MedCor Admin Dashboard</h1>
              <p className="text-gray-600 mt-1">Manage hospitals, subscriptions, and platform operations</p>
            </div>
            <div className="flex items-center gap-3">
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                  <SelectItem value="1y">Last year</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleExportData} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
              <Button className="bg-purple-600 hover:bg-purple-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Hospital
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {/* Stats Cards */}
        {statsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {[1, 2, 3, 4].map(i => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                    <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Hospitals</p>
                    <p className="text-2xl font-bold mt-1">{stats?.totalTenants || 0}</p>
                    <p className="text-sm text-green-600 mt-1">
                      {stats?.activeTenants || 0} active
                    </p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Building2 className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Users</p>
                    <p className="text-2xl font-bold mt-1">{stats?.totalUsers || 0}</p>
                    <p className="text-sm text-green-600 mt-1 flex items-center">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      {stats?.userGrowth || 0}% growth
                    </p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Monthly Revenue</p>
                    <p className="text-2xl font-bold mt-1">${stats?.monthlyRevenue?.toLocaleString() || 0}</p>
                    <p className="text-sm text-green-600 mt-1 flex items-center">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      {stats?.revenueGrowth || 0}% growth
                    </p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-lg">
                    <DollarSign className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Active Subscriptions</p>
                    <p className="text-2xl font-bold mt-1">{stats?.activeSubscriptions || 0}</p>
                    <p className="text-sm text-orange-600 mt-1">
                      {stats?.churnRate || 0}% churn rate
                    </p>
                  </div>
                  <div className="p-3 bg-orange-100 rounded-lg">
                    <CreditCard className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs Section */}
        <Tabs defaultValue="hospitals" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5 max-w-3xl">
            <TabsTrigger value="hospitals">Hospitals</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Hospitals Tab */}
          <TabsContent value="hospitals" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Hospital Management</CardTitle>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <Input
                        placeholder="Search hospitals..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 w-64"
                      />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="suspended">Suspended</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {tenantsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="animate-pulse bg-gray-100 h-20 rounded-lg"></div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredTenants.map((tenant) => (
                      <div
                        key={tenant.id}
                        className="p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="p-2 bg-purple-100 rounded-lg">
                              <Building className="h-5 w-5 text-purple-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold">{tenant.name}</h3>
                              <p className="text-sm text-gray-600">{tenant.domain}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-6">
                            <div className="text-right">
                              <p className="text-sm font-medium">{tenant.userCount} users</p>
                              <p className="text-sm text-gray-600">${tenant.revenue.toLocaleString()}/mo</p>
                            </div>
                            <Badge
                              variant={tenant.status === 'active' ? 'default' : 'secondary'}
                              className={
                                tenant.status === 'active' ? 'bg-green-100 text-green-800' :
                                tenant.status === 'suspended' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                              }
                            >
                              {tenant.status}
                            </Badge>
                            <ChevronRight className="h-5 w-5 text-gray-400" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Trends</CardTitle>
                  <CardDescription>Monthly revenue over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                    <LineChart className="h-12 w-12 text-gray-400" />
                    <p className="ml-2 text-gray-500">Revenue chart visualization</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>User Growth</CardTitle>
                  <CardDescription>Platform user growth trends</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                    <BarChart3 className="h-12 w-12 text-gray-400" />
                    <p className="ml-2 text-gray-500">User growth chart</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Subscription Distribution</CardTitle>
                  <CardDescription>Breakdown by plan type</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                    <PieChart className="h-12 w-12 text-gray-400" />
                    <p className="ml-2 text-gray-500">Subscription breakdown</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Feature Usage</CardTitle>
                  <CardDescription>Most used platform features</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">AI Consultations</span>
                      <span className="text-sm font-medium">85%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-purple-600 h-2 rounded-full" style={{ width: '85%' }}></div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Face Analysis</span>
                      <span className="text-sm font-medium">72%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-purple-600 h-2 rounded-full" style={{ width: '72%' }}></div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Appointment Booking</span>
                      <span className="text-sm font-medium">68%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-purple-600 h-2 rounded-full" style={{ width: '68%' }}></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Subscriptions Tab */}
          <TabsContent value="subscriptions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Subscription Management</CardTitle>
                <CardDescription>Manage hospital subscription plans and billing</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="border-2 border-gray-200">
                    <CardHeader>
                      <CardTitle className="text-lg">Basic Plan</CardTitle>
                      <CardDescription>For small clinics</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold">$299<span className="text-sm font-normal">/month</span></p>
                      <ul className="mt-4 space-y-2 text-sm">
                        <li>✓ Up to 100 patients</li>
                        <li>✓ Basic AI consultations</li>
                        <li>✓ Email support</li>
                      </ul>
                      <p className="mt-4 text-sm text-gray-600">12 hospitals subscribed</p>
                    </CardContent>
                  </Card>

                  <Card className="border-2 border-purple-600">
                    <CardHeader>
                      <CardTitle className="text-lg">Professional</CardTitle>
                      <CardDescription>Most popular</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold">$799<span className="text-sm font-normal">/month</span></p>
                      <ul className="mt-4 space-y-2 text-sm">
                        <li>✓ Up to 1,000 patients</li>
                        <li>✓ Advanced AI features</li>
                        <li>✓ Priority support</li>
                        <li>✓ Custom branding</li>
                      </ul>
                      <p className="mt-4 text-sm text-gray-600">28 hospitals subscribed</p>
                    </CardContent>
                  </Card>

                  <Card className="border-2 border-gray-200">
                    <CardHeader>
                      <CardTitle className="text-lg">Enterprise</CardTitle>
                      <CardDescription>For large hospitals</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold">Custom</p>
                      <ul className="mt-4 space-y-2 text-sm">
                        <li>✓ Unlimited patients</li>
                        <li>✓ All AI features</li>
                        <li>✓ Dedicated support</li>
                        <li>✓ API access</li>
                        <li>✓ Custom integrations</li>
                      </ul>
                      <p className="mt-4 text-sm text-gray-600">8 hospitals subscribed</p>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Platform Users</CardTitle>
                <CardDescription>Manage MedCor admin users and permissions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-100 rounded-full">
                        <UserCheck className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium">Admin User</p>
                        <p className="text-sm text-gray-600">admin@medcor.ai</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge>Super Admin</Badge>
                      <Button variant="outline" size="sm">Manage</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Platform Settings</CardTitle>
                <CardDescription>Configure global platform settings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="font-medium mb-3">Security Settings</h3>
                    <div className="space-y-3">
                      <label className="flex items-center gap-3">
                        <input type="checkbox" className="rounded" defaultChecked />
                        <span className="text-sm">Require 2FA for admin users</span>
                      </label>
                      <label className="flex items-center gap-3">
                        <input type="checkbox" className="rounded" defaultChecked />
                        <span className="text-sm">Enable audit logging</span>
                      </label>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-3">API Configuration</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium">API Rate Limit</label>
                        <Input type="number" defaultValue="1000" className="mt-1 w-32" />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MedCorAdminDashboard;