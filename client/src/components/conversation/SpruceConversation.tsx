import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { SendHorizontal, Loader2, Paperclip, Image } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface Message {
  id: number;
  patientId: number;
  senderId: number;
  content: string;
  timestamp: string;
  isFromPatient: boolean;
  spruceMessageId: string | null;
}

interface SpruceConversationProps {
  patientId: number;
  doctorName: string;
  messages?: Message[];
  onSendMessage?: (content: string) => void;
  patientName?: string;
}

export default function SpruceConversation({
  patientId,
  doctorName,
  messages = [],
  onSendMessage = () => {},
  patientName = "Patient"
}: SpruceConversationProps) {
  const [newMessage, setNewMessage] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  
  // Fetch messages from API if not provided
  const { data: fetchedMessages } = useQuery({
    queryKey: [`/api/messages/${patientId}`],
    enabled: (!messages || !Array.isArray(messages) || messages.length === 0) && !!patientId,
  });
  
  // Use provided messages or fetched messages
  const displayMessages: Message[] = messages && Array.isArray(messages) && messages.length > 0 
    ? messages 
    : (Array.isArray(fetchedMessages) ? fetchedMessages : []);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [displayMessages]);
  
  // Format timestamp for display
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      onSendMessage(content);
      return content;
    },
    onSuccess: () => {
      // Clear input after sending
      setNewMessage('');
      
      // Invalidate messages cache to show the new message
      // This will be handled by the parent component and react-query
    }
  });
  
  // Handle message submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim()) return;
    
    sendMessageMutation.mutate(newMessage.trim());
  };
  
  // Handle textarea key press (Ctrl+Enter to submit)
  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit(e);
    }
  };
  
  return (
    <div className="flex flex-col h-full bg-[#121212] text-white">
      <div className="p-4 bg-[#1e1e1e] border-b border-gray-800">
        <h2 className="font-semibold">{patientName}</h2>
      </div>
      
      {/* Messages Area */}
      <ScrollArea 
        className="flex-1 p-4"
        ref={scrollAreaRef as any}
      >
        <div className="space-y-4">
          {displayMessages.length === 0 ? (
            <div className="text-center text-gray-500">
              No messages yet. Start the conversation!
            </div>
          ) : (
            displayMessages.map((message) => (
              <div 
                key={message.id}
                className={`flex ${message.isFromPatient ? 'justify-start' : 'justify-end'}`}
              >
                <div 
                  className={`max-w-[75%] rounded-lg p-3 ${
                    message.isFromPatient 
                      ? 'bg-[#1e1e1e] text-white' 
                      : 'bg-blue-600 text-white'
                  }`}
                >
                  <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                  <div className={`text-xs mt-1 ${message.isFromPatient ? 'text-gray-400' : 'text-blue-200'}`}>
                    {formatTimestamp(message.timestamp)}
                  </div>
                </div>
              </div>
            ))
          )}
          
          {sendMessageMutation.isPending && (
            <div className="flex justify-end">
              <div className="bg-[#1e1e1e] rounded-lg p-3 max-w-[75%]">
                <div className="flex items-center">
                  <Loader2 className="h-4 w-4 animate-spin text-gray-400 mr-2" />
                  <span className="text-sm text-gray-400">Sending...</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
      
      {/* Message Input */}
      <div className="p-3 bg-[#1e1e1e] border-t border-gray-800">
        <form onSubmit={handleSubmit} className="flex items-end gap-2">
          <div className="flex-1 relative">
            <Textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Type your message..."
              className="min-h-[80px] resize-none bg-[#262626] border-gray-700 text-white pr-8"
            />
            <div className="absolute bottom-2 right-2">
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-6 w-6 rounded-full text-gray-400 hover:text-white"
              >
                <Paperclip className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <Button 
            type="submit"
            size="icon"
            disabled={!newMessage.trim() || sendMessageMutation.isPending}
            className="h-10 w-10"
          >
            {sendMessageMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <SendHorizontal className="h-4 w-4" />
            )}
          </Button>
        </form>
        
        <div className="text-xs text-gray-500 mt-1">
          Press Ctrl+Enter to send
        </div>
      </div>
    </div>
  );
}