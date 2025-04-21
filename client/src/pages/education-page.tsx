import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { queryClient } from "@/lib/queryClient";
import { Book, CheckCircle, Clock, Lock, Video } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface EducationModule {
  id: number;
  title: string;
  description: string;
  type: string;
  content: string;
  featuresUnlocked: string[];
  prerequisiteModules: number[] | null;
  order: number;
  estimatedMinutes: number;
  createdAt: Date;
  updatedAt: Date;
}

interface UserEducationProgress {
  id: number;
  userId: number;
  moduleId: number;
  status: "not_started" | "in_progress" | "completed";
  completedAt: Date | null;
  quizScore: number | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export default function EducationPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("all");
  
  // Get all education modules
  const { data: modules = [], isLoading: modulesLoading } = useQuery<EducationModule[]>({
    queryKey: ["/api/education/modules"],
    queryFn: ({ signal }) => 
      fetch("/api/education/modules", { signal })
        .then(res => {
          if (!res.ok) throw new Error("Failed to fetch education modules");
          return res.json();
        })
        .catch(error => {
          // For now, return mock data for development
          console.error("Error fetching modules:", error);
          return [];
        }),
  });

  // Get user progress
  const { data: progress = [], isLoading: progressLoading } = useQuery<UserEducationProgress[]>({
    queryKey: ["/api/education/progress"],
    queryFn: ({ signal }) =>
      fetch("/api/education/progress", { signal })
        .then(res => {
          if (!res.ok) throw new Error("Failed to fetch education progress");
          return res.json();
        })
        .catch(error => {
          // For now, return mock data for development
          console.error("Error fetching progress:", error);
          return [];
        }),
  });

  // Get unlocked features
  const { data: unlockedFeatures = [], isLoading: featuresLoading } = useQuery<string[]>({
    queryKey: ["/api/education/unlocked-features"],
    queryFn: ({ signal }) =>
      fetch("/api/education/unlocked-features", { signal })
        .then(res => {
          if (!res.ok) throw new Error("Failed to fetch unlocked features");
          return res.json();
        })
        .catch(error => {
          // For now, return mock data for development
          console.error("Error fetching unlocked features:", error);
          return [];
        }),
  });

  // Update progress mutation
  const updateProgressMutation = useMutation({
    mutationFn: async (data: { moduleId: number; status: string }) => {
      const res = await apiRequest("POST", "/api/education/progress", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/education/progress"] });
      queryClient.invalidateQueries({ queryKey: ["/api/education/unlocked-features"] });
      toast({
        title: "Progress updated",
        description: "Your learning progress has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating progress",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Calculate overall progress
  const totalModules = modules.length;
  const completedModules = progress.filter(p => p.status === "completed").length;
  const inProgressModules = progress.filter(p => p.status === "in_progress").length;
  const overallProgressPercent = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;

  const startModule = (moduleId: number) => {
    updateProgressMutation.mutate({ moduleId, status: "in_progress" });
  };

  const completeModule = (moduleId: number) => {
    updateProgressMutation.mutate({ moduleId, status: "completed" });
  };

  // Get module status for display
  const getModuleStatus = (moduleId: number) => {
    const moduleProgress = progress.find(p => p.moduleId === moduleId);
    return moduleProgress?.status || "not_started";
  };

  // Check if a module can be started (prerequisites are completed)
  const canStartModule = (module: EducationModule) => {
    if (!module.prerequisiteModules || module.prerequisiteModules.length === 0) return true;
    
    return module.prerequisiteModules.every(prerequisiteId => {
      const prerequisiteProgress = progress.find(p => p.moduleId === prerequisiteId);
      return prerequisiteProgress?.status === "completed";
    });
  };

  // Filter modules based on active tab
  const filteredModules = modules.filter(module => {
    const status = getModuleStatus(module.id);
    if (activeTab === "all") return true;
    if (activeTab === "in-progress") return status === "in_progress";
    if (activeTab === "completed") return status === "completed";
    if (activeTab === "not-started") return status === "not_started";
    return true;
  });

  // Sort modules by order
  filteredModules.sort((a, b) => a.order - b.order);

  if (modulesLoading || progressLoading || featuresLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-lg">Loading education modules...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl py-8">
      <div className="flex flex-col space-y-8">
        {/* Header and Progress Overview */}
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-500 text-transparent bg-clip-text">
            Learning Center
          </h1>
          <p className="text-muted-foreground text-lg">
            Complete training modules to unlock advanced features of InstantHPI.
          </p>
        </div>

        {/* Progress Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Overall Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col space-y-2">
                <Progress value={overallProgressPercent} className="h-2" />
                <span className="text-2xl font-bold">{overallProgressPercent}%</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Completed</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-2xl font-bold">{completedModules}</span>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>In Progress</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-amber-500" />
              <span className="text-2xl font-bold">{inProgressModules}</span>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Features Unlocked</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-blue-500" />
              <span className="text-2xl font-bold">{unlockedFeatures.length}</span>
            </CardContent>
          </Card>
        </div>

        {/* Modules Tabs and List */}
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="all">All Modules</TabsTrigger>
            <TabsTrigger value="not-started">Not Started</TabsTrigger>
            <TabsTrigger value="in-progress">In Progress</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>
          
          <TabsContent value={activeTab} className="mt-0">
            <div className="flex flex-col space-y-4 max-w-3xl mx-auto">
              {filteredModules.map((module, index) => {
                const status = getModuleStatus(module.id);
                const isLocked = !canStartModule(module);
                
                return (
                  <Card key={module.id} className={isLocked ? "opacity-70" : ""}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <CardTitle className="text-lg flex items-center space-x-2">
                            <div className="bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center mr-2">
                              {module.order}
                            </div>
                            {module.type === "video" && <Video className="h-4 w-4" />}
                            {module.type === "article" && <Book className="h-4 w-4" />}
                            <span>{module.title}</span>
                          </CardTitle>
                          <CardDescription>{module.estimatedMinutes} min</CardDescription>
                        </div>
                        <StatusBadge status={status} />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-2">{module.description}</p>
                      
                      {module.featuresUnlocked.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs font-medium mb-1">Unlocks:</p>
                          <div className="flex flex-wrap gap-1">
                            {module.featuresUnlocked.map(feature => (
                              <Badge key={feature} variant="outline" className="text-xs">
                                {feature}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                    <CardFooter>
                      <div className="w-full">
                        {isLocked ? (
                          <Button disabled variant="outline" className="w-full" size="sm">
                            <Lock className="h-4 w-4 mr-2" />
                            Complete prerequisites first
                          </Button>
                        ) : status === "not_started" ? (
                          <Button 
                            onClick={() => startModule(module.id)} 
                            className="w-full" 
                            size="sm"
                          >
                            Start Module
                          </Button>
                        ) : status === "in_progress" ? (
                          <Button 
                            onClick={() => completeModule(module.id)}
                            className="w-full" 
                            size="sm"
                          >
                            Complete Module
                          </Button>
                        ) : (
                          <Button variant="outline" className="w-full" size="sm">
                            <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                            Completed
                          </Button>
                        )}
                      </div>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>

        {/* Unlocked Features */}
        {unlockedFeatures.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-bold mb-4">Unlocked Features</h2>
            <div className="flex flex-wrap gap-2">
              {unlockedFeatures.map(feature => (
                <Badge key={feature} variant="default">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  {feature}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Component for status badge
function StatusBadge({ status }: { status: string }) {
  if (status === "completed") {
    return <Badge variant="default" className="bg-green-500">Completed</Badge>;
  } else if (status === "in_progress") {
    return <Badge variant="secondary" className="bg-amber-500 text-white">In Progress</Badge>;
  } else {
    return <Badge variant="outline">Not Started</Badge>;
  }
}