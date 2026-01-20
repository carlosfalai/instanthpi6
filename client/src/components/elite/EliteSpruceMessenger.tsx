import React, { useState, useEffect, useRef } from "react";
import { EliteCard } from "./EliteCard";
import { EliteButton } from "./EliteButton";
import { EliteInput } from "./EliteInput";
import { X, Send, Search, MessageSquare, User, Loader2, Undo2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface SpruceConversation {
  id: string;
  patient_name: string;
  last_message: string;
  updated_at: string;
  unread_count?: number;
}

interface QueuedMessage {
  id: string;
  conversationId: string;
  content: string;
  patientName: string;
  sendAt: number; // Timestamp when it will be sent
}

interface EliteSpruceMessengerProps {
  isOpen: boolean;
  onClose: () => void;
  initialDraft?: string; // Content pre-filled from AI
  recipientName?: string;
}

export function EliteSpruceMessenger({
  isOpen,
  onClose,
  initialDraft = "",
  recipientName,
}: EliteSpruceMessengerProps) {
  const [conversations, setConversations] = useState<SpruceConversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeConversation, setActiveConversation] = useState<SpruceConversation | null>(null);
  const [messageDraft, setMessageDraft] = useState(initialDraft);
  const [queuedMessages, setQueuedMessages] = useState<QueuedMessage[]>([]);
  const [activeMessages, setActiveMessages] = useState<any[]>([]);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (isOpen) {
      loadConversations();
      if (initialDraft) setMessageDraft(initialDraft);
    }
  }, [isOpen, initialDraft]);

  // Timer for queue updates
  useEffect(() => {
    const interval = setInterval(() => {
      const currentTime = Date.now();
      setNow(currentTime);

      // Check for messages that are due to send
      setQueuedMessages((currentQueue) => {
        const remaining = [];
        const toSend = [];

        for (const msg of currentQueue) {
          if (msg.sendAt <= currentTime) {
            toSend.push(msg);
          } else {
            remaining.push(msg);
          }
        }

        // "Send" the messages (mock API call)
        toSend.forEach((msg) => {
          console.log(`[AUTO-SEND] Sending message to ${msg.patientName}: ${msg.content}`);
          // simulate sending...
        });

        return remaining;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const loadConversations = async () => {
    setLoading(true);
    try {
      // In a real implementation this would fetch from the API
      const response = await fetch("/api/spruce-conversations-all");
      if (response.ok) {
        const data = await response.json();
        setConversations(data || []);
      } else {
        // Fallback mock data
        setConversations([
          {
            id: "1",
            patient_name: "Jean Tremblay",
            last_message: "Merci docteur",
            updated_at: new Date().toISOString(),
          },
          {
            id: "2",
            patient_name: "Marie Curie",
            last_message: "Quand est le RDV?",
            updated_at: new Date().toISOString(),
          },
        ]);
      }
    } catch (error) {
      console.error("Error loading Spruce threads", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (id: string) => {
    try {
      const response = await fetch(`/api/spruce/conversation/history/${id}`);
      if (response.ok) {
        const data = await response.json();
        // If the response is an array, it's our direct messages
        // If it's an object with messages property, handle that too
        const msgs = Array.isArray(data) ? data : data.messages || [];
        setActiveMessages(msgs);
      }
    } catch (error) {
      console.error("Error loading messages", error);
    }
  };

  useEffect(() => {
    if (activeConversation) {
      fetchMessages(activeConversation.id);
    } else {
      setActiveMessages([]);
    }
  }, [activeConversation]);

  const handleQueueSend = () => {
    if (!activeConversation) return;

    const newMsg: QueuedMessage = {
      id: Math.random().toString(36).substr(2, 9),
      conversationId: activeConversation.id,
      patientName: activeConversation.patient_name,
      content: messageDraft,
      sendAt: Date.now() + 30000, // 30 seconds from now
    };

    setQueuedMessages((prev) => [...prev, newMsg]);
    setMessageDraft(""); // Clear draft immediately
    // onClose(); // Optional: Close modal or keep open? User might want to watch queue.
  };

  const handleUndo = (id: string) => {
    const msgToRestore = queuedMessages.find((m) => m.id === id);
    if (msgToRestore) {
      // Restore draft if we are still on the same conversation or if we want to just put it back
      setMessageDraft(msgToRestore.content);
      setActiveConversation(
        conversations.find((c) => c.id === msgToRestore.conversationId) || null
      );
    }
    setQueuedMessages((prev) => prev.filter((m) => m.id !== id));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <EliteCard className="w-full max-w-5xl h-[700px] flex flex-row overflow-hidden border-primary/20 shadow-2xl shadow-primary/10">
        {/* Sidebar: Conversations */}
        <div className="w-1/4 border-r border-white/10 flex flex-col bg-black/20">
          <div className="p-4 border-b border-white/10">
            <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
              <MessageSquare className="w-5 h-5 text-primary" /> Spruce Health
            </h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
                placeholder="Search..."
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setActiveConversation(conv)}
                className={cn(
                  "w-full text-left p-3 rounded-lg transition-colors flex items-start gap-3",
                  activeConversation?.id === conv.id
                    ? "bg-primary/20 border border-primary/20"
                    : "hover:bg-white/5 border border-transparent"
                )}
              >
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-sm truncate">{conv.patient_name}</div>
                  <div className="text-xs text-muted-foreground truncate">{conv.last_message}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Main Area: Composer */}
        <div className="flex-1 flex flex-col bg-[#050505] relative">
          <div className="p-4 border-b border-white/10 flex justify-between items-center bg-black/20">
            <div>
              {activeConversation ? (
                <div>
                  <h3 className="font-bold text-lg">{activeConversation.patient_name}</h3>
                  <span className="text-xs text-green-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /> Secure
                    Connection
                  </span>
                </div>
              ) : (
                <span className="text-muted-foreground">Select a conversation...</span>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          <div className="flex-1 p-4 overflow-y-auto bg-black/40 flex flex-col space-y-4">
            {/* Messages List */}
            {activeMessages.map((msg: any) => (
              <div
                key={msg.id}
                className={cn(
                  "flex flex-col max-w-[80%]",
                  msg.isFromPatient ? "self-start" : "self-end items-end"
                )}
              >
                <div
                  className={cn(
                    "p-3 rounded-2xl text-sm",
                    msg.isFromPatient
                      ? "bg-white/5 border border-white/5 rounded-tl-sm"
                      : "bg-primary text-primary-foreground rounded-tr-sm"
                  )}
                >
                  {msg.content}
                </div>
                <span className="text-[10px] text-muted-foreground mt-1 px-1">
                  {msg.sender_name || (msg.isFromPatient ? "Patient" : "Doctor")} •{" "}
                  {new Date(msg.sent_at || msg.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            ))}

            {/* To Send Queue */}
            {queuedMessages.length > 0 && (
              <div className="mb-6 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1">
                  <Clock className="w-3 h-3" /> Sending Queue
                </div>
                {queuedMessages.map((msg) => {
                  const secondsLeft = Math.max(0, Math.ceil((msg.sendAt - now) / 1000));
                  return (
                    <div
                      key={msg.id}
                      className="bg-primary/10 border border-primary/20 rounded-xl p-3 flex items-center gap-4 animate-in slide-in-from-top-2"
                    >
                      <div className="relative flex items-center justify-center w-8 h-8">
                        <div className="absolute inset-0 rounded-full border-2 border-primary/30" />
                        {/* Simple progress text */}
                        <span className="text-xs font-mono font-bold text-primary">
                          {secondsLeft}s
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-primary mb-0.5">
                          Auto-sending to {msg.patientName}...
                        </div>
                        <div className="text-xs text-muted-foreground truncate">{msg.content}</div>
                      </div>
                      <EliteButton
                        variant="outline"
                        className="h-8 border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                        onClick={() => handleUndo(msg.id)}
                      >
                        <Undo2 className="w-3 h-3 mr-2" /> Undo
                      </EliteButton>
                    </div>
                  );
                })}
              </div>
            )}

            {!activeConversation && (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                <MessageSquare className="w-16 h-16 mb-4 opacity-20" />
                <p>Select a patient to send the AI draft.</p>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-white/10 bg-black/20">
            <div className="mb-2 flex justify-between items-center">
              <span className="text-xs font-mono text-primary uppercase tracking-wider">
                AI Draft Content
              </span>
            </div>
            <textarea
              className="w-full bg-black/40 border border-white/10 rounded-xl p-4 min-h-[120px] resize-none focus:outline-none focus:ring-1 focus:ring-primary/50 font-sans leading-relaxed"
              placeholder="Type your message..."
              value={messageDraft}
              onChange={(e) => setMessageDraft(e.target.value)}
            />
            <div className="flex justify-end mt-4">
              <EliteButton
                variant="primary"
                className="px-6"
                onClick={handleQueueSend}
                disabled={!activeConversation}
              >
                <Send className="w-4 h-4 mr-2" /> Queue Send (30s)
              </EliteButton>
            </div>
          </div>
        </div>
      </EliteCard>
    </div>
  );
}
