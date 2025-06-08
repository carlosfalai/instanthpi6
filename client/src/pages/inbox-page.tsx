import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, MessageSquare, Clock, User, Send } from 'lucide-react';
import AppLayoutSpruce from '@/components/layout/AppLayoutSpruce';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { GlowingBox, GlowingCard } from '@/components/ui/glowing-box';

interface SpruceConversation {
  id: string;
  entityId: string;
  displayName: string;
  lastActivity: string;
  unreadCount: number;
  lastMessage?: {
    content: string;
    timestamp: string;
    isFromPatient: boolean;
  };
}

export default function InboxPage() {
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch conversations from Spruce API
  const { data: conversations, isLoading, error } = useQuery({
    queryKey: ['/api/spruce/conversations'],
    queryFn: async () => {
      const response = await fetch('/api/spruce/conversations');
      if (!response.ok) {
        throw new Error('Failed to fetch conversations');
      }
      return response.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch messages for selected conversation
  const { data: messages, isLoading: isLoadingMessages } = useQuery({
    queryKey: ['/api/spruce/patients', selectedConversation, 'messages'],
    queryFn: async () => {
      if (!selectedConversation) return [];
      const response = await fetch(`/api/spruce/patients/${selectedConversation}/messages`);
      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }
      const data = await response.json();
      return data.messages || [];
    },
    enabled: !!selectedConversation,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ conversationId, message }: { conversationId: string; message: string }) => {
      const response = await fetch(`/api/spruce/patients/${conversationId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: message }),
      });
      if (!response.ok) {
        throw new Error('Failed to send message');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['/api/spruce/patients', selectedConversation, 'messages'],
      });
      setMessageText('');
      toast({
        title: "Message sent",
        description: "Your message has been sent successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send message",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedConversation) return;
    
    sendMessageMutation.mutate({
      conversationId: selectedConversation,
      message: messageText.trim(),
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffMinutes = Math.ceil(diffTime / (1000 * 60));
    
    if (diffMinutes < 60) {
      return `${diffMinutes}m ago`;
    } else if (diffMinutes < 1440) {
      const hours = Math.floor(diffMinutes / 60);
      return `${hours}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <AppLayoutSpruce>
      <div className="h-screen flex bg-background">
        {/* Conversation List */}
        <div className="w-80 border-r border-border flex flex-col">
          <div className="p-4 border-b border-border">
            <h1 className="text-xl font-semibold text-foreground">Inbox</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {conversations?.length || 0} conversations
            </p>
          </div>

          <ScrollArea className="flex-1">
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : error ? (
              <div className="p-4 text-center">
                <p className="text-sm text-destructive">Failed to load conversations</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                  onClick={() => window.location.reload()}
                >
                  Retry
                </Button>
              </div>
            ) : conversations?.length === 0 ? (
              <div className="p-4 text-center">
                <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No conversations yet</p>
              </div>
            ) : (
              <div className="p-2">
                {conversations?.map((conversation: SpruceConversation) => (
                  <GlowingBox
                    key={conversation.id}
                    color={selectedConversation === conversation.entityId ? "blue" : "white"}
                    className={`p-3 mb-2 cursor-pointer ${
                      selectedConversation === conversation.entityId
                        ? 'border-primary/40 bg-primary/5'
                        : ''
                    }`}
                  >
                    <div onClick={() => setSelectedConversation(conversation.entityId)} className="w-full">
                      <div className="flex items-start space-x-3">
                      <Avatar className="h-10 w-10 flex-shrink-0">
                        <AvatarFallback className="bg-blue-600 text-white">
                          {getInitials(conversation.displayName)}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium text-foreground truncate">
                            {conversation.displayName}
                          </h3>
                          {conversation.unreadCount > 0 && (
                            <Badge variant="destructive" className="ml-2 text-xs">
                              {conversation.unreadCount}
                            </Badge>
                          )}
                        </div>
                        
                        {conversation.lastMessage && (
                          <p className="text-sm text-muted-foreground truncate mt-1">
                            {conversation.lastMessage.content}
                          </p>
                        )}
                        
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-muted-foreground flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {formatTimestamp(conversation.lastActivity)}
                          </span>
                        </div>
                      </div>
                      </div>
                    </div>
                  </GlowingBox>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Message Detail */}
        <div className="flex-1 flex flex-col">
          {!selectedConversation ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  Select a conversation
                </h3>
                <p className="text-sm text-muted-foreground">
                  Choose a conversation from the list to view messages
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Message Header */}
              <GlowingBox color="blue" className="p-4 border-b border-border/50">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-blue-600 text-white">
                      {getInitials(
                        conversations?.find((c: SpruceConversation) => c.entityId === selectedConversation)?.displayName || 'Patient'
                      )}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="font-semibold text-white">
                      {conversations?.find((c: SpruceConversation) => c.entityId === selectedConversation)?.displayName || 'Patient'}
                    </h2>
                    <p className="text-sm text-gray-300">Active conversation</p>
                  </div>
                </div>
              </GlowingBox>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                {isLoadingMessages ? (
                  <div className="flex items-center justify-center h-32">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : messages?.length === 0 ? (
                  <div className="text-center text-muted-foreground">
                    <p>No messages in this conversation yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages?.map((message: any) => (
                      <div
                        key={message.id}
                        className={`flex ${message.isFromPatient ? 'justify-start' : 'justify-end'}`}
                      >
                        <div className={`max-w-[70%] ${message.isFromPatient ? 'order-1' : 'order-2'}`}>
                          <GlowingBox
                            color={message.isFromPatient ? "white" : "blue"}
                            className={`p-3 ${
                              message.isFromPatient
                                ? 'bg-muted/80 text-foreground'
                                : 'bg-primary text-primary-foreground'
                            }`}
                          >
                            <p className="text-sm">{message.content}</p>
                          </GlowingBox>
                          <p className="text-xs text-muted-foreground mt-1 px-1">
                            {formatTimestamp(message.timestamp)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>

              {/* Message Input */}
              <GlowingBox color="blue" className="p-4 border-t border-border/50">
                <form onSubmit={handleSendMessage} className="flex space-x-2">
                  <GlowingBox color="white" className="flex-1">
                    <Input
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      placeholder="Type a message..."
                      className="border-0 bg-transparent focus:ring-0 focus:border-0 text-white placeholder:text-gray-400"
                      disabled={sendMessageMutation.isPending}
                    />
                  </GlowingBox>
                  <GlowingBox color="blue">
                    <Button 
                      type="submit" 
                      disabled={!messageText.trim() || sendMessageMutation.isPending}
                      size="icon"
                      className="border-0 bg-blue-600 hover:bg-blue-700"
                    >
                      {sendMessageMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </GlowingBox>
                </form>
              </GlowingBox>
            </>
          )}
        </div>
      </div>
    </AppLayoutSpruce>
  );
}