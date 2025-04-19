import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Info, CheckCircle, X, RefreshCw, KeyRound } from "lucide-react";

interface FormsiteCredentials {
  apiKey: string;
  isConfigured: boolean;
  lastVerified?: string;
  forms?: FormsiteForm[];
}

interface FormsiteForm {
  id: string;
  name: string;
  lastUpdated: string;
  isActive: boolean;
}

export default function FormsiteIntegration() {
  const { toast } = useToast();
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [selectedForms, setSelectedForms] = useState<Record<string, boolean>>({});

  // Fetch existing credentials and form configuration
  const { data: credentials, isLoading } = useQuery({
    queryKey: ["/api/integrations/formsite"],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  useEffect(() => {
    if (credentials) {
      // Set API key (masked)
      const maskedKey = credentials.apiKey 
        ? `${credentials.apiKey.substring(0, 4)}...${credentials.apiKey.substring(credentials.apiKey.length - 4)}`
        : "";
      setApiKey(maskedKey);
      
      // Set selected forms
      if (credentials.forms) {
        const formSelection: Record<string, boolean> = {};
        credentials.forms.forEach((form: FormsiteForm) => {
          formSelection[form.id] = form.isActive;
        });
        setSelectedForms(formSelection);
      }
    }
  }, [credentials]);

  // Save API key mutation
  const saveApiKeyMutation = useMutation({
    mutationFn: async (newApiKey: string) => {
      const response = await fetch('/api/integrations/formsite/credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ apiKey: newApiKey }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save API key');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/integrations/formsite'] });
      toast({
        title: "API Key Saved",
        description: "Your FormSite API key has been saved successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Save API Key",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Verify API key mutation
  const verifyApiKeyMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/integrations/formsite/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to verify API key');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/integrations/formsite'] });
      toast({
        title: "API Key Verified",
        description: "Your FormSite API key has been verified successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "API Key Verification Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update form settings mutation
  const updateFormSettingsMutation = useMutation({
    mutationFn: async (formSettings: Record<string, boolean>) => {
      const response = await fetch('/api/integrations/formsite/forms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ forms: formSettings }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update form settings');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/integrations/formsite'] });
      toast({
        title: "Form Settings Updated",
        description: "Your FormSite form settings have been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Update Form Settings",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Sync forms mutation
  const syncFormsMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/integrations/formsite/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to sync forms');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/integrations/formsite'] });
      toast({
        title: "Forms Synced",
        description: "Your FormSite forms have been synced successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Sync Forms",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSaveApiKey = () => {
    saveApiKeyMutation.mutate(apiKey);
  };

  const handleVerifyApiKey = () => {
    verifyApiKeyMutation.mutate();
  };

  const handleFormToggle = (formId: string, enabled: boolean) => {
    setSelectedForms({
      ...selectedForms,
      [formId]: enabled,
    });
  };

  const handleSaveFormSettings = () => {
    updateFormSettingsMutation.mutate(selectedForms);
  };

  const handleSyncForms = () => {
    syncFormsMutation.mutate();
  };

  const isApiKeyConfigured = credentials?.isConfigured;
  const lastVerified = credentials?.lastVerified 
    ? new Date(credentials.lastVerified).toLocaleString() 
    : "Never";

  return (
    <Card className="w-full">
      <CardHeader className="bg-slate-50">
        <CardTitle>FormSite Integration</CardTitle>
        <CardDescription>
          Connect your FormSite account to automatically retrieve patient forms
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        {/* API Key Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">API Credentials</h3>
            {isApiKeyConfigured && (
              <Badge 
                variant="outline" 
                className="bg-green-50 text-green-700 border-green-200 flex items-center gap-1"
              >
                <CheckCircle className="h-3.5 w-3.5" />
                <span>Connected</span>
              </Badge>
            )}
          </div>
          
          <div className="grid gap-3">
            <div className="space-y-2">
              <Label htmlFor="api-key">FormSite API Key</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="api-key"
                    type={showApiKey ? "text" : "password"}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Enter your FormSite API key"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 text-gray-400 hover:text-gray-600"
                    onClick={() => setShowApiKey(!showApiKey)}
                  >
                    {showApiKey ? "Hide" : "Show"}
                  </Button>
                </div>
                <Button onClick={handleSaveApiKey} disabled={saveApiKeyMutation.isPending}>
                  {saveApiKeyMutation.isPending ? "Saving..." : "Save"}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Your API key is securely stored and used to access forms from your FormSite account.
              </p>
              {isApiKeyConfigured && (
                <p className="text-xs text-gray-500">
                  Last verified: {lastVerified}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-2 h-6 px-2 text-blue-600"
                    onClick={handleVerifyApiKey}
                    disabled={verifyApiKeyMutation.isPending}
                  >
                    {verifyApiKeyMutation.isPending ? 
                      "Verifying..." : 
                      <span className="flex items-center gap-1">
                        <RefreshCw className="h-3 w-3" /> Verify
                      </span>
                    }
                  </Button>
                </p>
              )}
            </div>
          </div>
        </div>

        <Separator />

        {/* Instructions for finding API key */}
        <div className="rounded-md bg-blue-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <Info className="h-5 w-5 text-blue-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">How to find your FormSite API Key</h3>
              <div className="mt-2 text-sm text-blue-700">
                <ol className="list-decimal pl-5 space-y-1">
                  <li>Log in to your FormSite account</li>
                  <li>Go to "Account" &gt; "API Access"</li>
                  <li>Under "API Keys", create a new key or copy an existing one</li>
                  <li>Make sure the key has access to forms and results</li>
                </ol>
              </div>
            </div>
          </div>
        </div>

        {isApiKeyConfigured && (
          <>
            <Separator />
            
            {/* Form Settings Section */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Form Settings</h3>
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={handleSyncForms}
                  disabled={syncFormsMutation.isPending}
                  className="flex items-center gap-1"
                >
                  <RefreshCw className="h-4 w-4" />
                  {syncFormsMutation.isPending ? "Syncing..." : "Sync Forms"}
                </Button>
              </div>
              
              {credentials?.forms && credentials.forms.length > 0 ? (
                <div className="space-y-4">
                  <p className="text-sm text-gray-500">
                    Select which forms should be used for patient data retrieval:
                  </p>
                  
                  <div className="space-y-3">
                    {credentials.forms.map((form: FormsiteForm) => (
                      <div 
                        key={form.id} 
                        className="flex items-center justify-between p-3 border rounded-md hover:bg-gray-50"
                      >
                        <div>
                          <h4 className="font-medium">{form.name}</h4>
                          <p className="text-xs text-gray-500">
                            ID: {form.id} • Last updated: {new Date(form.lastUpdated).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Label htmlFor={`form-${form.id}`} className="sr-only">
                            Enable {form.name}
                          </Label>
                          <Switch
                            id={`form-${form.id}`}
                            checked={selectedForms[form.id] || false}
                            onCheckedChange={(checked) => handleFormToggle(form.id, checked)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <Button 
                    onClick={handleSaveFormSettings}
                    disabled={updateFormSettingsMutation.isPending}
                    className="ml-auto block"
                  >
                    {updateFormSettingsMutation.isPending ? "Saving..." : "Save Form Settings"}
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-md border border-dashed">
                  <KeyRound className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                  <h3 className="text-base font-medium text-gray-600">No Forms Found</h3>
                  <p className="text-sm text-gray-500 max-w-md mx-auto mt-1">
                    We couldn't find any forms in your FormSite account. Make sure you have created forms and that your API key has permissions to access them.
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-4"
                    onClick={handleSyncForms}
                    disabled={syncFormsMutation.isPending}
                  >
                    <RefreshCw className="h-4 w-4 mr-1" />
                    {syncFormsMutation.isPending ? "Syncing..." : "Sync Forms"}
                  </Button>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}