import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MessageCircle, Heart, Sparkles, Users, Calendar, BookOpen, User, LogIn } from "lucide-react";
import { Link } from "wouter";
import FloatingChatButton from "@/components/floating-chat-button";
import MedcorChatModal from "@/components/medcor-chat-modal";
import { AuthModal } from "@/components/auth-modal";
import { useAuth } from "@/hooks/useAuth";

export default function Home() {
  const [showModal, setShowModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { login, isAuthenticated, user } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'patient') {
        window.location.href = '/patient-dashboard';
      } else if (user.role === 'doctor') {
        window.location.href = '/doctor-dashboard';
      }
    }
  }, [isAuthenticated, user]);

  const handleAuthSuccess = (token: string, user: any) => {
    login(token, user);
    setShowAuthModal(false);
    // Redirect to appropriate dashboard based on role
    if (user?.role === 'patient') {
      window.location.href = '/patient-dashboard';
    } else if (user?.role === 'doctor') {
      window.location.href = '/doctor-dashboard';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {/* Main Hero Section */}
      <section className="py-32">
        <div className="max-w-4xl mx-auto text-center px-4">
          <div className="mb-12">
            <div className="relative inline-block">
              <div className="w-32 h-32 mx-auto mb-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center shadow-2xl">
                <MessageCircle className="h-16 w-16 text-white" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <div className="w-3 h-3 bg-white rounded-full"></div>
              </div>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Medcor.ai
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
              Your AI-powered healthcare assistant with face recognition, interactive avatars, and comprehensive health analysis
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={() => setShowModal(true)}
                size="lg" 
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-4 text-lg"
              >
                <MessageCircle className="h-5 w-5 mr-2" />
                Start Chat
              </Button>
              <Link href="/chat">
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-purple-600 text-purple-600 hover:bg-purple-50 px-8 py-4 text-lg"
                >
                  <Calendar className="h-5 w-5 mr-2" />
                  Book Appointment
                </Button>
              </Link>
              <Button 
                onClick={() => setShowAuthModal(true)}
                size="lg" 
                variant="outline" 
                className="border-purple-600 text-purple-600 hover:bg-purple-50 px-8 py-4 text-lg"
              >
                <LogIn className="h-5 w-5 mr-2" />
                Login / Sign Up
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Cards */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Skin Analysis</h3>
                <p className="text-sm text-gray-600">AI-powered skin health assessment with personalized recommendations</p>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Hair Analysis</h3>
                <p className="text-sm text-gray-600">Comprehensive hair and scalp health evaluation</p>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Lips Analysis</h3>
                <p className="text-sm text-gray-600">Detailed lip health assessment and care guidance</p>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Face Recognition</h3>
                <p className="text-sm text-gray-600">Instant patient recognition and secure login</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Get Started</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer" onClick={() => setShowModal(true)}>
              <CardContent className="p-8 text-center">
                <MessageCircle className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Chat Now</h3>
                <p className="text-gray-600">Start instant conversation with AI assistant</p>
              </CardContent>
            </Card>

            <Link href="/appointments">
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer">
                <CardContent className="p-8 text-center">
                  <Calendar className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Book Appointment</h3>
                  <p className="text-gray-600">Schedule your visit with a doctor</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/doctors">
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer">
                <CardContent className="p-8 text-center">
                  <User className="h-12 w-12 text-green-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Find Doctors</h3>
                  <p className="text-gray-600">Browse our medical professionals</p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </section>

      {/* Floating Chat Button */}
      <FloatingChatButton />

      {/* Chat Modal */}
      <MedcorChatModal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
      />

      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  );
}