import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle, Users, Calendar, Shield, Clock, Phone } from "lucide-react";
import { Link } from "wouter";
import FaqSection from "@/components/faq-section";
import FloatingChatButton from "@/components/floating-chat-button";
import MedcorChatModal from "@/components/medcor-chat-modal";

export default function Home() {
  const [showModal, setShowModal] = useState(false);

  // Auto-show modal when users first visit
  useEffect(() => {
    const hasVisited = localStorage.getItem('medcor-visited');
    if (!hasVisited) {
      const timer = setTimeout(() => {
        setShowModal(true);
        localStorage.setItem('medcor-visited', 'true');
      }, 1500); // Show after 1.5 seconds
      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="medical-gradient text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Welcome to Medcor.ai
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
              Experience revolutionary healthcare with face recognition, interactive AI avatars, and instant multi-language support. 
              Your personalized medical journey starts here.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/chat">
                <Button size="lg" className="bg-white text-primary hover:bg-gray-100">
                  <MessageCircle className="h-5 w-5 mr-2" />
                  Chat with AI Assistant
                </Button>
              </Link>
              <Link href="/appointments">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-primary">
                  <Calendar className="h-5 w-5 mr-2" />
                  Book Appointment
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Avatar Demo Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Meet Your AI Health Assistant
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Experience the future of healthcare with our HeyGen-powered interactive avatar. 
              Face recognition, voice interaction, and multi-language support all in one.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <MessageCircle className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Interactive Avatar</h3>
                  <p className="text-gray-600">
                    Chat with our HeyGen-powered AI avatar that responds with realistic voice and gestures. 
                    Your personal healthcare assistant available 24/7.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Face Recognition Login</h3>
                  <p className="text-gray-600">
                    Instant patient recognition - no passwords needed. Just look at the camera 
                    and our AI will recognize you and load your medical history.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <Shield className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Multi-Language Support</h3>
                  <p className="text-gray-600">
                    Automatic language detection and response. Speak in Turkish, English, or Arabic 
                    and get personalized healthcare guidance in your preferred language.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex justify-center">
              <Card className="max-w-md">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageCircle className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Try Interactive Avatar</h3>
                  <p className="text-gray-600 mb-4">
                    Experience the power of HeyGen interactive avatars with voice recognition and real-time responses.
                  </p>
                  <div className="space-y-3">
                    <Button 
                      onClick={() => setShowModal(true)}
                      className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                    >
                      Start Avatar Chat
                    </Button>
                    <Link href="/chat">
                      <Button 
                        variant="outline"
                        className="w-full border-purple-600 text-purple-600 hover:bg-purple-50"
                      >
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Full Chat Interface
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-muted/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Advanced Healthcare Features</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Comprehensive health analysis and personalized care recommendations
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="medical-card">
              <CardHeader>
                <Users className="h-12 w-12 text-primary mb-4" />
                <CardTitle>Skin Analysis</CardTitle>
                <CardDescription>
                  AI-powered skin health assessment with personalized recommendations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  YouCam AI technology analyzes your skin condition, identifies concerns, 
                  and provides personalized skincare routines and product recommendations.
                </p>
              </CardContent>
            </Card>

            <Card className="medical-card">
              <CardHeader>
                <Calendar className="h-12 w-12 text-primary mb-4" />
                <CardTitle>Hair Analysis</CardTitle>
                <CardDescription>
                  Comprehensive hair and scalp health evaluation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Advanced hair analysis detects hair type, scalp condition, and damage levels. 
                  Get personalized hair care routines and styling recommendations.
                </p>
              </CardContent>
            </Card>

            <Card className="medical-card">
              <CardHeader>
                <MessageCircle className="h-12 w-12 text-primary mb-4" />
                <CardTitle>Lips Analysis</CardTitle>
                <CardDescription>
                  Detailed lip health assessment and care guidance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Analyze lip condition, hydration levels, and overall lip health. 
                  Receive personalized lip care recommendations and treatment suggestions.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-3xl font-bold mb-6">Healthcare Made Simple</h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Shield className="h-6 w-6 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-semibold">Secure & Private</h4>
                    <p className="text-muted-foreground">Your health data is protected with industry-standard security</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Clock className="h-6 w-6 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-semibold">24/7 Availability</h4>
                    <p className="text-muted-foreground">Get help whenever you need it, day or night</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Phone className="h-6 w-6 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-semibold">Multiple Support Channels</h4>
                    <p className="text-muted-foreground">Chat, video calls, or in-person visits - your choice</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="aspect-video bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="h-10 w-10 text-white" />
                </div>
                <p className="text-lg font-semibold text-primary">AI Assistant Ready to Help</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <FaqSection />

      {/* Contact Section */}
      <section className="py-16 bg-muted/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-3xl font-bold mb-6">Need Help?</h3>
            <p className="text-lg text-muted-foreground mb-8">
              Our support team is here to assist you
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="p-6 text-center">
                  <Phone className="h-8 w-8 text-primary mx-auto mb-3" />
                  <h4 className="font-semibold mb-2">Emergency</h4>
                  <p className="text-muted-foreground">911</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <Phone className="h-8 w-8 text-primary mx-auto mb-3" />
                  <h4 className="font-semibold mb-2">General Inquiries</h4>
                  <p className="text-muted-foreground">(555) 123-4567</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <MessageCircle className="h-8 w-8 text-primary mx-auto mb-3" />
                  <h4 className="font-semibold mb-2">Chat Support</h4>
                  <p className="text-muted-foreground">Available 24/7</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Floating Chat Button */}
      <FloatingChatButton />

      {/* Auto-show Modal */}
      <MedcorChatModal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
      />
    </div>
  );
}