import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, Loader2, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface AIChatProps {
  patientId: string | null;
  patientName: string;
  conversationId: string | null;
  conversationContext: string;
  onAIResponse: (response: string) => void;
}

interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export function AIChat({
  patientId,
  patientName,
  conversationId,
  conversationContext,
  onAIResponse,
}: AIChatProps) {
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Clear messages when patient changes
  useEffect(() => {
    setMessages([]);
  }, [patientId]);

  const handleSend = async () => {
    if (!prompt.trim() || !patientId) return;

    const userMessage: AIMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: prompt,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setPrompt('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt,
          model: 'claude-3-5-haiku-20241022',
          context: {
            patientName,
            conversationHistory: conversationContext,
          },
          systemPrompt: `You are a helpful medical assistant for InstantHPI. Generate professional, empathetic responses for patient communications. Patient: ${patientName}. Keep responses concise and actionable.`,
        }),
      });

      if (!response.ok) {
        throw new Error('AI request failed');
      }

      const data = await response.json();
      const aiContent = data.content || data.message || data.response || 'No response generated';

      const aiMessage: AIMessage = {
        id: `ai_${Date.now()}`,
        role: 'assistant',
        content: aiContent,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);

      // Route to staging queue
      onAIResponse(aiContent);

      toast({
        title: 'Message Staged',
        description: 'AI response added to staging queue (60s countdown)',
      });
    } catch (error) {
      console.error('AI chat error:', error);
      toast({
        title: 'Error',
        description: 'Failed to get AI response',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-card border-r border-border">
      <div className="p-3 border-b border-border">
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          AI Assistant
          <Badge variant="secondary" className="ml-auto text-xs">
            Haiku 4.5
          </Badge>
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          Responses route to staging queue
        </p>
      </div>

      <ScrollArea className="flex-1 p-3" ref={scrollRef}>
        {!patientId ? (
          <div className="text-center text-muted-foreground text-sm py-8">
            <Bot className="h-8 w-8 mx-auto mb-2 opacity-50" />
            Select a patient to start
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-muted-foreground text-sm py-8">
            <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-50" />
            Ask Haiku 4.5 to draft a response
            <p className="text-xs mt-1">
              for {patientName}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex gap-2",
                  msg.role === 'user' ? "justify-end" : "justify-start"
                )}
              >
                {msg.role === 'assistant' && (
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="h-3 w-3 text-primary" />
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[85%] rounded-lg px-3 py-2",
                    msg.role === 'user'
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  )}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-2">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                  <Loader2 className="h-3 w-3 text-primary animate-spin" />
                </div>
                <div className="bg-muted rounded-lg px-3 py-2">
                  <p className="text-sm text-muted-foreground">Thinking...</p>
                </div>
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      <div className="p-3 border-t border-border">
        <div className="flex gap-2">
          <Textarea
            placeholder={patientId ? "Ask AI to draft a response..." : "Select a patient first"}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={!patientId || isLoading}
            className="min-h-[60px] resize-none text-sm"
          />
          <Button
            onClick={handleSend}
            disabled={!prompt.trim() || !patientId || isLoading}
            size="icon"
            className="h-auto aspect-square"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
