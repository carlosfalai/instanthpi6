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
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/ui/carousel";

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

  const [docHeader, setDocHeader] = useState<{ name: string; specialty: string; avatarUrl?: string }>({
    name: "Doctor",
    specialty: "",
    avatarUrl: "",
  });

  // French Medical Transcription state for the right panel
  const [generating, setGenerating] = useState(false);
  const [frenchDoc, setFrenchDoc] = useState<{
    hpiConfirmationSummary?: string;
    followUpQuestions?: string;
    superSpartanSAP?: string;
    medicationsReadyToUse?: string;
    labWorks?: string;
    imagerieMedicale?: string;
    referenceSpecialistes?: string;
    workLeaveCertificate?: string;
    workplaceModifications?: string;
    insuranceDocumentation?: string;
    telemedicineNeedsInPerson?: string;
    patientMessage?: string;
  }>({});
  const [triageHtml, setTriageHtml] = useState<string>("");
  const [copyToast, setCopyToast] = useState<string | null>(null);
  const [showRawData, setShowRawData] = useState<boolean>(false);
  const [customRequest, setCustomRequest] = useState<string>("");
  const [customResponse, setCustomResponse] = useState<string>("");
  const [generatingCustom, setGeneratingCustom] = useState<boolean>(false);

  // Load doctor AI preferences from localStorage
  type AIPrefs = {
    enableTriage: boolean;
    enableHpiConfirmationSummary: boolean;
    enableFollowUpQuestions: boolean;
    enableSuperSpartanSAP: boolean;
    enableMedicationsReadyToUse: boolean;
    enableLabWorks: boolean;
    enableImagerieMedicale: boolean;
    enableReferenceSpecialistes: boolean;
    enableWorkLeaveCertificate: boolean;
    enableWorkplaceModifications: boolean;
    enableInsuranceDocumentation: boolean;
    enableTelemedicineNeedsInPerson: boolean;
    enablePatientMessage: boolean;
    autoGenerateOnSelect: boolean;
  };
  const PREFS_KEY = "doctor_ai_prefs";
  const getPrefs = (): AIPrefs => {
    try {
      const raw = localStorage.getItem(PREFS_KEY);
      return raw
        ? {
            enableTriage: true,
            enableHpiConfirmationSummary: true,
            enableFollowUpQuestions: true,
            enableSuperSpartanSAP: true,
            enableMedicationsReadyToUse: true,
            enableLabWorks: true,
            enableImagerieMedicale: true,
            enableReferenceSpecialistes: true,
            enableWorkLeaveCertificate: true,
            enableWorkplaceModifications: true,
            enableInsuranceDocumentation: true,
            enableTelemedicineNeedsInPerson: true,
            enablePatientMessage: true,
            autoGenerateOnSelect: true,
            ...JSON.parse(raw),
          }
        : {
            enableTriage: true,
            enableHpiConfirmationSummary: true,
            enableFollowUpQuestions: true,
            enableSuperSpartanSAP: true,
            enableMedicationsReadyToUse: true,
            enableLabWorks: true,
            enableImagerieMedicale: true,
            enableReferenceSpecialistes: true,
            enableWorkLeaveCertificate: true,
            enableWorkplaceModifications: true,
            enableInsuranceDocumentation: true,
            enableTelemedicineNeedsInPerson: true,
            enablePatientMessage: true,
            autoGenerateOnSelect: true,
          };
    } catch {
      return {
        enableTriage: true,
        enableHpiConfirmationSummary: true,
        enableFollowUpQuestions: true,
        enableSuperSpartanSAP: true,
        enableMedicationsReadyToUse: true,
        enableLabWorks: true,
        enableImagerieMedicale: true,
        enableReferenceSpecialistes: true,
        enableWorkLeaveCertificate: true,
        enableWorkplaceModifications: true,
        enableInsuranceDocumentation: true,
        enableTelemedicineNeedsInPerson: true,
        enablePatientMessage: true,
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
    loadPhysicianHeader();
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

  const loadPhysicianHeader = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      
      // Try to get name from user metadata first
      let name = "Doctor";
      const given = (user as any)?.user_metadata?.given_name || "";
      const family = (user as any)?.user_metadata?.family_name || "";
      const email = user.email || "";
      
      // Extract name from email if no metadata
      if (!given && !family && email) {
        const emailName = email.split('@')[0];
        if (emailName.includes('.')) {
          const parts = emailName.split('.');
          name = parts.map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
        } else if (emailName.includes('_')) {
          const parts = emailName.split('_');
          name = parts.map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
        } else {
          name = emailName.charAt(0).toUpperCase() + emailName.slice(1);
        }
      } else if (given || family) {
        name = `${given} ${family}`.trim();
      }
      
      // Special case for your email: cff@centremedicalfont.ca -> Carlos Faviel Font
      if (email === 'cff@centremedicalfont.ca') {
        name = 'Carlos Faviel Font';
      }

      // Try to get profile data from database
      const { data, error } = await supabase
        .from("physician_profiles")
        .select("specialty, profile_image_url, profile_data")
        .eq("physician_id", user.id)
        .limit(1);
        
      if (!error && Array.isArray(data) && data.length > 0) {
        const row = data[0] as any;
        const pd = row.profile_data || {};
        const profileName = `${pd.firstName || given || ""} ${pd.lastName || family || ""}`.trim();
        if (profileName) name = profileName;
        
        setDocHeader({
          name,
          specialty: row.specialty || pd.specialty || "",
          avatarUrl: row.profile_image_url || pd.profileImageUrl || "",
        });
        return;
      }
      
      // Fallback: use extracted name or email-based name
      setDocHeader({ name, specialty: "", avatarUrl: "" });
    } catch (error) {
      console.error("Error loading physician header:", error);
      // Set a fallback name
      setDocHeader({ name: "Doctor", specialty: "", avatarUrl: "" });
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
    // Load patient data in the medical transcription panel instead of navigating
    setSearchQuery(consultation.patient_id);
    setSearchResults([consultation]);
    
    // Always auto-generate medical transcription when clicking on patient
    setTimeout(() => {
      generateFrenchTranscription();
    }, 100);
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
    if (prefs.enableHpiConfirmationSummary && frenchDoc.hpiConfirmationSummary) parts.push(frenchDoc.hpiConfirmationSummary);
    if (prefs.enableFollowUpQuestions && frenchDoc.followUpQuestions) parts.push(frenchDoc.followUpQuestions);
    if (prefs.enableSuperSpartanSAP && frenchDoc.superSpartanSAP) parts.push(frenchDoc.superSpartanSAP);
    if (prefs.enableMedicationsReadyToUse && frenchDoc.medicationsReadyToUse) parts.push(frenchDoc.medicationsReadyToUse);
    if (prefs.enableLabWorks && frenchDoc.labWorks) parts.push(frenchDoc.labWorks);
    if (prefs.enableImagerieMedicale && frenchDoc.imagerieMedicale) parts.push(frenchDoc.imagerieMedicale);
    if (prefs.enableReferenceSpecialistes && frenchDoc.referenceSpecialistes) parts.push(frenchDoc.referenceSpecialistes);
    if (prefs.enableWorkLeaveCertificate && frenchDoc.workLeaveCertificate) parts.push(frenchDoc.workLeaveCertificate);
    if (prefs.enableWorkplaceModifications && frenchDoc.workplaceModifications) parts.push(frenchDoc.workplaceModifications);
    if (prefs.enableInsuranceDocumentation && frenchDoc.insuranceDocumentation) parts.push(frenchDoc.insuranceDocumentation);
    if (prefs.enableTelemedicineNeedsInPerson && frenchDoc.telemedicineNeedsInPerson) parts.push(frenchDoc.telemedicineNeedsInPerson);
    if (prefs.enablePatientMessage && frenchDoc.patientMessage) parts.push(frenchDoc.patientMessage);
    copyText(parts.join("\n\n"));
  };

  // Generate custom AI request based on doctor's specific request
  const generateCustomRequest = async () => {
    if (!customRequest.trim()) {
      alert("Veuillez entrer une demande spécifique pour l'IA.");
      return;
    }

    const latest = searchResults[0] || recentPatients[0] || null;
    const patientId = (latest?.patient_id || searchQuery || "").toString().toUpperCase();

    if (!patientId) {
      alert("Veuillez d'abord sélectionner un patient.");
      return;
    }

    setGeneratingCustom(true);
    try {
      // Extract variables from consultation data
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
        body: JSON.stringify({ 
          patientId, 
          variables, 
          customRequest: customRequest.trim() 
        }),
      });
      
      if (!res.ok) throw new Error("Failed to generate custom response");
      const data = await res.json();
      setCustomResponse(data.customResponse || "Réponse générée par l'IA");
    } catch (e) {
      console.error(e);
      alert("Erreur lors de la génération de la demande personnalisée. Veuillez réessayer.");
    } finally {
      setGeneratingCustom(false);
    }
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
        hpiConfirmationSummary: data.hpiConfirmationSummary || "",
        followUpQuestions: data.followUpQuestions || "",
        superSpartanSAP: data.superSpartanSAP || "",
        medicationsReadyToUse: data.medicationsReadyToUse || "",
        labWorks: data.labWorks || "",
        imagerieMedicale: data.imagerieMedicale || "",
        referenceSpecialistes: data.referenceSpecialistes || "",
        workLeaveCertificate: data.workLeaveCertificate || "",
        workplaceModifications: data.workplaceModifications || "",
        insuranceDocumentation: data.insuranceDocumentation || "",
        telemedicineNeedsInPerson: data.telemedicineNeedsInPerson || "",
        patientMessage: data.patientMessage || "",
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
    localStorage.removeItem("doctor_authenticated");
    navigate("/doctor-login");
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
            <div className="flex items-center gap-4">
              {/* Doctor Profile */}
              <div
                className="flex items-center gap-3 px-3 py-2 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => navigate("/doctor-profile")}
              >
                <div className="w-8 h-8 rounded-full overflow-hidden bg-blue-100 flex items-center justify-center">
                  {docHeader.avatarUrl ? (
                    <img src={docHeader.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-sm font-medium text-blue-600">
                      {(docHeader.name?.split(" ").map((s) => s[0]).join("") || "DR").slice(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="text-sm">
                  <p className="font-medium text-gray-900">{docHeader.name}</p>
                  <p className="text-gray-500">{docHeader.specialty || "—"}</p>
                </div>
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
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Top carousel */}
        <DashboardCarousel />
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
                  <CardDescription>Cliquez sur un patient pour générer automatiquement 12+ sections en français</CardDescription>
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
                      disabled={!frenchDoc.hpiConfirmationSummary && !frenchDoc.followUpQuestions}
                    >
                      Tout Copier
                    </Button>
                  </div>

                  {/* Raw Patient Data Section - Always shown first */}
                  {searchResults.length > 0 && (
                    <div className="border rounded-lg">
                      <div 
                        className="flex items-center justify-between p-3 bg-gray-50 cursor-pointer hover:bg-gray-100"
                        onClick={() => setShowRawData(!showRawData)}
                      >
                        <h4 className="font-semibold text-sm">📋 Raw Patient Data (API Input)</h4>
                        <span className="text-sm text-gray-500">
                          {showRawData ? '▼' : '▶'}
                        </span>
                      </div>
                      {showRawData && (
                        <div className="p-3 border-t bg-white">
                          <div className="text-xs text-gray-800 whitespace-pre-line bg-gray-50 rounded-md border p-2 font-mono max-h-60 overflow-y-auto">
                            <code className="block">
                              {JSON.stringify(searchResults[0], null, 2)}
                            </code>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Custom AI Request Section */}
                  {searchResults.length > 0 && (
                    <div className="border rounded-lg">
                      <div className="p-3 bg-blue-50">
                        <h4 className="font-semibold text-sm mb-2">🤖 Demande Personnalisée à l'IA</h4>
                        <div className="space-y-2">
                          <textarea
                            value={customRequest}
                            onChange={(e) => setCustomRequest(e.target.value)}
                            placeholder="Ex: Fais-moi une demande d'arrêt de travail de 2 mois, ou Rédige une lettre pour l'assurance, ou Crée un plan de traitement spécifique..."
                            className="w-full p-2 text-sm border rounded-md resize-none"
                            rows={3}
                          />
                          <div className="flex gap-2">
                            <Button
                              onClick={generateCustomRequest}
                              disabled={generatingCustom || !customRequest.trim()}
                              size="sm"
                              className="flex-1"
                            >
                              {generatingCustom ? "Génération..." : "Générer"}
                            </Button>
                            {customResponse && (
                              <Button
                                onClick={() => copyText(customResponse)}
                                variant="outline"
                                size="sm"
                              >
                                Copier
                              </Button>
                            )}
                          </div>
                          {customResponse && (
                            <div className="mt-2">
                              <div className="text-xs text-gray-800 whitespace-pre-line bg-white rounded-md border p-2 font-mono max-h-40 overflow-y-auto">
                                <code className="block">{customResponse}</code>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {prefs.enableHpiConfirmationSummary && (
                    <FrenchSection
                      title="1. HPI Confirmation Summary"
                      text={frenchDoc.hpiConfirmationSummary}
                      onCopy={() => copySection("HPI Confirmation", frenchDoc.hpiConfirmationSummary)}
                    />
                  )}
                  {prefs.enableFollowUpQuestions && (
                    <FrenchSection
                      title="2. 10 Follow-up Questions"
                      text={frenchDoc.followUpQuestions}
                      onCopy={() => copySection("Follow-up Questions", frenchDoc.followUpQuestions)}
                    />
                  )}
                  {prefs.enableSuperSpartanSAP && (
                    <FrenchSection
                      title="3. Super Spartan SAP Note"
                      text={frenchDoc.superSpartanSAP}
                      onCopy={() => copySection("SAP Note", frenchDoc.superSpartanSAP)}
                    />
                  )}
                  {prefs.enableMedicationsReadyToUse && (
                    <FrenchSection
                      title="4. Medications Ready to Use"
                      text={frenchDoc.medicationsReadyToUse}
                      onCopy={() => copySection("Medications", frenchDoc.medicationsReadyToUse)}
                    />
                  )}
                  {prefs.enableLabWorks && (
                    <FrenchSection
                      title="5. Lab Works"
                      text={frenchDoc.labWorks}
                      onCopy={() => copySection("Lab Works", frenchDoc.labWorks)}
                    />
                  )}
                  {prefs.enableImagerieMedicale && (
                    <FrenchSection
                      title="6. Imagerie Médicale"
                      text={frenchDoc.imagerieMedicale}
                      onCopy={() => copySection("Imagerie", frenchDoc.imagerieMedicale)}
                    />
                  )}
                  {prefs.enableReferenceSpecialistes && (
                    <FrenchSection
                      title="7. Référence aux Spécialistes"
                      text={frenchDoc.referenceSpecialistes}
                      onCopy={() => copySection("Référence", frenchDoc.referenceSpecialistes)}
                    />
                  )}
                  {prefs.enableWorkLeaveCertificate && (
                    <FrenchSection
                      title="8. Work Leave Certificate"
                      text={frenchDoc.workLeaveCertificate}
                      onCopy={() => copySection("Work Leave", frenchDoc.workLeaveCertificate)}
                    />
                  )}
                  {prefs.enableWorkplaceModifications && (
                    <FrenchSection
                      title="9. Workplace Modifications"
                      text={frenchDoc.workplaceModifications}
                      onCopy={() => copySection("Workplace", frenchDoc.workplaceModifications)}
                    />
                  )}
                  {prefs.enableInsuranceDocumentation && (
                    <FrenchSection
                      title="10. Insurance Documentation"
                      text={frenchDoc.insuranceDocumentation}
                      onCopy={() => copySection("Insurance", frenchDoc.insuranceDocumentation)}
                    />
                  )}
                  {prefs.enableTelemedicineNeedsInPerson && (
                    <FrenchSection
                      title="11. Télémédecine Needs In-Person"
                      text={frenchDoc.telemedicineNeedsInPerson}
                      onCopy={() => copySection("Télémédecine", frenchDoc.telemedicineNeedsInPerson)}
                    />
                  )}
                  {prefs.enablePatientMessage && (
                    <FrenchSection
                      title="12. Patient Message"
                      text={frenchDoc.patientMessage}
                      onCopy={() => copySection("Patient Message", frenchDoc.patientMessage)}
                    />
                  )}
                </CardContent>
              </Card>
            </div>
          </aside>
        </div>

      </main>
    </div>
  );
}

// Dashboard carousel using Embla/shadcn carousel
function DashboardCarousel() {
  const [images, setImages] = React.useState<string[]>([]);
  React.useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/assets/images", { headers: { "Cache-Control": "no-cache" } });
        const data = await res.json();
        const files: any[] = Array.isArray(data?.files) ? data.files : [];
        const urls: string[] = files
          .filter((f: any) => {
            const n = String(f?.name || "");
            return !/screenshot/i.test(n) && !/butler/i.test(n);
          })
          .map((f: any) => String(f.url));
        setImages(urls);
      } catch {
        setImages([]);
      }
    })();
  }, []);
  const slides = images.length ? images : ["/instanthpi-hero.jpg"];
  return (
    <div className="mb-8 bg-white rounded-xl overflow-hidden border shadow-sm">
      <Carousel className="w-full">
        <CarouselContent>
          {slides.map((url, idx) => (
            <CarouselItem key={idx}>
              <div className="flex items-center justify-center p-4">
                <img
                  src={url}
                  alt="InstantHPI"
                  className="max-w-full max-h-[400px] object-contain rounded-lg"
                  onError={(e) => {
                    const t = e.currentTarget as HTMLImageElement;
                    if (!t.src.includes("instanthpi-beach.jpg")) t.src = "/instanthpi-beach.jpg";
                  }}
                />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </div>
  );
}

// Enhanced French medical transcription section with copy button (inspired by instanthpi-medical)
function FrenchSection({
  title,
  text,
  onCopy,
}: {
  title: string;
  text?: string;
  onCopy: () => void;
}) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    onCopy();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="border rounded-lg mb-4">
      <div className="flex items-center justify-between p-3 bg-gray-50 cursor-pointer hover:bg-gray-100">
        <h4 className="font-semibold text-sm text-gray-800">{title}</h4>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleCopy} 
          disabled={!text}
          className={`transition-all duration-200 ${
            copied 
              ? 'bg-green-100 text-green-800 hover:bg-green-200' 
              : 'hover:bg-blue-100 text-blue-800'
          }`}
        >
          {copied ? '✓ Copié!' : '📋 Copier'}
        </Button>
      </div>
      <div className="p-3 border-t bg-white">
        <div className="text-xs text-gray-800 whitespace-pre-line min-h-[60px] bg-gray-50 rounded-md border p-3 font-mono max-h-80 overflow-y-auto">
          {text ? (
            <code className="block leading-relaxed">{text}</code>
          ) : (
            <span className="text-gray-400 italic">Contenu en cours de génération...</span>
          )}
        </div>
      </div>
    </div>
  );
}
