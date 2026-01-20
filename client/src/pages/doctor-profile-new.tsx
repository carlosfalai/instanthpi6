import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { supabase } from "../lib/supabase";
import {
  ArrowLeft,
  Key,
  Bot,
  MessageSquare,
  Eye,
  EyeOff,
  Check,
  AlertCircle,
  Loader2,
  TestTube,
  Settings,
  FileText,
  Plus,
  Trash2,
  Edit,
  Sparkles,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
import { Textarea } from "../components/ui/textarea";
import { useToast } from "../hooks/use-toast";
import MedicalTemplatesManager from "../components/doctor/MedicalTemplatesManager";
import ModernLayout from "@/components/layout/ModernLayout";

export default function DoctorProfileNew() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);

  // Profile state
  const [specialty, setSpecialty] = useState("");

  // API Credentials state
  const [spruceAccessId, setSpruceAccessId] = useState("");
  const [spruceApiKey, setSpruceApiKey] = useState("");
  const [preferredAI, setPreferredAI] = useState<"openai" | "claude" | "none">("none");
  const [openaiKey, setOpenaiKey] = useState("");
  const [claudeKey, setClaudeKey] = useState("");

  // Show/hide toggles
  const [showSpruceAccess, setShowSpruceAccess] = useState(false);
  const [showSpruceApi, setShowSpruceApi] = useState(false);
  const [showOpenAI, setShowOpenAI] = useState(false);
  const [showClaude, setShowClaude] = useState(false);

  // Verification status
  const [hasCredentials, setHasCredentials] = useState(false);

  // API Testing status
  const [apiStatus, setApiStatus] = useState({
    spruce: "unknown" as "working" | "broken" | "unknown",
    openai: "unknown" as "working" | "broken" | "unknown",
    claude: "unknown" as "working" | "broken" | "unknown",
  });
  const [testingAll, setTestingAll] = useState(false);
  const [testResults, setTestResults] = useState<{
    spruce: boolean | null | string;
    openai: boolean | null | string;
    claude: boolean | null | string;
  }>({
    spruce: null,
    openai: null,
    claude: null,
  });
  const [credentialsVerified, setCredentialsVerified] = useState(false);

  // Diagnostic Templates state
  const [templates, setTemplates] = useState<any[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [generatingTemplate, setGeneratingTemplate] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [newDiagnosisName, setNewDiagnosisName] = useState("");
  const [newTemplateSpecialty, setNewTemplateSpecialty] = useState("");
  const [editingTemplate, setEditingTemplate] = useState<any>(null);

  useEffect(() => {
    loadProfile();
    loadTemplates();
  }, []);

  const loadProfile = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        navigate("/doctor-login");
        return;
      }

      // Load specialty from physician_profiles
      const { data: profileData } = await supabase
        .from("physician_profiles")
        .select("specialty")
        .eq("physician_id", user.id)
        .single();

      if (profileData) {
        setSpecialty(profileData.specialty || "");
      }

      // Load credential status (not the actual keys)
      const response = await fetch("/api/doctor/credentials");
      if (response.ok) {
        const data = await response.json();
        setHasCredentials(data.has_credentials);
        setCredentialsVerified(data.credentials_verified);
        setPreferredAI(data.preferred_ai_provider || "none");
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    } finally {
      setLoading(false);
    }
  };

  // Test individual API
  const testAPI = async (provider: "spruce" | "openai" | "claude") => {
    setTesting(provider);

    const apiKey =
      provider === "openai" ? openaiKey : provider === "claude" ? claudeKey : spruceApiKey;

    console.log(
      `Testing ${provider} with key:`,
      apiKey ? `${apiKey.substring(0, 10)}...` : "EMPTY"
    );

    if (!apiKey) {
      setApiStatus((prev) => ({ ...prev, [provider]: "broken" }));
      setTestResults((prev) => ({ ...prev, [provider]: "No API key configured" }));
      setTesting(null);
      return;
    }

    try {
      const response = await fetch(`/api-doctor-credentials/test-${provider}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          api_key: apiKey,
          spruce_access_id: provider === "spruce" ? spruceAccessId : undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setApiStatus((prev) => ({ ...prev, [provider]: "working" }));
        setTestResults((prev) => ({ ...prev, [provider]: data.message }));
      } else {
        setApiStatus((prev) => ({ ...prev, [provider]: "broken" }));
        setTestResults((prev) => ({ ...prev, [provider]: data.error }));
      }
    } catch (error) {
      setApiStatus((prev) => ({ ...prev, [provider]: "broken" }));
      setTestResults((prev) => ({ ...prev, [provider]: "Connection failed" }));
    } finally {
      setTesting(null);
    }
  };

  // Test all APIs
  const testAllAPIs = async () => {
    setTestingAll(true);
    setApiStatus({ spruce: "unknown", openai: "unknown", claude: "unknown" });

    // Test each API in parallel
    const tests: Promise<void>[] = [];
    if (spruceAccessId && spruceApiKey) tests.push(testAPI("spruce"));
    if (openaiKey) tests.push(testAPI("openai"));
    if (claudeKey) tests.push(testAPI("claude"));

    await Promise.all(tests);
    setTestingAll(false);
  };

  const handleSaveCredentials = async () => {
    setSaving(true);
    try {
      const payload: any = {
        preferred_ai_provider: preferredAI,
        doctor_id: "default-doctor", // Use consistent ID
        specialty: specialty,
      };

      if (spruceAccessId) payload.spruce_access_id = spruceAccessId;
      if (spruceApiKey) payload.spruce_api_key = spruceApiKey;
      if (openaiKey) payload.openai_api_key = openaiKey;
      if (claudeKey) payload.claude_api_key = claudeKey;

      console.log("Saving credentials:", payload);

      const response = await fetch("/api-doctor-credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      console.log("Response status:", response.status);
      const responseData = await response.json();
      console.log("Response data:", responseData);

      if (!response.ok) {
        throw new Error(responseData.error || "Failed to save credentials");
      }

      // Clear input fields after successful save
      setSpruceAccessId("");
      setSpruceApiKey("");
      setOpenaiKey("");
      setClaudeKey("");

      toast({
        title: "Identifiants sauvegardés",
        description: "Vos identifiants API ont été enregistrés avec succès.",
      });

      await loadProfile();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTestSpruce = async () => {
    if (!spruceAccessId || !spruceApiKey) {
      toast({
        title: "Identifiants manquants",
        description: "Veuillez entrer vos identifiants Spruce Health.",
        variant: "destructive",
      });
      return;
    }

    setTesting("spruce");
    try {
      const response = await fetch("/api-doctor-credentials/test-spruce", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          spruce_access_id: spruceAccessId,
          spruce_api_key: spruceApiKey,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setTestResults((prev) => ({ ...prev, spruce: true }));
        toast({
          title: "✅ Connexion réussie",
          description: `Spruce Health connecté. ${data.conversation_count} conversations trouvées.`,
        });
      } else {
        setTestResults((prev) => ({ ...prev, spruce: false }));
        throw new Error(data.error || "Test failed");
      }
    } catch (error: any) {
      setTestResults((prev) => ({ ...prev, spruce: false }));
      toast({
        title: "Échec de connexion",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setTesting(null);
    }
  };

  const handleTestAI = async (provider: "openai" | "claude") => {
    const apiKey = provider === "openai" ? openaiKey : claudeKey;

    if (!apiKey) {
      toast({
        title: "Clé API manquante",
        description: `Veuillez entrer votre clé API ${provider === "openai" ? "OpenAI" : "Claude"}.`,
        variant: "destructive",
      });
      return;
    }

    setTesting(provider);
    try {
      const response = await fetch("/api-doctor-credentials/test-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          api_key: apiKey,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setTestResults((prev) => ({ ...prev, [provider]: true }));
        toast({
          title: "✅ Connexion réussie",
          description: `${provider === "openai" ? "OpenAI" : "Claude"} connecté avec succès.`,
        });
      } else {
        setTestResults((prev) => ({ ...prev, [provider]: false }));
        throw new Error(data.error || "Test failed");
      }
    } catch (error: any) {
      setTestResults((prev) => ({ ...prev, [provider]: false }));
      toast({
        title: "Échec de connexion",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setTesting(null);
    }
  };

  const handleSaveSpecialty = async () => {
    setSaving(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from("physician_profiles").upsert(
        {
          physician_id: user.id,
          specialty,
        },
        { onConflict: "physician_id" }
      );

      if (error) throw error;

      toast({
        title: "Spécialité sauvegardée",
        description: "Votre spécialité a été mise à jour.",
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Template Management Functions
  const loadTemplates = async () => {
    setLoadingTemplates(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("diagnostic_templates")
        .select("*")
        .eq("physician_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error: any) {
      console.error("Error loading templates:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les templates.",
        variant: "destructive",
      });
    } finally {
      setLoadingTemplates(false);
    }
  };

  const generateTemplateWithAI = async () => {
    if (!newDiagnosisName || !claudeKey) {
      toast({
        title: "Informations manquantes",
        description: "Veuillez entrer un nom de diagnostic et configurer votre clé API Claude.",
        variant: "destructive",
      });
      return;
    }

    setGeneratingTemplate(true);
    try {
      const response = await fetch("/api/ai-template-generation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          diagnosis_name: newDiagnosisName,
          specialty: newTemplateSpecialty || specialty,
          api_key: claudeKey,
        }),
      });

      const data = await response.json();
      if (!data.success) throw new Error(data.error);

      // Pre-fill the form with AI-generated template
      setNewTemplateName(data.template.template_name);
      setEditingTemplate({
        ...data.template,
        physician_id: null, // Will be set on save
        id: null,
      });

      toast({
        title: "✨ Template généré",
        description: "Vous pouvez maintenant le modifier et le sauvegarder.",
      });
    } catch (error: any) {
      console.error("AI template generation error:", error);
      toast({
        title: "Erreur IA",
        description: error.message || "Impossible de générer le template.",
        variant: "destructive",
      });
    } finally {
      setGeneratingTemplate(false);
    }
  };

  const saveTemplate = async () => {
    if (!newTemplateName || !newDiagnosisName) {
      toast({
        title: "Informations manquantes",
        description: "Veuillez entrer un nom et un diagnostic.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const templateData = {
        physician_id: user.id,
        template_name: newTemplateName,
        diagnosis_name: newDiagnosisName,
        specialty: newTemplateSpecialty || specialty,
        plan_items: editingTemplate?.plan_items || [],
      };

      if (editingTemplate?.id) {
        // Update existing
        const { error } = await supabase
          .from("diagnostic_templates")
          .update(templateData)
          .eq("id", editingTemplate.id);
        if (error) throw error;
      } else {
        // Create new
        const { error } = await supabase.from("diagnostic_templates").insert(templateData);
        if (error) throw error;
      }

      toast({
        title: "✅ Template sauvegardé",
        description: "Le template a été enregistré avec succès.",
      });

      // Reset form
      setNewTemplateName("");
      setNewDiagnosisName("");
      setNewTemplateSpecialty("");
      setEditingTemplate(null);

      // Reload templates
      loadTemplates();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const deleteTemplate = async (templateId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce template ?")) return;

    try {
      const { error } = await supabase.from("diagnostic_templates").delete().eq("id", templateId);

      if (error) throw error;

      toast({
        title: "Template supprimé",
        description: "Le template a été supprimé avec succès.",
      });

      loadTemplates();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const editTemplate = (template: any) => {
    setEditingTemplate(template);
    setNewTemplateName(template.template_name);
    setNewDiagnosisName(template.diagnosis_name);
    setNewTemplateSpecialty(template.specialty);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#8b5cf6]" />
      </div>
    );
  }

  return (
    <ModernLayout title="Doctor Profile" description="Manage your profile and settings">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-[#0d0d0d] min-h-screen">
        {!hasCredentials && (
          <Card className="mb-6 border-[#2a2a2a] bg-[#1a1a1a]">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-[#8b5cf6] mt-0.5" />
                <div>
                  <p className="font-medium text-[#e6e6e6]">Configuration requise</p>
                  <p className="text-sm text-[#999] mt-1">
                    Veuillez configurer vos identifiants API pour activer les fonctionnalités Spruce
                    et IA.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="identity" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-[#1a1a1a] border-[#2a2a2a]">
            <TabsTrigger
              value="identity"
              className="data-[state=active]:bg-[#222] data-[state=active]:text-[#e6e6e6] text-[#999]"
            >
              Identité
            </TabsTrigger>
            <TabsTrigger
              value="api"
              className="data-[state=active]:bg-[#222] data-[state=active]:text-[#e6e6e6] text-[#999]"
            >
              API Intégrations
            </TabsTrigger>
            <TabsTrigger
              value="ai"
              className="data-[state=active]:bg-[#222] data-[state=active]:text-[#e6e6e6] text-[#999]"
            >
              IA Configuration
            </TabsTrigger>
            <TabsTrigger
              value="templates"
              className="data-[state=active]:bg-[#222] data-[state=active]:text-[#e6e6e6] text-[#999]"
            >
              Diagnostics
            </TabsTrigger>
            <TabsTrigger
              value="medical_templates"
              className="data-[state=active]:bg-[#222] data-[state=active]:text-[#e6e6e6] text-[#999]"
            >
              Writing Styles
            </TabsTrigger>
          </TabsList>

          {/* Identity Tab */}
          <TabsContent value="identity">
            <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[#e6e6e6]">
                  <Settings className="h-5 w-5 text-[#8b5cf6]" />
                  Identité Professionnelle
                </CardTitle>
                <CardDescription className="text-[#999]">
                  Configurez votre spécialité pour personnaliser l'IA
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="specialty" className="text-[#e6e6e6]">
                    Spécialité
                  </Label>
                  <Input
                    id="specialty"
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    placeholder="Médecine Familiale, Cardiologie, etc."
                    className="mt-1.5 bg-[#0d0d0d] border-[#333] text-[#e6e6e6] placeholder:text-[#666]"
                  />
                </div>
                <Button
                  onClick={handleSaveSpecialty}
                  disabled={saving}
                  className="bg-[#8b5cf6] hover:bg-[#7c3aed] text-white"
                >
                  {saving ? "Sauvegarde..." : "Sauvegarder"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* API Integrations Tab */}
          <TabsContent value="api" className="space-y-6">
            {/* Spruce Health */}
            <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[#e6e6e6]">
                  <MessageSquare className="h-5 w-5 text-[#8b5cf6]" />
                  Spruce Health
                </CardTitle>
                <CardDescription className="text-[#999]">
                  Connectez votre compte Spruce Health pour gérer les messages patients
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="spruce-access" className="text-[#e6e6e6]">
                    Access ID Spruce
                  </Label>
                  <div className="flex gap-2 mt-1.5">
                    <Input
                      id="spruce-access"
                      type={showSpruceAccess ? "text" : "password"}
                      value={spruceAccessId}
                      onChange={(e) => setSpruceAccessId(e.target.value)}
                      placeholder="aid_..."
                      className="bg-[#0d0d0d] border-[#333] text-[#e6e6e6] placeholder:text-[#666]"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setShowSpruceAccess(!showSpruceAccess)}
                      className="bg-[#1a1a1a] border-[#333] text-[#999] hover:text-[#e6e6e6] hover:bg-[#222]"
                    >
                      {showSpruceAccess ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="spruce-api" className="text-[#e6e6e6]">
                    Clé API Spruce
                  </Label>
                  <div className="flex gap-2 mt-1.5">
                    <Input
                      id="spruce-api"
                      type={showSpruceApi ? "text" : "password"}
                      value={spruceApiKey}
                      onChange={(e) => setSpruceApiKey(e.target.value)}
                      placeholder="sk_..."
                      className="bg-[#0d0d0d] border-[#333] text-[#e6e6e6] placeholder:text-[#666]"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setShowSpruceApi(!showSpruceApi)}
                      className="bg-[#1a1a1a] border-[#333] text-[#999] hover:text-[#e6e6e6] hover:bg-[#222]"
                    >
                      {showSpruceApi ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <Button
                  variant="outline"
                  onClick={handleTestSpruce}
                  disabled={testing === "spruce" || !spruceAccessId || !spruceApiKey}
                  className="bg-[#1a1a1a] border-[#333] text-[#e6e6e6] hover:bg-[#222]"
                >
                  {testing === "spruce" ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Test en cours...
                    </>
                  ) : testResults.spruce === true ? (
                    <>
                      <Check className="h-4 w-4 mr-2 text-emerald-500" />
                      Connexion réussie
                    </>
                  ) : testResults.spruce === false ? (
                    <>
                      <AlertCircle className="h-4 w-4 mr-2 text-red-500" />
                      Échec de connexion
                    </>
                  ) : (
                    <>
                      <TestTube className="h-4 w-4 mr-2" />
                      Tester la connexion
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* AI Provider */}
            <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[#e6e6e6]">
                  <Bot className="h-5 w-5 text-[#8b5cf6]" />
                  Fournisseur IA
                </CardTitle>
                <CardDescription className="text-[#999]">
                  Choisissez votre fournisseur IA préféré et entrez votre clé API
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <RadioGroup
                  value={preferredAI}
                  onValueChange={(value: any) => setPreferredAI(value)}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="openai" id="openai" />
                    <Label htmlFor="openai" className="text-[#e6e6e6]">
                      OpenAI (GPT-4)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="claude" id="claude" />
                    <Label htmlFor="claude" className="text-[#e6e6e6]">
                      Claude (Anthropic)
                    </Label>
                  </div>
                </RadioGroup>

                {preferredAI === "openai" && (
                  <div className="space-y-4 mt-4">
                    <div>
                      <Label htmlFor="openai-key" className="text-[#e6e6e6]">
                        Clé API OpenAI
                      </Label>
                      <div className="flex gap-2 mt-1.5">
                        <Input
                          id="openai-key"
                          type={showOpenAI ? "text" : "password"}
                          value={openaiKey}
                          onChange={(e) => setOpenaiKey(e.target.value)}
                          placeholder="sk-..."
                          className="bg-[#0d0d0d] border-[#333] text-[#e6e6e6] placeholder:text-[#666]"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setShowOpenAI(!showOpenAI)}
                          className="bg-[#1a1a1a] border-[#333] text-[#999] hover:text-[#e6e6e6] hover:bg-[#222]"
                        >
                          {showOpenAI ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => handleTestAI("openai")}
                      disabled={testing === "openai" || !openaiKey}
                      className="bg-[#1a1a1a] border-[#333] text-[#e6e6e6] hover:bg-[#222]"
                    >
                      {testing === "openai" ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Test en cours...
                        </>
                      ) : testResults.openai === true ? (
                        <>
                          <Check className="h-4 w-4 mr-2 text-emerald-500" />
                          Connexion réussie
                        </>
                      ) : testResults.openai === false ? (
                        <>
                          <AlertCircle className="h-4 w-4 mr-2 text-red-500" />
                          Échec de connexion
                        </>
                      ) : (
                        <>
                          <TestTube className="h-4 w-4 mr-2" />
                          Tester OpenAI
                        </>
                      )}
                    </Button>
                  </div>
                )}

                {preferredAI === "claude" && (
                  <div className="space-y-4 mt-4">
                    <div>
                      <Label htmlFor="claude-key" className="text-[#e6e6e6]">
                        Clé API Claude
                      </Label>
                      <div className="flex gap-2 mt-1.5">
                        <Input
                          id="claude-key"
                          type={showClaude ? "text" : "password"}
                          value={claudeKey}
                          onChange={(e) => setClaudeKey(e.target.value)}
                          placeholder="sk-ant-..."
                          className="bg-[#0d0d0d] border-[#333] text-[#e6e6e6] placeholder:text-[#666]"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setShowClaude(!showClaude)}
                          className="bg-[#1a1a1a] border-[#333] text-[#999] hover:text-[#e6e6e6] hover:bg-[#222]"
                        >
                          {showClaude ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => handleTestAI("claude")}
                      disabled={testing === "claude" || !claudeKey}
                      className="bg-[#1a1a1a] border-[#333] text-[#e6e6e6] hover:bg-[#222]"
                    >
                      {testing === "claude" ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Test en cours...
                        </>
                      ) : testResults.claude === true ? (
                        <>
                          <Check className="h-4 w-4 mr-2 text-emerald-500" />
                          Connexion réussie
                        </>
                      ) : testResults.claude === false ? (
                        <>
                          <AlertCircle className="h-4 w-4 mr-2 text-red-500" />
                          Échec de connexion
                        </>
                      ) : (
                        <>
                          <TestTube className="h-4 w-4 mr-2" />
                          Tester Claude
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Button
              onClick={handleSaveCredentials}
              disabled={saving}
              className="w-full bg-[#8b5cf6] hover:bg-[#7c3aed] text-white"
              size="lg"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sauvegarde en cours...
                </>
              ) : (
                <>
                  <Key className="h-4 w-4 mr-2" />
                  Sauvegarder tous les identifiants
                </>
              )}
            </Button>
          </TabsContent>

          {/* AI Configuration Tab */}
          <TabsContent value="ai">
            <div className="space-y-6">
              {/* Test All APIs Button */}
              <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-[#e6e6e6]">
                    <TestTube className="h-5 w-5 text-[#8b5cf6]" />
                    Test des APIs
                  </CardTitle>
                  <CardDescription className="text-[#999]">
                    Testez la connectivité de tous vos services API configurés
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={testAllAPIs}
                    disabled={testingAll || (!spruceAccessId && !openaiKey && !claudeKey)}
                    className="w-full bg-[#8b5cf6] hover:bg-[#7c3aed] text-white"
                  >
                    {testingAll ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Test en cours...
                      </>
                    ) : (
                      <>
                        <TestTube className="h-4 w-4 mr-2" />
                        Tester toutes les APIs
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* API Status Cards */}
              <div className="grid gap-4">
                {/* Spruce Health Status */}
                {spruceAccessId && spruceApiKey && (
                  <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <MessageSquare className="h-5 w-5 text-[#8b5cf6]" />
                          <div>
                            <h3 className="font-semibold text-[#e6e6e6]">Spruce Health</h3>
                            <p className="text-sm text-[#999]">Gestion des patients</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {apiStatus.spruce === "working" && (
                            <div className="flex items-center gap-1 text-emerald-500">
                              <Check className="h-4 w-4" />
                              <span className="text-sm">Fonctionnel</span>
                            </div>
                          )}
                          {apiStatus.spruce === "broken" && (
                            <div className="flex items-center gap-1 text-red-500">
                              <AlertCircle className="h-4 w-4" />
                              <span className="text-sm">Erreur</span>
                            </div>
                          )}
                          {apiStatus.spruce === "unknown" && (
                            <div className="flex items-center gap-1 text-[#999]">
                              <span className="text-sm">Non testé</span>
                            </div>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => testAPI("spruce")}
                            disabled={testing === "spruce"}
                            className="bg-[#1a1a1a] border-[#333] text-[#e6e6e6] hover:bg-[#222]"
                          >
                            {testing === "spruce" ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              "Test"
                            )}
                          </Button>
                        </div>
                      </div>
                      {testResults.spruce && (
                        <div className="mt-2 p-2 bg-[#0d0d0d] border border-[#333] rounded text-sm text-[#999]">
                          {testResults.spruce}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* OpenAI Status */}
                {openaiKey && (
                  <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Bot className="h-5 w-5 text-[#8b5cf6]" />
                          <div>
                            <h3 className="font-semibold text-[#e6e6e6]">OpenAI</h3>
                            <p className="text-sm text-[#999]">GPT-4, GPT-3.5</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {apiStatus.openai === "working" && (
                            <div className="flex items-center gap-1 text-emerald-500">
                              <Check className="h-4 w-4" />
                              <span className="text-sm">Fonctionnel</span>
                            </div>
                          )}
                          {apiStatus.openai === "broken" && (
                            <div className="flex items-center gap-1 text-red-500">
                              <AlertCircle className="h-4 w-4" />
                              <span className="text-sm">Erreur</span>
                            </div>
                          )}
                          {apiStatus.openai === "unknown" && (
                            <div className="flex items-center gap-1 text-[#999]">
                              <span className="text-sm">Non testé</span>
                            </div>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => testAPI("openai")}
                            disabled={testing === "openai"}
                            className="bg-[#1a1a1a] border-[#333] text-[#e6e6e6] hover:bg-[#222]"
                          >
                            {testing === "openai" ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              "Test"
                            )}
                          </Button>
                        </div>
                      </div>
                      {testResults.openai && (
                        <div className="mt-2 p-2 bg-[#0d0d0d] border border-[#333] rounded text-sm text-[#999]">
                          {testResults.openai}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Claude Status */}
                {claudeKey && (
                  <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Bot className="h-5 w-5 text-[#8b5cf6]" />
                          <div>
                            <h3 className="font-semibold text-[#e6e6e6]">Anthropic Claude</h3>
                            <p className="text-sm text-[#999]">Claude-3 Opus, Sonnet</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {apiStatus.claude === "working" && (
                            <div className="flex items-center gap-1 text-emerald-500">
                              <Check className="h-4 w-4" />
                              <span className="text-sm">Fonctionnel</span>
                            </div>
                          )}
                          {apiStatus.claude === "broken" && (
                            <div className="flex items-center gap-1 text-red-500">
                              <AlertCircle className="h-4 w-4" />
                              <span className="text-sm">Erreur</span>
                            </div>
                          )}
                          {apiStatus.claude === "unknown" && (
                            <div className="flex items-center gap-1 text-[#999]">
                              <span className="text-sm">Non testé</span>
                            </div>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => testAPI("claude")}
                            disabled={testing === "claude"}
                            className="bg-[#1a1a1a] border-[#333] text-[#e6e6e6] hover:bg-[#222]"
                          >
                            {testing === "claude" ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              "Test"
                            )}
                          </Button>
                        </div>
                      </div>
                      {testResults.claude && (
                        <div className="mt-2 p-2 bg-[#0d0d0d] border border-[#333] rounded text-sm text-[#999]">
                          {testResults.claude}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* No APIs configured */}
                {!spruceAccessId && !openaiKey && !claudeKey && (
                  <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
                    <CardContent className="p-8 text-center">
                      <AlertCircle className="h-12 w-12 text-[#666] mx-auto mb-4" />
                      <h3 className="font-semibold text-[#e6e6e6] mb-2">Aucune API configurée</h3>
                      <p className="text-[#999] mb-4">
                        Configurez vos identifiants API dans l'onglet "API Intégrations" pour
                        pouvoir les tester ici.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Diagnostics Templates Tab */}
          <TabsContent value="templates">
            <div className="space-y-6">
              {/* Header Card */}
              <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-[#e6e6e6]">
                    <FileText className="w-5 h-5 text-[#8b5cf6]" />
                    Templates de Plans de Traitement
                  </CardTitle>
                  <CardDescription className="text-[#999]">
                    Créez et gérez vos templates de plans pour différents diagnostics. Utilisez l'IA
                    pour générer automatiquement des templates personnalisés.
                  </CardDescription>
                </CardHeader>
              </Card>

              {/* Create/Edit Template Card */}
              <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
                <CardHeader>
                  <CardTitle className="text-lg text-[#e6e6e6]">
                    {editingTemplate?.id ? "Modifier le Template" : "Créer un Nouveau Template"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="diagnosis" className="text-[#e6e6e6]">
                        Nom du Diagnostic *
                      </Label>
                      <Input
                        id="diagnosis"
                        value={newDiagnosisName}
                        onChange={(e) => setNewDiagnosisName(e.target.value)}
                        placeholder="ex: RSV, Appendicite, Pneumonie"
                        className="bg-[#0d0d0d] border-[#333] text-[#e6e6e6] placeholder:text-[#666]"
                      />
                    </div>
                    <div>
                      <Label htmlFor="template-name" className="text-[#e6e6e6]">
                        Nom du Template
                      </Label>
                      <Input
                        id="template-name"
                        value={newTemplateName}
                        onChange={(e) => setNewTemplateName(e.target.value)}
                        placeholder="ex: Plan RSV Pédiatrie"
                        className="bg-[#0d0d0d] border-[#333] text-[#e6e6e6] placeholder:text-[#666]"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="specialty" className="text-[#e6e6e6]">
                      Spécialité (optionnel)
                    </Label>
                    <Input
                      id="specialty"
                      value={newTemplateSpecialty}
                      onChange={(e) => setNewTemplateSpecialty(e.target.value)}
                      placeholder={specialty || "ex: Pédiatrie, Cardiologie"}
                      className="bg-[#0d0d0d] border-[#333] text-[#e6e6e6] placeholder:text-[#666]"
                    />
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    <Button
                      onClick={generateTemplateWithAI}
                      disabled={!newDiagnosisName || !claudeKey || generatingTemplate}
                      className="bg-[#8b5cf6] hover:bg-[#7c3aed] text-white"
                    >
                      {generatingTemplate ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Génération IA...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Générer avec IA
                        </>
                      )}
                    </Button>

                    <Button
                      onClick={saveTemplate}
                      disabled={!newTemplateName || !newDiagnosisName || saving}
                      variant="default"
                      className="bg-[#8b5cf6] hover:bg-[#7c3aed] text-white"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Enregistrement...
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Sauvegarder
                        </>
                      )}
                    </Button>

                    {editingTemplate?.id && (
                      <Button
                        onClick={() => {
                          setEditingTemplate(null);
                          setNewTemplateName("");
                          setNewDiagnosisName("");
                          setNewTemplateSpecialty("");
                        }}
                        variant="outline"
                        className="bg-[#1a1a1a] border-[#333] text-[#e6e6e6] hover:bg-[#222]"
                      >
                        Annuler
                      </Button>
                    )}
                  </div>

                  {!claudeKey && (
                    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4">
                      <p className="text-sm text-[#999]">
                        💡 Configurez votre clé API Claude dans l'onglet "API Intégrations" pour
                        utiliser la génération IA.
                      </p>
                    </div>
                  )}

                  {editingTemplate?.plan_items && editingTemplate.plan_items.length > 0 && (
                    <div className="mt-4 p-4 bg-[#0d0d0d] border border-[#333] rounded-lg">
                      <h4 className="font-semibold mb-3 text-sm text-[#e6e6e6]">
                        Plan Items Preview:
                      </h4>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {editingTemplate.plan_items.map((item: any, idx: number) => (
                          <div
                            key={idx}
                            className="text-sm bg-[#1a1a1a] p-2 rounded border border-[#333]"
                          >
                            <div className="flex items-start gap-2">
                              <span className="font-medium text-[#8b5cf6]">{item.category}:</span>
                              <span className="text-[#e6e6e6]">{item.item}</span>
                            </div>
                            {item.details && (
                              <div className="text-xs text-[#999] mt-1 ml-4">{item.details}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Existing Templates List */}
              <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center justify-between text-[#e6e6e6]">
                    <span>Mes Templates</span>
                    <Button
                      onClick={loadTemplates}
                      size="sm"
                      variant="outline"
                      disabled={loadingTemplates}
                      className="bg-[#1a1a1a] border-[#333] text-[#e6e6e6] hover:bg-[#222]"
                    >
                      {loadingTemplates ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        "Actualiser"
                      )}
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingTemplates ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-[#999]" />
                    </div>
                  ) : templates.length === 0 ? (
                    <div className="text-center py-8 text-[#999]">
                      <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>Aucun template créé pour le moment.</p>
                      <p className="text-sm mt-1">Créez votre premier template ci-dessus.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {templates.map((template) => (
                        <div
                          key={template.id}
                          className="border border-[#2a2a2a] rounded-lg p-4 hover:bg-[#222] transition-colors bg-[#1a1a1a]"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-semibold text-[#e6e6e6]">
                                {template.template_name}
                              </h4>
                              <p className="text-sm text-[#999] mt-1">
                                Diagnostic:{" "}
                                <span className="font-medium">{template.diagnosis_name}</span>
                              </p>
                              {template.specialty && (
                                <p className="text-xs text-[#666] mt-1">
                                  Spécialité: {template.specialty}
                                </p>
                              )}
                              <p className="text-xs text-[#666] mt-2">
                                {template.plan_items?.length || 0} items • Créé le{" "}
                                {new Date(template.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex gap-2 ml-4">
                              <Button
                                onClick={() => editTemplate(template)}
                                size="sm"
                                variant="outline"
                                className="bg-[#1a1a1a] border-[#333] text-[#999] hover:text-[#e6e6e6] hover:bg-[#222]"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                onClick={() => deleteTemplate(template.id)}
                                size="sm"
                                variant="outline"
                                className="text-red-500 hover:bg-red-500/10 border-red-500/30"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Medical Templates Tab */}
          <TabsContent value="medical_templates">
            <MedicalTemplatesManager />
          </TabsContent>
        </Tabs>
      </div>
    </ModernLayout>
  );
}
