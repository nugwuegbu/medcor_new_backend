import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Copy, Globe, Users, Building, Key, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface Tenant {
  id: number;
  name: string;
  domain: string;
  subdomain: string;
  status: string;
  plan: string;
  users: {
    role: string;
    email: string;
    password: string;
  }[];
}

export default function TenantOverview() {
  const { toast } = useToast();
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  const tenants: Tenant[] = [
    {
      id: 1,
      name: 'MedCor Main Platform',
      domain: 'medcor.ai',
      subdomain: 'app',
      status: 'Active',
      plan: 'Enterprise',
      users: [
        { role: 'Superadmin', email: 'admin@medcor.ai', password: 'Admin123!' },
        { role: 'Clinic Admin', email: 'clinic@medcor.ai', password: 'Clinic123!' },
        { role: 'Doctor', email: 'doctor@medcor.ai', password: 'Doctor123!' },
        { role: 'Patient', email: 'patient@medcor.ai', password: 'Patient123!' },
      ]
    },
    {
      id: 2,
      name: 'City General Hospital',
      domain: 'citygeneral.medcor.ai',
      subdomain: 'citygeneral',
      status: 'Active',
      plan: 'Professional',
      users: [
        { role: 'Admin', email: 'admin@citygeneral.medcor.ai', password: 'CityAdmin123!' },
        { role: 'Doctor', email: 'dr.smith@citygeneral.medcor.ai', password: 'Smith123!' },
        { role: 'Doctor', email: 'dr.johnson@citygeneral.medcor.ai', password: 'Johnson123!' },
        { role: 'Patient', email: 'john.doe@citygeneral.medcor.ai', password: 'Patient123!' },
      ]
    },
    {
      id: 3,
      name: 'Wellness Clinic',
      domain: 'wellness.medcor.ai',
      subdomain: 'wellness',
      status: 'Active',
      plan: 'Standard',
      users: [
        { role: 'Admin', email: 'admin@wellness.medcor.ai', password: 'WellAdmin123!' },
        { role: 'Doctor', email: 'dr.garcia@wellness.medcor.ai', password: 'Garcia123!' },
        { role: 'Nurse', email: 'nurse.mary@wellness.medcor.ai', password: 'Nurse123!' },
        { role: 'Patient', email: 'jane.smith@wellness.medcor.ai', password: 'Patient123!' },
      ]
    },
    {
      id: 4,
      name: 'Premium Care Center',
      domain: 'premiumcare.medcor.ai',
      subdomain: 'premiumcare',
      status: 'Active',
      plan: 'Enterprise',
      users: [
        { role: 'Admin', email: 'admin@premiumcare.medcor.ai', password: 'PremAdmin123!' },
        { role: 'Doctor', email: 'dr.patel@premiumcare.medcor.ai', password: 'Patel123!' },
        { role: 'Doctor', email: 'dr.kim@premiumcare.medcor.ai', password: 'Kim123!' },
        { role: 'Patient', email: 'vip.client@premiumcare.medcor.ai', password: 'VIP123!' },
      ]
    },
    {
      id: 5,
      name: 'Community Health Services',
      domain: 'community.medcor.ai',
      subdomain: 'community',
      status: 'Trial',
      plan: 'Basic',
      users: [
        { role: 'Admin', email: 'admin@community.medcor.ai', password: 'CommAdmin123!' },
        { role: 'Doctor', email: 'dr.wilson@community.medcor.ai', password: 'Wilson123!' },
        { role: 'Patient', email: 'community.user@community.medcor.ai', password: 'User123!' },
      ]
    }
  ];

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedItem(label);
    toast({
      title: 'Copied!',
      description: `${label} copied to clipboard`,
    });
    setTimeout(() => setCopiedItem(null), 2000);
  };

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'superadmin': return 'bg-purple-100 text-purple-800';
      case 'admin': return 'bg-red-100 text-red-800';
      case 'clinic admin': return 'bg-orange-100 text-orange-800';
      case 'doctor': return 'bg-blue-100 text-blue-800';
      case 'nurse': return 'bg-green-100 text-green-800';
      case 'patient': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan.toLowerCase()) {
      case 'enterprise': return 'bg-gradient-to-r from-purple-500 to-pink-500';
      case 'professional': return 'bg-gradient-to-r from-blue-500 to-cyan-500';
      case 'standard': return 'bg-gradient-to-r from-green-500 to-teal-500';
      case 'basic': return 'bg-gradient-to-r from-gray-500 to-gray-600';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-3xl font-bold text-gray-900">Multi-Tenant Platform Overview</h1>
          <p className="text-gray-600 mt-2">Complete tenant information with access credentials</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Tenants</p>
                  <p className="text-2xl font-bold">{tenants.length}</p>
                </div>
                <Building className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Tenants</p>
                  <p className="text-2xl font-bold">{tenants.filter(t => t.status === 'Active').length}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold">{tenants.reduce((acc, t) => acc + t.users.length, 0)}</p>
                </div>
                <Users className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Enterprise Plans</p>
                  <p className="text-2xl font-bold">{tenants.filter(t => t.plan === 'Enterprise').length}</p>
                </div>
                <Key className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tenant Cards */}
        {tenants.map((tenant) => (
          <Card key={tenant.id} className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl flex items-center gap-2">
                    {tenant.name}
                    <Badge className={getPlanColor(tenant.plan) + ' text-white'}>
                      {tenant.plan}
                    </Badge>
                  </CardTitle>
                  <CardDescription className="flex items-center gap-4 mt-2">
                    <span className="flex items-center gap-1">
                      <Globe className="h-4 w-4" />
                      {tenant.domain}
                    </span>
                    <Badge variant={tenant.status === 'Active' ? 'default' : 'secondary'}>
                      {tenant.status}
                    </Badge>
                  </CardDescription>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Tenant ID</p>
                  <p className="font-mono text-lg">#{tenant.id.toString().padStart(4, '0')}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="font-semibold">Role</TableHead>
                    <TableHead className="font-semibold">Email</TableHead>
                    <TableHead className="font-semibold">Password</TableHead>
                    <TableHead className="font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tenant.users.map((user, idx) => (
                    <TableRow key={idx} className="hover:bg-gray-50 transition-colors">
                      <TableCell>
                        <Badge className={getRoleColor(user.role)}>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {user.email}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {user.password}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(user.email, 'Email')}
                            className="h-8"
                          >
                            <Copy className="h-3 w-3 mr-1" />
                            {copiedItem === 'Email' ? 'Copied!' : 'Copy Email'}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(user.password, 'Password')}
                            className="h-8"
                          >
                            <Copy className="h-3 w-3 mr-1" />
                            {copiedItem === 'Password' ? 'Copied!' : 'Copy Pass'}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))}

        {/* Quick Access Section */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Access URLs</CardTitle>
            <CardDescription>Direct links to different tenant portals</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tenants.map((tenant) => (
                <div key={tenant.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{tenant.name}</p>
                    <p className="text-sm text-gray-600">https://{tenant.domain}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(`https://${tenant.domain}`, '_blank')}
                  >
                    <Globe className="h-4 w-4 mr-1" />
                    Visit
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card className="bg-yellow-50 border-yellow-200">
          <CardHeader>
            <CardTitle className="text-yellow-900">Important Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-yellow-800">
            <p>• All passwords follow the pattern: Role/Name + 123! for easy memorization</p>
            <p>• Superadmin account (admin@medcor.ai) has full platform access across all tenants</p>
            <p>• Each tenant has isolated data and cannot access other tenant information</p>
            <p>• Trial tenants have limited features and expire after 30 days</p>
            <p>• Use subdomain routing to access specific tenant portals</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}