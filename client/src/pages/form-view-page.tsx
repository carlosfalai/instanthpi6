import React, { useState } from 'react';
import { useRoute } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { CalendarIcon, ArrowLeft, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export default function FormViewPage() {
  const [, params] = useRoute('/forms/:id');
  const formId = params?.id ? parseInt(params.id) : undefined;
  const { toast } = useToast();
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [patientId, setPatientId] = useState<number | null>(null);
  
  // Fetch the form template
  const { data: formTemplate, isLoading: isLoadingTemplate, error } = useQuery({
    queryKey: [`/api/forms/templates/${formId}`],
    queryFn: async () => {
      if (!formId) throw new Error("Form ID is required");
      const res = await fetch(`/api/forms/templates/${formId}`);
      if (!res.ok) throw new Error("Failed to fetch form template");
      return res.json();
    },
    enabled: !!formId,
  });
  
  // Fetch patients for the patient selector
  const { data: patients = [] } = useQuery({
    queryKey: ["/api/patients"],
    queryFn: async () => {
      const res = await fetch("/api/patients");
      if (!res.ok) throw new Error("Failed to fetch patients");
      return res.json();
    },
  });
  
  // Submit form response mutation
  const submitFormMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/forms/responses", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Form response submitted successfully",
      });
      // Reset the form
      setAnswers({});
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to submit form: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  const handleInputChange = (questionId: string, value: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };
  
  const handleSubmit = () => {
    if (!formId) {
      toast({
        title: "Error",
        description: "Form ID is missing",
        variant: "destructive",
      });
      return;
    }
    
    if (!patientId) {
      toast({
        title: "Error",
        description: "Please select a patient",
        variant: "destructive",
      });
      return;
    }
    
    // Check if required questions are answered
    const unansweredRequired = formTemplate.questions
      .filter(q => q.required)
      .filter(q => !answers[q.id] || 
        (Array.isArray(answers[q.id]) && answers[q.id].length === 0) || 
        answers[q.id] === "");
    
    if (unansweredRequired.length > 0) {
      toast({
        title: "Error",
        description: `Please answer all required questions (${unansweredRequired.length} remaining)`,
        variant: "destructive",
      });
      return;
    }
    
    submitFormMutation.mutate({
      formTemplateId: formId,
      patientId,
      answers,
      status: "completed",
      completedAt: new Date()
    });
  };
  
  if (isLoadingTemplate) {
    return (
      <div className="container mx-auto py-6 flex justify-center items-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (error || !formTemplate) {
    return (
      <div className="container mx-auto py-6">
        <div className="mb-4">
          <Link href="/forms">
            <Button variant="ghost">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Forms
            </Button>
          </Link>
        </div>
        
        <div className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Form Not Found</h2>
          <p className="text-gray-500 mb-6">The form you're looking for doesn't exist or you don't have permission to view it.</p>
          <Button asChild>
            <Link href="/forms">View All Forms</Link>
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-6">
      <div className="mb-4">
        <Link href="/forms">
          <Button variant="ghost">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Forms
          </Button>
        </Link>
      </div>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-2xl">{formTemplate.name}</CardTitle>
          <CardDescription>{formTemplate.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <Label htmlFor="patient">Select Patient</Label>
            <Select value={patientId?.toString() || ""} onValueChange={(value) => setPatientId(parseInt(value))}>
              <SelectTrigger className="w-full md:w-80">
                <SelectValue placeholder="Select a patient" />
              </SelectTrigger>
              <SelectContent>
                {patients.map((patient) => (
                  <SelectItem key={patient.id} value={patient.id.toString()}>
                    {patient.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Separator className="my-6" />
          
          <div className="space-y-8">
            {formTemplate.questions.map((question) => (
              <div key={question.id} className="space-y-2">
                <Label className="flex items-start">
                  <span>{question.label}</span>
                  {question.required && <span className="text-red-500 ml-1">*</span>}
                </Label>
                {question.description && (
                  <p className="text-sm text-gray-500">{question.description}</p>
                )}
                
                {/* Render different input types based on question type */}
                {question.type === "text" && (
                  <Input
                    placeholder={question.placeholder}
                    value={answers[question.id] || ""}
                    onChange={(e) => handleInputChange(question.id, e.target.value)}
                  />
                )}
                
                {question.type === "textarea" && (
                  <Textarea
                    placeholder={question.placeholder}
                    value={answers[question.id] || ""}
                    onChange={(e) => handleInputChange(question.id, e.target.value)}
                    rows={4}
                  />
                )}
                
                {question.type === "select" && (
                  <Select 
                    value={answers[question.id] || ""} 
                    onValueChange={(value) => handleInputChange(question.id, value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select an option" />
                    </SelectTrigger>
                    <SelectContent>
                      {question.options?.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                
                {question.type === "radio" && (
                  <RadioGroup
                    value={answers[question.id] || ""}
                    onValueChange={(value) => handleInputChange(question.id, value)}
                    className="space-y-2"
                  >
                    {question.options?.map((option) => (
                      <div key={option.value} className="flex items-center space-x-2">
                        <RadioGroupItem id={`${question.id}-${option.value}`} value={option.value} />
                        <Label htmlFor={`${question.id}-${option.value}`}>{option.label}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                )}
                
                {question.type === "checkbox" && (
                  <div className="space-y-2">
                    {question.options?.map((option) => {
                      const selectedValues = answers[question.id] || [];
                      return (
                        <div key={option.value} className="flex items-center space-x-2">
                          <Checkbox
                            id={`${question.id}-${option.value}`}
                            checked={selectedValues.includes(option.value)}
                            onCheckedChange={(checked) => {
                              const values = [...(answers[question.id] || [])];
                              if (checked) {
                                values.push(option.value);
                              } else {
                                const index = values.indexOf(option.value);
                                if (index !== -1) values.splice(index, 1);
                              }
                              handleInputChange(question.id, values);
                            }}
                          />
                          <Label htmlFor={`${question.id}-${option.value}`}>{option.label}</Label>
                        </div>
                      );
                    })}
                  </div>
                )}
                
                {question.type === "date" && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !answers[question.id] && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {answers[question.id] ? (
                          format(new Date(answers[question.id]), "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={answers[question.id] ? new Date(answers[question.id]) : undefined}
                        onSelect={(date) => handleInputChange(question.id, date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                )}
                
                {question.type === "number" && (
                  <Input
                    type="number"
                    placeholder={question.placeholder}
                    value={answers[question.id] || ""}
                    onChange={(e) => handleInputChange(question.id, e.target.value)}
                  />
                )}
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button 
            onClick={handleSubmit}
            disabled={submitFormMutation.isPending || !patientId}
          >
            {submitFormMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Submit Form
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}