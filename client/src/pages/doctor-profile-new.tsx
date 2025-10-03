import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabase";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

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
  const [credentialsVerified, setCredentialsVerified] = useState(false);

  useEffect(() => {
    loadProfile();
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

  const handleSaveCredentials = async () => {
    setSaving(true);
    try {
      const payload: any = {
        preferred_ai_provider: preferredAI,
      };

      if (spruceAccessId) payload.spruce_access_id = spruceAccessId;
      if (spruceApiKey) payload.spruce_api_key = spruceApiKey;
      if (openaiKey) payload.openai_api_key = openaiKey;
      if (claudeKey) payload.claude_api_key = claudeKey;

      const response = await fetch("/api/doctor/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to save credentials");
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
      const response = await fetch("/api/doctor/credentials/test-spruce", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          spruce_access_id: spruceAccessId,
          spruce_api_key: spruceApiKey,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "✅ Connexion réussie",
          description: `Spruce Health connecté. ${data.conversation_count} conversations trouvées.`,
        });
      } else {
        throw new Error(data.error || "Test failed");
      }
    } catch (error: any) {
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
      const response = await fetch("/api/doctor/credentials/test-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          api_key: apiKey,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "✅ Connexion réussie",
          description: `${provider === "openai" ? "OpenAI" : "Claude"} connecté avec succès.`,
        });
      } else {
        throw new Error(data.error || "Test failed");
      }
    } catch (error: any) {
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/doctor-dashboard")}
                className="mr-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour au Tableau de Bord
              </Button>
              <h1 className="text-xl font-semibold text-gray-900">Configuration du Médecin</h1>
            </div>
            {hasCredentials && credentialsVerified && (
              <div className="flex items-center gap-2 text-green-600">
                <Check className="h-5 w-5" />
                <span className="text-sm font-medium">Connecté</span>
              </div>
            )}
          </div>
        </div>
      </header>

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
          <TabsList className="grid w-full grid-cols-3 bg-white border">
            <TabsTrigger value="identity">Identité</TabsTrigger>
            <TabsTrigger value="api">API Intégrations</TabsTrigger>
            <TabsTrigger value="ai">IA Configuration</TabsTrigger>
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
                  disabled={testing === "spruce"}
                >
                  {testing === "spruce" ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Test en cours...
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
                      disabled={testing === "openai"}
                    >
                      {testing === "openai" ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Test en cours...
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
                      disabled={testing === "claude"}
                    >
                      {testing === "claude" ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Test en cours...
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
            <Card>
              <CardHeader>
                <CardTitle>Configuration IA (À venir)</CardTitle>
                <CardDescription>
                  Personnalisez les sorties de l'IA selon vos préférences médicales
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500">
                  Cette section permettra de configurer les modèles de sortie IA,
                  les templates de documentation, et les préférences linguistiques.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
