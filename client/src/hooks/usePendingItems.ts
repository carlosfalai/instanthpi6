import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { PendingItem, pendingItemsService } from '@/services/pendingItemsService';
import { useToast } from '@/hooks/use-toast';

export const usePendingItems = (patientId: number) => {
  const { toast } = useToast();

  // Fetch pending items
  const {
    data: pendingItems = [],
    isLoading,
    error,
  } = useQuery<PendingItem[]>({
    queryKey: [`/api/patients/${patientId}/pending-items`],
    queryFn: () => pendingItemsService.getPendingItems(patientId),
    enabled: !isNaN(patientId),
  });

  // Mark an item as completed
  const markCompleted = useMutation({
    mutationFn: (itemId: string) => pendingItemsService.markItemCompleted(itemId),
    onSuccess: () => {
      // Invalidate cache to refresh the list
      queryClient.invalidateQueries({ queryKey: [`/api/patients/${patientId}/pending-items`] });
      toast({
        title: "Item Completed",
        description: "The pending item has been marked as completed.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to mark item as completed",
        variant: "destructive",
      });
    },
  });

  // Follow up on a pending item
  const followUp = useMutation({
    mutationFn: (itemId: string) => pendingItemsService.followUpOnItem(patientId, itemId),
    onSuccess: () => {
      toast({
        title: "Follow-up Sent",
        description: "A follow-up message has been sent to the patient.",
      });
      
      // Refresh the messages list
      queryClient.invalidateQueries({ queryKey: [`/api/patients/${patientId}/messages`] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send follow-up message",
        variant: "destructive",
      });
    },
  });

  // Analyze conversations to find pending items
  const analyzeConversations = useMutation({
    mutationFn: (messages: any[]) => pendingItemsService.analyzePendingItems(patientId, messages),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/patients/${patientId}/pending-items`] });
      toast({
        title: "Analysis Complete",
        description: "Patient conversations have been analyzed for pending items.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Analysis Error",
        description: error.message || "Failed to analyze conversations",
        variant: "destructive",
      });
    },
  });

  return {
    pendingItems,
    isLoading,
    error,
    markCompleted: (itemId: string) => markCompleted.mutate(itemId),
    followUp: (itemId: string) => followUp.mutate(itemId),
    analyzeConversations: (messages: any[]) => analyzeConversations.mutate(messages),
    isAnalyzing: analyzeConversations.isPending,
  };
};