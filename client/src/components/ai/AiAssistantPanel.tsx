import { useState, useRef, useEffect } from "react";
import { Send, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import axios from "axios";

interface AiAssistantPanelProps {
  patientLanguage: "french" | "english";
  patientId: number;
  onSendMessage: (message: string) => void;
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
  const responseRef = useRef<HTMLDivElement>(null);

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
        <p className="text-sm text-gray-400">Ask for help writing a concise response</p>
      </div>
      
      {/* AI Output Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {generatedResponse ? (
          <Card className="p-4 bg-[#2a2a2a] border-gray-700">
            <p className="text-white whitespace-pre-wrap">{generatedResponse}</p>
            <div className="flex justify-end mt-4">
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
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <p>Ask the AI to help craft a response</p>
          </div>
        )}
        <div ref={responseRef} />
      </div>
      
      {/* Input Area */}
      <div className="p-4 border-t border-gray-800">
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={`What would you like to say to the patient? (Response will be in ${patientLanguage === 'french' ? 'French' : 'English'})`}
          className="bg-[#2a2a2a] border-gray-700 text-white resize-none"
          rows={4}
        />
        <div className="flex justify-end mt-2">
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