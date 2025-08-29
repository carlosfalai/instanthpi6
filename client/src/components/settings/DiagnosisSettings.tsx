import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Diagnosis {
  id: string;
  name: string;
  enabled: boolean;
  category: "common" | "chronic" | "acute" | "mental" | "other";
}

// List of diagnoses with their categories
const diagnosisList: Omit<Diagnosis, "id" | "enabled">[] = [
  { name: "ADHD in Adults (Established Diagnosis)", category: "mental" },
  { name: "Abdominal Pain", category: "acute" },
  { name: "Acute Low Back Pain", category: "acute" },
  { name: "Anxiety", category: "mental" },
  { name: "Asthma", category: "chronic" },
  { name: "Burnout", category: "mental" },
  { name: "COPD (Chronic Obstructive Pulmonary Disease)", category: "chronic" },
  { name: "Chronic Constipation", category: "chronic" },
  { name: "Chronic Cough", category: "chronic" },
  { name: "Chronic Diarrhea", category: "chronic" },
  { name: "Chronic Fatigue", category: "chronic" },
  { name: "Chronic Low Back Pain", category: "chronic" },
  { name: "Conjunctivitis (Infectious, Allergic, Viral, Bacterial)", category: "acute" },
  { name: "Depression", category: "mental" },
  { name: "Diabetes Mellitus Type 2", category: "chronic" },
  { name: "Fatigue", category: "common" },
  { name: "GERD (Gastroesophageal Reflux Disease)", category: "chronic" },
  { name: "Gout", category: "chronic" },
  { name: "Headache – Migraine", category: "chronic" },
  { name: "Headache – Tension Type", category: "common" },
  { name: "Hyperlipidemia", category: "chronic" },
  { name: "Hypertension", category: "chronic" },
  { name: "Hypothyroidism", category: "chronic" },
  { name: "Insomnia", category: "common" },
  { name: "Irregular Periods/Amenorrhea", category: "common" },
  { name: "Knee Pain", category: "common" },
  { name: "Laryngitis", category: "acute" },
  { name: "Obesity", category: "chronic" },
  { name: "Oral Herpes", category: "acute" },
  { name: "Osteoarthritis", category: "chronic" },
  { name: "Paronychia", category: "acute" },
  { name: "Pharyngitis (Strep throat)", category: "acute" },
  { name: "Shingles (Herpes Zoster)", category: "acute" },
  { name: "Shoulder Pain", category: "common" },
  { name: "Skin Disorders (Eczema, Psoriasis)", category: "chronic" },
  { name: "Suspected ADHD in Adults (Diagnostic Evaluation Phase)", category: "mental" },
  { name: "Upper Respiratory Infection (Cold, Sinusitis)", category: "acute" },
  { name: "Urinary Tract Infection (UTI)", category: "acute" },
];

export default function DiagnosisSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<string>("all");

  // Fetch diagnosis settings from API
  const { data: diagnoses = [], isLoading } = useQuery<Diagnosis[]>({
    queryKey: ["/api/settings/diagnoses"],
    // If the endpoint doesn't exist yet, this will provide initial data
    initialData: diagnosisList.map((diagnosis) => ({
      ...diagnosis,
      id: crypto.randomUUID(),
      enabled: true,
    })),
  });

  // Toggle diagnosis mutation
  const toggleDiagnosisMutation = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      return await apiRequest("PATCH", `/api/settings/diagnoses/${id}`, { enabled });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/diagnoses"] });
      toast({
        title: "Diagnosis updated",
        description: "Your changes have been saved successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Failed to update diagnosis",
        description: "There was a problem saving your changes. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Save all diagnoses mutation
  const saveAllDiagnosesMutation = useMutation({
    mutationFn: async (diagnoses: Diagnosis[]) => {
      return await apiRequest("PUT", "/api/settings/diagnoses", { diagnoses });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/diagnoses"] });
      toast({
        title: "All diagnoses updated",
        description: "Your changes have been saved successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Failed to update diagnoses",
        description: "There was a problem saving your changes. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handler for toggling diagnosis
  const handleToggleDiagnosis = (id: string, enabled: boolean) => {
    // Optimistically update the UI
    queryClient.setQueryData<Diagnosis[]>(["/api/settings/diagnoses"], (oldData = []) => {
      return oldData.map((diagnosis) =>
        diagnosis.id === id ? { ...diagnosis, enabled } : diagnosis
      );
    });

    // Send the update to the server
    toggleDiagnosisMutation.mutate({ id, enabled });
  };

  // Filter diagnoses based on search and active tab
  const filteredDiagnoses = diagnoses.filter((diagnosis) => {
    const matchesSearch = diagnosis.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeTab === "all" || diagnosis.category === activeTab;
    return matchesSearch && matchesCategory;
  });

  // Get total counts
  const totalEnabled = diagnoses.filter((d) => d.enabled).length;
  const totalDiagnoses = diagnoses.length;

  return (
    <div className="space-y-6">
      <Card className="bg-[#1e1e1e] border-gray-800">
        <CardHeader>
          <CardTitle>Diagnosis Options</CardTitle>
          <CardDescription className="text-gray-400">
            Select which diagnoses should appear in treatment plans and recommendations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search diagnoses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-[#262626] border-gray-700"
              />
            </div>
            <div className="text-sm text-gray-400">
              {totalEnabled} of {totalDiagnoses} enabled
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
            <TabsList className="bg-[#262626]">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="common">Common</TabsTrigger>
              <TabsTrigger value="chronic">Chronic</TabsTrigger>
              <TabsTrigger value="acute">Acute</TabsTrigger>
              <TabsTrigger value="mental">Mental Health</TabsTrigger>
              <TabsTrigger value="other">Other</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            {filteredDiagnoses.map((diagnosis) => (
              <div
                key={diagnosis.id}
                className="flex items-center justify-between p-3 rounded-lg border border-gray-700 bg-[#262626] hover:bg-[#2a2a2a] transition-colors"
              >
                <Label
                  htmlFor={`diagnosis-${diagnosis.id}`}
                  className="text-sm font-medium cursor-pointer flex-1 mr-2"
                >
                  {diagnosis.name}
                </Label>
                <Switch
                  id={`diagnosis-${diagnosis.id}`}
                  checked={diagnosis.enabled}
                  onCheckedChange={(checked) => handleToggleDiagnosis(diagnosis.id, checked)}
                />
              </div>
            ))}
          </div>

          {filteredDiagnoses.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              No diagnoses found matching your search.
            </div>
          )}

          <div className="mt-6 flex justify-between">
            <Button variant="outline" className="border-gray-700 text-gray-300">
              <Plus className="h-4 w-4 mr-2" />
              Add Custom Diagnosis
            </Button>
            <Button
              onClick={() => saveAllDiagnosesMutation.mutate(diagnoses)}
              disabled={saveAllDiagnosesMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Save className="h-4 w-4 mr-2" />
              Save All Changes
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
