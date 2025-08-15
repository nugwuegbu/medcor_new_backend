// Medical records and health data types
export interface MedicalRecord {
  id: string;
  patientId: string;
  type: MedicalRecordType;
  date: string;
  title: string;
  description?: string;
  diagnosis?: string;
  treatment?: string;
  medications?: Medication[];
  attachments?: Attachment[];
  doctorId?: string;
  doctorName?: string;
  createdAt: string;
  updatedAt: string;
  tenantId?: string;
}

export type MedicalRecordType = 
  | 'diagnosis'
  | 'lab-result'
  | 'prescription'
  | 'imaging'
  | 'surgery'
  | 'vaccination'
  | 'allergy'
  | 'general';

export interface Attachment {
  id: string;
  name: string;
  type: string;
  url: string;
  size: number;
  uploadedAt: string;
}

export interface HealthAnalysis {
  id: string;
  patientId: string;
  type: AnalysisType;
  date: string;
  results: AnalysisResult;
  recommendations?: string[];
  createdAt: string;
}

export type AnalysisType = 
  | 'skin'
  | 'hair'
  | 'lips'
  | 'face'
  | 'body';

export interface AnalysisResult {
  score?: number;
  conditions?: string[];
  severity?: 'mild' | 'moderate' | 'severe';
  details?: Record<string, any>;
  imageUrl?: string;
}

export interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
}

export interface VitalSigns {
  id: string;
  patientId: string;
  date: string;
  bloodPressure?: {
    systolic: number;
    diastolic: number;
  };
  heartRate?: number;
  temperature?: number;
  weight?: number;
  height?: number;
  bmi?: number;
  oxygenSaturation?: number;
  respiratoryRate?: number;
}