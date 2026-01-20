import React, { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Send, Code, User, CheckCircle2, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  apiCall?: {
    method: string;
    url: string;
    request?: any;
    response?: any;
    status?: number;
  };
  profileUpdate?: {
    field: string;
    oldValue: any;
    newValue: any;
  };
}

interface DoctorProfile {
  name: string;
  email: string;
  specialty: string;
  license: string;
  phone: string;
  address: string;
  clinicName?: string;
  experience?: string;
  education: string;
  certifications: string[];
  avatarUrl?: string;
  signature?: string;
}

const ClaudeProfileAssistant = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content:
        "Hello! I'm your AI assistant. I can help you manage your doctor profile. I can view and update your information like name, specialty, phone, address, education, certifications, and signature. What would you like to do?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [profile, setProfile] = useState<DoctorProfile | null>(null);
  const [showApiCalls, setShowApiCalls] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Load doctor profile
  const loadProfile = async () => {
    try {
      const savedProfile = localStorage.getItem("doctor_profile");
      if (savedProfile) {
        const parsed = JSON.parse(savedProfile);
        setProfile(parsed);
        return parsed;
      } else {
        // Default profile
        const defaultProfile: DoctorProfile = {
          name: "Dr. Carlos Faviel Font",
          email: "cff@centremedicalfont.ca",
          specialty: "Médecine Générale",
          license: "CMQ-12345",
          phone: "+1 (514) 555-0123",
          address: "123 Rue Medical, Montréal, QC H1A 1A1",
          clinicName: "Centre Médical Font",
          experience: "15 ans d'expérience en médecine générale",
          education: "MD - Université de Montréal (2008)",
          certifications: ["Collège des Médecins du Québec", "Médecine d'Urgence"],
          signature: "Dr. Carlos Faviel Font",
        };
        setProfile(defaultProfile);
        return defaultProfile;
      }
    } catch (error) {
      console.error("Error loading profile:", error);
      return null;
    }
  };

  // Save profile
  const saveProfile = async (updatedProfile: DoctorProfile) => {
    localStorage.setItem("doctor_profile", JSON.stringify(updatedProfile));
    setProfile(updatedProfile);
  };

  // AI conversation mutation
  const conversationMutation = useMutation({
    mutationFn: async (data: { message: string; profile: DoctorProfile | null }) => {
      const apiCall = {
        method: "POST",
        url: "/api/anthropic/generate-text",
        request: {
          prompt: `You are an AI assistant helping a doctor manage their profile. 

Current doctor profile:
${JSON.stringify(data.profile, null, 2)}

The doctor said: "${data.message}"

Your task:
1. Understand what the doctor wants to do with their profile
2. If they want to update something, identify the field and new value
3. Respond naturally and helpfully
4. If updating, format your response as JSON with this structure:
{
  "response": "Your natural language response to the doctor",
  "update": {
    "field": "field_name",
    "value": "new_value"
  }
}

If no update is needed, just respond with:
{
  "response": "Your natural language response"
}

Available fields to update: name, email, specialty, license, phone, address, clinicName, experience, education, signature, certifications (array)

Be helpful and conversational.`,
          model: "claude-3-5-haiku-20241022",
          maxTokens: 2048,
        },
      };

      const res = await apiRequest("POST", "/api/anthropic/generate-text", apiCall.request);
      const result = await res.json();

      return {
        apiCall: {
          ...apiCall,
          response: result,
          status: res.status,
        },
        result: result.result || result.text || "",
      };
    },
    onSuccess: (data, variables) => {
      try {
        // Try to parse JSON response
        let parsedResponse: any;
        try {
          parsedResponse = JSON.parse(data.result);
        } catch {
          // If not JSON, treat as plain text
          parsedResponse = { response: data.result };
        }

        const assistantMessage: Message = {
          id: Date.now().toString(),
          role: "assistant",
          content: parsedResponse.response || data.result,
          timestamp: new Date(),
          apiCall: data.apiCall,
        };

        // If there's an update, apply it
        if (parsedResponse.update && profile) {
          const { field, value } = parsedResponse.update;
          const updatedProfile = { ...profile };

          if (field === "certifications" && Array.isArray(value)) {
            updatedProfile.certifications = value;
          } else if (field in updatedProfile) {
            (updatedProfile as any)[field] = value;
          }

          assistantMessage.profileUpdate = {
            field,
            oldValue: (profile as any)[field],
            newValue: value,
          };

          saveProfile(updatedProfile);
          toast({
            title: "Profile Updated",
            description: `${field} has been updated successfully.`,
          });
        }

        setMessages((prev) => [...prev, assistantMessage]);
      } catch (error) {
        console.error("Error processing response:", error);
        const errorMessage: Message = {
          id: Date.now().toString(),
          role: "assistant",
          content: "I encountered an error processing your request. Please try again.",
          timestamp: new Date(),
          apiCall: data.apiCall,
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to get AI response",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || conversationMutation.isPending) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    // Call AI with current profile
    conversationMutation.mutate({
      message: input,
      profile: profile,
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Assistant
            </CardTitle>
            <CardDescription>
              Chat with Claude to manage your doctor profile. I can view and update your
              information.
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowApiCalls(!showApiCalls)}>
            <Code className="h-4 w-4 mr-2" />
            {showApiCalls ? "Hide" : "Show"} API Calls
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Current Profile Summary */}
          {profile && (
            <div className="p-4 bg-muted rounded-lg border">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <User className="h-4 w-4" />
                Current Profile
              </h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Name:</span> {profile.name}
                </div>
                <div>
                  <span className="text-muted-foreground">Specialty:</span> {profile.specialty}
                </div>
                <div>
                  <span className="text-muted-foreground">Email:</span> {profile.email}
                </div>
                <div>
                  <span className="text-muted-foreground">Phone:</span> {profile.phone}
                </div>
              </div>
            </div>
          )}

          {/* Messages */}
          <ScrollArea className="h-[500px] border rounded-lg p-4" ref={scrollRef}>
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{message.content}</div>
                    <div className="text-xs opacity-70 mt-2">
                      {message.timestamp.toLocaleTimeString()}
                    </div>

                    {/* Profile Update Indicator */}
                    {message.profileUpdate && (
                      <div className="mt-2 p-2 bg-green-100 dark:bg-green-900 rounded border border-green-300 dark:border-green-700">
                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <span className="font-semibold">Profile Updated:</span>
                        </div>
                        <div className="text-xs mt-1">
                          <span className="font-medium">{message.profileUpdate.field}:</span>{" "}
                          <span className="line-through text-muted-foreground">
                            {String(message.profileUpdate.oldValue || "empty")}
                          </span>{" "}
                          →{" "}
                          <span className="font-semibold text-green-600">
                            {String(message.profileUpdate.newValue)}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* API Call Details */}
                    {showApiCalls && message.apiCall && (
                      <details className="mt-3 text-xs">
                        <summary className="cursor-pointer flex items-center gap-2 text-muted-foreground hover:text-foreground">
                          <Code className="h-3 w-3" />
                          API Call Details
                        </summary>
                        <div className="mt-2 p-2 bg-background border rounded space-y-2">
                          <div>
                            <span className="font-semibold">Method:</span>{" "}
                            <Badge variant="outline">{message.apiCall.method}</Badge>
                          </div>
                          <div>
                            <span className="font-semibold">URL:</span>{" "}
                            <code className="text-xs">{message.apiCall.url}</code>
                          </div>
                          {message.apiCall.request && (
                            <div>
                              <span className="font-semibold">Request:</span>
                              <pre className="mt-1 p-2 bg-muted rounded overflow-x-auto">
                                {JSON.stringify(message.apiCall.request, null, 2)}
                              </pre>
                            </div>
                          )}
                          {message.apiCall.response && (
                            <div>
                              <span className="font-semibold">Response:</span>
                              <pre className="mt-1 p-2 bg-muted rounded overflow-x-auto">
                                {JSON.stringify(message.apiCall.response, null, 2)}
                              </pre>
                            </div>
                          )}
                          {message.apiCall.status && (
                            <div>
                              <span className="font-semibold">Status:</span>{" "}
                              <Badge
                                variant={
                                  message.apiCall.status >= 200 && message.apiCall.status < 300
                                    ? "default"
                                    : "destructive"
                                }
                              >
                                {message.apiCall.status}
                              </Badge>
                            </div>
                          )}
                        </div>
                      </details>
                    )}
                  </div>
                </div>
              ))}
              {conversationMutation.isPending && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg p-3">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me to update your profile... (e.g., 'Change my phone number to 514-555-9999' or 'Update my specialty to Cardiology')"
              rows={3}
              className="resize-none"
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || conversationMutation.isPending}
              className="self-end"
            >
              {conversationMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ClaudeProfileAssistant;
