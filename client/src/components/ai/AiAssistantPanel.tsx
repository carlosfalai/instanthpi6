import React, { useState, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { SendHorizontal, Loader2, Sparkles, X, MessageSquare, FileText, Clipboard, ClipboardList, Mail, Languages, Copy } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface AiAssistantPanelProps {
  patientId: number;
  language: 'english' | 'french';
  onSendMessage: (content: string) => void;
}

interface SuggestionItem {
  id: string;
  text: string;
  type: string;
  isSelected?: boolean;
}

interface TreatmentItem {
  id: string;
  text: string;
  category: 'medication' | 'imaging' | 'labs' | 'referral' | 'followup';
  isSelected: boolean;
}

interface ActionItem {
  id: string;
  text: string;
  type: 'message_patient' | 'soap_note' | 'french_note';
  isSelected: boolean;
}

export default function AiAssistantPanel({ 
  patientId, 
  language, 
  onSendMessage 
}: AiAssistantPanelProps) {
  const { toast } = useToast();
  const [customPrompt, setCustomPrompt] = useState('');
  const [selectedSuggestions, setSelectedSuggestions] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<'suggestions' | 'plan' | 'custom'>('plan');
  const [previewContent, setPreviewContent] = useState<string>('');
  
  // Treatment plan items with checkboxes
  const [treatmentItems, setTreatmentItems] = useState<TreatmentItem[]>([
    { id: 'med1', text: 'Trial NSAID (e.g., ibuprofen) ± acetaminophen', category: 'medication', isSelected: false },
    { id: 'med2', text: 'Consider muscle relaxant if spasms present', category: 'medication', isSelected: false },
    { id: 'med3', text: 'Topical analgesic cream/patch to affected area', category: 'medication', isSelected: false },
    { id: 'img1', text: 'Lumbar MRI with and without IV contrast', category: 'imaging', isSelected: false },
    { id: 'img2', text: 'X-ray of affected area to rule out structural issues', category: 'imaging', isSelected: false },
    { id: 'lab1', text: 'CBC, ESR, CRP to evaluate for infection/inflammation', category: 'labs', isSelected: false },
    { id: 'lab2', text: 'Basic metabolic panel', category: 'labs', isSelected: false },
    { id: 'ref1', text: 'Physical therapy referral', category: 'referral', isSelected: false },
    { id: 'ref2', text: 'Pain management specialist consultation', category: 'referral', isSelected: false },
    { id: 'fup1', text: 'Follow up in 2 weeks to reassess symptoms', category: 'followup', isSelected: false },
  ]);
  
  // Action items with checkboxes
  const [actionItems, setActionItems] = useState<ActionItem[]>([
    { id: 'action1', text: 'Prepare message for patient', type: 'message_patient', isSelected: false },
    { id: 'action2', text: 'Prepare SOAP note', type: 'soap_note', isSelected: false },
    { id: 'action3', text: 'Prepare super spartan note in French', type: 'french_note', isSelected: false },
  ]);
  
  // Query for AI suggestions
  const { 
    data: suggestions = [], 
    isLoading: suggestionsLoading 
  } = useQuery<SuggestionItem[]>({
    queryKey: ['/api/ai/suggestions', patientId, language],
    enabled: !!patientId,
  });
  
  // Group suggestions by type
  const followUpSuggestions = suggestions.filter(s => s.type === 'followup');
  const responseSuggestions = suggestions.filter(s => s.type === 'response');
  const planSuggestions = suggestions.filter(s => s.type === 'plan');
  
  // Generate custom prompt mutation
  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/ai/generate', {
        prompt: customPrompt,
        patientId,
        patientLanguage: language,
        maxLength: 5
      });
      return await res.json();
    },
    onSuccess: (data) => {
      if (data?.text) {
        onSendMessage(data.text);
        setCustomPrompt('');
      }
    },
  });
  
  // Send selected suggestions
  const sendSelectedSuggestions = () => {
    const selectedItems = suggestions.filter(s => selectedSuggestions[s.id]);
    if (selectedItems.length === 0) return;
    
    // Combine selected items into a single message
    let message = '';
    
    const planItems = selectedItems.filter(s => s.type === 'plan');
    if (planItems.length > 0) {
      const planHeader = language === 'french' ? 'Plan:' : 'Plan:';
      message += `${planHeader}\n`;
      planItems.forEach(item => {
        message += `• ${item.text}\n`;
      });
      message += '\n';
    }
    
    const followUpItems = selectedItems.filter(s => s.type === 'followup');
    if (followUpItems.length > 0) {
      const followUpHeader = language === 'french' ? 'Questions de suivi:' : 'Follow-up questions:';
      message += `${followUpHeader}\n`;
      followUpItems.forEach(item => {
        message += `• ${item.text}\n`;
      });
    }
    
    // Send the combined message
    if (message) {
      onSendMessage(message.trim());
      // Clear selections
      setSelectedSuggestions({});
    }
  };
  
  // Toggle suggestion selection
  const toggleSuggestion = (id: string) => {
    setSelectedSuggestions(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };
  
  return (
    <div className="flex flex-col h-full bg-[#121212] text-white">
      <Tabs defaultValue="suggestions" className="h-full flex flex-col" onValueChange={(value) => setActiveTab(value as any)}>
        <div className="p-3 bg-[#1e1e1e] border-b border-gray-800">
          <h2 className="font-semibold mb-3">AI Assistant</h2>
          <TabsList className="w-full bg-[#262626]">
            <TabsTrigger value="suggestions" className="flex-1 data-[state=active]:bg-blue-600">
              <Sparkles className="h-4 w-4 mr-2" />
              Suggestions
            </TabsTrigger>
            <TabsTrigger value="plan" className="flex-1 data-[state=active]:bg-blue-600">
              <ClipboardList className="h-4 w-4 mr-2" />
              Plan
            </TabsTrigger>
            <TabsTrigger value="custom" className="flex-1 data-[state=active]:bg-blue-600">
              <MessageSquare className="h-4 w-4 mr-2" />
              Custom
            </TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="suggestions" className="flex-1 flex flex-col p-0 m-0 overflow-hidden">
          <ScrollArea className="flex-1 p-4 overflow-auto">
            {suggestionsLoading ? (
              <div className="flex justify-center items-center h-32">
                <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
              </div>
            ) : (
              <>
                {followUpSuggestions.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-400 mb-2">
                      {language === 'french' ? 'Questions de suivi' : 'Follow-up Questions'}
                    </h3>
                    <div className="space-y-2">
                      {followUpSuggestions.map((suggestion) => (
                        <div 
                          key={suggestion.id}
                          className="flex items-start p-2 rounded bg-[#1e1e1e] hover:bg-[#262626]"
                        >
                          <Checkbox
                            checked={!!selectedSuggestions[suggestion.id]}
                            onCheckedChange={() => toggleSuggestion(suggestion.id)}
                            className="mr-3 mt-1"
                          />
                          <div>{suggestion.text}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {planSuggestions.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-400 mb-2">
                      {language === 'french' ? 'Plan' : 'Plan'}
                    </h3>
                    <div className="space-y-2">
                      {planSuggestions.map((suggestion) => (
                        <div 
                          key={suggestion.id}
                          className="flex items-start p-2 rounded bg-[#1e1e1e] hover:bg-[#262626]"
                        >
                          <Checkbox
                            checked={!!selectedSuggestions[suggestion.id]}
                            onCheckedChange={() => toggleSuggestion(suggestion.id)}
                            className="mr-3 mt-1"
                          />
                          <div>{suggestion.text}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {responseSuggestions.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-400 mb-2">
                      {language === 'french' ? 'Réponses proposées' : 'Suggested Responses'}
                    </h3>
                    <div className="space-y-2">
                      {responseSuggestions.map((suggestion) => (
                        <div 
                          key={suggestion.id}
                          className="p-2 rounded bg-[#1e1e1e] hover:bg-[#262626]"
                        >
                          <Button
                            variant="ghost"
                            className="w-full justify-start text-left font-normal h-auto whitespace-normal"
                            onClick={() => onSendMessage(suggestion.text)}
                          >
                            {suggestion.text}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {suggestions.length === 0 && (
                  <div className="text-gray-500 text-center">
                    No suggestions available for this patient yet
                  </div>
                )}
              </>
            )}
          </ScrollArea>
          
          {/* Send button for selected suggestions */}
          {Object.values(selectedSuggestions).some(v => v) && (
            <div className="p-3 bg-[#1e1e1e] border-t border-gray-800 flex justify-between items-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedSuggestions({})}
                className="text-xs"
              >
                <X className="h-3 w-3 mr-1" /> Clear Selection
              </Button>
              
              <Button
                onClick={sendSelectedSuggestions}
                size="sm"
                className="text-xs"
              >
                <SendHorizontal className="h-3 w-3 mr-1" /> Send Selected
              </Button>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="plan" className="flex-1 flex flex-col p-0 m-0 overflow-hidden">
          <ScrollArea className="flex-1 p-4 overflow-auto">
            {/* Current Complaint Box */}
            <div className="mb-4">
              <Card className="bg-[#1e1e1e] border-gray-800">
                <CardHeader className="pb-2 border-b border-gray-800">
                  <CardTitle className="text-md font-medium text-blue-400 flex items-center">
                    <Clipboard className="h-4 w-4 mr-2" />
                    Current Complaint
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-3">
                  <div className="text-sm text-white">
                    <p>{'Just to verify this with you beforehand, you are a [Age]-year-old [Gender] experiencing [Description] located in the [Location] that began on [Symptom] [Onset].'}</p>
                    <Button 
                      variant="ghost" 
                      className="text-xs text-blue-400 p-1 h-auto mt-2"
                      onClick={() => {
                        const confirmationText = "Here's a summary of what we discussed for confirmation: [HPI Confirmation]";
                        onSendMessage(confirmationText);
                        setPreviewContent(prevContent => prevContent + 
                          (prevContent ? '\n\n' : '') + 
                          '📋 HPI Confirmation Added');
                      }}
                    >
                      <Clipboard className="h-3 w-3 mr-1" />
                      Use template
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Treatment Plan with Checkboxes */}
            <div className="mb-4">
              <Card className="bg-[#1e1e1e] border-gray-800">
                <CardHeader className="pb-2 border-b border-gray-800">
                  <CardTitle className="text-md font-medium text-purple-400 flex items-center">
                    <ClipboardList className="h-4 w-4 mr-2" />
                    Treatment Plan
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-3">
                  <div className="text-sm text-white">
                    <div className="mb-3">
                      <h4 className="font-medium text-gray-400 mb-1">Medications</h4>
                      <div className="space-y-1.5">
                        {treatmentItems
                          .filter(item => item.category === 'medication')
                          .map((item) => (
                            <div key={item.id} className="flex items-center">
                              <Checkbox 
                                id={item.id}
                                checked={item.isSelected}
                                onCheckedChange={(checked) => {
                                  setTreatmentItems(prev => 
                                    prev.map(i => i.id === item.id ? {...i, isSelected: !!checked} : i)
                                  );
                                }}
                                className="mr-2"
                              />
                              <Label htmlFor={item.id} className="text-sm font-normal cursor-pointer">
                                {item.text}
                              </Label>
                            </div>
                          ))
                        }
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <h4 className="font-medium text-gray-400 mb-1">Imaging</h4>
                      <div className="space-y-1.5">
                        {treatmentItems
                          .filter(item => item.category === 'imaging')
                          .map((item) => (
                            <div key={item.id} className="flex items-center">
                              <Checkbox 
                                id={item.id}
                                checked={item.isSelected}
                                onCheckedChange={(checked) => {
                                  setTreatmentItems(prev => 
                                    prev.map(i => i.id === item.id ? {...i, isSelected: !!checked} : i)
                                  );
                                }}
                                className="mr-2"
                              />
                              <Label htmlFor={item.id} className="text-sm font-normal cursor-pointer">
                                {item.text}
                              </Label>
                            </div>
                          ))
                        }
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <h4 className="font-medium text-gray-400 mb-1">Labs</h4>
                      <div className="space-y-1.5">
                        {treatmentItems
                          .filter(item => item.category === 'labs')
                          .map((item) => (
                            <div key={item.id} className="flex items-center">
                              <Checkbox 
                                id={item.id}
                                checked={item.isSelected}
                                onCheckedChange={(checked) => {
                                  setTreatmentItems(prev => 
                                    prev.map(i => i.id === item.id ? {...i, isSelected: !!checked} : i)
                                  );
                                }}
                                className="mr-2"
                              />
                              <Label htmlFor={item.id} className="text-sm font-normal cursor-pointer">
                                {item.text}
                              </Label>
                            </div>
                          ))
                        }
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <h4 className="font-medium text-gray-400 mb-1">Referrals & Follow-up</h4>
                      <div className="space-y-1.5">
                        {treatmentItems
                          .filter(item => item.category === 'referral' || item.category === 'followup')
                          .map((item) => (
                            <div key={item.id} className="flex items-center">
                              <Checkbox 
                                id={item.id}
                                checked={item.isSelected}
                                onCheckedChange={(checked) => {
                                  setTreatmentItems(prev => 
                                    prev.map(i => i.id === item.id ? {...i, isSelected: !!checked} : i)
                                  );
                                }}
                                className="mr-2"
                              />
                              <Label htmlFor={item.id} className="text-sm font-normal cursor-pointer">
                                {item.text}
                              </Label>
                            </div>
                          ))
                        }
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-3 border-t border-gray-800">
                      <h4 className="font-medium text-gray-400 mb-2">Actions</h4>
                      <div className="space-y-2">
                        {actionItems.map((item) => (
                          <div key={item.id} className="flex items-center">
                            <Checkbox 
                              id={item.id}
                              checked={item.isSelected}
                              onCheckedChange={(checked) => {
                                setActionItems(prev => 
                                  prev.map(i => i.id === item.id ? {...i, isSelected: !!checked} : i)
                                );
                              }}
                              className="mr-2"
                            />
                            <Label htmlFor={item.id} className="text-sm font-normal cursor-pointer flex items-center">
                              {item.type === 'message_patient' && <Mail className="h-3.5 w-3.5 mr-1.5 text-blue-400" />}
                              {item.type === 'soap_note' && <FileText className="h-3.5 w-3.5 mr-1.5 text-green-400" />}
                              {item.type === 'french_note' && <Languages className="h-3.5 w-3.5 mr-1.5 text-purple-400" />}
                              {item.text}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between bg-[#181818] border-t border-gray-800 pt-3 pb-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setTreatmentItems(prev => prev.map(item => ({...item, isSelected: false})));
                      setActionItems(prev => prev.map(item => ({...item, isSelected: false})));
                      setPreviewContent('');
                    }}
                    className="text-xs"
                  >
                    <X className="h-3.5 w-3.5 mr-1.5" /> Reset
                  </Button>
                  <Button
                    size="sm"
                    className="text-xs"
                    onClick={() => {
                      // Create treatment plan from selected items
                      const selectedTreatments = treatmentItems.filter(item => item.isSelected);
                      
                      if (selectedTreatments.length === 0) {
                        toast({
                          title: "No treatments selected",
                          description: "Please select at least one treatment item",
                          variant: "destructive"
                        });
                        return;
                      }
                      
                      // Categorize selected treatments
                      const medItems = selectedTreatments.filter(item => item.category === 'medication');
                      const imgItems = selectedTreatments.filter(item => item.category === 'imaging');
                      const labItems = selectedTreatments.filter(item => item.category === 'labs');
                      const refItems = selectedTreatments.filter(item => item.category === 'referral');
                      const fupItems = selectedTreatments.filter(item => item.category === 'followup');
                      
                      // Generate preview content
                      let preview = "🩺 Treatment Plan:\n";
                      
                      if (medItems.length > 0) {
                        preview += "\nMedications:\n";
                        medItems.forEach(item => preview += `- ${item.text}\n`);
                      }
                      
                      if (imgItems.length > 0) {
                        preview += "\nImaging:\n";
                        imgItems.forEach(item => preview += `- ${item.text}\n`);
                      }
                      
                      if (labItems.length > 0) {
                        preview += "\nLabs:\n";
                        labItems.forEach(item => preview += `- ${item.text}\n`);
                      }
                      
                      if (refItems.length > 0) {
                        preview += "\nReferrals:\n";
                        refItems.forEach(item => preview += `- ${item.text}\n`);
                      }
                      
                      if (fupItems.length > 0) {
                        preview += "\nFollow-up:\n";
                        fupItems.forEach(item => preview += `- ${item.text}\n`);
                      }
                      
                      // Add action items
                      const selectedActions = actionItems.filter(item => item.isSelected);
                      if (selectedActions.length > 0) {
                        preview += "\n📋 Selected Actions:\n";
                        selectedActions.forEach(item => preview += `- ${item.text}\n`);
                      }
                      
                      setPreviewContent(preview);
                    }}
                  >
                    <ClipboardList className="h-3.5 w-3.5 mr-1.5" /> Generate Plan
                  </Button>
                </CardFooter>
              </Card>
            </div>

            {/* Preview Area */}
            {previewContent && (
              <div className="mb-4">
                <Card className="bg-[#1e1e1e] border-gray-800">
                  <CardHeader className="pb-2 border-b border-gray-800">
                    <CardTitle className="text-md font-medium text-green-400 flex items-center">
                      <FileText className="h-4 w-4 mr-2" />
                      Generated Content Preview
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-3">
                    <div className="text-sm text-white whitespace-pre-wrap">
                      {previewContent}
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between bg-[#181818] border-t border-gray-800 pt-3 pb-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // Copy to clipboard
                        navigator.clipboard.writeText(previewContent);
                        toast({
                          title: "Copied to clipboard",
                          description: "Content has been copied to your clipboard",
                        });
                      }}
                      className="text-xs"
                    >
                      <Copy className="h-3.5 w-3.5 mr-1.5" /> Copy
                    </Button>
                    <Button
                      size="sm"
                      className="text-xs"
                      onClick={() => {
                        // Send to patient
                        const messageText = actionItems.find(item => item.type === 'message_patient' && item.isSelected)
                          ? previewContent
                          : "Treatment plan: " + previewContent;
                        
                        onSendMessage(messageText);
                        toast({
                          title: "Message sent",
                          description: "Your message has been sent to the patient",
                        });
                      }}
                    >
                      <SendHorizontal className="h-3.5 w-3.5 mr-1.5" /> Send to Patient
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            )}

            {/* SOAP Note */}
            <div className="mb-4">
              <Card className="bg-[#1e1e1e] border-gray-800">
                <CardHeader className="pb-2 border-b border-gray-800">
                  <CardTitle className="text-md font-medium text-blue-400 flex items-center">
                    <Clipboard className="h-4 w-4 mr-2" />
                    Super Spartan SOAP Note
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-3">
                  <div className="text-sm text-white">
                    <p><strong>S:</strong> {'[Age] [Gender] with [Description] at [Location] since [Symptom] [Onset]; [Severity] [0-10]/10'}</p>
                    <p><strong>A:</strong> {'Suspect [Chief] [Complaint]; ddx includes musculoskeletal cause...'}</p>
                    <p><strong>P:</strong> {'In-person eval, imaging if needed, NSAIDs if tolerated...'}</p>
                    <div className="flex justify-between mt-2">
                      <Button 
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() => {
                          const soapContent = "S: [Age] [Gender] with [Description] at [Location] since [Symptom] [Onset]; [Severity] [0-10]/10\n" +
                            "A: Suspect [Chief] [Complaint]; ddx includes musculoskeletal cause...\n" +
                            "P: In-person eval, imaging if needed, NSAIDs if tolerated...";
                          
                          navigator.clipboard.writeText(soapContent);
                          toast({
                            title: "SOAP note copied",
                            description: "Content has been copied to your clipboard",
                          });
                        }}
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Copy
                      </Button>
                      <Button 
                        variant="ghost" 
                        className="text-xs text-blue-400"
                        onClick={() => {
                          const noteText = "Here's my SOAP note assessment: [SOAP Note]";
                          onSendMessage(noteText);
                          setPreviewContent(prevContent => prevContent + 
                            (prevContent ? '\n\n' : '') + 
                            '📋 SOAP Note Added');
                        }}
                      >
                        <Clipboard className="h-3 w-3 mr-1" />
                        Use template
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Follow-Up Questions */}
            <div className="mb-4">
              <Card className="bg-[#1e1e1e] border-gray-800">
                <CardHeader className="pb-2 border-b border-gray-800">
                  <CardTitle className="text-md font-medium text-blue-400 flex items-center">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Follow-Up Questions
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-3">
                  <div className="text-sm text-white">
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Does the pain radiate into your legs, groin, or buttocks?</li>
                      <li>Have you noticed numbness, tingling, or weakness in either leg?</li>
                      <li>Do coughing, sneezing, or straining worsen the pain?</li>
                    </ul>
                    <Button 
                      variant="ghost" 
                      className="text-xs text-blue-400 p-1 h-auto mt-2"
                      onClick={() => {
                        const followUpText = "Some important follow-up questions: [Follow-up Questions]";
                        onSendMessage(followUpText);
                        setPreviewContent(prevContent => prevContent + 
                          (prevContent ? '\n\n' : '') + 
                          '📋 Follow-up Questions Added');
                      }}
                    >
                      <Clipboard className="h-3 w-3 mr-1" />
                      Use template
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        </TabsContent>
        
        <TabsContent value="custom" className="flex-1 flex flex-col p-0 m-0">
          <div className="flex-1 p-4">
            <p className="text-sm text-gray-400 mb-4">
              {language === 'french' 
                ? "Générer une réponse personnalisée ou une documentation à l'aide de l'IA" 
                : "Generate a custom response or documentation using AI"}
            </p>
            
            <Textarea
              placeholder={language === 'french' 
                ? "Entrez votre requête ici (par exemple 'créer une note SOAP pour cette consultation')" 
                : "Enter your prompt here (e.g. 'create a SOAP note for this consultation')"}
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              className="min-h-[200px] bg-[#1e1e1e] border-gray-700 text-white"
            />
            
            {generateMutation.error && (
              <p className="text-red-400 mt-2 text-sm">
                Error generating response. Please try again.
              </p>
            )}
          </div>
          
          <div className="p-3 bg-[#1e1e1e] border-t border-gray-800 flex justify-end">
            <Button
              onClick={() => generateMutation.mutate()}
              disabled={!customPrompt.trim() || generateMutation.isPending}
            >
              {generateMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <Sparkles className="h-4 w-4 mr-1" />
              )}
              {language === 'french' ? 'Générer' : 'Generate'}
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}