import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest, getAuthHeaders } from "@/lib/queryClient";
import { useSavedMessages, type SavedMessage } from "@/hooks/useSavedMessages";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { restrictToHorizontalAxis } from "@dnd-kit/modifiers";
import {
  Search,
  Loader2,
  User,
  MessageCircle,
  Clock,
  FileText,
  Activity,
  Zap,
  Send,
  Sparkles,
  Check,
  X,
  Calendar,
  Pill,
  AlertTriangle,
  CheckCircle,
  FileDown,
  Printer,
  Bot,
  RefreshCw,
  Image as ImageIcon,
  Download,
  ExternalLink,
  Stethoscope,
  Briefcase,
  FlaskConical,
  ScanLine,
  GripVertical,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Smartphone,
  Lock,
  Mail,
  Video,
  FileAudio,
  Hash,
  MessageSquare,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import ModernLayout from "@/components/layout/ModernLayout";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useStagingQueue } from "@/hooks/useStagingQueue";
import { usePanelLayout, type PanelId, DEFAULT_PANEL_CONFIGS } from "@/hooks/usePanelLayout";
import { DragOverlayPanel } from "@/components/command-center/SortablePanel";
import { EditableTitle } from "@/components/command-center/EditableTitle";
import { DEFAULT_TIMER_CONFIG } from "@/types/staging";
import { supabase } from "@/lib/supabase";
import {
  generateAndDownloadRequete,
  extractPatientInfoFromConversation,
  type PatientData,
} from "@/utils/pdfGenerator";

// Database template interface
interface MedicalTemplate {
  id: string;
  template_name: string;
  template_category: string;
  template_type: string;
  case_type: string | null;
  template_content: string;
  is_enabled: boolean;
  is_default: boolean;
  usage_count: number;
}

// Template category config - all same color for consistency
const TEMPLATE_CATEGORIES = {
  saved_messages: { label: "Quick", icon: Zap, color: "bg-[#d4af37]" },
  soap_note: { label: "SOAP", icon: Stethoscope, color: "bg-[#333]" },
  specialist_referral: { label: "Referrals", icon: Send, color: "bg-[#333]" },
  imaging_requisition: { label: "Imaging", icon: ScanLine, color: "bg-[#333]" },
  patient_message: { label: "Meds", icon: Pill, color: "bg-[#333]" },
  case_discussion: { label: "Labs", icon: FlaskConical, color: "bg-[#333]" },
  work_leave: { label: "Work Leave", icon: Briefcase, color: "bg-[#333]" },
};

interface Conversation {
  id: string;
  patient_name: string;
  last_message: string;
  updated_at: string;
  unread_count: number;
  title?: string;
}

interface ChatMessage {
  id: string;
  content: string;
  isFromPatient: boolean;
  timestamp: string;
  channelType?: "sms" | "secure" | "email" | "unknown";
  senderName?: string;
  attachments?: Array<{
    id: string;
    type: "image" | "video" | "document" | "audio" | "other";
    url: string;
    name?: string;
    mimeType?: string;
    size?: number;
  }>;
}

interface PatientInfo {
  name: string;
  nam?: string; // Health insurance number
  dob?: string; // Date of birth
  sex?: string;
  phone?: string;
  address?: string;
  email?: string;
  dossier?: string; // File number
}

interface ClaudeMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

// Medical document templates - clicking sends conversation as user prompt + template as system prompt
const TEMPLATES = [
  // === CLINICAL DOCUMENTS ===
  {
    id: "soap_note",
    name: "SOAP Note",
    icon: FileText,
    systemPrompt: `You are a medical documentation specialist for Truck Stop Sante clinic.
Based on the patient conversation, generate a complete SOAP note in French.

Format:
**SUBJECTIF (S):**
- Motif de consultation
- Histoire de la maladie actuelle (HMA)
- Symptomes rapportes par le patient
- Antecedents pertinents mentionnes

**OBJECTIF (O):**
- Signes vitaux (si mentionnes)
- Examen physique pertinent (si mentionne)
- Resultats de tests (si mentionnes)

**ANALYSE (A):**
- Diagnostic principal ou impression clinique
- Diagnostics differentiels
- Problemes identifies

**PLAN (P):**
- Investigations demandees
- Traitement prescrit
- Suivi recommande
- Education au patient

Extraire toutes les informations cliniques pertinentes de la conversation.`,
    color: "bg-slate-600",
    isPDF: true,
  },
  {
    id: "referral",
    name: "Referrals",
    icon: Send,
    systemPrompt: `You are a medical consultation request generator for Truck Stop Sante clinic.
Based on the patient conversation, generate a REQUETE (consultation request) document in French.

Format the output as a professional medical consultation request including:
1. Brief context line (e.g., "Medecine familiale: Merci d'evaluer ce patient pour [reason]")
2. Patient presentation paragraph with age, chief complaint, onset, duration, and severity
3. Description of symptoms with specific details (location, character, radiation, associated symptoms)
4. Relevant negatives (what the patient denies)
5. Medical history and allergies if mentioned
6. Clinical impression and differential diagnosis
7. Requested evaluation or investigations
8. "Consultation prioritaire recommandee" if urgent

Write in formal medical French. Be thorough but concise. Extract all relevant clinical details from the conversation.`,
    color: "bg-blue-600",
    isPDF: true,
  },
  {
    id: "imaging_requisition",
    name: "Imaging",
    icon: Activity,
    systemPrompt: `You are a radiology requisition specialist for Truck Stop Sante clinic.
Based on the patient conversation, generate a REQUETE D'IMAGERIE (imaging requisition) in French.

Include:
1. **TYPE D'EXAMEN DEMANDE:** (Radiographie, Echographie, TDM, IRM, etc.)
2. **REGION ANATOMIQUE:** Specify exact body part/region
3. **INDICATION CLINIQUE:**
   - Symptoms and duration
   - Clinical findings
   - Suspected diagnosis
4. **RENSEIGNEMENTS CLINIQUES PERTINENTS:**
   - Relevant history
   - Previous imaging if mentioned
   - Allergies (especially contrast)
5. **URGENCE:** Routine / Semi-urgent / Urgent
6. **QUESTION CLINIQUE SPECIFIQUE:** What are we looking for?

Format clearly for radiology department review.`,
    color: "bg-purple-600",
    isPDF: true,
  },
  {
    id: "meds_prescription",
    name: "Meds",
    icon: Pill,
    systemPrompt: `You are a prescription generator for Truck Stop Sante clinic.
Based on the patient conversation, generate an ORDONNANCE (prescription) in French.

Format:
**ORDONNANCE**

Patient: [Name]
Date: [Today's date]

Rx:
1. [Medication name] [Strength]
   Posologie: [Directions - e.g., "1 comprime PO BID x 7 jours"]
   Quantite: [Amount to dispense]
   Renouvellements: [Number of refills]

[Repeat for each medication]

Instructions speciales: [Any special instructions]
Substitution generique: Permise / Non permise

Extract all medication details from the conversation including dosage, frequency, duration.`,
    color: "bg-green-600",
    isPDF: true,
  },
  {
    id: "labs_requisition",
    name: "Labs",
    icon: Activity,
    systemPrompt: `You are a laboratory requisition specialist for Truck Stop Sante clinic.
Based on the patient conversation, generate a REQUETE DE LABORATOIRE (lab requisition) in French.

Include:
**ANALYSES DEMANDEES:**
- FSC (Formule sanguine complete)
- Glycemie a jeun
- HbA1c
- Bilan lipidique
- Bilan hepatique (AST, ALT, GGT, Bili)
- Bilan renal (Creatinine, Uree, DFGe)
- TSH
- Electrolytes (Na, K, Cl)
- Analyse d'urine
- Autres: [specify]

**INDICATION CLINIQUE:**
[Reason for testing based on conversation]

**RENSEIGNEMENTS CLINIQUES:**
[Relevant clinical context]

**INSTRUCTIONS SPECIALES:**
- A jeun requis
- Prelevement matinal
- Autres: [specify]

**URGENCE:** Routine / Urgent

Check the boxes that apply based on the clinical context from the conversation.`,
    color: "bg-amber-600",
    isPDF: true,
  },
  {
    id: "work_leave",
    name: "Work Leave",
    icon: Calendar,
    systemPrompt: `You are generating a medical certificate for Truck Stop Sante clinic.
Based on the patient conversation, generate a CERTIFICAT MEDICAL / BILLET DE TRAVAIL (work leave certificate) in French.

Format:
**CERTIFICAT MEDICAL**

Je soussigne, Dr Carlos Faviel Font, medecin, certifie avoir examine:

Patient: [Name]
Date de naissance: [If mentioned]
NAM: [If mentioned]

Date de consultation: [Today]

**ATTESTATION:**
Ce patient est/etait incapable de travailler pour raisons medicales:

Du: [Start date]
Au: [End date] (inclusivement)

Duree totale: [X] jours

- Arret de travail complet
- Travail leger / Restrictions: [specify if mentioned]

**Restrictions specifiques (si applicable):**
[Any work restrictions mentioned]

**Suivi recommande:**
[Follow-up plan]

Ce certificat est delivre a la demande du patient pour fins administratives.

Note: Keep medical details confidential - only state inability to work, not diagnosis.`,
    color: "bg-rose-600",
    isPDF: true,
  },
  // === COMMUNICATION TEMPLATES ===
  {
    id: "patient_edu",
    name: "Edu/Reply",
    icon: MessageCircle,
    systemPrompt: `You are a caring medical office assistant for Truck Stop Sante.
Based on the patient conversation, generate a warm, professional message to the patient explaining what you will prepare for them.

Format the message like this:
"Bonjour [Patient Name],

Merci pour votre message. Suite a notre echange, je vais preparer les documents suivants pour vous:

[List what applies based on the conversation:]
- Votre note clinique (SOAP)
- Une demande de consultation/reference vers [specialist if mentioned]
- Une requete d'imagerie pour [exam type if needed]
- Votre ordonnance pour [medications if discussed]
- Une requete de laboratoire pour [tests if needed]
- Un certificat medical/billet de travail [if needed]

[Add any specific instructions or next steps]

N'hesitez pas a nous contacter si vous avez des questions.

Cordialement,
L'equipe Truck Stop Sante"

Adapt the list based on what was actually discussed in the conversation. Be warm and reassuring.`,
    color: "bg-cyan-600",
  },
  {
    id: "general_response",
    name: "Reply",
    icon: Zap,
    systemPrompt:
      "You are a helpful medical office assistant. Based on the patient conversation, generate an appropriate professional response addressing their inquiry or concern. Be empathetic and clear.",
    color: "bg-gray-600",
  },
  {
    id: "fax_pharmacy",
    name: "Fax Rx",
    icon: Printer,
    systemPrompt: `You are a pharmacy fax coordinator for Truck Stop Sante clinic.
Based on the patient conversation, prepare a prescription for faxing to pharmacy in French.

**TELECOPIE - ORDONNANCE**
A: [Pharmacy name if mentioned]
Fax: [Pharmacy fax if mentioned]
De: Truck Stop Sante - Dr Carlos Faviel Font
Fax: 833-964-4725

Patient: [Name]
DDN: [DOB if mentioned]
NAM: [If mentioned]

Rx:
[Medication details as extracted from conversation]

Merci de confirmer reception.`,
    color: "bg-indigo-600",
    isFax: true,
  },
  // === BATCH GENERATION ===
  {
    id: "prepare_all",
    name: "Prepare All",
    icon: CheckCircle,
    systemPrompt: `You are a comprehensive medical documentation assistant for Truck Stop Sante clinic.
Based on the patient conversation, generate ALL applicable documents in one response.

Generate each section that applies to this patient case:

---
## 1. SOAP NOTE
[Generate complete SOAP note in French]

---
## 2. REFERRAL/REQUETE (if specialist consultation needed)
[Generate consultation request]

---
## 3. IMAGING REQUISITION (if imaging needed)
[Generate imaging request]

---
## 4. PRESCRIPTION/ORDONNANCE (if medications discussed)
[Generate prescription]

---
## 5. LAB REQUISITION (if lab tests needed)
[Generate lab requisition]

---
## 6. WORK LEAVE CERTIFICATE (if work absence needed)
[Generate medical certificate]

---
## 7. PATIENT MESSAGE
[Generate message to patient explaining what was prepared]

Only include sections that are relevant based on the conversation. Skip sections that don't apply.
Write all clinical documents in formal medical French.`,
    color: "bg-gradient-to-r from-teal-600 to-blue-600",
    isPDF: true,
    isBatch: true,
  },
];

// Panel icons mapping
const PANEL_ICONS: Record<PanelId, React.ReactNode> = {
  inbox: <MessageCircle className="h-3 w-3" />,
  history: <FileText className="h-3 w-3" />,
  queue: <Clock className="h-3 w-3" />,
  ai: <Sparkles className="h-3 w-3" />,
  templates: <Zap className="h-3 w-3" />,
};

// Sortable Panel Header Component
interface SortablePanelHeaderProps {
  id: PanelId;
  name: string;
  icon: React.ReactNode;
  badge?: React.ReactNode;
  subtitle?: string;
  actions?: React.ReactNode;
  onNameChange?: (newName: string) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

function SortablePanelHeader({
  id,
  name,
  icon,
  badge,
  subtitle,
  actions,
  onNameChange,
  isCollapsed,
  onToggleCollapse,
}: SortablePanelHeaderProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "p-2 border-b border-[#1a1a1a] flex items-start gap-1",
        isDragging && "opacity-50"
      )}
    >
      {/* Drag Handle */}
      <button
        {...attributes}
        {...listeners}
        className={cn(
          "flex-shrink-0 p-0.5 rounded cursor-grab active:cursor-grabbing",
          "hover:bg-[#222] transition-colors",
          "focus:outline-none focus:ring-1 focus:ring-[#d4af37]/50",
          isDragging && "cursor-grabbing"
        )}
        title="Drag to reorder panels"
      >
        <GripVertical className="h-3 w-3 text-[#555] hover:text-[#888]" />
      </button>

      {/* Header Content */}
      <div className="flex-1 min-w-0">
        <h2 className="text-[10px] font-bold text-[#d4af37] uppercase tracking-widest flex items-center gap-1">
          {icon}
          {!isCollapsed && onNameChange ? (
            <EditableTitle value={name} onChange={onNameChange} />
          ) : !isCollapsed ? (
            <span className="truncate">{name}</span>
          ) : null}
          {!isCollapsed && badge}
        </h2>
        {!isCollapsed && subtitle && <p className="text-[8px] text-[#555] mt-0.5">{subtitle}</p>}
      </div>

      {/* Collapse/Expand Button */}
      {onToggleCollapse && (
        <button
          onClick={onToggleCollapse}
          className="flex-shrink-0 p-0.5 rounded hover:bg-[#222] transition-colors focus:outline-none"
          title={isCollapsed ? "Expand panel" : "Collapse panel"}
        >
          {isCollapsed ? (
            <ChevronRight className="h-3 w-3 text-[#555] hover:text-[#888]" />
          ) : (
            <ChevronLeft className="h-3 w-3 text-[#555] hover:text-[#888]" />
          )}
        </button>
      )}

      {/* Header Actions */}
      {!isCollapsed && actions && <div className="flex-shrink-0">{actions}</div>}
    </div>
  );
}

export default function CommandCenter() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [claudeMessages, setClaudeMessages] = useState<ClaudeMessage[]>([]);
  const [claudeInput, setClaudeInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [pendingApproval, setPendingApproval] = useState<{
    content: string;
    templateName: string;
    isPDF?: boolean;
    isFax?: boolean;
  } | null>(null);
  const [activeDragId, setActiveDragId] = useState<PanelId | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const claudeScrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const stagingQueue = useStagingQueue();
  const panelLayout = usePanelLayout();
  const savedMessages = useSavedMessages();
  const [selectedTemplateCategory, setSelectedTemplateCategory] = useState<string>("saved_messages");
  const [showSavedMessageEditor, setShowSavedMessageEditor] = useState(false);
  const [editingSavedMessage, setEditingSavedMessage] = useState<SavedMessage | null>(null);
  const [draggedMessageId, setDraggedMessageId] = useState<string | null>(null);

  // DnD sensors configuration
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Fetch medical templates from database
  const { data: dbTemplates = [], isLoading: isLoadingTemplates } = useQuery<MedicalTemplate[]>({
    queryKey: ["medical-templates"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("medical_templates")
        .select("*")
        .eq("physician_id", user.id)
        .eq("is_enabled", true)
        .order("template_category", { ascending: true })
        .order("template_name", { ascending: true });

      if (error) {
        console.error("Error fetching templates:", error);
        return [];
      }
      return data || [];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Group templates by category
  const templatesByCategory = dbTemplates.reduce(
    (acc, template) => {
      if (!acc[template.template_category]) {
        acc[template.template_category] = [];
      }
      acc[template.template_category].push(template);
      return acc;
    },
    {} as Record<string, MedicalTemplate[]>
  );

  // Fetch all Spruce conversations (sorted by latest first) with localStorage caching
  const {
    data: conversations = [],
    isLoading,
    error,
    refetch,
  } = useQuery<Conversation[]>({
    queryKey: ["/api/spruce-conversations-all"],
    queryFn: async () => {
      try {
        const headers = await getAuthHeaders();
        const response = await fetch("/api/spruce-conversations-all", { headers });
        if (!response.ok) {
          // Try to use cached data if API fails
          const cached = localStorage.getItem("instanthpi_conversations");
          if (cached) {
            console.log("[CommandCenter] Using cached conversations (API failed)");
            return JSON.parse(cached);
          }
          throw new Error("Failed to fetch conversations");
        }
        const data = await response.json();
        if (data.error) throw new Error(data.message || data.error);
        const convs = Array.isArray(data) ? data : [];
        const sorted = convs.sort(
          (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        );
        // Cache conversations to localStorage
        try {
          localStorage.setItem("instanthpi_conversations", JSON.stringify(sorted));
          localStorage.setItem("instanthpi_conversations_updated", new Date().toISOString());
          console.log(`[CommandCenter] Cached ${sorted.length} conversations to localStorage`);
        } catch (e) {
          console.warn("[CommandCenter] Failed to cache conversations:", e);
        }
        return sorted;
      } catch (err) {
        // Fallback to cached data
        const cached = localStorage.getItem("instanthpi_conversations");
        if (cached) {
          console.log("[CommandCenter] Using cached conversations (fetch error)");
          return JSON.parse(cached);
        }
        throw err;
      }
    },
    refetchInterval: 30000,
    // Use cached data while loading
    placeholderData: () => {
      const cached = localStorage.getItem("instanthpi_conversations");
      return cached ? JSON.parse(cached) : [];
    },
  });

  // Get selected conversation - must be defined before callbacks that use it
  const selectedConversation = conversations.find((c) => c.id === selectedId);

  // Fetch conversation messages when selected with localStorage caching
  const { data: chatMessages = [], isLoading: isLoadingMessages } = useQuery<ChatMessage[]>({
    queryKey: ["/api/spruce/conversation", selectedId, "messages"],
    queryFn: async () => {
      if (!selectedId) return [];
      const cacheKey = `instanthpi_messages_${selectedId}`;
      try {
        const headers = await getAuthHeaders();
        const response = await fetch(`/api/spruce/conversations/${selectedId}/history`, { headers });
        if (!response.ok) {
          // Try cached messages if API fails
          const cached = localStorage.getItem(cacheKey);
          if (cached) {
            console.log(`[CommandCenter] Using cached messages for ${selectedId}`);
            return JSON.parse(cached);
          }
          throw new Error("Failed to fetch messages");
        }
        const data = await response.json();
        const messages = Array.isArray(data) ? data : (data.messages || []);
        // Cache messages
        try {
          localStorage.setItem(cacheKey, JSON.stringify(messages));
          console.log(`[CommandCenter] Cached ${messages.length} messages for ${selectedId}`);
        } catch (e) {
          console.warn("[CommandCenter] Failed to cache messages:", e);
        }
        return messages;
      } catch (err) {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          console.log(`[CommandCenter] Using cached messages for ${selectedId} (fetch error)`);
          return JSON.parse(cached);
        }
        throw err;
      }
    },
    enabled: !!selectedId,
    placeholderData: () => {
      if (!selectedId) return [];
      const cached = localStorage.getItem(`instanthpi_messages_${selectedId}`);
      return cached ? JSON.parse(cached) : [];
    },
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({
      conversationId,
      message,
    }: {
      conversationId: string;
      message: string;
    }) => {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/spruce/messages`, {
        method: "POST",
        headers,
        body: JSON.stringify({ conversationId, message }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to send message");
      }
      return response.json();
    },
    onSuccess: () => {
      // Invalidate conversation messages to refresh
      queryClient.invalidateQueries({ queryKey: ["/api/spruce/conversation", selectedId, "messages"] });
      toast({ title: "Message sent" });
    },
    onError: (error: Error) => {
      toast({ title: "Send failed", description: error.message, variant: "destructive" });
    },
  });

  // Generate AI response using template
  const generateWithTemplate = useCallback(
    async (template: (typeof TEMPLATES)[0]) => {
      if (!selectedId || !selectedConversation) {
        toast({ title: "Select a patient first", variant: "destructive" });
        return;
      }

      setIsGenerating(true);

      // Build conversation context as user prompt
      const conversationContext = chatMessages
        .map((m) => `${m.isFromPatient ? "Patient" : "Provider"}: ${m.content}`)
        .join("\n");

      const userPrompt = `Patient: ${selectedConversation.patient_name}

Recent conversation:
${conversationContext || selectedConversation.last_message || "No conversation history"}

Please generate an appropriate response.`;

      // Add user message to Claude chat
      const userMsg: ClaudeMessage = {
        id: `user_${Date.now()}`,
        role: "user",
        content: `[Using template: ${template.name}]\n\nPatient conversation loaded for ${selectedConversation.patient_name}`,
        timestamp: new Date(),
      };
      setClaudeMessages((prev) => [...prev, userMsg]);

      try {
        const headers = await getAuthHeaders();
        const response = await fetch("/api/ai/chat", {
          method: "POST",
          headers,
          body: JSON.stringify({
            prompt: userPrompt,
            model: "claude-3-5-haiku-20241022",
            systemPrompt:
              template.systemPrompt +
              `\n\nPatient name: ${selectedConversation.patient_name}. Generate a professional, empathetic message ready to send.`,
          }),
        });

        if (!response.ok) throw new Error("AI request failed");

        const data = await response.json();
        const aiContent =
          data.content || data.message || data.response || "Unable to generate response";

        // Format the response
        const formattedResponse = `Dear ${selectedConversation.patient_name},\n\n${aiContent}\n\nBest regards,\nInstantHPI Team`;

        // Add AI response to Claude chat
        const aiMsg: ClaudeMessage = {
          id: `ai_${Date.now()}`,
          role: "assistant",
          content: formattedResponse,
          timestamp: new Date(),
        };
        setClaudeMessages((prev) => [...prev, aiMsg]);

        // Set pending approval with template type flags
        setPendingApproval({
          content: formattedResponse,
          templateName: template.name,
          isPDF: template.isPDF,
          isFax: template.isFax,
        });

        // Handle PDF generation
        if (template.isPDF) {
          toast({
            title: "PDF Ready",
            description: "Review the prescription and click approve to generate PDF",
          });
        }

        // Handle Fax
        if (template.isFax) {
          toast({
            title: "Fax Prepared",
            description: "Review and approve to send fax to pharmacy",
          });
        }
      } catch (error) {
        console.error("AI generation error:", error);
        toast({ title: "Generation failed", variant: "destructive" });
      } finally {
        setIsGenerating(false);
      }
    },
    [selectedId, chatMessages, toast]
  );

  // Generate with database template
  const generateWithDbTemplate = useCallback(
    async (dbTemplate: MedicalTemplate) => {
      if (!selectedId || !selectedConversation) {
        toast({ title: "Select a patient first", variant: "destructive" });
        return;
      }

      setIsGenerating(true);

      // Build conversation context as user prompt
      const conversationContext = chatMessages
        .map((m) => `${m.isFromPatient ? "Patient" : "Provider"}: ${m.content}`)
        .join("\n");

      // Determine if this is a PDF-generating template
      const isPdfCategory = [
        "soap_note",
        "specialist_referral",
        "imaging_requisition",
        "work_leave",
      ].includes(dbTemplate.template_category);

      const userPrompt = `Patient: ${selectedConversation.patient_name}

Recent conversation:
${conversationContext || selectedConversation.last_message || "No conversation history"}

Reference template to follow (adapt to this patient's case):
${dbTemplate.template_content}

Please generate appropriate content based on the template style and patient conversation.`;

      // Add user message to Claude chat
      const userMsg: ClaudeMessage = {
        id: `user_${Date.now()}`,
        role: "user",
        content: `[Using template: ${dbTemplate.template_name}]\n\nGenerating for ${selectedConversation.patient_name}`,
        timestamp: new Date(),
      };
      setClaudeMessages((prev) => [...prev, userMsg]);

      try {
        const categoryConfig =
          TEMPLATE_CATEGORIES[dbTemplate.template_category as keyof typeof TEMPLATE_CATEGORIES];
        const systemPrompt = `You are a medical documentation assistant for Truck Stop Sante clinic (Dr Carlos Faviel Font, CMQ: 16812).
Based on the patient conversation and reference template provided, generate appropriate ${categoryConfig?.label || "medical"} documentation.
Write in formal medical French. Follow the style and format of the reference template but adapt the content to this specific patient case.
Extract all relevant clinical information from the conversation.`;

        const aiHeaders = await getAuthHeaders();
        const response = await fetch("/api/ai/chat", {
          method: "POST",
          headers: aiHeaders,
          body: JSON.stringify({
            prompt: userPrompt,
            model: "claude-3-5-haiku-20241022",
            systemPrompt,
          }),
        });

        if (!response.ok) throw new Error("AI request failed");

        const data = await response.json();
        const aiContent =
          data.content || data.message || data.response || "Unable to generate response";

        // Add AI response to Claude chat
        const aiMsg: ClaudeMessage = {
          id: `ai_${Date.now()}`,
          role: "assistant",
          content: aiContent,
          timestamp: new Date(),
        };
        setClaudeMessages((prev) => [...prev, aiMsg]);

        // Set pending approval with PDF flag for clinical documents
        setPendingApproval({
          content: aiContent,
          templateName: dbTemplate.template_name,
          isPDF: isPdfCategory,
        });

        // Update usage count in database
        supabase
          .from("medical_templates")
          .update({ usage_count: (dbTemplate.usage_count || 0) + 1 })
          .eq("id", dbTemplate.id)
          .then(() => {});
      } catch (error) {
        console.error("AI generation error:", error);
        toast({ title: "Generation failed", variant: "destructive" });
      } finally {
        setIsGenerating(false);
      }
    },
    [selectedId, chatMessages, selectedConversation, toast]
  );

  // Free chat with Claude
  const sendToClaudeChat = useCallback(async () => {
    if (!claudeInput.trim()) return;

    const userMsg: ClaudeMessage = {
      id: `user_${Date.now()}`,
      role: "user",
      content: claudeInput,
      timestamp: new Date(),
    };
    setClaudeMessages((prev) => [...prev, userMsg]);
    setClaudeInput("");
    setIsGenerating(true);

    try {
      const conversationContext = selectedConversation
        ? `Current patient: ${selectedConversation.patient_name}\nRecent message: ${selectedConversation.last_message}`
        : "No patient selected";

      const chatHeaders = await getAuthHeaders();
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: chatHeaders,
        body: JSON.stringify({
          prompt: `Context: ${conversationContext}\n\nUser request: ${claudeInput}`,
          model: "claude-3-5-haiku-20241022",
          systemPrompt:
            "You are a helpful medical office AI assistant. Help with patient communications, scheduling, and administrative tasks. Be concise and professional.",
        }),
      });

      if (!response.ok) throw new Error("AI request failed");

      const data = await response.json();
      const aiContent = data.content || data.message || "No response";

      const aiMsg: ClaudeMessage = {
        id: `ai_${Date.now()}`,
        role: "assistant",
        content: aiContent,
        timestamp: new Date(),
      };
      setClaudeMessages((prev) => [...prev, aiMsg]);
    } catch (error) {
      toast({ title: "Chat error", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  }, [claudeInput, selectedConversation, toast]);

  // Approve message -> move to staging queue or generate PDF
  const approveMessage = useCallback(async () => {
    if (!pendingApproval || !selectedId || !selectedConversation) return;

    // Handle PDF generation
    if (pendingApproval.isPDF) {
      try {
        // Extract patient info from conversation
        const patientData = extractPatientInfoFromConversation(
          chatMessages,
          selectedConversation.patient_name
        );

        // Generate and download PDF
        await generateAndDownloadRequete(
          patientData,
          pendingApproval.content // The AI-generated description/prescription
        );

        toast({ title: "PDF Generated", description: "Download started" });
        setPendingApproval(null);
        return;
      } catch (error) {
        console.error("PDF generation error:", error);
        toast({
          title: "PDF Error",
          description: "Failed to generate PDF",
          variant: "destructive",
        });
        return;
      }
    }

    // Handle Fax (for now, just download PDF + show fax info)
    if (pendingApproval.isFax) {
      try {
        const patientData = extractPatientInfoFromConversation(
          chatMessages,
          selectedConversation.patient_name
        );

        await generateAndDownloadRequete(patientData, pendingApproval.content);

        toast({
          title: "Fax Document Ready",
          description: "PDF downloaded. Fax to pharmacy: 833-964-4725",
        });
        setPendingApproval(null);
        return;
      } catch (error) {
        console.error("Fax document error:", error);
        toast({
          title: "Error",
          description: "Failed to generate fax document",
          variant: "destructive",
        });
        return;
      }
    }

    // Standard message -> staging queue
    stagingQueue.addToQueue(
      pendingApproval.content,
      selectedId,
      selectedConversation.patient_name,
      selectedId,
      true
    );
    setPendingApproval(null);
    toast({ title: "Message approved", description: "60 second countdown started" });
  }, [pendingApproval, selectedId, selectedConversation, chatMessages, stagingQueue, toast]);

  // Reject pending message
  const rejectMessage = useCallback(() => {
    setPendingApproval(null);
    toast({ title: "Message rejected" });
  }, [toast]);

  // Handle staged message countdown and auto-send
  useEffect(() => {
    const interval = setInterval(() => {
      stagingQueue.messages.forEach((msg) => {
        if (msg.status === "pending" && msg.countdown > 0) {
          stagingQueue.updateCountdown(msg.id, msg.countdown - 1);

          if (msg.countdown <= 1) {
            stagingQueue.markAsSending(msg.id);
            sendMessageMutation.mutate(
              { conversationId: msg.conversationId, message: msg.content },
              {
                onSuccess: () => stagingQueue.markAsSent(msg.id),
                onError: () => stagingQueue.markAsError(msg.id, "Failed to send"),
              }
            );
          }
        }
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [stagingQueue, sendMessageMutation]);

  // Scroll effects
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  useEffect(() => {
    claudeScrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [claudeMessages]);

  // Clear Claude chat when patient changes
  useEffect(() => {
    setClaudeMessages([]);
    setPendingApproval(null);
  }, [selectedId]);

  const filteredConversations = searchQuery
    ? conversations.filter((c) => c.patient_name?.toLowerCase().includes(searchQuery.toLowerCase()))
    : conversations;

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    return date.toLocaleDateString();
  };

  const getInitials = (name: string) =>
    name
      ?.split(" ")
      .map((p) => p[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "?";

  const pendingMessages = stagingQueue.messages.filter(
    (m) => m.status === "pending" || m.status === "sending"
  );

  // Drag handlers
  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(event.active.id as PanelId);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragId(null);

    if (over && active.id !== over.id) {
      panelLayout.reorderPanels(active.id as PanelId, over.id as PanelId);
      toast({
        title: "Layout updated",
        description: "Panel order saved",
      });
    }
  };

  // Panel content renderers
  const renderPanelContent = (panelId: PanelId) => {
    switch (panelId) {
      case "inbox":
        return (
          <>
            <SortablePanelHeader
              id="inbox"
              name={panelLayout.panelNames.inbox}
              icon={PANEL_ICONS.inbox}
              onNameChange={(name) => panelLayout.updatePanelName("inbox", name)}
            />
            <div className="p-2 border-b border-[#1a1a1a]">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-[#444]" />
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-7 h-6 text-[10px] bg-[#111] border-[#222] text-[#fafafa]"
                />
              </div>
            </div>

            <ScrollArea className="flex-1">
              {isLoading ? (
                <div className="p-4 text-center">
                  <Loader2 className="h-4 w-4 animate-spin mx-auto text-[#d4af37]" />
                </div>
              ) : error ? (
                <div className="p-4 text-center text-[10px] text-[#ef4444]">Connection error</div>
              ) : (
                <div className="p-1">
                  {filteredConversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => setSelectedId(conv.id)}
                      className={cn(
                        "w-full p-1.5 mb-0.5 rounded text-left transition-all",
                        selectedId === conv.id
                          ? "bg-[#d4af37]/10 border-l-2 border-l-[#d4af37]"
                          : "hover:bg-[#111]"
                      )}
                    >
                      <div className="flex items-center gap-1.5">
                        <div
                          className={cn(
                            "h-6 w-6 rounded flex items-center justify-center text-[9px] font-bold flex-shrink-0",
                            conv.unread_count > 0
                              ? "bg-[#d4af37] text-[#0a0908]"
                              : "bg-[#222] text-[#666]"
                          )}
                        >
                          {getInitials(conv.patient_name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-medium text-[#fafafa] truncate">
                              {conv.patient_name}
                            </span>
                            <span className="text-[8px] text-[#555] ml-1">
                              {formatTime(conv.updated_at)}
                            </span>
                          </div>
                          <p className="text-[9px] text-[#555] truncate">{conv.last_message}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>

            <div className="p-1.5 border-t border-[#1a1a1a] text-[8px] text-[#444] flex justify-between items-center">
              <span>{conversations.length} total</span>
              <button onClick={() => refetch()} className="hover:text-[#d4af37] p-1">
                <RefreshCw className="h-3 w-3" />
              </button>
            </div>
          </>
        );

      case "history":
        return (
          <>
            <SortablePanelHeader
              id="history"
              name={panelLayout.panelNames.history}
              icon={PANEL_ICONS.history}
              subtitle={selectedConversation?.patient_name}
              onNameChange={(name) => panelLayout.updatePanelName("history", name)}
            />

            <ScrollArea className="flex-1 p-2">
              {!selectedId ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <User className="h-6 w-6 mx-auto text-[#333] mb-1" />
                    <p className="text-[9px] text-[#555]">Select a conversation</p>
                  </div>
                </div>
              ) : isLoadingMessages ? (
                <div className="flex items-center justify-center h-20">
                  <Loader2 className="h-4 w-4 animate-spin text-[#d4af37]" />
                </div>
              ) : chatMessages.length === 0 ? (
                <div className="text-center text-[#555] text-[10px] py-4">No messages</div>
              ) : (
                <div className="space-y-1.5">
                  {[...chatMessages].reverse().map((msg) => (
                    <div
                      key={msg.id}
                      className={cn(
                        "flex flex-col",
                        msg.isFromPatient ? "items-start" : "items-end"
                      )}
                    >
                      {/* Channel type indicator */}
                      <div
                        className={cn(
                          "flex items-center gap-1 mb-0.5",
                          msg.isFromPatient ? "ml-1" : "mr-1"
                        )}
                      >
                        {msg.channelType === "sms" && (
                          <Badge className="h-4 px-1 text-[7px] bg-blue-600/80 flex items-center gap-0.5">
                            <Smartphone className="h-2.5 w-2.5" />
                            SMS
                          </Badge>
                        )}
                        {msg.channelType === "secure" && (
                          <Badge className="h-4 px-1 text-[7px] bg-green-600/80 flex items-center gap-0.5">
                            <Lock className="h-2.5 w-2.5" />
                            Secure
                          </Badge>
                        )}
                        {msg.channelType === "email" && (
                          <Badge className="h-4 px-1 text-[7px] bg-purple-600/80 flex items-center gap-0.5">
                            <Mail className="h-2.5 w-2.5" />
                            Email
                          </Badge>
                        )}
                        {msg.senderName && (
                          <span className="text-[8px] text-[#666]">{msg.senderName}</span>
                        )}
                      </div>

                      <div
                        className={cn(
                          "max-w-[90%] p-1.5 rounded text-[10px]",
                          msg.isFromPatient
                            ? msg.channelType === "sms"
                              ? "bg-blue-900/30 border border-blue-700/30 text-[#e6e6e6]"
                              : "bg-[#1a1a1a] text-[#e6e6e6]"
                            : "bg-[#d4af37] text-[#0a0908]"
                        )}
                      >
                        {msg.content && <p className="whitespace-pre-wrap">{msg.content}</p>}

                        {/* Render attachments/images/videos */}
                        {msg.attachments && msg.attachments.length > 0 && (
                          <div className="mt-1.5 space-y-1">
                            {msg.attachments.map((attachment) => (
                              <div key={attachment.id} className="rounded overflow-hidden">
                                {attachment.type === "image" ? (
                                  <div className="relative group">
                                    <img
                                      src={attachment.url}
                                      alt={attachment.name || "Patient image"}
                                      className="max-w-full max-h-[200px] rounded cursor-pointer hover:opacity-90 transition-opacity"
                                      onClick={() => window.open(attachment.url, "_blank")}
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = "none";
                                        (
                                          e.target as HTMLImageElement
                                        ).nextElementSibling?.classList.remove("hidden");
                                      }}
                                    />
                                    <div className="hidden p-2 bg-[#222] rounded text-[9px] text-[#888]">
                                      <ImageIcon className="h-4 w-4 mx-auto mb-1 opacity-50" />
                                      Image unavailable
                                    </div>
                                    <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-0.5">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          window.open(attachment.url, "_blank");
                                        }}
                                        className="p-1 bg-black/50 rounded hover:bg-black/70"
                                        title="Open full size"
                                      >
                                        <ExternalLink className="h-3 w-3 text-white" />
                                      </button>
                                      <a
                                        href={attachment.url}
                                        download={attachment.name || "image"}
                                        onClick={(e) => e.stopPropagation()}
                                        className="p-1 bg-black/50 rounded hover:bg-black/70"
                                        title="Download"
                                      >
                                        <Download className="h-3 w-3 text-white" />
                                      </a>
                                    </div>
                                    <div className="flex items-center gap-1 mt-0.5 text-[8px] opacity-70">
                                      <ImageIcon className="h-2.5 w-2.5" />
                                      <span>{attachment.name || "Image"}</span>
                                    </div>
                                  </div>
                                ) : attachment.type === "video" ? (
                                  <div className="relative group">
                                    <video
                                      src={attachment.url}
                                      controls
                                      className="max-w-full max-h-[200px] rounded"
                                      preload="metadata"
                                    >
                                      Your browser does not support video playback.
                                    </video>
                                    <div className="flex items-center gap-1 mt-0.5 text-[8px] opacity-70">
                                      <Video className="h-2.5 w-2.5" />
                                      <span>{attachment.name || "Video"}</span>
                                      <a
                                        href={attachment.url}
                                        download={attachment.name || "video"}
                                        className="ml-auto hover:text-[#d4af37]"
                                        title="Download video"
                                      >
                                        <Download className="h-2.5 w-2.5" />
                                      </a>
                                    </div>
                                  </div>
                                ) : attachment.type === "audio" ? (
                                  <div className="p-1.5 bg-black/20 rounded">
                                    <audio
                                      src={attachment.url}
                                      controls
                                      className="w-full h-8"
                                      preload="metadata"
                                    >
                                      Your browser does not support audio playback.
                                    </audio>
                                    <div className="flex items-center gap-1 mt-0.5 text-[8px] opacity-70">
                                      <FileAudio className="h-2.5 w-2.5" />
                                      <span>{attachment.name || "Audio"}</span>
                                    </div>
                                  </div>
                                ) : (
                                  <a
                                    href={attachment.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 p-1 bg-black/20 rounded hover:bg-black/30 transition-colors"
                                  >
                                    <FileText className="h-3 w-3" />
                                    <span className="text-[8px] truncate flex-1">
                                      {attachment.name || "Document"}
                                    </span>
                                    {attachment.size && (
                                      <span className="text-[7px] opacity-60">
                                        {(attachment.size / 1024).toFixed(1)}KB
                                      </span>
                                    )}
                                    <Download className="h-2.5 w-2.5" />
                                  </a>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        <p className="text-[8px] opacity-60 mt-0.5">{formatTime(msg.timestamp)}</p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>
          </>
        );

      case "queue":
        return (
          <>
            <SortablePanelHeader
              id="queue"
              name={panelLayout.panelNames.queue}
              icon={PANEL_ICONS.queue}
              badge={
                pendingMessages.length > 0 ? (
                  <Badge className="ml-auto h-4 px-1 text-[8px] bg-[#ef4444]">
                    {pendingMessages.length}
                  </Badge>
                ) : undefined
              }
              subtitle="60s countdown → auto-send"
              onNameChange={(name) => panelLayout.updatePanelName("queue", name)}
            />

            <ScrollArea className="flex-1 p-1.5">
              {pendingMessages.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center p-2">
                    <Send className="h-5 w-5 mx-auto text-[#333] mb-1" />
                    <p className="text-[9px] text-[#555]">Approved messages</p>
                    <p className="text-[8px] text-[#444]">appear here</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {pendingMessages.map((msg) => {
                    const progress = (msg.countdown / DEFAULT_TIMER_CONFIG.initialCountdown) * 100;
                    const isUrgent = msg.countdown <= 10;
                    const isSending = msg.status === "sending";

                    return (
                      <Card
                        key={msg.id}
                        className={cn(
                          "border",
                          isUrgent && !isSending && "border-[#ef4444]/50 bg-[#ef4444]/5",
                          isSending && "border-[#d4af37]/50 bg-[#d4af37]/5",
                          !isUrgent && !isSending && "bg-[#111] border-[#222]"
                        )}
                      >
                        <CardContent className="p-2">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[9px] text-[#888] truncate">
                              {msg.patientName}
                            </span>
                            {isSending ? (
                              <Loader2 className="h-3 w-3 animate-spin text-[#d4af37]" />
                            ) : (
                              <span
                                className={cn(
                                  "text-xs font-bold",
                                  isUrgent ? "text-[#ef4444]" : "text-[#fafafa]"
                                )}
                              >
                                {msg.countdown}s
                              </span>
                            )}
                          </div>
                          <p className="text-[9px] text-[#aaa] line-clamp-2 mb-1.5">
                            {msg.content}
                          </p>
                          <Progress
                            value={progress}
                            className={cn("h-0.5 mb-1.5", isUrgent && "[&>div]:bg-[#ef4444]")}
                          />
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => stagingQueue.cancelMessage(msg.id)}
                              disabled={isSending}
                              className="h-5 px-1.5 text-[8px] flex-1"
                            >
                              <X className="h-2.5 w-2.5" />
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => {
                                stagingQueue.markAsSending(msg.id);
                                sendMessageMutation.mutate(
                                  { conversationId: msg.conversationId, message: msg.content },
                                  {
                                    onSuccess: () => stagingQueue.markAsSent(msg.id),
                                    onError: () => stagingQueue.markAsError(msg.id, "Failed"),
                                  }
                                );
                              }}
                              disabled={isSending}
                              className="h-5 px-1.5 text-[8px] flex-1 bg-[#d4af37] text-[#0a0908]"
                            >
                              <Send className="h-2.5 w-2.5" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </>
        );

      case "ai":
        return (
          <>
            <SortablePanelHeader
              id="ai"
              name={panelLayout.panelNames.ai}
              icon={PANEL_ICONS.ai}
              badge={
                <Badge variant="secondary" className="ml-auto text-[8px] h-4">
                  Haiku 4.5
                </Badge>
              }
              subtitle="Review & approve AI responses"
              onNameChange={(name) => panelLayout.updatePanelName("ai", name)}
            />

            <ScrollArea className="flex-1 p-2">
              {claudeMessages.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center p-4">
                    <Bot className="h-8 w-8 mx-auto text-[#333] mb-2" />
                    <p className="text-[10px] text-[#555]">Click a template to generate</p>
                    <p className="text-[9px] text-[#444] mt-1">or chat freely below</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {claudeMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}
                    >
                      <div
                        className={cn(
                          "max-w-[90%] p-2 rounded text-[10px]",
                          msg.role === "user"
                            ? "bg-[#1a1a1a] text-[#e6e6e6]"
                            : "bg-[#0a1a0a] border border-[#22c55e]/30 text-[#e6e6e6]"
                        )}
                      >
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    </div>
                  ))}
                  {isGenerating && (
                    <div className="flex justify-start">
                      <div className="bg-[#111] rounded p-2">
                        <Loader2 className="h-4 w-4 animate-spin text-[#d4af37]" />
                      </div>
                    </div>
                  )}
                  <div ref={claudeScrollRef} />
                </div>
              )}
            </ScrollArea>

            {/* Approval buttons */}
            {pendingApproval && (
              <div className="p-2 border-t border-[#1a1a1a] bg-[#0a1a0a]">
                <p className="text-[9px] text-[#22c55e] mb-1.5">
                  Ready to approve: {pendingApproval.templateName}
                  {pendingApproval.isPDF && (
                    <Badge className="ml-1 h-3 text-[7px] bg-teal-600">PDF</Badge>
                  )}
                  {pendingApproval.isFax && (
                    <Badge className="ml-1 h-3 text-[7px] bg-indigo-600">FAX</Badge>
                  )}
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={rejectMessage}
                    className="h-7 flex-1 text-[10px]"
                  >
                    <X className="h-3 w-3 mr-1" /> Reject
                  </Button>
                  <Button
                    size="sm"
                    onClick={approveMessage}
                    className="h-7 flex-1 text-[10px] bg-[#22c55e] hover:bg-[#16a34a]"
                  >
                    {pendingApproval.isPDF ? (
                      <>
                        <FileDown className="h-3 w-3 mr-1" /> Generate PDF
                      </>
                    ) : pendingApproval.isFax ? (
                      <>
                        <Printer className="h-3 w-3 mr-1" /> Generate & Fax
                      </>
                    ) : (
                      <>
                        <Check className="h-3 w-3 mr-1" /> Approve → Queue
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Free chat input */}
            <div className="p-2 border-t border-[#1a1a1a]">
              <div className="flex gap-1.5">
                <Textarea
                  placeholder="Chat with Claude..."
                  value={claudeInput}
                  onChange={(e) => setClaudeInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendToClaudeChat();
                    }
                  }}
                  disabled={isGenerating}
                  className="min-h-[50px] resize-none text-[10px] bg-[#111] border-[#222]"
                />
                <Button
                  onClick={sendToClaudeChat}
                  disabled={!claudeInput.trim() || isGenerating}
                  size="icon"
                  className="h-[50px] w-10 bg-[#d4af37] text-[#0a0908]"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        );

      case "templates":
        return (
          <>
            <SortablePanelHeader
              id="templates"
              name={panelLayout.panelNames.templates}
              icon={PANEL_ICONS.templates}
              subtitle="Click any template to generate"
              onNameChange={(name) => panelLayout.updatePanelName("templates", name)}
              actions={
                <button
                  onClick={panelLayout.resetLayout}
                  className="p-1 hover:bg-[#222] rounded transition-colors"
                  title="Reset layout"
                >
                  <RotateCcw className="h-3 w-3 text-[#555] hover:text-[#888]" />
                </button>
              }
            />

            {/* Category tabs */}
            <div className="p-1.5 border-b border-[#1a1a1a]">
              <div className="flex flex-wrap gap-1">
                {Object.entries(TEMPLATE_CATEGORIES).map(([key, config]) => {
                  const Icon = config.icon;
                  // saved_messages always available from localStorage
                  const hasTemplates = key === "saved_messages"
                    ? savedMessages.messages.length > 0
                    : templatesByCategory[key]?.length > 0;
                  const count = key === "saved_messages"
                    ? savedMessages.messages.length
                    : templatesByCategory[key]?.length || 0;
                  return (
                    <button
                      key={key}
                      onClick={() => setSelectedTemplateCategory(key)}
                      className={cn(
                        "flex items-center gap-1 px-2 py-1 rounded text-[9px] transition-all",
                        selectedTemplateCategory === key
                          ? `${config.color} text-white`
                          : "bg-[#1a1a1a] text-[#888] hover:bg-[#222]",
                        !hasTemplates && key !== "saved_messages" && "opacity-30"
                      )}
                    >
                      <Icon className="h-3 w-3" />
                      {config.label}
                      {count > 0 && (
                        <span className="ml-0.5 bg-white/20 px-1 rounded text-[8px]">
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Templates list - Saved Messages or DB templates */}
            <ScrollArea className="flex-1 p-2">
              {selectedTemplateCategory === "saved_messages" ? (
                /* Saved Messages - Split into AI (top) and Patient (bottom) */
                savedMessages.isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-[#d4af37]" />
                  </div>
                ) : savedMessages.messages.length === 0 ? (
                  <div className="text-center py-8 text-[#555] text-[10px]">
                    <Zap className="h-6 w-6 mx-auto mb-2 opacity-50" />
                    No saved messages yet
                    <p className="text-[8px] mt-1">Click + to add quick replies</p>
                  </div>
                ) : (
                  <div className="flex flex-col h-full gap-2">
                    {/* TOP HALF: AI Prompts (messages NOT starting with ".") */}
                    <div
                      className="flex-1 min-h-0"
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.currentTarget.classList.add("bg-purple-500/10");
                      }}
                      onDragLeave={(e) => {
                        e.currentTarget.classList.remove("bg-purple-500/10");
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.currentTarget.classList.remove("bg-purple-500/10");
                        if (draggedMessageId) {
                          const msg = savedMessages.messages.find(m => m.id === draggedMessageId);
                          if (msg?.shortcut?.startsWith(".")) {
                            // Move from Patient to AI: remove "." prefix
                            const newShortcut = msg.shortcut.substring(1) || null;
                            savedMessages.updateMessage(draggedMessageId, { shortcut: newShortcut });
                            toast({ title: "Moved to AI Prompts" });
                          }
                          setDraggedMessageId(null);
                        }
                      }}
                    >
                      <div className="flex items-center gap-1 mb-1 px-1">
                        <Bot className="h-3 w-3 text-purple-400" />
                        <span className="text-[8px] text-purple-400 font-medium">AI Prompts</span>
                      </div>
                      <div className="grid grid-cols-3 gap-1 overflow-y-auto max-h-[calc(50%-20px)]">
                        {savedMessages.sortedByUsage
                          .filter((msg) => !msg.shortcut?.startsWith("."))
                          .map((msg) => (
                          <button
                            key={msg.id}
                            draggable
                            onDragStart={() => setDraggedMessageId(msg.id)}
                            onDragEnd={() => setDraggedMessageId(null)}
                            onClick={() => {
                              setAiPrompt(msg.content);
                              savedMessages.incrementUsage(msg.id);
                              toast({ title: "AI Chat", description: msg.title });
                            }}
                            onContextMenu={(e) => {
                              e.preventDefault();
                              setEditingSavedMessage(msg);
                              setShowSavedMessageEditor(true);
                            }}
                            className="group relative p-1.5 rounded bg-purple-500/10 border border-purple-500/30 hover:bg-purple-500/20 hover:border-purple-500/50 transition-all cursor-grab active:cursor-grabbing"
                            title={msg.content}
                          >
                            <span
                              onClick={(e) => {
                                e.stopPropagation();
                                savedMessages.deleteMessage(msg.id);
                                toast({ title: "Deleted", description: msg.title });
                              }}
                              className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:bg-red-600 z-10"
                            >
                              <X className="h-2 w-2 text-white" />
                            </span>
                            <p className="text-[9px] font-medium text-purple-300 truncate text-center leading-tight">
                              {msg.title}
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-[#333] my-1" />

                    {/* BOTTOM HALF: Patient Messages (messages starting with ".") */}
                    <div
                      className="flex-1 min-h-0"
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.currentTarget.classList.add("bg-[#d4af37]/10");
                      }}
                      onDragLeave={(e) => {
                        e.currentTarget.classList.remove("bg-[#d4af37]/10");
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.currentTarget.classList.remove("bg-[#d4af37]/10");
                        if (draggedMessageId) {
                          const msg = savedMessages.messages.find(m => m.id === draggedMessageId);
                          if (msg && !msg.shortcut?.startsWith(".")) {
                            // Move from AI to Patient: add "." prefix
                            const newShortcut = "." + (msg.shortcut || msg.title.toLowerCase().replace(/\s+/g, ""));
                            savedMessages.updateMessage(draggedMessageId, { shortcut: newShortcut });
                            toast({ title: "Moved to Patient Messages" });
                          }
                          setDraggedMessageId(null);
                        }
                      }}
                    >
                      <div className="flex items-center gap-1 mb-1 px-1">
                        <User className="h-3 w-3 text-[#d4af37]" />
                        <span className="text-[8px] text-[#d4af37] font-medium">Patient Messages</span>
                      </div>
                      <div className="grid grid-cols-3 gap-1 overflow-y-auto max-h-[calc(50%-20px)]">
                        {savedMessages.sortedByUsage
                          .filter((msg) => msg.shortcut?.startsWith("."))
                          .map((msg) => (
                          <button
                            key={msg.id}
                            draggable
                            onDragStart={() => setDraggedMessageId(msg.id)}
                            onDragEnd={() => setDraggedMessageId(null)}
                            onClick={() => {
                              if (!selectedId) {
                                toast({ title: "Select a conversation first" });
                                return;
                              }
                              // Add to 1-minute queue on single click
                              stagingQueue.addToQueue(
                                msg.content,
                                selectedId,
                                selectedConversation?.patient_name || "Patient",
                                selectedId,
                                false
                              );
                              savedMessages.incrementUsage(msg.id);
                              toast({ title: "Queued (60s)", description: msg.title });
                            }}
                            onContextMenu={(e) => {
                              e.preventDefault();
                              setEditingSavedMessage(msg);
                              setShowSavedMessageEditor(true);
                            }}
                            className="group relative p-1.5 rounded bg-[#d4af37]/10 border border-[#d4af37]/30 hover:bg-[#d4af37]/20 hover:border-[#d4af37]/50 transition-all cursor-grab active:cursor-grabbing"
                            title={msg.content}
                          >
                            <span
                              onClick={(e) => {
                                e.stopPropagation();
                                savedMessages.deleteMessage(msg.id);
                                toast({ title: "Deleted", description: msg.title });
                              }}
                              className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:bg-red-600 z-10"
                            >
                              <X className="h-2 w-2 text-white" />
                            </span>
                            <p className="text-[9px] font-medium text-[#d4af37] truncate text-center leading-tight">
                              {msg.title}
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Add new button */}
                    <button
                      onClick={() => {
                        setEditingSavedMessage(null);
                        setShowSavedMessageEditor(true);
                      }}
                      className="w-full p-1.5 rounded border border-dashed border-[#333] text-[#555] hover:border-[#d4af37] hover:text-[#d4af37] transition-all text-[8px] mt-1"
                    >
                      + Add
                    </button>
                  </div>
                )
              ) : isLoadingTemplates ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-[#d4af37]" />
                </div>
              ) : !templatesByCategory[selectedTemplateCategory]?.length ? (
                <div className="text-center py-8 text-[#555] text-[10px]">
                  <FileText className="h-6 w-6 mx-auto mb-2 opacity-50" />
                  No templates in this category
                  <p className="text-[8px] mt-1">Add templates in Settings</p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {templatesByCategory[selectedTemplateCategory].map((template) => {
                    const categoryConfig =
                      TEMPLATE_CATEGORIES[
                        selectedTemplateCategory as keyof typeof TEMPLATE_CATEGORIES
                      ];
                    return (
                      <button
                        key={template.id}
                        onClick={() => generateWithDbTemplate(template)}
                        disabled={!selectedId || isGenerating}
                        className={cn(
                          "w-full p-2 rounded-lg transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed",
                          categoryConfig?.color || "bg-[#333]",
                          "hover:opacity-90 hover:scale-[1.01] active:scale-[0.99]"
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-bold text-white truncate">
                              {template.template_name}
                            </p>
                            <p className="text-[8px] text-white/70 line-clamp-2 mt-0.5">
                              {template.template_content.substring(0, 80)}...
                            </p>
                          </div>
                          {template.is_default && (
                            <Badge className="h-4 text-[7px] bg-white/20 flex-shrink-0">
                              Default
                            </Badge>
                          )}
                        </div>
                        {template.case_type && (
                          <Badge className="mt-1 h-4 text-[7px] bg-black/20">
                            {template.case_type}
                          </Badge>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </ScrollArea>

            {/* Quick action buttons (hardcoded templates) */}
            <div className="p-2 border-t border-[#1a1a1a]">
              <p className="text-[8px] text-[#555] mb-1.5">Quick Actions</p>
              <div className="grid grid-cols-3 gap-1">
                {TEMPLATES.slice(0, 3).map((template) => {
                  const Icon = template.icon;
                  return (
                    <button
                      key={template.id}
                      onClick={() => generateWithTemplate(template)}
                      disabled={!selectedId || isGenerating}
                      className={cn(
                        "p-1.5 rounded transition-all disabled:opacity-50",
                        template.color,
                        "hover:opacity-90"
                      )}
                      title={template.name}
                    >
                      <Icon className="h-3 w-3 text-white mx-auto" />
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-2 border-t border-[#1a1a1a] text-[8px] text-[#555] text-center">
              {selectedConversation
                ? `Patient: ${selectedConversation.patient_name}`
                : "Select a patient first"}
            </div>
          </>
        );

      default:
        return null;
    }
  };

  // Get active panel name for drag overlay
  const activePanelName = activeDragId ? panelLayout.panelNames[activeDragId] : "";

  return (
    <ModernLayout hideSidebar noPadding fullHeight>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        modifiers={[restrictToHorizontalAxis]}
      >
        <SortableContext items={panelLayout.panelOrder} strategy={horizontalListSortingStrategy}>
          <PanelGroup
            direction="horizontal"
            className="h-full bg-[#080808] overflow-hidden"
            onLayout={panelLayout.updateAllSizes}
          >
            {panelLayout.panelOrder.map((panelId, index) => {
              const config = DEFAULT_PANEL_CONFIGS[panelId];
              const isLast = index === panelLayout.panelOrder.length - 1;

              return (
                <React.Fragment key={panelId}>
                  <Panel
                    id={panelId}
                    defaultSize={panelLayout.panelSizes[panelId]}
                    minSize={config.minSize}
                    maxSize={config.maxSize}
                    className={cn(
                      "flex flex-col overflow-hidden",
                      !isLast && "border-r border-[#1a1a1a]",
                      activeDragId === panelId && "opacity-50 bg-[#d4af37]/5"
                    )}
                  >
                    {renderPanelContent(panelId)}
                  </Panel>
                  {!isLast && (
                    <PanelResizeHandle className="w-1 bg-[#1a1a1a] hover:bg-[#d4af37] transition-colors cursor-col-resize" />
                  )}
                </React.Fragment>
              );
            })}
          </PanelGroup>
        </SortableContext>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeDragId ? (
            <DragOverlayPanel name={activePanelName} icon={PANEL_ICONS[activeDragId]} />
          ) : null}
        </DragOverlay>
      </DndContext>
    </ModernLayout>
  );
}
