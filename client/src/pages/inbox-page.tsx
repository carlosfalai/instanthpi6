import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Loader2, MessageSquare, Clock, User, Send, Settings, ExternalLink } from "lucide-react";
import ModernLayout from "@/components/layout/ModernLayout";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

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
  const [messageText, setMessageText] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch conversations from Spruce API
  const {
    data: conversations,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["/api/spruce/conversations"],
    queryFn: async () => {
      console.log("[Inbox] Fetching conversations from /api/spruce-conversations-all");
      const response = await fetch("/api/spruce-conversations-all");
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("[Inbox] Failed to fetch conversations:", response.status, errorText);
        throw new Error(`Failed to fetch conversations: ${response.status} ${errorText}`);
      }
      
      const data = await response.json();
      console.log(`[Inbox] Received ${data?.length || 0} conversations`);
      
      // Handle error response format
      if (data.error) {
        throw new Error(data.message || data.error);
      }
      
      // Transform Spruce API format to expected format
      if (!Array.isArray(data)) {
        console.error("[Inbox] Expected array but got:", typeof data, data);
        return [];
      }
      
      return data.map((conv: any) => ({
        id: conv.id,
        entityId: conv.id, // Use conversation ID
        displayName: conv.patient_name || conv.title || "Unknown Patient",
        lastActivity: conv.updated_at || conv.lastActivity || conv.createdAt,
        unreadCount: conv.unread_count || 0,
        lastMessage: conv.last_message
          ? {
              content: conv.last_message,
              timestamp: conv.updated_at || conv.lastActivity,
              isFromPatient: true,
            }
          : undefined,
      }));
    },
    refetchInterval: 30000, // Refresh every 30 seconds
    retry: 2, // Retry failed requests
  });

  // Fetch messages for selected conversation
  const { data: messages, isLoading: isLoadingMessages } = useQuery({
    queryKey: ["/api/spruce/conversation", selectedConversation, "messages"],
    queryFn: async () => {
      if (!selectedConversation) return [];
      
      console.log(`[Inbox] Fetching messages for conversation ${selectedConversation}`);
      const response = await fetch(
        `/api/spruce/conversations/${selectedConversation}/history`
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[Inbox] Failed to fetch messages:`, response.status, errorText);
        throw new Error(`Failed to fetch messages: ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`[Inbox] Received ${Array.isArray(data) ? data.length : 0} messages`);
      
      // Handle both array and object with messages property
      if (Array.isArray(data)) {
        return data;
      } else if (data.messages && Array.isArray(data.messages)) {
        return data.messages;
      } else {
        console.warn("[Inbox] Unexpected message format:", data);
        return [];
      }
    },
    enabled: !!selectedConversation,
    retry: 2,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({
      conversationId,
      message,
    }: {
      conversationId: string;
      message: string;
    }) => {
      const response = await fetch(`/api/spruce/patients/${conversationId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: message }),
      });
      if (!response.ok) {
        throw new Error("Failed to send message");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/spruce/patients", selectedConversation, "messages"],
      });
      setMessageText("");
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
      .split(" ")
      .map((part) => part[0])
      .join("")
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
    <ModernLayout title="Inbox" description="Patient messages and notifications">
      <div className="h-screen flex bg-white dark:bg-gray-900">
        {/* Conversation List */}
        <div className="w-80 border-r border-gray-200 dark:border-gray-700 flex flex-col bg-white dark:bg-gray-800">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Inbox</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
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
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-3">
                  <Settings className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-yellow-900 dark:text-yellow-100 mb-1">
                    Spruce API Credentials Required
                  </p>
                  <p className="text-xs text-yellow-700 dark:text-yellow-300 mb-3">
                    {(error as Error).message || "Please configure your Spruce API credentials to access conversations."}
                  </p>
                  <Link href="/doctor-profile">
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-yellow-100 dark:bg-yellow-900/40 border-yellow-300 dark:border-yellow-700 text-yellow-900 dark:text-yellow-100 hover:bg-yellow-200 dark:hover:bg-yellow-900/60"
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Configure API Credentials
                      <ExternalLink className="h-3 w-3 ml-2" />
                    </Button>
                  </Link>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/spruce/conversations"] })}
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
                  <div
                    key={conversation.id}
                    className={`p-3 mb-2 cursor-pointer rounded-lg border transition-all duration-200 ${
                      selectedConversation === conversation.entityId
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg"
                        : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                    }`}
                    onClick={() => setSelectedConversation(conversation.entityId)}
                  >
                    <div className="flex items-start space-x-3">
                      <Avatar className="h-10 w-10 flex-shrink-0">
                        <AvatarFallback className="bg-blue-600 text-white">
                          {getInitials(conversation.displayName)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium text-gray-900 dark:text-white truncate">
                            {conversation.displayName}
                          </h3>
                          {conversation.unreadCount > 0 && (
                            <Badge variant="destructive" className="ml-2 text-xs">
                              {conversation.unreadCount}
                            </Badge>
                          )}
                        </div>

                        {conversation.lastMessage && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-1">
                            {conversation.lastMessage.content}
                          </p>
                        )}

                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {formatTimestamp(conversation.lastActivity)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Message Detail */}
        <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900">
          {!selectedConversation ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Select a conversation
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Choose a conversation from the list to view messages
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Message Header */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-blue-600 text-white">
                      {getInitials(
                        conversations?.find(
                          (c: SpruceConversation) => c.entityId === selectedConversation
                        )?.displayName || "Patient"
                      )}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="font-semibold text-gray-900 dark:text-white">
                      {conversations?.find(
                        (c: SpruceConversation) => c.entityId === selectedConversation
                      )?.displayName || "Patient"}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Active conversation</p>
                  </div>
                </div>
              </div>

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
                        className={`flex ${message.isFromPatient ? "justify-start" : "justify-end"}`}
                      >
                        <div
                          className={`max-w-[70%] ${message.isFromPatient ? "order-1" : "order-2"}`}
                        >
                          <div
                            className={`p-3 rounded-lg ${
                              message.isFromPatient
                                ? "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white"
                                : "bg-blue-600 text-white"
                            }`}
                          >
                            <p className="text-sm">{message.content}</p>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 px-1">
                            {formatTimestamp(message.timestamp)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>

              {/* Message Input */}
              <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <form onSubmit={handleSendMessage} className="flex space-x-2">
                  <Input
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
                    disabled={sendMessageMutation.isPending}
                  />
                  <Button
                    type="submit"
                    disabled={!messageText.trim() || sendMessageMutation.isPending}
                    size="icon"
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {sendMessageMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </ModernLayout>
  );
}
