import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  Plus
} from "lucide-react";
import { Link } from "wouter";

// Sample data for different hospitals
const sampleData = {
  hospitals: [
    {
      id: "medcor-main",
      name: "MedCor Main Hospital",
      subdomain: "medcormain.medcor.ai",
      type: "General Hospital",
      location: "New York, NY",
      totalDoctors: 45,
      totalPatients: 2840,
      activeChats: 24
    },
    {
      id: "heart-center",
      name: "Heart Care Center",
      subdomain: "heartcare.medcor.ai", 
      type: "Cardiology Specialist",
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

export default function Dashboard() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [userRole, setUserRole] = useState("admin"); // admin, doctor, patient
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedHospital, setSelectedHospital] = useState(sampleData.hospitals[0]);

  // Load data from localStorage or use sample data
  useEffect(() => {
    const savedHospital = localStorage.getItem('selectedHospital');
    if (savedHospital) {
      setSelectedHospital(JSON.parse(savedHospital));
    }
    
    const savedRole = localStorage.getItem('userRole');
    if (savedRole) {
      setUserRole(savedRole);
    }
  }, []);

  const sidebarItems = {
    admin: [
      { id: "overview", label: "Overview", icon: BarChart3 },
      { id: "doctors", label: "Doctors", icon: Stethoscope },
      { id: "patients", label: "Patients", icon: Users },
      { id: "appointments", label: "Appointments", icon: Calendar },
      { id: "analytics", label: "Analytics", icon: Activity },
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

  const filteredDoctors = sampleData.doctors.filter(doctor =>
    doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doctor.specialty.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Add Doctor
        </Button>
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDoctors.map((doctor) => (
          <Card key={doctor.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={doctor.avatar} />
                    <AvatarFallback>{doctor.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${getStatusColor(doctor.status)}`}></div>
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg">{doctor.name}</CardTitle>
                  <CardDescription>{doctor.specialty}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Experience:</span>
                  <p className="font-medium">{doctor.experience}</p>
                </div>
                <div>
                  <span className="text-gray-500">Patients:</span>
                  <p className="font-medium">{doctor.patients}</p>
                </div>
              </div>
              
              <div className="space-y-1 text-sm">
                <div className="flex items-center text-gray-600">
                  <Mail className="h-3 w-3 mr-2" />
                  {doctor.email}
                </div>
                <div className="flex items-center text-gray-600">
                  <Phone className="h-3 w-3 mr-2" />
                  {doctor.phone}
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
        ))}
      </div>
    </div>
  );

  const renderPatients = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Patients Management</h2>
          <p className="text-gray-600">Manage patient records and care</p>
        </div>
        <Button className="bg-green-600 hover:bg-green-700">
          <Plus className="h-4 w-4 mr-2" />
          Add Patient
        </Button>
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

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return renderOverview();
      case "doctors":
        return renderDoctors();
      case "patients":
        return renderPatients();
      case "appointments":
        return (
          <div className="text-center py-12">
            <Calendar className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-600">Appointments Management</h3>
            <p className="text-gray-500">Coming soon - Schedule and manage appointments</p>
          </div>
        );
      case "analytics":
        return (
          <div className="text-center py-12">
            <BarChart3 className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-600">Analytics Dashboard</h3>
            <p className="text-gray-500">Coming soon - Detailed analytics and reporting</p>
          </div>
        );
      case "chatbot":
        return (
          <div className="text-center py-12">
            <MessageSquare className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-600">Chatbot Configuration</h3>
            <p className="text-gray-500">Coming soon - Customize your AI chatbot settings</p>
          </div>
        );
      case "settings":
        return (
          <div className="text-center py-12">
            <Settings className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-600">System Settings</h3>
            <p className="text-gray-500">Coming soon - Platform configuration and preferences</p>
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
                <Building2 className="h-8 w-8 text-blue-600" />
                <span className="text-xl font-bold text-gray-800">MedCor</span>
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

        {/* Role Switcher */}
        {!sidebarCollapsed && (
          <div className="absolute bottom-4 left-4 right-4">
            <div className="bg-gray-100 p-3 rounded-lg">
              <Label className="text-xs text-gray-500">Switch Role</Label>
              <div className="flex space-x-1 mt-1">
                {['admin', 'doctor', 'patient'].map((role) => (
                  <Button
                    key={role}
                    variant={userRole === role ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setUserRole(role)}
                    className="text-xs flex-1"
                  >
                    {role}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white shadow-sm border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Menu className="h-6 w-6 text-gray-500 md:hidden" />
              <div>
                <h1 className="text-2xl font-bold text-gray-800 capitalize">{userRole} Dashboard</h1>
                <p className="text-sm text-gray-500">{selectedHospital.name}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
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