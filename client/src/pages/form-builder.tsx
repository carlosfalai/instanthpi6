import React, { useState } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Label } from "../components/ui/label";
import {
  Plus,
  Trash2,
  GripVertical,
  Settings,
  Eye,
  Share2,
  Sparkles,
  Type,
  AlignLeft,
  CheckSquare,
  ChevronDown,
  Calendar,
  Star,
  Link2,
  LayoutTemplate,
  X,
} from "lucide-react";
import ModernLayout from "../components/layout/ModernLayout";
import { useToast } from "@/hooks/use-toast";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { getTemplatesByPopularity, FormTemplate } from '../data/form-templates';

interface Question {
  id: string;
  type: "text" | "long" | "select" | "checkbox" | "date" | "rating";
  label: string;
  placeholder?: string;
  options?: string[];
  required?: boolean;
}

// Sortable Question Card Component
interface SortableQuestionProps {
  question: Question;
  updateQuestion: (id: string, updates: Partial<Question>) => void;
  removeQuestion: (id: string) => void;
}

function SortableQuestionCard({ question, updateQuestion, removeQuestion }: SortableQuestionProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: question.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : 1,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`glass-dark border-white/10 hover:border-primary/30 transition-all group overflow-hidden rounded-3xl ${isDragging ? 'shadow-2xl ring-2 ring-primary' : ''}`}
    >
      <div className="absolute top-0 left-0 w-1 h-full bg-primary/20 group-hover:bg-primary transition-colors" />
      <CardContent className="p-8">
        <div className="flex gap-4">
          <div className="pt-2" {...attributes} {...listeners}>
            <GripVertical className="h-5 w-5 text-white/40 cursor-grab hover:text-primary transition-colors active:cursor-grabbing" />
          </div>
          <div className="flex-1 space-y-4">
            <div className="flex justify-between items-start">
              <input
                value={question.label}
                onChange={(event) => updateQuestion(question.id, { label: event.target.value })}
                className="bg-transparent border-none text-lg font-bold text-white focus:ring-0 w-full"
                placeholder="Libellé de la question..."
              />
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/5 rounded-lg">
                  <Settings className="h-4 w-4 text-muted-foreground" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:bg-destructive/20 hover:text-destructive rounded-lg"
                  onClick={() => removeQuestion(question.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <Input
              value={question.placeholder ?? ""}
              onChange={(event) => updateQuestion(question.id, { placeholder: event.target.value })}
              className="glass border-white/10 h-12 text-sm"
              placeholder="Texte d'exemple affiché au patient"
            />
            <div className="w-full h-12 glass border-white/5 rounded-xl border-dashed border-2 flex items-center px-4 text-muted-foreground/40 italic">
              Visualisation de la réponse {question.type === "long" ? "longue" : ""}...
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function FormBuilder() {
  const [questions, setQuestions] = useState<Question[]>([
    { id: "1", type: "text", label: "Nom complet du client", placeholder: "Saisissez le nom..." },
  ]);
  const [formTitle, setFormTitle] = useState("Nouveau Formulaire de Consultation");
  const [formDescription, setFormDescription] = useState("Collecte structurée pour consultation InstantHPI.");
  const [preferredTemplates, setPreferredTemplates] = useState("");
  const [formId, setFormId] = useState<string | null>(null);
  const [shareSlug, setShareSlug] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // Template modal state
  const [showTemplates, setShowTemplates] = useState(false);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag end - reorder questions
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setQuestions((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  }

  // Load template into form
  function loadTemplate(template: FormTemplate) {
    setFormTitle(template.name);
    setFormDescription(template.description);
    setQuestions(template.questions.map((q, i) => ({
      ...q,
      id: Math.random().toString(36).substring(2, 9), // Generate new IDs
    })));
    setShowTemplates(false);
    toast({
      title: "Modèle chargé",
      description: `Le modèle "${template.name}" a été appliqué.`,
    });
  }

  const addQuestion = (type: Question["type"]) => {
    const newQuestion: Question = {
      id: Math.random().toString(36).substring(2, 9),
      type,
      label: "Nouvelle question",
      placeholder: "Indiquez l'instruction ici...",
    };
    setQuestions((prev) => [...prev, newQuestion]);
  };

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    setQuestions((prev) => prev.map((question) => (question.id === id ? { ...question, ...updates } : question)));
  };

  const removeQuestion = (id: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  const persistForm = async (publish = false) => {
    setSaving(true);
    try {
      const payload = {
        title: formTitle,
        description: formDescription,
        questions,
        settings: {
          preferredTemplates,
        },
        status: publish ? "published" : "draft",
      };

      const response = await fetch(formId ? `/api/intake-forms/${formId}` : "/api/intake-forms", {
        method: formId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Impossible de sauvegarder le formulaire");
      }

      const data = await response.json();
      setFormId(data.id);
      setShareSlug(data.slug);
      toast({
        title: publish ? "Formulaire publié" : "Brouillon sauvegardé",
        description: publish
          ? "L'URL publique est prête à être partagée."
          : "Vous pouvez revenir plus tard pour continuer la configuration.",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Sauvegarde impossible",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const publicUrl = shareSlug && origin ? `${origin}/f/${shareSlug}` : null;

  return (
    <ModernLayout title="Elite Form Builder" description="Créez des expériences de collecte d'informations d'exception">
      <div className="max-w-6xl mx-auto space-y-8 pb-20">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 glass p-6 rounded-3xl border-primary/20 sticky top-4 z-20 backdrop-blur-xl">
          <div className="flex-1 min-w-0">
            <input
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              className="bg-transparent border-none text-2xl font-black tracking-tight text-white focus:ring-0 w-full"
              placeholder="Titre du formulaire..."
            />
            <p className="text-muted-foreground text-sm flex items-center gap-2">
              <Sparkles className="h-3 w-3 text-primary" /> Prêt à générer vos formulaires patients
            </p>
            {publicUrl && (
              <div className="flex items-center gap-2 text-xs text-primary mt-2">
                <Link2 className="h-3 w-3" />
                <a className="underline" href={publicUrl} target="_blank" rel="noreferrer">
                  {publicUrl}
                </a>
              </div>
            )}
          </div>
          <div className="flex gap-3 shrink-0">
            <Button
              variant="outline"
              className="glass border-white/10 hover:bg-white/5 rounded-xl font-bold"
              onClick={() => void persistForm(false)}
              disabled={saving}
            >
              <Eye className="mr-2 h-4 w-4" /> Sauvegarder
            </Button>
            <Button
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-black tracking-widest uppercase rounded-xl neon-glow-primary"
              onClick={() => void persistForm(true)}
              disabled={saving}
            >
              <Share2 className="mr-2 h-4 w-4" /> Publier & Partager URL
            </Button>
          </div>
        </div>

        <Card className="glass border-white/10">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Description</CardTitle>
            <CardDescription>
              Résumez l'objectif pour guider les patients et alimenter le prompt IA.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={formDescription}
              onChange={(event) => setFormDescription(event.target.value)}
              rows={3}
              className="glass border-white/10"
              placeholder="Expliquez le contexte de ce formulaire (ex: Triage gastro-entérite légère)."
            />
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Tool Box */}
          <div className="lg:col-span-3 space-y-6 hidden lg:block">
            <Card className="glass border-white/5 sticky top-32">
              <CardHeader className="pb-4">
                <CardTitle className="text-sm font-black uppercase tracking-widest text-primary/80">Question Types</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 p-4">
                {[
                  { id: "text", label: "Texte Court", icon: Type },
                  { id: "long", label: "Texte Long", icon: AlignLeft },
                  { id: "select", label: "Choix Unique", icon: ChevronDown },
                  { id: "checkbox", label: "Choix Multiple", icon: CheckSquare },
                  { id: "date", label: "Date", icon: Calendar },
                  { id: "rating", label: "Évaluation", icon: Star },
                ].map((item) => (
                  <Button
                    key={item.id}
                    variant="ghost"
                    className="w-full justify-start gap-3 h-12 hover:bg-white/5 hover:text-white rounded-xl transition-all"
                    onClick={() => addQuestion(item.id as Question["type"])}
                  >
                    <item.icon className="h-4 w-4 text-primary" />
                    <span className="font-bold">{item.label}</span>
                    <Plus className="ml-auto h-3 w-3 opacity-20 group-hover:opacity-100" />
                  </Button>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Builder Area */}
          <div className="lg:col-span-9 space-y-6">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={questions.map(q => q.id)} strategy={verticalListSortingStrategy}>
                {questions.map((q) => (
                  <SortableQuestionCard
                    key={q.id}
                    question={q}
                    updateQuestion={updateQuestion}
                    removeQuestion={removeQuestion}
                  />
                ))}
              </SortableContext>
            </DndContext>

            <Button
              onClick={() => addQuestion("text")}
              className="w-full h-20 glass border-2 border-dashed border-white/10 hover:border-primary/50 hover:bg-primary/5 text-muted-foreground hover:text-primary rounded-3xl transition-all font-black uppercase tracking-widest text-lg"
            >
              <Plus className="mr-3 h-6 w-6" /> Ajouter une Question
            </Button>

            <Card className="glass-dark border-white/10">
              <CardHeader>
                <CardTitle className="text-lg font-bold">Préférences de génération IA</CardTitle>
                <CardDescription>
                  Collez ici vos styles de SOAP notes, messages patients et modèles que l'IA doit suivre (voir liste fournie).
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={preferredTemplates}
                  onChange={(event) => setPreferredTemplates(event.target.value)}
                  rows={8}
                  className="glass border-white/10"
                  placeholder="Collez vos textes préférés pour guider la génération (SOAP styles, messages patient, arrêts de travail, etc.)"
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ModernLayout >
  );
}
