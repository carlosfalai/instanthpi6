import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Send, Paperclip, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { apiRequest, queryClient } from '@/lib/queryClient';

interface SpruceConversationProps {
  patientId: number;
  doctorName?: string;
}

interface Message {
  id: string;
  patientId: number;
  content: string;
  timestamp: string;
  isFromPatient: boolean;
  sender: string;
  attachmentUrl?: string | null;
}

export default function SpruceConversation({ 
  patientId, 
  doctorName = 'Dr. Font'
}: SpruceConversationProps) {
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Query for messages
  const { 
    data: messages = [], 
    isLoading, 
    error, 
    refetch 
  } = useQuery<Message[]>({
    queryKey: [`/api/patients/${patientId}/messages`],
    enabled: !!patientId,
    refetchInterval: 10000, // Refetch every 10 seconds
  });
  
  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async () => {
      if (!newMessage.trim()) return;
      
      const res = await apiRequest('POST', '/api/spruce/messages', {
        patientId,
        message: newMessage.trim(),
        messageType: 'GENERAL'
      });
      
      return await res.json();
    },
    onSuccess: () => {
      setNewMessage('');
      queryClient.invalidateQueries({ queryKey: [`/api/patients/${patientId}/messages`] });
    },
  });
  
  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  // Format timestamp for display
  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return format(date, 'MMM d, h:mm a');
  };
  
  // Get initials for avatar
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };
  
  return (
    <div className="flex flex-col h-full bg-[#121212] text-white">
      {/* Messages area */}
      <ScrollArea className="flex-1 p-4">
        {isLoading && (
          <div className="flex justify-center items-center h-32">
            <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
          </div>
        )}
        
        {error && (
          <div className="text-red-400 text-center p-4">
            Failed to load messages. Please try again.
          </div>
        )}
        
        {!isLoading && messages.length === 0 && (
          <div className="text-gray-500 text-center p-4">
            No messages yet. Start the conversation!
          </div>
        )}
        
        <div className="space-y-4">
          {messages.map((message) => (
            <div 
              key={message.id} 
              className={`flex ${message.isFromPatient ? 'justify-start' : 'justify-end'}`}
            >
              <div className={`flex ${message.isFromPatient ? 'flex-row' : 'flex-row-reverse'} items-start gap-2 max-w-[80%]`}>
                <Avatar className={`h-8 w-8 ${message.isFromPatient ? 'bg-green-800' : 'bg-blue-800'}`}>
                  <AvatarFallback>
                    {message.isFromPatient ? getInitials(message.sender || 'P') : getInitials(doctorName)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex flex-col">
                  <div className={`px-3 py-2 rounded-lg ${message.isFromPatient ? 'bg-[#1e1e1e]' : 'bg-blue-900'}`}>
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    {message.attachmentUrl && (
                      <div className="mt-2">
                        <a 
                          href={message.attachmentUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs text-blue-400 underline"
                        >
                          View Attachment
                        </a>
                      </div>
                    )}
                  </div>
                  
                  <div className={`text-xs text-gray-500 mt-1 ${message.isFromPatient ? 'text-left' : 'text-right'}`}>
                    {formatMessageTime(message.timestamp)}
                  </div>
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
      
      {/* Message input */}
      <div className="p-3 bg-[#1e1e1e] border-t border-gray-800 flex items-end gap-2">
        <Textarea
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              if (!sendMessageMutation.isPending) {
                sendMessageMutation.mutate();
              }
            }
          }}
          className="resize-none bg-[#262626] border-gray-700 focus:border-blue-500 text-white min-h-[50px]"
          rows={3}
        />
        
        <div className="flex flex-col space-y-2">
          <Button
            variant="ghost"
            size="icon"
            type="button"
            className="rounded-full hover:bg-gray-700"
          >
            <Paperclip className="h-5 w-5" />
          </Button>
          
          <Button
            disabled={sendMessageMutation.isPending || !newMessage.trim()}
            onClick={() => sendMessageMutation.mutate()}
            size="icon"
            className="rounded-full"
          >
            {sendMessageMutation.isPending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}