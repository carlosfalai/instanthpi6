import { useState, useEffect, useRef, useCallback } from "react";
import { DEFAULT_TIMER_CONFIG } from "@/types/staging";

interface UseAutoSendTimerOptions {
  messageId: string;
  initialCountdown?: number;
  onExpire: () => void;
  onTick?: (remaining: number) => void;
  autoStart?: boolean;
  isPaused?: boolean;
}

export function useAutoSendTimer({
  messageId,
  initialCountdown = DEFAULT_TIMER_CONFIG.initialCountdown,
  onExpire,
  onTick,
  autoStart = true,
  isPaused = false,
}: UseAutoSendTimerOptions) {
  const [countdown, setCountdown] = useState(initialCountdown);
  const [isActive, setIsActive] = useState(autoStart);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const onExpireRef = useRef(onExpire);
  const onTickRef = useRef(onTick);
  const mountedRef = useRef(true);

  // Keep refs updated
  useEffect(() => {
    onExpireRef.current = onExpire;
    onTickRef.current = onTick;
  }, [onExpire, onTick]);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Timer logic
  useEffect(() => {
    if (!isActive || isPaused) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    timerRef.current = setInterval(() => {
      if (!mountedRef.current) return;

      setCountdown((prev) => {
        const next = prev - 1;
        onTickRef.current?.(next);

        if (next <= 0) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          setIsActive(false);
          onExpireRef.current();
          return 0;
        }
        return next;
      });
    }, DEFAULT_TIMER_CONFIG.tickInterval);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isActive, isPaused, messageId]);

  const pauseTimer = useCallback(() => {
    setIsActive(false);
  }, []);

  const resumeTimer = useCallback(() => {
    setIsActive(true);
  }, []);

  const cancelTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsActive(false);
    setCountdown(0);
  }, []);

  const sendNow = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsActive(false);
    setCountdown(0);
    onExpireRef.current();
  }, []);

  const resetTimer = useCallback(() => {
    setCountdown(initialCountdown);
    setIsActive(true);
  }, [initialCountdown]);

  return {
    countdown,
    isActive,
    pauseTimer,
    resumeTimer,
    cancelTimer,
    sendNow,
    resetTimer,
  };
}
