import { TenantConfig } from '@/types/tenant';

// Default Medcor theme configuration
export const defaultTenantConfig: TenantConfig = {
  id: 'default',
  name: 'MedCor AI Platform',
  subdomain: 'public',
  logo: '/logo.svg',
  favicon: '/favicon.ico',
  theme: {
    primaryColor: 'hsl(271, 91%, 65%)', // Purple
    secondaryColor: 'hsl(217, 91%, 60%)', // Blue
    accentColor: 'hsl(142, 71%, 45%)', // Green
    backgroundColor: 'hsl(0, 0%, 100%)',
    textColor: 'hsl(222, 47%, 11%)',
    borderRadius: '0.5rem',
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
  },
  features: {
    appointments: true,
    chat: true,
    faceRecognition: true,
    healthAnalysis: true,
    voiceAssistant: true,
    payments: true,
    medicalRecords: true,
    analytics: true,
  },
  branding: {
    companyName: 'MedCor AI',
    tagline: 'Your AI-powered healthcare assistant',
    supportEmail: 'support@medcor.ai',
    supportPhone: '+1-800-MEDCOR',
    socialLinks: {
      facebook: 'https://facebook.com/medcorai',
      twitter: 'https://twitter.com/medcorai',
      linkedin: 'https://linkedin.com/company/medcorai',
    },
  },
};