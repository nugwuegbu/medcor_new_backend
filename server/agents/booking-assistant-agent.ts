import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import OpenAI from 'openai';
import { storage } from '../storage';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface BookingStep {
  step: 'date_selected' | 'doctor_selection' | 'form_filling' | 'confirmation';
  message: string;
  suggestedActions?: string[];
  requiresInput?: boolean;
}

export interface BookingContext {
  selectedDate?: string;
  selectedDoctorId?: number;
  patientName?: string;
  patientEmail?: string;
  patientPhone?: string;
  reason?: string;
  currentStep: BookingStep['step'];
  sessionId: string;
}

export class BookingAssistantAgent {
  private contexts: Map<string, BookingContext> = new Map();

  async initializeBooking(sessionId: string, selectedDate: string): Promise<BookingStep> {
    const context: BookingContext = {
      selectedDate,
      currentStep: 'date_selected',
      sessionId
    };
    
    this.contexts.set(sessionId, context);
    
    return {
      step: 'date_selected',
      message: `Perfect! I see you've selected ${selectedDate} for your appointment. Now let's choose a doctor for your consultation. Please select one of our available doctors.`,
      suggestedActions: ['View available doctors', 'Tell me about the doctors'],
      requiresInput: true
    };
  }

  async processDoctorSelection(sessionId: string, doctorId: number): Promise<BookingStep> {
    const context = this.contexts.get(sessionId);
    if (!context) {
      throw new Error('Booking session not found');
    }

    const doctor = await storage.getDoctor(doctorId);
    if (!doctor) {
      throw new Error('Doctor not found');
    }

    context.selectedDoctorId = doctorId;
    context.currentStep = 'form_filling';
    this.contexts.set(sessionId, context);

    return {
      step: 'form_filling',
      message: `Excellent choice! You've selected ${doctor.name} (${doctor.specialty}). Now I'll help you fill out the appointment form. Let's start with your personal information.`,
      suggestedActions: ['Fill form with voice', 'Enter details manually'],
      requiresInput: true
    };
  }

  async processFormInput(sessionId: string, userInput: string): Promise<BookingStep> {
    const context = this.contexts.get(sessionId);
    if (!context) {
      throw new Error('Booking session not found');
    }

    // Use AI to extract information from user input
    const extractedInfo = await this.extractPatientInfo(userInput, context);
    
    // Update context with extracted information
    Object.assign(context, extractedInfo);
    this.contexts.set(sessionId, context);

    const missingFields = this.getMissingFields(context);
    
    if (missingFields.length > 0) {
      return {
        step: 'form_filling',
        message: `Great! I've captured some information. I still need: ${missingFields.join(', ')}. You can tell me or type the missing details.`,
        suggestedActions: [`Provide ${missingFields[0]}`, 'Continue with voice'],
        requiresInput: true
      };
    }

    // All information collected, move to confirmation
    context.currentStep = 'confirmation';
    this.contexts.set(sessionId, context);

    const doctor = await storage.getDoctor(context.selectedDoctorId!);
    return {
      step: 'confirmation',
      message: `Perfect! Let me confirm your appointment:
      
📅 Date: ${context.selectedDate}
👨‍⚕️ Doctor: ${doctor?.name} (${doctor?.specialty})
👤 Patient: ${context.patientName}
📧 Email: ${context.patientEmail}
📱 Phone: ${context.patientPhone}
💬 Reason: ${context.reason}

Would you like to confirm this appointment?`,
      suggestedActions: ['Confirm appointment', 'Make changes'],
      requiresInput: true
    };
  }

  async confirmAppointment(sessionId: string): Promise<BookingStep> {
    const context = this.contexts.get(sessionId);
    if (!context) {
      throw new Error('Booking session not found');
    }

    try {
      // Create appointment in database
      const appointment = await storage.createAppointment({
        patientName: context.patientName!,
        patientEmail: context.patientEmail!,
        patientPhone: context.patientPhone!,
        doctorId: context.selectedDoctorId!,
        appointmentDate: new Date(context.selectedDate!),
        appointmentTime: '09:00',
        reason: context.reason!
      });

      // Clear context
      this.contexts.delete(sessionId);

      return {
        step: 'confirmation',
        message: `🎉 Appointment confirmed! Your appointment has been booked successfully. 

📋 Appointment ID: ${appointment.id}
📅 Date & Time: ${context.selectedDate}
👨‍⚕️ Doctor: ${(await storage.getDoctor(context.selectedDoctorId!))?.name}

You will receive a confirmation email shortly. Is there anything else I can help you with?`,
        suggestedActions: ['Book another appointment', 'View my appointments'],
        requiresInput: false
      };
    } catch (error) {
      console.error('Error confirming appointment:', error);
      return {
        step: 'confirmation',
        message: 'Sorry, there was an error confirming your appointment. Please try again or contact support.',
        suggestedActions: ['Try again', 'Contact support'],
        requiresInput: true
      };
    }
  }

  private async extractPatientInfo(userInput: string, context: BookingContext): Promise<Partial<BookingContext>> {
    const messages: ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: `You are a medical appointment booking assistant. Extract patient information from the user's message.
        
Current context:
- Date: ${context.selectedDate}
- Doctor ID: ${context.selectedDoctorId}
- Current patient name: ${context.patientName || 'not provided'}
- Current patient email: ${context.patientEmail || 'not provided'}
- Current patient phone: ${context.patientPhone || 'not provided'}
- Current reason: ${context.reason || 'not provided'}

Extract and update only the information provided in the user's message. Return a JSON object with only the fields that were mentioned:
{
  "patientName": "full name if provided",
  "patientEmail": "email if provided", 
  "patientPhone": "phone number if provided",
  "reason": "reason for appointment if provided"
}

If no relevant information is found, return an empty object {}.`
      },
      {
        role: 'user',
        content: userInput
      }
    ];

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages,
        response_format: { type: 'json_object' },
        temperature: 0.3
      });

      const extracted = JSON.parse(response.choices[0].message.content || '{}');
      return extracted;
    } catch (error) {
      console.error('Error extracting patient info:', error);
      return {};
    }
  }

  private getMissingFields(context: BookingContext): string[] {
    const missing: string[] = [];
    
    if (!context.patientName) missing.push('your full name');
    if (!context.patientEmail) missing.push('your email address');
    if (!context.patientPhone) missing.push('your phone number');
    if (!context.reason) missing.push('reason for appointment');
    
    return missing;
  }

  getBookingContext(sessionId: string): BookingContext | undefined {
    return this.contexts.get(sessionId);
  }

  clearBookingContext(sessionId: string): void {
    this.contexts.delete(sessionId);
  }
}

export const bookingAssistantAgent = new BookingAssistantAgent();