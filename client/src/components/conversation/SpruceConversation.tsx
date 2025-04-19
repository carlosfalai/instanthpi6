import { useState, useRef, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Send, Check, MessageSquare, Paperclip, Smile } from "lucide-react";

interface Message {
  id: string;
  content: string;
  timestamp: number;
  isFromDoctor: boolean;
  sender?: string;
}

interface SpruceConversationProps {
  patientId: number;
  patientName: string;
  patientInitials: string;
  lastActive?: string;
  onMarkResolved?: () => void;
  initialMessages?: Message[];
  onSendMessage?: (message: string) => void;
}

export default function SpruceConversation({
  patientId,
  patientName,
  patientInitials,
  lastActive = "Active now",
  onMarkResolved,
  initialMessages = [],
  onSendMessage
}: SpruceConversationProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [messageText, setMessageText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send a message
  const handleSendMessage = () => {
    if (!messageText.trim()) return;
    
    const newMessage = {
      id: Date.now().toString(),
      content: messageText,
      timestamp: Date.now(),
      isFromDoctor: true,
      sender: 'Dr. Carlos Faviel Font'
    };
    
    setMessages([...messages, newMessage]);
    if (onSendMessage) {
      onSendMessage(messageText);
    }
    setMessageText("");
  };

  // Format timestamp to display AM/PM time
  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // Group messages by day
  const today = new Date().toLocaleDateString();
  
  return (
    <div className="flex flex-col h-full bg-[#121212] text-white">
      {/* Header */}
      <header className="flex justify-between items-center p-4 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 bg-blue-500">
            <AvatarFallback>{patientInitials}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="font-semibold">{patientName}</h1>
            <p className="text-sm text-gray-400">Last active: {lastActive}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="text-gray-400">
                  <MessageSquare size={20} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>New conversation</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-gray-400"
                  onClick={onMarkResolved}
                >
                  <Check size={20} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Mark as resolved</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </header>
      
      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <div className="flex justify-center">
          <div className="bg-gray-800 text-gray-300 rounded-full px-4 py-1 text-sm">
            Today
          </div>
        </div>
        
        {messages.map(message => (
          <div 
            key={message.id} 
            className={`flex items-start gap-2 ${message.isFromDoctor ? 'justify-end' : 'justify-start'}`}
          >
            {!message.isFromDoctor && (
              <Avatar className="h-10 w-10 mt-1 bg-blue-500">
                <AvatarFallback>{patientInitials}</AvatarFallback>
              </Avatar>
            )}
            
            <div 
              className={`max-w-[75%] rounded-lg p-3 ${
                message.isFromDoctor 
                  ? 'bg-[#1e3a50] text-white' 
                  : 'bg-[#2a2a2a] text-white'
              }`}
            >
              {message.isFromDoctor && message.sender && (
                <div className="text-xs text-gray-400 mb-1">{message.sender}</div>
              )}
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              <div className="text-right text-xs text-gray-400 mt-1">
                {formatTimestamp(message.timestamp)}
              </div>
            </div>
            
            {message.isFromDoctor && (
              <Avatar className="h-10 w-10 mt-1 bg-blue-600">
                <AvatarFallback>CF</AvatarFallback>
              </Avatar>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Message Input */}
      <div className="p-4 border-t border-gray-800">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Type your message..."
              className="w-full px-4 py-2 rounded-full bg-[#2a2a2a] border border-gray-700 text-white focus:outline-none focus:border-blue-500"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
            
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-gray-400 h-8 w-8">
                      <Paperclip size={18} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Attach file</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-gray-400 h-8 w-8">
                      <Smile size={18} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Add emoji</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
          
          <Button 
            onClick={handleSendMessage} 
            disabled={!messageText.trim()}
            className="rounded-full h-10 w-10 p-0 flex items-center justify-center bg-blue-600 hover:bg-blue-700"
          >
            <Send size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
}