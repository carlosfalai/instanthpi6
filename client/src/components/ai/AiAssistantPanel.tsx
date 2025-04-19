import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowRight, Clipboard, RefreshCw, Check, MessageSquare, Stethoscope, Pill, FileText, Clipboard as ClipboardIcon, ListChecks } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

interface AiAssistantPanelProps {
  patientId: number;
  onTogglePanel?: () => void;
}

interface Patient {
  id: number;
  name: string;
  avatarUrl: string | null;
  gender: string;
  dateOfBirth: string;
  email: string;
  phone: string;
}

interface AIFormData {
  hpi: string | null;
  differentialDiagnosis: string[] | null;
  plan: string | null;
  followupQuestions: string[] | null;
  labSuggestions: string | null;
  medicationOptions: {
    name: string;
    dosage: string;
    frequency: string;
    notes: string;
  }[] | null;
  telemedicineComplexity: string | null;
}

export default function AiAssistantPanel({ patientId, onTogglePanel }: AiAssistantPanelProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("hpi");
  const [useClipboard, setUseClipboard] = useState<Record<string, boolean>>({});
  
  // Fetch patient data
  const { data: patient } = useQuery<Patient>({
    queryKey: [`/api/patients/${patientId}`],
    enabled: !!patientId,
  });
  
  // Fetch AI suggestions
  const { 
    data: aiData,
    isLoading: aiLoading,
    isError: aiError,
    refetch: refreshAiData
  } = useQuery<AIFormData>({
    queryKey: [`/api/ai/suggestions/${patientId}`],
    enabled: !!patientId,
  });
  
  // Reset clipboard state when patient changes
  useEffect(() => {
    setUseClipboard({});
  }, [patientId]);
  
  // Handle copying content to clipboard
  const handleCopyToClipboard = async (content: string, key: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setUseClipboard(prev => ({ ...prev, [key]: true }));
      
      toast({
        title: "Copied to clipboard",
        description: "Content has been copied to your clipboard",
      });
      
      // Reset the copy status after 3 seconds
      setTimeout(() => {
        setUseClipboard(prev => ({ ...prev, [key]: false }));
      }, 3000);
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Unable to copy to clipboard",
        variant: "destructive",
      });
    }
  };
  
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b bg-white">
        <div>
          <h2 className="text-lg font-medium">AI Assistant</h2>
          <p className="text-sm text-gray-500">
            {patient ? `Suggestions for ${patient.name}` : "Select a patient to view suggestions"}
          </p>
        </div>
        
        {onTogglePanel && (
          <Button 
            variant="outline" 
            size="sm" 
            className="md:hidden"
            onClick={onTogglePanel}
          >
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
        
        <Button 
          variant="outline" 
          size="sm" 
          className="hidden md:flex items-center gap-1"
          onClick={() => refreshAiData()}
          disabled={aiLoading}
        >
          <RefreshCw className={`h-4 w-4 ${aiLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
      
      {patient && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="grid grid-cols-5 px-4 pt-2 pb-0 border-b">
            <TabsTrigger value="hpi" className="text-xs">
              <div className="flex flex-col items-center gap-1">
                <FileText className="h-4 w-4" />
                <span>HPI</span>
              </div>
            </TabsTrigger>
            <TabsTrigger value="dx" className="text-xs">
              <div className="flex flex-col items-center gap-1">
                <Stethoscope className="h-4 w-4" />
                <span>Differential</span>
              </div>
            </TabsTrigger>
            <TabsTrigger value="plan" className="text-xs">
              <div className="flex flex-col items-center gap-1">
                <ClipboardIcon className="h-4 w-4" />
                <span>Plan</span>
              </div>
            </TabsTrigger>
            <TabsTrigger value="labs" className="text-xs">
              <div className="flex flex-col items-center gap-1">
                <ListChecks className="h-4 w-4" />
                <span>Labs</span>
              </div>
            </TabsTrigger>
            <TabsTrigger value="rx" className="text-xs">
              <div className="flex flex-col items-center gap-1">
                <Pill className="h-4 w-4" />
                <span>Meds</span>
              </div>
            </TabsTrigger>
          </TabsList>
          
          <div className="flex-1 overflow-hidden">
            <TabsContent value="hpi" className="h-full m-0 p-0">
              <ScrollArea className="h-full">
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium">History of Present Illness</h3>
                    {aiData?.hpi && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8"
                        onClick={() => handleCopyToClipboard(aiData.hpi || "", "hpi")}
                      >
                        {useClipboard["hpi"] ? (
                          <Check className="h-4 w-4 mr-1" />
                        ) : (
                          <Clipboard className="h-4 w-4 mr-1" />
                        )}
                        {useClipboard["hpi"] ? "Copied" : "Copy"}
                      </Button>
                    )}
                  </div>
                  
                  {aiLoading ? (
                    <div className="animate-pulse space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded"></div>
                      <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                      <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                    </div>
                  ) : aiError ? (
                    <div className="text-red-500 text-sm">
                      Failed to load HPI. Please try refreshing.
                    </div>
                  ) : aiData?.hpi ? (
                    <div className="text-sm space-y-4 whitespace-pre-wrap">
                      {aiData.hpi}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">
                      No HPI available for this patient. Try refreshing or checking form submission data.
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="dx" className="h-full m-0 p-0">
              <ScrollArea className="h-full">
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium">Differential Diagnosis</h3>
                    {aiData?.differentialDiagnosis && aiData.differentialDiagnosis.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8"
                        onClick={() => handleCopyToClipboard(
                          "Differential Diagnosis:\n" +
                          aiData.differentialDiagnosis?.map((dx, i) => `${i+1}. ${dx}`).join("\n") || "",
                          "dx"
                        )}
                      >
                        {useClipboard["dx"] ? (
                          <Check className="h-4 w-4 mr-1" />
                        ) : (
                          <Clipboard className="h-4 w-4 mr-1" />
                        )}
                        {useClipboard["dx"] ? "Copied" : "Copy"}
                      </Button>
                    )}
                  </div>
                  
                  {aiLoading ? (
                    <div className="animate-pulse space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded"></div>
                      <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                    </div>
                  ) : aiError ? (
                    <div className="text-red-500 text-sm">
                      Failed to load differential diagnosis. Please try refreshing.
                    </div>
                  ) : aiData?.differentialDiagnosis && aiData.differentialDiagnosis.length > 0 ? (
                    <ol className="list-decimal ml-5 space-y-2 text-sm">
                      {aiData.differentialDiagnosis.map((dx, index) => (
                        <li key={index} className="pl-1">{dx}</li>
                      ))}
                    </ol>
                  ) : (
                    <div className="text-sm text-gray-500">
                      No differential diagnoses available. Try refreshing.
                    </div>
                  )}
                  
                  {aiData?.followupQuestions && aiData.followupQuestions.length > 0 && (
                    <>
                      <Separator className="my-4" />
                      
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium">Suggested Follow-up Questions</h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8"
                          onClick={() => handleCopyToClipboard(
                            "Follow-up Questions:\n" +
                            aiData.followupQuestions?.map((q, i) => `${i+1}. ${q}`).join("\n") || "",
                            "questions"
                          )}
                        >
                          {useClipboard["questions"] ? (
                            <Check className="h-4 w-4 mr-1" />
                          ) : (
                            <Clipboard className="h-4 w-4 mr-1" />
                          )}
                          {useClipboard["questions"] ? "Copied" : "Copy"}
                        </Button>
                      </div>
                      
                      <ol className="list-decimal ml-5 space-y-2 text-sm">
                        {aiData.followupQuestions.map((question, index) => (
                          <li key={index} className="pl-1">
                            <div className="flex justify-between items-start gap-2">
                              <span>{question}</span>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="h-6 px-2 flex-shrink-0"
                                onClick={() => handleCopyToClipboard(question, `q-${index}`)}
                              >
                                {useClipboard[`q-${index}`] ? (
                                  <Check className="h-3 w-3" />
                                ) : (
                                  <MessageSquare className="h-3 w-3" />
                                )}
                              </Button>
                            </div>
                          </li>
                        ))}
                      </ol>
                    </>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="plan" className="h-full m-0 p-0">
              <ScrollArea className="h-full">
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium">Suggested Plan</h3>
                    {aiData?.plan && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8"
                        onClick={() => handleCopyToClipboard(aiData.plan || "", "plan")}
                      >
                        {useClipboard["plan"] ? (
                          <Check className="h-4 w-4 mr-1" />
                        ) : (
                          <Clipboard className="h-4 w-4 mr-1" />
                        )}
                        {useClipboard["plan"] ? "Copied" : "Copy"}
                      </Button>
                    )}
                  </div>
                  
                  {aiLoading ? (
                    <div className="animate-pulse space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded"></div>
                      <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                    </div>
                  ) : aiError ? (
                    <div className="text-red-500 text-sm">
                      Failed to load plan. Please try refreshing.
                    </div>
                  ) : aiData?.plan ? (
                    <div className="text-sm space-y-4 whitespace-pre-wrap">
                      {aiData.plan}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">
                      No plan suggestions available. Try refreshing.
                    </div>
                  )}
                  
                  {aiData?.telemedicineComplexity && (
                    <>
                      <Separator className="my-4" />
                      
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium flex items-center">
                          <Badge className="bg-amber-100 text-amber-700 mr-2">
                            In-person Referral
                          </Badge>
                          Telemedicine Complexity
                        </h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8"
                          onClick={() => handleCopyToClipboard(
                            aiData.telemedicineComplexity || "", 
                            "complexity"
                          )}
                        >
                          {useClipboard["complexity"] ? (
                            <Check className="h-4 w-4 mr-1" />
                          ) : (
                            <Clipboard className="h-4 w-4 mr-1" />
                          )}
                          {useClipboard["complexity"] ? "Copied" : "Copy"}
                        </Button>
                      </div>
                      
                      <div className="text-sm p-3 border border-amber-200 bg-amber-50 rounded-md">
                        {aiData.telemedicineComplexity}
                      </div>
                    </>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="labs" className="h-full m-0 p-0">
              <ScrollArea className="h-full">
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium">Lab & Test Recommendations</h3>
                    {aiData?.labSuggestions && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8"
                        onClick={() => handleCopyToClipboard(
                          aiData.labSuggestions || "", 
                          "labs"
                        )}
                      >
                        {useClipboard["labs"] ? (
                          <Check className="h-4 w-4 mr-1" />
                        ) : (
                          <Clipboard className="h-4 w-4 mr-1" />
                        )}
                        {useClipboard["labs"] ? "Copied" : "Copy"}
                      </Button>
                    )}
                  </div>
                  
                  {aiLoading ? (
                    <div className="animate-pulse space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded"></div>
                      <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                    </div>
                  ) : aiError ? (
                    <div className="text-red-500 text-sm">
                      Failed to load lab recommendations. Please try refreshing.
                    </div>
                  ) : aiData?.labSuggestions ? (
                    <div className="text-sm whitespace-pre-wrap">
                      {aiData.labSuggestions}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">
                      No lab recommendations available. Try refreshing.
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="rx" className="h-full m-0 p-0">
              <ScrollArea className="h-full">
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium">Medication Options</h3>
                    {aiData?.medicationOptions && aiData.medicationOptions.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8"
                        onClick={() => handleCopyToClipboard(
                          aiData.medicationOptions
                            ?.map((med) => `${med.name} ${med.dosage}\nFrequency: ${med.frequency}\n${med.notes ? `Notes: ${med.notes}` : ''}`)
                            .join("\n\n") || "",
                          "meds"
                        )}
                      >
                        {useClipboard["meds"] ? (
                          <Check className="h-4 w-4 mr-1" />
                        ) : (
                          <Clipboard className="h-4 w-4 mr-1" />
                        )}
                        {useClipboard["meds"] ? "Copied" : "Copy"}
                      </Button>
                    )}
                  </div>
                  
                  {aiLoading ? (
                    <div className="animate-pulse space-y-4">
                      <div className="space-y-2">
                        <div className="h-5 bg-gray-200 rounded w-1/2"></div>
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                      </div>
                      <div className="space-y-2">
                        <div className="h-5 bg-gray-200 rounded w-1/2"></div>
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                      </div>
                    </div>
                  ) : aiError ? (
                    <div className="text-red-500 text-sm">
                      Failed to load medication options. Please try refreshing.
                    </div>
                  ) : aiData?.medicationOptions && aiData.medicationOptions.length > 0 ? (
                    <div className="space-y-4">
                      {aiData.medicationOptions.map((med, index) => (
                        <Card key={index} className="overflow-hidden">
                          <CardHeader className="p-3 bg-blue-50">
                            <CardTitle className="text-sm font-medium">{med.name} {med.dosage}</CardTitle>
                          </CardHeader>
                          <CardContent className="p-3 pt-2 text-xs space-y-1">
                            <div><span className="font-medium">Frequency:</span> {med.frequency}</div>
                            {med.notes && <div><span className="font-medium">Notes:</span> {med.notes}</div>}
                            <div className="pt-1">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs w-full"
                                onClick={() => handleCopyToClipboard(
                                  `${med.name} ${med.dosage}\nFrequency: ${med.frequency}\n${med.notes ? `Notes: ${med.notes}` : ''}`,
                                  `med-${index}`
                                )}
                              >
                                {useClipboard[`med-${index}`] ? (
                                  <Check className="h-3 w-3 mr-1" />
                                ) : (
                                  <Clipboard className="h-3 w-3 mr-1" />
                                )}
                                {useClipboard[`med-${index}`] ? "Copied" : "Copy Prescription"}
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">
                      No medication options available. Try refreshing.
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </div>
        </Tabs>
      )}
    </div>
  );
}