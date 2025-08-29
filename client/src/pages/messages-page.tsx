import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import AppLayoutSpruce from "@/components/layout/AppLayoutSpruce";
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
  });

  // Query for selected patient
  const { data: selectedPatient, isLoading: patientLoading } = useQuery<Patient>({
    queryKey: [`/api/patients/${selectedPatientId}`],
    enabled: !!selectedPatientId,
  });

  // Query for patient messages
  const { data: messages = [], isLoading: messagesLoading } = useQuery<Message[]>({
    queryKey: [`/api/patients/${selectedPatientId}/messages`],
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
    <AppLayoutSpruce>
      <div className="flex h-full">
        {/* Left sidebar - Patient list */}
        <div className="w-72 border-r border-gray-800 h-full flex flex-col">
          <div className="p-4 border-b border-gray-800">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search patients..."
                className="pl-8 bg-gray-900 border-gray-700"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <ScrollArea className="flex-1">
            {patientsLoading ? (
              <div className="flex justify-center items-center h-32">
                <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
              </div>
            ) : (
              <div className="space-y-1 p-2">
                {filteredPatients.map((patient) => (
                  <button
                    key={patient.id}
                    className={`w-full text-left p-2 rounded-md transition-colors ${
                      selectedPatientId === patient.id
                        ? "bg-blue-900/30 text-blue-100"
                        : "hover:bg-gray-800"
                    }`}
                    onClick={() => setSelectedPatientId(patient.id)}
                  >
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-9 w-9 flex-shrink-0">
                        <AvatarFallback className="bg-blue-700 text-white">
                          {getInitials(patient.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{patient.name}</p>
                        <p className="text-sm text-gray-400 truncate">
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
        <div className="flex-1 flex flex-col">
          {selectedPatientId ? (
            <>
              {/* Conversation header */}
              <div className="p-4 border-b border-gray-800 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-blue-700 text-white">
                      {selectedPatient ? getInitials(selectedPatient.name) : ""}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="font-semibold">{selectedPatient?.name}</h2>
                    <p className="text-sm text-gray-400">
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
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                  </div>
                ) : messages.length > 0 ? (
                  <div className="space-y-8">
                    {Object.entries(messagesByDate).map(([date, dateMessages]) => (
                      <div key={date}>
                        <div className="flex justify-center mb-4">
                          <span className="text-xs bg-gray-800 text-gray-400 px-2 py-1 rounded-full">
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
                                    ? "bg-gray-800 text-gray-100"
                                    : "bg-blue-600 text-white"
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
                  <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <p>No messages yet</p>
                    <p className="text-sm mt-1">
                      Start a conversation with {selectedPatient?.name}
                    </p>
                  </div>
                )}
              </ScrollArea>

              {/* Message input */}
              <div className="p-4 border-t border-gray-800">
                <div className="flex space-x-2">
                  <Input
                    placeholder="Type your message..."
                    className="bg-gray-900 border-gray-700"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                  />
                  <Button onClick={handleSendMessage} disabled={!messageText.trim()}>
                    <Send className="h-4 w-4 mr-2" />
                    Send
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <p className="text-xl">Select a patient to view conversation</p>
              <p className="text-sm mt-2">Choose a patient from the list on the left</p>
            </div>
          )}
        </div>
      </div>
    </AppLayoutSpruce>
  );
}
