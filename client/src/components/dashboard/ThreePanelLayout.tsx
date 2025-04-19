import React, { useState, ReactNode } from 'react';
import PendingItemsPanel from './PendingItemsPanel';
import AiAssistantPanel from '../ai/AiAssistantPanel';
import PatientSearchPanel from '../patients/PatientSearchPanel';
import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ThreePanelLayoutProps {
  patientId: number;
  patientLanguage?: string;
  onSendMessage?: (message: string) => void;
  onPatientSelect: (patientId: number) => void;
  children: ReactNode;
}

export default function ThreePanelLayout({
  patientId,
  patientLanguage = 'english',
  onSendMessage,
  onPatientSelect,
  children
}: ThreePanelLayoutProps) {
  const [showSearch, setShowSearch] = useState(false);
  
  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Left Panel - Pending Items */}
      <div className="w-1/4 border-r border-gray-800 overflow-y-auto">
        <PendingItemsPanel patientId={patientId} />
      </div>
      
      {/* Middle Panel - AI Assistant */}
      <div className="w-1/3 border-r border-gray-800 overflow-y-auto">
        <AiAssistantPanel 
          patientId={patientId} 
          patientLanguage={patientLanguage}
          onSendMessage={onSendMessage}
        />
      </div>
      
      {/* Right Panel - Patient Conversation or Search */}
      <div className="flex-1 flex flex-col">
        {/* Search Toggle Button */}
        <div className="absolute top-16 right-4 z-10">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSearch(!showSearch)}
            className="bg-gray-800 text-gray-200 hover:bg-gray-700"
          >
            {showSearch ? <X size={18} /> : <Search size={18} />}
          </Button>
        </div>
        
        {/* Show either Patient Search or Conversation */}
        {showSearch ? (
          <PatientSearchPanel onPatientSelect={(selectedId) => {
            onPatientSelect(selectedId);
            setShowSearch(false);
          }} />
        ) : (
          children
        )}
      </div>
    </div>
  );
}