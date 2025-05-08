import { useState, useEffect } from "react";
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
import AppLayoutSpruce from "@/components/layout/AppLayoutSpruce";
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

// Option structure for select, radio, checkbox questions
interface Option {
  value: string;
  label: string;
}

// Question structure
interface Question {
  id: string;
  type: QuestionType;
  label: string;
  required: boolean;
  placeholder?: string;
  description?: string;
  options?: Option[];
}

// Form template structure
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

function FormBuilder() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("template-list");
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formCategory, setFormCategory] = useState("General");
  const [isPublic, setIsPublic] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [editingTemplate, setEditingTemplate] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  // Predefined form categories
  const formCategories = [
    "General",
    "Medical History",
    "Screening",
    "Intake",
    "Assessment",
    "Follow-up",
    "Consent",
    "Vaccination"
  ];
  
  // Fetch form templates
  const { data: formTemplates = [], isLoading: isLoadingTemplates } = useQuery({
    queryKey: ["/api/forms/templates", selectedCategory],
    queryFn: async () => {
      const url = selectedCategory && selectedCategory !== "all" 
        ? `/api/forms/templates?category=${selectedCategory}`
        : "/api/forms/templates";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch templates");
      return res.json();
    },
  });
  
  // Create form template mutation
  const createTemplateMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/forms/templates", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Form template created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/forms/templates"] });
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
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await apiRequest("PATCH", `/api/forms/templates/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Form template updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/forms/templates"] });
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
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Form template deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/forms/templates"] });
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
    setFormCategory("General");
    setIsPublic(false);
    setQuestions([]);
    setEditingTemplate(null);
  };
  
  // Add a question to the form
  const addQuestion = (type: QuestionType) => {
    const newQuestion: Question = {
      id: `question_${Date.now()}`,
      type,
      label: `New ${type} question`,
      required: false,
    };
    
    if (type === "select" || type === "radio" || type === "checkbox") {
      newQuestion.options = [
        { value: "option1", label: "Option 1" },
        { value: "option2", label: "Option 2" },
      ];
    }
    
    setQuestions([...questions, newQuestion]);
  };
  
  // Update a question's properties
  const updateQuestion = (id: string, updates: Partial<Question>) => {
    setQuestions(
      questions.map((q) => (q.id === id ? { ...q, ...updates } : q))
    );
  };
  
  // Remove a question
  const removeQuestion = (id: string) => {
    setQuestions(questions.filter((q) => q.id !== id));
  };
  
  // Move question up in the order
  const moveQuestionUp = (index: number) => {
    if (index === 0) return;
    const newQuestions = [...questions];
    [newQuestions[index], newQuestions[index - 1]] = [newQuestions[index - 1], newQuestions[index]];
    setQuestions(newQuestions);
  };
  
  // Move question down in the order
  const moveQuestionDown = (index: number) => {
    if (index === questions.length - 1) return;
    const newQuestions = [...questions];
    [newQuestions[index], newQuestions[index + 1]] = [newQuestions[index + 1], newQuestions[index]];
    setQuestions(newQuestions);
  };
  
  // Handle form submission
  const handleSubmit = () => {
    if (!formName) {
      toast({
        title: "Error",
        description: "Form name is required",
        variant: "destructive",
      });
      return;
    }
    
    if (questions.length === 0) {
      toast({
        title: "Error",
        description: "Add at least one question to the form",
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
        id: editingTemplate,
        data: templateData,
      });
    } else {
      createTemplateMutation.mutate(templateData);
    }
  };
  
  // Edit an existing template
  const handleEditTemplate = (template: FormTemplate) => {
    setFormName(template.name);
    setFormDescription(template.description);
    setFormCategory(template.category);
    setIsPublic(template.isPublic);
    setEditingTemplate(template.id);
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
                  <SelectItem value="all">All Categories</SelectItem>
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
                                      const newOptions = [...(question.options || [])];
                                      newOptions[optionIndex] = {
                                        ...newOptions[optionIndex],
                                        label: e.target.value,
                                      };
                                      updateQuestion(question.id, { options: newOptions });
                                    }}
                                    className="flex-1"
                                    placeholder="Option label"
                                  />
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                      const newOptions = [...(question.options || [])];
                                      newOptions.splice(optionIndex, 1);
                                      updateQuestion(question.id, { options: newOptions });
                                    }}
                                    className="text-red-500 hover:text-red-700"
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
                          <Label htmlFor={`required-${question.id}`}>Required</Label>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm font-medium mb-2 w-full">Add a question:</div>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" onClick={() => addQuestion("text")}>
                        <Plus className="h-3 w-3 mr-1" /> Text
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => addQuestion("textarea")}>
                        <Plus className="h-3 w-3 mr-1" /> Text Area
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => addQuestion("select")}>
                        <Plus className="h-3 w-3 mr-1" /> Dropdown
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => addQuestion("radio")}>
                        <Plus className="h-3 w-3 mr-1" /> Radio
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => addQuestion("checkbox")}>
                        <Plus className="h-3 w-3 mr-1" /> Checkbox
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => addQuestion("date")}>
                        <Plus className="h-3 w-3 mr-1" /> Date
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => addQuestion("number")}>
                        <Plus className="h-3 w-3 mr-1" /> Number
                      </Button>
                    </div>
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
}

// FormAccessibility component to manage form accessibility and display URLs
function FormAccessibility() {
  const { toast } = useToast();
  const [selectedForms, setSelectedForms] = useState<Record<number, boolean>>({});
  
  // Fetch all form templates
  const { data: formTemplates = [], isLoading } = useQuery({
    queryKey: ["/api/forms/templates/all"],
    queryFn: async () => {
      const res = await fetch("/api/forms/templates");
      if (!res.ok) throw new Error("Failed to fetch templates");
      return res.json();
    },
  });
  
  // Initialize selected forms when data is loaded
  useEffect(() => {
    const initialSelectedForms: Record<number, boolean> = {};
    formTemplates.forEach((template: FormTemplate) => {
      initialSelectedForms[template.id] = template.isPublic;
    });
    setSelectedForms(initialSelectedForms);
  }, [formTemplates]);
  
  // Update form accessibility mutation
  const updateFormAccessibilityMutation = useMutation({
    mutationFn: async ({ id, isPublic }: { id: number; isPublic: boolean }) => {
      const res = await apiRequest("PATCH", `/api/forms/templates/${id}`, { isPublic });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/forms/templates/all"] });
      toast({
        title: "Success",
        description: "Form accessibility updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to update form accessibility: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Handle form toggle
  const handleFormToggle = (id: number, isPublic: boolean) => {
    setSelectedForms(prev => ({ ...prev, [id]: isPublic }));
    updateFormAccessibilityMutation.mutate({ id, isPublic });
  };
  
  // Generate sharable URL for a form
  const getFormUrl = (formId: number) => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/form/${formId}`;
  };
  
  // State for the currently viewed form
  const [viewingForm, setViewingForm] = useState<FormTemplate | null>(null);
  
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Form Accessibility</h1>
      <p className="text-gray-500 mb-6">
        Manage which forms are accessible to patients and view their URLs. Toggle forms on to make them available to patients.
      </p>
      
      {isLoading ? (
        <div className="text-center py-8">Loading forms...</div>
      ) : formTemplates.length === 0 ? (
        <div className="text-center py-8 border rounded-lg bg-gray-50">
          <p className="text-gray-500 mb-4">No form templates found</p>
        </div>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Available Forms</CardTitle>
              <CardDescription>
                Toggle forms on/off to control patient access. Click on a form to view its details.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {formTemplates.map((template: FormTemplate) => (
                  <div key={template.id} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-medium cursor-pointer hover:text-blue-600" onClick={() => setViewingForm(template)}>
                            {template.name}
                          </h3>
                          <Badge variant="outline">{template.category}</Badge>
                        </div>
                        <p className="text-sm text-gray-500">{template.description}</p>
                        <div className="text-xs text-gray-400">
                          {template.questions.length} question{template.questions.length !== 1 ? "s" : ""}
                        </div>
                        <div className="pt-2">
                          <div className="flex items-center space-x-2">
                            <Label htmlFor={`url-${template.id}`} className="text-sm font-medium">
                              Form URL:
                            </Label>
                            <div className="relative flex-1">
                              <Input
                                id={`url-${template.id}`}
                                value={getFormUrl(template.id)}
                                readOnly
                                className="pr-16 text-xs"
                              />
                              <Button
                                size="sm"
                                variant="ghost"
                                className="absolute right-0 top-0 h-full px-3"
                                onClick={() => {
                                  navigator.clipboard.writeText(getFormUrl(template.id));
                                  toast({
                                    title: "URL Copied",
                                    description: "Form URL copied to clipboard",
                                  });
                                }}
                              >
                                Copy
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-start gap-2 ml-4">
                        <div className="flex flex-col items-center gap-1">
                          <Switch
                            id={`form-${template.id}`}
                            checked={selectedForms[template.id] || false}
                            onCheckedChange={(checked) => handleFormToggle(template.id, checked)}
                          />
                          <Label htmlFor={`form-${template.id}`} className="text-xs">
                            {selectedForms[template.id] ? "Accessible" : "Hidden"}
                          </Label>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          {/* Form viewer dialog */}
          {viewingForm && (
            <Dialog open={!!viewingForm} onOpenChange={(open) => !open && setViewingForm(null)}>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{viewingForm.name}</DialogTitle>
                  <DialogDescription>
                    {viewingForm.description}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-6 py-4">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">{viewingForm.category}</Badge>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">Accessibility:</span>
                      <Switch
                        id={`dialog-form-${viewingForm.id}`}
                        checked={selectedForms[viewingForm.id] || false}
                        onCheckedChange={(checked) => handleFormToggle(viewingForm.id, checked)}
                      />
                      <Label htmlFor={`dialog-form-${viewingForm.id}`} className="text-sm">
                        {selectedForms[viewingForm.id] ? "Accessible" : "Hidden"}
                      </Label>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="text-lg font-medium mb-4">Form URL</h3>
                    <div className="flex items-center space-x-2">
                      <Input
                        value={getFormUrl(viewingForm.id)}
                        readOnly
                        className="flex-1"
                      />
                      <Button
                        onClick={() => {
                          navigator.clipboard.writeText(getFormUrl(viewingForm.id));
                          toast({
                            title: "URL Copied",
                            description: "Form URL copied to clipboard",
                          });
                        }}
                      >
                        Copy URL
                      </Button>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="text-lg font-medium mb-4">Questions Preview</h3>
                    <div className="space-y-4">
                      {viewingForm.questions.map((question, index) => (
                        <Card key={question.id}>
                          <CardHeader className="pb-2">
                            <div className="flex justify-between">
                              <CardTitle className="text-base">
                                {index + 1}. {question.label} {question.required && <span className="text-red-500">*</span>}
                              </CardTitle>
                              <Badge>{question.type}</Badge>
                            </div>
                          </CardHeader>
                          <CardContent>
                            {/* Preview of question content based on type */}
                            {(question.type === 'text' || question.type === 'textarea') && (
                              <Input disabled placeholder={question.placeholder || `Enter ${question.type === 'text' ? 'text' : 'long text'} here...`} />
                            )}
                            
                            {question.type === 'select' && question.options && (
                              <Select disabled>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select an option" />
                                </SelectTrigger>
                                <SelectContent>
                                  {question.options.map(option => (
                                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                            
                            {question.type === 'radio' && question.options && (
                              <div className="space-y-2">
                                {question.options.map(option => (
                                  <div key={option.value} className="flex items-center space-x-2">
                                    <input type="radio" id={`${question.id}-${option.value}`} name={question.id} disabled />
                                    <Label htmlFor={`${question.id}-${option.value}`}>{option.label}</Label>
                                  </div>
                                ))}
                              </div>
                            )}
                            
                            {question.type === 'checkbox' && question.options && (
                              <div className="space-y-2">
                                {question.options.map(option => (
                                  <div key={option.value} className="flex items-center space-x-2">
                                    <input type="checkbox" id={`${question.id}-${option.value}`} disabled />
                                    <Label htmlFor={`${question.id}-${option.value}`}>{option.label}</Label>
                                  </div>
                                ))}
                              </div>
                            )}
                            
                            {question.type === 'date' && (
                              <Input type="date" disabled />
                            )}
                            
                            {question.type === 'number' && (
                              <Input type="number" disabled placeholder="Enter a number..." />
                            )}
                            
                            {question.description && (
                              <p className="text-xs text-gray-500 mt-2">{question.description}</p>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={() => setViewingForm(null)}>Close</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      )}
    </div>
  );
}

export default function FormsPage() {
  const [activeTab, setActiveTab] = useState("builder");
  
  return (
    <AppLayoutSpruce>
      <div className="container mx-auto py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="builder">Form Builder</TabsTrigger>
            <TabsTrigger value="accessibility">Form Accessibility</TabsTrigger>
          </TabsList>
          
          <TabsContent value="builder">
            <FormBuilder />
          </TabsContent>
          
          <TabsContent value="accessibility">
            <FormAccessibility />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayoutSpruce>
  );
}