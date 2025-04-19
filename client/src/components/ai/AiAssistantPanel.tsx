import { useState, useRef, useEffect } from "react";
import { Send, Check, Loader2, Copy, CheckSquare, FileText, ClipboardList, PenSquare, BadgeCheck, Stethoscope, BrainCircuit, ChevronDown, ChevronUp, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import axios from "axios";

interface AiAssistantPanelProps {
  patientLanguage: "french" | "english";
  patientId: number;
  onSendMessage: (message: string) => void;
}

interface AiSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  enabled: boolean;
  content: string;
}

export default function AiAssistantPanel({ 
  patientLanguage, 
  patientId, 
  onSendMessage 
}: AiAssistantPanelProps) {
  const [prompt, setPrompt] = useState("");
  const [generatedResponse, setGeneratedResponse] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const responseRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Sample AI sections that would be controlled by toggles in physician settings
  const [aiSections, setAiSections] = useState<AiSection[]>([
    {
      id: "soap-note",
      title: "SOAP Note",
      icon: <FileText className="h-4 w-4" />,
      enabled: true,
      content: patientLanguage === 'french' 
        ? "S: Patient se plaint de douleur abdominale depuis 3 jours avec nausées occasionnelles.\nO: Abdomen sensible au quadrant inférieur droit. Température 37.8°C.\nA: Suspicion d'appendicite aiguë. Besoin d'examens complémentaires.\nP: Référer aux urgences pour évaluation chirurgicale. Analyses sanguines et scanner abdominal recommandés."
        : "S: Patient complains of abdominal pain for 3 days with occasional nausea.\nO: Tender abdomen in right lower quadrant. Temperature 37.8°C.\nA: Suspected acute appendicitis. Further evaluation needed.\nP: Refer to ER for surgical evaluation. Blood tests and abdominal CT scan recommended."
    },
    {
      id: "hpi-summary",
      title: "HPI Summary",
      icon: <ClipboardList className="h-4 w-4" />,
      enabled: true,
      content: patientLanguage === 'french'
        ? "Nicolas Girard, homme de 43 ans, présente des douleurs abdominales depuis 3 jours. La douleur a commencé dans la région péri-ombilicale et s'est déplacée vers le quadrant inférieur droit. Il rapporte des nausées sans vomissements et une perte d'appétit. Aucun antécédent d'intervention chirurgicale abdominale. Pas de fièvre signalée à domicile."
        : "Nicolas Girard, a 43-year-old male, presents with abdominal pain for 3 days. Pain started in the periumbilical region and migrated to the right lower quadrant. He reports nausea without vomiting and loss of appetite. No history of abdominal surgeries. No fever reported at home."
    },
    {
      id: "documentation",
      title: "Recommended Documentation",
      icon: <PenSquare className="h-4 w-4" />,
      enabled: true,
      content: patientLanguage === 'french'
        ? "Documenter l'historique complet de la douleur, y compris la localisation, l'intensité et les facteurs aggravants. Noter les antécédents médicaux pertinents, en particulier les problèmes gastro-intestinaux antérieurs. Inclure l'évaluation complète de l'abdomen et les signes vitaux. Documenter le plan de traitement et les instructions données au patient."
        : "Document complete pain history including location, intensity, and aggravating factors. Note relevant medical history, particularly previous gastrointestinal issues. Include complete abdominal assessment and vital signs. Document treatment plan and instructions given to patient."
    },
    {
      id: "differential-diagnosis",
      title: "Differential Diagnosis",
      icon: <Stethoscope className="h-4 w-4" />,
      enabled: true,
      content: patientLanguage === 'french'
        ? "1. Appendicite aiguë\n2. Diverticulite\n3. Calculs rénaux\n4. Gastro-entérite\n5. Colique biliaire\n6. Adénite mésentérique"
        : "1. Acute appendicitis\n2. Diverticulitis\n3. Kidney stones\n4. Gastroenteritis\n5. Biliary colic\n6. Mesenteric adenitis"
    },
    {
      id: "ai-analysis",
      title: "AI Analysis",
      icon: <BrainCircuit className="h-4 w-4" />,
      enabled: true,
      content: patientLanguage === 'french'
        ? "Les symptômes du patient sont fortement évocateurs d'une appendicite aiguë. La migration de la douleur vers le quadrant inférieur droit est un signe classique (signe de Blumberg). La présence de nausées sans diarrhée importante soutient davantage ce diagnostic. Recommandation d'une évaluation chirurgicale urgente compte tenu de la durée des symptômes (3 jours), ce qui augmente le risque de perforation."
        : "Patient's symptoms are highly suggestive of acute appendicitis. The migration of pain to the right lower quadrant is a classic sign (Blumberg's sign). The presence of nausea without significant diarrhea further supports this diagnosis. Recommendation for urgent surgical evaluation given the duration of symptoms (3 days), which increases the risk of perforation."
    }
  ]);

  // Function to generate AI response
  const generateResponse = async () => {
    if (!prompt.trim()) return;
    
    setIsGenerating(true);
    setGeneratedResponse("");
    
    try {
      // We're using Anthropic's Claude model as it has strong multilingual capabilities
      // but this would use whatever AI model you prefer
      const response = await axios.post('/api/ai/generate', {
        prompt,
        patientId,
        patientLanguage,
        maxLength: 5 // Maximum of 5 sentences
      });
      
      setGeneratedResponse(response.data.text);
    } catch (error) {
      console.error("Error generating AI response:", error);
      // For demo purposes, let's provide a fallback response
      const fallbackResponse = patientLanguage === 'french' 
        ? "Merci pour votre message. Je comprends votre préoccupation et je vais l'examiner attentivement. Veuillez prendre votre médicament comme prescrit. Si vous avez d'autres symptômes, appelez notre clinique immédiatement. Je reste disponible pour toute question."
        : "Thank you for your message. I understand your concern and will review it carefully. Please take your medication as prescribed. If you have any additional symptoms, call our clinic immediately. I'm available for any questions.";
      
      setGeneratedResponse(fallbackResponse);
    } finally {
      setIsGenerating(false);
    }
  };

  // Function to send the generated response to the patient
  const sendResponseToPatient = () => {
    if (!generatedResponse) return;
    
    setIsSending(true);
    onSendMessage(generatedResponse);
    
    // Clear the generated response after sending
    setTimeout(() => {
      setGeneratedResponse("");
      setPrompt("");
      setIsSending(false);
    }, 1000);
  };

  // Function to copy code to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  // Toggle AI section
  const toggleSection = (id: string) => {
    setAiSections(
      aiSections.map(section => 
        section.id === id ? { ...section, enabled: !section.enabled } : section
      )
    );
  };

  // Auto scroll to the bottom when requested
  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Auto scroll to the bottom of the response when it changes
  useEffect(() => {
    if (responseRef.current) {
      responseRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [generatedResponse]);

  return (
    <div className="flex flex-col h-full bg-[#1a1a1a] border-r border-gray-800">
      <div className="p-4 border-b border-gray-800">
        <h2 className="text-lg font-semibold text-white">AI Assistant</h2>
        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-400">Patient: Nicolas Girard</p>
          <Badge className="bg-blue-600">{patientLanguage === 'french' ? 'French' : 'English'}</Badge>
        </div>
      </div>
      
      {/* Scrollable AI Sections Container */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* AI Generated Sections */}
          {aiSections.filter(section => section.enabled).map((section) => (
            <Collapsible key={section.id} className="w-full" defaultOpen={true}>
              <div className="flex items-center justify-between space-x-4 px-4 py-2 bg-[#232323] rounded-t-lg border border-gray-700">
                <div className="flex items-center space-x-2">
                  {section.icon}
                  <h3 className="font-medium text-white">{section.title}</h3>
                </div>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="p-0 h-7 w-7">
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  </Button>
                </CollapsibleTrigger>
              </div>
              <CollapsibleContent>
                <div className="p-4 bg-[#2a2a2a] border-x border-b border-gray-700 rounded-b-lg">
                  <pre className="whitespace-pre-wrap text-sm text-white font-mono bg-[#1e1e1e] p-3 rounded-md">
                    {section.content}
                  </pre>
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))}
          
          {/* Generated Response Card */}
          {generatedResponse && (
            <Card className="p-4 bg-[#2a2a2a] border-gray-700 mb-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-white">Generated Response</h3>
                <Badge className="bg-green-600">Ready to send</Badge>
              </div>
              <pre 
                className="whitespace-pre-wrap text-sm text-white font-mono bg-[#1e1e1e] p-3 rounded-md mb-4 cursor-pointer relative"
                onClick={() => copyToClipboard(generatedResponse)}
              >
                {generatedResponse}
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="absolute top-2 right-2 h-6 bg-gray-800/50 hover:bg-gray-800"
                  onClick={(e) => {
                    e.stopPropagation();
                    copyToClipboard(generatedResponse);
                  }}
                >
                  {copiedText ? (
                    <CheckSquare className="h-3 w-3 text-green-500" />
                  ) : (
                    <Copy className="h-3 w-3 text-gray-400" />
                  )}
                </Button>
              </pre>
              <div className="flex justify-end">
                <Button
                  onClick={sendResponseToPatient}
                  className="bg-green-600 hover:bg-green-700 text-white"
                  disabled={isSending}
                >
                  {isSending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Check className="h-4 w-4 mr-2" />
                  )}
                  Send to Patient
                </Button>
              </div>
            </Card>
          )}
          
          {/* Spacer to allow scrolling content to the top */}
          <div className="h-4" ref={bottomRef}></div>
        </div>
      </ScrollArea>
      
      {/* Input Area */}
      <div className="p-4 border-t border-gray-800">
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ask the AI to write a response or generate any other content..."
          className="bg-[#2a2a2a] border-gray-700 text-white resize-none"
          rows={3}
        />
        <div className="flex justify-between mt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={scrollToBottom}
            className="text-gray-400 border-gray-700"
          >
            <ChevronDown className="h-4 w-4 mr-1" />
            Scroll to Bottom
          </Button>
          
          <Button
            onClick={generateResponse}
            className="bg-blue-600 hover:bg-blue-700"
            disabled={!prompt.trim() || isGenerating}
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            {isGenerating ? 'Generating...' : 'Generate Response'}
          </Button>
        </div>
      </div>
    </div>
  );
}