import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  Search,
  Loader2,
  User,
  MessageCircle,
  Clock,
  ChevronRight,
  SortDesc,
  Phone,
  Mail,
  FileText,
  Activity,
  Zap,
  ExternalLink,
  Send,
  Bot,
  PanelRightClose,
  PanelRight,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import ModernLayout from "@/components/layout/ModernLayout";
import { useToast } from "@/hooks/use-toast";

interface Conversation {
  id: string;
  patient_name: string;
  last_message: string;
  updated_at: string;
  unread_count: number;
  title?: string;
}

type ViewMode = "all" | "unread" | "recent";
type SortMode = "recent" | "name" | "unread";
type RightPanelMode = "details" | "chat" | "ai";

interface ChatMessage {
  id: string;
  content: string;
  isFromPatient: boolean;
  timestamp: string;
}

export default function CommandCenter() {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("all");
  const [sortMode, setSortMode] = useState<SortMode>("recent");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [rightPanelMode, setRightPanelMode] = useState<RightPanelMode>("details");
  const [messageText, setMessageText] = useState("");
  const [aiPrompt, setAiPrompt] = useState("");
  const [showRightPanel, setShowRightPanel] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all Spruce conversations
  const {
    data: conversations = [],
    isLoading,
    error,
    refetch,
  } = useQuery<Conversation[]>({
    queryKey: ["/api/spruce-conversations-all"],
    queryFn: async () => {
      const response = await fetch("/api/spruce-conversations-all");
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to fetch conversations");
      }
      const data = await response.json();
      if (data.error) throw new Error(data.message || data.error);
      return Array.isArray(data) ? data : [];
    },
    refetchInterval: 60000, // Refresh every minute
  });

  // Fetch conversation messages when selected and in chat mode
  const {
    data: chatMessages = [],
    isLoading: isLoadingMessages,
  } = useQuery<ChatMessage[]>({
    queryKey: ["/api/spruce/conversation", selectedId, "messages"],
    queryFn: async () => {
      if (!selectedId) return [];
      const response = await fetch(`/api/spruce/conversations/${selectedId}/history`);
      if (!response.ok) throw new Error("Failed to fetch messages");
      const data = await response.json();
      if (Array.isArray(data)) return data;
      if (data.messages && Array.isArray(data.messages)) return data.messages;
      return [];
    },
    enabled: !!selectedId && rightPanelMode === "chat",
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ conversationId, message }: { conversationId: string; message: string }) => {
      const response = await fetch(`/api/spruce/patients/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: message }),
      });
      if (!response.ok) throw new Error("Failed to send message");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/spruce/conversation", selectedId, "messages"] });
      setMessageText("");
      toast({ title: "Message sent", description: "Your message has been delivered." });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to send", description: error.message, variant: "destructive" });
    },
  });

  // AI generation mutation
  const aiMutation = useMutation({
    mutationFn: async (prompt: string) => {
      const response = await fetch("/api/ai-generate-section", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          section_name: "Medical Documentation",
          custom_request: prompt,
          patient_data: selectedConversation ? { name: selectedConversation.patient_name, id: selectedConversation.id } : null,
        }),
      });
      if (!response.ok) throw new Error("Failed to generate");
      return response.json();
    },
    onSuccess: (data) => {
      toast({ title: "Generated", description: "AI response ready" });
      setAiPrompt("");
    },
    onError: (error: Error) => {
      toast({ title: "AI Error", description: error.message, variant: "destructive" });
    },
  });

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // Filter and sort conversations
  const filteredConversations = React.useMemo(() => {
    let filtered = [...conversations];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.patient_name?.toLowerCase().includes(query) ||
          c.last_message?.toLowerCase().includes(query)
      );
    }

    // View mode filter
    if (viewMode === "unread") {
      filtered = filtered.filter((c) => c.unread_count > 0);
    } else if (viewMode === "recent") {
      const dayAgo = new Date();
      dayAgo.setDate(dayAgo.getDate() - 1);
      filtered = filtered.filter((c) => new Date(c.updated_at) > dayAgo);
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortMode === "name") {
        return (a.patient_name || "").localeCompare(b.patient_name || "");
      } else if (sortMode === "unread") {
        return (b.unread_count || 0) - (a.unread_count || 0);
      }
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });

    return filtered;
  }, [conversations, searchQuery, viewMode, sortMode]);

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const getInitials = (name: string) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const selectedConversation = conversations.find((c) => c.id === selectedId);

  const totalUnread = conversations.reduce((sum, c) => sum + (c.unread_count || 0), 0);

  return (
    <ModernLayout title="Command Center" description="Unified patient communications">
      <div className="h-[calc(100vh-64px)] flex">
        {/* Left Panel - Conversation List */}
        <div className="w-[420px] border-r border-[#1a1a1a] flex flex-col bg-[#080808]">
          {/* Header Stats */}
          <div className="p-4 border-b border-[#1a1a1a]">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-[#fafafa] tracking-tight" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  COMMAND
                </h1>
                <p className="text-xs text-[#666] uppercase tracking-widest">Patient Communications Hub</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-[#d4af37]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  {conversations.length}
                </div>
                <p className="text-xs text-[#666] uppercase">Total</p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setViewMode("all")}
                className={`p-3 rounded-lg border transition-all ${
                  viewMode === "all"
                    ? "border-[#d4af37] bg-[#d4af37]/10"
                    : "border-[#222] bg-[#111] hover:border-[#333]"
                }`}
              >
                <div className="text-xl font-bold text-[#fafafa]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  {conversations.length}
                </div>
                <div className="text-[10px] text-[#666] uppercase tracking-wider">All</div>
              </button>
              <button
                onClick={() => setViewMode("unread")}
                className={`p-3 rounded-lg border transition-all ${
                  viewMode === "unread"
                    ? "border-[#ef4444] bg-[#ef4444]/10"
                    : "border-[#222] bg-[#111] hover:border-[#333]"
                }`}
              >
                <div className="text-xl font-bold text-[#ef4444]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  {totalUnread}
                </div>
                <div className="text-[10px] text-[#666] uppercase tracking-wider">Unread</div>
              </button>
              <button
                onClick={() => setViewMode("recent")}
                className={`p-3 rounded-lg border transition-all ${
                  viewMode === "recent"
                    ? "border-[#22c55e] bg-[#22c55e]/10"
                    : "border-[#222] bg-[#111] hover:border-[#333]"
                }`}
              >
                <div className="text-xl font-bold text-[#22c55e]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  {conversations.filter((c) => {
                    const dayAgo = new Date();
                    dayAgo.setDate(dayAgo.getDate() - 1);
                    return new Date(c.updated_at) > dayAgo;
                  }).length}
                </div>
                <div className="text-[10px] text-[#666] uppercase tracking-wider">24h</div>
              </button>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="p-3 border-b border-[#1a1a1a]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#444]" />
              <Input
                placeholder="Search patients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-[#111] border-[#222] text-[#fafafa] placeholder:text-[#444] focus:border-[#d4af37] focus:ring-[#d4af37]/20"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              />
            </div>
            <div className="flex gap-2 mt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortMode(sortMode === "recent" ? "name" : sortMode === "name" ? "unread" : "recent")}
                className="flex-1 bg-[#111] border-[#222] text-[#888] hover:bg-[#1a1a1a] hover:text-[#fafafa]"
              >
                <SortDesc className="h-3.5 w-3.5 mr-1.5" />
                {sortMode === "recent" ? "Recent" : sortMode === "name" ? "Name" : "Unread"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                className="bg-[#111] border-[#222] text-[#888] hover:bg-[#1a1a1a] hover:text-[#fafafa]"
              >
                <Activity className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Conversation List */}
          <ScrollArea className="flex-1">
            {isLoading ? (
              <div className="flex items-center justify-center h-48">
                <Loader2 className="h-6 w-6 animate-spin text-[#d4af37]" />
              </div>
            ) : error ? (
              <div className="p-4 text-center">
                <div className="text-[#ef4444] text-sm mb-2">Connection Error</div>
                <p className="text-[#666] text-xs">Configure Spruce API in Settings</p>
                <Link href="/doctor-profile">
                  <Button variant="outline" size="sm" className="mt-3 border-[#333] text-[#888]">
                    <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                    Settings
                  </Button>
                </Link>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-8 text-center">
                <User className="h-8 w-8 mx-auto text-[#333] mb-3" />
                <p className="text-[#666] text-sm">No conversations found</p>
              </div>
            ) : (
              <div className="p-2">
                {filteredConversations.map((conversation, index) => (
                  <button
                    key={conversation.id}
                    onClick={() => setSelectedId(conversation.id)}
                    className={`w-full p-3 mb-1 rounded-lg text-left transition-all group ${
                      selectedId === conversation.id
                        ? "bg-[#d4af37]/10 border border-[#d4af37]/30"
                        : "bg-[#0c0c0c] border border-transparent hover:bg-[#111] hover:border-[#222]"
                    }`}
                    style={{ animationDelay: `${index * 20}ms` }}
                  >
                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      <div
                        className={`h-10 w-10 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${
                          conversation.unread_count > 0
                            ? "bg-[#d4af37] text-[#0a0908]"
                            : "bg-[#1a1a1a] text-[#666]"
                        }`}
                        style={{ fontFamily: "'JetBrains Mono', monospace" }}
                      >
                        {getInitials(conversation.patient_name)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span
                            className={`font-medium truncate ${
                              conversation.unread_count > 0 ? "text-[#fafafa]" : "text-[#aaa]"
                            }`}
                            style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "13px" }}
                          >
                            {conversation.patient_name}
                          </span>
                          <span className="text-[10px] text-[#555] uppercase tracking-wider ml-2 shrink-0">
                            {formatTimestamp(conversation.updated_at)}
                          </span>
                        </div>
                        <p className="text-xs text-[#555] truncate leading-relaxed">
                          {conversation.last_message}
                        </p>
                        {conversation.unread_count > 0 && (
                          <div className="mt-1.5 flex items-center gap-1.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#d4af37] animate-pulse" />
                            <span className="text-[10px] text-[#d4af37] uppercase tracking-wider">
                              {conversation.unread_count} new
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Arrow */}
                      <ChevronRight
                        className={`h-4 w-4 shrink-0 transition-transform ${
                          selectedId === conversation.id
                            ? "text-[#d4af37] translate-x-0"
                            : "text-[#333] -translate-x-1 group-hover:translate-x-0 group-hover:text-[#555]"
                        }`}
                      />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Footer */}
          <div className="p-3 border-t border-[#1a1a1a] bg-[#080808]">
            <div className="flex items-center justify-between text-[10px] text-[#444] uppercase tracking-wider">
              <span>Showing {filteredConversations.length} of {conversations.length}</span>
              <span className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-[#22c55e]" />
                Live
              </span>
            </div>
          </div>
        </div>

        {/* Right Panel - Detail/Chat/AI View */}
        <div className={`flex flex-col bg-[#0a0908] transition-all duration-300 ${showRightPanel ? "flex-1" : "w-0 overflow-hidden"}`}>
          {selectedConversation ? (
            <>
              {/* Selected Patient Header */}
              <div className="p-4 border-b border-[#1a1a1a]">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-[#d4af37] flex items-center justify-center text-lg font-bold text-[#0a0908]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    {getInitials(selectedConversation.patient_name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-bold text-[#fafafa] truncate" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      {selectedConversation.patient_name}
                    </h2>
                    <p className="text-[10px] text-[#666] uppercase tracking-widest">
                      ID: {selectedConversation.id.slice(-8)} • {formatTimestamp(selectedConversation.updated_at)}
                    </p>
                  </div>
                  {/* Mode Toggle Buttons */}
                  <div className="flex gap-1 bg-[#111] rounded-lg p-1 border border-[#222]">
                    <button
                      onClick={() => setRightPanelMode("details")}
                      className={`p-2 rounded-md transition-all ${rightPanelMode === "details" ? "bg-[#d4af37] text-[#0a0908]" : "text-[#666] hover:text-[#fafafa]"}`}
                      title="Patient Details"
                    >
                      <User className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setRightPanelMode("chat")}
                      className={`p-2 rounded-md transition-all ${rightPanelMode === "chat" ? "bg-[#d4af37] text-[#0a0908]" : "text-[#666] hover:text-[#fafafa]"}`}
                      title="Chat"
                    >
                      <MessageCircle className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setRightPanelMode("ai")}
                      className={`p-2 rounded-md transition-all ${rightPanelMode === "ai" ? "bg-[#d4af37] text-[#0a0908]" : "text-[#666] hover:text-[#fafafa]"}`}
                      title="AI Assistant"
                    >
                      <Bot className="h-4 w-4" />
                    </button>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowRightPanel(false)}
                    className="text-[#666] hover:text-[#fafafa]"
                  >
                    <PanelRightClose className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* DETAILS MODE */}
              {rightPanelMode === "details" && (
                <>
                  {/* Quick Actions */}
                  <div className="p-4 border-b border-[#1a1a1a]">
                    <div className="grid grid-cols-4 gap-2">
                      <button
                        onClick={() => setRightPanelMode("chat")}
                        className="p-3 rounded-lg bg-[#111] border border-[#222] hover:border-[#d4af37] transition-all group"
                      >
                        <MessageCircle className="h-5 w-5 mx-auto mb-1.5 text-[#666] group-hover:text-[#d4af37]" />
                        <span className="text-[10px] text-[#888] group-hover:text-[#fafafa] uppercase tracking-wider">Chat</span>
                      </button>
                      <button
                        onClick={() => setRightPanelMode("ai")}
                        className="p-3 rounded-lg bg-[#111] border border-[#222] hover:border-[#d4af37] transition-all group"
                      >
                        <Zap className="h-5 w-5 mx-auto mb-1.5 text-[#666] group-hover:text-[#d4af37]" />
                        <span className="text-[10px] text-[#888] group-hover:text-[#fafafa] uppercase tracking-wider">AI</span>
                      </button>
                      <button className="p-3 rounded-lg bg-[#111] border border-[#222] hover:border-[#333] transition-all group">
                        <FileText className="h-5 w-5 mx-auto mb-1.5 text-[#666] group-hover:text-[#d4af37]" />
                        <span className="text-[10px] text-[#888] group-hover:text-[#fafafa] uppercase tracking-wider">Notes</span>
                      </button>
                      <a
                        href="https://web.sprucehealth.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-3 rounded-lg bg-[#111] border border-[#222] hover:border-[#333] transition-all group text-center"
                      >
                        <ExternalLink className="h-5 w-5 mx-auto mb-1.5 text-[#666] group-hover:text-[#d4af37]" />
                        <span className="text-[10px] text-[#888] group-hover:text-[#fafafa] uppercase tracking-wider">Spruce</span>
                      </a>
                    </div>
                  </div>

                  {/* Conversation Info */}
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                      <div className="p-4 rounded-lg bg-[#111] border border-[#222]">
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="h-4 w-4 text-[#666]" />
                          <span className="text-xs text-[#666] uppercase tracking-wider">Last Activity</span>
                        </div>
                        <p className="text-[#fafafa] text-sm" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                          {new Date(selectedConversation.updated_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="p-4 rounded-lg bg-[#111] border border-[#222]">
                        <div className="flex items-center gap-2 mb-2">
                          <MessageCircle className="h-4 w-4 text-[#666]" />
                          <span className="text-xs text-[#666] uppercase tracking-wider">Last Message</span>
                        </div>
                        <p className="text-[#aaa] text-sm leading-relaxed">
                          {selectedConversation.last_message || "No message preview available"}
                        </p>
                      </div>
                      {selectedConversation.unread_count > 0 && (
                        <div className="p-4 rounded-lg bg-[#d4af37]/10 border border-[#d4af37]/30">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-[#d4af37]" />
                            <span className="text-sm text-[#d4af37] font-medium">
                              {selectedConversation.unread_count} unread message{selectedConversation.unread_count > 1 ? "s" : ""}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </>
              )}

              {/* CHAT MODE */}
              {rightPanelMode === "chat" && (
                <>
                  <ScrollArea className="flex-1 p-4">
                    {isLoadingMessages ? (
                      <div className="flex items-center justify-center h-32">
                        <Loader2 className="h-6 w-6 animate-spin text-[#d4af37]" />
                      </div>
                    ) : chatMessages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center">
                        <MessageCircle className="h-10 w-10 text-[#333] mb-3" />
                        <p className="text-[#666] text-sm">No messages in this conversation</p>
                        <p className="text-[#444] text-xs mt-1">Start typing below to send a message</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {chatMessages.map((message) => (
                          <div
                            key={message.id}
                            className={`flex ${message.isFromPatient ? "justify-start" : "justify-end"}`}
                          >
                            <div
                              className={`max-w-[80%] p-3 rounded-lg ${
                                message.isFromPatient
                                  ? "bg-[#1a1a1a] border border-[#222] text-[#e6e6e6]"
                                  : "bg-[#d4af37] text-[#0a0908]"
                              }`}
                            >
                              <p className="text-sm">{message.content}</p>
                              <p className="text-[10px] mt-1.5 opacity-60">
                                {formatTimestamp(message.timestamp)}
                              </p>
                            </div>
                          </div>
                        ))}
                        <div ref={messagesEndRef} />
                      </div>
                    )}
                  </ScrollArea>
                  <div className="p-3 border-t border-[#1a1a1a]">
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (messageText.trim() && selectedId) {
                          sendMessageMutation.mutate({ conversationId: selectedId, message: messageText.trim() });
                        }
                      }}
                      className="flex gap-2"
                    >
                      <Input
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 bg-[#111] border-[#222] text-[#fafafa] placeholder:text-[#444]"
                        disabled={sendMessageMutation.isPending}
                      />
                      <Button
                        type="submit"
                        disabled={!messageText.trim() || sendMessageMutation.isPending}
                        className="bg-[#d4af37] text-[#0a0908] hover:bg-[#c9a432]"
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

              {/* AI MODE */}
              {rightPanelMode === "ai" && (
                <>
                  {/* AI Quick Actions - Stream Deck Style */}
                  <div className="p-3 border-b border-[#1a1a1a]">
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: "SOAP Note", cmd: "Generate a complete SOAP note", color: "bg-blue-600" },
                        { label: "Assessment", cmd: "Generate clinical assessment", color: "bg-green-600" },
                        { label: "Medications", cmd: "List recommended medications", color: "bg-orange-600" },
                        { label: "Diff Dx", cmd: "Generate differential diagnosis", color: "bg-pink-600" },
                        { label: "Plan", cmd: "Generate treatment plan", color: "bg-purple-600" },
                        { label: "Summarize", cmd: "Summarize key points", color: "bg-amber-600" },
                      ].map((action) => (
                        <button
                          key={action.label}
                          onClick={() => aiMutation.mutate(action.cmd + " for patient " + selectedConversation.patient_name)}
                          disabled={aiMutation.isPending}
                          className={`p-2.5 rounded-lg ${action.color} hover:opacity-90 transition-all disabled:opacity-50 text-white text-[10px] font-bold uppercase tracking-wider shadow-lg hover:shadow-xl transform hover:scale-105`}
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* AI Response Area */}
                  <ScrollArea className="flex-1 p-4">
                    {aiMutation.isPending ? (
                      <div className="flex flex-col items-center justify-center h-32">
                        <Loader2 className="h-6 w-6 animate-spin text-[#d4af37] mb-2" />
                        <p className="text-[#666] text-sm">Generating...</p>
                      </div>
                    ) : aiMutation.data ? (
                      <div className="p-4 rounded-lg bg-[#111] border border-[#222]">
                        <div className="flex items-center gap-2 mb-3">
                          <Sparkles className="h-4 w-4 text-[#d4af37]" />
                          <span className="text-xs text-[#d4af37] uppercase tracking-wider font-bold">AI Generated</span>
                        </div>
                        <p className="text-[#e6e6e6] text-sm whitespace-pre-wrap leading-relaxed">
                          {aiMutation.data.generated_text}
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-center">
                        <Bot className="h-10 w-10 text-[#333] mb-3" />
                        <p className="text-[#666] text-sm">AI Assistant Ready</p>
                        <p className="text-[#444] text-xs mt-1 max-w-[200px]">
                          Click a quick action above or type a custom prompt below
                        </p>
                      </div>
                    )}
                  </ScrollArea>

                  {/* AI Input */}
                  <div className="p-3 border-t border-[#1a1a1a]">
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (aiPrompt.trim()) {
                          aiMutation.mutate(aiPrompt + " for patient " + selectedConversation.patient_name);
                        }
                      }}
                      className="flex gap-2"
                    >
                      <Textarea
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        placeholder="Ask AI anything about this patient..."
                        className="flex-1 bg-[#111] border-[#222] text-[#fafafa] placeholder:text-[#444] resize-none text-sm"
                        rows={2}
                        disabled={aiMutation.isPending}
                      />
                      <Button
                        type="submit"
                        disabled={!aiPrompt.trim() || aiMutation.isPending}
                        className="bg-[#d4af37] text-[#0a0908] hover:bg-[#c9a432] self-end"
                      >
                        {aiMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Sparkles className="h-4 w-4" />
                        )}
                      </Button>
                    </form>
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="h-20 w-20 mx-auto rounded-2xl bg-[#111] border border-[#222] flex items-center justify-center mb-6">
                  <User className="h-10 w-10 text-[#333]" />
                </div>
                <h3 className="text-lg font-bold text-[#fafafa] mb-2" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  SELECT A PATIENT
                </h3>
                <p className="text-[#666] text-sm max-w-xs mx-auto">
                  Choose a conversation from the list to view details, chat, or use AI
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Panel Toggle (when hidden) */}
        {!showRightPanel && selectedConversation && (
          <div className="w-12 border-l border-[#1a1a1a] bg-[#0a0908] flex flex-col items-center py-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowRightPanel(true)}
              className="text-[#666] hover:text-[#fafafa]"
            >
              <PanelRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </ModernLayout>
  );
}
