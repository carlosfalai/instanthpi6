import { useState, useEffect, useCallback } from "react";
import {
  StagedMessage,
  StagingQueueState,
  STORAGE_KEYS,
  DEFAULT_TIMER_CONFIG,
} from "@/types/staging";
import { saveToLocalStorage, loadFromLocalStorage } from "@/utils/localStorage";
import { useToast } from "@/hooks/use-toast";

export function useStagingQueue() {
  const [messages, setMessages] = useState<StagedMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  // Load from localStorage on mount
  useEffect(() => {
    const saved = loadFromLocalStorage<StagedMessage[]>(STORAGE_KEYS.STAGING_QUEUE);
    if (saved && Array.isArray(saved)) {
      // Recalculate countdowns based on elapsed time
      const now = Date.now();
      const updated = saved
        .map((msg) => {
          if (msg.status === "pending") {
            const elapsed = Math.floor((now - msg.createdAt) / 1000);
            const remaining = Math.max(0, DEFAULT_TIMER_CONFIG.initialCountdown - elapsed);
            return { ...msg, countdown: remaining };
          }
          return msg;
        })
        .filter((msg) => msg.countdown > 0 || msg.status !== "pending");
      setMessages(updated);
    }
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    saveToLocalStorage(STORAGE_KEYS.STAGING_QUEUE, messages);
  }, [messages]);

  const addToQueue = useCallback(
    (
      content: string,
      patientId: string,
      patientName: string,
      conversationId: string,
      aiGenerated: boolean = true
    ) => {
      const newMessage: StagedMessage = {
        id: `staged_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        content,
        patientId,
        patientName,
        conversationId,
        createdAt: Date.now(),
        countdown: DEFAULT_TIMER_CONFIG.initialCountdown,
        status: "pending",
        aiGenerated,
      };
      setMessages((prev) => [...prev, newMessage]);
      toast({
        title: "Message Staged",
        description: `Will send in ${DEFAULT_TIMER_CONFIG.initialCountdown} seconds`,
      });
      return newMessage.id;
    },
    [toast]
  );

  const removeFromQueue = useCallback((messageId: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== messageId));
  }, []);

  const updateMessage = useCallback((messageId: string, updates: Partial<StagedMessage>) => {
    setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, ...updates } : m)));
  }, []);

  const updateCountdown = useCallback((messageId: string, countdown: number) => {
    setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, countdown } : m)));
  }, []);

  const pauseMessage = useCallback(
    (messageId: string) => {
      updateMessage(messageId, { status: "paused" });
    },
    [updateMessage]
  );

  const resumeMessage = useCallback(
    (messageId: string) => {
      updateMessage(messageId, { status: "pending" });
    },
    [updateMessage]
  );

  const cancelMessage = useCallback(
    (messageId: string) => {
      updateMessage(messageId, { status: "cancelled" });
      setTimeout(() => removeFromQueue(messageId), 500);
      toast({ title: "Message Cancelled" });
    },
    [updateMessage, removeFromQueue, toast]
  );

  const markAsSending = useCallback(
    (messageId: string) => {
      updateMessage(messageId, { status: "sending" });
    },
    [updateMessage]
  );

  const markAsSent = useCallback(
    (messageId: string) => {
      updateMessage(messageId, { status: "sent" });
      setTimeout(() => removeFromQueue(messageId), 1000);
    },
    [updateMessage, removeFromQueue]
  );

  const markAsError = useCallback(
    (messageId: string, error: string) => {
      updateMessage(messageId, { status: "error" });
      toast({ title: "Send Failed", description: error, variant: "destructive" });
    },
    [updateMessage, toast]
  );

  return {
    messages,
    isProcessing,
    setIsProcessing,
    addToQueue,
    removeFromQueue,
    updateMessage,
    updateCountdown,
    pauseMessage,
    resumeMessage,
    cancelMessage,
    markAsSending,
    markAsSent,
    markAsError,
  };
}
