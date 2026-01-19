import React, { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Search,
  RefreshCw,
  Send,
  Loader2,
  MessageSquare,
  User,
  Clock,
} from "lucide-react";

// Environment check with fallback
const SUPABASE_URL = (import.meta as any).env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL || "", SUPABASE_ANON_KEY || "");

interface Conversation {
  id: string;
  patient_name: string;
  last_message: string;
  updated_at: string;
  unread_count: number;
}

interface Message {
  id: string;
  content: string;
  timestamp: string;
  isFromPatient: boolean;
  sender?: string;
}

export default function DoctorDashboard() {
  // State
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadConversations, 30000);
    return () => clearInterval(interval);
  }, []);

  // Load messages when conversation selected
  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
    }
  }, [selectedConversation]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadConversations = async () => {
    setLoadingConversations(true);
    try {
      const response = await fetch("/api/spruce-conversations-all");
      if (response.ok) {
        const data = await response.json();
        setConversations(data || []);
        console.log(`Loaded ${data?.length || 0} conversations`);
      }
    } catch (error) {
      console.error("Error loading conversations:", error);
    } finally {
      setLoadingConversations(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    setLoadingMessages(true);
    setMessages([]);
    try {
      const response = await fetch(`/api/spruce-conversation-history/history/${conversationId}`);
      if (response.ok) {
        const data = await response.json();
        // Reverse to show oldest first
        const sortedMessages = (data.messages || []).reverse();
        setMessages(sortedMessages);
        console.log(`Loaded ${sortedMessages.length} messages for conversation ${conversationId}`);
      }
    } catch (error) {
      console.error("Error loading messages:", error);
    } finally {
      setLoadingMessages(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    setSending(true);
    try {
      const response = await fetch(`/api/spruce/conversations/${selectedConversation.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newMessage }),
      });

      if (response.ok) {
        // Add message locally
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          content: newMessage,
          timestamp: new Date().toISOString(),
          isFromPatient: false,
          sender: "Dr. Carlos Faviel Font"
        }]);
        setNewMessage("");
        // Refresh messages
        loadMessages(selectedConversation.id);
      }
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setSending(false);
    }
  };

  // Filter conversations by search
  const filteredConversations = conversations.filter(c =>
    c.patient_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.last_message?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: "short" });
    }
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="h-screen flex bg-[#0d0d0d] text-white overflow-hidden">
      {/* Left Panel - Conversation List */}
      <div className="w-80 flex-shrink-0 border-r border-[#222] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-[#222]">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-blue-500" />
              Conversations
            </h1>
            <Button
              variant="ghost"
              size="icon"
              onClick={loadConversations}
              disabled={loadingConversations}
              className="text-gray-400 hover:text-white"
            >
              <RefreshCw className={`w-4 h-4 ${loadingConversations ? "animate-spin" : ""}`} />
            </Button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-[#1a1a1a] border-[#333] text-white placeholder:text-gray-500"
            />
          </div>
        </div>

        {/* Conversation List */}
        <ScrollArea className="flex-1">
          {loadingConversations && conversations.length === 0 ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              {searchQuery ? "No conversations found" : "No conversations yet"}
            </div>
          ) : (
            <div className="divide-y divide-[#222]">
              {filteredConversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => setSelectedConversation(conv)}
                  className={`p-4 cursor-pointer hover:bg-[#1a1a1a] transition-colors ${
                    selectedConversation?.id === conv.id ? "bg-[#1a1a1a] border-l-2 border-blue-500" : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="w-10 h-10 bg-blue-600">
                      <AvatarFallback className="text-white text-sm">
                        {getInitials(conv.patient_name || "U")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-medium truncate">{conv.patient_name || "Unknown"}</span>
                        <span className="text-xs text-gray-500">{formatTime(conv.updated_at)}</span>
                      </div>
                      <p className="text-sm text-gray-400 truncate mt-1">
                        {conv.last_message || "Click to view"}
                      </p>
                    </div>
                    {conv.unread_count > 0 && (
                      <Badge className="bg-blue-600 text-white text-xs">
                        {conv.unread_count}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Stats */}
        <div className="p-4 border-t border-[#222] text-sm text-gray-500">
          {conversations.length} conversations
        </div>
      </div>

      {/* Right Panel - Conversation Detail */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Conversation Header */}
            <div className="p-4 border-b border-[#222] bg-[#1a1a1a]">
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10 bg-blue-600">
                  <AvatarFallback className="text-white">
                    {getInitials(selectedConversation.patient_name || "U")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="font-semibold">{selectedConversation.patient_name || "Unknown Patient"}</h2>
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Last active: {formatTime(selectedConversation.updated_at)}
                  </p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              {loadingMessages ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <MessageSquare className="w-12 h-12 mb-2 opacity-50" />
                  <p>No messages in this conversation</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.isFromPatient ? "justify-start" : "justify-end"}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg p-3 ${
                          msg.isFromPatient
                            ? "bg-[#1a1a1a] text-white"
                            : "bg-blue-600 text-white"
                        }`}
                      >
                        {!msg.isFromPatient && msg.sender && (
                          <p className="text-xs text-blue-200 mb-1">{msg.sender}</p>
                        )}
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                        <p className={`text-xs mt-2 ${msg.isFromPatient ? "text-gray-500" : "text-blue-200"}`}>
                          {new Date(msg.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t border-[#222] bg-[#1a1a1a]">
              <div className="flex gap-2">
                <Textarea
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  className="flex-1 min-h-[80px] max-h-[200px] bg-[#0d0d0d] border-[#333] text-white resize-none"
                />
                <Button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || sending}
                  className="self-end bg-blue-600 hover:bg-blue-700"
                >
                  {sending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-2">Press Ctrl+Enter to send</p>
            </div>
          </>
        ) : (
          /* No Conversation Selected */
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
            <MessageSquare className="w-16 h-16 mb-4 opacity-30" />
            <h2 className="text-xl font-medium mb-2">Select a Conversation</h2>
            <p className="text-sm">Choose a conversation from the left to view messages</p>
          </div>
        )}
      </div>
    </div>
  );
}
