import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import ModernLayout from "@/components/layout/ModernLayout";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Search, Send } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";

// Define message interface
interface Message {
  id: number;
  patientId: number;
  senderId: number;
  content: string;
  timestamp: string;
  isFromPatient: boolean;
  spruceMessageId: string | null;
}

// Define patient interface
interface Patient {
  id: number;
  name: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  language: "english" | "french" | null;
  spruceId: string | null;
}

export default function MessagesPage() {
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const [messageText, setMessageText] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Query for all patients
  const { data: patients = [], isLoading: patientsLoading } = useQuery<Patient[]>({
    queryKey: ["/api/patients"],
    queryFn: getQueryFn(),
  });

  // Query for selected patient
  const { data: selectedPatient, isLoading: patientLoading } = useQuery<Patient>({
    queryKey: [`/api/patients/${selectedPatientId}`],
    queryFn: getQueryFn(),
    enabled: !!selectedPatientId,
  });

  // Query for patient messages
  const { data: messages = [], isLoading: messagesLoading } = useQuery<Message[]>({
    queryKey: [`/api/patients/${selectedPatientId}/messages`],
    queryFn: getQueryFn(),
    enabled: !!selectedPatientId,
  });

  // Filter patients based on search term
  const filteredPatients = searchTerm
    ? patients.filter(
        (patient) =>
          patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          patient.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : patients;

  // Handle sending a message
  const handleSendMessage = async () => {
    if (!selectedPatientId || !messageText.trim()) return;

    try {
      await fetch("/api/spruce/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          patientId: selectedPatientId,
          message: messageText,
        }),
      });

      // Clear the message input
      setMessageText("");

      // Refresh messages (this would be handled better with React Query invalidation)
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  // Format date for message groups
  const formatMessageDate = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
    }
  };

  // Group messages by date
  const messagesByDate: Record<string, Message[]> = {};
  messages.forEach((message) => {
    const dateKey = formatMessageDate(new Date(message.timestamp));
    if (!messagesByDate[dateKey]) {
      messagesByDate[dateKey] = [];
    }
    messagesByDate[dateKey].push(message);
  });

  // Format timestamp for messages
  const formatTime = (timestamp: string) => {
    return format(new Date(timestamp), "h:mm a");
  };

  // Get initials from name
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <ModernLayout title="Messages" description="Secure patient communication">
      <div className="flex h-full">
        {/* Left sidebar - Patient list */}
        <div className="w-72 border-r border-[#2a2a2a] h-full flex flex-col bg-[#0d0d0d]">
          <div className="p-4 border-b border-[#2a2a2a]">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-[#999]" />
              <Input
                placeholder="Search patients..."
                className="pl-8 bg-[#1a1a1a] border-[#333] text-[#e6e6e6] placeholder:text-[#666]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <ScrollArea className="flex-1">
            {patientsLoading ? (
              <div className="flex justify-center items-center h-32">
                <Loader2 className="h-6 w-6 animate-spin text-[#8b5cf6]" />
              </div>
            ) : (
              <div className="space-y-1 p-2">
                {filteredPatients.map((patient) => (
                  <button
                    key={patient.id}
                    className={`w-full text-left p-2 rounded-md transition-colors ${
                      selectedPatientId === patient.id
                        ? "bg-[#222] text-[#e6e6e6] border border-[#2a2a2a]"
                        : "hover:bg-[#1a1a1a] text-[#999]"
                    }`}
                    onClick={() => setSelectedPatientId(patient.id)}
                  >
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-9 w-9 flex-shrink-0">
                        <AvatarFallback className="bg-[#1a1a1a] border border-[#333] text-[#8b5cf6]">
                          {getInitials(patient.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{patient.name}</p>
                        <p className="text-sm text-[#666] truncate">
                          {patient.email || patient.phone}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Right area - Conversation */}
        <div className="flex-1 flex flex-col bg-[#0d0d0d]">
          {selectedPatientId ? (
            <>
              {/* Conversation header */}
              <div className="p-4 border-b border-[#2a2a2a] flex items-center justify-between bg-[#1a1a1a]">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-[#1a1a1a] border border-[#333] text-[#8b5cf6]">
                      {selectedPatient ? getInitials(selectedPatient.name) : ""}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="font-semibold text-[#e6e6e6]">{selectedPatient?.name}</h2>
                    <p className="text-sm text-[#999]">
                      {selectedPatient?.language === "french" ? "French" : "English"} •{" "}
                      {selectedPatient?.email}
                    </p>
                  </div>
                </div>
              </div>

              {/* Messages area */}
              <ScrollArea className="flex-1 p-4">
                {messagesLoading ? (
                  <div className="flex justify-center items-center h-32">
                    <Loader2 className="h-8 w-8 animate-spin text-[#8b5cf6]" />
                  </div>
                ) : messages.length > 0 ? (
                  <div className="space-y-8">
                    {Object.entries(messagesByDate).map(([date, dateMessages]) => (
                      <div key={date}>
                        <div className="flex justify-center mb-4">
                          <span className="text-xs bg-[#1a1a1a] border border-[#2a2a2a] text-[#999] px-2 py-1 rounded-full">
                            {date}
                          </span>
                        </div>
                        <div className="space-y-4">
                          {dateMessages.map((message) => (
                            <div
                              key={message.id}
                              className={`flex ${message.isFromPatient ? "justify-start" : "justify-end"}`}
                            >
                              <div
                                className={`max-w-[80%] rounded-lg p-3 ${
                                  message.isFromPatient
                                    ? "bg-[#1a1a1a] border border-[#2a2a2a] text-[#e6e6e6]"
                                    : "bg-[#8b5cf6] text-white"
                                }`}
                              >
                                <div className="mb-1">
                                  <p>{message.content}</p>
                                </div>
                                <div className="text-right">
                                  <span className="text-xs opacity-70">
                                    {formatTime(message.timestamp)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-[#999]">
                    <p>No messages yet</p>
                    <p className="text-sm mt-1">
                      Start a conversation with {selectedPatient?.name}
                    </p>
                  </div>
                )}
              </ScrollArea>

              {/* Message input */}
              <div className="p-4 border-t border-[#2a2a2a] bg-[#1a1a1a]">
                <div className="flex space-x-2">
                  <Input
                    placeholder="Type your message..."
                    className="bg-[#0d0d0d] border-[#333] text-[#e6e6e6] placeholder:text-[#666]"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!messageText.trim()}
                    className="bg-[#8b5cf6] hover:bg-[#7c3aed] text-white"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Send
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-[#999]">
              <p className="text-xl">Select a patient to view conversation</p>
              <p className="text-sm mt-2">Choose a patient from the list on the left</p>
            </div>
          )}
        </div>
      </div>
    </ModernLayout>
  );
}
