import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { Loader2 } from 'lucide-react';
import PendingItemsPanel from './PendingItemsPanel';
import AiAssistantPanel from '@/components/ai/AiAssistantPanel';
import PatientSearchPanel from '@/components/patients/PatientSearchPanel';
import SpruceConversation from '@/components/conversation/SpruceConversation';
import NavigationBar from '@/components/navigation/NavigationBar';

// Interfaces
interface Patient {
  id: number;
  name: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  language: 'english' | 'french' | null;
  spruceId: string | null;
}

interface Message {
  id: number;
  patientId: number;
  senderId: number;
  content: string;
  timestamp: string;
  isFromPatient: boolean;
  spruceMessageId: string | null;
}

export default function ThreePanelLayout() {
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  
  // Query for selected patient
  const { 
    data: selectedPatient,
    isLoading: patientLoading
  } = useQuery<Patient>({
    queryKey: [`/api/patients/${selectedPatientId}`],
    enabled: !!selectedPatientId,
  });
  
  // Query for patient messages
  const {
    data: messages = [],
    isLoading: messagesLoading,
  } = useQuery<Message[]>({
    queryKey: [`/api/patients/${selectedPatientId}/messages`],
    enabled: !!selectedPatientId,
  });
  
  // Handler for sending a message
  const handleSendMessage = async (content: string) => {
    if (!selectedPatientId) return;
    
    try {
      await fetch('/api/spruce/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patientId: selectedPatientId,
          message: content,
        }),
      });
      
      // Invalidate messages cache to refresh the conversation
      // This will be handled by react-query
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };
  
  return (
    <div className="h-screen flex flex-col bg-[#121212] text-white">
      {/* Header */}
      <header className="h-14 flex items-center px-4 bg-[#1e1e1e] border-b border-gray-800">
        <h1 className="text-xl font-semibold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">InstantHPI</h1>
        <div className="ml-6 flex-1">
          <NavigationBar />
        </div>
      </header>
      
      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          {/* Left Panel - Pending Items */}
          <ResizablePanel defaultSize={20} minSize={15}>
            <PendingItemsPanel patientId={selectedPatientId || 0} />
          </ResizablePanel>
          
          <ResizableHandle withHandle />
          
          {/* Middle Panel - AI Assistant */}
          <ResizablePanel defaultSize={30} minSize={20}>
            {selectedPatientId ? (
              <AiAssistantPanel 
                patientId={selectedPatientId} 
                language={selectedPatient?.language || 'english'}
                onSendMessage={handleSendMessage}
              />
            ) : (
              <div className="flex flex-col h-full bg-[#121212] text-white items-center justify-center">
                <p className="text-gray-500">Select a patient to view AI suggestions</p>
              </div>
            )}
          </ResizablePanel>
          
          <ResizableHandle withHandle />
          
          {/* Right Panel - Patient Search & Conversation */}
          <ResizablePanel defaultSize={50} minSize={30}>
            <div className="flex flex-col h-full">
              {/* Patient Search */}
              <div className="h-64 border-b border-gray-800">
                <PatientSearchPanel 
                  onSelectPatient={(patient) => setSelectedPatientId(patient.id)}
                  selectedPatientId={selectedPatientId}
                />
              </div>
              
              {/* Conversation Area */}
              <div className="flex-1 overflow-hidden">
                {selectedPatientId ? (
                  messagesLoading ? (
                    <div className="flex h-full items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
                    </div>
                  ) : (
                    <SpruceConversation 
                      messages={messages}
                      onSendMessage={handleSendMessage}
                      patientName={selectedPatient?.name || 'Patient'}
                    />
                  )
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-gray-500">Select a patient to view conversation</p>
                  </div>
                )}
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}