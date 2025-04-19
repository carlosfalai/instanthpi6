import { format } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface RightPanelProps {
  messages: any[];
  isLoading: boolean;
  patient: any;
}

export default function RightPanel({ messages, isLoading, patient }: RightPanelProps) {
  // Function to format timestamp
  const formatTime = (timestamp: string | Date) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return format(date, 'h:mm a');
  };

  return (
    <div className="w-full lg:w-1/4 bg-white rounded-lg shadow-sm overflow-hidden flex flex-col">
      <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
        <h2 className="text-lg font-medium text-gray-900">Patient Messages</h2>
        <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
          Spruce Health
        </Badge>
      </div>
      
      <ScrollArea className="flex-1 p-4">
        {isLoading ? (
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-start">
                <Skeleton className="h-8 w-8 rounded-full mr-3" />
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                  <Skeleton className="h-16 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {messages.length > 0 ? (
              <div>
                {messages.map((message, index) => (
                  <div key={message.id} className="mb-6">
                    {message.isFromPatient ? (
                      // Patient message (left-aligned)
                      <div className="flex items-start">
                        <img 
                          className="h-8 w-8 rounded-full mr-3" 
                          src={patient?.avatarUrl} 
                          alt={patient?.name} 
                        />
                        <div className="flex-1 bg-gray-100 rounded-lg px-4 py-2 sm:px-4 sm:py-3">
                          <div className="flex justify-between items-center mb-1">
                            <h3 className="text-sm font-medium text-gray-900">
                              {patient?.name}
                            </h3>
                            <span className="text-xs text-gray-500">
                              {formatTime(message.timestamp)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700">{message.content}</p>
                        </div>
                      </div>
                    ) : (
                      // Doctor message (right-aligned)
                      <div className="flex items-start justify-end">
                        <div className="flex-1 bg-blue-500 rounded-lg px-4 py-2 sm:px-4 sm:py-3 text-white ml-12">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs text-blue-200">
                              {formatTime(message.timestamp)}
                            </span>
                            <h3 className="text-sm font-medium">Dr. Sarah Johnson</h3>
                          </div>
                          <p className="text-sm">{message.content}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <p className="text-gray-500">No messages yet.</p>
                <p className="text-sm text-gray-400 mt-2">
                  Send a message to start the conversation.
                </p>
              </div>
            )}
          </>
        )}
        
        {messages.length > 0 && (
          <div className="mt-4">
            <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-500 border border-gray-200">
              <p>AI suggestions are ready to review in the middle panel. Approve and send when ready.</p>
            </div>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
