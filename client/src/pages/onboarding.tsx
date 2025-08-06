import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { GamifiedOnboarding } from "@/components/gamified-onboarding";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Trophy, Sparkles } from "lucide-react";

export default function OnboardingPage() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [onboardingComplete, setOnboardingComplete] = useState(false);

  useEffect(() => {
    // Check if user is authenticated
    if (!isAuthenticated) {
      setLocation('/');
      return;
    }

    // Check if onboarding was already completed
    const completed = localStorage.getItem(`onboarding_completed_${user?.id}`);
    if (completed === 'true') {
      // Redirect to appropriate dashboard
      redirectToDashboard();
    }
  }, [isAuthenticated, user, setLocation]);

  const redirectToDashboard = () => {
    if (!user) return;
    
    switch (user.role) {
      case 'patient':
        setLocation('/patient/dashboard');
        break;
      case 'doctor':
        setLocation('/doctor/dashboard');
        break;
      case 'admin':
        setLocation('/admin/dashboard');
        break;
      case 'clinic':
        setLocation('/dashboard');
        break;
      default:
        setLocation('/');
    }
  };

  const handleOnboardingComplete = () => {
    if (user) {
      // Mark onboarding as completed
      localStorage.setItem(`onboarding_completed_${user.id}`, 'true');
      setOnboardingComplete(true);
      
      // Show completion message briefly, then redirect
      setTimeout(() => {
        redirectToDashboard();
      }, 3000);
    }
  };

  const handleStepComplete = (stepId: string) => {
    console.log(`Onboarding step completed: ${stepId}`);
    // Here you could send analytics or update user progress in the database
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <p className="text-gray-600">Please log in to continue with onboarding.</p>
            <Button onClick={() => setLocation('/')} className="mt-4">
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (onboardingComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center">
                <Trophy className="h-10 w-10 text-white" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold text-green-600">
              Congratulations!
            </CardTitle>
            <p className="text-gray-600 text-lg">
              You've successfully completed the onboarding process
            </p>
          </CardHeader>
          <CardContent className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-6">
              <Sparkles className="h-5 w-5 text-yellow-500" />
              <span className="text-lg font-semibold">Welcome to MedCor AI!</span>
              <Sparkles className="h-5 w-5 text-yellow-500" />
            </div>
            <p className="text-gray-600 mb-6">
              Redirecting you to your dashboard in a few seconds...
            </p>
            <Button onClick={redirectToDashboard} size="lg">
              Go to Dashboard Now
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="container mx-auto py-8">
        <GamifiedOnboarding
          userRole={user.role as 'patient' | 'doctor' | 'admin' | 'clinic'}
          onStepComplete={handleStepComplete}
          onComplete={handleOnboardingComplete}
        />
      </div>
    </div>
  );
}