import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Paperclip, Send, User, Check, Image, Smile, ChevronRight, MessageSquare, PlusCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  content: string;
  timestamp: Date;
  isFromPatient: boolean;
  isRead: boolean;
  sender?: string;
  attachmentUrl?: string | null;
}

interface Conversation {
  patientId: number;
  patientName: string;
  initials: string;
  avatarUrl: string | null;
  avatarColor: string;
  lastMessage: Message;
  hasUnread: boolean;
  isActive: boolean;
}

interface ConversationDetailProps {
  patientId: number;
  onBack: () => void;
  onReplyComplete: () => void;
  selectedConversation?: Conversation;
  darkMode?: boolean;
}

export default function ConversationDetail({
  patientId,
  onBack,
  onReplyComplete,
  selectedConversation,
  darkMode = true,
}: ConversationDetailProps) {
  const { toast } = useToast();
  const [replyText, setReplyText] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Colors based on theme
  const bgColor = darkMode ? 'bg-[#1a1a1a]' : 'bg-white';
  const textColor = darkMode ? 'text-white' : 'text-gray-900';
  const secondaryTextColor = darkMode ? 'text-gray-400' : 'text-gray-500';
  const borderColor = darkMode ? 'border-gray-800' : 'border-gray-200';
  const inputBgColor = darkMode ? 'bg-[#2a2a2a]' : 'bg-white';
  const buttonHoverColor = darkMode ? 'hover:bg-[#2a2a2a]' : 'hover:bg-gray-100';
  const messageFromMeBg = darkMode ? 'bg-[#263745]' : 'bg-blue-50';
  const messageFromPatientBg = darkMode ? 'bg-[#2a2a2a]' : 'bg-white';
  
  // Simulated message data - in real implementation, fetch from API
  const { 
    data: messages = [],
    isLoading,
    refetch 
  } = useQuery<Message[]>({
    queryKey: [`/api/conversations/${patientId}/messages`],
    // In a real implementation, you would use a proper queryFn
    queryFn: async () => {
      // This is placeholder mock data
      return [
        {
          id: '1',
          content: 'Hello, how can I assist you today?',
          timestamp: new Date(new Date().getTime() - 3600000),
          isFromPatient: false,
          isRead: true,
          sender: 'Dr. Carlos Faviel Font'
        },
        {
          id: '2',
          content: 'I\'ve been experiencing headaches for the past few days. Should I be concerned?',
          timestamp: new Date(new Date().getTime() - 3400000),
          isFromPatient: true,
          isRead: true
        },
        {
          id: '3',
          content: 'I understand your concern. Could you tell me more about the headaches? When do they occur and how severe are they?',
          timestamp: new Date(new Date().getTime() - 3000000),
          isFromPatient: false,
          isRead: true,
          sender: 'Dr. Carlos Faviel Font'
        },
        {
          id: '4',
          content: 'They usually happen in the afternoon and are quite painful. Sometimes I also feel a bit dizzy.',
          timestamp: new Date(new Date().getTime() - 2800000),
          isFromPatient: true,
          isRead: true
        },
        {
          id: '5',
          content: 'That could be related to several factors including tension, hydration, or vision issues. Let me suggest a few things to try and we may need to run some tests if they persist.',
          timestamp: new Date(new Date().getTime() - 2500000),
          isFromPatient: false,
          isRead: true,
          sender: 'Dr. Carlos Faviel Font'
        }
      ];
    }
  });
  
  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (messageText: string) => {
      // In a real implementation, this would be an API call
      console.log("Sending message:", messageText);
      // Return a simulated response
      return {
        id: Date.now().toString(),
        content: messageText,
        timestamp: new Date(),
        isFromPatient: false,
        isRead: true,
        sender: 'Dr. Carlos Faviel Font'
      };
    },
    onSuccess: (newMessage) => {
      // Update the message list
      queryClient.setQueryData(
        [`/api/conversations/${patientId}/messages`],
        (old: Message[] = []) => [...old, newMessage]
      );
      
      // Clear the input field
      setReplyText("");
      
      // Focus back on the input
      if (inputRef.current) {
        inputRef.current.focus();
      }
      
      // Scroll to bottom
      scrollToBottom();
    },
    onError: (error) => {
      toast({
        title: "Error sending message",
        description: "Your message couldn't be sent. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  // Mark messages as read
  const markAsReadMutation = useMutation({
    mutationFn: async () => {
      // In a real implementation, this would be an API call
      console.log("Marking messages as read for patient:", patientId);
      return true;
    }
  });
  
  // Scroll to bottom of conversation when new messages arrive
  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  };
  
  // Scroll to bottom on load or when messages change
  useEffect(() => {
    if (!isLoading) {
      scrollToBottom();
      
      // Mark messages as read
      if (selectedConversation?.hasUnread) {
        markAsReadMutation.mutate();
      }
    }
  }, [isLoading, messages, patientId]);
  
  // Handle sending a message
  const handleSendMessage = () => {
    if (!replyText.trim()) return;
    sendMessageMutation.mutate(replyText);
  };
  
  // Handle selecting a file
  const handleSelectFile = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    // In a real implementation, you would upload the file and then send a message with the attachment
    toast({
      title: "File selected",
      description: `Selected file: ${files[0].name}`,
    });
  };
  
  // Format date for message groups
  const formatMessageDate = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
    }
  };
  
  // Group messages by date
  const messagesByDate: Record<string, Message[]> = {};
  messages.forEach(message => {
    const dateKey = formatMessageDate(new Date(message.timestamp));
    if (!messagesByDate[dateKey]) {
      messagesByDate[dateKey] = [];
    }
    messagesByDate[dateKey].push(message);
  });
  
  // Dates sorted by newest first
  const datesToShow = Object.keys(messagesByDate);
  
  return (
    <div className={`h-full flex flex-col ${bgColor}`}>
      {/* Header */}
      <div className={`p-3 border-b ${borderColor} flex items-center justify-between ${bgColor}`}>
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon"
            className={`md:hidden ${textColor} ${buttonHoverColor}`}
            onClick={onBack}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
          <Avatar 
            className="h-10 w-10" 
            style={{backgroundColor: selectedConversation?.avatarColor || '#6987bf'}}
          >
            <AvatarImage src={selectedConversation?.avatarUrl || ''} />
            <AvatarFallback className="text-white font-medium">
              {selectedConversation?.initials || (selectedConversation?.patientName.split(' ').map(n => n[0]).join('') || 'U')}
            </AvatarFallback>
          </Avatar>
          
          <div>
            <h3 className={`font-medium ${textColor}`}>
              {selectedConversation?.patientName || `Patient #${patientId}`}
            </h3>
            <p className={`text-xs ${secondaryTextColor}`}>
              Last active: {selectedConversation?.lastMessage.timestamp ? 
                new Date(selectedConversation.lastMessage.timestamp).toLocaleString(undefined, {
                  hour: '2-digit',
                  minute: '2-digit'
                }) : 'Unknown'
              }
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className={`${textColor} ${buttonHoverColor}`}
                >
                  <MessageSquare className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Start a new conversation</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className={`${textColor} ${buttonHoverColor}`}
                  onClick={onReplyComplete}
                >
                  <Check className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Mark as done & hide</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      
      {/* Message Area */}
      <ScrollArea className="flex-1" ref={scrollAreaRef}>
        <div className="p-4 space-y-6">
          {datesToShow.map(date => (
            <div key={date} className="space-y-3">
              <div className="flex justify-center mb-4">
                <Badge 
                  variant="outline" 
                  className={`${darkMode ? 'bg-[#272727] border-[#333333]' : 'bg-gray-100'} ${secondaryTextColor}`}
                >
                  {date}
                </Badge>
              </div>
              
              {messagesByDate[date].map((message, index) => (
                <div
                  key={message.id}
                  className={`flex ${message.isFromPatient ? 'justify-start' : 'justify-end'} mb-2`}
                >
                  {message.isFromPatient && (
                    <Avatar 
                      className="h-8 w-8 mr-2 mt-1 flex-shrink-0" 
                      style={{backgroundColor: selectedConversation?.avatarColor || '#6987bf'}}
                    >
                      <AvatarImage src={selectedConversation?.avatarUrl || ''} />
                      <AvatarFallback className="text-white text-xs font-medium">
                        {selectedConversation?.initials || (selectedConversation?.patientName.split(' ').map(n => n[0]).join('') || 'U')}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  
                  <div className={`max-w-[75%] ${message.isFromPatient ? messageFromPatientBg : messageFromMeBg} p-3 rounded-lg`}>
                    {!message.isFromPatient && message.sender && (
                      <p className={`text-xs ${secondaryTextColor} mb-1`}>{message.sender}</p>
                    )}
                    
                    {message.attachmentUrl && (
                      <div className="mb-2">
                        <img 
                          src={message.attachmentUrl} 
                          alt="Attachment" 
                          className="max-w-full rounded-md"
                        />
                      </div>
                    )}
                    
                    <p className={`text-sm ${textColor}`}>{message.content}</p>
                    
                    <p className={`text-xs ${secondaryTextColor} text-right mt-1`}>
                      {new Date(message.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  
                  {!message.isFromPatient && (
                    <Avatar className="h-8 w-8 ml-2 mt-1 flex-shrink-0 bg-blue-600">
                      <AvatarFallback className="text-white text-xs font-medium">MD</AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </ScrollArea>
      
      {/* Reply Area */}
      <div className={`p-3 ${borderColor} border-t ${bgColor}`}>
        <div className="flex gap-2 items-end">
          <div className="relative flex-1">
            <Input
              ref={inputRef}
              placeholder="Type your message..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              className={`pr-24 ${inputBgColor} border-${borderColor} ${textColor}`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
            <div className="absolute right-2 bottom-0 h-full flex items-center">
              <Button
                variant="ghost"
                size="icon"
                className={`h-8 w-8 ${secondaryTextColor} ${buttonHoverColor}`}
                onClick={handleSelectFile}
              >
                <Paperclip className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={`h-8 w-8 ${secondaryTextColor} ${buttonHoverColor}`}
              >
                <Smile className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <Button
            onClick={handleSendMessage}
            disabled={!replyText.trim() || sendMessageMutation.isPending}
            className={darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-600'}
          >
            {sendMessageMutation.isPending ? (
              <div className="animate-spin h-4 w-4 border-2 border-white border-opacity-20 border-t-white rounded-full" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleFileUpload}
        />
      </div>
    </div>
  );
}