import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Building2, ExternalLink, Globe } from "lucide-react";
import { useSubdomain, type TenantInfo } from "@/hooks/useSubdomain";

export function TenantSwitcher() {
  const { tenantInfo, getAllTenants, getTenantUrl, switchTenant } = useSubdomain();
  const [isOpen, setIsOpen] = useState(false);

  const allTenants = getAllTenants().filter(t => t.subdomain !== "public");

  if (!tenantInfo || tenantInfo.subdomain !== "public") {
    return null; // Only show on main platform
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="mr-2">
          <Globe className="h-4 w-4 mr-2" />
          Switch Hospital
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Switch to Hospital Dashboard</DialogTitle>
          <DialogDescription>
            Select a hospital to access their dedicated AI chatbot platform
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {allTenants.map((tenant) => (
            <Card 
              key={tenant.id} 
              className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-blue-200"
              onClick={() => {
                switchTenant(tenant.id);
                setIsOpen(false);
              }}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Building2 
                      className="h-5 w-5" 
                      style={{ color: tenant.branding?.primaryColor || '#2563eb' }}
                    />
                    <CardTitle className="text-lg">{tenant.name}</CardTitle>
                  </div>
                  <Badge 
                    variant="outline" 
                    className="text-xs"
                    style={{ 
                      borderColor: tenant.branding?.primaryColor || '#2563eb',
                      color: tenant.branding?.primaryColor || '#2563eb'
                    }}
                  >
                    Active
                  </Badge>
                </div>
                <CardDescription className="text-sm">
                  {tenant.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-sm text-gray-600">
                    <strong>Subdomain:</strong> {tenant.subdomain}.medcor.ai
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-500">
                      Click to access dashboard
                    </div>
                    <ExternalLink className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="border-t pt-4 mt-4">
          <div className="text-center text-sm text-gray-500">
            <p>Each hospital has its own dedicated AI assistant with customized branding and knowledge base.</p>
            <p className="mt-1">
              <strong>Demo URLs:</strong> Visit medcorhospital.localhost:5000 or medcorclinic.localhost:5000
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}