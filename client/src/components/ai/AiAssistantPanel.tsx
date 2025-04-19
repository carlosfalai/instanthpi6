import { useState, useRef, useEffect } from "react";
import { Send, Check, Loader2, Copy, CheckSquare, FileText, ClipboardList, 
  PenSquare, BadgeCheck, Stethoscope, BrainCircuit, ChevronDown, ChevronUp, 
  ChevronRight, FileQuestion, Languages, MessageSquare, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
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
  
  // State to track selected content items
  const [selectedSections, setSelectedSections] = useState<{[key: string]: boolean}>({});
  const [selectedQuestions, setSelectedQuestions] = useState<{[key: string]: {[key: string]: boolean}}>({});
  
  // Function to send response to patient
  const sendResponseToPatient = () => {
    if (!generatedResponse) return;
    
    setIsSending(true);
    onSendMessage(generatedResponse);
    
    // Reset after sending
    clearGeneratedResponse();
  };

  // State for AI-generated sections
  const [aiSections, setAiSections] = useState<AiSection[]>([
    {
      id: "hpi-confirmation",
      title: "HPI Confirmation Summary",
      icon: <Languages className="h-4 w-4" />,
      enabled: true,
      content: patientLanguage === 'french'
        ? `HPI Confirmation Summary pour PATIENT2025:
────────────────────────────
Vous êtes ici aujourd'hui pour une dépression et une tension artérielle élevée. Vous avez mentionné que cela a commencé le 01/02/2024. Vous avez décrit les symptômes comme une humeur basse, de l'irritabilité et des maux de tête dus à la pression, localisés dans la tête et l'humeur générale, et aggravés par le manque de sommeil, le stress au travail et la caféine, mais soulagés par le repos, les conversations avec des amis et les promenades. Vous l'avez évalué à 6 sur 10. Vous avez remarqué que cela s'aggrave progressivement. Vous avez également essayé d'améliorer votre sommeil, de réduire la caféine et de pratiquer la méditation, avec un soulagement modéré et temporaire.

Pouvez-vous vérifier si ce résumé est exact?`
        : `HPI Confirmation Summary for PATIENT2025:
────────────────────────────
You're here today for depression and elevated blood pressure. You mentioned this started on 01/02/2024. You described the symptoms as low mood, irritability, and pressure headaches, located in the head and general mood, and made worse by lack of sleep, work stress, and caffeine, but relieved by rest, talking to friends, and going for walks. You rated it 6 out of 10. You've noticed that it has been getting worse gradually. You've also tried improving your sleep, reducing caffeine, and meditation, with moderate and temporary relief.

Can you verify if this summary is accurate?`
    },
    {
      id: "soap-note",
      title: "Super Spartan SOAP Note",
      icon: <FileText className="h-4 w-4" />,
      enabled: true,
      content: patientLanguage === 'french' 
        ? `Super Spartan SOAP Note
────────────────────────────
S: Femme de 38 ans avec dépression et TA élevée depuis 01/02/2024, présentant une humeur basse, maux de tête, irritabilité. Aggravation avec stress, manque de sommeil.
A: Dépression avec facteurs déclenchants liés au mode de vie; antécédents d'hypertension, mal surveillée.
P: Réévaluer l'humeur, évaluer la TA, envisager des options médicamenteuses ou thérapeutiques, explorer les facteurs de stress/sommeil.`
        : `Super Spartan SOAP Note
────────────────────────────
S: 38yo F with depression and elevated BP since 01/02/2024, presenting with low mood, headaches, irritability. Worse with stress, sleep loss.
A: Depression with associated lifestyle triggers; history of hypertension, poorly monitored.
P: Reassess mood, evaluate BP, consider medication or therapy options, explore stress/sleep contributors.`
    },
    {
      id: "plan-bullets",
      title: "Plan – Bullet Points",
      icon: <ClipboardList className="h-4 w-4" />,
      enabled: true,
      content: patientLanguage === 'french'
        ? `Plan – Bullet Points
────────────────────────────
• Recommander un dépistage de la santé mentale (ex. PHQ-9) pour évaluer la sévérité de la dépression
• Suggérer une surveillance ambulatoire ou à domicile de la TA pour un meilleur contrôle
• Envisager des analyses sanguines: NFS, TSH, électrolytes pour exclure des causes réversibles de fatigue
• Discuter d'options de thérapie comportementale pour la dépression et la gestion du stress
• Revoir les habitudes de sommeil et proposer des stratégies d'hygiène du sommeil`
        : `Plan – Bullet Points
────────────────────────────
• Recommend mental health screening (e.g., PHQ-9) to assess depression severity
• Suggest ambulatory or home BP monitoring for better control
• Consider blood tests: CBC, TSH, electrolytes to rule out reversible causes of fatigue
• Discuss behavioral therapy options for depression and stress management
• Review sleep habits and propose sleep hygiene strategies`
    },
    {
      id: "telemedicine-notes",
      title: "In Case of Telemedicine",
      icon: <MessageSquare className="h-4 w-4" />,
      enabled: true,
      content: patientLanguage === 'french'
        ? `In case this is a telemedicine consultation:
────────────────────────────
Comme vous présentez des symptômes d'humeur qui s'aggravent ainsi qu'un antécédent d'hypertension, une évaluation complète en personne est recommandée. Pour évaluer correctement votre état, des examens physiques, des mesures de tension artérielle dans des conditions contrôlées et des analyses sanguines peuvent être nécessaires. Ceux-ci aident à exclure des causes comme des problèmes thyroïdiens ou une anémie qui pourraient imiter la dépression ou aggraver la fatigue. L'évaluation précise de la tension artérielle et l'interprétation des analyses ne peuvent pas être faites à distance. Veuillez prendre rendez-vous pour une visite en cabinet dans les 7 jours.`
        : `In case this is a telemedicine consultation:
────────────────────────────
Because you're experiencing worsening mood symptoms along with a history of hypertension, a full in-person evaluation is recommended. To properly assess your condition, physical exams, blood pressure readings under controlled conditions, and blood work may be necessary. These help rule out causes such as thyroid issues or anemia that could mimic depression or worsen fatigue. Accurate blood pressure assessment and lab interpretation cannot be done remotely. Please schedule an in-office visit within 7 days.`
    },
    {
      id: "follow-up-questions",
      title: "Follow-Up Questions",
      icon: <PenSquare className="h-4 w-4" />,
      enabled: true,
      content: patientLanguage === 'french'
        ? `Follow-Up Questions
────────────────────────────

Dépression
• Vous sentez-vous reposé(e) au réveil, ou vous sentez-vous encore épuisé(e) même après avoir dormi?
• Avez-vous eu des difficultés à vous concentrer ou à rester focalisé(e) sur des tâches?
• Votre appétit a-t-il changé récemment?
• Avez-vous perdu de l'intérêt pour des activités que vous aimiez auparavant?
• Avez-vous des pensées de vous faire du mal ou que la vie ne vaut pas la peine d'être vécue?
• Comment qualifieriez-vous votre niveau d'énergie sur une échelle de 1 à 10?
• Avez-vous remarqué des changements dans vos habitudes de sommeil?
• Vous sentez-vous souvent dépassé(e) par des tâches quotidiennes simples?

Hypertension
• Surveillez-vous votre tension artérielle à la maison?
• Quelle était votre dernière mesure de tension?
• Prenez-vous actuellement des médicaments pour l'hypertension?
• Avez-vous modifié votre consommation de sel récemment?
• Avez-vous des antécédents familiaux d'hypertension ou de maladies cardiaques?
• Combien d'activité physique faites-vous par semaine?
• Consommez-vous de l'alcool, et si oui, combien par semaine?
• Avez-vous ressenti des symptômes comme des maux de tête, une vision floue ou des vertiges?

Questions standard
• Avez-vous déjà consulté un médecin pour ce problème par le passé?
• Avez-vous été traité(e) pour ce problème dans le passé?
• Y a-t-il autre chose que vous aimeriez me dire sur votre santé actuelle?`
        : `Follow-Up Questions
────────────────────────────

Depression
• Do you feel rested when you wake up, or do you still feel drained even after sleeping?
• Have you had any difficulty concentrating or staying focused on tasks?
• Has your appetite changed recently?
• Have you lost interest in activities you used to enjoy?
• Do you have thoughts of harming yourself or that life is not worth living?
• How would you rate your energy level on a scale of 1 to 10?
• Have you noticed changes in your sleep patterns?
• Do you often feel overwhelmed by simple daily tasks?

Hypertension
• Do you monitor your blood pressure at home?
• What was your last blood pressure reading?
• Are you currently taking any medications for hypertension?
• Have you modified your salt intake recently?
• Do you have a family history of hypertension or heart disease?
• How much physical activity do you do per week?
• Do you consume alcohol, and if so, how much per week?
• Have you experienced symptoms like headaches, blurred vision, or dizziness?

Standard questions
• Have you seen a doctor for this in the past?
• Have you been treated for this in the past?
• Is there anything else you would like to tell me about your current health?`
    },
    {
      id: "medication-recommendation",
      title: "Medication Recommendation",
      icon: <Stethoscope className="h-4 w-4" />,
      enabled: true,
      content: patientLanguage === 'french'
        ? `Je vous prescris un traitement à base de Gelomyrtol, un produit naturel composé de thym, eucalyptus, menthe et myrte, qui agit comme antimucolytique et possède un léger effet anti-infectieux. Des études ont montré qu'il peut réduire jusqu'à 50% le recours aux antibiotiques dans les cas de sinusite et de bronchite, dont environ 97% sont d'origine virale et ne nécessitent pas d'antibiotiques. Prenez 1 gélule quatre fois par jour pendant 7 jours.`
        : `I'm prescribing Gelomyrtol, a natural product made from thyme, eucalyptus, mint and myrtle, which acts as an antimucotyltic and has mild anti-infective properties. Studies have shown it can reduce antibiotic use by up to 50% in cases of sinusitis and bronchitis, of which approximately 97% are viral in origin and don't require antibiotics. Take 1 capsule four times daily for 7 days.`
    }
  ]);
  
  // State for loading AI content
  const [isLoadingAIContent, setIsLoadingAIContent] = useState(false);
  
  // Load AI-generated sections when the component mounts or patientId changes
  useEffect(() => {
    const loadAIGeneratedSections = async () => {
      if (!patientId) return;
      
      setIsLoadingAIContent(true);
      try {
        // Fetch patient data first
        const patientResponse = await axios.get(`/api/patients/${patientId}`);
        const patientData = patientResponse.data;
        
        // Fetch messages for conversation context
        const messagesResponse = await axios.get(`/api/patients/${patientId}/messages`);
        const messages = messagesResponse.data.slice(-5); // Get last 5 messages for context
        
        // Format message history for the AI
        const messageHistory = messages.map((msg: any) => ({
          sender: msg.isFromPatient ? 'patient' : 'doctor',
          content: msg.content
        }));
        
        // Fetch AI-generated sections
        const response = await axios.post('/api/ai/generate-sections', {
          patientData,
          patientLanguage,
          messageHistory
        });
        
        if (response.data && response.data.sections) {
          // Map the sections to our format with appropriate icons
          const sectionIcons: {[key: string]: React.ReactNode} = {
            "hpi-confirmation": <Languages className="h-4 w-4" />,
            "soap-note": <FileText className="h-4 w-4" />,
            "plan-bullets": <ClipboardList className="h-4 w-4" />,
            "telemedicine-notes": <MessageSquare className="h-4 w-4" />,
            "follow-up-questions": <PenSquare className="h-4 w-4" />,
            "medication-recommendation": <Stethoscope className="h-4 w-4" />
          };
          
          const formattedSections = response.data.sections.map((section: any) => ({
            id: section.id,
            title: section.title,
            icon: sectionIcons[section.id] || <FileQuestion className="h-4 w-4" />,
            enabled: true,
            content: section.content
          }));
          
          setAiSections(formattedSections);
          
          // Format follow-up questions if provided
          if (response.data.followUpQuestions) {
            const followUpSection = formattedSections.find((section: AiSection) => section.id === "follow-up-questions");
            if (followUpSection) {
              let content = `Follow-Up Questions\n────────────────────────────\n\n`;
              
              Object.entries(response.data.followUpQuestions).forEach(([category, questions]: [string, any]) => {
                content += `${category}\n`;
                questions.forEach((question: string) => {
                  content += `• ${question}\n`;
                });
                content += '\n';
              });
              
              // Update the follow-up questions section
              followUpSection.content = content;
            }
          }
        }
      } catch (error) {
        console.error("Error loading AI content:", error);
        // We'll keep the default content in case of error
      } finally {
        setIsLoadingAIContent(false);
      }
    };
    
    loadAIGeneratedSections();
  }, [patientId, patientLanguage]);

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

  // Clear the generated response after sending
  const clearGeneratedResponse = () => {
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
      {/* AI Assistant Header with Patient Info */}
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