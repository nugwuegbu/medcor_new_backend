import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Settings, Key, Eye, EyeOff, Save, TestTube } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function SettingsPage() {
  const { toast } = useToast();
  const [showKeys, setShowKeys] = useState(false);
  const [formData, setFormData] = useState({
    heygenApiKey: "",
    azureFaceApiKey: "",
    azureFaceEndpoint: "",
    googleCalendarApiKey: "",
    openaiApiKey: "",
    tcallApiKey: "",
    hubspotApiKey: "",
    enableFaceRecognition: true,
    enableMultiLanguage: true,
    enableHeygenAvatars: true,
    defaultLanguage: "en"
  });

  const testApiMutation = useMutation({
    mutationFn: async (apiType: string) => {
      const response = await apiRequest("POST", `/api/test/${apiType}`, {
        ...formData
      });
      return response.json();
    },
    onSuccess: (data, apiType) => {
      toast({
        title: "API Test Successful",
        description: `${apiType} API is working correctly`,
      });
    },
    onError: (error, apiType) => {
      toast({
        title: "API Test Failed",
        description: `${apiType} API test failed. Please check your credentials.`,
        variant: "destructive",
      });
    },
  });

  const saveSettingsMutation = useMutation({
    mutationFn: async (settings: typeof formData) => {
      const response = await apiRequest("POST", "/api/settings", settings);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Settings Saved",
        description: "Your API keys and settings have been saved successfully",
      });
    },
    onError: () => {
      toast({
        title: "Save Failed",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleInputChange = (key: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = () => {
    saveSettingsMutation.mutate(formData);
  };

  const handleTestApi = (apiType: string) => {
    testApiMutation.mutate(apiType);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            <Settings className="inline h-8 w-8 mr-3" />
            API Configuration & Settings
          </h1>
          <p className="text-gray-600">
            Configure your API keys to enable full functionality including HeyGen avatars, 
            face recognition, and multi-language support.
          </p>
        </div>

        <div className="grid gap-6">
          {/* HeyGen API Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Key className="h-4 w-4 text-blue-600" />
                </div>
                HeyGen Interactive Avatars
                <Badge variant="secondary">Required for Avatar Chat</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="heygenApiKey">HeyGen API Key</Label>
                <div className="relative">
                  <Input
                    id="heygenApiKey"
                    type={showKeys ? "text" : "password"}
                    placeholder="Enter your HeyGen API key"
                    value={formData.heygenApiKey}
                    onChange={(e) => handleInputChange("heygenApiKey", e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2"
                    onClick={() => setShowKeys(!showKeys)}
                  >
                    {showKeys ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-sm text-gray-500">
                  Get your API key from <a href="https://heygen.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">HeyGen Dashboard</a>
                </p>
              </div>
              <Button
                onClick={() => handleTestApi("heygen")}
                disabled={!formData.heygenApiKey || testApiMutation.isPending}
                variant="outline"
                size="sm"
              >
                <TestTube className="h-4 w-4 mr-2" />
                Test HeyGen API
              </Button>
            </CardContent>
          </Card>

          {/* Face Recognition API Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <Key className="h-4 w-4 text-green-600" />
                </div>
                Face Recognition (Azure Face API)
                <Badge variant="secondary">Required for Passwordless Login</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="azureFaceApiKey">Azure Face API Key</Label>
                <Input
                  id="azureFaceApiKey"
                  type={showKeys ? "text" : "password"}
                  placeholder="Enter your Azure Face API key"
                  value={formData.azureFaceApiKey}
                  onChange={(e) => handleInputChange("azureFaceApiKey", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="azureFaceEndpoint">Azure Face API Endpoint</Label>
                <Input
                  id="azureFaceEndpoint"
                  type="url"
                  placeholder="https://yourservice.cognitiveservices.azure.com/"
                  value={formData.azureFaceEndpoint}
                  onChange={(e) => handleInputChange("azureFaceEndpoint", e.target.value)}
                />
              </div>
              <p className="text-sm text-gray-500">
                Get your credentials from <a href="https://portal.azure.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Azure Portal</a>
              </p>
              <Button
                onClick={() => handleTestApi("azure-face")}
                disabled={!formData.azureFaceApiKey || !formData.azureFaceEndpoint || testApiMutation.isPending}
                variant="outline"
                size="sm"
              >
                <TestTube className="h-4 w-4 mr-2" />
                Test Face Recognition
              </Button>
            </CardContent>
          </Card>

          {/* Google Calendar API Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <Key className="h-4 w-4 text-red-600" />
                </div>
                Google Calendar Integration
                <Badge variant="secondary">Required for Booking</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="googleCalendarApiKey">Google Calendar API Key</Label>
                <Input
                  id="googleCalendarApiKey"
                  type={showKeys ? "text" : "password"}
                  placeholder="Enter your Google Calendar API key"
                  value={formData.googleCalendarApiKey}
                  onChange={(e) => handleInputChange("googleCalendarApiKey", e.target.value)}
                />
              </div>
              <p className="text-sm text-gray-500">
                Get your API key from <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google Cloud Console</a>
              </p>
              <Button
                onClick={() => handleTestApi("google-calendar")}
                disabled={!formData.googleCalendarApiKey || testApiMutation.isPending}
                variant="outline"
                size="sm"
              >
                <TestTube className="h-4 w-4 mr-2" />
                Test Calendar API
              </Button>
            </CardContent>
          </Card>

          {/* OpenAI API Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <Key className="h-4 w-4 text-purple-600" />
                </div>
                OpenAI GPT Integration
                <Badge variant="secondary">Required for AI Chat</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="openaiApiKey">OpenAI API Key</Label>
                <Input
                  id="openaiApiKey"
                  type={showKeys ? "text" : "password"}
                  placeholder="Enter your OpenAI API key"
                  value={formData.openaiApiKey}
                  onChange={(e) => handleInputChange("openaiApiKey", e.target.value)}
                />
              </div>
              <p className="text-sm text-gray-500">
                Get your API key from <a href="https://platform.openai.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">OpenAI Dashboard</a>
              </p>
              <Button
                onClick={() => handleTestApi("openai")}
                disabled={!formData.openaiApiKey || testApiMutation.isPending}
                variant="outline"
                size="sm"
              >
                <TestTube className="h-4 w-4 mr-2" />
                Test OpenAI API
              </Button>
            </CardContent>
          </Card>

          {/* Feature Toggles */}
          <Card>
            <CardHeader>
              <CardTitle>Feature Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Face Recognition</Label>
                  <p className="text-sm text-gray-500">Allow passwordless login via face recognition</p>
                </div>
                <Switch
                  checked={formData.enableFaceRecognition}
                  onCheckedChange={(checked) => handleInputChange("enableFaceRecognition", checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Multi-Language Support</Label>
                  <p className="text-sm text-gray-500">Automatic language detection and translation</p>
                </div>
                <Switch
                  checked={formData.enableMultiLanguage}
                  onCheckedChange={(checked) => handleInputChange("enableMultiLanguage", checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable HeyGen Avatars</Label>
                  <p className="text-sm text-gray-500">Use interactive avatars for chat responses</p>
                </div>
                <Switch
                  checked={formData.enableHeygenAvatars}
                  onCheckedChange={(checked) => handleInputChange("enableHeygenAvatars", checked)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="defaultLanguage">Default Language</Label>
                <Input
                  id="defaultLanguage"
                  placeholder="en"
                  value={formData.defaultLanguage}
                  onChange={(e) => handleInputChange("defaultLanguage", e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              disabled={saveSettingsMutation.isPending}
              size="lg"
            >
              <Save className="h-4 w-4 mr-2" />
              {saveSettingsMutation.isPending ? "Saving..." : "Save Configuration"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}