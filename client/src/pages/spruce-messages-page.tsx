import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import AppLayout from "@/components/layout/AppLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, Send, Loader2, MessageCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SpruceConversation {
  id: string;
  patientName: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

interface SpruceMessage {
  id: string;
  content: string;
  timestamp: string;
  isFromPatient: boolean;
  senderName: string;
}

export default function SpruceMessagesPage() {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [messageText, setMessageText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const previousMessageCount = useRef<number>(0);
  const { toast } = useToast();

  // Fetch conversations from Spruce API
  const { data: conversations = [], isLoading: conversationsLoading } = useQuery<
    SpruceConversation[]
  >({
    queryKey: ["/api/spruce/conversations"],
    refetchInterval: 5000, // Refresh every 5 seconds for real-time updates
    refetchIntervalInBackground: true,
  });

  // Fetch messages for selected conversation
  const {
    data: messages = [],
    isLoading: messagesLoading,
    refetch: refetchMessages,
  } = useQuery<SpruceMessage[]>({
    queryKey: [`/api/spruce/conversations/${selectedConversationId}`],
    enabled: !!selectedConversationId,
    refetchInterval: 3000, // Refresh every 3 seconds for real-time updates
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
  });

  // Filter conversations based on search
  const filteredConversations = searchTerm
    ? conversations.filter((conv) =>
        conv.patientName.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : conversations;

  // Auto-scroll to bottom when new messages arrive and play notification sound
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

    // Check for new messages and play notification sound
    if (messages.length > previousMessageCount.current && previousMessageCount.current > 0) {
      const newMessageCount = messages.length - previousMessageCount.current;
      const latestMessage = messages[messages.length - 1];

      // Only notify for messages from patients
      if (latestMessage?.isFromPatient) {
        // Play notification sound
        const audio = new Audio("/notification.mp3");
        audio.play().catch((e) => console.log("Could not play notification sound:", e));

        // Show toast notification
        toast({
          title: "New message",
          description: `${latestMessage.senderName}: ${latestMessage.content.substring(0, 50)}${latestMessage.content.length > 50 ? "..." : ""}`,
        });

        // Browser notification if permission granted
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification("New Spruce Message", {
            body: `${latestMessage.senderName}: ${latestMessage.content}`,
            icon: "/icon.png",
          });
        }
      }
    }

    previousMessageCount.current = messages.length;
  }, [messages, toast]);

  // Request notification permission on mount
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // Handle sending a message
  const handleSendMessage = async () => {
    if (!selectedConversationId || !messageText.trim()) return;

    try {
      const response = await fetch("/api/spruce/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          conversationId: selectedConversationId,
          message: messageText,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      setMessageText("");
      refetchMessages();

      toast({
        title: "Message sent",
        description: "Your message has been sent successfully.",
      });
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Failed to send message",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Format timestamp
  const formatTime = (timestamp: string) => {
    try {
      return format(new Date(timestamp), "h:mm a");
    } catch {
      return "";
    }
  };

  // Format date for conversation list
  const formatConversationTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      const today = new Date();

      if (date.toDateString() === today.toDateString()) {
        return format(date, "h:mm a");
      }

      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      if (date.toDateString() === yesterday.toDateString()) {
        return "Yesterday";
      }

      return format(date, "MMM d");
    } catch {
      return "";
    }
  };

  // Get initials from name
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Group messages by date
  const messagesByDate: Record<string, SpruceMessage[]> = {};
  messages.forEach((message) => {
    const date = new Date(message.timestamp);
    const dateKey = format(date, "MMMM d, yyyy");
    if (!messagesByDate[dateKey]) {
      messagesByDate[dateKey] = [];
    }
    messagesByDate[dateKey].push(message);
  });

  const selectedConversation = conversations.find((c) => c.id === selectedConversationId);

  return (
    <AppLayout>
      <div className="flex h-full bg-gray-950">
        {/* Left sidebar - Conversation list */}
        <div className="w-80 border-r border-gray-800 h-full flex flex-col bg-gray-900">
          <div className="p-4 border-b border-gray-800">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-gray-800 border-gray-700 text-gray-100"
              />
            </div>
          </div>

          <ScrollArea className="flex-1">
            {conversationsLoading ? (
              <div className="flex justify-center items-center h-32">
                <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
              </div>
            ) : filteredConversations.length > 0 ? (
              <div>
                {filteredConversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    onClick={() => setSelectedConversationId(conversation.id)}
                    className={`flex items-center p-3 hover:bg-gray-800 cursor-pointer transition-colors ${
                      selectedConversationId === conversation.id ? "bg-gray-800" : ""
                    }`}
                  >
                    <Avatar className="h-10 w-10 mr-3">
                      <AvatarFallback className="bg-blue-600 text-white">
                        {getInitials(conversation.patientName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline">
                        <p className="font-medium text-gray-100 truncate">
                          {conversation.patientName}
                        </p>
                        <span className="text-xs text-gray-400 ml-2">
                          {formatConversationTime(conversation.lastMessageTime)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-400 truncate">{conversation.lastMessage}</p>
                    </div>
                    {conversation.unreadCount > 0 && (
                      <div className="ml-2 bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {conversation.unreadCount}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-32 text-gray-400">
                <MessageCircle className="h-8 w-8 mb-2" />
                <p>No conversations found</p>
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Right side - Message area */}
        <div className="flex-1 flex flex-col">
          {selectedConversationId && selectedConversation ? (
            <>
              {/* Header */}
              <div className="p-4 border-b border-gray-800 bg-gray-900">
                <div className="flex items-center">
                  <Avatar className="h-10 w-10 mr-3">
                    <AvatarFallback className="bg-blue-600 text-white">
                      {getInitials(selectedConversation.patientName)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="font-semibold text-gray-100">
                      {selectedConversation.patientName}
                    </h2>
                    <p className="text-sm text-gray-400">Active conversation</p>
                  </div>
                </div>
              </div>

              {/* Messages area */}
              <ScrollArea className="flex-1 p-4">
                {messagesLoading ? (
                  <div className="flex justify-center items-center h-32">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                  </div>
                ) : messages.length > 0 ? (
                  <div className="space-y-6">
                    {Object.entries(messagesByDate).map(([date, dateMessages]) => (
                      <div key={date}>
                        <div className="flex justify-center mb-4">
                          <span className="text-xs bg-gray-800 text-gray-400 px-3 py-1 rounded-full">
                            {date}
                          </span>
                        </div>
                        <div className="space-y-3">
                          {dateMessages.map((message) => (
                            <div
                              key={message.id}
                              className={`flex ${message.isFromPatient ? "justify-start" : "justify-end"}`}
                            >
                              <div
                                className={`max-w-[70%] rounded-lg p-3 ${
                                  message.isFromPatient
                                    ? "bg-gray-800 text-gray-100"
                                    : "bg-blue-600 text-white"
                                }`}
                              >
                                {message.isFromPatient && (
                                  <p className="text-xs opacity-70 mb-1">{message.senderName}</p>
                                )}
                                <p className="whitespace-pre-wrap">{message.content}</p>
                                <p className="text-xs opacity-70 mt-1 text-right">
                                  {formatTime(message.timestamp)}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <MessageCircle className="h-12 w-12 mb-3" />
                    <p>No messages yet</p>
                    <p className="text-sm">Start the conversation by sending a message</p>
                  </div>
                )}
              </ScrollArea>

              {/* Message input */}
              <div className="p-4 border-t border-gray-800 bg-gray-900">
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="Type a message..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    className="flex-1 bg-gray-800 border-gray-700 text-gray-100"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!messageText.trim()}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <MessageCircle className="h-16 w-16 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Select a conversation</h3>
                <p className="text-sm">Choose a conversation from the list to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
