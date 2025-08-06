import { useState, useEffect, useCallback, memo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { useSubdomain, type TenantInfo } from "@/hooks/useSubdomain";
import { TenantSwitcher } from "@/components/tenant-switcher";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Building2, 
  Users, 
  UserPlus, 
  Stethoscope, 
  Calendar, 
  MessageSquare,
  Settings,
  Menu,
  Search,
  Bell,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Activity,
  Heart,
  Clock,
  MapPin,
  Phone,
  Mail,
  Edit,
  Trash2,
  Eye,
  Plus,
  Download,
  Upload,
  X,
  Save,
  ArrowUpCircle,
  DollarSign,
  CreditCard,
  FileText,
  Zap,
  TrendingUp
} from "lucide-react";
import { Link } from "wouter";

// Sample data for different hospitals
const sampleData = {
  hospitals: [
    {
      id: "medcorhospital",
      name: "Medcor Hospital",
      subdomain: "medcorhospital.medcor.ai",
      type: "General Hospital",
      location: "New York, NY",
      totalDoctors: 45,
      totalPatients: 2840,
      activeChats: 24
    },
    {
      id: "medcorclinic",
      name: "Medcor Clinic",
      subdomain: "medcorclinic.medcor.ai", 
      type: "Specialized Clinic",
      location: "Los Angeles, CA",
      totalDoctors: 18,
      totalPatients: 1250,
      activeChats: 12
    }
  ],
  doctors: [
    {
      id: 1,
      name: "Dr. Emily Rodriguez",
      specialty: "Cardiology",
      experience: "12 years",
      patients: 145,
      status: "online",
      avatar: "/api/placeholder/64/64",
      email: "emily.rodriguez@medcor.ai",
      phone: "+1 (555) 123-4567",
      department: "Cardiology",
      schedule: "Mon-Fri 9AM-5PM"
    },
    {
      id: 2,
      name: "Dr. Michael Chen",
      specialty: "Neurology",
      experience: "8 years", 
      patients: 98,
      status: "offline",
      avatar: "/api/placeholder/64/64",
      email: "michael.chen@medcor.ai",
      phone: "+1 (555) 234-5678",
      department: "Neurology",
      schedule: "Tue-Sat 8AM-4PM"
    },
    {
      id: 3,
      name: "Dr. Sarah Johnson",
      specialty: "Pediatrics",
      experience: "15 years",
      patients: 203,
      status: "busy",
      avatar: "/api/placeholder/64/64",
      email: "sarah.johnson@medcor.ai",
      phone: "+1 (555) 345-6789",
      department: "Pediatrics",
      schedule: "Mon-Wed-Fri 10AM-6PM"
    }
  ],
  patients: [
    {
      id: 1,
      name: "John Smith",
      age: 45,
      condition: "Hypertension",
      lastVisit: "2024-07-20",
      assignedDoctor: "Dr. Emily Rodriguez",
      status: "stable",
      avatar: "/api/placeholder/64/64",
      email: "john.smith@email.com",
      phone: "+1 (555) 987-6543",
      address: "123 Main St, New York, NY"
    },
    {
      id: 2,
      name: "Maria Garcia",
      age: 32,
      condition: "Migraine",
      lastVisit: "2024-07-22",
      assignedDoctor: "Dr. Michael Chen",
      status: "improving",
      avatar: "/api/placeholder/64/64",
      email: "maria.garcia@email.com",
      phone: "+1 (555) 876-5432",
      address: "456 Oak Ave, Los Angeles, CA"
    },
    {
      id: 3,
      name: "David Wilson",
      age: 8,
      condition: "Asthma",
      lastVisit: "2024-07-18",
      assignedDoctor: "Dr. Sarah Johnson",
      status: "monitoring",
      avatar: "/api/placeholder/64/64",
      email: "parent@email.com",
      phone: "+1 (555) 765-4321",
      address: "789 Pine St, Chicago, IL"
    }
  ]
};

interface DashboardProps {
  userRole?: "admin" | "doctor" | "patient";
  tenantInfo?: TenantInfo | null;
}

export default function Dashboard({ userRole: propUserRole, tenantInfo }: DashboardProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [userRole, setUserRole] = useState(propUserRole || "admin");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedHospital, setSelectedHospital] = useState(sampleData.hospitals[0]);
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState<"add" | "edit">("add");
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [showKnowledgeBaseForm, setShowKnowledgeBaseForm] = useState(false);
  const [knowledgeBases, setKnowledgeBases] = useState([
    { id: 1, name: "General Medicine", topics: 1247, status: "Active" },
    { id: 2, name: "Cardiology Specialist", topics: 456, status: "Active" },
    { id: 3, name: "Emergency Procedures", topics: 89, status: "Inactive" }
  ]);
  const [kbName, setKbName] = useState("");
  const [kbDescription, setKbDescription] = useState("");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Form state for doctor creation
  const [doctorFormData, setDoctorFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    username: "",
    phone: "",
    specialty: "",
    experience: "",
    medicalLicense: "",
    department: "",
    consultationFee: "",
    qualifications: "",
    address: "",
    dateOfBirth: "",
    bloodType: "",
    languages: "",
    allergies: "",
    emergencyContact: "",
    emergencyPhone: ""
  });

  // Fetch doctors from Django backend
  const { data: doctorsData, isLoading: doctorsLoading, refetch: refetchDoctors } = useQuery({
    queryKey: ['/api/auth/doctors/'],
    queryFn: async () => {
      const token = localStorage.getItem('clinicToken') || localStorage.getItem('adminToken');
      const baseUrl = 'https://14b294fa-eeaf-46d5-a262-7c25b42c30d9-00-m9ex3vzr6khq.sisko.replit.dev:8000';
      
      const response = await fetch(`${baseUrl}/api/auth/doctors/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch doctors');
      }
      
      return response.json();
    },
    retry: false,
  });

  // Create doctor mutation
  const createDoctorMutation = useMutation({
    mutationFn: async (formData: any) => {
      const token = localStorage.getItem('clinicToken') || localStorage.getItem('adminToken');
      const baseUrl = 'https://14b294fa-eeaf-46d5-a262-7c25b42c30d9-00-m9ex3vzr6khq.sisko.replit.dev:8000';
      
      const payload = {
        email: formData.email,
        password: formData.password,
        first_name: formData.firstName,
        last_name: formData.lastName,
        username: formData.username || undefined,
        role: 'doctor',
        phone_number: formData.phone,
        address: formData.address,
        date_of_birth: formData.dateOfBirth || undefined,
        // Additional doctor fields
        specialty: formData.specialty,
        years_of_experience: parseInt(formData.experience) || 0,
        medical_license: formData.medicalLicense,
        department: formData.department,
        consultation_fee: parseFloat(formData.consultationFee) || 0,
        qualifications: formData.qualifications,
        languages_spoken: formData.languages,
        blood_type: formData.bloodType,
        allergies: formData.allergies,
        emergency_contact: formData.emergencyContact,
        emergency_phone: formData.emergencyPhone
      };

      const response = await fetch(`${baseUrl}/api/auth/users/create/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create doctor');
      }

      return data;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Doctor has been added successfully",
      });
      setShowForm(false);
      refetchDoctors();
      // Reset form
      setDoctorFormData({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        username: "",
        phone: "",
        specialty: "",
        experience: "",
        medicalLicense: "",
        department: "",
        consultationFee: "",
        qualifications: "",
        address: "",
        dateOfBirth: "",
        bloodType: "",
        languages: "",
        allergies: "",
        emergencyContact: "",
        emergencyPhone: ""
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create doctor",
        variant: "destructive",
      });
    },
  });

  // Load data from localStorage or use sample data
  useEffect(() => {
    const savedHospital = localStorage.getItem('selectedHospital');
    if (savedHospital) {
      setSelectedHospital(JSON.parse(savedHospital));
    }
    
    // Use tenant info if available
    if (tenantInfo && tenantInfo.subdomain !== "public") {
      const hospitalData = sampleData.hospitals.find(h => h.id === tenantInfo.id);
      if (hospitalData) {
        setSelectedHospital(hospitalData);
      }
    }
    
    // Use prop role instead of localStorage for role-based URLs
    if (propUserRole) {
      setUserRole(propUserRole);
    }
  }, [propUserRole, tenantInfo]);

  const sidebarItems = {
    admin: [
      { id: "overview", label: "Overview", icon: BarChart3 },
      { id: "doctors", label: "Doctors", icon: Stethoscope },
      { id: "patients", label: "Patients", icon: Users },
      { id: "appointments", label: "Appointments", icon: Calendar },
      { id: "records", label: "Medical Records", icon: Activity },
      { id: "analytics", label: "Analytics", icon: BarChart3 },
      { id: "billing", label: "Billing", icon: CreditCard },
      { id: "chatbot", label: "Chatbot Settings", icon: MessageSquare },
      { id: "settings", label: "Settings", icon: Settings }
    ],
    doctor: [
      { id: "overview", label: "My Dashboard", icon: BarChart3 },
      { id: "patients", label: "My Patients", icon: Users },
      { id: "appointments", label: "Appointments", icon: Calendar },
      { id: "schedule", label: "Schedule", icon: Clock },
      { id: "messages", label: "Messages", icon: MessageSquare },
      { id: "profile", label: "Profile", icon: Settings }
    ],
    patient: [
      { id: "overview", label: "My Health", icon: Heart },
      { id: "appointments", label: "Appointments", icon: Calendar },
      { id: "doctors", label: "My Doctors", icon: Stethoscope },
      { id: "messages", label: "Messages", icon: MessageSquare },
      { id: "records", label: "Medical Records", icon: Activity },
      { id: "profile", label: "Profile", icon: Settings }
    ]
  };

  // Use fetched doctors data or fall back to sample data
  const doctorsToDisplay = doctorsData || sampleData.doctors;
  
  const filteredDoctors = doctorsToDisplay.filter((doctor: any) => {
    const doctorName = doctor.name || `${doctor.first_name || ''} ${doctor.last_name || ''}`.trim();
    const doctorSpecialty = doctor.specialty || '';
    return (
      doctorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctorSpecialty.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const filteredPatients = sampleData.patients.filter(patient =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.condition.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online": return "bg-green-500";
      case "offline": return "bg-gray-500";
      case "busy": return "bg-red-500";
      case "stable": return "bg-blue-500";
      case "improving": return "bg-green-500";
      case "monitoring": return "bg-yellow-500";
      default: return "bg-gray-500";
    }
  };

  const handleAddKnowledgeBase = (name: string, description: string) => {
    const newKnowledgeBase = {
      id: knowledgeBases.length + 1,
      name: name,
      topics: 0,
      status: "Active"
    };
    setKnowledgeBases([...knowledgeBases, newKnowledgeBase]);
    setShowKnowledgeBaseForm(false);
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Hospital Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 rounded-xl text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{selectedHospital.name}</h1>
            <p className="text-blue-100">{selectedHospital.subdomain}</p>
            <div className="flex items-center space-x-4 mt-2">
              <Badge className="bg-white/20 text-white">
                {selectedHospital.type}
              </Badge>
              <span className="flex items-center text-sm">
                <MapPin className="h-4 w-4 mr-1" />
                {selectedHospital.location}
              </span>
            </div>
          </div>
          <Building2 className="h-16 w-16 opacity-50" />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Doctors</CardTitle>
            <Stethoscope className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{selectedHospital.totalDoctors}</div>
            <p className="text-xs text-muted-foreground">Active medical staff</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{selectedHospital.totalPatients}</div>
            <p className="text-xs text-muted-foreground">Registered patients</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Chats</CardTitle>
            <MessageSquare className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{selectedHospital.activeChats}</div>
            <p className="text-xs text-muted-foreground">AI chatbot sessions</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest updates from your healthcare platform</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { time: "10:30 AM", action: "New patient registered", user: "Maria Garcia", type: "patient" },
              { time: "09:45 AM", action: "Appointment scheduled", user: "Dr. Emily Rodriguez", type: "appointment" },
              { time: "09:15 AM", action: "Chatbot conversation completed", user: "John Smith", type: "chat" },
              { time: "08:30 AM", action: "Doctor profile updated", user: "Dr. Michael Chen", type: "doctor" }
            ].map((activity, index) => (
              <div key={index} className="flex items-center space-x-4 p-2 hover:bg-gray-50 rounded-lg">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{activity.action}</p>
                  <p className="text-xs text-gray-500">{activity.user} • {activity.time}</p>
                </div>
                <Badge variant="outline" className="text-xs">
                  {activity.type}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderDoctors = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Doctors Management</h2>
          <p className="text-gray-600">Manage your medical staff</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => exportToCSV(sampleData.doctors, "doctors-list.csv")}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => {
            setFormType("add");
            setSelectedItem(null);
            setShowForm(true);
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Doctor
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search doctors by name or specialty..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Doctors Grid */}
      {doctorsLoading ? (
        <div className="flex justify-center py-8">
          <p>Loading doctors...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDoctors.map((doctor: any) => {
            const doctorName = doctor.name || `Dr. ${doctor.first_name || ''} ${doctor.last_name || ''}`.trim();
            const initials = doctorName.split(' ').map((n: string) => n[0]).join('').toUpperCase();
            
            return (
              <Card key={doctor.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                        {initials.slice(0, 3)}
                      </div>
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg">{doctorName}</CardTitle>
                      <CardDescription>{doctor.specialty || 'General Practice'}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Experience:</span>
                      <p className="font-medium">{doctor.years_of_experience || doctor.experience || '0'} years</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Patients:</span>
                      <p className="font-medium">{doctor.patient_count || doctor.patients || '0'}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center text-gray-600">
                      <Mail className="h-3 w-3 mr-2" />
                      {doctor.email}
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Phone className="h-3 w-3 mr-2" />
                      {doctor.phone_number || doctor.phone || 'Not provided'}
                    </div>
                  </div>

                  <div className="flex justify-between pt-3 border-t">
                    <Button variant="outline" size="sm">
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Button>
                    <Button variant="outline" size="sm">
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                      <Trash2 className="h-3 w-3 mr-1" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderPatients = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Patients Management</h2>
          <p className="text-gray-600">Manage patient records and care</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => exportToCSV(sampleData.patients, "patients-list.csv")}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button className="bg-green-600 hover:bg-green-700" onClick={() => {
            setFormType("add");
            setSelectedItem(null);
            setShowForm(true);
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Patient
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search patients by name or condition..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Patients Table */}
      <Card>
        <CardHeader>
          <CardTitle>Patient Records</CardTitle>
          <CardDescription>Complete list of registered patients</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredPatients.map((patient) => (
              <div key={patient.id} className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={patient.avatar} />
                  <AvatarFallback>{patient.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                
                <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <p className="font-medium">{patient.name}</p>
                    <p className="text-sm text-gray-500">Age: {patient.age}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Condition</p>
                    <p className="font-medium">{patient.condition}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Assigned Doctor</p>
                    <p className="font-medium">{patient.assignedDoctor}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Last Visit</p>
                    <p className="font-medium">{patient.lastVisit}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Badge className={getStatusColor(patient.status) + " text-white"}>
                    {patient.status}
                  </Badge>
                  <div className="flex space-x-1">
                    <Button variant="ghost" size="sm">
                      <Eye className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-red-600">
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // CSV Export Functions
  const exportToCSV = (data: any[], filename: string) => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + Object.keys(data[0]).join(",") + "\n"
      + data.map(row => Object.values(row).join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Memoized handlers for form inputs to prevent re-renders
  const updateDoctorField = useCallback((field: string, value: string) => {
    setDoctorFormData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  // Form Components - Memoized to prevent unnecessary re-renders
  const DoctorForm = memo(() => {
    const handleSubmit = useCallback(() => {
      // Validate required fields
      if (!doctorFormData.firstName || !doctorFormData.lastName || !doctorFormData.email || 
          !doctorFormData.password || !doctorFormData.specialty) {
        toast({
          title: "Validation Error",
          description: "Please fill in all required fields",
          variant: "destructive",
        });
        return;
      }

      // Validate password length
      if (doctorFormData.password.length < 8) {
        toast({
          title: "Validation Error",
          description: "Password must be at least 8 characters",
          variant: "destructive",
        });
        return;
      }

      // Submit the form
      createDoctorMutation.mutate(doctorFormData);
    }, [doctorFormData]);

    return (
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{formType === "add" ? "Add New Doctor" : "Edit Doctor"}</DialogTitle>
            <DialogDescription>
              {formType === "add" ? "Add a new doctor to your medical team" : "Update doctor information"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {/* Basic Information Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-700">Basic Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input 
                    id="firstName" 
                    placeholder="John" 
                    value={doctorFormData.firstName}
                    onChange={(e) => updateDoctorField('firstName', e.target.value)}
                    required 
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input 
                    id="lastName" 
                    placeholder="Smith" 
                    value={doctorFormData.lastName}
                    onChange={(e) => updateDoctorField('lastName', e.target.value)}
                    required 
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="doctor@hospital.com" 
                    value={doctorFormData.email}
                    onChange={(e) => updateDoctorField('email', e.target.value)}
                    required 
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input 
                    id="phone" 
                    placeholder="+1 (555) 123-4567" 
                    value={doctorFormData.phone}
                    onChange={(e) => updateDoctorField('phone', e.target.value)}
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
                    placeholder="Minimum 8 characters" 
                    value={doctorFormData.password}
                    onChange={(e) => updateDoctorField('password', e.target.value)}
                    required 
                  />
                  <p className="text-xs text-gray-500 mt-1">Must be at least 8 characters</p>
                </div>
                <div>
                  <Label htmlFor="username">Username (Optional)</Label>
                  <Input 
                    id="username" 
                    placeholder="dr.smith" 
                    value={doctorFormData.username}
                    onChange={(e) => updateDoctorField('username', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Professional Information Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-700">Professional Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="specialty">Specialty *</Label>
                  <Select 
                    value={doctorFormData.specialty}
                    onValueChange={(value) => updateDoctorField('specialty', value)}
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
                  <Label htmlFor="experience">Years of Experience</Label>
                  <Input 
                    id="experience" 
                    type="number" 
                    min="0" 
                    placeholder="10" 
                    value={doctorFormData.experience}
                    onChange={(e) => updateDoctorField('experience', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="medicalLicense">Medical License Number</Label>
                  <Input 
                    id="medicalLicense" 
                    placeholder="MD123456" 
                    value={doctorFormData.medicalLicense}
                    onChange={(e) => updateDoctorField('medicalLicense', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="department">Department</Label>
                  <Select 
                    value={doctorFormData.department}
                    onValueChange={(value) => updateDoctorField('department', value)}
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
                  <Label htmlFor="consultationFee">Consultation Fee ($)</Label>
                  <Input 
                    id="consultationFee" 
                    type="number" 
                    min="0" 
                    placeholder="150" 
                    value={doctorFormData.consultationFee}
                    onChange={(e) => updateDoctorField('consultationFee', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="qualifications">Qualifications</Label>
                  <Input 
                    id="qualifications" 
                    placeholder="MD, PhD, Board Certified" 
                    value={doctorFormData.qualifications}
                    onChange={(e) => updateDoctorField('qualifications', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Additional Information Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-700">Additional Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="address">Address</Label>
                  <Input 
                    id="address" 
                    placeholder="123 Medical Street, City, State, ZIP" 
                    value={doctorFormData.address}
                    onChange={(e) => updateDoctorField('address', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="dateOfBirth">Date of Birth</Label>
                  <Input 
                    id="dateOfBirth" 
                    type="date" 
                    value={doctorFormData.dateOfBirth}
                    onChange={(e) => updateDoctorField('dateOfBirth', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="bloodType">Blood Type</Label>
                  <Select 
                    value={doctorFormData.bloodType}
                    onValueChange={(value) => updateDoctorField('bloodType', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select blood type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A+">A+</SelectItem>
                      <SelectItem value="A-">A-</SelectItem>
                      <SelectItem value="B+">B+</SelectItem>
                      <SelectItem value="B-">B-</SelectItem>
                      <SelectItem value="AB+">AB+</SelectItem>
                      <SelectItem value="AB-">AB-</SelectItem>
                      <SelectItem value="O+">O+</SelectItem>
                      <SelectItem value="O-">O-</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="languages">Languages Spoken</Label>
                  <Input 
                    id="languages" 
                    placeholder="English, Spanish" 
                    value={doctorFormData.languages}
                    onChange={(e) => updateDoctorField('languages', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="allergies">Known Allergies</Label>
                  <Input 
                    id="allergies" 
                    placeholder="Penicillin, Latex, etc." 
                    value={doctorFormData.allergies}
                    onChange={(e) => updateDoctorField('allergies', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Emergency Contact Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-700">Emergency Contact</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="emergencyContact">Contact Name</Label>
                  <Input 
                    id="emergencyContact" 
                    placeholder="Jane Doe" 
                    value={doctorFormData.emergencyContact}
                    onChange={(e) => updateDoctorField('emergencyContact', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="emergencyPhone">Contact Phone</Label>
                  <Input 
                    id="emergencyPhone" 
                    type="tel" 
                    placeholder="+1 (555) 987-6543" 
                    value={doctorFormData.emergencyPhone}
                    onChange={(e) => updateDoctorField('emergencyPhone', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-end space-x-2 mt-6">
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={createDoctorMutation.isPending}>
              {createDoctorMutation.isPending ? (
                <>Loading...</>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  {formType === "add" ? "Add Doctor" : "Update Doctor"}
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  });

  const PatientForm = () => (
    <Dialog open={showForm} onOpenChange={setShowForm}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{formType === "add" ? "Add New Patient" : "Edit Patient"}</DialogTitle>
          <DialogDescription>
            {formType === "add" ? "Register a new patient" : "Update patient information"}
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="patientName">Full Name</Label>
            <Input id="patientName" placeholder="John Smith" />
          </div>
          <div>
            <Label htmlFor="age">Age</Label>
            <Input id="age" type="number" placeholder="35" />
          </div>
          <div>
            <Label htmlFor="patientEmail">Email</Label>
            <Input id="patientEmail" type="email" placeholder="patient@email.com" />
          </div>
          <div>
            <Label htmlFor="patientPhone">Phone</Label>
            <Input id="patientPhone" placeholder="+1 (555) 123-4567" />
          </div>
          <div>
            <Label htmlFor="condition">Primary Condition</Label>
            <Input id="condition" placeholder="Hypertension" />
          </div>
          <div>
            <Label htmlFor="doctor">Assigned Doctor</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select doctor" />
              </SelectTrigger>
              <SelectContent>
                {sampleData.doctors.map(doctor => (
                  <SelectItem key={doctor.id} value={doctor.name}>{doctor.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2">
            <Label htmlFor="address">Address</Label>
            <Textarea id="address" placeholder="123 Main St, City, State" />
          </div>
        </div>
        <div className="flex justify-end space-x-2 mt-6">
          <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
          <Button onClick={() => setShowForm(false)}>
            <Save className="h-4 w-4 mr-2" />
            {formType === "add" ? "Add Patient" : "Update Patient"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  // Billing Component
  const renderBilling = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Billing & Subscription</h2>
          <p className="text-gray-600">Manage your subscription and billing information</p>
        </div>
      </div>

      {/* Current Plan */}
      <Card>
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
          <CardDescription>Your active subscription details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-blue-600">Professional Plan</h3>
              <p className="text-gray-600">$199/month • Up to 1000 patients</p>
              <p className="text-sm text-gray-500">Next billing: February 25, 2025</p>
            </div>
            <Badge className="bg-green-100 text-green-800">Active</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Upgrade Options */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle>Basic</CardTitle>
            <CardDescription>Perfect for small clinics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">$99<span className="text-lg text-gray-500">/mo</span></div>
            <ul className="mt-4 space-y-2 text-sm">
              <li>• Up to 500 patients</li>
              <li>• Basic chatbot</li>
              <li>• Email support</li>
              <li>• Standard analytics</li>
            </ul>
            <Button variant="outline" className="w-full mt-4">Current Plan</Button>
          </CardContent>
        </Card>

        <Card className="border-blue-500 ring-2 ring-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-600">Professional</CardTitle>
            <CardDescription>Most popular choice</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">$199<span className="text-lg text-gray-500">/mo</span></div>
            <ul className="mt-4 space-y-2 text-sm">
              <li>• Up to 1000 patients</li>
              <li>• Advanced AI chatbot</li>
              <li>• Priority support</li>
              <li>• Advanced analytics</li>
              <li>• Custom branding</li>
            </ul>
            <Button className="w-full mt-4 bg-blue-600">
              <ArrowUpCircle className="h-4 w-4 mr-2" />
              Upgrade Now
            </Button>
          </CardContent>
        </Card>

        <Card className="border-purple-500">
          <CardHeader>
            <CardTitle className="text-purple-600">Enterprise</CardTitle>
            <CardDescription>For large hospitals</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">$499<span className="text-lg text-gray-500">/mo</span></div>
            <ul className="mt-4 space-y-2 text-sm">
              <li>• Unlimited patients</li>
              <li>• Custom AI training</li>
              <li>• 24/7 phone support</li>
              <li>• Custom integrations</li>
              <li>• Dedicated account manager</li>
            </ul>
            <Button variant="outline" className="w-full mt-4 border-purple-500 text-purple-600">
              <ArrowUpCircle className="h-4 w-4 mr-2" />
              Upgrade
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  // Analytics Component
  const renderAnalytics = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
          <p className="text-gray-600">Comprehensive insights and reporting</p>
        </div>
        <Button onClick={() => exportToCSV([
          {metric: "Total Chats", value: 1250},
          {metric: "Patient Satisfaction", value: "94%"},
          {metric: "Response Time", value: "2.3s"}
        ], "analytics-report.csv")}>
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Conversations</CardTitle>
            <MessageSquare className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">1,250</div>
            <p className="text-xs text-muted-foreground">+18% from last month</p>
            <Progress value={75} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Patient Satisfaction</CardTitle>
            <Heart className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">94%</div>
            <p className="text-xs text-muted-foreground">+5% from last month</p>
            <Progress value={94} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">2.3s</div>
            <p className="text-xs text-muted-foreground">-0.5s from last month</p>
            <Progress value={85} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue Growth</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">+24%</div>
            <p className="text-xs text-muted-foreground">Monthly growth rate</p>
            <Progress value={90} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Chat Volume Trends</CardTitle>
            <CardDescription>Daily conversation volume over the last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <BarChart3 className="h-16 w-16 mx-auto text-blue-400 mb-4" />
                <p className="text-gray-600">Interactive chart component</p>
                <p className="text-sm text-gray-500">Real-time data visualization</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Patient Demographics</CardTitle>
            <CardDescription>Age and condition distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <Users className="h-16 w-16 mx-auto text-green-400 mb-4" />
                <p className="text-gray-600">Demographic breakdown</p>
                <p className="text-sm text-gray-500">Patient insights and trends</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  // Medical Records Component
  const renderMedicalRecords = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Medical Records</h2>
          <p className="text-gray-600">Centralized patient medical records management</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={() => exportToCSV(sampleData.patients, "medical-records.csv")}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button>
            <Upload className="h-4 w-4 mr-2" />
            Import Records
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Records</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2,847</div>
            <p className="text-xs text-gray-500">Active patient records</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">156</div>
            <p className="text-xs text-gray-500">New records added</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">23</div>
            <p className="text-xs text-gray-500">Require attention</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">78%</div>
            <Progress value={78} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Records Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Medical Records</CardTitle>
          <CardDescription>Latest patient medical records and documents</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              {name: "John Smith", type: "Lab Results", date: "2024-07-23", status: "Complete"},
              {name: "Maria Garcia", type: "X-Ray Report", date: "2024-07-22", status: "Pending"},
              {name: "David Wilson", type: "Blood Test", date: "2024-07-21", status: "Complete"},
              {name: "Sarah Johnson", type: "MRI Scan", date: "2024-07-20", status: "Review"}
            ].map((record, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <FileText className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="font-medium">{record.name}</p>
                    <p className="text-sm text-gray-500">{record.type} • {record.date}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={record.status === "Complete" ? "default" : "secondary"}>
                    {record.status}
                  </Badge>
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Chatbot Settings Component
  const renderChatbotSettings = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Chatbot Configuration</h2>
          <p className="text-gray-600">Customize your AI chatbot settings and behavior</p>
        </div>
        <Button>
          <Save className="h-4 w-4 mr-2" />
          Save Changes
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* General Settings */}
        <Card>
          <CardHeader>
            <CardTitle>General Settings</CardTitle>
            <CardDescription>Basic chatbot configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="botName">Bot Name</Label>
              <Input id="botName" defaultValue="MedCor Assistant" />
            </div>
            <div>
              <Label htmlFor="greeting">Welcome Message</Label>
              <Textarea id="greeting" defaultValue="Hello! I'm your AI medical assistant. How can I help you today?" />
            </div>
            <div>
              <Label htmlFor="language">Primary Language</Label>
              <Select defaultValue="english">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="english">English</SelectItem>
                  <SelectItem value="spanish">Spanish</SelectItem>
                  <SelectItem value="french">French</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* AI Model Settings */}
        <Card>
          <CardHeader>
            <CardTitle>AI Model Configuration</CardTitle>
            <CardDescription>Advanced AI behavior settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="model">AI Model</Label>
              <Select defaultValue="gpt4">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gpt4">GPT-4 (Recommended)</SelectItem>
                  <SelectItem value="gpt3.5">GPT-3.5 Turbo</SelectItem>
                  <SelectItem value="claude">Claude 3 Sonnet</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Response Style</Label>
              <div className="flex space-x-2 mt-2">
                <Button variant="outline" size="sm">Professional</Button>
                <Button variant="default" size="sm">Friendly</Button>
                <Button variant="outline" size="sm">Concise</Button>
              </div>
            </div>
            <div>
              <Label htmlFor="temperature">Creativity Level</Label>
              <Progress value={30} className="mt-2" />
              <p className="text-xs text-gray-500 mt-1">Conservative responses for medical accuracy</p>
            </div>
          </CardContent>
        </Card>

        {/* Knowledge Base */}
        <Card>
          <CardHeader>
            <CardTitle>Knowledge Base</CardTitle>
            <CardDescription>Manage chatbot's medical knowledge</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              {knowledgeBases.map((kb) => (
                <div key={kb.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{kb.name}</p>
                    <p className="text-sm text-gray-500">{kb.topics.toLocaleString()} medical topics</p>
                  </div>
                  <Badge className={kb.status === "Active" ? "bg-green-100 text-green-800" : ""}
                         variant={kb.status === "Active" ? "default" : "outline"}>
                    {kb.status}
                  </Badge>
                </div>
              ))}
            </div>
            <Dialog open={showKnowledgeBaseForm} onOpenChange={setShowKnowledgeBaseForm}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Knowledge Base
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Knowledge Base</DialogTitle>
                  <DialogDescription>
                    Create a new medical knowledge base for your chatbot
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="kb-name">Knowledge Base Name</Label>
                    <Input
                      id="kb-name"
                      placeholder="e.g., Pediatric Medicine"
                      onChange={(e) => setKbName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="kb-description">Description</Label>
                    <Textarea
                      id="kb-description"
                      placeholder="Describe the medical topics this knowledge base will cover..."
                      onChange={(e) => setKbDescription(e.target.value)}
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setShowKnowledgeBaseForm(false)}>
                      Cancel
                    </Button>
                    <Button onClick={() => {
                      if (kbName.trim()) {
                        handleAddKnowledgeBase(kbName, kbDescription);
                        setKbName('');
                        setKbDescription('');
                      }
                    }}>
                      Add Knowledge Base
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Metrics</CardTitle>
            <CardDescription>Real-time chatbot performance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm">Response Accuracy</span>
                <span className="text-sm font-medium">94%</span>
              </div>
              <Progress value={94} />
              
              <div className="flex justify-between">
                <span className="text-sm">User Satisfaction</span>
                <span className="text-sm font-medium">4.8/5</span>
              </div>
              <Progress value={96} />
              
              <div className="flex justify-between">
                <span className="text-sm">Response Speed</span>
                <span className="text-sm font-medium">1.2s avg</span>
              </div>
              <Progress value={88} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  // Updated renderContent function
  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return renderOverview();
      case "doctors":
        return (
          <>
            {renderDoctors()}
            <DoctorForm />
          </>
        );
      case "patients":
        return (
          <>
            {renderPatients()}
            <PatientForm />
          </>
        );
      case "appointments":
        return (
          <div className="text-center py-12">
            <Calendar className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-600">Appointments Management</h3>
            <p className="text-gray-500">Schedule and manage patient appointments</p>
          </div>
        );
      case "records":
        return renderMedicalRecords();
      case "analytics":
        return renderAnalytics();
      case "billing":
        return renderBilling();
      case "chatbot":
        return renderChatbotSettings();
      case "settings":
        return (
          <div className="text-center py-12">
            <Settings className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-600">System Settings</h3>
            <p className="text-gray-500">Platform configuration and preferences</p>
          </div>
        );
      default:
        return renderOverview();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className={`bg-white shadow-lg transition-all duration-300 ${sidebarCollapsed ? 'w-16' : 'w-64'}`}>
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            {!sidebarCollapsed && (
              <div className="flex items-center space-x-2">
                <Building2 
                  className="h-8 w-8" 
                  style={{ color: tenantInfo?.branding?.primaryColor || '#2563eb' }}
                />
                <span className="text-xl font-bold text-gray-800">
                  {tenantInfo && tenantInfo.subdomain !== "public" ? tenantInfo.name : "MedCor"}
                </span>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-1"
            >
              {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <nav className="p-4 space-y-2">
          {sidebarItems[userRole as keyof typeof sidebarItems].map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                  activeTab === item.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon className="h-5 w-5" />
                {!sidebarCollapsed && <span className="font-medium">{item.label}</span>}
              </button>
            );
          })}
        </nav>


      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col transition-all duration-300">
        {/* Header */}
        <header className="bg-white shadow-sm border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Menu className="h-6 w-6 text-gray-500 md:hidden" />
              <div>
                <h1 className="text-2xl font-bold text-gray-800 capitalize">
                  {userRole} Dashboard
                  {tenantInfo && tenantInfo.subdomain !== "public" && (
                    <Badge 
                      className="ml-2 text-xs" 
                      style={{ 
                        backgroundColor: tenantInfo.branding?.primaryColor || '#2563eb',
                        color: 'white'
                      }}
                    >
                      {tenantInfo.name}
                    </Badge>
                  )}
                </h1>
                <p className="text-sm text-gray-500">
                  {tenantInfo ? tenantInfo.description : selectedHospital.name}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <TenantSwitcher />
              <Button variant="ghost" size="sm">
                <Bell className="h-5 w-5" />
              </Button>
              <Avatar className="h-8 w-8">
                <AvatarFallback>AD</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}