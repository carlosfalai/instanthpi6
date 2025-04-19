import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  Brain, 
  Stethoscope, 
  ClipboardList, 
  CalendarClock,
  Syringe, 
  Building, 
  Pill, 
  FileText, 
  ClipboardCheck, 
  DollarSign,
  RefreshCw
} from "lucide-react";

interface AiFeature {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  settingKey: string;
}

export default function AiControlPanel() {
  const { toast } = useToast();
  
  // Fetch the current user's AI settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ["/api/ai/settings"],
  });
  
  // Create a state object to track local changes to settings
  const [localSettings, setLocalSettings] = useState(settings || {
    hpiConfirmationEnabled: true,
    differentialDiagnosisEnabled: true,
    followUpQuestionsEnabled: true,
    preventativeCareEnabled: true,
    labworkSuggestionsEnabled: true,
    inPersonReferralEnabled: true,
    prescriptionSuggestionsEnabled: true,
    medicalNotesDraftEnabled: true,
    pendingItemsTrackingEnabled: true,
    billingOptimizationEnabled: true,
  });
  
  // Update settings mutation
  const updateSettings = useMutation({
    mutationFn: async (newSettings: any) => {
      const response = await fetch('/api/ai/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newSettings),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update AI settings');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ai/settings'] });
      toast({
        title: "Settings Updated",
        description: "Your AI assistant settings have been updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update settings",
        variant: "destructive",
      });
    },
  });
  
  // Handle toggle changes
  const handleToggle = (settingKey: string, value: boolean) => {
    setLocalSettings(prev => ({
      ...prev,
      [settingKey]: value
    }));
  };
  
  // Save changes
  const saveChanges = () => {
    updateSettings.mutate(localSettings);
  };
  
  // Reset to default settings
  const resetToDefaults = () => {
    const defaultSettings = {
      hpiConfirmationEnabled: true,
      differentialDiagnosisEnabled: true,
      followUpQuestionsEnabled: true,
      preventativeCareEnabled: true,
      labworkSuggestionsEnabled: true,
      inPersonReferralEnabled: true,
      prescriptionSuggestionsEnabled: true,
      medicalNotesDraftEnabled: true,
      pendingItemsTrackingEnabled: true,
      billingOptimizationEnabled: true,
    };
    
    setLocalSettings(defaultSettings);
    updateSettings.mutate(defaultSettings);
  };
  
  // Set all features on or off
  const setAllFeatures = (value: boolean) => {
    const newSettings = {
      hpiConfirmationEnabled: value,
      differentialDiagnosisEnabled: value,
      followUpQuestionsEnabled: value,
      preventativeCareEnabled: value,
      labworkSuggestionsEnabled: value,
      inPersonReferralEnabled: value,
      prescriptionSuggestionsEnabled: value,
      medicalNotesDraftEnabled: value,
      pendingItemsTrackingEnabled: value,
      billingOptimizationEnabled: value,
    };
    
    setLocalSettings(newSettings);
  };
  
  // AI features configuration
  const aiFeatures: AiFeature[] = [
    {
      id: "hpi-confirmation",
      name: "HPI Confirmation",
      description: "Generate history of present illness summaries based on patient form responses",
      icon: <Brain className="h-5 w-5 text-purple-500" />,
      settingKey: "hpiConfirmationEnabled"
    },
    {
      id: "differential-diagnosis",
      name: "Differential Diagnosis",
      description: "Generate potential diagnoses based on patient symptoms and history",
      icon: <Stethoscope className="h-5 w-5 text-indigo-500" />,
      settingKey: "differentialDiagnosisEnabled"
    },
    {
      id: "follow-up-questions",
      name: "Follow-up Questions",
      description: "Suggest follow-up questions to ask patients based on their responses",
      icon: <ClipboardList className="h-5 w-5 text-blue-500" />,
      settingKey: "followUpQuestionsEnabled"
    },
    {
      id: "preventative-care",
      name: "Preventative Care",
      description: "Schedule one preventative care suggestion per day for billing optimization",
      icon: <CalendarClock className="h-5 w-5 text-green-500" />,
      settingKey: "preventativeCareEnabled"
    },
    {
      id: "labwork-suggestions",
      name: "Labwork Suggestions",
      description: "Generate labwork sheets based on patient conditions",
      icon: <Syringe className="h-5 w-5 text-red-500" />,
      settingKey: "labworkSuggestionsEnabled"
    },
    {
      id: "in-person-referral",
      name: "In-Person Referral",
      description: "Prepare paragraphs explaining why complex cases need in-person consultation",
      icon: <Building className="h-5 w-5 text-amber-500" />,
      settingKey: "inPersonReferralEnabled"
    },
    {
      id: "prescription-suggestions",
      name: "Prescription Suggestions",
      description: "Suggest medication options based on patient diagnoses",
      icon: <Pill className="h-5 w-5 text-pink-500" />,
      settingKey: "prescriptionSuggestionsEnabled"
    },
    {
      id: "medical-notes-draft",
      name: "Medical Notes Draft",
      description: "Generate draft medical notes for patient consultations",
      icon: <FileText className="h-5 w-5 text-cyan-500" />,
      settingKey: "medicalNotesDraftEnabled"
    },
    {
      id: "pending-items-tracking",
      name: "Pending Items Tracking",
      description: "Track test results, referrals, and other pending items",
      icon: <ClipboardCheck className="h-5 w-5 text-emerald-500" />,
      settingKey: "pendingItemsTrackingEnabled"
    },
    {
      id: "billing-optimization",
      name: "Billing Optimization",
      description: "Optimize patient interactions for billing efficiency",
      icon: <DollarSign className="h-5 w-5 text-yellow-500" />,
      settingKey: "billingOptimizationEnabled"
    },
  ];
  
  // Check if any settings have changed from the server state
  const hasChanges = settings && Object.keys(localSettings).some(
    key => localSettings[key] !== settings[key]
  );

  return (
    <Card className="w-full">
      <CardHeader className="bg-slate-50">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>AI Assistant Settings</CardTitle>
            <CardDescription>Control which AI features are active during patient consultations</CardDescription>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAllFeatures(true)}
              className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
            >
              Enable All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAllFeatures(false)}
              className="bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
            >
              Disable All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={resetToDefaults}
              className="bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Reset Defaults
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {aiFeatures.map((feature) => (
            <div key={feature.id} className="flex items-start space-x-4 p-4 rounded-md border hover:bg-gray-50 transition-colors">
              <div className="mt-0.5">{feature.icon}</div>
              <div className="flex-1">
                <div className="flex justify-between items-center">
                  <Label htmlFor={feature.id} className="text-base font-medium">
                    {feature.name}
                  </Label>
                  <Switch
                    id={feature.id}
                    checked={localSettings[feature.settingKey]}
                    onCheckedChange={(checked) => handleToggle(feature.settingKey, checked)}
                  />
                </div>
                <p className="text-sm text-gray-500 mt-1">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
        
        <Separator className="my-6" />
        
        <div className="flex justify-end">
          <Button
            onClick={saveChanges}
            disabled={!hasChanges || updateSettings.isPending}
            className="bg-green-600 hover:bg-green-700"
          >
            {updateSettings.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}