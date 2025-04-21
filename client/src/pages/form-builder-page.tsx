import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { v4 as uuidv4 } from 'uuid';
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
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { 
  ChevronUp, 
  ChevronDown, 
  Plus, 
  Trash2, 
  Save, 
  ArrowLeft, 
  Copy, 
  AlertCircle, 
  CheckCircle2, 
  Eye
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "../lib/queryClient";
import { FormTemplate } from "@shared/schema";

// Define zod schema for question options
const optionSchema = z.object({
  label: z.string().min(1, "Label is required"),
  value: z.string().min(1, "Value is required"),
});

// Define zod schema for questions
const questionSchema = z.object({
  id: z.string(),
  type: z.enum(["text", "textarea", "radio", "checkbox", "select", "date", "number", "file"]),
  label: z.string().min(1, "Question label is required"),
  required: z.boolean().default(false),
  options: z.array(optionSchema).optional(),
  placeholder: z.string().optional(),
  description: z.string().optional(),
});

// Define zod schema for form
const formSchema = z.object({
  name: z.string().min(3, "Form name is required and must be at least 3 characters"),
  description: z.string().min(3, "Description is required and must be at least 3 characters"),
  category: z.string().min(1, "Category is required"),
  isPublic: z.boolean().default(false),
  questions: z.array(questionSchema).min(1, "At least one question is required"),
});

type FormValues = z.infer<typeof formSchema>;

export default function FormBuilderPage() {
  const params = useParams();
  const formId = params.id ? parseInt(params.id) : undefined;
  const isEditMode = Boolean(formId);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [previewMode, setPreviewMode] = useState(false);

  // Fetch form data if in edit mode
  const { data: formData, isLoading: isLoadingForm } = useQuery<FormTemplate>({
    queryKey: ["/api/forms/templates", formId],
    enabled: isEditMode,
  });

  // Setup form with react-hook-form and zod validation
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      category: "",
      isPublic: false,
      questions: [
        {
          id: uuidv4(),
          type: "text",
          label: "New Question",
          required: false,
          placeholder: "",
          description: "",
        },
      ],
    },
  });

  // Set form values when data is loaded in edit mode
  useEffect(() => {
    if (formData) {
      form.reset({
        name: formData.name,
        description: formData.description,
        category: formData.category,
        isPublic: formData.isPublic,
        questions: Array.isArray(formData.questions) 
          ? formData.questions as any[] 
          : [],
      });
    }
  }, [formData, form]);

  // Setup field array for dynamic form questions
  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name: "questions",
  });

  // Create form mutation
  const createFormMutation = useMutation({
    mutationFn: async (formData: FormValues) => {
      const res = await apiRequest("POST", "/api/forms/templates", formData);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Form created",
        description: "Form has been successfully created.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/forms/templates"] });
      setLocation("/forms");
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create form",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update form mutation
  const updateFormMutation = useMutation({
    mutationFn: async (formData: FormValues) => {
      const res = await apiRequest("PUT", `/api/forms/templates/${formId}`, formData);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Form updated",
        description: "Form has been successfully updated.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/forms/templates"] });
      queryClient.invalidateQueries({ queryKey: ["/api/forms/templates", formId] });
      setLocation("/forms");
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update form",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit = (values: FormValues) => {
    if (isEditMode) {
      updateFormMutation.mutate(values);
    } else {
      createFormMutation.mutate(values);
    }
  };

  // Add a new question to the form
  const addQuestion = (type: string) => {
    append({
      id: uuidv4(),
      type: type as any,
      label: `New ${type.charAt(0).toUpperCase() + type.slice(1)} Question`,
      required: false,
      placeholder: "",
      description: "",
      options: type === "radio" || type === "checkbox" || type === "select" ? [
        { label: "Option 1", value: "option_1" },
        { label: "Option 2", value: "option_2" }
      ] : undefined,
    });
  };

  // Duplicate a question
  const duplicateQuestion = (index: number) => {
    const question = form.getValues(`questions.${index}`);
    append({
      ...question,
      id: uuidv4(),
      label: `${question.label} (Copy)`,
    });
  };

  // Move a question up
  const moveQuestionUp = (index: number) => {
    if (index > 0) {
      move(index, index - 1);
    }
  };

  // Move a question down
  const moveQuestionDown = (index: number) => {
    if (index < fields.length - 1) {
      move(index, index + 1);
    }
  };

  if (isEditMode && isLoadingForm) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Loading Form...</h1>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
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
          <h1 className="text-2xl font-bold">{isEditMode ? "Edit Form" : "Create New Form"}</h1>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant={previewMode ? "default" : "outline"} 
            onClick={() => setPreviewMode(!previewMode)}
          >
            {previewMode ? <CheckCircle2 className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
            {previewMode ? "Exit Preview" : "Preview"}
          </Button>
          <Button 
            onClick={form.handleSubmit(onSubmit)} 
            disabled={createFormMutation.isPending || updateFormMutation.isPending}
          >
            <Save className="h-4 w-4 mr-2" />
            Save Form
          </Button>
        </div>
      </div>

      {previewMode ? (
        <div className="mb-8">
          <Card>
            <CardHeader className="bg-primary/5">
              <CardTitle>{form.watch("name") || "Untitled Form"}</CardTitle>
              <p className="text-sm text-muted-foreground">{form.watch("description") || "No description provided"}</p>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-6">
                {fields.map((field, index) => {
                  const question = form.watch(`questions.${index}`);
                  return (
                    <div key={field.id} className="border p-4 rounded-md">
                      <div className="flex items-start mb-2">
                        <div className="flex-grow">
                          <label className="font-medium text-base">
                            {question.label}
                            {question.required && <span className="text-red-500 ml-1">*</span>}
                          </label>
                          {question.description && (
                            <p className="text-sm text-muted-foreground mt-1">{question.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="mt-2">
                        {question.type === "text" && (
                          <Input placeholder={question.placeholder || ""} />
                        )}
                        {question.type === "textarea" && (
                          <Textarea placeholder={question.placeholder || ""} />
                        )}
                        {question.type === "number" && (
                          <Input type="number" placeholder={question.placeholder || ""} />
                        )}
                        {question.type === "date" && (
                          <Input type="date" />
                        )}
                        {question.type === "radio" && question.options && (
                          <div className="space-y-2">
                            {question.options.map((option, optionIndex) => (
                              <div key={optionIndex} className="flex items-center">
                                <input type="radio" id={`${field.id}-${optionIndex}`} name={field.id} className="mr-2" />
                                <label htmlFor={`${field.id}-${optionIndex}`}>{option.label}</label>
                              </div>
                            ))}
                          </div>
                        )}
                        {question.type === "checkbox" && question.options && (
                          <div className="space-y-2">
                            {question.options.map((option, optionIndex) => (
                              <div key={optionIndex} className="flex items-center">
                                <input type="checkbox" id={`${field.id}-${optionIndex}`} className="mr-2" />
                                <label htmlFor={`${field.id}-${optionIndex}`}>{option.label}</label>
                              </div>
                            ))}
                          </div>
                        )}
                        {question.type === "select" && question.options && (
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Select an option" />
                            </SelectTrigger>
                            <SelectContent>
                              {question.options.map((option, optionIndex) => (
                                <SelectItem key={optionIndex} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                        {question.type === "file" && (
                          <Input type="file" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Form Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter form name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., STD, Urgent Care, General" 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Categorize your form for easier organization
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe the purpose of this form" 
                        className="min-h-[80px]" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isPublic"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Make Public</FormLabel>
                      <FormDescription>
                        Allow all users to see and use this form
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            <div>
              <h2 className="text-xl font-semibold mb-4">Form Questions</h2>
              
              <Tabs defaultValue="build">
                <TabsList className="mb-4">
                  <TabsTrigger value="build">Build</TabsTrigger>
                  <TabsTrigger value="add">Add Question</TabsTrigger>
                </TabsList>
                
                <TabsContent value="build" className="space-y-4">
                  {fields.length === 0 ? (
                    <div className="flex flex-col items-center justify-center border border-dashed rounded-lg p-6 text-center">
                      <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold">No questions added yet</h3>
                      <p className="text-muted-foreground mb-4">
                        Start by adding some questions to your form
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {fields.map((field, index) => (
                        <Card key={field.id} className="relative">
                          <CardHeader className="pb-2">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center">
                                <span className="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center mr-2 text-sm font-semibold">
                                  {index + 1}
                                </span>
                                <CardTitle className="text-lg">
                                  <FormField
                                    control={form.control}
                                    name={`questions.${index}.label`}
                                    render={({ field }) => (
                                      <FormItem className="m-0">
                                        <FormControl>
                                          <Input 
                                            {...field} 
                                            placeholder="Question label" 
                                            className="font-semibold border-none p-0 h-auto text-lg focus-visible:ring-0 focus-visible:ring-offset-0" 
                                          />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                </CardTitle>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Button 
                                  type="button" 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => moveQuestionUp(index)}
                                  disabled={index === 0}
                                >
                                  <ChevronUp className="h-4 w-4" />
                                </Button>
                                <Button 
                                  type="button" 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => moveQuestionDown(index)}
                                  disabled={index === fields.length - 1}
                                >
                                  <ChevronDown className="h-4 w-4" />
                                </Button>
                                <Button 
                                  type="button" 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => duplicateQuestion(index)}
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                                <Button 
                                  type="button" 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => remove(index)}
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <FormField
                                control={form.control}
                                name={`questions.${index}.type`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Question Type</FormLabel>
                                    <Select
                                      onValueChange={field.onChange}
                                      defaultValue={field.value}
                                    >
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select question type" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        <SelectItem value="text">Text Input</SelectItem>
                                        <SelectItem value="textarea">Text Area</SelectItem>
                                        <SelectItem value="radio">Radio Buttons</SelectItem>
                                        <SelectItem value="checkbox">Checkboxes</SelectItem>
                                        <SelectItem value="select">Dropdown</SelectItem>
                                        <SelectItem value="date">Date</SelectItem>
                                        <SelectItem value="number">Number</SelectItem>
                                        <SelectItem value="file">File Upload</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={form.control}
                                name={`questions.${index}.required`}
                                render={({ field }) => (
                                  <FormItem className="flex flex-row items-center justify-between space-x-2 rounded-md border p-3">
                                    <FormLabel>Required Question</FormLabel>
                                    <FormControl>
                                      <Switch
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                      />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={form.control}
                                name={`questions.${index}.description`}
                                render={({ field }) => (
                                  <FormItem className="md:col-span-2">
                                    <FormLabel>Description (Optional)</FormLabel>
                                    <FormControl>
                                      <Input 
                                        {...field} 
                                        placeholder="Additional information about this question" 
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              {(form.watch(`questions.${index}.type`) === "text" || 
                                form.watch(`questions.${index}.type`) === "textarea" || 
                                form.watch(`questions.${index}.type`) === "number") && (
                                <FormField
                                  control={form.control}
                                  name={`questions.${index}.placeholder`}
                                  render={({ field }) => (
                                    <FormItem className="md:col-span-2">
                                      <FormLabel>Placeholder Text (Optional)</FormLabel>
                                      <FormControl>
                                        <Input 
                                          {...field} 
                                          placeholder="Enter placeholder text" 
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              )}
                              
                              {(form.watch(`questions.${index}.type`) === "radio" || 
                                form.watch(`questions.${index}.type`) === "checkbox" || 
                                form.watch(`questions.${index}.type`) === "select") && (
                                <div className="md:col-span-2">
                                  <FormLabel>Options</FormLabel>
                                  <div className="space-y-2 mt-2">
                                    {form.watch(`questions.${index}.options`)?.map((_, optionIndex) => (
                                      <div key={optionIndex} className="flex items-center space-x-2">
                                        <FormField
                                          control={form.control}
                                          name={`questions.${index}.options.${optionIndex}.label`}
                                          render={({ field }) => (
                                            <FormItem className="flex-grow m-0">
                                              <FormControl>
                                                <Input 
                                                  {...field} 
                                                  placeholder="Option label" 
                                                />
                                              </FormControl>
                                              <FormMessage />
                                            </FormItem>
                                          )}
                                        />
                                        <FormField
                                          control={form.control}
                                          name={`questions.${index}.options.${optionIndex}.value`}
                                          render={({ field }) => (
                                            <FormItem className="flex-grow m-0">
                                              <FormControl>
                                                <Input 
                                                  {...field} 
                                                  placeholder="Value" 
                                                />
                                              </FormControl>
                                              <FormMessage />
                                            </FormItem>
                                          )}
                                        />
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => {
                                            const options = form.getValues(`questions.${index}.options`) || [];
                                            const newOptions = options.filter((_, i) => i !== optionIndex);
                                            form.setValue(`questions.${index}.options`, newOptions);
                                          }}
                                          className="text-destructive hover:text-destructive"
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    ))}
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        const options = form.getValues(`questions.${index}.options`) || [];
                                        form.setValue(`questions.${index}.options`, [
                                          ...options,
                                          { label: `Option ${options.length + 1}`, value: `option_${options.length + 1}` }
                                        ]);
                                      }}
                                      className="mt-2"
                                    >
                                      <Plus className="h-4 w-4 mr-1" />
                                      Add Option
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="add">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="h-auto py-6 flex flex-col"
                      onClick={() => addQuestion("text")}
                    >
                      <div className="text-3xl mb-2">Aa</div>
                      <div className="font-semibold">Text Input</div>
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="h-auto py-6 flex flex-col"
                      onClick={() => addQuestion("textarea")}
                    >
                      <div className="text-3xl mb-2">&#9783;</div>
                      <div className="font-semibold">Text Area</div>
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="h-auto py-6 flex flex-col"
                      onClick={() => addQuestion("radio")}
                    >
                      <div className="text-3xl mb-2">&#9673;</div>
                      <div className="font-semibold">Radio Buttons</div>
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="h-auto py-6 flex flex-col"
                      onClick={() => addQuestion("checkbox")}
                    >
                      <div className="text-3xl mb-2">☑</div>
                      <div className="font-semibold">Checkboxes</div>
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="h-auto py-6 flex flex-col"
                      onClick={() => addQuestion("select")}
                    >
                      <div className="text-3xl mb-2">▼</div>
                      <div className="font-semibold">Dropdown</div>
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="h-auto py-6 flex flex-col"
                      onClick={() => addQuestion("date")}
                    >
                      <div className="text-3xl mb-2">📅</div>
                      <div className="font-semibold">Date</div>
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="h-auto py-6 flex flex-col"
                      onClick={() => addQuestion("number")}
                    >
                      <div className="text-3xl mb-2">123</div>
                      <div className="font-semibold">Number</div>
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="h-auto py-6 flex flex-col"
                      onClick={() => addQuestion("file")}
                    >
                      <div className="text-3xl mb-2">📎</div>
                      <div className="font-semibold">File Upload</div>
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            <div className="flex justify-end space-x-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setLocation("/forms")}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={createFormMutation.isPending || updateFormMutation.isPending}
              >
                <Save className="h-4 w-4 mr-2" />
                {isEditMode ? "Update Form" : "Create Form"}
              </Button>
            </div>
          </form>
        </Form>
      )}
    </div>
  );
}