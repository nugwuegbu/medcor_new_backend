// Tenant configuration types
export interface TenantConfig {
  id: string;
  name: string;
  subdomain: string;
  logo?: string;
  favicon?: string;
  theme: TenantTheme;
  features: TenantFeatures;
  branding: TenantBranding;
  translations?: Record<string, any>;
}

export interface TenantTheme {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  borderRadius?: string;
  fontFamily?: string;
  customCSS?: string;
}

export interface TenantFeatures {
  appointments: boolean;
  chat: boolean;
  faceRecognition: boolean;
  healthAnalysis: boolean;
  voiceAssistant: boolean;
  payments: boolean;
  medicalRecords: boolean;
  analytics: boolean;
  customFeatures?: Record<string, boolean>;
}

export interface TenantBranding {
  companyName: string;
  tagline?: string;
  supportEmail: string;
  supportPhone?: string;
  address?: string;
  socialLinks?: {
    facebook?: string;
    twitter?: string;
    linkedin?: string;
    instagram?: string;
  };
}

export interface TenantInfo {
  id: string;
  name: string;
  subdomain: string;
  config?: TenantConfig;
}