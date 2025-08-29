import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabase";
import {
  Search,
  Clock,
  FileText,
  ChevronRight,
  LogOut,
  TrendingUp,
  Users,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface PatientConsultation {
  id: string;
  patient_id: string;
  chief_complaint: string;
  symptoms: string;
  severity: number;
  triage_level: string;
  created_at: string;
  status: string;
  age?: number;
  gender?: string;
  problem_start_date?: string;
  specific_trigger?: string;
  symptom_location?: string;
  symptom_description?: string;
  symptom_aggravators?: string;
  symptom_relievers?: string;
  symptom_progression?: string;
  selected_symptoms?: string[] | null;
  treatments_attempted?: string;
  treatment_effectiveness?: string;
  chronic_conditions?: string;
  medication_allergies?: string;
  pregnancy_status?: string;
  additional_notes?: string;
}

interface AccessHistory {
  patient_id: string;
  accessed_at: string;
  consultation_id: string;
}

export default function DoctorDashboard() {
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<PatientConsultation[]>([]);
  const [recentPatients, setRecentPatients] = useState<PatientConsultation[]>([]);
  const [accessHistory, setAccessHistory] = useState<AccessHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalToday: 0,
    pendingCases: 0,
    urgentCases: 0,
    completedToday: 0,
  });

  // French Medical Transcription state for the right panel
  const [generating, setGenerating] = useState(false);
  const [frenchDoc, setFrenchDoc] = useState<{
    confirmation?: string;
    soap?: string;
    plan?: string;
    telemedicine?: string;
    followup?: string;
  }>({});
  const [triageHtml, setTriageHtml] = useState<string>("");
  const [copyToast, setCopyToast] = useState<string | null>(null);

  // Load doctor AI preferences from localStorage
  type AIPrefs = {
    enableTriage: boolean;
    enableConfirmation: boolean;
    enableSOAP: boolean;
    enablePlan: boolean;
    enableTelemedicine: boolean;
    enableQuestions: boolean;
    autoGenerateOnSelect: boolean;
  };
  const PREFS_KEY = "doctor_ai_prefs";
  const getPrefs = (): AIPrefs => {
    try {
      const raw = localStorage.getItem(PREFS_KEY);
      return raw
        ? {
            enableTriage: true,
            enableConfirmation: true,
            enableSOAP: true,
            enablePlan: true,
            enableTelemedicine: true,
            enableQuestions: true,
            autoGenerateOnSelect: true,
            ...JSON.parse(raw),
          }
        : {
            enableTriage: true,
            enableConfirmation: true,
            enableSOAP: true,
            enablePlan: true,
            enableTelemedicine: true,
            enableQuestions: true,
            autoGenerateOnSelect: true,
          };
    } catch {
      return {
        enableTriage: true,
        enableConfirmation: true,
        enableSOAP: true,
        enablePlan: true,
        enableTelemedicine: true,
        enableQuestions: true,
        autoGenerateOnSelect: true,
      };
    }
  };
  const [prefs, setPrefs] = useState<AIPrefs>(getPrefs());
  useEffect(() => {
    setPrefs(getPrefs());
  }, []);

  useEffect(() => {
    checkAuth();
    loadDashboardData();
  }, []);

  const checkAuth = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      navigate("/login");
    }
  };

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Load recent consultations
      const { data: recent } = await supabase
        .from("consultations")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);

      if (recent) setRecentPatients(recent);

      // Load access history from localStorage (in production, this would be from database)
      const history = localStorage.getItem("doctorAccessHistory");
      if (history) {
        setAccessHistory(JSON.parse(history));
      }

      // Calculate stats
      const today = new Date().toISOString().split("T")[0];
      const { data: todayConsults } = await supabase
        .from("consultations")
        .select("*")
        .gte("created_at", today);

      if (todayConsults) {
        setStats({
          totalToday: todayConsults.length,
          pendingCases: todayConsults.filter((c) => c.status === "pending").length,
          urgentCases: todayConsults.filter(
            (c) => c.triage_level === "URGENT" || c.triage_level === "EMERGENCY"
          ).length,
          completedToday: todayConsults.filter((c) => c.status === "completed").length,
        });
      }
    } catch (error) {
      console.error("Error loading dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      // Search by patient ID (exact match)
      const { data, error } = await supabase
        .from("consultations")
        .select("*")
        .eq("patient_id", searchQuery.toUpperCase())
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (data) {
        setSearchResults(data);

        // Add to access history
        if (data.length > 0) {
          const newAccess = {
            patient_id: searchQuery.toUpperCase(),
            accessed_at: new Date().toISOString(),
            consultation_id: data[0].id,
          };

          const currentHistory = [...accessHistory];
          // Remove if already exists and add to front
          const filtered = currentHistory.filter((h) => h.patient_id !== searchQuery.toUpperCase());
          const updated = [newAccess, ...filtered].slice(0, 10); // Keep last 10

          setAccessHistory(updated);
          localStorage.setItem("doctorAccessHistory", JSON.stringify(updated));
        }
      }
    } catch (error) {
      console.error("Error searching:", error);
    } finally {
      setLoading(false);
    }
  };

  const openPatientDetails = (consultation: PatientConsultation) => {
    // Navigate to patient details page
    navigate(`/consultation/${consultation.id}`);
  };

  // Build a minimal formData payload from a consultation
  const mapConsultToFormData = (c: PatientConsultation | null) => {
    if (!c) return null;
    return {
      chiefComplaint: c.chief_complaint || "",
      symptoms: c.symptoms || "",
      severity: c.severity || 5,
      triageLevel: c.triage_level || "",
      createdAt: c.created_at,
    } as Record<string, any>;
  };

  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text || "");
      setCopyToast("Copied to clipboard");
      setTimeout(() => setCopyToast(null), 1500);
    } catch {}
  };

  const copySection = (label: string, text?: string) => {
    copyText(text || "");
  };

  const copyAll = () => {
    const parts: string[] = [];
    if (prefs.enableConfirmation && frenchDoc.confirmation) parts.push(frenchDoc.confirmation);
    if (prefs.enableSOAP && frenchDoc.soap) parts.push(frenchDoc.soap);
    if (prefs.enablePlan && frenchDoc.plan) parts.push(frenchDoc.plan);
    if (prefs.enableTelemedicine && frenchDoc.telemedicine) parts.push(frenchDoc.telemedicine);
    if (prefs.enableQuestions && frenchDoc.followup) parts.push(frenchDoc.followup);
    copyText(parts.join("\n\n"));
  };

  // Generate French medical transcription using exact variables from your system
  const generateFrenchTranscription = async () => {
    const latest = searchResults[0] || recentPatients[0] || null;
    const patientId = (latest?.patient_id || searchQuery || "").toString().toUpperCase();

    if (!patientId) {
      alert("Enter a patient ID in the search box first.");
      return;
    }

    setGenerating(true);
    try {
      // Extract variables from consultation data exactly as your system expects
      const variables = {
        Gender: (latest as any)?.gender || "Non spécifié",
        Age: (latest as any)?.age || "Non spécifié",
        ChiefComplaint: latest?.chief_complaint || "Non spécifié",
        SymptomOnset: (latest as any)?.problem_start_date || "Non spécifié",
        Trigger: (latest as any)?.specific_trigger || "Non spécifié",
        Location: (latest as any)?.symptom_location || "Non spécifié",
        Description: (latest as any)?.symptom_description || "Non spécifié",
        AggravatingFactors: (latest as any)?.symptom_aggravators || "Non spécifié",
        RelievingFactors: (latest as any)?.symptom_relievers || "Non spécifié",
        Severity: latest?.severity || "Non spécifié",
        Evolution: (latest as any)?.symptom_progression || "Non spécifié",
        AssociatedSymptoms: (latest as any)?.selected_symptoms?.join(", ") || "Non spécifié",
        TreatmentsTried: (latest as any)?.treatments_attempted || "Non spécifié",
        TreatmentResponse: (latest as any)?.treatment_effectiveness || "Non spécifié",
        ChronicConditions: (latest as any)?.chronic_conditions || "Non spécifié",
        MedicationAllergies: (latest as any)?.medication_allergies || "Non spécifié",
        PregnancyBreastfeeding: (latest as any)?.pregnancy_status || "Non spécifié",
        OtherNotes: (latest as any)?.additional_notes || "Non spécifié",
      };

      const res = await fetch("/api/medical-transcription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId, variables }),
      });
      if (!res.ok) throw new Error("Failed to generate French transcription");
      const data = await res.json();
      setFrenchDoc({
        confirmation: data.confirmation || "",
        soap: data.soap || "",
        plan: data.plan || "",
        telemedicine: data.telemedicine || "",
        followup: data.followup || "",
      });
    } catch (e) {
      console.error(e);
      alert("Transcription française échouée. Veuillez réessayer.");
    } finally {
      setGenerating(false);
    }
  };

  // Generate Triage P1–P5 full document
  const generateTriageDocument = async () => {
    const latest = searchResults[0] || recentPatients[0] || null;
    const patientId = (latest?.patient_id || searchQuery || "").toString().toUpperCase();
    if (!patientId) return;

    const body = {
      patientId,
      email: "", // optional
      age: latest?.age || null,
      gender: latest?.gender || "",
      chiefComplaint: latest?.chief_complaint || "",
      onset: (latest as any)?.problem_start_date || "",
      trigger: (latest as any)?.specific_trigger || "",
      location: (latest as any)?.symptom_location || "",
      quality: (latest as any)?.symptom_description || "",
      aggravatingFactors: (latest as any)?.symptom_aggravators || "",
      relievingFactors: (latest as any)?.symptom_relievers || "",
      severity: latest?.severity || 0,
      timePattern: (latest as any)?.symptom_progression || "",
      associatedSymptoms: Array.isArray((latest as any)?.selected_symptoms)
        ? (latest as any).selected_symptoms.join(", ")
        : "",
      treatmentsTried: (latest as any)?.treatments_attempted || "",
      treatmentResponse: (latest as any)?.treatment_effectiveness || "",
      chronicConditions: (latest as any)?.chronic_conditions || "",
      allergies: (latest as any)?.medication_allergies || "",
      pregnancyBreastfeeding: (latest as any)?.pregnancy_status || "",
      otherNotes: (latest as any)?.additional_notes || "",
    };

    try {
      const res = await fetch("/api/generate-triage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed to generate triage document");
      const data = await res.json();
      setTriageHtml(data.htmlContent || "");
    } catch (e) {
      console.error(e);
      setTriageHtml("");
    }
  };

  const quickAccessPatient = (patientId: string) => {
    setSearchQuery(patientId);
    handleSearch();
  };

  // Auto-generate when a patient is selected (according to prefs)
  useEffect(() => {
    if (prefs.autoGenerateOnSelect && (searchResults[0] || recentPatients[0])) {
      if (prefs.enableTriage) generateTriageDocument();
      generateFrenchTranscription();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchResults.length]);

  const getTriageColor = (level: string) => {
    switch (level?.toUpperCase()) {
      case "EMERGENCY":
        return "bg-red-100 text-red-800";
      case "URGENT":
        return "bg-orange-100 text-orange-800";
      case "SEMI-URGENT":
        return "bg-yellow-100 text-yellow-800";
      case "NON-URGENT":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">InstantHPI</h1>
              <span className="ml-2 text-sm text-gray-500">Doctor Dashboard</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Top Hero Image (always butler) */}
        <HeroBanner />
        {/* 2-column layout: left main content (col-span-2) + right AI panel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT MAIN CONTENT */}
          <div className="lg:col-span-2">
            {/* Search Section */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Patient Search</CardTitle>
                <CardDescription>
                  Enter the 10-character patient identifier (e.g., A1B2C3D4E5)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Input
                      type="text"
                      placeholder="Enter Patient ID (e.g., A1B2C3D4E5)"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value.toUpperCase())}
                      onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                      className="uppercase font-mono"
                    />
                  </div>
                  <Button
                    onClick={handleSearch}
                    disabled={loading || !searchQuery.trim()}
                    className="flex items-center gap-2"
                  >
                    <Search className="h-4 w-4" />
                    Search
                  </Button>
                </div>

                {/* Search Results */}
                {searchResults.length > 0 && (
                  <div className="mt-6 space-y-3">
                    <h3 className="font-medium text-gray-700">Search Results</h3>
                    {searchResults.map((consultation) => (
                      <div
                        key={consultation.id}
                        className="p-4 bg-white border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => openPatientDetails(consultation)}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="font-mono font-bold text-lg">
                                {consultation.patient_id}
                              </span>
                              <Badge className={getTriageColor(consultation.triage_level)}>
                                {consultation.triage_level}
                              </Badge>
                              <Badge variant="outline">{consultation.status}</Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-1">
                              <strong>Chief Complaint:</strong> {consultation.chief_complaint}
                            </p>
                            <p className="text-xs text-gray-500">
                              {format(new Date(consultation.created_at), "PPpp")}
                            </p>
                          </div>
                          <ChevronRight className="h-5 w-5 text-gray-400" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Consultations */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Recent Consultations</CardTitle>
                <CardDescription>Latest patient submissions</CardDescription>
              </CardHeader>
              <CardContent>
                {recentPatients.length === 0 ? (
                  <p className="text-sm text-gray-500">No recent consultations</p>
                ) : (
                  <div className="space-y-2">
                    {recentPatients.map((consultation) => (
                      <div
                        key={consultation.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                        onClick={() => openPatientDetails(consultation)}
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-semibold">{consultation.patient_id}</span>
                          <Badge
                            className={getTriageColor(consultation.triage_level)}
                            variant="secondary"
                          >
                            {consultation.triage_level}
                          </Badge>
                        </div>
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* RIGHT AI PANEL */}
          <aside className="lg:col-span-1">
            <div className="lg:sticky lg:top-6 space-y-4">
              {/* TRANSCRIPTION (only sections) */}
              <Card>
                <CardHeader>
                  <CardTitle>Transcription Médicale</CardTitle>
                  <CardDescription>Générer 5 sections en français prêtes à copier</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value.toUpperCase())}
                      placeholder="ID Patient (A1B2C3D4E5)"
                      className="uppercase font-mono"
                    />
                    <Button
                      onClick={generateFrenchTranscription}
                      disabled={generating || !searchQuery}
                    >
                      {generating ? "Génération…" : "Générer"}
                    </Button>
                  </div>

                  {copyToast && <div className="text-xs text-green-700">{copyToast}</div>}

                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copyAll}
                      disabled={!frenchDoc.confirmation && !frenchDoc.soap}
                    >
                      Tout Copier
                    </Button>
                  </div>

                  {prefs.enableConfirmation && (
                    <FrenchSection
                      title="1. Confirmation Patient"
                      text={frenchDoc.confirmation}
                      onCopy={() => copySection("Confirmation", frenchDoc.confirmation)}
                    />
                  )}
                  {prefs.enableSOAP && (
                    <FrenchSection
                      title="2. Note SOAP"
                      text={frenchDoc.soap}
                      onCopy={() => copySection("SOAP", frenchDoc.soap)}
                    />
                  )}
                  {prefs.enablePlan && (
                    <FrenchSection
                      title="3. Plan - Points"
                      text={frenchDoc.plan}
                      onCopy={() => copySection("Plan", frenchDoc.plan)}
                    />
                  )}
                  {prefs.enableTelemedicine && (
                    <FrenchSection
                      title="4. Télémédecine"
                      text={frenchDoc.telemedicine}
                      onCopy={() => copySection("Télémédecine", frenchDoc.telemedicine)}
                    />
                  )}
                  {prefs.enableQuestions && (
                    <FrenchSection
                      title="5. Questions de Suivi"
                      text={frenchDoc.followup}
                      onCopy={() => copySection("Questions", frenchDoc.followup)}
                    />
                  )}
                </CardContent>
              </Card>
            </div>
          </aside>
        </div>

        {/* Footer rotating gallery */}
        <FooterRotator />
      </main>
    </div>
  );
}

// Hero banner (fixed: Butler image)
function HeroBanner() {
  const [url, setUrl] = React.useState<string>("/images/butler.jpg");

  React.useEffect(() => {
    // Try to locate a file containing "butler" in the manifest
    (async () => {
      try {
        const res = await fetch("/api/assets/images", { headers: { "Cache-Control": "no-cache" } });
        const data = await res.json();
        const files: any[] = Array.isArray(data?.files) ? data.files : [];
        const candidate = files.find((f: any) => {
          const n = String(f?.name || "");
          const u = String(f?.url || "");
          const fromImages =
            u.startsWith("/images/") || u.startsWith("/images%20for%20the%20website%20instanthpi/");
          return fromImages && /butler/i.test(n);
        });
        if (candidate?.url) setUrl(String(candidate.url));
      } catch {}
    })();
  }, []);

  return (
    <div className="mb-8 rounded-xl overflow-hidden border">
      <img
        src={url}
        alt="InstantHPI"
        className="w-full h-24 sm:h-28 md:h-32 lg:h-36 object-cover"
        onError={(e) => {
          const t = e.currentTarget as HTMLImageElement;
          if (!t.dataset.fallback1) {
            t.dataset.fallback1 = "1";
            t.src = "/instanthpi-hero.jpg";
          } else if (!t.dataset.fallback2) {
            t.dataset.fallback2 = "1";
            t.src = "/instanthpi-beach.jpg";
          }
        }}
      />
    </div>
  );
}

// Footer rotating gallery (excludes butler and screenshots)
function FooterRotator() {
  const [url, setUrl] = React.useState<string>("/instanthpi-hero.jpg");
  React.useEffect(() => {
    const pick = async () => {
      try {
        const res = await fetch("/api/assets/images", { headers: { "Cache-Control": "no-cache" } });
        const data = await res.json();
        const files: any[] = Array.isArray(data?.files) ? data.files : [];
        const list: string[] = files
          .filter((f: any) => {
            const u = String(f?.url || "");
            const n = String(f?.name || "");
            const fromImages =
              u.startsWith("/images/") ||
              u.startsWith("/images%20for%20the%20website%20instanthpi/");
            const isScreenshot = /screenshot/i.test(n);
            const isButler = /butler/i.test(n);
            return fromImages && !isScreenshot && !isButler;
          })
          .map((f: any) => String(f.url))
          .sort();
        if (list.length > 0) {
          const key = "doctor_footer_idx";
          const prev = parseInt(localStorage.getItem(key) || "-1", 10);
          const next = isNaN(prev) ? 0 : (prev + 1) % list.length;
          localStorage.setItem(key, String(next));
          setUrl(list[next]);
          return;
        }
      } catch {}
      setUrl("/instanthpi-hero.jpg");
    };
    pick();
  }, []);

  return (
    <div className="mt-10 rounded-xl overflow-hidden border">
      <img
        src={url}
        alt="InstantHPI"
        className="w-full h-24 sm:h-28 md:h-32 lg:h-36 object-cover"
        onError={(e) => {
          const t = e.currentTarget as HTMLImageElement;
          if (t.src.indexOf("instanthpi-beach.jpg") === -1) t.src = "/instanthpi-beach.jpg";
        }}
      />
    </div>
  );
}

// French medical transcription section with copy button (clean code blocks)
function FrenchSection({
  title,
  text,
  onCopy,
}: {
  title: string;
  text?: string;
  onCopy: () => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h4 className="font-semibold text-sm">{title}</h4>
        <Button variant="ghost" size="sm" onClick={onCopy} disabled={!text}>
          Copier
        </Button>
      </div>
      <div className="text-xs text-gray-800 whitespace-pre-line min-h-[60px] bg-gray-50 rounded-md border p-2 font-mono">
        {text ? (
          <code className="block">{text}</code>
        ) : (
          <span className="text-gray-400">Pas de contenu</span>
        )}
      </div>
    </div>
  );
}
