// Staging Queue Types for 5-Panel Command Center

export interface StagedMessage {
  id: string;
  content: string;
  patientId: string;
  patientName: string;
  conversationId: string;
  createdAt: number; // timestamp when added to queue
  countdown: number; // remaining seconds (starts at 60)
  status: StagedMessageStatus;
  aiGenerated: boolean;
}

export type StagedMessageStatus =
  | 'pending'    // waiting in queue with timer running
  | 'paused'     // timer paused (editing)
  | 'sending'    // currently being sent
  | 'sent'       // successfully delivered
  | 'cancelled'  // user cancelled
  | 'error';     // send failed

export interface TimerState {
  countdown: number;
  isActive: boolean;
  isPaused: boolean;
}

export interface StagingQueueState {
  messages: StagedMessage[];
  isProcessing: boolean;
}

export interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// Constants
export const STORAGE_KEYS = {
  STAGING_QUEUE: 'instanthpi_staging_queue',
} as const;

export const DEFAULT_TIMER_CONFIG = {
  initialCountdown: 60, // 60 seconds before auto-send
  tickInterval: 1000,   // 1 second
} as const;
