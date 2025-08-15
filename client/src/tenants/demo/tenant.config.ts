import { TenantConfig } from '@/types/tenant';

// Demo Hospital tenant configuration
export const demoTenantConfig: TenantConfig = {
  id: 'demo',
  name: 'Demo Hospital',
  subdomain: 'demo',
  logo: '/tenants/demo/logo.svg',
  favicon: '/tenants/demo/favicon.ico',
  theme: {
    primaryColor: 'hsl(210, 100%, 50%)', // Blue
    secondaryColor: 'hsl(0, 100%, 50%)', // Red  
    accentColor: 'hsl(120, 100%, 40%)', // Green
    backgroundColor: 'hsl(0, 0%, 98%)',
    textColor: 'hsl(0, 0%, 20%)',
    borderRadius: '0.375rem',
    fontFamily: 'Roboto, system-ui, -apple-system, sans-serif',
  },
  features: {
    appointments: true,
    chat: true,
    faceRecognition: false,
    healthAnalysis: true,
    voiceAssistant: false,
    payments: true,
    medicalRecords: true,
    analytics: false,
  },
  branding: {
    companyName: 'Demo Hospital',
    tagline: 'Quality Healthcare for Everyone',
    supportEmail: 'support@demo-hospital.com',
    supportPhone: '+1-800-DEMO-MED',
    address: '123 Healthcare Ave, Medical City, MC 12345',
    socialLinks: {
      facebook: 'https://facebook.com/demohospital',
      linkedin: 'https://linkedin.com/company/demohospital',
    },
  },
};