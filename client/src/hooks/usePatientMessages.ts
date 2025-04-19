import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { spruceApi, SpruceMessage } from '@/services/spruceApi';
import { useToast } from '@/hooks/use-toast';

export const usePatientMessages = (patientId: number) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Query for fetching patient messages
  const { data: messages, isLoading } = useQuery({
    queryKey: [`/api/patients/${patientId}/messages`],
    enabled: !isNaN(patientId),
  });
  
  // Mutation for sending a new message
  const sendMessage = useMutation({
    mutationFn: async ({ content, messageType }: { content: string; messageType: string }) => {
      return await spruceApi.sendMessage(patientId, content, messageType);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/patients/${patientId}/messages`] });
      toast({
        title: "Message Sent",
        description: "Your message has been sent successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    },
  });
  
  return {
    messages,
    isLoading,
    sendMessage: sendMessage.mutate,
    isSending: sendMessage.isPending,
  };
};
