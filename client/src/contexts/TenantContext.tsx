import React, { createContext, useContext, useEffect, useState } from 'react';
import { TenantConfig } from '@/types/tenant';
import { defaultTenantConfig } from '@/tenants/default/tenant.config';
import { demoTenantConfig } from '@/tenants/demo/tenant.config';

interface TenantContextType {
  tenantConfig: TenantConfig;
  setTenantConfig: (config: TenantConfig) => void;
  isLoading: boolean;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

// Map of tenant configs
const tenantConfigs: Record<string, TenantConfig> = {
  default: defaultTenantConfig,
  demo: demoTenantConfig,
  public: defaultTenantConfig,
};

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tenantConfig, setTenantConfig] = useState<TenantConfig>(defaultTenantConfig);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get subdomain from hostname
    const hostname = window.location.hostname;
    const parts = hostname.split('.');
    const subdomain = parts.length > 2 ? parts[0] : 'public';
    
    // Load tenant config based on subdomain
    const config = tenantConfigs[subdomain] || defaultTenantConfig;
    setTenantConfig(config);
    
    // Apply theme CSS variables
    applyTheme(config.theme);
    
    setIsLoading(false);
  }, []);

  const applyTheme = (theme: TenantConfig['theme']) => {
    const root = document.documentElement;
    root.style.setProperty('--primary', theme.primaryColor);
    root.style.setProperty('--secondary', theme.secondaryColor);
    root.style.setProperty('--accent', theme.accentColor);
    root.style.setProperty('--background', theme.backgroundColor);
    root.style.setProperty('--foreground', theme.textColor);
    
    if (theme.borderRadius) {
      root.style.setProperty('--radius', theme.borderRadius);
    }
    
    if (theme.fontFamily) {
      root.style.setProperty('--font-family', theme.fontFamily);
    }
  };

  return (
    <TenantContext.Provider value={{ tenantConfig, setTenantConfig, isLoading }}>
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};