import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import ConversationList from "@/components/conversation/ConversationList";
import ConversationDetail from "@/components/conversation/ConversationDetail";
import AiAssistantPanel from "@/components/ai/AiAssistantPanel";
import PendingItemsPanel from "@/components/dashboard/PendingItemsPanel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bell, Search, X, User } from "lucide-react";

interface Message {
  id: string;
  content: string;
  timestamp: Date;
  isFromPatient: boolean;
  isRead: boolean;
}

interface Conversation {
  patientId: number;
  patientName: string;
  avatarUrl: string | null;
  lastMessage: Message;
  hasUnread: boolean;
  isActive: boolean;
}

export default function ThreePanelLayout() {
  // Query to fetch all conversations
  const { data: allConversations = [] } = useQuery<Conversation[]>({
    queryKey: ["/api/conversations"],
  });

  // State for tracking viewed/hidden conversations
  const [activeConversations, setActiveConversations] = useState<Conversation[]>([]);
  const [hiddenConversations, setHiddenConversations] = useState<Conversation[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const [filterValue, setFilterValue] = useState("");
  const [activeTab, setActiveTab] = useState("pending_reply");
  
  // Track if panels are open/collapsed on mobile
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(false);

  // Process conversations when data changes
  useEffect(() => {
    if (allConversations.length) {
      // Set initial active and hidden status
      const active = allConversations.filter(
        (conv) => conv.hasUnread || conv.isActive
      );
      const hidden = allConversations.filter(
        (conv) => !conv.hasUnread && !conv.isActive
      );
      
      setActiveConversations(active);
      setHiddenConversations(hidden);
      
      // Auto-select the first unread conversation if nothing is selected
      if (!selectedPatientId && active.length > 0) {
        const firstUnread = active.find(conv => conv.hasUnread);
        if (firstUnread) {
          setSelectedPatientId(firstUnread.patientId);
        } else if (active.length > 0) {
          setSelectedPatientId(active[0].patientId);
        }
      }
    }
  }, [allConversations, selectedPatientId]);

  // Calculate counts for badge displays
  const pendingReplyCount = activeConversations.filter(conv => conv.hasUnread).length;
  const activeCount = activeConversations.filter(conv => !conv.hasUnread).length;

  // Handle selecting a conversation
  const handleSelectConversation = (patientId: number) => {
    setSelectedPatientId(patientId);
    
    // On mobile, show the right panel when a conversation is selected
    setIsRightPanelOpen(true);
    
    // Mark as read when selected
    setActiveConversations(prev => 
      prev.map(conv => 
        conv.patientId === patientId
          ? { ...conv, hasUnread: false }
          : conv
      )
    );
  };
  
  // Handle hiding a conversation after reply
  const handleReplyComplete = (patientId: number) => {
    // Move from active to hidden
    const conversation = activeConversations.find(conv => conv.patientId === patientId);
    if (conversation) {
      // Remove from active
      setActiveConversations(prev => prev.filter(conv => conv.patientId !== patientId));
      
      // Add to hidden
      setHiddenConversations(prev => [...prev, { ...conversation, isActive: false }]);
      
      // Clear selection
      setSelectedPatientId(null);
      
      // Select next active conversation if available
      if (activeConversations.length > 1) {
        const nextConversation = activeConversations.find(conv => conv.patientId !== patientId);
        if (nextConversation) {
          setSelectedPatientId(nextConversation.patientId);
        }
      }
    }
  };
  
  // Filter conversations based on search input
  const filteredActive = activeConversations.filter(conv => 
    conv.patientName.toLowerCase().includes(filterValue.toLowerCase())
  );
  
  const filteredHidden = hiddenConversations.filter(conv => 
    conv.patientName.toLowerCase().includes(filterValue.toLowerCase())
  );

  // Get conversations based on active tab
  const getDisplayedConversations = () => {
    switch (activeTab) {
      case "pending_reply":
        return filteredActive.filter(conv => conv.hasUnread);
      case "active":
        return filteredActive.filter(conv => !conv.hasUnread);
      case "all":
        return filteredActive;
      case "hidden":
        return filteredHidden;
      default:
        return filteredActive;
    }
  };

  const displayedConversations = getDisplayedConversations();

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col md:flex-row">
      {/* Left Panel (Pending Items) - Hidden on mobile if conversation is selected */}
      <div className={`${selectedPatientId && isRightPanelOpen && !isLeftPanelOpen ? 'hidden' : ''} md:block border-r w-full md:w-1/4 lg:w-1/5 flex-shrink-0 flex flex-col h-full`}>
        {/* Conversation List Header */}
        <div className="p-4 border-b">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-medium">Patient Inbox</h2>
            <Badge className="bg-blue-100 text-blue-700 border-blue-200">
              {pendingReplyCount} pending
            </Badge>
          </div>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search patients..."
              className="pl-8"
              value={filterValue}
              onChange={(e) => setFilterValue(e.target.value)}
            />
            {filterValue && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setFilterValue("")}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        
        {/* Conversation Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="grid grid-cols-4 p-1 m-2 h-9">
            <TabsTrigger value="pending_reply" className="relative text-xs">
              Pending
              {pendingReplyCount > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center bg-red-500 text-white text-xs rounded-full">
                  {pendingReplyCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="active" className="text-xs">Active</TabsTrigger>
            <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
            <TabsTrigger value="hidden" className="text-xs">Hidden</TabsTrigger>
          </TabsList>
          
          <div className="flex-1 overflow-hidden">
            <ConversationList 
              conversations={displayedConversations} 
              selectedPatientId={selectedPatientId}
              onSelectConversation={handleSelectConversation}
              onRestoreConversation={activeTab === "hidden" ? (patientId) => {
                // Move from hidden to active
                const conversation = hiddenConversations.find(conv => conv.patientId === patientId);
                if (conversation) {
                  setHiddenConversations(prev => prev.filter(conv => conv.patientId !== patientId));
                  setActiveConversations(prev => [...prev, { ...conversation, isActive: true }]);
                  setSelectedPatientId(patientId);
                }
              } : undefined}
              showRestore={activeTab === "hidden"}
            />
          </div>
        </Tabs>
      </div>
      
      {/* Middle Panel (AI Assistant) */}
      {selectedPatientId && (
        <div className={`${isRightPanelOpen && !isLeftPanelOpen ? 'hidden' : ''} md:block border-r w-full md:w-1/3 lg:w-2/5 flex-shrink-0 h-full`}>
          <AiAssistantPanel
            patientId={selectedPatientId}
            onTogglePanel={() => {
              // On mobile toggle between right and middle panel
              setIsRightPanelOpen(!isRightPanelOpen);
            }}
          />
        </div>
      )}
      
      {/* Right Panel (Conversation) */}
      {selectedPatientId && (
        <div className={`${!isRightPanelOpen ? 'hidden' : ''} md:block flex-1 h-full`}>
          <ConversationDetail 
            patientId={selectedPatientId}
            onBack={() => {
              // On mobile, go back to conversation list
              setIsLeftPanelOpen(true);
              setIsRightPanelOpen(false);
            }}
            onReplyComplete={() => handleReplyComplete(selectedPatientId)}
            selectedConversation={activeConversations.find(c => c.patientId === selectedPatientId)}
          />
        </div>
      )}
      
      {/* Empty state when no conversation selected */}
      {!selectedPatientId && (
        <div className="hidden md:flex flex-1 items-center justify-center bg-gray-50">
          <div className="text-center p-6 max-w-md">
            <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">No conversation selected</h3>
            <p className="text-gray-500 mb-4">
              Select a patient conversation from the list to view messages and AI suggestions.
            </p>
            {pendingReplyCount > 0 && (
              <Button
                onClick={() => setActiveTab("pending_reply")}
                className="mx-auto"
              >
                View {pendingReplyCount} Pending {pendingReplyCount === 1 ? 'Reply' : 'Replies'}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}