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

// Main Scheduler Page
export default function SchedulerPage() {
  return (
    <BaseLayout>
      <div className="container py-8 max-w-6xl">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent mb-8">
          AI Scheduler
        </h1>

        <div className="grid md:grid-cols-2 gap-8">
          <SchedulerSettings />
          <UpcomingScheduledEvents />
        </div>
      </div>
    </BaseLayout>
  );
}