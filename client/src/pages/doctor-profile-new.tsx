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
import AppLayoutSpruce from "@/components/layout/AppLayoutSpruce";

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
    spruce: 'unknown' as 'working' | 'broken' | 'unknown',
    openai: 'unknown' as 'working' | 'broken' | 'unknown', 
    claude: 'unknown' as 'working' | 'broken' | 'unknown'
  });
  const [testingAll, setTestingAll] = useState(false);
  const [testResults, setTestResults] = useState<{
    spruce: boolean | null | string;
    openai: boolean | null | string;
    claude: boolean | null | string;
  }>({
    spruce: null,
    openai: null,
    claude: null
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
      const { data: { user } } = await supabase.auth.getUser();
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
  const testAPI = async (provider: 'spruce' | 'openai' | 'claude') => {
    setTesting(provider);
    
    const apiKey = provider === 'openai' ? openaiKey : 
                   provider === 'claude' ? claudeKey : 
                   spruceApiKey;
    
    console.log(`Testing ${provider} with key:`, apiKey ? `${apiKey.substring(0, 10)}...` : 'EMPTY');
    
    if (!apiKey) {
      setApiStatus(prev => ({ ...prev, [provider]: 'broken' }));
      setTestResults(prev => ({ ...prev, [provider]: 'No API key configured' }));
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
          spruce_access_id: provider === 'spruce' ? spruceAccessId : undefined
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setApiStatus(prev => ({ ...prev, [provider]: 'working' }));
        setTestResults(prev => ({ ...prev, [provider]: data.message }));
      } else {
        setApiStatus(prev => ({ ...prev, [provider]: 'broken' }));
        setTestResults(prev => ({ ...prev, [provider]: data.error }));
      }
    } catch (error) {
      setApiStatus(prev => ({ ...prev, [provider]: 'broken' }));
      setTestResults(prev => ({ ...prev, [provider]: 'Connection failed' }));
    } finally {
      setTesting(null);
    }
  };

  // Test all APIs
  const testAllAPIs = async () => {
    setTestingAll(true);
    setApiStatus({ spruce: 'unknown', openai: 'unknown', claude: 'unknown' });
    
    // Test each API in parallel
    const tests: Promise<void>[] = [];
    if (spruceAccessId && spruceApiKey) tests.push(testAPI('spruce'));
    if (openaiKey) tests.push(testAPI('openai'));
    if (claudeKey) tests.push(testAPI('claude'));
    
    await Promise.all(tests);
    setTestingAll(false);
  };

  const handleSaveCredentials = async () => {
    setSaving(true);
    try {
      const payload: any = {
        preferred_ai_provider: preferredAI,
        doctor_id: 'default-doctor', // Use consistent ID
        specialty: specialty
      };

      if (spruceAccessId) payload.spruce_access_id = spruceAccessId;
      if (spruceApiKey) payload.spruce_api_key = spruceApiKey;
      if (openaiKey) payload.openai_api_key = openaiKey;
      if (claudeKey) payload.claude_api_key = claudeKey;

      console.log('Saving credentials:', payload);
      
      const response = await fetch("/api-doctor-credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      console.log('Response status:', response.status);
      const responseData = await response.json();
      console.log('Response data:', responseData);

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
        setTestResults(prev => ({ ...prev, spruce: true }));
        toast({
          title: "✅ Connexion réussie",
          description: `Spruce Health connecté. ${data.conversation_count} conversations trouvées.`,
        });
      } else {
        setTestResults(prev => ({ ...prev, spruce: false }));
        throw new Error(data.error || "Test failed");
      }
    } catch (error: any) {
      setTestResults(prev => ({ ...prev, spruce: false }));
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
        setTestResults(prev => ({ ...prev, [provider]: true }));
        toast({
          title: "✅ Connexion réussie",
          description: `${provider === "openai" ? "OpenAI" : "Claude"} connecté avec succès.`,
        });
      } else {
        setTestResults(prev => ({ ...prev, [provider]: false }));
        throw new Error(data.error || "Test failed");
      }
    } catch (error: any) {
      setTestResults(prev => ({ ...prev, [provider]: false }));
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("physician_profiles")
        .upsert({
          physician_id: user.id,
          specialty,
        }, { onConflict: "physician_id" });

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
      const { data: { user } } = await supabase.auth.getUser();
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
      const { data: { user } } = await supabase.auth.getUser();
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
        const { error } = await supabase
          .from("diagnostic_templates")
          .insert(templateData);
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
      const { error } = await supabase
        .from("diagnostic_templates")
        .delete()
        .eq("id", templateId);

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
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <AppLayoutSpruce>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!hasCredentials && (
          <Card className="mb-6 border-yellow-200 bg-yellow-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-900">Configuration requise</p>
                  <p className="text-sm text-yellow-700 mt-1">
                    Veuillez configurer vos identifiants API pour activer les fonctionnalités Spruce et IA.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="identity" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-white border">
            <TabsTrigger value="identity">Identité</TabsTrigger>
            <TabsTrigger value="api">API Intégrations</TabsTrigger>
            <TabsTrigger value="ai">IA Configuration</TabsTrigger>
            <TabsTrigger value="templates">Diagnostics</TabsTrigger>
            <TabsTrigger value="medical_templates">Templates</TabsTrigger>
          </TabsList>

          {/* Identity Tab */}
          <TabsContent value="identity">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-purple-600" />
                  Identité Professionnelle
                </CardTitle>
                <CardDescription>
                  Configurez votre spécialité pour personnaliser l'IA
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="specialty">Spécialité</Label>
                  <Input
                    id="specialty"
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    placeholder="Médecine Familiale, Cardiologie, etc."
                    className="mt-1.5"
                  />
                </div>
                <Button onClick={handleSaveSpecialty} disabled={saving}>
                  {saving ? "Sauvegarde..." : "Sauvegarder"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* API Integrations Tab */}
          <TabsContent value="api" className="space-y-6">
            {/* Spruce Health */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-blue-600" />
                  Spruce Health
                </CardTitle>
                <CardDescription>
                  Connectez votre compte Spruce Health pour gérer les messages patients
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="spruce-access">Access ID Spruce</Label>
                  <div className="flex gap-2 mt-1.5">
                    <Input
                      id="spruce-access"
                      type={showSpruceAccess ? "text" : "password"}
                      value={spruceAccessId}
                      onChange={(e) => setSpruceAccessId(e.target.value)}
                      placeholder="aid_..."
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setShowSpruceAccess(!showSpruceAccess)}
                    >
                      {showSpruceAccess ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="spruce-api">Clé API Spruce</Label>
                  <div className="flex gap-2 mt-1.5">
                    <Input
                      id="spruce-api"
                      type={showSpruceApi ? "text" : "password"}
                      value={spruceApiKey}
                      onChange={(e) => setSpruceApiKey(e.target.value)}
                      placeholder="sk_..."
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setShowSpruceApi(!showSpruceApi)}
                    >
                      {showSpruceApi ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <Button
                  variant="outline"
                  onClick={handleTestSpruce}
                  disabled={testing === "spruce" || !spruceAccessId || !spruceApiKey}
                >
                  {testing === "spruce" ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Test en cours...
                    </>
                  ) : testResults.spruce === true ? (
                    <>
                      <Check className="h-4 w-4 mr-2 text-green-500" />
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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-purple-600" />
                  Fournisseur IA
                </CardTitle>
                <CardDescription>
                  Choisissez votre fournisseur IA préféré et entrez votre clé API
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <RadioGroup value={preferredAI} onValueChange={(value: any) => setPreferredAI(value)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="openai" id="openai" />
                    <Label htmlFor="openai">OpenAI (GPT-4)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="claude" id="claude" />
                    <Label htmlFor="claude">Claude (Anthropic)</Label>
                  </div>
                </RadioGroup>

                {preferredAI === "openai" && (
                  <div className="space-y-4 mt-4">
                    <div>
                      <Label htmlFor="openai-key">Clé API OpenAI</Label>
                      <div className="flex gap-2 mt-1.5">
                        <Input
                          id="openai-key"
                          type={showOpenAI ? "text" : "password"}
                          value={openaiKey}
                          onChange={(e) => setOpenaiKey(e.target.value)}
                          placeholder="sk-..."
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setShowOpenAI(!showOpenAI)}
                        >
                          {showOpenAI ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                <Button
                  variant="outline"
                  onClick={() => handleTestAI("openai")}
                  disabled={testing === "openai" || !openaiKey}
                >
                  {testing === "openai" ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Test en cours...
                    </>
                  ) : testResults.openai === true ? (
                    <>
                      <Check className="h-4 w-4 mr-2 text-green-500" />
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
                      <Label htmlFor="claude-key">Clé API Claude</Label>
                      <div className="flex gap-2 mt-1.5">
                        <Input
                          id="claude-key"
                          type={showClaude ? "text" : "password"}
                          value={claudeKey}
                          onChange={(e) => setClaudeKey(e.target.value)}
                          placeholder="sk-ant-..."
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setShowClaude(!showClaude)}
                        >
                          {showClaude ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                <Button
                  variant="outline"
                  onClick={() => handleTestAI("claude")}
                  disabled={testing === "claude" || !claudeKey}
                >
                  {testing === "claude" ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Test en cours...
                    </>
                  ) : testResults.claude === true ? (
                    <>
                      <Check className="h-4 w-4 mr-2 text-green-500" />
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
              className="w-full"
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
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TestTube className="h-5 w-5 text-purple-600" />
                    Test des APIs
                  </CardTitle>
                  <CardDescription>
                    Testez la connectivité de tous vos services API configurés
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={testAllAPIs}
                    disabled={testingAll || (!spruceAccessId && !openaiKey && !claudeKey)}
                    className="w-full"
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
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <MessageSquare className="h-5 w-5 text-blue-600" />
                          <div>
                            <h3 className="font-semibold">Spruce Health</h3>
                            <p className="text-sm text-gray-600">Gestion des patients</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {apiStatus.spruce === 'working' && (
                            <div className="flex items-center gap-1 text-green-600">
                              <Check className="h-4 w-4" />
                              <span className="text-sm">Fonctionnel</span>
                            </div>
                          )}
                          {apiStatus.spruce === 'broken' && (
                            <div className="flex items-center gap-1 text-red-600">
                              <AlertCircle className="h-4 w-4" />
                              <span className="text-sm">Erreur</span>
                            </div>
                          )}
                          {apiStatus.spruce === 'unknown' && (
                            <div className="flex items-center gap-1 text-gray-500">
                              <span className="text-sm">Non testé</span>
                            </div>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => testAPI('spruce')}
                            disabled={testing === 'spruce'}
                          >
                            {testing === 'spruce' ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              'Test'
                            )}
                          </Button>
                        </div>
                      </div>
                      {testResults.spruce && (
                        <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                          {testResults.spruce}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* OpenAI Status */}
                {openaiKey && (
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Bot className="h-5 w-5 text-green-600" />
                          <div>
                            <h3 className="font-semibold">OpenAI</h3>
                            <p className="text-sm text-gray-600">GPT-4, GPT-3.5</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {apiStatus.openai === 'working' && (
                            <div className="flex items-center gap-1 text-green-600">
                              <Check className="h-4 w-4" />
                              <span className="text-sm">Fonctionnel</span>
                            </div>
                          )}
                          {apiStatus.openai === 'broken' && (
                            <div className="flex items-center gap-1 text-red-600">
                              <AlertCircle className="h-4 w-4" />
                              <span className="text-sm">Erreur</span>
                            </div>
                          )}
                          {apiStatus.openai === 'unknown' && (
                            <div className="flex items-center gap-1 text-gray-500">
                              <span className="text-sm">Non testé</span>
                            </div>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => testAPI('openai')}
                            disabled={testing === 'openai'}
                          >
                            {testing === 'openai' ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              'Test'
                            )}
                          </Button>
                        </div>
                      </div>
                      {testResults.openai && (
                        <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                          {testResults.openai}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Claude Status */}
                {claudeKey && (
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Bot className="h-5 w-5 text-orange-600" />
                          <div>
                            <h3 className="font-semibold">Anthropic Claude</h3>
                            <p className="text-sm text-gray-600">Claude-3 Opus, Sonnet</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {apiStatus.claude === 'working' && (
                            <div className="flex items-center gap-1 text-green-600">
                              <Check className="h-4 w-4" />
                              <span className="text-sm">Fonctionnel</span>
                            </div>
                          )}
                          {apiStatus.claude === 'broken' && (
                            <div className="flex items-center gap-1 text-red-600">
                              <AlertCircle className="h-4 w-4" />
                              <span className="text-sm">Erreur</span>
                            </div>
                          )}
                          {apiStatus.claude === 'unknown' && (
                            <div className="flex items-center gap-1 text-gray-500">
                              <span className="text-sm">Non testé</span>
                            </div>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => testAPI('claude')}
                            disabled={testing === 'claude'}
                          >
                            {testing === 'claude' ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              'Test'
                            )}
                          </Button>
                        </div>
                      </div>
                      {testResults.claude && (
                        <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                          {testResults.claude}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* No APIs configured */}
                {!spruceAccessId && !openaiKey && !claudeKey && (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="font-semibold text-gray-900 mb-2">Aucune API configurée</h3>
                      <p className="text-gray-600 mb-4">
                        Configurez vos identifiants API dans l'onglet "API Intégrations" pour pouvoir les tester ici.
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
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Templates de Plans de Traitement
                  </CardTitle>
                  <CardDescription>
                    Créez et gérez vos templates de plans pour différents diagnostics. 
                    Utilisez l'IA pour générer automatiquement des templates personnalisés.
                  </CardDescription>
                </CardHeader>
              </Card>

              {/* Create/Edit Template Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {editingTemplate?.id ? "Modifier le Template" : "Créer un Nouveau Template"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="diagnosis">Nom du Diagnostic *</Label>
                      <Input
                        id="diagnosis"
                        value={newDiagnosisName}
                        onChange={(e) => setNewDiagnosisName(e.target.value)}
                        placeholder="ex: RSV, Appendicite, Pneumonie"
                      />
                    </div>
                    <div>
                      <Label htmlFor="template-name">Nom du Template</Label>
                      <Input
                        id="template-name"
                        value={newTemplateName}
                        onChange={(e) => setNewTemplateName(e.target.value)}
                        placeholder="ex: Plan RSV Pédiatrie"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="specialty">Spécialité (optionnel)</Label>
                    <Input
                      id="specialty"
                      value={newTemplateSpecialty}
                      onChange={(e) => setNewTemplateSpecialty(e.target.value)}
                      placeholder={specialty || "ex: Pédiatrie, Cardiologie"}
                    />
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    <Button
                      onClick={generateTemplateWithAI}
                      disabled={!newDiagnosisName || !claudeKey || generatingTemplate}
                      className="bg-gradient-to-r from-purple-600 to-indigo-600"
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
                      >
                        Annuler
                      </Button>
                    )}
                  </div>

                  {!claudeKey && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <p className="text-sm text-yellow-800">
                        💡 Configurez votre clé API Claude dans l'onglet "API Intégrations" pour utiliser la génération IA.
                      </p>
                    </div>
                  )}

                  {editingTemplate?.plan_items && editingTemplate.plan_items.length > 0 && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-semibold mb-3 text-sm">Plan Items Preview:</h4>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {editingTemplate.plan_items.map((item: any, idx: number) => (
                          <div key={idx} className="text-sm bg-white p-2 rounded border">
                            <div className="flex items-start gap-2">
                              <span className="font-medium text-blue-600">{item.category}:</span>
                              <span>{item.item}</span>
                            </div>
                            {item.details && (
                              <div className="text-xs text-gray-600 mt-1 ml-4">{item.details}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Existing Templates List */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center justify-between">
                    <span>Mes Templates</span>
                    <Button
                      onClick={loadTemplates}
                      size="sm"
                      variant="outline"
                      disabled={loadingTemplates}
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
                      <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                    </div>
                  ) : templates.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>Aucun template créé pour le moment.</p>
                      <p className="text-sm mt-1">Créez votre premier template ci-dessus.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {templates.map((template) => (
                        <div
                          key={template.id}
                          className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900">{template.template_name}</h4>
                              <p className="text-sm text-gray-600 mt-1">
                                Diagnostic: <span className="font-medium">{template.diagnosis_name}</span>
                              </p>
                              {template.specialty && (
                                <p className="text-xs text-gray-500 mt-1">
                                  Spécialité: {template.specialty}
                                </p>
                              )}
                              <p className="text-xs text-gray-400 mt-2">
                                {template.plan_items?.length || 0} items • 
                                Créé le {new Date(template.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex gap-2 ml-4">
                              <Button
                                onClick={() => editTemplate(template)}
                                size="sm"
                                variant="outline"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                onClick={() => deleteTemplate(template.id)}
                                size="sm"
                                variant="outline"
                                className="text-red-600 hover:bg-red-50"
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
    </AppLayoutSpruce>
  );
}
