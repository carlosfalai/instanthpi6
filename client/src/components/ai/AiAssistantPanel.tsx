import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Loader2, Send, ChevronDown, ChevronUp, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { queryClient, apiRequest } from '@/lib/queryClient';

interface AiAssistantPanelProps {
  patientId: number;
  patientLanguage?: 'english' | 'french';
  onSendMessage?: (message: string) => void;
}

interface AIDocumentation {
  id: number;
  patientId: number;
  hpi: string | null;
  subjective: string | null;
  objective: string | null;
  assessment: string | null;
  plan: string | null;
  followUpQuestions: {
    questions: string[];
  } | null;
  prescription: {
    medications: {
      name: string;
      dosage: string;
      instructions: string;
    }[];
  } | null;
  isApproved: boolean | null;
}

interface Suggestion {
  id: string;
  content: string;
  selected: boolean;
}

export default function AiAssistantPanel({ 
  patientId, 
  patientLanguage = 'english',
  onSendMessage 
}: AiAssistantPanelProps) {
  const [selectedFollowUp, setSelectedFollowUp] = useState<string[]>([]);
  const [selectedPlans, setSelectedPlans] = useState<string[]>([]);
  const [customMessage, setCustomMessage] = useState('');
  
  // Fetch AI documentation for the patient
  const { 
    data: aiDoc, 
    isLoading: docLoading,
    error: docError
  } = useQuery<AIDocumentation>({
    queryKey: [`/api/ai/documentation/${patientId}`],
    enabled: !!patientId,
  });

  // Send the selected options or custom message
  const sendSuggestionsMutation = useMutation({
    mutationFn: async () => {
      // Compile the selected options into a single message
      let message = '';
      
      if (selectedFollowUp.length > 0) {
        message += selectedFollowUp.join('\n\n') + '\n\n';
      }
      
      if (selectedPlans.length > 0) {
        message += selectedPlans.join('\n\n');
      }
      
      if (customMessage) {
        message += (message ? '\n\n' : '') + customMessage;
      }
      
      if (onSendMessage && message) {
        onSendMessage(message);
        
        // Reset selections after sending
        setSelectedFollowUp([]);
        setSelectedPlans([]);
        setCustomMessage('');
      }
      
      return message;
    },
  });
  
  // Extract follow-up questions from AI documentation
  const followUpQuestions = aiDoc?.followUpQuestions?.questions || [];
  
  // Extract plan suggestions
  const planSuggestions = aiDoc?.plan 
    ? aiDoc.plan.split('\n').filter(line => line.trim().length > 0)
    : [];
  
  // Toggle a follow-up question selection
  const toggleFollowUp = (question: string) => {
    if (selectedFollowUp.includes(question)) {
      setSelectedFollowUp(selectedFollowUp.filter(q => q !== question));
    } else {
      setSelectedFollowUp([...selectedFollowUp, question]);
    }
  };
  
  // Toggle a plan suggestion selection
  const togglePlan = (plan: string) => {
    if (selectedPlans.includes(plan)) {
      setSelectedPlans(selectedPlans.filter(p => p !== plan));
    } else {
      setSelectedPlans([...selectedPlans, plan]);
    }
  };
  
  // Get any selected items to send
  const hasSelections = selectedFollowUp.length > 0 || selectedPlans.length > 0 || customMessage.trim().length > 0;
  
  // Is the send mutation in progress
  const isSending = sendSuggestionsMutation.isPending;
  
  // Helper for formatting SOAP sections
  const formatSOAP = (title: string, content: string | null) => {
    if (!content) return null;
    
    return (
      <div className="mb-4">
        <h3 className="font-medium text-lg mb-1">{title}</h3>
        <div className="text-sm text-gray-300 whitespace-pre-line">
          {content}
        </div>
      </div>
    );
  };
  
  return (
    <div className="h-full flex flex-col bg-[#121212] text-white">
      {/* Header */}
      <div className="bg-[#1e1e1e] p-4 border-b border-gray-800 flex items-center">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-blue-500" />
          <h2 className="font-semibold">AI Assistant</h2>
        </div>
        <div className="ml-auto text-xs text-gray-400">
          {patientLanguage === 'english' ? 'English' : 'Français'}
        </div>
      </div>
      
      {/* Content */}
      <ScrollArea className="flex-1 p-4">
        {docLoading && (
          <div className="flex flex-col items-center justify-center h-40 text-gray-400">
            <Loader2 className="h-8 w-8 animate-spin mb-2" />
            <p className="text-sm">Analyzing patient data...</p>
          </div>
        )}
        
        {docError && (
          <div className="text-red-400 text-center p-4">
            Failed to load AI documentation
          </div>
        )}
        
        {aiDoc && (
          <>
            {/* SOAP Notes */}
            <Accordion type="single" collapsible defaultValue="item-1" className="mb-6">
              <AccordionItem value="item-1" className="border-gray-800">
                <AccordionTrigger className="hover:no-underline hover:bg-[#262626] px-2 rounded-md">
                  <span className="text-sm font-medium">SOAP Notes</span>
                </AccordionTrigger>
                <AccordionContent className="px-2 py-2">
                  {formatSOAP("HPI", aiDoc.hpi)}
                  {formatSOAP("Subjective", aiDoc.subjective)}
                  {formatSOAP("Objective", aiDoc.objective)}
                  {formatSOAP("Assessment", aiDoc.assessment)}
                  {formatSOAP("Plan", aiDoc.plan)}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
            
            {/* Follow-up Questions */}
            {followUpQuestions.length > 0 && (
              <div className="mb-6">
                <h3 className="font-medium mb-3">Suggested Follow-up Questions</h3>
                <div className="space-y-2">
                  {followUpQuestions.map((question, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <Checkbox 
                        id={`question-${idx}`} 
                        checked={selectedFollowUp.includes(question)}
                        onCheckedChange={() => toggleFollowUp(question)}
                        className="mt-1"
                      />
                      <label 
                        htmlFor={`question-${idx}`}
                        className="text-sm cursor-pointer hover:text-blue-400 transition-colors"
                      >
                        {question}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Plan Suggestions */}
            {planSuggestions.length > 0 && (
              <div className="mb-6">
                <h3 className="font-medium mb-3">Plan Suggestions</h3>
                <div className="space-y-2">
                  {planSuggestions.map((plan, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <Checkbox 
                        id={`plan-${idx}`} 
                        checked={selectedPlans.includes(plan)}
                        onCheckedChange={() => togglePlan(plan)}
                        className="mt-1"
                      />
                      <label 
                        htmlFor={`plan-${idx}`}
                        className="text-sm cursor-pointer hover:text-blue-400 transition-colors"
                      >
                        {plan}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Prescription Suggestions */}
            {aiDoc.prescription && aiDoc.prescription.medications.length > 0 && (
              <div className="mb-6">
                <h3 className="font-medium mb-3">Prescription Suggestions</h3>
                <div className="space-y-3">
                  {aiDoc.prescription.medications.map((med, idx) => (
                    <div 
                      key={idx} 
                      className="bg-[#1e1e1e] border border-gray-800 rounded-md p-3"
                    >
                      <div className="font-medium text-sm">{med.name}</div>
                      <div className="text-sm text-gray-400">{med.dosage}</div>
                      <div className="text-xs text-gray-500 mt-1">{med.instructions}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </ScrollArea>
      
      {/* Message input */}
      <div className="p-3 bg-[#1e1e1e] border-t border-gray-800">
        <Textarea
          placeholder="Write a custom message..."
          value={customMessage}
          onChange={(e) => setCustomMessage(e.target.value)}
          className="resize-none mb-3 bg-[#262626] border-gray-700 focus:border-blue-500 text-white"
          rows={2}
        />
        <div className="flex justify-between">
          <div className="text-xs text-gray-500">
            {selectedFollowUp.length > 0 && <span>{selectedFollowUp.length} questions</span>}
            {selectedFollowUp.length > 0 && selectedPlans.length > 0 && <span> • </span>}
            {selectedPlans.length > 0 && <span>{selectedPlans.length} plans</span>}
          </div>
          <Button
            disabled={!hasSelections || isSending}
            onClick={() => sendSuggestionsMutation.mutate()}
            className="px-3 py-1"
          >
            {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            <span className="ml-2">Send</span>
          </Button>
        </div>
      </div>
    </div>
  );
}