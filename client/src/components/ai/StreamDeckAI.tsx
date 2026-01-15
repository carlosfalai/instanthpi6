import React, { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import {
  Send,
  Loader2,
  Edit3,
  Check,
  X,
  FileText,
  Stethoscope,
  Pill,
  ClipboardList,
  Brain,
  Heart,
  AlertCircle,
  RotateCcw,
  Sparkles,
  Settings,
  Plus,
  Trash2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface ActionButton {
  id: string;
  label: string;
  command: string;
  icon: string;
  color: string;
}

const defaultButtons: ActionButton[] = [
  { id: "1", label: "SOAP Note", command: "Generate a complete SOAP note for this patient case", icon: "FileText", color: "bg-blue-600" },
  { id: "2", label: "Assessment", command: "Generate the Assessment section with clinical reasoning", icon: "Stethoscope", color: "bg-green-600" },
  { id: "3", label: "Plan", command: "Generate a detailed treatment Plan", icon: "ClipboardList", color: "bg-purple-600" },
  { id: "4", label: "Medications", command: "List recommended medications with dosages", icon: "Pill", color: "bg-orange-600" },
  { id: "5", label: "Differential Dx", command: "Generate a differential diagnosis list", icon: "Brain", color: "bg-pink-600" },
  { id: "6", label: "Risk Factors", command: "Identify and list patient risk factors", icon: "AlertCircle", color: "bg-red-600" },
  { id: "7", label: "Follow-up", command: "Generate follow-up recommendations", icon: "Heart", color: "bg-cyan-600" },
  { id: "8", label: "Summarize", command: "Summarize the key points concisely", icon: "Sparkles", color: "bg-amber-600" },
  { id: "9", label: "Reformat", command: "Reformat the previous response in a cleaner structure", icon: "RotateCcw", color: "bg-indigo-600" },
];

const iconMap: { [key: string]: React.ComponentType<any> } = {
  FileText,
  Stethoscope,
  ClipboardList,
  Pill,
  Brain,
  AlertCircle,
  Heart,
  Sparkles,
  RotateCcw,
};

interface StreamDeckAIProps {
  patientData?: any;
  doctorApiKey?: string;
  doctorApiProvider?: "claude" | "openai";
}

export default function StreamDeckAI({
  patientData,
  doctorApiKey,
  doctorApiProvider = "claude",
}: StreamDeckAIProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [buttons, setButtons] = useState<ActionButton[]>(defaultButtons);
  const [editingButton, setEditingButton] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editCommand, setEditCommand] = useState("");
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Load saved buttons from localStorage
  useEffect(() => {
    const savedButtons = localStorage.getItem("streamdeck-ai-buttons");
    if (savedButtons) {
      try {
        setButtons(JSON.parse(savedButtons));
      } catch (e) {
        console.error("Failed to load saved buttons:", e);
      }
    }
  }, []);

  // Save buttons to localStorage when they change
  useEffect(() => {
    localStorage.setItem("streamdeck-ai-buttons", JSON.stringify(buttons));
  }, [buttons]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // AI mutation for generating responses
  const aiMutation = useMutation({
    mutationFn: async (prompt: string) => {
      const response = await fetch("/api/ai-generate-section", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          section_name: "Medical Documentation",
          custom_request: prompt,
          patient_data: patientData,
          api_key: doctorApiKey,
          api_provider: doctorApiProvider,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate response");
      }

      return response.json();
    },
    onSuccess: (data) => {
      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: data.generated_text,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = (message: string) => {
    if (!message.trim()) return;

    if (!doctorApiKey) {
      toast({
        title: "API Key Required",
        description: "Please add your API key in Doctor Profile settings",
        variant: "destructive",
      });
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: message,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");

    // Build context from conversation history
    const conversationContext = messages
      .slice(-6) // Last 6 messages for context
      .map((m) => `${m.role === "user" ? "Doctor" : "AI"}: ${m.content}`)
      .join("\n\n");

    const fullPrompt = conversationContext
      ? `Previous conversation:\n${conversationContext}\n\nDoctor's new request: ${message}`
      : message;

    aiMutation.mutate(fullPrompt);
  };

  const handleButtonClick = (button: ActionButton) => {
    handleSendMessage(button.command);
  };

  const startEditingButton = (button: ActionButton) => {
    setEditingButton(button.id);
    setEditLabel(button.label);
    setEditCommand(button.command);
  };

  const saveButtonEdit = () => {
    if (!editingButton) return;

    setButtons((prev) =>
      prev.map((btn) =>
        btn.id === editingButton
          ? { ...btn, label: editLabel, command: editCommand }
          : btn
      )
    );
    setEditingButton(null);
    setEditLabel("");
    setEditCommand("");
    toast({
      title: "Button Updated",
      description: "Your custom action has been saved",
    });
  };

  const cancelEdit = () => {
    setEditingButton(null);
    setEditLabel("");
    setEditCommand("");
  };

  const addNewButton = () => {
    const newButton: ActionButton = {
      id: Date.now().toString(),
      label: "New Action",
      command: "Enter your command here",
      icon: "Sparkles",
      color: "bg-gray-600",
    };
    setButtons((prev) => [...prev, newButton]);
    startEditingButton(newButton);
  };

  const deleteButton = (id: string) => {
    setButtons((prev) => prev.filter((btn) => btn.id !== id));
    if (editingButton === id) {
      cancelEdit();
    }
  };

  const resetToDefaults = () => {
    setButtons(defaultButtons);
    localStorage.removeItem("streamdeck-ai-buttons");
    toast({
      title: "Reset Complete",
      description: "Action buttons restored to defaults",
    });
  };

  const renderIcon = (iconName: string, className?: string) => {
    const IconComponent = iconMap[iconName] || Sparkles;
    return <IconComponent className={className || "h-5 w-5"} />;
  };

  return (
    <div className="h-full flex flex-col bg-[#0a0908]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[#2a2a2a]">
        <div>
          <h2 className="text-lg font-semibold text-[#e6e6e6]">AI Document Assistant</h2>
          <p className="text-sm text-[#666]">Stream Deck Style Interface</p>
        </div>
        <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="bg-[#1a1a1a] border-[#333] text-[#999] hover:bg-[#222]">
              <Settings className="h-4 w-4 mr-2" />
              Configure Buttons
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#1a1a1a] border-[#2a2a2a] max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-[#e6e6e6]">Configure Action Buttons</DialogTitle>
              <DialogDescription className="text-[#666]">
                Customize your Stream Deck buttons. Click a button to edit its label and command.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {buttons.map((button) => (
                <div key={button.id} className="flex items-center gap-3 p-3 bg-[#222] rounded-lg">
                  <div className={`p-2 rounded ${button.color}`}>
                    {renderIcon(button.icon, "h-4 w-4 text-white")}
                  </div>
                  <div className="flex-1">
                    <Input
                      value={editingButton === button.id ? editLabel : button.label}
                      onChange={(e) => setEditLabel(e.target.value)}
                      disabled={editingButton !== button.id}
                      className="mb-2 bg-[#1a1a1a] border-[#333] text-[#e6e6e6]"
                      placeholder="Button label"
                    />
                    <Textarea
                      value={editingButton === button.id ? editCommand : button.command}
                      onChange={(e) => setEditCommand(e.target.value)}
                      disabled={editingButton !== button.id}
                      className="bg-[#1a1a1a] border-[#333] text-[#e6e6e6] text-sm"
                      placeholder="AI command"
                      rows={2}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    {editingButton === button.id ? (
                      <>
                        <Button size="sm" onClick={saveButtonEdit} className="bg-green-600 hover:bg-green-700">
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={cancelEdit} className="border-[#333]">
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button size="sm" variant="outline" onClick={() => startEditingButton(button)} className="border-[#333]">
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => deleteButton(button.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-4 pt-4 border-t border-[#333]">
              <Button variant="outline" onClick={addNewButton} className="border-[#333] text-[#999]">
                <Plus className="h-4 w-4 mr-2" />
                Add Button
              </Button>
              <Button variant="outline" onClick={resetToDefaults} className="border-[#333] text-[#999]">
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset to Defaults
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Action Buttons */}
        <div className="w-32 p-2 space-y-2 border-r border-[#2a2a2a] overflow-y-auto">
          {buttons.slice(0, Math.ceil(buttons.length / 2)).map((button) => (
            <button
              key={button.id}
              onClick={() => handleButtonClick(button)}
              disabled={aiMutation.isPending}
              className={`w-full p-3 rounded-lg ${button.color} hover:opacity-90 transition-all duration-200 disabled:opacity-50 flex flex-col items-center justify-center gap-1 text-white shadow-lg hover:shadow-xl transform hover:scale-105`}
            >
              {renderIcon(button.icon, "h-5 w-5")}
              <span className="text-xs font-medium text-center leading-tight">{button.label}</span>
            </button>
          ))}
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <Sparkles className="h-12 w-12 text-[#8b5cf6] mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-[#e6e6e6] mb-2">Ready to Assist</h3>
                  <p className="text-sm text-[#666] max-w-md">
                    Click any action button or type a message to start generating medical documentation.
                    Your conversation history will maintain context for better results.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] p-4 rounded-lg ${
                        message.role === "user"
                          ? "bg-[#8b5cf6] text-white"
                          : "bg-[#1a1a1a] border border-[#2a2a2a] text-[#e6e6e6]"
                      }`}
                    >
                      <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                      <p className="text-xs mt-2 opacity-60">
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
                {aiMutation.isPending && (
                  <div className="flex justify-start">
                    <div className="bg-[#1a1a1a] border border-[#2a2a2a] p-4 rounded-lg">
                      <div className="flex items-center gap-2 text-[#8b5cf6]">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm">Generating response...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>

          {/* Input Area */}
          <div className="p-4 border-t border-[#2a2a2a]">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage(inputValue);
              }}
              className="flex gap-2"
            >
              <Textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Type your request or click an action button..."
                className="flex-1 bg-[#1a1a1a] border-[#333] text-[#e6e6e6] placeholder:text-[#666] resize-none"
                rows={2}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(inputValue);
                  }
                }}
              />
              <Button
                type="submit"
                disabled={aiMutation.isPending || !inputValue.trim() || !doctorApiKey}
                className="bg-[#8b5cf6] hover:bg-[#7c3aed] text-white self-end"
              >
                {aiMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </form>
            {!doctorApiKey && (
              <p className="text-xs text-amber-500 mt-2">
                Add your API key in Doctor Profile → API Integrations to enable AI features
              </p>
            )}
          </div>
        </div>

        {/* Right Action Buttons */}
        <div className="w-32 p-2 space-y-2 border-l border-[#2a2a2a] overflow-y-auto">
          {buttons.slice(Math.ceil(buttons.length / 2)).map((button) => (
            <button
              key={button.id}
              onClick={() => handleButtonClick(button)}
              disabled={aiMutation.isPending}
              className={`w-full p-3 rounded-lg ${button.color} hover:opacity-90 transition-all duration-200 disabled:opacity-50 flex flex-col items-center justify-center gap-1 text-white shadow-lg hover:shadow-xl transform hover:scale-105`}
            >
              {renderIcon(button.icon, "h-5 w-5")}
              <span className="text-xs font-medium text-center leading-tight">{button.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
