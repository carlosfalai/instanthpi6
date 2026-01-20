import React, { useState, useRef, useEffect } from "react";
import { EliteCard } from "./EliteCard";
import { EliteButton } from "./EliteButton";
import {
  Bot,
  Send,
  X,
  Sparkles,
  Languages,
  Eraser,
  Zap,
  FileText,
  Pill,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ReportSection } from "./EliteResultDashboard";
import { EliteDocumentPreview } from "./EliteDocumentPreview";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface ActionSuggestion {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  prompt: string;
}

interface EliteAIChatProps {
  isOpen: boolean;
  onClose: () => void;
  currentSections: ReportSection[];
  onUpdateSections: (newSections: ReportSection[]) => void;
}

export function EliteAIChat({
  isOpen,
  onClose,
  currentSections,
  onUpdateSections,
}: EliteAIChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "I'm your Clinical Co-pilot. I'm analyzing the report to prepare your next steps...",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [suggestions, setSuggestions] = useState<ActionSuggestion[]>([]);

  // Document Preview State
  const [showDocPreview, setShowDocPreview] = useState(false);
  const [activeDoc, setActiveDoc] = useState<{ title: string; content: string }>({
    title: "",
    content: "",
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Predictive Logic Engine
  useEffect(() => {
    if (!isOpen) return;

    const newSuggestions: ActionSuggestion[] = [];
    const planSection = currentSections.find(
      (s) => s.id === "plan" || s.id === "assessment" || s.id === "soap"
    );
    const content = planSection?.content.toLowerCase() || "";

    // Predict: Referral
    if (
      content.includes("refer") ||
      content.includes("specialist") ||
      content.includes("ent") ||
      content.includes("cardio")
    ) {
      newSuggestions.push({
        id: "referral",
        title: "Draft Referral Letter",
        description: "Detected recommendation for specialist.",
        icon: FileText,
        prompt: "Draft a professional referral letter based on this consultation.",
      });
    }

    // Predict: Prescription
    if (
      content.includes("mg") ||
      content.includes("po") ||
      content.includes("bid") ||
      content.includes("tid") ||
      content.includes("medication") ||
      content.includes("phosphomycin")
    ) {
      newSuggestions.push({
        id: "rx",
        title: "Prepare Prescription",
        description: "Medications (e.g. Phosphomycin) detected.",
        icon: Pill,
        prompt: "ACTION_RX", // Special flag
      });
    }

    // Predict: Work Note
    if (
      content.includes("work") ||
      content.includes("school") ||
      content.includes("off") ||
      content.includes("leave")
    ) {
      newSuggestions.push({
        id: "note",
        title: "Draft Sick Note",
        description: "Work/School absence mentioned.",
        icon: FileText,
        prompt: "Draft a medical excuse note for work/school.",
      });
    }

    setSuggestions(newSuggestions);
  }, [currentSections, isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setIsProcessing(true);

    try {
      // Mock AI processing - in production this would hit the Haiku 4.5 API
      // We simulate specific commands for demonstration

      setTimeout(() => {
        let responseContent = "I've processed your request.";
        let updated = false;
        const lowerInput = userMsg.content.toLowerCase();

        if (lowerInput.includes("french") || lowerInput.includes("translate")) {
          responseContent =
            "Je suis prêt. I have translated the Patient Message and Plan to French as requested.";

          // Simulate updating the sections
          const newSections = currentSections.map((s) => {
            if (s.id === "patient-msg" || s.id === "edu" || s.id === "plan") {
              return { ...s, content: `[TRADUIT EN FRANÇAIS]\n${s.content}` };
            }
            return s;
          });
          onUpdateSections(newSections);
          updated = true;
        } else if (lowerInput.includes("concise") || lowerInput.includes("shorter")) {
          responseContent = "I've condensed the Assessment and Plan sections for brevity.";
          const newSections = currentSections.map((s) => {
            if (s.id === "assessment" || s.id === "plan") {
              return { ...s, content: `[CONDENSED]\n${s.content.substring(0, 100)}...` };
            }
            return s;
          });
          onUpdateSections(newSections);
          updated = true;
        } else {
          responseContent =
            "I can help you refine the report. Try asking me to 'Translate to French' or 'Make it concise'.";
        }

        const aiMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: responseContent,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, aiMsg]);
        setIsProcessing(false);
      }, 1000);
    } catch (error) {
      console.error("AI Error", error);
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-[#0a0a0a]/95 backdrop-blur-xl border-l border-white/10 shadow-2xl z-[60] flex flex-col animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/20">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
            <Bot className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="font-bold text-sm">Case Co-pilot</h3>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] text-muted-foreground">Haiku 4.5 Active</span>
            </div>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* Predictive Actions Panel */}
      {suggestions.length > 0 && (
        <div className="p-3 bg-primary/10 border-b border-primary/20">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-3 h-3 text-primary" />
            <span className="text-[10px] font-bold text-primary uppercase tracking-wider">
              Suggested Next Steps
            </span>
          </div>
          <div className="space-y-2">
            {suggestions.map((action) => (
              <button
                key={action.id}
                onClick={() => {
                  if (action.prompt.startsWith("ACTION_")) {
                    // Handle Smart Actions
                    const type = action.prompt.split("_")[1];
                    let title = "Document";
                    let content = "Generated content...";

                    if (type === "REFERRAL") {
                      title = "Referral Letter";
                      content =
                        "To Whom It May Concern,\n\nI am referring this patient for further evaluation regarding their condition.\n\nSincerely,\nDr. Carlos Faviel Font";
                    } else if (type === "NOTE") {
                      title = "Medical Certificate";
                      content =
                        "To Employer/School,\n\nThis patient is under my care and requires leave from work/school for 3 days.\n\nSincerely,\nDr. Carlos Faviel Font";
                    }

                    setActiveDoc({ title, content });
                    setShowDocPreview(true);
                  } else {
                    setInputValue(action.prompt);
                    handleSendMessage();
                  }
                }}
                className="w-full text-left bg-black/40 hover:bg-primary/20 border border-primary/10 hover:border-primary/30 p-2 rounded-lg transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <action.icon className="w-4 h-4 text-primary" />
                    <span className="font-bold text-xs text-foreground">{action.title}</span>
                  </div>
                  <ArrowRight className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <div className="text-[10px] text-muted-foreground ml-6 mt-0.5">
                  {action.description}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "flex gap-3 max-w-[90%]",
              msg.role === "user" ? "ml-auto flex-row-reverse" : ""
            )}
          >
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs",
                msg.role === "assistant" ? "bg-primary/20 text-primary" : "bg-white/10 text-white"
              )}
            >
              {msg.role === "assistant" ? <Bot className="w-4 h-4" /> : "Dr"}
            </div>
            <div
              className={cn(
                "p-3 rounded-2xl text-sm leading-relaxed shadow-sm",
                msg.role === "user"
                  ? "bg-primary text-primary-foreground rounded-tr-sm"
                  : "bg-white/5 border border-white/5 rounded-tl-sm text-foreground"
              )}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {isProcessing && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-primary animate-spin" />
            </div>
            <div className="bg-white/5 border border-white/5 rounded-2xl rounded-tl-sm p-3 flex items-center gap-1">
              <span
                className="w-1.5 h-1.5 bg-primary/50 rounded-full animate-bounce"
                style={{ animationDelay: "0ms" }}
              />
              <span
                className="w-1.5 h-1.5 bg-primary/50 rounded-full animate-bounce"
                style={{ animationDelay: "150ms" }}
              />
              <span
                className="w-1.5 h-1.5 bg-primary/50 rounded-full animate-bounce"
                style={{ animationDelay: "300ms" }}
              />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-white/10 bg-black/20">
        {messages.length === 1 && (
          <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
            <button
              onClick={() => setInputValue("Translate report to French")}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-xs whitespace-nowrap transition-colors"
            >
              <Languages className="w-3 h-3 text-blue-400" /> Translate to French
            </button>
            <button
              onClick={() => setInputValue("Make the plan more concise")}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-xs whitespace-nowrap transition-colors"
            >
              <Eraser className="w-3 h-3 text-purple-400" /> Condense Plan
            </button>
          </div>
        )}
        <div className="relative">
          <input
            className="w-full bg-black/40 border border-white/10 rounded-xl pl-4 pr-12 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
            placeholder="Type a command..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
            autoFocus
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isProcessing}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <div className="text-[10px] text-center text-muted-foreground mt-2">
          Press <kbd className="font-mono bg-white/10 px-1 rounded">Enter</kbd> to send
        </div>
      </div>

      <EliteDocumentPreview
        isOpen={showDocPreview}
        onClose={() => setShowDocPreview(false)}
        documentTitle={activeDoc.title}
        documentContent={activeDoc.content}
        patientName="Jean Tremblay"
      />
    </div>
  );
}
