import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Clock, User, Mail, ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { format } from "date-fns";

interface AppointmentCalendarProps {
  isOpen: boolean;
  onClose: () => void;
  preferredDate?: string;
  preferredTime?: string;
  preferredDoctor?: string;
  onAppointmentBooked?: (appointment: any) => void;
  voiceData?: {
    doctor?: string;
    date?: string;
    time?: string;
    reason?: string;
  };
}

export default function AppointmentCalendar({ 
  isOpen, 
  onClose, 
  preferredDate = "tomorrow",
  preferredTime,
  preferredDoctor,
  onAppointmentBooked,
  voiceData
}: AppointmentCalendarProps) {
  // Parse voice data for date
  const getInitialDate = () => {
    if (voiceData?.date) {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      if (voiceData.date.toLowerCase().includes('tomorrow')) {
        return tomorrow;
      } else if (voiceData.date.toLowerCase().includes('today')) {
        return today;
      } else {
        // Try to parse other date formats
        const parsed = new Date(voiceData.date);
        return isNaN(parsed.getTime()) ? tomorrow : parsed;
      }
    }
    return preferredDate === "tomorrow" ? new Date(Date.now() + 24 * 60 * 60 * 1000) : new Date();
  };

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(getInitialDate());
  const [selectedTime, setSelectedTime] = useState<string>(voiceData?.time || preferredTime || "");
  const [selectedDoctor, setSelectedDoctor] = useState<string>(voiceData?.doctor || preferredDoctor || "");
  const [patientName, setPatientName] = useState("");
  const [patientEmail, setPatientEmail] = useState("");
  const [reason, setReason] = useState(voiceData?.reason || "General consultation");
  const [currentMonth, setCurrentMonth] = useState(selectedDate || new Date());

  // Available doctors list (would come from MCP server)
  const doctors = [
    { id: 1, name: "Dr. Johnson", specialty: "General Practice" },
    { id: 2, name: "Dr. Chen", specialty: "Cardiology" },
    { id: 3, name: "Dr. Smith", specialty: "Dermatology" },
    { id: 4, name: "Dr. Garcia", specialty: "Pediatrics" }
  ];

  const timeSlots = [
    "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", 
    "15:00", "15:30", "16:00", "16:30", "17:00", "17:30"
  ];

  // Parse time from voice data (e.g., "2 PM" -> "14:00")
  const parseTimeFromVoice = (timeStr: string) => {
    if (!timeStr) return "";
    const match = timeStr.match(/(\d{1,2})\s*(am|pm)/i);
    if (match) {
      let hour = parseInt(match[1]);
      const period = match[2].toLowerCase();
      if (period === 'pm' && hour !== 12) hour += 12;
      if (period === 'am' && hour === 12) hour = 0;
      return `${hour.toString().padStart(2, '0')}:00`;
    }
    return timeStr;
  };

  useEffect(() => {
    // Auto-select time if provided via voice
    if (voiceData?.time && !selectedTime) {
      const parsedTime = parseTimeFromVoice(voiceData.time);
      setSelectedTime(parsedTime);
    }
    
    // Auto-select doctor if provided via voice
    if (voiceData?.doctor && !selectedDoctor) {
      const doctor = doctors.find(d => 
        d.name.toLowerCase().includes(voiceData.doctor!.toLowerCase())
      );
      if (doctor) {
        setSelectedDoctor(doctor.name);
      }
    }
  }, [voiceData]);

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

  const handleBookAppointment = async () => {
    if (!selectedDate || !selectedTime || !selectedDoctor) {
      alert("Please select a date, time, and doctor");
      return;
    }

    // If voice booking, use MCP service
    if (voiceData) {
      const mcpData = {
        doctorName: selectedDoctor,
        date: selectedDate.toISOString().split('T')[0],
        time: selectedTime,
        reason: reason,
        patientName: patientName || "Voice User",
        patientEmail: patientEmail || "voice@medcor.ai",
        viaMCP: true
      };

      try {
        const response = await fetch('/api/appointments/book-via-mcp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(mcpData)
        });
        const result = await response.json();
        
        if (result.success) {
          onAppointmentBooked?.(result.appointment);
          onClose();
        }
      } catch (error) {
        console.error('MCP booking failed:', error);
      }
    } else {
      // Regular booking flow
      const appointmentData = {
        patientName: patientName || "Guest User",
        patientEmail: patientEmail || "guest@medcor.ai",
        patientPhone: "+1234567890",
        doctorName: selectedDoctor,
        appointmentDate: selectedDate.toISOString().split('T')[0],
        appointmentTime: selectedTime,
        reason,
        status: "confirmed"
      };

      bookAppointmentMutation.mutate(appointmentData);
    }
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
          {/* Voice Data Summary */}
          {voiceData && (
            <div className="bg-purple-100 p-3 rounded-lg mb-4">
              <p className="text-sm text-purple-800">
                <strong>Voice Request:</strong> {voiceData.doctor && `${voiceData.doctor} `}
                {voiceData.date && `on ${voiceData.date} `}
                {voiceData.time && `at ${voiceData.time}`}
              </p>
            </div>
          )}

          {/* Calendar Selection with Month/Year Navigation */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                Select Date
              </h3>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const prev = new Date(currentMonth);
                    prev.setMonth(prev.getMonth() - 1);
                    setCurrentMonth(prev);
                  }}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium min-w-[120px] text-center">
                  {format(currentMonth, 'MMMM yyyy')}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const next = new Date(currentMonth);
                    next.setMonth(next.getMonth() + 1);
                    setCurrentMonth(next);
                  }}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              month={currentMonth}
              onMonthChange={setCurrentMonth}
              disabled={(date) => date < new Date() || date < new Date("1900-01-01")}
              className="rounded-md border"
            />
          </div>

          {/* Doctor Selection */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <User className="h-4 w-4" />
              Select Doctor
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {doctors.map((doctor) => (
                <Button
                  key={doctor.id}
                  variant={selectedDoctor === doctor.name ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedDoctor(doctor.name)}
                  className="text-xs p-3"
                >
                  <div className="text-left">
                    <div className="font-medium">{doctor.name}</div>
                    <div className="text-[10px] opacity-70">{doctor.specialty}</div>
                  </div>
                </Button>
              ))}
            </div>
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
          {selectedDate && selectedTime && selectedDoctor && (
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Appointment Summary</h3>
              <div className="space-y-1 text-sm">
                <p><strong>Date:</strong> {format(selectedDate, 'EEEE, MMMM d, yyyy')}</p>
                <p><strong>Time:</strong> {selectedTime}</p>
                <p><strong>Doctor:</strong> {selectedDoctor}</p>
                <p><strong>Patient:</strong> {patientName || voiceData ? "Voice User" : "Enter name below"}</p>
                <p><strong>Reason:</strong> {reason}</p>
                {voiceData && (
                  <p className="text-xs text-purple-600 mt-2">
                    ✨ Booking via Voice + MCP Integration
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handleBookAppointment}
              disabled={!selectedDate || !selectedTime || !selectedDoctor || bookAppointmentMutation.isPending}
              className="flex-1 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
            >
              {bookAppointmentMutation.isPending ? "Booking via MCP..." : "Confirm Appointment"}
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