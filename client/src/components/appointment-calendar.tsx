import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Clock, User, Mail } from "lucide-react";
import { useMutation } from "@tanstack/react-query";

interface AppointmentCalendarProps {
  isOpen: boolean;
  onClose: () => void;
  preferredDate?: string;
  onAppointmentBooked?: (appointment: any) => void;
}

export default function AppointmentCalendar({ 
  isOpen, 
  onClose, 
  preferredDate = "tomorrow",
  onAppointmentBooked 
}: AppointmentCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    preferredDate === "tomorrow" ? new Date(Date.now() + 24 * 60 * 60 * 1000) : new Date()
  );
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [patientName, setPatientName] = useState("");
  const [patientEmail, setPatientEmail] = useState("");
  const [reason, setReason] = useState("General consultation");

  const timeSlots = [
    "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
    "16:00", "16:30", "17:00", "17:30"
  ];

  const bookAppointmentMutation = useMutation({
    mutationFn: async (appointmentData: any) => {
      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(appointmentData)
      });
      return await response.json();
    },
    onSuccess: (data) => {
      onAppointmentBooked?.(data);
      // Send email and WhatsApp notifications
      sendNotifications(data);
      onClose();
    }
  });

  const sendNotifications = async (appointment: any) => {
    // Send email notification
    try {
      await fetch("/api/notifications/email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          to: appointment.patientEmail,
          subject: "Appointment Confirmation - Medcor AI",
          appointmentDetails: appointment
        })
      });
    } catch (error) {
      console.error("Email notification failed:", error);
    }

    // Send WhatsApp notification (placeholder)
    try {
      await fetch("/api/notifications/whatsapp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          phone: appointment.patientPhone,
          message: `Your appointment is confirmed for ${appointment.date} at ${appointment.time}`,
          appointmentDetails: appointment
        })
      });
    } catch (error) {
      console.error("WhatsApp notification failed:", error);
    }
  };

  const handleBookAppointment = () => {
    if (!selectedDate || !selectedTime || !patientName || !patientEmail) {
      alert("Please fill in all required fields");
      return;
    }

    const appointmentData = {
      patientName,
      patientEmail,
      patientPhone: "+1234567890", // Would be collected from form
      doctorId: 1, // Default doctor
      appointmentDate: selectedDate.toISOString().split('T')[0],
      appointmentTime: selectedTime,
      reason,
      status: "confirmed"
    };

    bookAppointmentMutation.mutate(appointmentData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl">Book Your Appointment</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Calendar Selection */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Select Date
            </h3>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              disabled={(date) => date < new Date() || date < new Date("1900-01-01")}
              className="rounded-md border"
            />
          </div>

          {/* Time Selection */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Available Times
            </h3>
            <div className="grid grid-cols-4 gap-2">
              {timeSlots.map((time) => (
                <Button
                  key={time}
                  variant={selectedTime === time ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedTime(time)}
                  className="text-xs"
                >
                  {time}
                </Button>
              ))}
            </div>
          </div>

          {/* Patient Information */}
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <User className="h-4 w-4" />
              Patient Information
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Full Name *</label>
                <input
                  type="text"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter your full name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Email *</label>
                <input
                  type="email"
                  value={patientEmail}
                  onChange={(e) => setPatientEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Reason for Visit</label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="General consultation">General Consultation</option>
                <option value="Follow-up">Follow-up</option>
                <option value="Specialist consultation">Specialist Consultation</option>
                <option value="Emergency">Emergency</option>
              </select>
            </div>
          </div>

          {/* Confirmation Summary */}
          {selectedDate && selectedTime && patientName && (
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Appointment Summary</h3>
              <div className="space-y-1 text-sm">
                <p><strong>Date:</strong> {selectedDate.toLocaleDateString()}</p>
                <p><strong>Time:</strong> {selectedTime}</p>
                <p><strong>Patient:</strong> {patientName}</p>
                <p><strong>Reason:</strong> {reason}</p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handleBookAppointment}
              disabled={!selectedDate || !selectedTime || !patientName || !patientEmail || bookAppointmentMutation.isPending}
              className="flex-1 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
            >
              {bookAppointmentMutation.isPending ? "Booking..." : "Confirm Appointment"}
            </Button>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}