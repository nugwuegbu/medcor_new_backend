import { useEffect, useState } from "react";

export interface TenantInfo {
  id: string;
  name: string;
  subdomain: string;
  schema_name: string;
  description: string;
  branding?: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    logoUrl?: string;
    faviconUrl?: string;
  };
}

// Sample tenant data that matches Django backend
const TENANT_CONFIG: Record<string, TenantInfo> = {
  "medcorhospital": {
    id: "medcorhospital",
    name: "Medcor Hospital",
    subdomain: "medcorhospital",
    schema_name: "medcorhospital",
    description: "Multi-specialty hospital with comprehensive medical services",
    branding: {
      primaryColor: "#2563eb", // Blue
      secondaryColor: "#1e40af",
      accentColor: "#3b82f6"
    }
  },
  "medcorclinic": {
    id: "medcorclinic", 
    name: "Medcor Clinic",
    subdomain: "medcorclinic",
    schema_name: "medcorclinic",
    description: "Specialized outpatient clinic providing focused medical care",
    branding: {
      primaryColor: "#059669", // Green
      secondaryColor: "#047857",
      accentColor: "#10b981"
    }
  },
  "public": {
    id: "public",
    name: "MedCor AI Platform",
    subdomain: "",
    schema_name: "public",
    description: "AI-powered healthcare communication platform",
    branding: {
      primaryColor: "#7c3aed", // Purple
      secondaryColor: "#6d28d9", 
      accentColor: "#8b5cf6"
    }
  }
};

export function useSubdomain() {
  const [tenantInfo, setTenantInfo] = useState<TenantInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const detectSubdomain = () => {
      const hostname = window.location.hostname;
      
      // Extract subdomain from hostname
      let subdomain = "";
      
      console.log('Detecting subdomain for hostname:', hostname);
      
      if (hostname.includes('.localhost')) {
        // Development: medcorhospital.localhost
        subdomain = hostname.split('.localhost')[0];
      } else if (hostname.includes('.medcor.ai')) {
        // Production: medcorhospital.medcor.ai
        subdomain = hostname.split('.medcor.ai')[0];
      } else if (hostname.includes('.replit.dev')) {
        // Replit development: check for subdomain patterns
        const parts = hostname.split('.');
        if (parts.length > 2) {
          // Look for tenant identifiers in the hostname
          const possibleSubdomain = parts[0];
          if (TENANT_CONFIG[possibleSubdomain]) {
            subdomain = possibleSubdomain;
          }
        }
      } else if (hostname === 'localhost') {
        // Direct localhost access - should be public
        subdomain = "public";
      } else {
        // Any other hostname (including Replit main domain) - default to public
        subdomain = "public";
      }

      // If no specific subdomain found or not in config, default to public
      if (!subdomain || !TENANT_CONFIG[subdomain]) {
        subdomain = "public";
      }
      
      console.log('Detected subdomain:', subdomain);

      const tenant = TENANT_CONFIG[subdomain];
      setTenantInfo(tenant);
      setIsLoading(false);

      // Apply tenant branding to document
      if (tenant.branding) {
        document.documentElement.style.setProperty('--tenant-primary', tenant.branding.primaryColor);
        document.documentElement.style.setProperty('--tenant-secondary', tenant.branding.secondaryColor);
        document.documentElement.style.setProperty('--tenant-accent', tenant.branding.accentColor);
      }

      // Update document title with tenant name
      if (subdomain !== "public") {
        document.title = `${tenant.name} - AI Assistant Dashboard`;
      }
    };

    detectSubdomain();
  }, []);

  const switchTenant = (tenantId: string) => {
    const tenant = TENANT_CONFIG[tenantId];
    if (tenant) {
      if (tenant.subdomain) {
        // Redirect to tenant subdomain
        const newHostname = `${tenant.subdomain}.${window.location.hostname.split('.').slice(-2).join('.')}`;
        window.location.href = `${window.location.protocol}//${newHostname}${window.location.pathname}`;
      } else {
        // Redirect to main domain
        const baseDomain = window.location.hostname.split('.').slice(-2).join('.');
        window.location.href = `${window.location.protocol}//${baseDomain}${window.location.pathname}`;
      }
    }
  };

  const getTenantUrl = (tenantId: string) => {
    const tenant = TENANT_CONFIG[tenantId];
    if (!tenant) return "#";
    
    if (tenant.subdomain) {
      const baseDomain = window.location.hostname.includes('.localhost') 
        ? 'localhost:5000' 
        : window.location.hostname.split('.').slice(-2).join('.');
      return `${window.location.protocol}//${tenant.subdomain}.${baseDomain}`;
    } else {
      const baseDomain = window.location.hostname.split('.').slice(-2).join('.');
      return `${window.location.protocol}//${baseDomain}`;
    }
  };

  const getAllTenants = () => Object.values(TENANT_CONFIG);

  return {
    tenantInfo,
    isLoading,
    switchTenant,
    getTenantUrl,
    getAllTenants,
    isMultiTenant: tenantInfo?.subdomain !== "" && tenantInfo?.id !== "public"
  };
}