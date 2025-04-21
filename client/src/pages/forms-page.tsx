import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Edit2, Trash2, FileText, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";
import { FormTemplate } from "@shared/schema";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export default function FormsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Fetch form templates
  const { data: formTemplates, isLoading, error } = useQuery<FormTemplate[]>({
    queryKey: ["/api/forms/templates"],
  });

  // Get unique categories from form templates
  const categories = formTemplates 
    ? ["all", ...new Set(formTemplates.map(template => template.category))]
    : ["all"];
    
  // Filter templates by selected category
  const filteredTemplates = formTemplates 
    ? (selectedCategory === "all" 
        ? formTemplates 
        : formTemplates.filter(template => template.category === selectedCategory))
    : [];

  const handleCreateNewForm = () => {
    setLocation("/forms/new");
  };

  const handleDeleteForm = async (id: number) => {
    try {
      const response = await fetch(`/api/forms/templates/${id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        toast({
          title: "Form template deleted",
          description: "Form template has been successfully deleted.",
        });
      } else {
        toast({
          title: "Failed to delete form template",
          description: "An error occurred while deleting the form template.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error deleting form template:", error);
      toast({
        title: "Failed to delete form template",
        description: "An error occurred while deleting the form template.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Forms</h1>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Forms</h1>
        <div className="bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4 text-red-800 dark:text-red-200">
          Error loading form templates. Please try again later.
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Forms</h1>
        <Button onClick={handleCreateNewForm}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Create New Form
        </Button>
      </div>
      
      <Tabs defaultValue="all" value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
        <TabsList className="mb-6">
          {categories.map(category => (
            <TabsTrigger key={category} value={category} className="capitalize">
              {category}
            </TabsTrigger>
          ))}
        </TabsList>
        
        <TabsContent value={selectedCategory} className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.length > 0 ? (
              filteredTemplates.map(template => (
                <Card key={template.id} className="flex flex-col">
                  <CardHeader>
                    <CardTitle>{template.name}</CardTitle>
                    <CardDescription>{template.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <div className="text-sm text-muted-foreground">
                      <p><span className="font-semibold">Category:</span> {template.category}</p>
                      <p><span className="font-semibold">Questions:</span> {Array.isArray(template.questions) ? template.questions.length : 0}</p>
                      <p><span className="font-semibold">Public:</span> {template.isPublic ? "Yes" : "No"}</p>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/forms/${template.id}`}>
                          <FileText className="h-4 w-4 mr-1" />
                          View
                        </Link>
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/forms/edit/${template.id}`}>
                          <Edit2 className="h-4 w-4 mr-1" />
                          Edit
                        </Link>
                      </Button>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the form template.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteForm(template.id)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </CardFooter>
                </Card>
              ))
            ) : (
              <div className="col-span-full flex flex-col items-center justify-center h-64 border border-dashed rounded-lg p-6 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold">No form templates found</h3>
                <p className="text-muted-foreground mb-4">
                  {selectedCategory === "all" 
                    ? "You haven't created any form templates yet."
                    : `You don't have any form templates in the "${selectedCategory}" category.`}
                </p>
                <Button onClick={handleCreateNewForm}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create New Form
                </Button>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}