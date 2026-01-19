import React from 'react';
import { Clock, X, Send, Edit2, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { StagedMessage, DEFAULT_TIMER_CONFIG } from '@/types/staging';
import { cn } from '@/lib/utils';

interface StagingQueueProps {
  messages: StagedMessage[];
  onCancel: (id: string) => void;
  onSendNow: (id: string) => void;
  onEdit: (id: string) => void;
  onUpdateCountdown: (id: string, countdown: number) => void;
}

function StagedMessageCard({
  message,
  onCancel,
  onSendNow,
  onEdit,
}: {
  message: StagedMessage;
  onCancel: () => void;
  onSendNow: () => void;
  onEdit: () => void;
}) {
  const progress = (message.countdown / DEFAULT_TIMER_CONFIG.initialCountdown) * 100;
  const isUrgent = message.countdown <= 10;
  const isSending = message.status === 'sending';
  const isPaused = message.status === 'paused';

  return (
    <div
      className={cn(
        "p-3 rounded-lg border transition-all",
        isUrgent && message.status === 'pending' && "border-destructive/50 bg-destructive/5",
        isPaused && "border-amber-500/50 bg-amber-500/5",
        isSending && "border-primary/50 bg-primary/5",
        !isUrgent && !isPaused && !isSending && "border-border bg-card"
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm text-foreground">
              To: {message.patientName}
            </span>
            {message.aiGenerated && (
              <Badge variant="secondary" className="text-xs">AI</Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {isSending ? (
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
          ) : (
            <>
              <span className={cn(
                "text-lg font-bold tabular-nums",
                isUrgent ? "text-destructive" : "text-foreground"
              )}>
                {message.countdown}s
              </span>
              <Clock className={cn("h-4 w-4", isUrgent ? "text-destructive" : "text-muted-foreground")} />
            </>
          )}
        </div>
      </div>

      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
        {message.content}
      </p>

      <Progress
        value={progress}
        className={cn("h-1 mb-3", isUrgent && "[&>div]:bg-destructive")}
      />

      <div className="flex items-center gap-2">
        <Button
          variant="destructive"
          size="sm"
          onClick={onCancel}
          disabled={isSending}
          className="h-7 px-2 text-xs"
        >
          <X className="h-3 w-3 mr-1" />
          Cancel
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onEdit}
          disabled={isSending}
          className="h-7 px-2 text-xs"
        >
          <Edit2 className="h-3 w-3 mr-1" />
          Edit
        </Button>
        <Button
          variant="default"
          size="sm"
          onClick={onSendNow}
          disabled={isSending}
          className="h-7 px-2 text-xs ml-auto"
        >
          <Send className="h-3 w-3 mr-1" />
          Send Now
        </Button>
      </div>
    </div>
  );
}

export function StagingQueue({
  messages,
  onCancel,
  onSendNow,
  onEdit,
}: StagingQueueProps) {
  const pendingMessages = messages.filter(m =>
    m.status === 'pending' || m.status === 'paused' || m.status === 'sending'
  );

  return (
    <div className="flex flex-col h-full bg-card border-r border-border">
      <div className="p-3 border-b border-border">
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Staging Queue
          {pendingMessages.length > 0 && (
            <Badge variant="default" className="ml-auto">
              {pendingMessages.length}
            </Badge>
          )}
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          60-second countdown before auto-send
        </p>
      </div>

      <ScrollArea className="flex-1 p-3">
        {pendingMessages.length === 0 ? (
          <div className="text-center text-muted-foreground text-sm py-8">
            <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
            No messages in queue
            <p className="text-xs mt-1">
              AI responses will appear here before sending
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingMessages.map((message) => (
              <StagedMessageCard
                key={message.id}
                message={message}
                onCancel={() => onCancel(message.id)}
                onSendNow={() => onSendNow(message.id)}
                onEdit={() => onEdit(message.id)}
              />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
