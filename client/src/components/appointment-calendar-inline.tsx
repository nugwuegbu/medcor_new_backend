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

  // Determine current step based on conversation state
  const currentStep = conversationState?.step || 'select_date';

  return (
    <div className="w-full max-w-sm mx-auto p-2 bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Compact Progress Indicator */}
      <div className="flex items-center justify-between mb-2 px-1">
        <div className={`flex items-center gap-1 ${currentStep === 'select_date' ? 'text-purple-600' : 'text-gray-400'}`}>
          <Calendar className="h-3 w-3" />
          <span className="text-[10px]">Date</span>
        </div>
        <div className={`flex items-center gap-1 ${currentStep === 'select_doctor' ? 'text-purple-600' : 'text-gray-400'}`}>
          <User className="h-3 w-3" />
          <span className="text-[10px]">Doctor</span>
        </div>
        <div className={`flex items-center gap-1 ${currentStep === 'select_time' ? 'text-purple-600' : 'text-gray-400'}`}>
          <Clock className="h-3 w-3" />
          <span className="text-[10px]">Time</span>
        </div>
      </div>

      {/* Calendar View */}
      {currentStep === 'select_date' && (
        <div className="space-y-1">
          {/* Month Navigation */}
          <div className="flex items-center justify-between px-1">
            <button
              onClick={handlePrevMonth}
              className="p-0.5 hover:bg-gray-100 rounded"
            >
              <ChevronLeft className="h-3 w-3" />
            </button>
            <h3 className="text-xs font-semibold">
              {format(currentMonth, 'MMM yyyy')}
            </h3>
            <button
              onClick={handleNextMonth}
              className="p-0.5 hover:bg-gray-100 rounded"
            >
              <ChevronRight className="h-3 w-3" />
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-0.5 text-[10px]">
            {/* Week Days */}
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day) => (
              <div key={day} className="text-center text-gray-500 font-medium py-0.5">
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
                  h-6 w-full rounded text-[10px]
                  ${!date ? 'invisible' : ''}
                  ${isDateSelected(date) ? 'bg-purple-600 text-white' : ''}
                  ${isToday(date) && !isDateSelected(date) ? 'bg-yellow-100 font-bold' : ''}
                  ${isPastDate(date) ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-gray-100'}
                `}
              >
                {date?.getDate()}
              </button>
            ))}
          </div>

          {/* Voice Hint */}
          <div className="flex items-center gap-1 p-1 bg-blue-50 rounded">
            <Mic className="h-2.5 w-2.5 text-blue-600" />
            <span className="text-[10px] text-blue-700">Say "tomorrow" or any date</span>
          </div>
        </div>
      )}

      {/* Doctor Selection */}
      {currentStep === 'select_doctor' && (
        <div className="space-y-1">
          <h4 className="text-xs font-medium mb-1">Select Doctor</h4>
          <div className="grid grid-cols-2 gap-1">
            {doctors.map((doctor) => (
              <button
                key={doctor}
                onClick={() => handleDoctorSelect(doctor)}
                className={`
                  p-1.5 text-[10px] rounded border transition-all
                  ${selectedDoctor === doctor 
                    ? 'bg-purple-600 text-white border-purple-600' 
                    : 'bg-white hover:bg-gray-50 border-gray-200'}
                `}
              >
                {doctor}
              </button>
            ))}
          </div>
          
          {/* Voice Hint */}
          <div className="flex items-center gap-1 p-1 bg-blue-50 rounded">
            <Mic className="h-2.5 w-2.5 text-blue-600" />
            <span className="text-[10px] text-blue-700">Say doctor's name</span>
          </div>
        </div>
      )}

      {/* Time Selection */}
      {currentStep === 'select_time' && (
        <div className="space-y-1">
          <h4 className="text-xs font-medium mb-1">Select Time</h4>
          <div className="grid grid-cols-4 gap-1">
            {timeSlots.map((time) => (
              <button
                key={time}
                onClick={() => handleTimeSelect(time)}
                className={`
                  p-1 text-[10px] rounded border transition-all
                  ${selectedTime === time 
                    ? 'bg-purple-600 text-white border-purple-600' 
                    : 'bg-white hover:bg-gray-50 border-gray-200'}
                `}
              >
                {time}
              </button>
            ))}
          </div>
          
          {/* Voice Hint */}
          <div className="flex items-center gap-1 p-1 bg-blue-50 rounded">
            <Mic className="h-2.5 w-2.5 text-blue-600" />
            <span className="text-[10px] text-blue-700">Say preferred time</span>
          </div>
        </div>
      )}

      {/* Confirmation Summary */}
      {currentStep === 'confirm' && (
        <div className="space-y-1">
          <h4 className="text-xs font-medium mb-1">Confirm Appointment</h4>
          <div className="p-2 bg-green-50 rounded space-y-0.5 text-[10px]">
            <p>📅 {selectedDate && format(selectedDate, 'EEE, MMM d')}</p>
            <p>👨‍⚕️ {selectedDoctor}</p>
            <p>🕐 {selectedTime}</p>
            {voiceData?.reason && <p>📝 {voiceData.reason}</p>}
          </div>
          
          <Button
            onClick={handleConfirmBooking}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white text-[10px] h-7"
          >
            Confirm Booking
          </Button>
          
          {/* Voice Hint */}
          <div className="flex items-center gap-1 p-1 bg-green-50 rounded">
            <Mic className="h-2.5 w-2.5 text-green-600" />
            <span className="text-[10px] text-green-700">Say "yes" to confirm</span>
          </div>
        </div>
      )}
    </div>
  );
}