import React, { useState, ReactNode } from 'react';
import { 
  ResizableHandle, 
  ResizablePanel, 
  ResizablePanelGroup 
} from '@/components/ui/resizable';
import { Button } from '@/components/ui/button';
import { Search, Menu, X } from 'lucide-react';
import AiAssistantPanel from '@/components/ai/AiAssistantPanel';
import PendingItemsPanel from '@/components/dashboard/PendingItemsPanel';
import PatientSearchPanel from '@/components/patients/PatientSearchPanel';

export interface ThreePanelLayoutProps {
  children: ReactNode;
  patientId: number;
  patientLanguage: 'english' | 'french';
  onSendMessage: (content: string) => void;
  onPatientSelect: (patientId: number) => void;
}

export default function ThreePanelLayout({
  children,
  patientId,
  patientLanguage,
  onSendMessage,
  onPatientSelect
}: ThreePanelLayoutProps) {
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  
  const toggleLeftPanel = () => {
    setLeftPanelOpen(!leftPanelOpen);
  };
  
  const toggleRightPanel = () => {
    setRightPanelOpen(!rightPanelOpen);
  };
  
  return (
    <div className="h-screen flex flex-col bg-[#121212] text-white">
      {/* Header */}
      <header className="h-14 border-b border-gray-800 bg-[#1e1e1e] flex items-center justify-between px-4">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleLeftPanel}
            className="mr-2"
          >
            {leftPanelOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          <h1 className="text-lg font-semibold">Telemedicine Platform</h1>
        </div>
        
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={toggleRightPanel}
        >
          {rightPanelOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
        </Button>
      </header>
      
      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup 
          direction="horizontal" 
          className="h-full"
        >
          {/* Left Panel - Pending Items */}
          {leftPanelOpen && (
            <>
              <ResizablePanel 
                defaultSize={20} 
                minSize={15}
                maxSize={30}
                className="bg-[#121212]"
              >
                <PendingItemsPanel patientId={patientId} />
              </ResizablePanel>
              <ResizableHandle withHandle />
            </>
          )}
          
          {/* Middle Panel - Main Content */}
          <ResizablePanel defaultSize={leftPanelOpen ? (rightPanelOpen ? 50 : 80) : (rightPanelOpen ? 70 : 100)}>
            <ResizablePanelGroup direction="vertical">
              {/* Conversation Area */}
              <ResizablePanel defaultSize={65}>
                {children}
              </ResizablePanel>
              
              <ResizableHandle withHandle />
              
              {/* AI Assistant Area */}
              <ResizablePanel defaultSize={35}>
                <AiAssistantPanel 
                  patientId={patientId}
                  language={patientLanguage}
                  onSendMessage={onSendMessage}
                />
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
          
          {/* Right Panel - Patient Search */}
          {rightPanelOpen && (
            <>
              <ResizableHandle withHandle />
              <ResizablePanel 
                defaultSize={25} 
                minSize={20}
                maxSize={40}
              >
                <PatientSearchPanel onPatientSelect={onPatientSelect} />
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
      </div>
    </div>
  );
}