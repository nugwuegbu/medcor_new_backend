import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Navbar from "@/components/navbar";
import TestPage from "./test-page";
import Home from "@/pages/home";
import Chat from "@/pages/chat";
import Doctors from "@/pages/doctors";
import Appointments from "@/pages/appointments";
import SettingsPage from "@/pages/settings";
import Login from "@/pages/login";
import AdminLogin from "@/pages/admin-login";
import AdminDashboard from "@/pages/admin-dashboard";
import MedCorAdminDashboard from "@/pages/MedCorAdminDashboard";
import MedCorAdminLogin from "@/pages/MedCorAdminLogin";
import DoctorDashboard from "@/pages/DoctorDashboard";
import StaffDashboard from "@/pages/StaffDashboard";
import PatientDashboard from "@/pages/PatientDashboard";
import EnhancedDoctorDashboard from "@/pages/EnhancedDoctorDashboard";
import Pricing from "@/pages/pricing";
import Signup from "@/pages/signup";
import Payment from "@/pages/payment";
import Dashboard from "@/pages/dashboard";
import NotFound from "@/pages/not-found";
import { AuthModal } from "@/components/auth-modal";
import { ProtectedRoute } from "@/components/protected-route";
import { useAuth } from "@/hooks/useAuth";
import { useSubdomain } from "@/hooks/useSubdomain";
import { useEffect, useState } from "react";

function Router() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [location] = useLocation();
  const { tenantInfo, isLoading, isMultiTenant } = useSubdomain();
  
  // Check if current route is a dashboard route
  const isDashboardRoute = location.includes('/dashboard');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading tenant configuration...</p>
        </div>
      </div>
    );
  }

  // For tenant subdomains, show tenant-specific dashboard by default
  if (isMultiTenant && location === '/') {
    console.log('Redirecting to Dashboard for tenant:', tenantInfo?.name);
    return <Dashboard tenantInfo={tenantInfo} />;
  }
  
  console.log('Current routing - Location:', location, 'isMultiTenant:', isMultiTenant, 'tenant:', tenantInfo?.name);

  return (
    <>
      {/* Only show navbar on non-dashboard pages and non-tenant subdomains */}
      {!isDashboardRoute && !isMultiTenant && <Navbar onLoginClick={() => setShowAuthModal(true)} />}
      
      <Switch>
        <Route path="/test" component={TestPage} />
        <Route path="/">
          {isMultiTenant ? (
            <>
              {console.log('Rendering Dashboard for multi-tenant:', tenantInfo?.name)}
              <Dashboard tenantInfo={tenantInfo} />
            </>
          ) : (
            <>
              {console.log('Rendering Home page for public tenant')}
              <Home />
            </>
          )}
        </Route>
        <Route path="/pricing" component={Pricing} />
        <Route path="/signup" component={Signup} />
        <Route path="/payment" component={Payment} />
        <Route path="/dashboard">
          <Dashboard tenantInfo={tenantInfo} />
        </Route>
        <Route path="/admin/dashboard">
          <Dashboard userRole="admin" tenantInfo={tenantInfo} />
        </Route>
        <Route path="/doctors/dashboard">
          <Dashboard userRole="doctor" tenantInfo={tenantInfo} />
        </Route>
        <Route path="/patients/dashboard">
          <Dashboard userRole="patient" tenantInfo={tenantInfo} />
        </Route>
        <Route path="/login" component={Login} />
        <Route path="/admin/login" component={AdminLogin} />
        <Route path="/admin/dashboard" component={AdminDashboard} />
        <Route path="/medcor-admin/login" component={MedCorAdminLogin} />
        <Route path="/medcor-admin">
          <MedCorAdminDashboard />
        </Route>
        <Route path="/doctor/dashboard">
          <ProtectedRoute 
            allowedRoles={["doctor"]}
            onUnauthorized={() => setShowAuthModal(true)}
          >
            <EnhancedDoctorDashboard />
          </ProtectedRoute>
        </Route>
        <Route path="/patient/dashboard">
          <ProtectedRoute 
            allowedRoles={["patient"]}
            onUnauthorized={() => setShowAuthModal(true)}
          >
            <PatientDashboard />
          </ProtectedRoute>
        </Route>
        <Route path="/staff/dashboard">
          <StaffDashboard />
        </Route>
        <Route path="/chat" component={Chat} />
        <Route path="/doctors">
          <ProtectedRoute onUnauthorized={() => setShowAuthModal(true)}>
            <Doctors />
          </ProtectedRoute>
        </Route>
        <Route path="/appointments">
          <ProtectedRoute 
            allowedRoles={["patient", "doctor", "clinic", "admin"]}
            onUnauthorized={() => setShowAuthModal(true)}
          >
            <Appointments />
          </ProtectedRoute>
        </Route>
        <Route path="/settings">
          <ProtectedRoute onUnauthorized={() => setShowAuthModal(true)}>
            <SettingsPage />
          </ProtectedRoute>
        </Route>
        <Route component={NotFound} />
      </Switch>
      
      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthSuccess={(token, user) => {
          setShowAuthModal(false);
          // Redirect based on user role
          if (user) {
            switch (user.role) {
              case 'doctor':
                window.location.href = '/doctor/dashboard';
                break;
              case 'patient':
                window.location.href = '/patient/dashboard';
                break;
              case 'admin':
                window.location.href = '/admin/dashboard';
                break;
              case 'clinic':
                window.location.href = '/dashboard';
                break;
              default:
                window.location.href = '/';
            }
          }
        }}
      />
    </>
  );
}

function AppContent() {
  console.log('App component rendering...');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { login } = useAuth();
  
  // Request location permission immediately on app load
  useEffect(() => {
    console.log('App useEffect running...');
    // Request geolocation permission
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log("Location permission granted:", position.coords);
          // Store in localStorage for later use
          localStorage.setItem('userLocation', JSON.stringify({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            timestamp: Date.now()
          }));
        },
        (error) => {
          console.log("Location permission denied or error:", error);
        },
        { enableHighAccuracy: true }
      );
    }
  }, []);

  const handleAuthSuccess = (token: string, user: any) => {
    login(token, user);
    setShowAuthModal(false);
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background">
        <Router />
        <AuthModal 
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onAuthSuccess={handleAuthSuccess}
        />
      </div>
      <Toaster />
    </TooltipProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}

export default App;
