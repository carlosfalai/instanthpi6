import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Edit, FileText, Save, X, ChevronDown, ChevronUp } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Dialog, 
  DialogTrigger, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

// Question types that can be added to a form
type QuestionType = "text" | "textarea" | "select" | "radio" | "checkbox" | "date" | "number";

interface Option {
  value: string;
  label: string;
}

interface Question {
  id: string;
  type: QuestionType;
  label: string;
  required: boolean;
  placeholder?: string;
  description?: string;
  options?: Option[];
}

interface FormTemplate {
  id: number;
  name: string;
  description: string;
  category: string;
  isPublic: boolean;
  userId: number | null;
  questions: Question[];
  createdAt: string;
  updatedAt: string;
}

const defaultQuestions: Record<QuestionType, Omit<Question, "id">> = {
  text: {
    type: "text",
    label: "Short Answer",
    required: false,
    placeholder: "Enter your answer",
  },
  textarea: {
    type: "textarea",
    label: "Long Answer",
    required: false,
    placeholder: "Enter your detailed answer",
  },
  select: {
    type: "select",
    label: "Dropdown Selection",
    required: false,
    options: [
      { value: "option1", label: "Option 1" },
      { value: "option2", label: "Option 2" },
    ],
  },
  radio: {
    type: "radio",
    label: "Single Choice",
    required: false,
    options: [
      { value: "option1", label: "Option 1" },
      { value: "option2", label: "Option 2" },
    ],
  },
  checkbox: {
    type: "checkbox",
    label: "Multiple Choice",
    required: false,
    options: [
      { value: "option1", label: "Option 1" },
      { value: "option2", label: "Option 2" },
    ],
  },
  date: {
    type: "date",
    label: "Date",
    required: false,
  },
  number: {
    type: "number",
    label: "Number",
    required: false,
    placeholder: "Enter a number",
  },
};

// Main form categories
const formCategories = [
  "General Medical",
  "STD Testing",
  "Urgent Care",
  "Follow-up",
  "Wellness Visit",
  "Mental Health",
  "Other"
];

const FormBuilder = () => {
  const [activeTab, setActiveTab] = useState("template-list");
  const [editingTemplate, setEditingTemplate] = useState<FormTemplate | null>(null);
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formCategory, setFormCategory] = useState(formCategories[0]);
  const [isPublic, setIsPublic] = useState(true);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  const { toast } = useToast();

  // Fetch form templates
  const { data: formTemplates = [], isLoading: isLoadingTemplates } = useQuery({
    queryKey: ["/api/forms/templates", selectedCategory],
    queryFn: async () => {
      const url = selectedCategory 
        ? `/api/forms/templates?category=${encodeURIComponent(selectedCategory)}`
        : "/api/forms/templates";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch templates");
      return res.json();
    }
  });

  // Create form template mutation
  const createTemplateMutation = useMutation({
    mutationFn: async (newTemplate: Omit<FormTemplate, "id" | "createdAt" | "updatedAt">) => {
      const res = await apiRequest("POST", "/api/forms/templates", newTemplate);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/forms/templates"] });
      toast({
        title: "Success",
        description: "Form template created successfully",
      });
      resetFormState();
      setActiveTab("template-list");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to create template: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Update form template mutation
  const updateTemplateMutation = useMutation({
    mutationFn: async (template: Partial<FormTemplate> & { id: number }) => {
      const { id, ...updateData } = template;
      const res = await apiRequest("PUT", `/api/forms/templates/${id}`, updateData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/forms/templates"] });
      toast({
        title: "Success",
        description: "Form template updated successfully",
      });
      resetFormState();
      setActiveTab("template-list");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to update template: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Delete form template mutation
  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/forms/templates/${id}`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/forms/templates"] });
      toast({
        title: "Success",
        description: "Form template deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to delete template: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Reset form state
  const resetFormState = () => {
    setFormName("");
    setFormDescription("");
    setFormCategory(formCategories[0]);
    setIsPublic(true);
    setQuestions([]);
    setEditingTemplate(null);
  };

  // Add a new question to the form
  const addQuestion = (type: QuestionType) => {
    const newQuestion: Question = {
      ...defaultQuestions[type],
      id: crypto.randomUUID(),
    };
    setQuestions([...questions, newQuestion]);
  };

  // Remove a question from the form
  const removeQuestion = (id: string) => {
    setQuestions(questions.filter((q) => q.id !== id));
  };

  // Update a question
  const updateQuestion = (id: string, updates: Partial<Question>) => {
    setQuestions(
      questions.map((q) => (q.id === id ? { ...q, ...updates } : q))
    );
  };

  // Move question up in the list
  const moveQuestionUp = (index: number) => {
    if (index === 0) return;
    const newQuestions = [...questions];
    [newQuestions[index], newQuestions[index - 1]] = [newQuestions[index - 1], newQuestions[index]];
    setQuestions(newQuestions);
  };

  // Move question down in the list
  const moveQuestionDown = (index: number) => {
    if (index === questions.length - 1) return;
    const newQuestions = [...questions];
    [newQuestions[index], newQuestions[index + 1]] = [newQuestions[index + 1], newQuestions[index]];
    setQuestions(newQuestions);
  };

  // Handle form submission
  const handleSubmit = () => {
    if (!formName.trim()) {
      toast({
        title: "Validation Error",
        description: "Form name is required",
        variant: "destructive",
      });
      return;
    }

    if (questions.length === 0) {
      toast({
        title: "Validation Error",
        description: "Form must have at least one question",
        variant: "destructive",
      });
      return;
    }

    const templateData = {
      name: formName,
      description: formDescription,
      category: formCategory,
      isPublic,
      questions,
    };

    if (editingTemplate) {
      updateTemplateMutation.mutate({
        id: editingTemplate.id,
        ...templateData,
      });
    } else {
      createTemplateMutation.mutate(templateData as any);
    }
  };

  // Handle editing a template
  const handleEditTemplate = (template: FormTemplate) => {
    setEditingTemplate(template);
    setFormName(template.name);
    setFormDescription(template.description);
    setFormCategory(template.category);
    setIsPublic(template.isPublic);
    setQuestions(template.questions);
    setActiveTab("create-template");
  };

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Form Builder</h1>
      <p className="text-gray-500 mb-6">
        Create custom forms for your patients instead of using external Formsite forms. These forms can be sent to patients and the responses will be saved directly in your system.
      </p>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="template-list">Form Templates</TabsTrigger>
          <TabsTrigger value="create-template">
            {editingTemplate ? "Edit Template" : "Create Template"}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="template-list" className="space-y-6">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-4">
              <Select value={selectedCategory || ""} onValueChange={(value) => setSelectedCategory(value || null)}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Categories</SelectItem>
                  {formCategories.map((category) => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => {
              resetFormState();
              setActiveTab("create-template");
            }}>
              <Plus className="mr-2 h-4 w-4" /> Create New Form
            </Button>
          </div>

          {isLoadingTemplates ? (
            <div className="text-center py-8">Loading templates...</div>
          ) : formTemplates.length === 0 ? (
            <div className="text-center py-8 border rounded-lg bg-gray-50">
              <p className="text-gray-500 mb-4">No form templates found</p>
              <Button onClick={() => setActiveTab("create-template")}>
                Create Your First Form
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {formTemplates.map((template: FormTemplate) => (
                <Card key={template.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-xl font-bold">{template.name}</CardTitle>
                      <Badge variant="outline">{template.category}</Badge>
                    </div>
                    <CardDescription className="text-sm text-gray-500 mt-1">
                      {template.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-3">
                    <div className="text-sm text-gray-500">
                      <p>{template.questions.length} question{template.questions.length !== 1 ? "s" : ""}</p>
                      <p className="text-xs mt-1">Created: {new Date(template.createdAt).toLocaleDateString()}</p>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between pt-0">
                    <Button variant="outline" size="sm" onClick={() => handleEditTemplate(template)}>
                      <Edit className="h-4 w-4 mr-1" /> Edit
                    </Button>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          <Trash2 className="h-4 w-4 mr-1" /> Delete
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Delete Form Template</DialogTitle>
                          <DialogDescription>
                            Are you sure you want to delete "{template.name}"? This action cannot be undone.
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                          <DialogClose asChild>
                            <Button variant="outline">Cancel</Button>
                          </DialogClose>
                          <Button 
                            variant="destructive" 
                            onClick={() => deleteTemplateMutation.mutate(template.id)}
                            disabled={deleteTemplateMutation.isPending}
                          >
                            Delete
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="create-template">
          <Card>
            <CardHeader>
              <CardTitle>{editingTemplate ? "Edit Form Template" : "Create Form Template"}</CardTitle>
              <CardDescription>
                Design your custom form with various question types.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="formName">Form Name *</Label>
                  <Input
                    id="formName"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g., STD Screening Questionnaire"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="formDescription">Description</Label>
                  <Textarea
                    id="formDescription"
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Describe the purpose of this form"
                    className="mt-1"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="formCategory">Category</Label>
                    <Select value={formCategory} onValueChange={setFormCategory}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {formCategories.map((category) => (
                          <SelectItem key={category} value={category}>{category}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <div className="flex items-center space-x-2 mt-6">
                      <Switch
                        id="isPublic"
                        checked={isPublic}
                        onCheckedChange={setIsPublic}
                      />
                      <Label htmlFor="isPublic">Make this template available to all users</Label>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-medium mb-4">Questions</h3>
                
                <div className="space-y-6">
                  {questions.map((question, index) => (
                    <Card key={question.id} className="relative">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{question.type}</Badge>
                            {question.required && <Badge>Required</Badge>}
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => moveQuestionUp(index)}
                              disabled={index === 0}
                            >
                              <ChevronUp className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => moveQuestionDown(index)}
                              disabled={index === questions.length - 1}
                            >
                              <ChevronDown className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeQuestion(question.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label>Question Text</Label>
                          <Input
                            value={question.label}
                            onChange={(e) =>
                              updateQuestion(question.id, { label: e.target.value })
                            }
                            className="mt-1"
                          />
                        </div>

                        {(question.type === "text" || question.type === "textarea" || question.type === "number") && (
                          <div>
                            <Label>Placeholder (optional)</Label>
                            <Input
                              value={question.placeholder || ""}
                              onChange={(e) =>
                                updateQuestion(question.id, { placeholder: e.target.value })
                              }
                              className="mt-1"
                            />
                          </div>
                        )}

                        {(question.type === "select" || question.type === "radio" || question.type === "checkbox") && (
                          <div>
                            <Label className="flex justify-between">
                              <span>Options</span>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const options = [...(question.options || [])];
                                  options.push({
                                    value: `option${options.length + 1}`,
                                    label: `Option ${options.length + 1}`,
                                  });
                                  updateQuestion(question.id, { options });
                                }}
                              >
                                <Plus className="h-3 w-3 mr-1" /> Add Option
                              </Button>
                            </Label>
                            <div className="space-y-2 mt-2">
                              {question.options?.map((option, optionIndex) => (
                                <div key={option.value} className="flex gap-2">
                                  <Input
                                    value={option.label}
                                    onChange={(e) => {
                                      const options = [...(question.options || [])];
                                      options[optionIndex] = {
                                        ...options[optionIndex],
                                        label: e.target.value,
                                      };
                                      updateQuestion(question.id, { options });
                                    }}
                                    className="flex-1"
                                  />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                      const options = [...(question.options || [])];
                                      options.splice(optionIndex, 1);
                                      updateQuestion(question.id, { options });
                                    }}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="flex items-center space-x-2">
                          <Switch
                            id={`required-${question.id}`}
                            checked={question.required}
                            onCheckedChange={(checked) =>
                              updateQuestion(question.id, { required: checked })
                            }
                          />
                          <Label htmlFor={`required-${question.id}`}>Required question</Label>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  <div className="flex flex-wrap gap-2">
                    <div className="text-sm font-medium mb-2 w-full">Add a question:</div>
                    <Button variant="outline" onClick={() => addQuestion("text")}>
                      <Plus className="h-4 w-4 mr-1" /> Text
                    </Button>
                    <Button variant="outline" onClick={() => addQuestion("textarea")}>
                      <Plus className="h-4 w-4 mr-1" /> Long Text
                    </Button>
                    <Button variant="outline" onClick={() => addQuestion("select")}>
                      <Plus className="h-4 w-4 mr-1" /> Dropdown
                    </Button>
                    <Button variant="outline" onClick={() => addQuestion("radio")}>
                      <Plus className="h-4 w-4 mr-1" /> Single Choice
                    </Button>
                    <Button variant="outline" onClick={() => addQuestion("checkbox")}>
                      <Plus className="h-4 w-4 mr-1" /> Multiple Choice
                    </Button>
                    <Button variant="outline" onClick={() => addQuestion("date")}>
                      <Plus className="h-4 w-4 mr-1" /> Date
                    </Button>
                    <Button variant="outline" onClick={() => addQuestion("number")}>
                      <Plus className="h-4 w-4 mr-1" /> Number
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => {
                resetFormState();
                setActiveTab("template-list");
              }}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={createTemplateMutation.isPending || updateTemplateMutation.isPending}>
                <Save className="h-4 w-4 mr-2" />
                {editingTemplate ? "Update Form" : "Save Form"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default function FormsPage() {
  return <FormBuilder />;
}