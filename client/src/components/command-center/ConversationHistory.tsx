import React, { useEffect, useRef } from "react";
import { MessageCircle, User, Bot } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface ChatMessage {
  id: string;
  content: string;
  isFromPatient: boolean;
  timestamp: string;
}

interface ConversationHistoryProps {
  messages: ChatMessage[];
  patientName: string;
  isLoading?: boolean;
}

export function ConversationHistory({
  messages,
  patientName,
  isLoading,
}: ConversationHistoryProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="flex flex-col h-full bg-card border-r border-border">
      <div className="p-3 border-b border-border">
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <MessageCircle className="h-4 w-4" />
          Conversation
        </h2>
        {patientName && <p className="text-xs text-muted-foreground mt-1">with {patientName}</p>}
      </div>

      <ScrollArea className="flex-1 p-3" ref={scrollRef}>
        {isLoading ? (
          <div className="text-center text-muted-foreground text-sm py-8">Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className="text-center text-muted-foreground text-sm py-8">No messages yet</div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn("flex gap-2", msg.isFromPatient ? "justify-start" : "justify-end")}
              >
                {msg.isFromPatient && (
                  <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                    <User className="h-3 w-3 text-muted-foreground" />
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[80%] rounded-lg px-3 py-2",
                    msg.isFromPatient
                      ? "bg-muted text-foreground"
                      : "bg-primary text-primary-foreground"
                  )}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  <p className="text-xs opacity-70 mt-1">{formatTime(msg.timestamp)}</p>
                </div>
                {!msg.isFromPatient && (
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <Bot className="h-3 w-3 text-primary" />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      <div className="p-2 border-t border-border text-xs text-muted-foreground text-center">
        {messages.length} messages (read-only)
      </div>
    </div>
  );
}
