import { useEffect } from 'react';
import { useParams } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import AppLayoutSpruce from '@/components/layout/AppLayoutSpruce';
import LeftPanel from '@/components/consultation/LeftPanel';
import MiddlePanel from '@/components/consultation/MiddlePanel';
import RightPanel from '@/components/consultation/RightPanel';

export default function PatientConsultation() {
  const { id } = useParams<{ id: string }>();
  const patientId = parseInt(id);
  const { toast } = useToast();
  
  // Fetch patient details
  const { data: patient, isLoading: isLoadingPatient } = useQuery({
    queryKey: [`/api/patients/${patientId}`],
    enabled: !isNaN(patientId),
  });
  
  // Fetch patient messages
  const { data: messages, isLoading: isLoadingMessages } = useQuery({
    queryKey: [`/api/patients/${patientId}/messages`],
    enabled: !isNaN(patientId),
  });
  
  // Fetch form submission data
  const { data: formSubmissions } = useQuery({
    queryKey: [`/api/patients/${patientId}/formsubmissions`],
    enabled: !isNaN(patientId),
  });
  
  // Fetch current documentation if it exists
  const { data: documentation } = useQuery({
    queryKey: [`/api/patients/${patientId}/documentation`],
    enabled: !isNaN(patientId),
  });
  
  // Generate documentation mutation
  const generateDocumentation = useMutation({
    mutationFn: async () => {
      // Get the most recent form submission
      const latestSubmission = formSubmissions && formSubmissions.length > 0 
        ? formSubmissions[0] 
        : null;
        
      if (!latestSubmission) {
        throw new Error("No form submissions available");
      }
      
      const response = await fetch('/api/generate-documentation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patientId,
          formData: latestSubmission.formData,
          patientMessages: messages,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to generate documentation");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/patients/${patientId}/documentation`] });
      toast({
        title: "Documentation Generated",
        description: "AI documentation has been generated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to generate documentation",
        variant: "destructive",
      });
    },
  });
  
  // Automatically generate documentation if we have form data but no documentation
  useEffect(() => {
    if (
      !documentation && 
      formSubmissions && 
      formSubmissions.length > 0 && 
      !generateDocumentation.isPending
    ) {
      generateDocumentation.mutate();
    }
  }, [documentation, formSubmissions, generateDocumentation.isPending]);
  
  // Update documentation mutation (for approving sections)
  const updateDocumentation = useMutation({
    mutationFn: async (updates: { id: number, [key: string]: any }) => {
      const { id, ...data } = updates;
      const response = await fetch(`/api/documentation/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update documentation");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/patients/${patientId}/documentation`] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update documentation",
        variant: "destructive",
      });
    },
  });
  
  // Send message mutation
  const sendMessage = useMutation({
    mutationFn: async ({ message, messageType }: { message: string, messageType: string }) => {
      const response = await fetch('/api/spruce/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patientId,
          message,
          messageType,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to send message");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/patients/${patientId}/messages`] });
      toast({
        title: "Message Sent",
        description: "Your message has been sent successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    },
  });
  
  // Send approved documentation sections
  const sendApprovedItems = async () => {
    if (!documentation) return;
    
    try {
      // Mark documentation as approved
      await updateDocumentation.mutateAsync({
        id: documentation.id,
        isApproved: true,
      });
      
      // Send a summary message to the patient
      await sendMessage.mutateAsync({
        message: "I've reviewed your case and prepared a treatment plan. Please see my recommendations and prescription details.",
        messageType: "General Response",
      });
      
      toast({
        title: "Documentation Approved",
        description: "Approved items have been sent to the patient.",
      });
    } catch (error) {
      console.error("Error sending approved items:", error);
    }
  };

  return (
    <AppLayoutSpruce>
      <div className="container py-6">
        <h1 className="text-2xl font-bold mb-6 bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
          Patient Consultation
        </h1>
        
        <div className="w-full">
          {/* Three-panel layout */}
          <div className="flex flex-col lg:flex-row h-[calc(100vh-12rem)]">
            {/* Left Panel: Manual Input */}
            <LeftPanel 
              onSendMessage={(message, messageType) => 
                sendMessage.mutate({ message, messageType })
              }
              isSending={sendMessage.isPending}
            />
            
            {/* Middle Panel: AI Suggestions */}
            <MiddlePanel 
              patient={patient}
              documentation={documentation}
              isLoading={isLoadingPatient || generateDocumentation.isPending}
              onRegenerateDocumentation={() => generateDocumentation.mutate()}
              onUpdateDocumentation={(id, updates) => 
                updateDocumentation.mutate({ id, ...updates })
              }
              onSendApprovedItems={sendApprovedItems}
              isUpdating={updateDocumentation.isPending}
              isSending={sendMessage.isPending}
            />
            
            {/* Right Panel: Patient Messages */}
            <RightPanel 
              messages={messages || []}
              isLoading={isLoadingMessages}
              patient={patient}
            />
          </div>
        </div>
      </div>
    </AppLayoutSpruce>
  );
}
