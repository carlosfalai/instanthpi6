import { useState } from "react";
import PendingItemsPanel from "./PendingItemsPanel";
import AiAssistantPanel from "../ai/AiAssistantPanel";
import PatientSearchPanel from "../patients/PatientSearchPanel";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ThreePanelLayoutProps {
  patientId: number;
  patientLanguage: "french" | "english";
  children: React.ReactNode; // This will be the conversation component
  onSendMessage: (message: string) => void;
  onPatientSelect?: (patientId: number) => void;
}

export default function ThreePanelLayout({
  patientId,
  patientLanguage,
  children,
  onSendMessage,
  onPatientSelect
}: ThreePanelLayoutProps) {
  // Default layout proportions
  const [layout, setLayout] = useState([20, 30, 50]); // left, middle, right
  const [showingSearch, setShowingSearch] = useState(false);

  return (
    <div className="h-[calc(100vh-4rem)] bg-[#121212]">
      <ResizablePanelGroup
        direction="horizontal"
        className="min-h-full"
        onLayout={(sizes) => {
          setLayout(sizes);
        }}
      >
        {/* Left Panel - Pending Items */}
        <ResizablePanel 
          defaultSize={layout[0]} 
          minSize={15} 
          maxSize={30} 
          className="bg-[#1a1a1a]"
        >
          <PendingItemsPanel patientId={patientId} />
        </ResizablePanel>
        
        <ResizableHandle withHandle />
        
        {/* Middle Panel - AI Assistant */}
        <ResizablePanel 
          defaultSize={layout[1]} 
          minSize={20} 
          maxSize={40} 
          className="bg-[#1a1a1a]"
        >
          <AiAssistantPanel 
            patientId={patientId} 
            patientLanguage={patientLanguage}
            onSendMessage={onSendMessage}
          />
        </ResizablePanel>
        
        <ResizableHandle withHandle />
        
        {/* Right Panel - Patient Conversation or Search */}
        <ResizablePanel 
          defaultSize={layout[2]} 
          minSize={30} 
          className="bg-[#121212] relative"
        >
          {/* Search toggle button */}
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-4 right-4 z-10 bg-gray-800/70 text-gray-300 hover:text-white"
            onClick={() => setShowingSearch(prev => !prev)}
          >
            <Search className="h-4 w-4 mr-2" />
            {showingSearch ? 'Close Search' : 'Search Patients'}
          </Button>
          
          {/* Show either patient search or conversation */}
          {showingSearch ? (
            <PatientSearchPanel 
              onSelectPatient={(selectedId) => {
                if (onPatientSelect) {
                  onPatientSelect(selectedId);
                }
                setShowingSearch(false);
              }} 
            />
          ) : (
            children
          )}
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}