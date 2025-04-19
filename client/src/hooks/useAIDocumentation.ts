import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { openaiService, AIDocumentation } from '@/services/openaiService';
import { useToast } from '@/hooks/use-toast';

export const useAIDocumentation = (patientId: number) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Query for getting existing documentation
  const { data: documentation, isLoading } = useQuery({
    queryKey: [`/api/patients/${patientId}/documentation`],
    enabled: !isNaN(patientId),
  });
  
  // Mutation for generating documentation
  const generateDocumentation = useMutation({
    mutationFn: async ({ formData, patientMessages }: { 
      formData: Record<string, any>;
      patientMessages?: any[];
    }) => {
      setIsGenerating(true);
      try {
        return await openaiService.generateDocumentation(patientId, formData, patientMessages);
      } finally {
        setIsGenerating(false);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/patients/${patientId}/documentation`] });
      toast({
        title: "Documentation Generated",
        description: "AI documentation has been generated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to generate documentation",
        variant: "destructive",
      });
    },
  });
  
  // Mutation for updating documentation
  const updateDocumentation = useMutation({
    mutationFn: async (updates: Partial<Omit<AIDocumentation, 'id' | 'patientId' | 'createdAt'>>) => {
      if (!documentation) throw new Error("No documentation to update");
      return await openaiService.updateDocumentation(documentation.id, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/patients/${patientId}/documentation`] });
      toast({
        title: "Documentation Updated",
        description: "The documentation has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update documentation",
        variant: "destructive",
      });
    },
  });
  
  return {
    documentation,
    isLoading: isLoading || isGenerating,
    generate: generateDocumentation.mutate,
    update: updateDocumentation.mutate,
    isUpdating: updateDocumentation.isPending,
  };
};
