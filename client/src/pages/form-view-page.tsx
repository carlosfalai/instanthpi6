import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "../lib/queryClient";
import { FormTemplate } from "@shared/schema";

// Define zod schema for form response
const formResponseSchema = z.object({
  formTemplateId: z.number(),
  patientId: z.number(),
  answers: z.record(z.string(), z.any()),
  status: z.string().default("completed"),
});

type FormResponseValues = z.infer<typeof formResponseSchema>;

export default function FormViewPage() {
  const params = useParams();
  const formId = params.id ? parseInt(params.id) : undefined;
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);

  // Fetch form data
  const { data: formTemplate, isLoading: isLoadingForm } = useQuery<FormTemplate>({
    queryKey: ["/api/forms/templates", formId],
    enabled: Boolean(formId),
  });

  // Fetch patients
  const { data: patients, isLoading: isLoadingPatients } = useQuery({
    queryKey: ["/api/patients"],
  });

  // Setup form with react-hook-form and zod validation
  const form = useForm<FormResponseValues>({
    resolver: zodResolver(formResponseSchema),
    defaultValues: {
      formTemplateId: formId,
      patientId: 0,
      answers: {},
      status: "completed",
    },
  });

  // Create form response mutation
  const submitFormMutation = useMutation({
    mutationFn: async (formData: FormResponseValues) => {
      const res = await apiRequest("POST", "/api/forms/responses", formData);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Form submitted",
        description: "Form has been successfully submitted.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/forms/responses"] });
      setLocation("/forms");
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to submit form",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit = (values: FormResponseValues) => {
    if (!formId || !selectedPatientId) {
      toast({
        title: "Error",
        description: "Missing form ID or patient selection",
        variant: "destructive",
      });
      return;
    }

    const submissionData = {
      ...values,
      formTemplateId: formId,
      patientId: selectedPatientId,
    };

    submitFormMutation.mutate(submissionData);
  };

  // Handle patient selection
  const handlePatientSelect = (patientId: string) => {
    const id = parseInt(patientId);
    setSelectedPatientId(id);
    form.setValue("patientId", id);
  };

  if (isLoadingForm || isLoadingPatients) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Loading Form...</h1>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

  if (!formTemplate) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Form Not Found</h1>
        <p>The requested form could not be found.</p>
        <Button onClick={() => setLocation("/forms")} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Forms
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Button variant="ghost" size="sm" onClick={() => setLocation("/forms")} className="mr-2">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Forms
          </Button>
          <h1 className="text-2xl font-bold">Fill Form: {formTemplate.name}</h1>
        </div>
      </div>

      <div className="mb-6">
        <Card>
          <CardHeader>
            <CardTitle>{formTemplate.name}</CardTitle>
            <CardDescription>{formTemplate.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Select Patient</h3>
              <Select onValueChange={handlePatientSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a patient" />
                </SelectTrigger>
                <SelectContent>
                  {patients?.map((patient) => (
                    <SelectItem key={patient.id} value={patient.id.toString()}>
                      {patient.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedPatientId && (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {Array.isArray(formTemplate.questions) && formTemplate.questions.map((question: any, index: number) => (
                    <div key={question.id} className="border p-4 rounded-md">
                      <FormLabel className="text-base mb-1 block">
                        {question.label}
                        {question.required && <span className="text-red-500 ml-1">*</span>}
                      </FormLabel>
                      
                      {question.description && (
                        <p className="text-sm text-muted-foreground mb-2">{question.description}</p>
                      )}
                      
                      {question.type === "text" && (
                        <FormField
                          control={form.control}
                          name={`answers.${question.id}`}
                          rules={{ required: question.required }}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input placeholder={question.placeholder || ""} {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                      
                      {question.type === "textarea" && (
                        <FormField
                          control={form.control}
                          name={`answers.${question.id}`}
                          rules={{ required: question.required }}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Textarea placeholder={question.placeholder || ""} {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                      
                      {question.type === "number" && (
                        <FormField
                          control={form.control}
                          name={`answers.${question.id}`}
                          rules={{ required: question.required }}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  placeholder={question.placeholder || ""} 
                                  {...field} 
                                  onChange={(e) => field.onChange(parseFloat(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                      
                      {question.type === "date" && (
                        <FormField
                          control={form.control}
                          name={`answers.${question.id}`}
                          rules={{ required: question.required }}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input 
                                  type="date" 
                                  {...field} 
                                  value={field.value || ""}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                      
                      {question.type === "radio" && question.options && (
                        <FormField
                          control={form.control}
                          name={`answers.${question.id}`}
                          rules={{ required: question.required }}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <RadioGroup
                                  onValueChange={field.onChange}
                                  value={field.value}
                                  className="space-y-2"
                                >
                                  {question.options.map((option: any) => (
                                    <div key={option.value} className="flex items-center space-x-2">
                                      <RadioGroupItem id={`${question.id}-${option.value}`} value={option.value} />
                                      <label htmlFor={`${question.id}-${option.value}`}>{option.label}</label>
                                    </div>
                                  ))}
                                </RadioGroup>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                      
                      {question.type === "checkbox" && question.options && (
                        <div className="space-y-2">
                          {question.options.map((option: any) => (
                            <FormField
                              key={option.value}
                              control={form.control}
                              name={`answers.${question.id}.${option.value}`}
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                    />
                                  </FormControl>
                                  <FormLabel className="text-sm font-normal">
                                    {option.label}
                                  </FormLabel>
                                </FormItem>
                              )}
                            />
                          ))}
                        </div>
                      )}
                      
                      {question.type === "select" && question.options && (
                        <FormField
                          control={form.control}
                          name={`answers.${question.id}`}
                          rules={{ required: question.required }}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Select
                                  onValueChange={field.onChange}
                                  value={field.value}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select an option" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {question.options.map((option: any) => (
                                      <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                      
                      {question.type === "file" && (
                        <FormField
                          control={form.control}
                          name={`answers.${question.id}`}
                          rules={{ required: question.required }}
                          render={({ field: { value, onChange, ...field } }) => (
                            <FormItem>
                              <FormControl>
                                <Input
                                  type="file"
                                  {...field}
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      const reader = new FileReader();
                                      reader.onload = (event) => {
                                        if (event.target?.result) {
                                          onChange(event.target.result);
                                        }
                                      };
                                      reader.readAsDataURL(file);
                                    }
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </div>
                  ))}
                  
                  <div className="flex justify-end">
                    <Button
                      type="submit" 
                      disabled={submitFormMutation.isPending}
                      className="min-w-[120px]"
                    >
                      {submitFormMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Submitting
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Submit Form
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}