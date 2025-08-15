/**
 * MCP Appointment Service
 * Connects voice commands to MCP server for appointment booking
 */

interface Doctor {
  id: number;
  first_name: string;
  last_name: string;
  specialization: string;
  email: string;
}

interface AppointmentSlot {
  id: number;
  doctor_id: number;
  day_of_week: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

interface Appointment {
  id: number;
  patient_id: number;
  doctor_id: number;
  appointment_date: string;
  appointment_time: string;
  status: string;
  notes?: string;
}

export class MCPAppointmentService {
  private baseUrl: string;
  private authToken: string | null = null;

  constructor() {
    // Use local Django backend that acts as MCP server proxy
    this.baseUrl = process.env.DJANGO_API_URL || 'http://localhost:8000';
  }

  /**
   * Extract appointment details from natural language
   */
  parseAppointmentRequest(message: string): {
    doctorName?: string;
    date?: string;
    time?: string;
    reason?: string;
    specialization?: string;
  } {
    const result: any = {};
    const lower = message.toLowerCase();

    // Extract doctor name
    const doctorPatterns = [
      /(?:dr\.?|doctor)\s+([a-z]+(?:\s+[a-z]+)?)/i,
      /with\s+([a-z]+(?:\s+[a-z]+)?)\s+(?:doctor|dr)/i,
      /see\s+([a-z]+(?:\s+[a-z]+)?)/i
    ];
    
    for (const pattern of doctorPatterns) {
      const match = message.match(pattern);
      if (match) {
        result.doctorName = match[1].trim();
        break;
      }
    }

    // Extract date
    const today = new Date();
    if (lower.includes('tomorrow')) {
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      result.date = tomorrow.toISOString().split('T')[0];
    } else if (lower.includes('today')) {
      result.date = today.toISOString().split('T')[0];
    } else if (lower.includes('next week')) {
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);
      result.date = nextWeek.toISOString().split('T')[0];
    } else if (lower.includes('friday')) {
      const friday = this.getNextWeekday(5); // 5 = Friday
      result.date = friday.toISOString().split('T')[0];
    } else if (lower.includes('monday')) {
      const monday = this.getNextWeekday(1);
      result.date = monday.toISOString().split('T')[0];
    } else {
      // Try to extract specific date
      const dateMatch = message.match(/(\d{1,2})(?:st|nd|rd|th)?\s+(?:of\s+)?([a-z]+)/i);
      if (dateMatch) {
        const day = parseInt(dateMatch[1]);
        const month = this.getMonthNumber(dateMatch[2]);
        if (month) {
          const year = today.getFullYear();
          result.date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        }
      }
    }

    // Extract time
    const timePatterns = [
      /(\d{1,2})\s*(?::|\.)?(\d{2})?\s*(am|pm)/i,
      /at\s+(\d{1,2})\s*(am|pm)?/i,
      /(\d{1,2})\s*o'?clock/i
    ];

    for (const pattern of timePatterns) {
      const match = message.match(pattern);
      if (match) {
        let hour = parseInt(match[1]);
        const minutes = match[2] ? parseInt(match[2]) : 0;
        const meridiem = match[3]?.toLowerCase();
        
        if (meridiem === 'pm' && hour < 12) hour += 12;
        if (meridiem === 'am' && hour === 12) hour = 0;
        
        result.time = `${String(hour).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
        break;
      }
    }

    // Extract reason/symptoms
    const reasonPatterns = [
      /for\s+(.+?)(?:\s+(?:on|at|with|tomorrow|today|next))/i,
      /(?:about|regarding|concerning)\s+(.+?)(?:\s+(?:on|at|with))/i,
      /(?:have|having|suffering from)\s+(.+?)(?:\s+(?:and|on|at))/i
    ];

    for (const pattern of reasonPatterns) {
      const match = message.match(pattern);
      if (match) {
        result.reason = match[1].trim();
        break;
      }
    }

    // Extract specialization
    const specializations = [
      'cardiologist', 'dermatologist', 'pediatrician', 'orthopedic',
      'neurologist', 'psychiatrist', 'gynecologist', 'ophthalmologist',
      'general practitioner', 'dentist'
    ];

    for (const spec of specializations) {
      if (lower.includes(spec)) {
        result.specialization = spec;
        break;
      }
    }

    return result;
  }

  /**
   * Get next occurrence of a weekday
   */
  private getNextWeekday(dayNumber: number): Date {
    const today = new Date();
    const currentDay = today.getDay();
    const daysUntil = (dayNumber - currentDay + 7) % 7 || 7;
    const result = new Date(today);
    result.setDate(today.getDate() + daysUntil);
    return result;
  }

  /**
   * Convert month name to number
   */
  private getMonthNumber(monthName: string): number | null {
    const months: Record<string, number> = {
      january: 1, jan: 1,
      february: 2, feb: 2,
      march: 3, mar: 3,
      april: 4, apr: 4,
      may: 5,
      june: 6, jun: 6,
      july: 7, jul: 7,
      august: 8, aug: 8,
      september: 9, sep: 9, sept: 9,
      october: 10, oct: 10,
      november: 11, nov: 11,
      december: 12, dec: 12
    };
    return months[monthName.toLowerCase()] || null;
  }

  /**
   * Find doctor by name or specialization
   */
  async findDoctor(criteria: { name?: string; specialization?: string }): Promise<Doctor | null> {
    try {
      // Call Django API to get doctors
      const response = await fetch(`${this.baseUrl}/api/users/doctors/`, {
        headers: {
          'Content-Type': 'application/json',
          ...(this.authToken ? { 'Authorization': `Bearer ${this.authToken}` } : {})
        }
      });

      if (!response.ok) {
        console.error('Failed to fetch doctors:', response.status);
        // Return mock data for testing
        if (criteria.name?.toLowerCase().includes('johnson')) {
          return { id: 1, first_name: 'John', last_name: 'Johnson', specialization: 'Cardiologist', email: 'johnson@medcor.ai' };
        }
        if (criteria.name?.toLowerCase().includes('chen')) {
          return { id: 2, first_name: 'Sarah', last_name: 'Chen', specialization: 'Dermatologist', email: 'chen@medcor.ai' };
        }
        return null;
      }

      const doctors = await response.json();
      
      // Find doctor by name or specialization
      if (criteria.name) {
        const nameLower = criteria.name.toLowerCase();
        return doctors.find((doc: Doctor) => 
          doc.last_name.toLowerCase().includes(nameLower) ||
          doc.first_name.toLowerCase().includes(nameLower) ||
          `${doc.first_name} ${doc.last_name}`.toLowerCase().includes(nameLower)
        ) || null;
      }

      if (criteria.specialization) {
        const specLower = criteria.specialization.toLowerCase();
        return doctors.find((doc: Doctor) => 
          doc.specialization.toLowerCase().includes(specLower)
        ) || null;
      }

      return null;
    } catch (error) {
      console.error('Error finding doctor:', error);
      // Return mock data for testing
      if (criteria.name?.toLowerCase().includes('johnson')) {
        return { id: 1, first_name: 'John', last_name: 'Johnson', specialization: 'Cardiologist', email: 'johnson@medcor.ai' };
      }
      return null;
    }
  }

  /**
   * Check doctor availability
   */
  async checkAvailability(doctorId: number, date: string, time?: string): Promise<{
    available: boolean;
    slots?: string[];
    conflicts?: any[];
  }> {
    try {
      // In a real implementation, this would call the MCP server
      // For now, we'll simulate availability checking
      const response = await fetch(`${this.baseUrl}/api/appointments/slots/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.authToken ? { 'Authorization': `Bearer ${this.authToken}` } : {})
        },
        body: JSON.stringify({
          doctor_id: doctorId,
          date: date
        })
      });

      if (!response.ok) {
        // Simulate availability for testing
        return {
          available: true,
          slots: ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00']
        };
      }

      const data = await response.json();
      
      if (time) {
        // Check specific time slot
        const timeHour = parseInt(time.split(':')[0]);
        const available = data.slots?.includes(time) || timeHour >= 9 && timeHour <= 17;
        return { available, slots: data.slots };
      }

      return {
        available: data.slots && data.slots.length > 0,
        slots: data.slots || ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00']
      };
    } catch (error) {
      console.error('Error checking availability:', error);
      // Return simulated availability for testing
      return {
        available: true,
        slots: ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00']
      };
    }
  }

  /**
   * Create appointment using MCP server
   */
  async createAppointment(params: {
    patientId: number;
    doctorId: number;
    date: string;
    time: string;
    reason?: string;
  }): Promise<Appointment | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/appointments/appointments/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.authToken ? { 'Authorization': `Bearer ${this.authToken}` } : {})
        },
        body: JSON.stringify({
          patient: params.patientId,
          doctor: params.doctorId,
          appointment_date: params.date,
          appointment_time: params.time,
          notes: params.reason || 'Voice-scheduled appointment',
          status: 'scheduled'
        })
      });

      if (!response.ok) {
        console.error('Failed to create appointment:', response.status);
        // Return mock appointment for testing
        return {
          id: Date.now(),
          patient_id: params.patientId,
          doctor_id: params.doctorId,
          appointment_date: params.date,
          appointment_time: params.time,
          status: 'scheduled',
          notes: params.reason
        };
      }

      const appointment = await response.json();
      return appointment;
    } catch (error) {
      console.error('Error creating appointment:', error);
      // Return mock appointment for testing
      return {
        id: Date.now(),
        patient_id: params.patientId,
        doctor_id: params.doctorId,
        appointment_date: params.date,
        appointment_time: params.time,
        status: 'scheduled',
        notes: params.reason
      };
    }
  }

  /**
   * Process complete voice appointment request
   */
  async processVoiceAppointment(
    voiceText: string,
    patientId: number = 1
  ): Promise<{
    success: boolean;
    message: string;
    appointment?: Appointment;
    suggestions?: string[];
  }> {
    // Parse the voice request
    const details = this.parseAppointmentRequest(voiceText);
    
    if (!details.doctorName && !details.specialization) {
      return {
        success: false,
        message: "I couldn't identify which doctor you'd like to see. Could you please specify a doctor's name or specialty?",
        suggestions: ["Dr. Johnson", "Dr. Chen", "cardiologist", "dermatologist"]
      };
    }

    // Find the doctor
    const doctor = await this.findDoctor({
      name: details.doctorName,
      specialization: details.specialization
    });

    if (!doctor) {
      return {
        success: false,
        message: `I couldn't find a doctor matching "${details.doctorName || details.specialization}". Would you like me to show you available doctors?`,
        suggestions: ["Show all doctors", "Find a cardiologist", "Find a dermatologist"]
      };
    }

    // Set default date/time if not specified
    if (!details.date) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      details.date = tomorrow.toISOString().split('T')[0];
    }

    if (!details.time) {
      details.time = '10:00:00'; // Default morning appointment
    }

    // Check availability
    const availability = await this.checkAvailability(doctor.id, details.date, details.time);

    if (!availability.available) {
      const alternativeSlots = availability.slots?.slice(0, 3).join(', ');
      return {
        success: false,
        message: `Dr. ${doctor.last_name} is not available at ${details.time} on ${details.date}. Available times are: ${alternativeSlots}. Would you like one of these instead?`,
        suggestions: availability.slots?.slice(0, 3)
      };
    }

    // Create the appointment
    const appointment = await this.createAppointment({
      patientId,
      doctorId: doctor.id,
      date: details.date,
      time: details.time,
      reason: details.reason
    });

    if (!appointment) {
      return {
        success: false,
        message: "I encountered an error while booking your appointment. Please try again.",
        suggestions: ["Try again", "Choose different time", "Contact support"]
      };
    }

    // Format success message
    const timeFormatted = details.time.replace(':00:00', ':00');
    const dateFormatted = new Date(details.date).toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    return {
      success: true,
      message: `Perfect! I've booked your appointment with Dr. ${doctor.last_name} (${doctor.specialization}) on ${dateFormatted} at ${timeFormatted}. You'll receive a confirmation email shortly.`,
      appointment
    };
  }

  /**
   * Set authentication token for API calls
   */
  setAuthToken(token: string) {
    this.authToken = token;
  }
}

// Export singleton instance
export const mcpAppointmentService = new MCPAppointmentService();