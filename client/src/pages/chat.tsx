import { useState } from "react";
import ChatInterface from "@/features/chat/components/chat-interface";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle, Phone, Users, Calendar } from "lucide-react";

export default function Chat() {
  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">AI Health Assistant</h1>
          <p className="text-muted-foreground">
            Get instant answers to your health questions and guidance on next steps
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <ChatInterface />
          </div>
          
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">How I Can Help</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start space-x-3">
                  <MessageCircle className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-medium">Health Questions</h4>
                    <p className="text-sm text-muted-foreground">
                      Ask about symptoms, conditions, and general health advice
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Calendar className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-medium">Appointment Help</h4>
                    <p className="text-sm text-muted-foreground">
                      Get guidance on booking appointments and choosing doctors
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Users className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-medium">Doctor Information</h4>
                    <p className="text-sm text-muted-foreground">
                      Learn about our specialists and their expertise
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Emergency Contact</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-4">
                  <Phone className="h-12 w-12 text-red-500 mx-auto" />
                  <div>
                    <p className="font-semibold">Medical Emergency</p>
                    <p className="text-2xl font-bold text-red-500">911</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    For life-threatening emergencies, call 911 immediately
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
