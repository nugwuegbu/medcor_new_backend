import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle, Users, Calendar, Shield, Clock, Phone, Camera } from "lucide-react";
import { Link } from "wouter";
import FaqSection from "@/components/faq-section";
import FaceRecognition from "@/components/face-recognition";

export default function Home() {
  const handleFaceRecognition = (result: any) => {
    if (result.recognized) {
      console.log("Patient recognized:", result);
    } else {
      console.log("New patient:", result);
    }
  };

  const handleLanguageDetection = (language: string) => {
    console.log("Language detected:", language);
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="medical-gradient text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Your Health, Our Priority
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
              Experience personalized healthcare with our AI-powered assistant. 
              Get instant support, book appointments, and connect with expert doctors.
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

      {/* Face Recognition Demo Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Instant Recognition & Personalized Care
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our advanced face recognition technology identifies returning patients instantly, 
              automatically detects your preferred language, and provides seamless access to your medical history.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <Camera className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Instant Recognition</h3>
                  <p className="text-gray-600">
                    Simply look at your camera and our AI will instantly recognize you, 
                    eliminating the need for passwords or lengthy login processes.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <Shield className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Privacy First</h3>
                  <p className="text-gray-600">
                    Your face data is encrypted and stored securely. We never save actual images, 
                    only mathematical patterns for recognition.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <MessageCircle className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Multi-Language Support</h3>
                  <p className="text-gray-600">
                    Our system automatically detects your preferred language and provides 
                    personalized care in your native tongue.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex justify-center">
              <FaceRecognition 
                sessionId="home-demo"
                onRecognitionComplete={handleFaceRecognition}
                onLanguageDetected={handleLanguageDetection}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-muted/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Why Choose MedCare AI?</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Advanced healthcare technology meets compassionate care
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="medical-card">
              <CardHeader>
                <MessageCircle className="h-12 w-12 text-primary mb-4" />
                <CardTitle>AI-Powered Assistant</CardTitle>
                <CardDescription>
                  Get instant answers to your health questions and guidance on next steps
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Our AI assistant provides 24/7 support, helping you understand symptoms, 
                  find the right care, and navigate your health journey.
                </p>
              </CardContent>
            </Card>

            <Card className="medical-card">
              <CardHeader>
                <Users className="h-12 w-12 text-primary mb-4" />
                <CardTitle>Expert Doctors</CardTitle>
                <CardDescription>
                  Connect with board-certified specialists in various medical fields
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Our network includes experienced doctors from cardiology, orthopedics, 
                  pediatrics, and more, ensuring you get the right expertise.
                </p>
              </CardContent>
            </Card>

            <Card className="medical-card">
              <CardHeader>
                <Calendar className="h-12 w-12 text-primary mb-4" />
                <CardTitle>Easy Scheduling</CardTitle>
                <CardDescription>
                  Book appointments online with real-time availability
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Skip the phone calls and book appointments instantly. 
                  View doctor availability and choose times that work for you.
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
    </div>
  );
}
