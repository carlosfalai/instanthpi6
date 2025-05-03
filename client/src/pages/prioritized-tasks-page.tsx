import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, BrainCircuit, CheckCircle, BellRing, AlertTriangle, MessageSquare, ArrowUpCircle, LucideIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { format, formatDistanceToNow } from 'date-fns';
import AppLayoutSpruce from '@/components/layout/AppLayoutSpruce';

// Type for prioritized tasks
interface PrioritizedTask {
  id: string;
  taskType: string;
  title: string;
  description: string;
  priorityScore: number;
  urgency?: string;
  createdAt: string;
  dueDate?: string;
  patientId?: number;
  status?: string;
  reasoning?: string | Record<string, any>;
  suggestedAction?: string;
}

// Type for model info
interface ModelInfo {
  modelExists: boolean;
  modelVersion: number;
  interactionCount: number;
  modelCreatedAt: string | null;
  accuracy: number | null;
  needsMoreData: boolean;
}

const PrioritizedTasksPage: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [sessionId] = useState<string>(() => crypto.randomUUID());
  const [orderInSession, setOrderInSession] = useState<number>(1);

  // Fetch prioritized tasks
  const { data: tasks, isLoading, error } = useQuery<{ tasks: PrioritizedTask[] }>({
    queryKey: ['/api/priority-ai/priority/tasks'],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Fetch model info
  const { data: modelInfo } = useQuery<ModelInfo>({
    queryKey: ['/api/priority-ai/priority/model'],
    staleTime: 1000 * 60 * 15, // 15 minutes
  });

  // Mutation for recording task interactions
  const recordInteractionMutation = useMutation({
    mutationFn: async (data: {
      taskType: string;
      taskId: string;
      action: string;
      orderInSession: number;
      timeSpent?: number;
    }) => {
      const response = await apiRequest(
        'POST',
        '/api/priority-ai/priority/interaction',
        {
          ...data,
          sessionId,
        }
      );
      return response.json();
    },
    onError: (error) => {
      toast({
        title: 'Error recording interaction',
        description: `Something went wrong: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
    },
  });

  // Mutation for training the model manually
  const trainModelMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest(
        'POST',
        '/api/priority-ai/priority/train',
        {}
      );
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Priority model trained',
        description: 'The AI model has been updated based on your task interactions.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/priority-ai/priority/model'] });
    },
    onError: (error) => {
      toast({
        title: 'Error training model',
        description: `Something went wrong: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
    },
  });

  // Record task view when the component loads
  useEffect(() => {
    if (tasks?.tasks && tasks.tasks.length > 0) {
      // Record that user viewed the task list
      recordInteractionMutation.mutate({
        taskType: 'task_list',
        taskId: 'all',
        action: 'viewed',
        orderInSession: 0,
      });
    }
  }, [tasks?.tasks]);

  // Record task interaction (click, complete, etc.)
  const handleTaskAction = (task: PrioritizedTask, action: string) => {
    const startTime = Date.now();
    
    // Record the interaction
    recordInteractionMutation.mutate({
      taskType: task.taskType,
      taskId: task.id,
      action,
      orderInSession: orderInSession,
    });
    
    // Increment order for next action
    setOrderInSession(prev => prev + 1);
    
    // Provide user feedback
    toast({
      title: `Task ${action}`,
      description: `${task.title} has been ${action}`,
    });
    
    // Navigate based on task type
    if (task.patientId && action === 'selected') {
      // Here you could navigate to the appropriate page
      // window.location.href = `/patient/${task.patientId}/treatment`;
    }
  };

  // Get icon for task type
  const getTaskIcon = (taskType: string): LucideIcon => {
    switch (taskType) {
      case 'urgent_care':
        return AlertTriangle;
      case 'message':
        return MessageSquare;
      case 'medication_refill':
        return BellRing;
      case 'pending_item':
        return ArrowUpCircle;
      default:
        return CheckCircle;
    }
  };

  // Get color for priority score
  const getPriorityColor = (score: number): string => {
    if (score >= 80) return 'bg-red-500';
    if (score >= 60) return 'bg-orange-500';
    if (score >= 40) return 'bg-yellow-500';
    return 'bg-blue-500';
  };

  // Loading state
  if (isLoading) {
    return (
      <AppLayoutSpruce>
        <div className="container py-8">
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </AppLayoutSpruce>
    );
  }

  // Error state
  if (error) {
    return (
      <AppLayoutSpruce>
        <div className="container py-8">
          <Card className="border-red-300">
            <CardHeader>
              <CardTitle>Error Loading Tasks</CardTitle>
              <CardDescription>
                Something went wrong while loading your prioritized tasks.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>
                {error instanceof Error ? error.message : 'Unknown error occurred'}
              </p>
              <Button
                className="mt-4"
                onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/priority-ai/priority/tasks'] })}
              >
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      </AppLayoutSpruce>
    );
  }

  return (
    <AppLayoutSpruce>
      <div className="container py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Prioritized Tasks</h1>
            <p className="text-muted-foreground">
              AI-recommended tasks based on your previous work patterns
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            {modelInfo && (
              <div className="flex items-center bg-muted px-3 py-1 rounded-md text-sm">
                <BrainCircuit className="h-4 w-4 mr-2" />
                <div>
                  {modelInfo.modelExists 
                    ? `Model v${modelInfo.modelVersion} trained on ${modelInfo.interactionCount} interactions` 
                    : 'No AI model trained yet'}
                </div>
              </div>
            )}
            
            <Button 
              variant="outline" 
              onClick={() => trainModelMutation.mutate()}
              disabled={trainModelMutation.isPending || (modelInfo?.interactionCount || 0) < 20}
            >
              {trainModelMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Train Model
            </Button>
          </div>
        </div>

        {/* Model training progress card */}
        {modelInfo && modelInfo.interactionCount > 0 && modelInfo.interactionCount < 20 && (
          <Card className="mb-6 bg-muted/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">AI Learning Progress</CardTitle>
              <CardDescription>
                Collecting interaction data to train your personalized priority model
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Interactions recorded: {modelInfo.interactionCount}/20</span>
                  <span>{Math.min(100, Math.round(modelInfo.interactionCount / 20 * 100))}% complete</span>
                </div>
                <Progress value={Math.min(100, Math.round(modelInfo.interactionCount / 20 * 100))} />
              </div>
            </CardContent>
            <CardFooter className="text-sm text-muted-foreground pt-0">
              Continue using the system naturally. The AI will learn from your interactions and build a personalized task priority model.
            </CardFooter>
          </Card>
        )}

        {/* Task list */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Your Tasks</CardTitle>
            <CardDescription>
              Tasks are automatically prioritized based on your work patterns
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Priority</TableHead>
                  <TableHead>Task</TableHead>
                  <TableHead className="w-28">Type</TableHead>
                  <TableHead className="w-28">Created</TableHead>
                  <TableHead className="w-28">Due</TableHead>
                  <TableHead className="w-36 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks?.tasks && tasks.tasks.length > 0 ? (
                  tasks.tasks.map((task) => {
                    const TaskIcon = getTaskIcon(task.taskType);
                    const priorityColor = getPriorityColor(task.priorityScore);
                    
                    return (
                      <TableRow key={`${task.taskType}-${task.id}`}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-8 h-8 rounded-full ${priorityColor} flex items-center justify-center text-white font-medium`}
                            >
                              {Math.round(task.priorityScore)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{task.title}</div>
                          <div className="text-sm text-muted-foreground truncate max-w-lg">
                            {task.description}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="flex items-center gap-1 whitespace-nowrap"
                          >
                            <TaskIcon className="h-3 w-3" />
                            <span>
                              {task.taskType.replace('_', ' ').replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase())}
                            </span>
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {task.createdAt ? formatDistanceToNow(new Date(task.createdAt), { addSuffix: true }) : '-'}
                        </TableCell>
                        <TableCell className="text-sm">
                          {task.dueDate ? format(new Date(task.dueDate), 'MMM d, yyyy') : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleTaskAction(task, 'selected')}
                            >
                              Select
                            </Button>
                            <Button
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleTaskAction(task, 'completed')}
                            >
                              Mark Done
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No prioritized tasks available.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <div className="flex items-center justify-between w-full text-xs text-muted-foreground">
              <span>Tasks are prioritized based on your past interactions and due dates.</span>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/priority-ai/priority/tasks'] })}
              >
                Refresh
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </AppLayoutSpruce>
  );
};

export default PrioritizedTasksPage;