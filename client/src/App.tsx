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
import Pricing from "@/pages/pricing";
import Signup from "@/pages/signup";
import Payment from "@/pages/payment";
import Dashboard from "@/pages/dashboard";
import NotFound from "@/pages/not-found";
import { AuthModal } from "@/components/auth-modal";
import { ProtectedRoute } from "@/components/protected-route";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";

function Router() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [location] = useLocation();
  
  // Check if current route is a dashboard route
  const isDashboardRoute = location.includes('/dashboard');

  return (
    <>
      {/* Only show navbar on non-dashboard pages */}
      {!isDashboardRoute && <Navbar onLoginClick={() => setShowAuthModal(true)} />}
      
      <Switch>
        <Route path="/test" component={TestPage} />
        <Route path="/" component={Home} />
        <Route path="/pricing" component={Pricing} />
        <Route path="/signup" component={Signup} />
        <Route path="/payment" component={Payment} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/admin/dashboard">
          <Dashboard userRole="admin" />
        </Route>
        <Route path="/doctors/dashboard">
          <Dashboard userRole="doctor" />
        </Route>
        <Route path="/patients/dashboard">
          <Dashboard userRole="patient" />
        </Route>
        <Route path="/login" component={Login} />
        <Route path="/admin/login" component={AdminLogin} />
        <Route path="/admin/dashboard" component={AdminDashboard} />
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
        onAuthSuccess={() => setShowAuthModal(false)}
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
