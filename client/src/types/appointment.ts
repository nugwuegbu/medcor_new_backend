// Appointment related types
export interface Appointment {
  id: string;
  patientId: string;
  patientName?: string;
  doctorId: string;
  doctorName?: string;
  date: string;
  time: string;
  status: AppointmentStatus;
  type: AppointmentType;
  duration: number; // in minutes
  reason?: string;
  notes?: string;
  prescription?: Prescription;
  followUp?: boolean;
  createdAt: string;
  updatedAt: string;
  tenantId?: string;
}

export type AppointmentStatus = 
  | 'scheduled'
  | 'confirmed'
  | 'in-progress'
  | 'completed'
  | 'cancelled'
  | 'no-show';

export type AppointmentType = 
  | 'consultation'
  | 'follow-up'
  | 'emergency'
  | 'routine-checkup'
  | 'vaccination'
  | 'lab-test'
  | 'surgery';

export interface Prescription {
  id: string;
  appointmentId: string;
  medications: Medication[];
  instructions?: string;
  createdAt: string;
}

export interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
}

export interface TimeSlot {
  id: string;
  doctorId: string;
  date: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  maxPatients?: number;
  currentPatients?: number;
}