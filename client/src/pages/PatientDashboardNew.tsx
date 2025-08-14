import React, { useState } from 'react';
import { useLocation } from 'wouter';
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
  LogOut,
  Home,
  Heart,
  Download,
  Upload,
  Camera,
  BarChart3,
  TrendingUp,
  Bell,
  Settings,
  Shield,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Users,
  Filter,
  Search,
  Scan,
  FileDown,
  ChevronDown
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Demo Data Types (following API structure)
interface Appointment {
  id: number;
  patient_name: string;
  doctor_name: string;
  appointment_slot_date: string;
  appointment_slot_start_time: string;
  appointment_slot_end_time: string;
  appointment_status: string;
  status_display: string;
  treatment_name: string;
  created_at: string;
}

interface MedicalRecord {
  id: number;
  record_id: string;
  patient_name: string;
  date: string;
  diagnosis: string;
  files: Array<{
    id: number;
    file_name: string;
    file_size: number;
    file_url: string;
    uploaded_at: string;
  }>;
  created_at: string;
}

interface AnalysisRecord {
  id: number;
  analysis_type: 'skin' | 'hair' | 'lips';
  date: string;
  score: number;
  recommendations: string[];
  image_url?: string;
}

const PatientDashboard: React.FC = () => {
  const [, setLocation] = useLocation();
  const [activeView, setActiveView] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showNewAppointmentDialog, setShowNewAppointmentDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Demo patient data
  const patientInfo = {
    id: 1,
    first_name: 'John',
    last_name: 'Smith',
    email: 'john.smith@example.com',
    phone: '+1 (555) 123-4567',
    date_of_birth: '1985-06-15',
    blood_type: 'O+',
    allergies: ['Penicillin', 'Peanuts'],
    emergency_contact: 'Jane Smith - +1 (555) 987-6543',
    insurance_provider: 'Blue Cross Blue Shield',
    insurance_id: 'BC123456789',
    address: '123 Main St, New York, NY 10001'
  };

  // Demo appointments data
  const appointments: Appointment[] = [
    {
      id: 1,
      patient_name: 'John Smith',
      doctor_name: 'Dr. Emily Johnson',
      appointment_slot_date: '2025-01-20',
      appointment_slot_start_time: '10:00:00',
      appointment_slot_end_time: '10:30:00',
      appointment_status: 'scheduled',
      status_display: 'Scheduled',
      treatment_name: 'General Checkup',
      created_at: '2025-01-10T08:00:00Z'
    },
    {
      id: 2,
      patient_name: 'John Smith',
      doctor_name: 'Dr. Michael Chen',
      appointment_slot_date: '2025-01-25',
      appointment_slot_start_time: '14:00:00',
      appointment_slot_end_time: '14:45:00',
      appointment_status: 'scheduled',
      status_display: 'Scheduled',
      treatment_name: 'Cardiology Consultation',
      created_at: '2025-01-12T10:00:00Z'
    },
    {
      id: 3,
      patient_name: 'John Smith',
      doctor_name: 'Dr. Sarah Williams',
      appointment_slot_date: '2024-12-15',
      appointment_slot_start_time: '09:00:00',
      appointment_slot_end_time: '09:30:00',
      appointment_status: 'completed',
      status_display: 'Completed',
      treatment_name: 'Annual Physical',
      created_at: '2024-12-01T08:00:00Z'
    }
  ];

  // Demo medical records
  const medicalRecords: MedicalRecord[] = [
    {
      id: 1,
      record_id: 'MR-2024-001',
      patient_name: 'John Smith',
      date: '2024-12-15',
      diagnosis: 'Annual Physical Examination - All results normal',
      files: [
        {
          id: 1,
          file_name: 'blood_test_results.pdf',
          file_size: 245000,
          file_url: '/files/blood_test.pdf',
          uploaded_at: '2024-12-16T10:00:00Z'
        },
        {
          id: 2,
          file_name: 'xray_chest.pdf',
          file_size: 1024000,
          file_url: '/files/xray.pdf',
          uploaded_at: '2024-12-16T10:30:00Z'
        }
      ],
      created_at: '2024-12-15T14:00:00Z'
    },
    {
      id: 2,
      record_id: 'MR-2024-002',
      patient_name: 'John Smith',
      date: '2024-11-20',
      diagnosis: 'Hypertension follow-up',
      files: [
        {
          id: 3,
          file_name: 'bp_monitoring.pdf',
          file_size: 128000,
          file_url: '/files/bp.pdf',
          uploaded_at: '2024-11-20T15:00:00Z'
        }
      ],
      created_at: '2024-11-20T14:30:00Z'
    }
  ];

  // Demo analysis records
  const analysisRecords: AnalysisRecord[] = [
    {
      id: 1,
      analysis_type: 'skin',
      date: '2025-01-10',
      score: 85,
      recommendations: [
        'Increase water intake to 8 glasses daily',
        'Apply moisturizer twice daily',
        'Use SPF 30+ sunscreen'
      ],
      image_url: '/api/placeholder/200/200'
    },
    {
      id: 2,
      analysis_type: 'hair',
      date: '2025-01-05',
      score: 72,
      recommendations: [
        'Use sulfate-free shampoo',
        'Apply hair mask weekly',
        'Reduce heat styling'
      ],
      image_url: '/api/placeholder/200/200'
    },
    {
      id: 3,
      analysis_type: 'lips',
      date: '2024-12-28',
      score: 90,
      recommendations: [
        'Continue current lip care routine',
        'Stay hydrated'
      ],
      image_url: '/api/placeholder/200/200'
    }
  ];

  // Navigation items
  const navigationItems = [
    { id: 'overview', label: 'Overview', icon: Home, badge: null },
    { id: 'appointments', label: 'Appointments', icon: Calendar, badge: '2' },
    { id: 'medical-records', label: 'Medical Records', icon: FileText, badge: null },
    { id: 'analysis', label: 'Health Analysis', icon: Scan, badge: 'NEW' },
    { id: 'profile', label: 'Profile & Settings', icon: Settings, badge: null }
  ];

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

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Overview Page Component
  const OverviewPage = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Welcome back, {patientInfo.first_name}!</h2>
        <p className="text-gray-500">Here's your health overview</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">Next Appointment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Jan 20</div>
            <p className="text-xs text-gray-500 mt-1">10:00 AM with Dr. Johnson</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">Health Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold">85</div>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </div>
            <Progress value={85} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">Active Medications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-gray-500 mt-1">Next refill in 12 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">Recent Tests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
            <p className="text-xs text-gray-500 mt-1">All results normal</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {appointments.slice(0, 3).map((apt) => (
              <div key={apt.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="font-medium">{apt.treatment_name}</p>
                    <p className="text-sm text-gray-500">
                      {format(new Date(apt.appointment_slot_date), 'MMM d, yyyy')} with {apt.doctor_name}
                    </p>
                  </div>
                </div>
                <Badge variant={apt.appointment_status === 'completed' ? 'secondary' : 'default'}>
                  {apt.status_display}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Appointments Page Component
  const AppointmentsPage = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Appointments</h2>
          <p className="text-gray-500">Manage your medical appointments</p>
        </div>
        <Button onClick={() => setShowNewAppointmentDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Book Appointment
        </Button>
      </div>

      <Tabs defaultValue="upcoming">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="past">Past</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="mt-4">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Doctor</TableHead>
                  <TableHead>Treatment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {appointments
                  .filter(apt => apt.appointment_status === 'scheduled')
                  .map((apt) => (
                    <TableRow key={apt.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{format(new Date(apt.appointment_slot_date), 'MMM d, yyyy')}</p>
                          <p className="text-sm text-gray-500">
                            {apt.appointment_slot_start_time.slice(0, 5)} - {apt.appointment_slot_end_time.slice(0, 5)}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{apt.doctor_name}</TableCell>
                      <TableCell>{apt.treatment_name}</TableCell>
                      <TableCell>
                        <Badge>{apt.status_display}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedItem(apt);
                              setShowDeleteDialog(true);
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="past" className="mt-4">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Doctor</TableHead>
                  <TableHead>Treatment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {appointments
                  .filter(apt => apt.appointment_status === 'completed')
                  .map((apt) => (
                    <TableRow key={apt.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{format(new Date(apt.appointment_slot_date), 'MMM d, yyyy')}</p>
                          <p className="text-sm text-gray-500">
                            {apt.appointment_slot_start_time.slice(0, 5)}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{apt.doctor_name}</TableCell>
                      <TableCell>{apt.treatment_name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{apt.status_display}</Badge>
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline">
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );

  // Medical Records Page Component
  const MedicalRecordsPage = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Medical Records</h2>
          <p className="text-gray-500">Access your health documents</p>
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Search records..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-64"
          />
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        {medicalRecords.map((record) => (
          <Card key={record.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">
                    {record.diagnosis}
                  </CardTitle>
                  <CardDescription>
                    Record ID: {record.record_id} • {format(new Date(record.date), 'MMMM d, yyyy')}
                  </CardDescription>
                </div>
                <Badge variant="outline">
                  <FileText className="h-3 w-3 mr-1" />
                  {record.files.length} Files
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {record.files.map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-blue-500" />
                      <div>
                        <p className="font-medium">{file.file_name}</p>
                        <p className="text-sm text-gray-500">{formatFileSize(file.file_size)}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                      <Button size="sm" variant="outline">
                        <Download className="h-3 w-3 mr-1" />
                        Download
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  // Analysis Tracking Page Component
  const AnalysisTrackingPage = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Health Analysis</h2>
          <p className="text-gray-500">Track your skin, hair, and lips health</p>
        </div>
        <Button>
          <Camera className="h-4 w-4 mr-2" />
          New Analysis
        </Button>
      </div>

      {/* Analysis Type Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 bg-pink-100 rounded-lg">
                <Heart className="h-5 w-5 text-pink-600" />
              </div>
              Skin Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Last Score</span>
                <span className="text-2xl font-bold">85/100</span>
              </div>
              <Progress value={85} className="h-2" />
              <p className="text-xs text-gray-500">Last analyzed: Jan 10, 2025</p>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Activity className="h-5 w-5 text-purple-600" />
              </div>
              Hair Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Last Score</span>
                <span className="text-2xl font-bold">72/100</span>
              </div>
              <Progress value={72} className="h-2" />
              <p className="text-xs text-gray-500">Last analyzed: Jan 5, 2025</p>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 bg-red-100 rounded-lg">
                <Heart className="h-5 w-5 text-red-600" />
              </div>
              Lips Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Last Score</span>
                <span className="text-2xl font-bold">90/100</span>
              </div>
              <Progress value={90} className="h-2" />
              <p className="text-xs text-gray-500">Last analyzed: Dec 28, 2024</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analysis History */}
      <Card>
        <CardHeader>
          <CardTitle>Analysis History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Recommendations</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {analysisRecords.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="capitalize">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{record.analysis_type}</Badge>
                    </div>
                  </TableCell>
                  <TableCell>{format(new Date(record.date), 'MMM d, yyyy')}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{record.score}</span>
                      <Progress value={record.score} className="w-20 h-2" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <ul className="text-sm space-y-1">
                      {record.recommendations.slice(0, 2).map((rec, idx) => (
                        <li key={idx} className="text-gray-600">• {rec}</li>
                      ))}
                    </ul>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                      <Button size="sm" variant="outline">
                        <Download className="h-3 w-3 mr-1" />
                        Report
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

  // Profile & Settings Page Component
  const ProfileSettingsPage = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Profile & Settings</h2>
        <p className="text-gray-500">Manage your account and preferences</p>
      </div>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="medical">Medical Info</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>First Name</Label>
                  <Input value={patientInfo.first_name} />
                </div>
                <div>
                  <Label>Last Name</Label>
                  <Input value={patientInfo.last_name} />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input value={patientInfo.email} type="email" />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input value={patientInfo.phone} />
                </div>
                <div>
                  <Label>Date of Birth</Label>
                  <Input value={patientInfo.date_of_birth} type="date" />
                </div>
                <div>
                  <Label>Address</Label>
                  <Input value={patientInfo.address} />
                </div>
              </div>
              <div className="flex justify-end">
                <Button>Save Changes</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="medical" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Medical Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Blood Type</Label>
                  <Select defaultValue={patientInfo.blood_type}>
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
                  <Label>Emergency Contact</Label>
                  <Input value={patientInfo.emergency_contact} />
                </div>
                <div className="md:col-span-2">
                  <Label>Allergies</Label>
                  <Textarea 
                    value={patientInfo.allergies.join(', ')} 
                    placeholder="List any allergies"
                  />
                </div>
                <div>
                  <Label>Insurance Provider</Label>
                  <Input value={patientInfo.insurance_provider} />
                </div>
                <div>
                  <Label>Insurance ID</Label>
                  <Input value={patientInfo.insurance_id} />
                </div>
              </div>
              <div className="flex justify-end">
                <Button>Update Medical Info</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Appointment Reminders</p>
                    <p className="text-sm text-gray-500">Get notified about upcoming appointments</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Test Results</p>
                    <p className="text-sm text-gray-500">Receive alerts when test results are ready</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Medication Reminders</p>
                    <p className="text-sm text-gray-500">Get reminders to take your medications</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Health Tips</p>
                    <p className="text-sm text-gray-500">Receive personalized health recommendations</p>
                  </div>
                  <Switch />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="mt-4">
          <Card>
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
              </div>
              <div className="flex justify-end">
                <Button>Update Password</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-white border-b">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-2">
                <Heart className="h-6 w-6 text-blue-600" />
                <h1 className="text-xl font-bold">MedCare Patient Portal</h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm">
                <Bell className="h-5 w-5" />
              </Button>
              <Avatar>
                <AvatarFallback>
                  {patientInfo.first_name[0]}{patientInfo.last_name[0]}
                </AvatarFallback>
              </Avatar>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>

        <div className="flex">
          {/* Sidebar */}
          <aside className={cn(
            "fixed lg:sticky top-[57px] left-0 z-40 h-[calc(100vh-57px)] w-64 bg-white border-r transition-transform",
            sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          )}>
            <ScrollArea className="h-full py-4">
              <nav className="px-3 space-y-1">
                {navigationItems.map((item) => (
                  <Button
                    key={item.id}
                    variant={activeView === item.id ? "default" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => {
                      setActiveView(item.id);
                      setSidebarOpen(false);
                    }}
                  >
                    <item.icon className="h-4 w-4 mr-2" />
                    {item.label}
                    {item.badge && (
                      <Badge variant="secondary" className="ml-auto">
                        {item.badge}
                      </Badge>
                    )}
                  </Button>
                ))}
              </nav>
            </ScrollArea>
          </aside>

          {/* Main Content */}
          <main className="flex-1 p-6">
            <div className="max-w-7xl mx-auto">
              {activeView === 'overview' && <OverviewPage />}
              {activeView === 'appointments' && <AppointmentsPage />}
              {activeView === 'medical-records' && <MedicalRecordsPage />}
              {activeView === 'analysis' && <AnalysisTrackingPage />}
              {activeView === 'profile' && <ProfileSettingsPage />}
            </div>
          </main>
        </div>

        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* New Appointment Dialog */}
        <Dialog open={showNewAppointmentDialog} onOpenChange={setShowNewAppointmentDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Book New Appointment</DialogTitle>
              <DialogDescription>
                Schedule a new appointment with your healthcare provider
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Select Doctor</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a doctor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dr-johnson">Dr. Emily Johnson - General Practice</SelectItem>
                    <SelectItem value="dr-chen">Dr. Michael Chen - Cardiology</SelectItem>
                    <SelectItem value="dr-williams">Dr. Sarah Williams - Dermatology</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Appointment Date</Label>
                <Input type="date" />
              </div>
              <div>
                <Label>Preferred Time</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select time slot" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="09:00">09:00 AM</SelectItem>
                    <SelectItem value="10:00">10:00 AM</SelectItem>
                    <SelectItem value="11:00">11:00 AM</SelectItem>
                    <SelectItem value="14:00">02:00 PM</SelectItem>
                    <SelectItem value="15:00">03:00 PM</SelectItem>
                    <SelectItem value="16:00">04:00 PM</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Reason for Visit</Label>
                <Textarea placeholder="Briefly describe your symptoms or reason for the appointment" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewAppointmentDialog(false)}>
                Cancel
              </Button>
              <Button onClick={() => {
                toast({
                  title: "Appointment Requested",
                  description: "Your appointment request has been submitted. You'll receive a confirmation soon."
                });
                setShowNewAppointmentDialog(false);
              }}>
                Book Appointment
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
                This action cannot be undone. This will permanently cancel your appointment.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteItem}>
                Yes, cancel appointment
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
};

export default PatientDashboard;