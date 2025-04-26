import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import BaseLayout from "@/components/layout/BaseLayout";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Calendar,
  CheckCircle,
  Clock,
  FileText,
  Users,
  AlertCircle,
  Plus,
  X,
  MessageSquare,
  Stethoscope
} from "lucide-react";
import { queryClient } from "@/lib/queryClient";

// Types for the scheduler feature
interface SchedulerSetting {
  id: string;
  name: string;
  category: 'vaccination' | 'screening' | 'followup' | 'other';
  description: string;
  enabled: boolean;
  ageRangeMin?: number;
  ageRangeMax?: number;
  gender?: 'all' | 'male' | 'female' | 'other';
  frequency: string; // e.g., "once", "yearly", "every 3 months"
  messageTemplate: string;
}

// Scheduler Settings Component
function SchedulerSettings() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>("vaccination");

  // Fetch scheduler settings
  const { data: settings = [], isLoading } = useQuery<SchedulerSetting[]>({
    queryKey: ['/api/scheduler/settings'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/scheduler/settings');
        if (!response.ok) throw new Error('Failed to load scheduler settings');
        return response.json();
      } catch (error) {
        console.error("Error fetching scheduler settings:", error);
        return [];
      }
    }
  });

  // Toggle setting mutation
  const toggleSettingMutation = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const response = await fetch(`/api/scheduler/settings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled })
      });
      
      if (!response.ok) throw new Error('Failed to update setting');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/scheduler/settings'] });
      toast({
        title: "Setting updated",
        description: "The scheduler setting has been updated successfully."
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Filter settings by category
  const filteredSettings = settings.filter(
    setting => setting.category === activeTab
  );

  // Handle toggle change
  const handleToggleChange = (id: string, enabled: boolean) => {
    toggleSettingMutation.mutate({ id, enabled });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-1">
        <h2 className="text-2xl font-bold">Scheduler Settings</h2>
        <p className="text-muted-foreground">
          Configure which health procedures the AI should automatically schedule for patients
        </p>
      </div>

      <Tabs defaultValue="vaccination" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full max-w-md">
          <TabsTrigger value="vaccination">Vaccinations</TabsTrigger>
          <TabsTrigger value="screening">Screenings</TabsTrigger>
          <TabsTrigger value="followup">Follow-ups</TabsTrigger>
          <TabsTrigger value="other">Other</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <div className="grid gap-4">
            {filteredSettings.length > 0 ? (
              filteredSettings.map((setting) => (
                <Card key={setting.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{setting.name}</CardTitle>
                        <CardDescription>{setting.description}</CardDescription>
                      </div>
                      <Switch 
                        checked={setting.enabled}
                        onCheckedChange={(checked) => handleToggleChange(setting.id, checked)}
                      />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-muted-foreground">Frequency:</span> {setting.frequency}
                      </div>
                      {setting.ageRangeMin && setting.ageRangeMax && (
                        <div>
                          <span className="font-medium text-muted-foreground">Age Range:</span> {setting.ageRangeMin} - {setting.ageRangeMax} years
                        </div>
                      )}
                      {setting.gender && setting.gender !== 'all' && (
                        <div>
                          <span className="font-medium text-muted-foreground">Gender:</span> {setting.gender.charAt(0).toUpperCase() + setting.gender.slice(1)}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-10">
                <p className="text-muted-foreground">No {activeTab} settings found</p>
                <Button variant="outline" size="sm" className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Add new setting
                </Button>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// AI Recommendations Component
interface SchedulerRecommendation {
  id: string;
  patientId: number;
  patientName: string;
  type: 'vaccination' | 'screening' | 'followup' | 'other';
  title: string;
  description: string;
  messageTemplate: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'dismissed' | 'scheduled';
}

function SchedulerRecommendations() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>("pending");
  
  // Fetch recommendations
  const { data: recommendations = [], isLoading } = useQuery<SchedulerRecommendation[]>({
    queryKey: ['/api/scheduler/recommendations'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/scheduler/recommendations');
        if (!response.ok) throw new Error('Failed to load recommendations');
        return response.json();
      } catch (error) {
        console.error("Error fetching recommendations:", error);
        return [];
      }
    }
  });

  // Action mutations
  const scheduleRecommendationMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/scheduler/recommendations/${id}/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) throw new Error('Failed to schedule recommendation');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/scheduler/recommendations'] });
      toast({
        title: "Recommendation scheduled",
        description: "The recommendation has been scheduled successfully."
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Scheduling failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const dismissRecommendationMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/scheduler/recommendations/${id}/dismiss`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) throw new Error('Failed to dismiss recommendation');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/scheduler/recommendations'] });
      toast({
        title: "Recommendation dismissed",
        description: "The recommendation has been dismissed."
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Dismissal failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Handle schedule
  const handleSchedule = (id: string) => {
    scheduleRecommendationMutation.mutate(id);
  };

  // Handle dismiss
  const handleDismiss = (id: string) => {
    dismissRecommendationMutation.mutate(id);
  };
  
  // Filter recommendations by status
  const filteredRecommendations = recommendations.filter(rec => {
    if (activeTab === 'pending') return rec.status === 'pending';
    if (activeTab === 'scheduled') return rec.status === 'scheduled';
    if (activeTab === 'dismissed') return rec.status === 'dismissed';
    return true;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-1">
        <h2 className="text-2xl font-bold">AI Recommendations</h2>
        <p className="text-muted-foreground">
          Suggested preventative care and follow-ups for your patients
        </p>
      </div>

      <Tabs defaultValue="pending" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="pending">
            Pending
            {recommendations.filter(r => r.status === 'pending').length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {recommendations.filter(r => r.status === 'pending').length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
          <TabsTrigger value="dismissed">Dismissed</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <div className="grid gap-4">
            {filteredRecommendations.length > 0 ? (
              filteredRecommendations.map((rec) => (
                <Card key={rec.id} className={rec.priority === 'high' ? 'border-red-400' : ''}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div className="flex items-start gap-2">
                        {activeTab === 'pending' && (
                          <Checkbox 
                            id={`schedule-${rec.id}`}
                            className="mt-1"
                            onCheckedChange={() => handleSchedule(rec.id)}
                          />
                        )}
                        <div>
                          <CardTitle className="text-lg">
                            {rec.title}
                            {rec.priority === 'high' && (
                              <Badge variant="destructive" className="ml-2">High Priority</Badge>
                            )}
                          </CardTitle>
                          <CardDescription>Patient: {rec.patientName}</CardDescription>
                        </div>
                      </div>
                      {activeTab === 'pending' && (
                        <Button variant="ghost" size="sm" onClick={() => handleDismiss(rec.id)}>
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <p className="text-sm">{rec.description}</p>
                      
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4 mr-2" />
                        Due: {new Date(rec.dueDate).toLocaleDateString()}
                      </div>
                      
                      <div className="border rounded-md p-3 bg-muted/50">
                        <div className="flex items-center gap-2 mb-2">
                          <MessageSquare className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">Suggested Message Template</span>
                        </div>
                        <p className="text-sm italic">"{rec.messageTemplate}"</p>
                      </div>
                    </div>
                  </CardContent>
                  {activeTab === 'pending' && (
                    <CardFooter>
                      <Button size="sm" className="mr-2" onClick={() => handleSchedule(rec.id)}>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Schedule
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDismiss(rec.id)}>
                        Dismiss
                      </Button>
                    </CardFooter>
                  )}
                </Card>
              ))
            ) : (
              <div className="text-center py-10">
                <p className="text-muted-foreground">No {activeTab} recommendations</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Upcoming Scheduled Events Component
function UpcomingScheduledEvents() {
  const { data: events = [], isLoading } = useQuery({
    queryKey: ['/api/scheduler/upcoming'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/scheduler/upcoming');
        if (!response.ok) throw new Error('Failed to load upcoming events');
        return response.json();
      } catch (error) {
        console.error("Error fetching upcoming events:", error);
        return [];
      }
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col space-y-1">
        <h2 className="text-2xl font-bold">Upcoming AI Scheduled Events</h2>
        <p className="text-muted-foreground">
          Events the AI has scheduled for your patients
        </p>
      </div>

      {events.length > 0 ? (
        <div className="grid gap-4">
          {events.map((event: any) => (
            <Card key={event.id}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{event.title}</CardTitle>
                    <CardDescription>Patient: {event.patientName}</CardDescription>
                  </div>
                  <Badge variant={event.status === 'pending' ? 'outline' : 'default'}>
                    {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-sm">
                  <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                  {new Date(event.scheduledDate).toLocaleDateString()}
                </div>
              </CardContent>
              <CardFooter className="pt-0">
                <Button variant="outline" size="sm">View Details</Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-10">
          <p className="text-muted-foreground">No upcoming scheduled events</p>
        </div>
      )}
    </div>
  );
}

// Mass messaging component for sending bulk messages to patients
function MassMessaging() {
  const { toast } = useToast();
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [patientData, setPatientData] = useState<PatientImportData[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [customMessage, setCustomMessage] = useState("");
  const [step, setStep] = useState<'upload' | 'preview' | 'customize' | 'confirm'>('upload');
  const [selectedPatients, setSelectedPatients] = useState<Record<string, boolean>>({});
  
  interface PatientImportData {
    id: string;
    name: string;
    phone: string;
    email?: string;
    language?: string;
  }
  
  // Fetch message templates
  const { data: messageTemplates = [] } = useQuery<{ id: string, name: string, content: string }[]>({
    queryKey: ['/api/messaging/templates'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/messaging/templates');
        if (!response.ok) throw new Error('Failed to load message templates');
        return response.json();
      } catch (error) {
        console.error("Error fetching message templates:", error);
        return [];
      }
    }
  });
  
  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setCsvFile(file);
    
    // Read and parse the CSV file
    const reader = new FileReader();
    reader.onload = (event) => {
      const csvText = event.target?.result as string;
      parseCSVData(csvText);
    };
    reader.readAsText(file);
  };
  
  // Parse CSV data
  const parseCSVData = (csvText: string) => {
    setIsProcessing(true);
    
    try {
      // Simple CSV parsing - split by lines and then by commas
      // In a production app, use a proper CSV parsing library
      const lines = csvText.split('\n');
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      
      // Check if required headers exist
      const nameIndex = headers.indexOf('name');
      const phoneIndex = headers.indexOf('phone');
      
      if (nameIndex === -1 || phoneIndex === -1) {
        toast({
          title: "Invalid CSV format",
          description: "CSV must include 'name' and 'phone' columns.",
          variant: "destructive"
        });
        setIsProcessing(false);
        return;
      }
      
      // Extract patient data
      const emailIndex = headers.indexOf('email');
      const languageIndex = headers.indexOf('language');
      
      const parsedData: PatientImportData[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue; // Skip empty lines
        
        const values = lines[i].split(',').map(v => v.trim());
        const patient: PatientImportData = {
          id: `import_${i}`,
          name: values[nameIndex],
          phone: values[phoneIndex],
        };
        
        if (emailIndex !== -1) {
          patient.email = values[emailIndex];
        }
        
        if (languageIndex !== -1) {
          patient.language = values[languageIndex];
        }
        
        parsedData.push(patient);
      }
      
      // Initialize all patients as selected
      const initialSelections: Record<string, boolean> = {};
      parsedData.forEach(patient => {
        initialSelections[patient.id] = true;
      });
      setSelectedPatients(initialSelections);
      
      setPatientData(parsedData);
      setStep('preview');
      toast({
        title: "File processed",
        description: `Successfully loaded ${parsedData.length} patients from CSV.`
      });
    } catch (error) {
      console.error("Error parsing CSV:", error);
      toast({
        title: "Error processing file",
        description: "Could not parse the CSV file. Please check the format.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Toggle patient selection
  const togglePatientSelection = (id: string, checked: boolean) => {
    setSelectedPatients(prev => ({
      ...prev,
      [id]: checked
    }));
  };
  
  // Handle template selection
  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId);
    
    // Get template content if template is selected
    if (templateId) {
      const template = messageTemplates.find(t => t.id === templateId);
      if (template) {
        setCustomMessage(template.content);
      }
    } else {
      setCustomMessage("");
    }
  };
  
  // Preview the message for a patient
  const getPatientMessage = (patient: PatientImportData) => {
    let message = customMessage;
    
    // Simple variable replacement
    message = message.replace(/\{patient_name\}/g, patient.name);
    message = message.replace(/\{patient_phone\}/g, patient.phone);
    
    if (patient.email) {
      message = message.replace(/\{patient_email\}/g, patient.email);
    }
    
    return message;
  };
  
  // Count selected patients
  const selectedCount = Object.values(selectedPatients).filter(Boolean).length;
  
  // Send mass message mutation
  const sendMassMessageMutation = useMutation({
    mutationFn: async () => {
      // Get only the selected patients
      const patientsToMessage = patientData.filter(p => selectedPatients[p.id]);
      
      const response = await fetch('/api/messaging/mass-send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patients: patientsToMessage,
          message: customMessage,
          templateId: selectedTemplate || null
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send messages');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Messages sent",
        description: `Successfully sent messages to ${data.successCount} patients.`
      });
      
      // Reset the form
      setCsvFile(null);
      setPatientData([]);
      setSelectedTemplate("");
      setCustomMessage("");
      setStep('upload');
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send messages",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Check if we exceed patient limit
  const exceedsPatientLimit = patientData.length > 500;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Mass Messaging</CardTitle>
        <CardDescription>
          Send messages to multiple patients at once by uploading a CSV file with patient information.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {step === 'upload' && (
          <div className="space-y-6">
            <div className="grid w-full max-w-lg items-center gap-2">
              <Label htmlFor="csv-upload">Upload Patient List (CSV)</Label>
              <Input 
                id="csv-upload" 
                type="file" 
                accept=".csv" 
                onChange={handleFileUpload}
                disabled={isProcessing}
              />
              <p className="text-sm text-gray-500">
                CSV file must include columns for 'name' and 'phone'. Optional columns: 'email', 'language'.
              </p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
              <h3 className="font-medium mb-2">Sample CSV Format:</h3>
              <code className="text-sm">
                name,phone,email,language<br />
                John Doe,1234567890,john@example.com,english<br />
                Jane Smith,0987654321,jane@example.com,french
              </code>
            </div>
          </div>
        )}
        
        {step === 'preview' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="font-medium">Patients Preview ({patientData.length})</h3>
              
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setStep('upload')}
                >
                  <X className="h-4 w-4 mr-1" /> Change File
                </Button>
                
                <Button 
                  size="sm" 
                  onClick={() => setStep('customize')}
                  disabled={patientData.length === 0 || exceedsPatientLimit}
                >
                  <MessageSquare className="h-4 w-4 mr-1" /> Customize Message
                </Button>
              </div>
            </div>
            
            {exceedsPatientLimit && (
              <div className="bg-red-50 border border-red-200 p-4 rounded-md text-red-800">
                <AlertCircle className="h-4 w-4 inline-block mr-2" />
                The uploaded file contains more than 500 patients. Please reduce the number of patients and try again.
              </div>
            )}
            
            <div className="border rounded-md overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center">
                        <Checkbox 
                          id="select-all" 
                          checked={selectedCount === patientData.length && patientData.length > 0}
                          onCheckedChange={(checked) => {
                            const newSelections: Record<string, boolean> = {};
                            patientData.forEach(p => {
                              newSelections[p.id] = checked as boolean;
                            });
                            setSelectedPatients(newSelections);
                          }}
                          className="mr-2"
                        />
                        <Label htmlFor="select-all">Select</Label>
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Language</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {patientData.slice(0, 10).map((patient) => (
                    <tr key={patient.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Checkbox 
                          id={`patient-${patient.id}`} 
                          checked={selectedPatients[patient.id] || false}
                          onCheckedChange={(checked) => togglePatientSelection(patient.id, checked as boolean)}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{patient.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{patient.phone}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{patient.email || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{patient.language || 'english'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {patientData.length > 10 && (
                <div className="px-6 py-3 bg-gray-50 text-sm text-gray-500">
                  Showing 10 of {patientData.length} patients. {patientData.length - 10} more not displayed.
                </div>
              )}
            </div>
          </div>
        )}
        
        {step === 'customize' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="font-medium">Customize Message</h3>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setStep('preview')}
              >
                Back to Patient List
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="template-select">Select Message Template</Label>
                <select
                  id="template-select"
                  value={selectedTemplate}
                  onChange={(e) => handleTemplateChange(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="">Custom Message</option>
                  {messageTemplates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <Label htmlFor="message-content">Message Content</Label>
                <Textarea
                  id="message-content"
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  rows={8}
                  className="mt-1"
                  placeholder="Enter your message here. Use {patient_name}, {patient_phone}, or {patient_email} as placeholders."
                />
              </div>
              
              <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                <h4 className="font-medium mb-2">Available Placeholders:</h4>
                <ul className="text-sm space-y-1">
                  <li><code>{'{patient_name}'}</code> - Patient's full name</li>
                  <li><code>{'{patient_phone}'}</code> - Patient's phone number</li>
                  <li><code>{'{patient_email}'}</code> - Patient's email address (if available)</li>
                </ul>
              </div>
              
              {patientData.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Message Preview for {patientData[0].name}:</h4>
                  <div className="p-4 bg-blue-50 rounded-md border border-blue-100 text-sm">
                    {getPatientMessage(patientData[0]).split('\n').map((line, i) => (
                      <p key={i}>{line || <br />}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex justify-end">
              <Button 
                onClick={() => setStep('confirm')}
                disabled={!customMessage.trim()}
              >
                Review & Send
              </Button>
            </div>
          </div>
        )}
        
        {step === 'confirm' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="font-medium">Confirm and Send</h3>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setStep('customize')}
              >
                Edit Message
              </Button>
            </div>
            
            <div className="space-y-4">
              <div className="bg-amber-50 p-4 rounded-md border border-amber-200 text-amber-800">
                <AlertCircle className="h-4 w-4 inline-block mr-2" />
                You are about to send a message to <strong>{selectedCount}</strong> patients.
              </div>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="font-medium mb-2">Message Summary:</h4>
                  <div className="bg-gray-50 p-4 rounded-md border border-gray-200 text-sm">
                    <p><strong>Template:</strong> {selectedTemplate ? messageTemplates.find(t => t.id === selectedTemplate)?.name : 'Custom Message'}</p>
                    <p><strong>Recipients:</strong> {selectedCount} patients</p>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Message Preview:</h4>
                  <div className="bg-blue-50 p-4 rounded-md border border-blue-100 text-sm max-h-48 overflow-y-auto">
                    {customMessage.split('\n').map((line, i) => (
                      <p key={i}>{line || <br />}</p>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => setStep('customize')}
              >
                Go Back
              </Button>
              
              <Button 
                onClick={() => sendMassMessageMutation.mutate()}
                disabled={sendMassMessageMutation.isPending || selectedCount === 0}
              >
                {sendMassMessageMutation.isPending ? (
                  <>Sending...</>
                ) : (
                  <>Send to {selectedCount} Patients</>
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Main Scheduler Page
export default function SchedulerPage() {
  const [activeTab, setActiveTab] = useState("recommendations");
  
  return (
    <BaseLayout>
      <div className="container py-8 max-w-6xl">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent mb-8">
          AI Scheduler
        </h1>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
            <TabsTrigger value="mass-messaging">Mass Messaging</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="recommendations">
            <div className="space-y-10">
              <SchedulerRecommendations />
              
              <div className="grid md:grid-cols-2 gap-8">
                <UpcomingScheduledEvents />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="mass-messaging">
            <MassMessaging />
          </TabsContent>
          
          <TabsContent value="settings">
            <SchedulerSettings />
          </TabsContent>
        </Tabs>
      </div>
    </BaseLayout>
  );
}