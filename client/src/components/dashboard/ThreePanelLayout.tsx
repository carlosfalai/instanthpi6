import { useState } from "react";
import PendingItemsPanel from "./PendingItemsPanel";
import AiAssistantPanel from "../ai/AiAssistantPanel";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";

interface ThreePanelLayoutProps {
  patientId: number;
  patientLanguage: "french" | "english";
  children: React.ReactNode; // This will be the conversation component
  onSendMessage: (message: string) => void;
}

export default function ThreePanelLayout({
  patientId,
  patientLanguage,
  children,
  onSendMessage
}: ThreePanelLayoutProps) {
  // Default layout proportions
  const [layout, setLayout] = useState([20, 30, 50]); // left, middle, right

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
        
        {/* Right Panel - Patient Conversation */}
        <ResizablePanel 
          defaultSize={layout[2]} 
          minSize={30} 
          className="bg-[#121212]"
        >
          {children}
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}