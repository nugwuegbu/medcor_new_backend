import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import FaceRecognition from "@/features/auth/components/face-recognition";
import { Camera, Mail, Phone, User, LogIn } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { FaApple, FaFacebook } from "react-icons/fa";

export default function Login() {
  const [sessionId] = useState(() => `session_${Date.now()}`);
  const [loginMethod, setLoginMethod] = useState<"face" | "oauth">("face");
  const [showPhoneInput, setShowPhoneInput] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const { toast } = useToast();

  // Face login mutation
  const faceLoginMutation = useMutation({
    mutationFn: async (data: { imageBase64: string; sessionId: string }) => {
      const response = await fetch("/api/auth/face-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
      });
      return await response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
        window.location.href = "/";
      } else {
        toast({
          title: "Face not recognized",
          description: data.message || "Please login with your account or register your face.",
          variant: "destructive"
        });
      }
    },
    onError: () => {
      toast({
        title: "Login failed",
        description: "An error occurred during face recognition.",
        variant: "destructive"
      });
    }
  });

  // Phone number update mutation
  const updatePhoneMutation = useMutation({
    mutationFn: async (phoneNumber: string) => {
      const response = await fetch("/api/auth/update-phone", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ phoneNumber })
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      window.location.href = "/";
    },
    onError: () => {
      toast({
        title: "Failed to update phone number",
        description: "Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleFaceRecognition = (result: any) => {
    if (result.imageBase64) {
      faceLoginMutation.mutate({
        imageBase64: result.imageBase64,
        sessionId
      });
    }
  };

  const handleOAuthLogin = (provider: string) => {
    window.location.href = `/api/auth/${provider}`;
  };

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (phoneNumber) {
      updatePhoneMutation.mutate(phoneNumber);
    }
  };

  // Check if user needs to complete profile
  const urlParams = new URLSearchParams(window.location.search);
  const needsProfile = urlParams.get("complete-profile") === "true";

  if (needsProfile || showPhoneInput) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Complete Your Profile
            </CardTitle>
            <CardDescription>
              Please provide your phone number for appointment reminders
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePhoneSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+971 50 123 4567"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required
                />
              </div>
              <Button 
                type="submit" 
                className="w-full"
                disabled={updatePhoneMutation.isPending}
              >
                {updatePhoneMutation.isPending ? "Saving..." : "Continue"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Welcome to MedCare AI</h1>
          <p className="text-gray-600">Your intelligent healthcare companion</p>
        </div>

        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle>Sign in to your account</CardTitle>
            <CardDescription>
              Choose your preferred login method
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={loginMethod} onValueChange={(v) => setLoginMethod(v as "face" | "oauth")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="face" className="flex items-center gap-2">
                  <Camera className="h-4 w-4" />
                  Face Recognition
                </TabsTrigger>
                <TabsTrigger value="oauth" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Social Login
                </TabsTrigger>
              </TabsList>

              <TabsContent value="face" className="space-y-4">
                <div className="text-center py-4">
                  <p className="text-sm text-gray-600 mb-4">
                    Quick and secure login with face recognition
                  </p>
                  <FaceRecognition
                    sessionId={sessionId}
                    onRecognitionComplete={handleFaceRecognition}
                    onLanguageDetected={() => {}}
                  />
                </div>
              </TabsContent>

              <TabsContent value="oauth" className="space-y-4">
                <div className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => handleOAuthLogin("google")}
                  >
                    <FcGoogle className="h-5 w-5 mr-2" />
                    Continue with Google
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => handleOAuthLogin("apple")}
                  >
                    <FaApple className="h-5 w-5 mr-2" />
                    Continue with Apple
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => handleOAuthLogin("facebook")}
                  >
                    <FaFacebook className="h-5 w-5 mr-2 text-blue-600" />
                    Continue with Facebook
                  </Button>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <Separator />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-muted-foreground">
                      First time?
                    </span>
                  </div>
                </div>

                <div className="text-center text-sm text-gray-600">
                  <p>Sign in with your social account to get started</p>
                  <p className="mt-2">After login, you can enable face recognition for faster access</p>
                </div>
              </TabsContent>
            </Tabs>


          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <div className="flex items-center justify-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span>Secure & Private</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              <span>HIPAA Compliant</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
              <span>AI Powered</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}