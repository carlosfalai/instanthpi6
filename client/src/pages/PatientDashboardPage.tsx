import { useState } from "react";
import MainNavbar from "@/components/layout/MainNavbar";
import ThreePanelLayout from "@/components/dashboard/ThreePanelLayout";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Check, MessageSquare, Send } from "lucide-react";
import { useRef, useEffect } from "react";

// Use the actual patient ID from the screenshot
const PATIENT_ID = 4; // Nicolas Girard
const DOCTOR_NAME = "Dr. Carlos Faviel Font";

interface Message {
  id: string;
  patientId: number;
  content: string;
  timestamp: string;
  isFromPatient: boolean;
  sender?: string;
}

export default function PatientDashboardPage() {
  const [messageText, setMessageText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Use a hardcoded patient for demonstration
  const [patient] = useState({
    id: PATIENT_ID,
    name: "Nicolas Girard",
    initials: "NG",
    gender: "Male",
    dateOfBirth: "1982-04-15",
    phone: "+1 (555) 123-4567",
    email: "nicolas.girard@example.com",
    language: "french" as "french" | "english"
  });
  
  // Use sample message data for demonstration
  const mockMessages: Message[] = [
    {
      id: "1",
      patientId: PATIENT_ID,
      content: "Bonjour Dr. Font, je voudrais prendre un rendez-vous pour discuter de mes résultats de laboratoire récents.",
      timestamp: "2025-04-19T07:30:00Z",
      isFromPatient: true
    },
    {
      id: "2",
      patientId: PATIENT_ID,
      content: "Bonjour M. Girard, bien sûr. J'ai consulté vos résultats. Quand seriez-vous disponible pour une consultation?",
      timestamp: "2025-04-19T08:15:00Z",
      isFromPatient: false,
      sender: DOCTOR_NAME
    },
    {
      id: "3",
      patientId: PATIENT_ID,
      content: "Je suis disponible demain après-midi, vers 14h, si cela vous convient?",
      timestamp: "2025-04-19T08:22:00Z",
      isFromPatient: true
    },
    {
      id: "4",
      patientId: PATIENT_ID,
      content: "Parfait. Je vous ai réservé un créneau à 14h demain. Apportez votre carte RAMQ s'il vous plaît.",
      timestamp: "2025-04-19T08:30:00Z",
      isFromPatient: false,
      sender: DOCTOR_NAME
    },
    {
      id: "5",
      patientId: PATIENT_ID,
      content: "D'accord, merci beaucoup. À demain!",
      timestamp: "2025-04-19T08:35:00Z",
      isFromPatient: true
    }
  ];
  
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  
  // Scroll to bottom whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Handle sending a message
  const handleSendMessage = (content: string) => {
    if (!content.trim()) return;
    
    const newMessage: Message = {
      id: `${Date.now()}`,
      patientId: PATIENT_ID,
      content,
      timestamp: new Date().toISOString(),
      isFromPatient: false,
      sender: DOCTOR_NAME
    };
    
    setMessages([...messages, newMessage]);
    setMessageText("");
  };
  
  // Format timestamp to display AM/PM time
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };
  
  // Check if the message is from today
  const isToday = (timestamp: string) => {
    const date = new Date(timestamp);
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };
  
  // Group messages by date
  const messagesByDate: Record<string, Message[]> = {};
  
  messages.forEach((message: Message) => {
    const date = new Date(message.timestamp);
    const dateKey = isToday(message.timestamp) ? 
      'Today' : 
      date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    
    if (!messagesByDate[dateKey]) {
      messagesByDate[dateKey] = [];
    }
    messagesByDate[dateKey].push(message);
  });
  
  const sortedDates = Object.keys(messagesByDate).sort((a, b) => {
    if (a === 'Today') return 1;
    if (b === 'Today') return -1;
    return new Date(b).getTime() - new Date(a).getTime();
  });
  
  // Conversation component that will be passed to the ThreePanelLayout
  const Conversation = () => (
    <div className="flex flex-col h-full">
      {/* Conversation Header */}
      <header className="flex justify-between items-center p-4 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 bg-blue-500">
            <AvatarFallback>{patient.initials}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="font-semibold">{patient.name}</h1>
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
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <MessageSquare size={40} className="mb-2" />
            <p>No messages yet</p>
          </div>
        ) : (
          sortedDates.map(dateKey => (
            <div key={dateKey} className="space-y-4">
              <div className="flex justify-center">
                <div className="bg-gray-800 text-gray-300 rounded-full px-4 py-1 text-sm">
                  {dateKey}
                </div>
              </div>
              
              {messagesByDate[dateKey].map(message => (
                <div 
                  key={message.id} 
                  className={`flex items-start gap-2 ${!message.isFromPatient ? 'justify-end' : 'justify-start'}`}
                >
                  {message.isFromPatient && (
                    <Avatar className="h-10 w-10 mt-1 bg-blue-500">
                      <AvatarFallback>{patient.initials}</AvatarFallback>
                    </Avatar>
                  )}
                  
                  <div 
                    className={`max-w-[75%] rounded-lg p-3 ${
                      !message.isFromPatient 
                        ? 'bg-[#1e3a50] text-white' 
                        : 'bg-[#2a2a2a] text-white'
                    }`}
                  >
                    {!message.isFromPatient && (
                      <div className="text-xs text-gray-400 mb-1">{message.sender || DOCTOR_NAME}</div>
                    )}
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <div className="text-right text-xs text-gray-400 mt-1">
                      {formatTimestamp(message.timestamp)}
                    </div>
                  </div>
                  
                  {!message.isFromPatient && (
                    <Avatar className="h-10 w-10 mt-1 bg-blue-600">
                      <AvatarFallback>CF</AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
            </div>
          ))
        )}
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
                  handleSendMessage(messageText);
                }
              }}
            />
            
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-gray-400 h-8 w-8">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
            onClick={() => handleSendMessage(messageText)} 
            disabled={!messageText.trim()}
            className="rounded-full h-10 w-10 p-0 flex items-center justify-center bg-blue-600 hover:bg-blue-700"
          >
            <Send size={16} />
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-[#121212] text-white">
      {/* Main Navigation Bar */}
      <MainNavbar />
      
      {/* Three Panel Layout */}
      <ThreePanelLayout
        patientId={patient.id}
        patientLanguage={patient.language}
        onSendMessage={handleSendMessage}
      >
        <Conversation />
      </ThreePanelLayout>
    </div>
  );
}