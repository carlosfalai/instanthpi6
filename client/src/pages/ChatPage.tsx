import { useState, useRef, useEffect } from "react";
import React, { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Check, ChevronDown, MessageSquare, Send, MoreVertical } from "lucide-react";
import ModernLayout from "@/components/layout/ModernLayout";

// Sample chat messages for the UI example
const SAMPLE_MESSAGES = [
  {
    id: "1",
    content: "Hello, how can I assist you today?",
    timestamp: new Date().setHours(8, 6),
    isFromDoctor: true,
    sender: "Dr. Carlos Faviel Font",
  },
  {
    id: "2",
    content: "I've been experiencing headaches for the past few days. Should I be concerned?",
    timestamp: new Date().setHours(8, 9),
    isFromDoctor: false,
  },
  {
    id: "3",
    content:
      "I understand your concern. Could you tell me more about the headaches? When do they occur and how severe are they?",
    timestamp: new Date().setHours(8, 16),
    isFromDoctor: true,
    sender: "Dr. Carlos Faviel Font",
  },
  {
    id: "4",
    content:
      "They usually happen in the afternoon and are quite painful. Sometimes I also feel a bit dizzy.",
    timestamp: new Date().setHours(8, 19),
    isFromDoctor: false,
  },
  {
    id: "5",
    content:
      "That could be related to several factors including tension, hydration, or vision issues. Let me suggest a few things to try and we may need to run some tests if they persist.",
    timestamp: new Date().setHours(8, 24),
    isFromDoctor: true,
    sender: "Dr. Carlos Faviel Font",
  },
];

export default function ChatPage() {
  const [messages, setMessages] = useState(SAMPLE_MESSAGES);
  const [messageText, setMessageText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [patientName, setPatientName] = useState("Nicolas Girard");

  // Scroll to bottom whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send a message
  const handleSendMessage = () => {
    if (!messageText.trim()) return;

    const newMessage = {
      id: Date.now().toString(),
      content: messageText,
      timestamp: Date.now(),
      isFromDoctor: true,
      sender: "Dr. Carlos Faviel Font",
    };

    setMessages([...messages, newMessage]);
    setMessageText("");
  };

  // Format timestamp to display AM/PM time
  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Group messages by day
  const today = new Date().toLocaleDateString();

  return (
    <ModernLayout title="AI Chat" description="Chat with AI assistant">
      <div className="flex flex-col h-full bg-background text-white">
        {/* Header */}
        <header className="flex justify-between items-center p-4 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 bg-blue-500">
              <AvatarFallback>NG</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="font-semibold">{patientName}</h1>
              <p className="text-sm text-gray-400">Last active: 07:34 AM</p>
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
                  <Button variant="ghost" size="icon" className="text-gray-400">
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
            <div className="bg-gray-800 text-gray-300 rounded-full px-4 py-1 text-sm">Today</div>
          </div>

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex items-start gap-2 ${message.isFromDoctor ? "justify-end" : "justify-start"}`}
            >
              {!message.isFromDoctor && (
                <Avatar className="h-10 w-10 mt-1 bg-blue-500">
                  <AvatarFallback>NG</AvatarFallback>
                </Avatar>
              )}

              <div
                className={`max-w-[75%] rounded-lg p-3 ${
                  message.isFromDoctor ? "bg-[#1e3a50] text-white" : "bg-[#2a2a2a] text-white"
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
                  if (e.key === "Enter" && !e.shiftKey) {
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
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                          <polyline points="15 3 21 3 21 9"></polyline>
                          <line x1="10" y1="14" x2="21" y2="3"></line>
                        </svg>
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
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <circle cx="12" cy="12" r="10"></circle>
                          <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
                          <line x1="9" y1="9" x2="9.01" y2="9"></line>
                          <line x1="15" y1="9" x2="15.01" y2="9"></line>
                        </svg>
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
    </ModernLayout>
  );
}
