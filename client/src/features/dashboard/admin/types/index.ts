// Admin dashboard types
export interface AdminStats {
  totalPatients: number;
  totalDoctors: number;
  totalAppointments: number;
  pendingAppointments: number;
  todayAppointments: number;
  monthlyGrowth: number;
}

export interface AnalysisTrackingStats {
  faceAnalyses: number;
  hairAnalyses: number;
  lipsAnalyses: number;
  skinAnalyses: number;
  hairExtensionAnalyses: number;
  totalAnalyses: number;
  growthPercentage: number;
}

export interface ActivityFeedItem {
  type: 'blue' | 'green' | 'yellow' | 'red';
  message: string;
  description: string;
  time: string;
  timestamp: number;
}

export type AdminView = 
  | 'overview'
  | 'patients'
  | 'doctors'
  | 'appointments'
  | 'medical-records'
  | 'subscriptions'
  | 'analysis-tracking'
  | 'analytics'
  | 'settings';

export interface AdminSidebarItem {
  id: AdminView;
  label: string;
  icon: React.ElementType;
}