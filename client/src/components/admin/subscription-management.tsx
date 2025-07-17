import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { 
  Users, 
  Building2, 
  CreditCard, 
  Calendar,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Plus,
  Eye,
  Edit,
  Trash2
} from "lucide-react";

interface SubscriptionData {
  id: string;
  organizationName: string;
  contactEmail: string;
  contactPhone: string;
  plan: 'starter' | 'professional' | 'enterprise';
  status: 'active' | 'suspended' | 'pending' | 'cancelled';
  startDate: string;
  endDate: string;
  monthlyFee: number;
  maxUsers: number;
  currentUsers: number;
  features: string[];
  billingAddress: string;
  paymentMethod: string;
}

export default function SubscriptionManagement() {
  const [subscriptions, setSubscriptions] = useState<SubscriptionData[]>([]);
  const [filteredSubscriptions, setFilteredSubscriptions] = useState<SubscriptionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [planFilter, setPlanFilter] = useState<string>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<SubscriptionData | null>(null);

  // Sample subscription data for demonstration
  const sampleSubscriptions: SubscriptionData[] = [
    {
      id: '1',
      organizationName: 'Dubai Healthcare City',
      contactEmail: 'admin@dhcc.ae',
      contactPhone: '+971-4-362-4000',
      plan: 'enterprise',
      status: 'active',
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      monthlyFee: 2500,
      maxUsers: 100,
      currentUsers: 87,
      features: ['AI Chatbot', 'Face Recognition', 'Beauty Analysis', 'Analytics', 'Priority Support'],
      billingAddress: 'Healthcare City, Dubai, UAE',
      paymentMethod: 'Bank Transfer'
    },
    {
      id: '2',
      organizationName: 'American Hospital Dubai',
      contactEmail: 'it@ahdubai.com',
      contactPhone: '+971-4-336-7777',
      plan: 'professional',
      status: 'active',
      startDate: '2024-02-15',
      endDate: '2025-02-14',
      monthlyFee: 1200,
      maxUsers: 50,
      currentUsers: 42,
      features: ['AI Chatbot', 'Face Recognition', 'Beauty Analysis', 'Basic Analytics'],
      billingAddress: 'Oud Metha, Dubai, UAE',
      paymentMethod: 'Credit Card'
    },
    {
      id: '3',
      organizationName: 'Cleveland Clinic Abu Dhabi',
      contactEmail: 'support@clevelandclinicabudhabi.ae',
      contactPhone: '+971-2-501-9999',
      plan: 'starter',
      status: 'pending',
      startDate: '2024-07-01',
      endDate: '2025-06-30',
      monthlyFee: 500,
      maxUsers: 20,
      currentUsers: 0,
      features: ['AI Chatbot', 'Basic Analytics'],
      billingAddress: 'Al Maryah Island, Abu Dhabi, UAE',
      paymentMethod: 'Bank Transfer'
    },
    {
      id: '4',
      organizationName: 'Medcare Hospital',
      contactEmail: 'info@medcarehospital.com',
      contactPhone: '+971-4-407-0100',
      plan: 'professional',
      status: 'suspended',
      startDate: '2024-03-01',
      endDate: '2025-02-28',
      monthlyFee: 1200,
      maxUsers: 50,
      currentUsers: 35,
      features: ['AI Chatbot', 'Face Recognition', 'Beauty Analysis', 'Basic Analytics'],
      billingAddress: 'Al Safa, Dubai, UAE',
      paymentMethod: 'Credit Card'
    }
  ];

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setSubscriptions(sampleSubscriptions);
      setFilteredSubscriptions(sampleSubscriptions);
      setLoading(false);
    }, 1000);
  }, []);

  useEffect(() => {
    // Filter subscriptions based on search and filters
    let filtered = subscriptions;

    if (searchTerm) {
      filtered = filtered.filter(sub => 
        sub.organizationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.contactEmail.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(sub => sub.status === statusFilter);
    }

    if (planFilter !== 'all') {
      filtered = filtered.filter(sub => sub.plan === planFilter);
    }

    setFilteredSubscriptions(filtered);
  }, [subscriptions, searchTerm, statusFilter, planFilter]);

  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'bg-green-100 text-green-800',
      suspended: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800',
      cancelled: 'bg-gray-100 text-gray-800'
    };

    const icons = {
      active: <CheckCircle className="h-3 w-3" />,
      suspended: <XCircle className="h-3 w-3" />,
      pending: <RefreshCw className="h-3 w-3" />,
      cancelled: <AlertCircle className="h-3 w-3" />
    };

    return (
      <Badge className={`${variants[status as keyof typeof variants]} flex items-center gap-1`}>
        {icons[status as keyof typeof icons]}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getPlanBadge = (plan: string) => {
    const variants = {
      starter: 'bg-blue-100 text-blue-800',
      professional: 'bg-purple-100 text-purple-800',
      enterprise: 'bg-orange-100 text-orange-800'
    };

    return (
      <Badge className={variants[plan as keyof typeof variants]}>
        {plan.charAt(0).toUpperCase() + plan.slice(1)}
      </Badge>
    );
  };

  const handleStatusChange = async (subscriptionId: string, newStatus: string) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setSubscriptions(prev => 
        prev.map(sub => 
          sub.id === subscriptionId 
            ? { ...sub, status: newStatus as any }
            : sub
        )
      );

      toast({
        title: "Status Updated",
        description: `Subscription status has been updated to ${newStatus}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update subscription status",
        variant: "destructive",
      });
    }
  };

  const totalRevenue = subscriptions
    .filter(sub => sub.status === 'active')
    .reduce((sum, sub) => sum + sub.monthlyFee, 0);

  const totalUsers = subscriptions
    .filter(sub => sub.status === 'active')
    .reduce((sum, sub) => sum + sub.currentUsers, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-purple-600" />
        <span className="ml-2 text-lg">Loading subscriptions...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Stats */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Subscription Management</h2>
          <p className="text-gray-600">Manage hospital and clinic subscriptions</p>
        </div>
        <Button 
          onClick={() => setShowAddForm(true)}
          className="bg-purple-600 hover:bg-purple-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Subscription
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Building2 className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">Active Subscriptions</p>
                <p className="text-2xl font-bold">
                  {subscriptions.filter(sub => sub.status === 'active').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CreditCard className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">Monthly Revenue</p>
                <p className="text-2xl font-bold">${totalRevenue.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-2xl font-bold">{totalUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">Growth Rate</p>
                <p className="text-2xl font-bold">+12%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 bg-white p-4 rounded-lg shadow">
        <div className="flex-1 min-w-64">
          <Label htmlFor="search">Search Organizations</Label>
          <Input
            id="search"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="w-48">
          <Label htmlFor="status-filter">Status</Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="w-48">
          <Label htmlFor="plan-filter">Plan</Label>
          <Select value={planFilter} onValueChange={setPlanFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All Plans" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Plans</SelectItem>
              <SelectItem value="starter">Starter</SelectItem>
              <SelectItem value="professional">Professional</SelectItem>
              <SelectItem value="enterprise">Enterprise</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Organization
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Plan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Users
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Revenue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  End Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSubscriptions.map((subscription) => (
                <tr key={subscription.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {subscription.organizationName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {subscription.contactEmail}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getPlanBadge(subscription.plan)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(subscription.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {subscription.currentUsers} / {subscription.maxUsers}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${subscription.monthlyFee}/month
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(subscription.endDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setSelectedSubscription(subscription)}
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Select 
                        value={subscription.status}
                        onValueChange={(value) => handleStatusChange(subscription.id, value)}
                      >
                        <SelectTrigger className="w-24 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="suspended">Suspend</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="cancelled">Cancel</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Subscription Details Modal */}
      {selectedSubscription && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl mx-4 max-h-96 overflow-y-auto">
            <CardHeader>
              <CardTitle>Subscription Details</CardTitle>
              <CardDescription>{selectedSubscription.organizationName}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Contact Email</Label>
                  <p className="text-sm text-gray-600">{selectedSubscription.contactEmail}</p>
                </div>
                <div>
                  <Label>Contact Phone</Label>
                  <p className="text-sm text-gray-600">{selectedSubscription.contactPhone}</p>
                </div>
                <div>
                  <Label>Plan</Label>
                  <div>{getPlanBadge(selectedSubscription.plan)}</div>
                </div>
                <div>
                  <Label>Status</Label>
                  <div>{getStatusBadge(selectedSubscription.status)}</div>
                </div>
                <div>
                  <Label>Billing Address</Label>
                  <p className="text-sm text-gray-600">{selectedSubscription.billingAddress}</p>
                </div>
                <div>
                  <Label>Payment Method</Label>
                  <p className="text-sm text-gray-600">{selectedSubscription.paymentMethod}</p>
                </div>
              </div>
              
              <div>
                <Label>Features</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {selectedSubscription.features.map((feature, index) => (
                    <Badge key={index} variant="secondary">{feature}</Badge>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedSubscription(null)}
                >
                  Close
                </Button>
                <Button className="bg-purple-600 hover:bg-purple-700">
                  Edit Subscription
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}