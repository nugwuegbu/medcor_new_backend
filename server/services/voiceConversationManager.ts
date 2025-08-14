// Voice Conversation Manager for handling complex multi-step voice interactions
import OpenAI from 'openai';

interface ConversationState {
  feature: string;
  step: string;
  context: any;
  pendingAction?: string;
  formData?: any;
}

interface VoiceCommand {
  action: string;
  data?: any;
  message: string;
  nextStep?: string;
}

export class VoiceConversationManager {
  private sessions: Map<string, ConversationState> = new Map();
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({ 
      apiKey: process.env.OPENAI_API_KEY 
    });
  }

  async processVoiceInput(
    message: string, 
    sessionId: string,
    currentState?: ConversationState
  ): Promise<VoiceCommand> {
    // Get or create session state
    let state = currentState || this.sessions.get(sessionId) || {
      feature: 'idle',
      step: 'waiting',
      context: {}
    };

    // Detect feature from message if idle
    if (state.feature === 'idle') {
      const feature = this.detectFeature(message);
      if (feature) {
        state.feature = feature;
        state.step = 'initialize';
        this.sessions.set(sessionId, state);
        return this.initializeFeature(feature, sessionId);
      }
    }

    // Process based on current feature
    switch (state.feature) {
      case 'appointment':
        return await this.handleAppointmentFlow(message, state, sessionId);
      case 'face_analysis':
      case 'skin_analysis':
      case 'lips_analysis':
      case 'hair_analysis':
        return await this.handleAnalysisFlow(message, state, sessionId);
      case 'medical_records':
        return await this.handleMedicalRecordsFlow(message, state, sessionId);
      case 'doctor_list':
        return await this.handleDoctorSelection(message, state, sessionId);
      case 'profile':
        return await this.handleProfileFlow(message, state, sessionId);
      default:
        return this.handleGeneralQuery(message, sessionId);
    }
  }

  private detectFeature(message: string): string | null {
    const lower = message.toLowerCase();
    
    if (lower.includes('appointment') || lower.includes('book') || lower.includes('schedule')) {
      return 'appointment';
    } else if (lower.includes('face analysis')) {
      return 'face_analysis';
    } else if (lower.includes('skin analysis')) {
      return 'skin_analysis';
    } else if (lower.includes('lips analysis')) {
      return 'lips_analysis';
    } else if (lower.includes('hair analysis')) {
      return 'hair_analysis';
    } else if (lower.includes('medical record') || lower.includes('my records')) {
      return 'medical_records';
    } else if (lower.includes('show doctors') || lower.includes('list doctors')) {
      return 'doctor_list';
    } else if (lower.includes('profile') || lower.includes('login')) {
      return 'profile';
    }
    
    return null;
  }

  private initializeFeature(feature: string, sessionId: string): VoiceCommand {
    const initMessages: Record<string, VoiceCommand> = {
      appointment: {
        action: 'VOICE_FLOW:APPOINTMENT:START',
        message: "I'll help you book an appointment. What date would you like to schedule for? You can say things like 'tomorrow', 'next Monday', or a specific date.",
        nextStep: 'select_date'
      },
      face_analysis: {
        action: 'VOICE_FLOW:ANALYSIS:START',
        data: { type: 'face' },
        message: "I'll start the face analysis for you. Please position your face in front of the camera and say 'ready' when you're prepared.",
        nextStep: 'capture'
      },
      skin_analysis: {
        action: 'VOICE_FLOW:ANALYSIS:START',
        data: { type: 'skin' },
        message: "Let's analyze your skin health. Please ensure good lighting and say 'capture' when ready.",
        nextStep: 'capture'
      },
      lips_analysis: {
        action: 'VOICE_FLOW:ANALYSIS:START',
        data: { type: 'lips' },
        message: "I'll analyze your lips health. Please position your lips clearly in view and say 'analyze' when ready.",
        nextStep: 'capture'
      },
      hair_analysis: {
        action: 'VOICE_FLOW:ANALYSIS:START',
        data: { type: 'hair' },
        message: "Let's check your hair and scalp health. Please show your hair clearly and say 'start analysis'.",
        nextStep: 'capture'
      },
      medical_records: {
        action: 'VOICE_FLOW:RECORDS:START',
        message: "I'll help you access your medical records. Would you like to view all records, search for specific records, or upload new documents?",
        nextStep: 'select_action'
      },
      doctor_list: {
        action: 'VOICE_FLOW:DOCTORS:START',
        message: "Here are our available doctors. Would you like to filter by specialization, availability, or shall I list all doctors?",
        nextStep: 'filter_selection'
      },
      profile: {
        action: 'VOICE_FLOW:PROFILE:START',
        message: "Would you like to login to your existing account or create a new one? Say 'login' or 'register'.",
        nextStep: 'auth_choice'
      }
    };

    return initMessages[feature] || this.handleGeneralQuery('', sessionId);
  }

  private async handleAppointmentFlow(
    message: string, 
    state: ConversationState, 
    sessionId: string
  ): Promise<VoiceCommand> {
    const lower = message.toLowerCase();

    switch (state.step) {
      case 'initialize':
        state.step = 'select_date';
        state.formData = {};
        this.sessions.set(sessionId, state);
        return {
          action: 'VOICE_FLOW:APPOINTMENT:START',
          message: "What date would you like to schedule your appointment? You can say tomorrow, next week, or a specific date.",
          nextStep: 'select_date'
        };

      case 'select_date':
        const dateInfo = await this.extractDateFromText(message);
        if (dateInfo) {
          state.formData.date = dateInfo;
          state.step = 'select_doctor';
          this.sessions.set(sessionId, state);
          return {
            action: 'VOICE_FLOW:APPOINTMENT:DATE_SELECTED',
            data: { date: dateInfo },
            message: `Great! I've selected ${dateInfo} for your appointment. Now, which doctor would you like to see? We have Dr. Smith for general practice, Dr. Johnson for cardiology, and Dr. Williams for dermatology.`,
            nextStep: 'select_doctor'
          };
        }
        return {
          action: 'VOICE_FLOW:APPOINTMENT:DATE_ERROR',
          message: "I couldn't understand the date. Please say something like 'tomorrow', 'next Monday', or 'December 25th'.",
          nextStep: 'select_date'
        };

      case 'select_doctor':
        const doctorName = await this.extractDoctorFromText(message);
        if (doctorName) {
          state.formData.doctor = doctorName;
          state.step = 'select_time';
          this.sessions.set(sessionId, state);
          return {
            action: 'VOICE_FLOW:APPOINTMENT:DOCTOR_SELECTED',
            data: { doctor: doctorName },
            message: `Perfect! You've selected ${doctorName}. What time works best for you? Morning, afternoon, or evening?`,
            nextStep: 'select_time'
          };
        }
        return {
          action: 'VOICE_FLOW:APPOINTMENT:DOCTOR_ERROR',
          message: "Please specify which doctor you'd like to see. Say 'Dr. Smith', 'Dr. Johnson', or 'Dr. Williams'.",
          nextStep: 'select_doctor'
        };

      case 'select_time':
        const timeSlot = await this.extractTimeFromText(message);
        if (timeSlot) {
          state.formData.time = timeSlot;
          state.step = 'provide_reason';
          this.sessions.set(sessionId, state);
          return {
            action: 'VOICE_FLOW:APPOINTMENT:TIME_SELECTED',
            data: { time: timeSlot },
            message: `I've scheduled your appointment for ${timeSlot}. What's the reason for your visit?`,
            nextStep: 'provide_reason'
          };
        }
        return {
          action: 'VOICE_FLOW:APPOINTMENT:TIME_ERROR',
          message: "Please specify a time preference. You can say 'morning', '2 PM', or 'afternoon'.",
          nextStep: 'select_time'
        };

      case 'provide_reason':
        state.formData.reason = message;
        state.step = 'confirm';
        this.sessions.set(sessionId, state);
        return {
          action: 'VOICE_FLOW:APPOINTMENT:REASON_PROVIDED',
          data: { reason: message },
          message: `I've noted your reason as: "${message}". Shall I confirm your appointment with ${state.formData.doctor} on ${state.formData.date} at ${state.formData.time}? Say 'yes' to confirm or 'change' to modify.`,
          nextStep: 'confirm'
        };

      case 'confirm':
        if (lower.includes('yes') || lower.includes('confirm') || lower.includes('book')) {
          state.step = 'complete';
          this.sessions.set(sessionId, state);
          return {
            action: 'VOICE_FLOW:APPOINTMENT:CONFIRMED',
            data: state.formData,
            message: `Excellent! Your appointment has been booked with ${state.formData.doctor} on ${state.formData.date} at ${state.formData.time}. You'll receive a confirmation email shortly.`,
            nextStep: 'complete'
          };
        } else if (lower.includes('change') || lower.includes('modify')) {
          state.step = 'select_date';
          return {
            action: 'VOICE_FLOW:APPOINTMENT:RESTART',
            message: "No problem. Let's start over. What date would you like for your appointment?",
            nextStep: 'select_date'
          };
        }
        return {
          action: 'VOICE_FLOW:APPOINTMENT:CONFIRM_ERROR',
          message: "Please say 'yes' to confirm or 'change' to modify your appointment.",
          nextStep: 'confirm'
        };

      default:
        return this.handleGeneralQuery(message, sessionId);
    }
  }

  private async handleAnalysisFlow(
    message: string, 
    state: ConversationState, 
    sessionId: string
  ): Promise<VoiceCommand> {
    const lower = message.toLowerCase();

    switch (state.step) {
      case 'initialize':
        state.step = 'ready_for_capture';
        this.sessions.set(sessionId, state);
        return {
          action: `VOICE_FLOW:ANALYSIS:READY`,
          data: { type: state.feature },
          message: `The ${state.feature.replace('_', ' ')} camera is ready. Say 'capture' when you're positioned correctly.`,
          nextStep: 'capture'
        };

      case 'ready_for_capture':
      case 'capture':
        if (lower.includes('capture') || lower.includes('ready') || lower.includes('analyze') || lower.includes('start')) {
          state.step = 'analyzing';
          this.sessions.set(sessionId, state);
          return {
            action: `VOICE_FLOW:ANALYSIS:CAPTURE`,
            data: { type: state.feature },
            message: "Perfect! I'm capturing and analyzing now. This will take a moment...",
            nextStep: 'analyzing'
          };
        }
        return {
          action: 'VOICE_FLOW:ANALYSIS:WAITING',
          message: "Please say 'capture' when you're ready for the analysis.",
          nextStep: 'capture'
        };

      case 'analyzing':
        // This would be triggered after analysis completes
        state.step = 'results';
        this.sessions.set(sessionId, state);
        return {
          action: `VOICE_FLOW:ANALYSIS:COMPLETE`,
          data: { type: state.feature },
          message: "Analysis complete! Would you like me to explain the results or save them to your medical records?",
          nextStep: 'results'
        };

      case 'results':
        if (lower.includes('explain') || lower.includes('tell') || lower.includes('what')) {
          return {
            action: 'VOICE_FLOW:ANALYSIS:EXPLAIN',
            data: { type: state.feature },
            message: "Based on the analysis, your overall health score is good. Would you like specific recommendations?",
            nextStep: 'recommendations'
          };
        } else if (lower.includes('save') || lower.includes('record')) {
          return {
            action: 'VOICE_FLOW:ANALYSIS:SAVE',
            data: { type: state.feature },
            message: "I've saved the analysis to your medical records. Would you like to perform another analysis?",
            nextStep: 'complete'
          };
        }
        return {
          action: 'VOICE_FLOW:ANALYSIS:RESULTS_ERROR',
          message: "Would you like me to 'explain' the results or 'save' them to your records?",
          nextStep: 'results'
        };

      default:
        return this.handleGeneralQuery(message, sessionId);
    }
  }

  private async handleMedicalRecordsFlow(
    message: string, 
    state: ConversationState, 
    sessionId: string
  ): Promise<VoiceCommand> {
    const lower = message.toLowerCase();

    switch (state.step) {
      case 'initialize':
      case 'select_action':
        if (lower.includes('view') || lower.includes('show') || lower.includes('all')) {
          state.step = 'viewing';
          this.sessions.set(sessionId, state);
          return {
            action: 'VOICE_FLOW:RECORDS:VIEW_ALL',
            message: "I'm displaying all your medical records. Would you like me to read a specific record or filter by date?",
            nextStep: 'viewing'
          };
        } else if (lower.includes('search') || lower.includes('find')) {
          state.step = 'search';
          return {
            action: 'VOICE_FLOW:RECORDS:SEARCH',
            message: "What would you like to search for? You can say things like 'blood test from last month' or 'prescription history'.",
            nextStep: 'search'
          };
        } else if (lower.includes('upload') || lower.includes('add')) {
          state.step = 'upload';
          return {
            action: 'VOICE_FLOW:RECORDS:UPLOAD',
            message: "I'll help you upload a document. Please describe what type of document you're adding.",
            nextStep: 'upload'
          };
        }
        return {
          action: 'VOICE_FLOW:RECORDS:ACTION_ERROR',
          message: "Would you like to 'view all records', 'search for specific records', or 'upload new documents'?",
          nextStep: 'select_action'
        };

      case 'viewing':
        if (lower.includes('read') || lower.includes('open')) {
          const recordNumber = this.extractNumberFromText(message);
          return {
            action: 'VOICE_FLOW:RECORDS:READ',
            data: { recordId: recordNumber },
            message: `Reading record ${recordNumber || '1'}. Would you like me to continue with the next record?`,
            nextStep: 'viewing'
          };
        } else if (lower.includes('filter') || lower.includes('date')) {
          return {
            action: 'VOICE_FLOW:RECORDS:FILTER',
            message: "Please specify a date range. You can say 'last month', 'this year', or specific dates.",
            nextStep: 'filter'
          };
        }
        return {
          action: 'VOICE_FLOW:RECORDS:VIEWING',
          message: "You can say 'read record 1', 'filter by date', or 'done' to finish.",
          nextStep: 'viewing'
        };

      default:
        return this.handleGeneralQuery(message, sessionId);
    }
  }

  private async handleDoctorSelection(
    message: string, 
    state: ConversationState, 
    sessionId: string
  ): Promise<VoiceCommand> {
    const lower = message.toLowerCase();

    if (lower.includes('all') || lower.includes('list')) {
      return {
        action: 'VOICE_FLOW:DOCTORS:LIST_ALL',
        message: "Here are all available doctors. Say a doctor's name to view their profile or 'book' to schedule with them.",
        nextStep: 'select'
      };
    } else if (lower.includes('cardio') || lower.includes('heart')) {
      return {
        action: 'VOICE_FLOW:DOCTORS:FILTER',
        data: { specialty: 'cardiology' },
        message: "Showing cardiologists. Dr. Johnson specializes in heart conditions. Would you like to book with them?",
        nextStep: 'select'
      };
    } else if (lower.includes('skin') || lower.includes('derma')) {
      return {
        action: 'VOICE_FLOW:DOCTORS:FILTER',
        data: { specialty: 'dermatology' },
        message: "Dr. Williams is our dermatologist. They're available this week. Should I book an appointment?",
        nextStep: 'select'
      };
    }

    const doctorName = await this.extractDoctorFromText(message);
    if (doctorName) {
      return {
        action: 'VOICE_FLOW:DOCTORS:SELECT',
        data: { doctor: doctorName },
        message: `You've selected ${doctorName}. Would you like to book an appointment or view their full profile?`,
        nextStep: 'action'
      };
    }

    return {
      action: 'VOICE_FLOW:DOCTORS:LIST',
      message: "You can filter by specialty like 'cardiologist' or 'dermatologist', or say 'all doctors'.",
      nextStep: 'filter_selection'
    };
  }

  private async handleProfileFlow(
    message: string, 
    state: ConversationState, 
    sessionId: string
  ): Promise<VoiceCommand> {
    const lower = message.toLowerCase();

    switch (state.step) {
      case 'auth_choice':
        if (lower.includes('login') || lower.includes('sign in')) {
          state.step = 'login_email';
          this.sessions.set(sessionId, state);
          return {
            action: 'VOICE_FLOW:PROFILE:LOGIN',
            message: "Please say your email address slowly and clearly.",
            nextStep: 'login_email'
          };
        } else if (lower.includes('register') || lower.includes('new') || lower.includes('create')) {
          state.step = 'register_name';
          return {
            action: 'VOICE_FLOW:PROFILE:REGISTER',
            message: "Let's create your account. Please tell me your full name.",
            nextStep: 'register_name'
          };
        }
        return {
          action: 'VOICE_FLOW:PROFILE:AUTH_ERROR',
          message: "Please say 'login' for existing account or 'register' to create new account.",
          nextStep: 'auth_choice'
        };

      case 'login_email':
        const email = this.extractEmailFromText(message);
        if (email) {
          state.formData = { email };
          state.step = 'login_password';
          this.sessions.set(sessionId, state);
          return {
            action: 'VOICE_FLOW:PROFILE:EMAIL_PROVIDED',
            data: { email },
            message: "Email received. For security, please type your password on the screen or say 'send reset link' for password recovery.",
            nextStep: 'login_password'
          };
        }
        return {
          action: 'VOICE_FLOW:PROFILE:EMAIL_ERROR',
          message: "I couldn't understand the email. Please spell it out slowly, for example: 'j o h n at gmail dot com'.",
          nextStep: 'login_email'
        };

      default:
        return this.handleGeneralQuery(message, sessionId);
    }
  }

  private handleGeneralQuery(message: string, sessionId: string): VoiceCommand {
    return {
      action: 'VOICE_FLOW:GENERAL',
      message: "I can help you with appointments, medical analysis, records, finding doctors, or account management. What would you like to do?",
      nextStep: 'waiting'
    };
  }

  // Helper methods for extracting information from natural language
  private async extractDateFromText(text: string): Promise<string | null> {
    const lower = text.toLowerCase();
    const today = new Date();
    
    if (lower.includes('tomorrow')) {
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow.toLocaleDateString();
    } else if (lower.includes('today')) {
      return today.toLocaleDateString();
    } else if (lower.includes('next week')) {
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);
      return nextWeek.toLocaleDateString();
    } else if (lower.includes('monday') || lower.includes('tuesday') || lower.includes('wednesday') || 
               lower.includes('thursday') || lower.includes('friday')) {
      // Parse day of week
      const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const dayIndex = days.findIndex(day => lower.includes(day));
      if (dayIndex !== -1) {
        const targetDate = new Date(today);
        const currentDay = today.getDay();
        const daysToAdd = (dayIndex - currentDay + 7) % 7 || 7;
        targetDate.setDate(targetDate.getDate() + daysToAdd);
        return targetDate.toLocaleDateString();
      }
    }
    
    // Try to extract date using GPT
    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "Extract the date from the user's message and return it in MM/DD/YYYY format. If no date found, return null. Today is " + today.toLocaleDateString()
          },
          {
            role: "user",
            content: text
          }
        ],
        max_tokens: 20
      });
      
      const extracted = response.choices[0].message.content?.trim();
      return extracted !== 'null' ? extracted : null;
    } catch (error) {
      console.error('Date extraction error:', error);
      return null;
    }
  }

  private async extractDoctorFromText(text: string): Promise<string | null> {
    const lower = text.toLowerCase();
    
    // Common doctor names in the system
    const doctors = [
      'Dr. Smith', 'Dr. Johnson', 'Dr. Williams', 'Dr. Brown', 
      'Dr. Davis', 'Dr. Martinez', 'Dr. Anderson', 'Dr. Wilson'
    ];
    
    for (const doctor of doctors) {
      if (lower.includes(doctor.toLowerCase())) {
        return doctor;
      }
    }
    
    // Check for just last names
    if (lower.includes('smith')) return 'Dr. Smith';
    if (lower.includes('johnson')) return 'Dr. Johnson';
    if (lower.includes('williams')) return 'Dr. Williams';
    
    return null;
  }

  private async extractTimeFromText(text: string): Promise<string | null> {
    const lower = text.toLowerCase();
    
    if (lower.includes('morning')) {
      return '9:00 AM';
    } else if (lower.includes('afternoon')) {
      return '2:00 PM';
    } else if (lower.includes('evening')) {
      return '5:00 PM';
    }
    
    // Extract specific times
    const timeMatch = text.match(/(\d{1,2})\s*(am|pm|AM|PM)/i);
    if (timeMatch) {
      return `${timeMatch[1]}:00 ${timeMatch[2].toUpperCase()}`;
    }
    
    return null;
  }

  private extractNumberFromText(text: string): number | null {
    const match = text.match(/\d+/);
    return match ? parseInt(match[0]) : null;
  }

  private extractEmailFromText(text: string): string | null {
    // Remove spaces and common speech patterns
    let processed = text.toLowerCase()
      .replace(/\s+at\s+/g, '@')
      .replace(/\s+dot\s+/g, '.')
      .replace(/\s+/g, '');
    
    // Check if it looks like an email
    const emailRegex = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/;
    const match = processed.match(emailRegex);
    
    return match ? match[0] : null;
  }

  // Clear session state
  clearSession(sessionId: string): void {
    this.sessions.delete(sessionId);
  }

  // Get current session state
  getSessionState(sessionId: string): ConversationState | undefined {
    return this.sessions.get(sessionId);
  }
}

export const voiceConversationManager = new VoiceConversationManager();