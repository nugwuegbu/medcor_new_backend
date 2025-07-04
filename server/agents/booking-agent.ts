interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  description?: string;
  attendees?: string[];
}

interface BookingRequest {
  patientName: string;
  patientEmail: string;
  doctorId: number;
  preferredDate: Date;
  preferredTime: string;
  reason: string;
  duration?: number; // minutes
}

interface AvailabilitySlot {
  date: Date;
  startTime: string;
  endTime: string;
  available: boolean;
  doctorId: number;
}

export class BookingAgent {
  private googleCalendarApiKey: string;
  private calendarId: string;

  constructor() {
    this.googleCalendarApiKey = process.env.GOOGLE_CALENDAR_API_KEY || "";
    this.calendarId = process.env.GOOGLE_CALENDAR_ID || "primary";
  }

  async checkDoctorAvailability(doctorId: number, date: Date): Promise<AvailabilitySlot[]> {
    try {
      if (!this.googleCalendarApiKey) {
        // Return mock availability for development
        return this.getMockAvailability(doctorId, date);
      }

      const startOfDay = new Date(date);
      startOfDay.setHours(9, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(17, 0, 0, 0);

      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${this.calendarId}/events?` +
        `timeMin=${startOfDay.toISOString()}&` +
        `timeMax=${endOfDay.toISOString()}&` +
        `key=${this.googleCalendarApiKey}`
      );

      if (!response.ok) {
        throw new Error(`Google Calendar API error: ${response.status}`);
      }

      const data = await response.json();
      return this.processAvailabilityData(data.items, doctorId, date);

    } catch (error) {
      console.error("Error checking availability:", error);
      return this.getMockAvailability(doctorId, date);
    }
  }

  async createAppointment(booking: BookingRequest): Promise<CalendarEvent> {
    try {
      if (!this.googleCalendarApiKey) {
        return this.createMockAppointment(booking);
      }

      const appointmentStart = new Date(booking.preferredDate);
      const [hours, minutes] = booking.preferredTime.split(':');
      appointmentStart.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      const appointmentEnd = new Date(appointmentStart);
      appointmentEnd.setMinutes(appointmentEnd.getMinutes() + (booking.duration || 30));

      const event = {
        summary: `Medical Appointment - ${booking.patientName}`,
        description: `Patient: ${booking.patientName}\nReason: ${booking.reason}\nEmail: ${booking.patientEmail}`,
        start: {
          dateTime: appointmentStart.toISOString(),
          timeZone: 'America/New_York',
        },
        end: {
          dateTime: appointmentEnd.toISOString(),
          timeZone: 'America/New_York',
        },
        attendees: [
          { email: booking.patientEmail },
        ],
      };

      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${this.calendarId}/events?key=${this.googleCalendarApiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.googleCalendarApiKey}`,
          },
          body: JSON.stringify(event),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to create calendar event: ${response.status}`);
      }

      const createdEvent = await response.json();
      
      return {
        id: createdEvent.id,
        title: createdEvent.summary,
        start: new Date(createdEvent.start.dateTime),
        end: new Date(createdEvent.end.dateTime),
        description: createdEvent.description,
        attendees: createdEvent.attendees?.map((a: any) => a.email) || [],
      };

    } catch (error) {
      console.error("Error creating appointment:", error);
      return this.createMockAppointment(booking);
    }
  }

  private getMockAvailability(doctorId: number, date: Date): AvailabilitySlot[] {
    const slots: AvailabilitySlot[] = [];
    const timeSlots = [
      "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
      "14:00", "14:30", "15:00", "15:30", "16:00", "16:30"
    ];

    timeSlots.forEach((time, index) => {
      slots.push({
        date: new Date(date),
        startTime: time,
        endTime: this.addMinutes(time, 30),
        available: Math.random() > 0.3, // 70% chance available
        doctorId,
      });
    });

    return slots;
  }

  private addMinutes(time: string, minutes: number): string {
    const [hours, mins] = time.split(':').map(Number);
    const totalMinutes = hours * 60 + mins + minutes;
    const newHours = Math.floor(totalMinutes / 60);
    const newMins = totalMinutes % 60;
    return `${newHours.toString().padStart(2, '0')}:${newMins.toString().padStart(2, '0')}`;
  }

  private createMockAppointment(booking: BookingRequest): CalendarEvent {
    const start = new Date(booking.preferredDate);
    const [hours, minutes] = booking.preferredTime.split(':');
    start.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    const end = new Date(start);
    end.setMinutes(end.getMinutes() + (booking.duration || 30));

    return {
      id: `mock_${Date.now()}`,
      title: `Medical Appointment - ${booking.patientName}`,
      start,
      end,
      description: `Patient: ${booking.patientName}\nReason: ${booking.reason}`,
      attendees: [booking.patientEmail],
    };
  }

  private processAvailabilityData(events: any[], doctorId: number, date: Date): AvailabilitySlot[] {
    const busySlots = events.map(event => ({
      start: new Date(event.start.dateTime || event.start.date),
      end: new Date(event.end.dateTime || event.end.date),
    }));

    return this.getMockAvailability(doctorId, date).map(slot => {
      const slotStart = new Date(slot.date);
      const [hours, minutes] = slot.startTime.split(':');
      slotStart.setHours(parseInt(hours), parseInt(minutes));

      const isConflict = busySlots.some(busy => 
        slotStart >= busy.start && slotStart < busy.end
      );

      return {
        ...slot,
        available: !isConflict,
      };
    });
  }
}

export const bookingAgent = new BookingAgent();