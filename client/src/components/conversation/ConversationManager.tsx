import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, X, User, Bell, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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

export default function ConversationManager() {
  // Query to fetch all conversations
  const { data: allConversations = [] } = useQuery<Conversation[]>({
    queryKey: ["/api/conversations"],
  });

  // State for tracking viewed/hidden conversations
  const [activeConversations, setActiveConversations] = useState<Conversation[]>([]);
  const [hiddenConversations, setHiddenConversations] = useState<Conversation[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const [filterValue, setFilterValue] = useState("");
  const [activeTab, setActiveTab] = useState("new");

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
  const newCount = activeConversations.filter(conv => conv.hasUnread).length;
  const ongoingCount = activeConversations.filter(conv => !conv.hasUnread).length;

  // Handle selecting a conversation
  const handleSelectConversation = (patientId: number) => {
    setSelectedPatientId(patientId);
    
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
  const displayedConversations = activeTab === "new" 
    ? filteredActive.filter(conv => conv.hasUnread)
    : activeTab === "ongoing" 
      ? filteredActive.filter(conv => !conv.hasUnread)
      : activeTab === "all" 
        ? filteredActive
        : filteredHidden;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 h-full gap-0">
      {/* Left Panel - Conversation List */}
      <div className={`${selectedPatientId ? 'hidden lg:block' : ''} col-span-1 h-full border-r`}>
        <Card className="h-full flex flex-col border-0 rounded-none">
          <CardHeader className="px-4 py-3 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-lg font-medium">Patient Conversations</CardTitle>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              {newCount} new
            </Badge>
          </CardHeader>
          <div className="px-4 pb-2">
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
          <CardContent className="px-2 pb-4 pt-0 flex-1 flex flex-col">
            <Tabs 
              defaultValue="new" 
              value={activeTab} 
              onValueChange={setActiveTab}
              className="flex-1 flex flex-col"
            >
              <TabsList className="grid grid-cols-4 mb-2">
                <TabsTrigger value="new" className="relative">
                  New
                  {newCount > 0 && (
                    <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center bg-red-500 text-white text-xs rounded-full">
                      {newCount}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="ongoing" className="relative">
                  Active
                  {ongoingCount > 0 && (
                    <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center bg-blue-500 text-white text-xs rounded-full">
                      {ongoingCount}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="hidden">Hidden</TabsTrigger>
              </TabsList>
              
              <TabsContent value="new" className="flex-1 mt-0 overflow-hidden">
                <ConversationList 
                  conversations={displayedConversations} 
                  selectedPatientId={selectedPatientId}
                  onSelectConversation={handleSelectConversation}
                />
              </TabsContent>
              
              <TabsContent value="ongoing" className="flex-1 mt-0 overflow-hidden">
                <ConversationList 
                  conversations={displayedConversations} 
                  selectedPatientId={selectedPatientId}
                  onSelectConversation={handleSelectConversation}
                />
              </TabsContent>
              
              <TabsContent value="all" className="flex-1 mt-0 overflow-hidden">
                <ConversationList 
                  conversations={displayedConversations} 
                  selectedPatientId={selectedPatientId}
                  onSelectConversation={handleSelectConversation}
                />
              </TabsContent>
              
              <TabsContent value="hidden" className="flex-1 mt-0 overflow-hidden">
                <ConversationList 
                  conversations={displayedConversations} 
                  selectedPatientId={selectedPatientId}
                  onSelectConversation={handleSelectConversation}
                  showRestore
                  onRestoreConversation={(patientId) => {
                    // Move from hidden to active
                    const conversation = hiddenConversations.find(conv => conv.patientId === patientId);
                    if (conversation) {
                      setHiddenConversations(prev => prev.filter(conv => conv.patientId !== patientId));
                      setActiveConversations(prev => [...prev, { ...conversation, isActive: true }]);
                      setSelectedPatientId(patientId);
                    }
                  }}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
      
      {/* Right Panel - Conversation Detail */}
      {selectedPatientId ? (
        <div className="col-span-1 lg:col-span-2 h-full">
          <ConversationDetail 
            patientId={selectedPatientId}
            onBack={() => setSelectedPatientId(null)}
            onReplyComplete={() => handleReplyComplete(selectedPatientId)}
            selectedConversation={activeConversations.find(c => c.patientId === selectedPatientId)}
          />
        </div>
      ) : (
        <div className="hidden lg:flex col-span-2 h-full items-center justify-center border-l">
          <div className="text-center p-6 max-w-md">
            <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">No conversation selected</h3>
            <p className="text-gray-500 mb-4">
              Select a conversation from the list to view messages and reply to patients.
            </p>
            {newCount > 0 && (
              <Button
                onClick={() => setActiveTab("new")}
                className="mx-auto"
              >
                View {newCount} New {newCount === 1 ? 'Message' : 'Messages'}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Component for displaying conversation list
function ConversationList({ 
  conversations, 
  selectedPatientId, 
  onSelectConversation,
  showRestore = false,
  onRestoreConversation
}: { 
  conversations: Conversation[];
  selectedPatientId: number | null;
  onSelectConversation: (patientId: number) => void;
  showRestore?: boolean;
  onRestoreConversation?: (patientId: number) => void;
}) {
  if (conversations.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500 text-sm">
        No conversations to display
      </div>
    );
  }
  
  return (
    <ScrollArea className="h-full">
      <div className="space-y-1 pr-3">
        {conversations.map(conversation => (
          <button
            key={conversation.patientId}
            onClick={() => onSelectConversation(conversation.patientId)}
            className={`w-full flex items-start gap-3 p-3 rounded-md text-left transition-colors
              ${selectedPatientId === conversation.patientId 
                ? 'bg-blue-50 hover:bg-blue-100' 
                : 'hover:bg-gray-100'
              }
              ${conversation.hasUnread ? 'border-l-4 border-blue-500 pl-2' : ''}
            `}
          >
            <Avatar className="h-10 w-10 flex-shrink-0">
              <AvatarImage src={conversation.avatarUrl || ''} />
              <AvatarFallback>
                <User className="h-6 w-6 text-gray-400" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between">
                <p className="font-medium text-sm truncate">
                  {conversation.patientName}
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(conversation.lastMessage.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              <p className="text-xs text-gray-500 truncate">
                {conversation.lastMessage.isFromPatient ? '' : 'You: '}
                {conversation.lastMessage.content}
              </p>
              
              <div className="flex items-center justify-between mt-1">
                {conversation.hasUnread && (
                  <div className="flex items-center text-blue-600">
                    <Bell className="h-3 w-3 mr-1" />
                    <span className="text-xs">New message</span>
                  </div>
                )}
                
                {showRestore && onRestoreConversation && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 ml-auto text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRestoreConversation(conversation.patientId);
                    }}
                  >
                    Restore
                  </Button>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </ScrollArea>
  );
}

// Component for displaying conversation details
function ConversationDetail({ 
  patientId, 
  onBack,
  onReplyComplete,
  selectedConversation
}: {
  patientId: number;
  onBack: () => void;
  onReplyComplete: () => void;
  selectedConversation?: Conversation;
}) {
  const [replyText, setReplyText] = useState("");
  
  // Simulated message data - in real implementation, fetch from API
  const messagesQuery = useQuery({
    queryKey: [`/api/conversations/${patientId}/messages`],
    // Normally would have queryFn, but we're mocking it here
  });
  
  const handleSendReply = () => {
    if (!replyText.trim()) return;
    
    // In a real implementation, would send via API
    // For now, we'll just simulate success
    
    // Clear the reply text
    setReplyText("");
    
    // Show success message
    setTimeout(() => {
      // Call onReplyComplete to hide this conversation
      onReplyComplete();
    }, 500);
  };
  
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between bg-white">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon"
            className="lg:hidden"
            onClick={onBack}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
          <Avatar className="h-10 w-10">
            <AvatarImage src={selectedConversation?.avatarUrl || ''} />
            <AvatarFallback>
              <User className="h-6 w-6 text-gray-400" />
            </AvatarFallback>
          </Avatar>
          
          <div>
            <h3 className="font-medium">{selectedConversation?.patientName || `Patient #${patientId}`}</h3>
            <p className="text-xs text-gray-500">Last message: {selectedConversation?.lastMessage.timestamp ? new Date(selectedConversation.lastMessage.timestamp).toLocaleString() : 'Unknown'}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm"
            className="text-sm flex items-center gap-1"
            onClick={onReplyComplete}
          >
            <CheckCircle2 className="h-4 w-4" />
            Hide after reply
          </Button>
        </div>
      </div>
      
      {/* Message Area */}
      <div className="flex-1 p-4 overflow-auto bg-gray-50">
        <div className="max-w-2xl mx-auto space-y-4">
          {/* This would normally display actual messages */}
          <div className="bg-blue-50 p-3 rounded-lg max-w-[80%] ml-auto">
            <p className="text-sm">Hello, how can I assist you today?</p>
            <p className="text-xs text-right text-gray-500 mt-1">10:30 AM</p>
          </div>
          
          <div className="bg-white p-3 rounded-lg max-w-[80%]">
            <p className="text-sm">I've been experiencing headaches for the past few days. Should I be concerned?</p>
            <p className="text-xs text-gray-500 mt-1">10:32 AM</p>
          </div>
          
          <div className="bg-blue-50 p-3 rounded-lg max-w-[80%] ml-auto">
            <p className="text-sm">I understand your concern. Could you tell me more about the headaches? When do they occur and how severe are they?</p>
            <p className="text-xs text-right text-gray-500 mt-1">10:35 AM</p>
          </div>
        </div>
      </div>
      
      {/* Reply Area */}
      <div className="p-4 border-t bg-white">
        <div className="max-w-2xl mx-auto flex gap-2">
          <Input
            placeholder="Type your reply..."
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            className="flex-1"
          />
          <Button onClick={handleSendReply} disabled={!replyText.trim()}>
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}