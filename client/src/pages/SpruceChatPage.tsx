import React from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";

import ModernLayout from "@/components/layout/ModernLayout";
import SpruceConversation from "@/components/conversation/SpruceConversation";

// Use ModernLayout as AppLayoutSpruce
const AppLayoutSpruce = ({ children }: { children: React.ReactNode }) => (
  <ModernLayout title="Spruce Chat" description="Patient messaging">
    {children}
  </ModernLayout>
);

export default function SpruceChatPage() {
  const [, setLocation] = useLocation();
  const params = useParams<{ patientId: string }>();
  const patientId = params?.patientId ? parseInt(params.patientId) : undefined;

  // Fetch patient data
  const {
    data: patient,
    isLoading,
    error,
  } = useQuery({
    queryKey: [`/api/patients/${patientId}`],
    queryFn: getQueryFn(),
    enabled: !!patientId,
  });

  // Handle patient selection
  const handlePatientSelect = (selectedId: number) => {
    setLocation(`/patients/${selectedId}`);
  };

  // Handle sending a message
  const handleSendMessage = (message: string) => {
    // This is handled by the SpruceConversation component directly
    console.log("Message sent:", message);
  };

  // If no patient is selected, show a placeholder
  if (!patientId) {
    return (
      <AppLayoutSpruce>
        <div className="flex items-center justify-center min-h-[60vh] bg-[#121212] text-white">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-3">Select a Patient</h2>
            <p className="text-gray-400 max-w-md">
              Use the search button in the top right to find and select a patient to begin.
            </p>
          </div>
        </div>
      </AppLayoutSpruce>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <AppLayoutSpruce>
        <div className="flex items-center justify-center min-h-[60vh] bg-[#121212] text-white">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      </AppLayoutSpruce>
    );
  }

  // Error state
  if (error || !patient) {
    return (
      <AppLayoutSpruce>
        <div className="flex items-center justify-center min-h-[60vh] bg-[#121212] text-white">
          <div className="text-center text-red-400">
            <h2 className="text-xl font-semibold mb-3">Error Loading Patient</h2>
            <p className="max-w-md">
              Failed to load patient data. Please try again or select a different patient.
            </p>
            <button
              className="mt-4 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-md"
              onClick={() => setLocation("/")}
            >
              Go Back
            </button>
          </div>
        </div>
      </AppLayoutSpruce>
    );
  }

  return (
    <AppLayoutSpruce>
      <SpruceConversation patientId={patientId} doctorName="Dr. Font" />
    </AppLayoutSpruce>
  );
}
