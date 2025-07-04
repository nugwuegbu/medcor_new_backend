import { Switch, Route } from "wouter";
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
import NotFound from "@/pages/not-found";
import { useEffect } from "react";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/chat" component={Chat} />
      <Route path="/doctors" component={Doctors} />
      <Route path="/appointments" component={Appointments} />
      <Route path="/settings" component={SettingsPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // Request location permission immediately on app load
  useEffect(() => {
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
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-background">
          <Navbar />
          <Router />
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
