import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar, Clock, User, Mic } from "lucide-react";
import { format } from "date-fns";

interface AppointmentCalendarInlineProps {
  onAppointmentBooked?: (appointment: any) => void;
  voiceData?: {
    doctor?: string;
    date?: string;
    time?: string;
    reason?: string;
  };
  conversationState?: any;
  onDateSelect?: (date: Date) => void;
  onDoctorSelect?: (doctor: string) => void;
  onTimeSelect?: (time: string) => void;
}

export default function AppointmentCalendarInline({ 
  onAppointmentBooked,
  voiceData,
  conversationState,
  onDateSelect,
  onDoctorSelect,
  onTimeSelect
}: AppointmentCalendarInlineProps) {
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
      }
    }
    return new Date();
  };

  const [selectedDate, setSelectedDate] = useState<Date>(getInitialDate());
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [selectedDoctor, setSelectedDoctor] = useState<string>("");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  // Available doctors list
  const doctors = [
    "Dr. Johnson",
    "Dr. Chen", 
    "Dr. Smith",
    "Dr. Garcia"
  ];

  const timeSlots = [
    "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
    "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM"
  ];

  // Parse voice data
  useEffect(() => {
    if (voiceData?.time) {
      const timeMatch = voiceData.time.match(/(\d{1,2})\s*(am|pm|AM|PM)/i);
      if (timeMatch) {
        const formattedTime = `${timeMatch[1]}:00 ${timeMatch[2].toUpperCase()}`;
        setSelectedTime(formattedTime);
        onTimeSelect?.(formattedTime);
      }
    }
    
    if (voiceData?.doctor) {
      const doctor = doctors.find(d => 
        d.toLowerCase().includes(voiceData.doctor!.toLowerCase())
      );
      if (doctor) {
        setSelectedDoctor(doctor);
        onDoctorSelect?.(doctor);
      }
    }

    if (voiceData?.date) {
      const date = getInitialDate();
      setSelectedDate(date);
      setCurrentMonth(date);
      setCurrentYear(date.getFullYear());
      onDateSelect?.(date);
    }
  }, [voiceData]);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    
    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  };

  const handlePrevMonth = () => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() - 1);
    setCurrentMonth(newMonth);
    setCurrentYear(newMonth.getFullYear());
  };

  const handleNextMonth = () => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + 1);
    setCurrentMonth(newMonth);
    setCurrentYear(newMonth.getFullYear());
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    onDateSelect?.(date);
  };

  const handleDoctorSelect = (doctor: string) => {
    setSelectedDoctor(doctor);
    onDoctorSelect?.(doctor);
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    onTimeSelect?.(time);
  };

  const handleConfirmBooking = () => {
    if (selectedDate && selectedDoctor && selectedTime) {
      onAppointmentBooked?.({
        date: format(selectedDate, 'yyyy-MM-dd'),
        doctorName: selectedDoctor,
        time: selectedTime,
        reason: voiceData?.reason || "General consultation"
      });
    }
  };

  const isDateSelected = (date: Date | null) => {
    if (!date || !selectedDate) return false;
    return date.toDateString() === selectedDate.toDateString();
  };

  const isToday = (date: Date | null) => {
    if (!date) return false;
    return date.toDateString() === new Date().toDateString();
  };

  const isPastDate = (date: Date | null) => {
    if (!date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const isDateHighlighted = (date: Date | null) => {
    if (!date || !voiceData?.date) return false;
    const voiceDateStr = voiceData.date.toLowerCase();
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (voiceDateStr.includes('tomorrow')) {
      return date.toDateString() === tomorrow.toDateString();
    } else if (voiceDateStr.includes('today')) {
      return date.toDateString() === today.toDateString();
    }
    return false;
  };

  // Determine current step based on conversation state
  const currentStep = conversationState?.step || 'select_date';

  return (
    <div className="w-full">
      {/* Progress Indicator */}
      <div className="flex items-center justify-between mb-4 px-2">
        <div className={`flex items-center gap-2 ${currentStep === 'select_date' ? 'text-purple-600' : 'text-gray-400'}`}>
          <Calendar className="h-4 w-4" />
          <span className="text-sm font-medium">Date</span>
        </div>
        <div className={`flex items-center gap-2 ${currentStep === 'select_doctor' ? 'text-purple-600' : 'text-gray-400'}`}>
          <User className="h-4 w-4" />
          <span className="text-sm font-medium">Doctor</span>
        </div>
        <div className={`flex items-center gap-2 ${currentStep === 'select_time' ? 'text-purple-600' : 'text-gray-400'}`}>
          <Clock className="h-4 w-4" />
          <span className="text-sm font-medium">Time</span>
        </div>
      </div>

      {/* Calendar View */}
      {currentStep === 'select_date' && (
        <div className="space-y-3">
          {/* Month Navigation */}
          <div className="flex items-center justify-between px-2">
            <button
              onClick={handlePrevMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <h3 className="text-base font-semibold text-gray-800">
              {format(currentMonth, 'MMMM yyyy')}
            </h3>
            <button
              onClick={handleNextMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">
            {/* Week Days */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="text-center text-xs font-medium text-gray-500 py-1">
                {day}
              </div>
            ))}
            
            {/* Calendar Days */}
            {getDaysInMonth(currentMonth).map((date, index) => (
              <button
                key={index}
                onClick={() => date && !isPastDate(date) && handleDateClick(date)}
                disabled={!date || isPastDate(date)}
                className={`
                  h-10 w-full rounded-lg text-sm font-medium transition-all
                  ${!date ? 'invisible' : ''}
                  ${isDateSelected(date) ? 'bg-purple-600 text-white shadow-md ring-2 ring-purple-600 ring-offset-2' : ''}
                  ${isToday(date) && !isDateSelected(date) ? 'bg-yellow-100 border-2 border-yellow-400 font-bold' : ''}
                  ${isPastDate(date) ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-gray-100 border border-gray-200'}
                  ${isDateHighlighted(date) && !isDateSelected(date) ? 'bg-purple-100 border-2 border-purple-400 animate-pulse' : ''}
                `}
              >
                {date?.getDate()}
              </button>
            ))}
          </div>

          {/* Voice Hint */}
          <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
            <Mic className="h-4 w-4 text-blue-600 animate-pulse" />
            <span className="text-sm text-blue-700">Say "tomorrow" or any date</span>
          </div>
        </div>
      )}

      {/* Doctor Selection */}
      {currentStep === 'select_doctor' && (
        <div className="space-y-3">
          <h4 className="text-base font-semibold text-gray-800 mb-3">Select Doctor</h4>
          <div className="grid grid-cols-2 gap-3">
            {doctors.map((doctor) => (
              <button
                key={doctor}
                onClick={() => handleDoctorSelect(doctor)}
                className={`
                  p-4 text-sm font-medium rounded-lg border-2 transition-all
                  ${selectedDoctor === doctor 
                    ? 'bg-purple-600 text-white border-purple-600 shadow-md ring-2 ring-purple-600 ring-offset-2' 
                    : 'bg-white hover:bg-gray-50 border-gray-300'}
                `}
              >
                {doctor}
              </button>
            ))}
          </div>
          
          {/* Voice Hint */}
          <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
            <Mic className="h-4 w-4 text-blue-600 animate-pulse" />
            <span className="text-sm text-blue-700">Say doctor's name</span>
          </div>
        </div>
      )}

      {/* Time Selection */}
      {currentStep === 'select_time' && (
        <div className="space-y-3">
          <h4 className="text-base font-semibold text-gray-800 mb-3">Select Time</h4>
          <div className="grid grid-cols-4 gap-2">
            {timeSlots.map((time) => (
              <button
                key={time}
                onClick={() => handleTimeSelect(time)}
                className={`
                  p-3 text-sm font-medium rounded-lg border-2 transition-all
                  ${selectedTime === time 
                    ? 'bg-purple-600 text-white border-purple-600 shadow-md ring-2 ring-purple-600 ring-offset-2' 
                    : 'bg-white hover:bg-gray-50 border-gray-300'}
                `}
              >
                {time}
              </button>
            ))}
          </div>
          
          {/* Voice Hint */}
          <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
            <Mic className="h-4 w-4 text-blue-600 animate-pulse" />
            <span className="text-sm text-blue-700">Say preferred time</span>
          </div>
        </div>
      )}

      {/* Confirmation Summary */}
      {currentStep === 'confirm' && (
        <div className="space-y-3">
          <h4 className="text-base font-semibold text-gray-800 mb-3">Confirm Appointment</h4>
          <div className="p-4 bg-green-50 rounded-lg space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-green-600" />
              <span className="font-medium">{selectedDate && format(selectedDate, 'EEEE, MMMM d, yyyy')}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-green-600" />
              <span className="font-medium">{selectedDoctor}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-green-600" />
              <span className="font-medium">{selectedTime}</span>
            </div>
            {voiceData?.reason && (
              <div className="mt-2 pt-2 border-t border-green-200">
                <p className="text-sm text-green-700">Reason: {voiceData.reason}</p>
              </div>
            )}
          </div>
          
          <Button
            onClick={handleConfirmBooking}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white text-base font-medium h-12 shadow-lg"
          >
            Confirm Booking
          </Button>
          
          {/* Voice Hint */}
          <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
            <Mic className="h-4 w-4 text-green-600 animate-pulse" />
            <span className="text-sm text-green-700">Say "yes" or "confirm" to book</span>
          </div>
        </div>
      )}
    </div>
  );
}