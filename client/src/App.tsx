import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Navbar from "@/components/navbar";
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
import PatientDashboard from "@/pages/PatientDashboardNew";
import DoctorDashboardEnhanced from "@/pages/DoctorDashboardEnhanced";
import Pricing from "@/pages/pricing";
import Signup from "@/pages/signup";
import Payment from "@/pages/payment";
import NotFound from "@/pages/not-found";
import TenantOverview from "@/pages/tenant-overview";
import { AuthModal } from "@/components/auth-modal";
import { ProtectedRoute } from "@/components/protected-route";
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
  
  console.log('Current routing - Location:', location, 'isMultiTenant:', isMultiTenant, 'tenant:', tenantInfo?.name);

  return (
    <>
      {/* Only show navbar on non-dashboard pages and non-tenant subdomains */}
      {!isDashboardRoute && !isMultiTenant && <Navbar onLoginClick={() => setShowAuthModal(true)} />}
      
      <Switch>
        {/* Public Routes */}
        <Route path="/">
          {isMultiTenant ? (
            <>
              {console.log('Rendering login page for multi-tenant:', tenantInfo?.name)}
              <Login />
            </>
          ) : (
            <>
              {console.log('Rendering Home page for public')}
              <Home onShowAuthModal={() => setShowAuthModal(true)} />
            </>
          )}
        </Route>
        <Route path="/pricing" component={Pricing} />
        <Route path="/signup" component={Signup} />
        <Route path="/payment" component={Payment} />
        <Route path="/chat" component={Chat} />
        
        {/* Authentication Routes */}
        <Route path="/login" component={Login} />
        <Route path="/admin/login" component={AdminLogin} />
        <Route path="/superadmin/login" component={MedCorAdminLogin} />
        
        {/* 4 Main Dashboard Routes */}
        
        {/* 1. Superadmin Dashboard - Multi-tenancy Management */}
        <Route path="/superadmin/dashboard">
          <MedCorAdminDashboard />
        </Route>
        
        {/* Tenant Overview - Shows all tenants and credentials */}
        <Route path="/tenants" component={TenantOverview} />
        
        {/* 2. Admin Dashboard - Hospital/Clinic Management */}
        <Route path="/admin/dashboard">
          <AdminDashboard />
        </Route>
        
        
        {/* 3. Doctor Dashboard - Hospital Tenant */}
        <Route path="/doctor/dashboard">
          <ProtectedRoute 
            allowedRoles={["doctor"]}
            onUnauthorized={() => setShowAuthModal(true)}
          >
            <DoctorDashboardEnhanced />
          </ProtectedRoute>
        </Route>
        
        {/* 4. Patient Dashboard - Hospital Tenant */}
        <Route path="/patient/dashboard">
          <ProtectedRoute 
            allowedRoles={["patient"]}
            onUnauthorized={() => setShowAuthModal(true)}
          >
            <PatientDashboard />
          </ProtectedRoute>
        </Route>
        
        {/* Protected Feature Routes */}
        <Route path="/doctors">
          <ProtectedRoute onUnauthorized={() => setShowAuthModal(true)}>
            <Doctors />
          </ProtectedRoute>
        </Route>
        <Route path="/appointments">
          <ProtectedRoute 
            allowedRoles={["patient", "doctor", "admin"]}
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
        
        {/* 404 Fallback */}
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
              case 'superadmin':
                window.location.href = '/superadmin/dashboard';
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

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background">
        <Router />
      </div>
      <Toaster />
    </TooltipProvider>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}