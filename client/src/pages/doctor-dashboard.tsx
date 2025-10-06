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
  completeData?: {
    patient_answers?: Array<{
      hpi_confirmed: boolean;
      hpi_corrections?: string;
      answers: Record<string, string>;
    }>;
    consultations?: any[];
  };
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
  const [showComprehensiveReport, setShowComprehensiveReport] = useState<boolean>(false);
  const [comprehensiveReport, setComprehensiveReport] = useState<any>(null);
  const [generatingComprehensive, setGeneratingComprehensive] = useState<boolean>(false);
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

  const openPatientDetails = async (consultation: PatientConsultation) => {
    // Load patient data in the medical transcription panel instead of navigating
    setSearchQuery(consultation.patient_id);
    setSearchResults([consultation]);
    
    // Fetch complete patient data including answers and enhanced SOAP note
    try {
      const response = await fetch(`/api/patient-data?patient_id=${consultation.patient_id}`);
      if (response.ok) {
        const patientData = await response.json();
        console.log('Complete patient data:', patientData);
        // Store complete patient data for display
        setSearchResults([{ ...consultation, completeData: patientData }]);
      }
    } catch (error) {
      console.error('Error fetching complete patient data:', error);
    }
    
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

  const copyToClipboard = async (text: string) => {
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

  // Generate French medical transcription - SINGLE API CALL ONLY
  const generateFrenchTranscription = async () => {
    const latest = searchResults[0] || recentPatients[0] || null;
    const patientId = (latest?.patient_id || searchQuery || "").toString().toUpperCase();

    if (!patientId) {
      alert("Enter a patient ID in the search box first.");
      return;
    }

    // Check if we already have cached transcription for this patient
    const cacheKey = `french_transcription_${patientId}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const cachedData = JSON.parse(cached);
        setFrenchDoc(cachedData);
        console.log("Using cached French transcription for patient:", patientId);
        return;
      } catch (e) {
        console.warn("Failed to parse cached transcription, generating new one");
      }
    }

    // Prevent multiple API calls
    if (generating) {
      console.log("API call already in progress, ignoring duplicate request");
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

      console.log("Making SINGLE API call for patient:", patientId);
      const res = await fetch("/api/medical-transcription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId, variables }),
      });
      if (!res.ok) throw new Error("Failed to generate French transcription");
      const data = await res.json();
      
      const transcriptionData = {
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
      };
      
      setFrenchDoc(transcriptionData);
      
      // PERMANENTLY store the transcription for this patient - NOT CHANGEABLE
      localStorage.setItem(cacheKey, JSON.stringify(transcriptionData));
      console.log("PERMANENTLY stored French transcription for patient:", patientId);
      
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

    // Check if we already have cached triage document for this patient
    const cacheKey = `triage_document_${patientId}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const cachedData = JSON.parse(cached);
        setTriageHtml(cachedData);
        console.log("Using cached triage document for patient:", patientId);
        return;
      } catch (e) {
        console.warn("Failed to parse cached triage document, generating new one");
      }
    }

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
      const htmlContent = data.htmlContent || "";
      setTriageHtml(htmlContent);
      
      // Cache the triage document for this patient
      localStorage.setItem(cacheKey, JSON.stringify(htmlContent));
      console.log("Cached triage document for patient:", patientId);
      
    } catch (e) {
      console.error(e);
      setTriageHtml("");
    }
  };

  // Generate comprehensive report
  const generateComprehensiveReport = async () => {
    const latest = searchResults[0] || recentPatients[0] || null;
    const patientId = (latest?.patient_id || searchQuery || "").toString().toUpperCase();
    if (!patientId) return;

    // Check if we already have cached comprehensive report for this patient
    const cacheKey = `comprehensive_report_${patientId}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const cachedData = JSON.parse(cached);
        setComprehensiveReport(cachedData);
        console.log("Using cached comprehensive report for patient:", patientId);
        return;
      } catch (e) {
        console.warn("Failed to parse cached comprehensive report, generating new one");
      }
    }

    setGeneratingComprehensive(true);
    try {
      const res = await fetch("/api/comprehensive-triage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(latest),
      });
      if (!res.ok) throw new Error("Failed to generate comprehensive report");
      const data = await res.json();
      setComprehensiveReport(data);
      
      // Cache the comprehensive report for this patient
      localStorage.setItem(cacheKey, JSON.stringify(data));
      console.log("Cached comprehensive report for patient:", patientId);
      
    } catch (e) {
      console.error(e);
      alert("Rapport complet échoué. Veuillez réessayer.");
    } finally {
      setGeneratingComprehensive(false);
    }
  };

  const quickAccessPatient = (patientId: string) => {
    setSearchQuery(patientId);
    handleSearch();
    
    // Load cached transcription if available (NO API CALL)
    const cacheKey = `french_transcription_${patientId}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const cachedData = JSON.parse(cached);
        setFrenchDoc(cachedData);
        console.log("Loaded cached transcription for patient:", patientId);
      } catch (e) {
        console.warn("Failed to parse cached transcription");
      }
    } else {
      // Clear French doc if no cached data
      setFrenchDoc({});
    }
  };

  // DISABLED: Auto-generate when a patient is selected - DOCTOR MUST CLICK GENERATE
  // This prevents multiple API calls and gives doctor control
  // useEffect(() => {
  //   if (prefs.autoGenerateOnSelect && (searchResults[0] || recentPatients[0])) {
  //     if (prefs.enableTriage) generateTriageDocument();
  //     generateFrenchTranscription();
  //   }
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [searchResults.length]);

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
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-800">InstantHPI</h1>
              <span className="ml-2 text-sm text-gray-600">Doctor's Dashboard</span>
            </div>
            <div className="flex items-center gap-4">
              {/* Doctor Profile */}
              <div
                className="flex items-center gap-3 px-3 py-2 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors border border-gray-200"
                onClick={() => navigate("/doctor-profile")}
              >
                <div className="w-8 h-8 rounded-full overflow-hidden bg-blue-600 flex items-center justify-center">
                  {docHeader.avatarUrl ? (
                    <img src={docHeader.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-sm font-medium text-white">
                      {(docHeader.name?.split(" ").map((s) => s[0]).join("") || "DR").slice(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="text-sm">
                  <p className="font-medium text-gray-800">{docHeader.name}</p>
                  <p className="text-gray-600">{docHeader.specialty || "—"}</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="flex items-center gap-2 border-gray-300 text-gray-700 hover:bg-gray-50"
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
        {/* Full width layout for medical sections */}
        <div className="space-y-8">
          {/* Medical Sections - Full Width Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FrenchSection
              title="1. HPI Confirmation Summary"
              text={frenchDoc?.hpiConfirmationSummary}
              onCopy={() => copyToClipboard(frenchDoc?.hpiConfirmationSummary || "")}
            />
            <FrenchSection
              title="2. Follow-up Questions"
              text={frenchDoc?.followUpQuestions}
              onCopy={() => copyToClipboard(frenchDoc?.followUpQuestions || "")}
            />
            <FrenchSection
              title="3. Super Spartan SAP Note"
              text={frenchDoc?.superSpartanSAP}
              onCopy={() => copyToClipboard(frenchDoc?.superSpartanSAP || "")}
            />
            <FrenchSection
              title="4. Medications Ready to Use"
              text={frenchDoc?.medicationsReadyToUse}
              onCopy={() => copyToClipboard(frenchDoc?.medicationsReadyToUse || "")}
            />
            <FrenchSection
              title="5. Lab Works"
              text={frenchDoc?.labWorks}
              onCopy={() => copyToClipboard(frenchDoc?.labWorks || "")}
            />
            <FrenchSection
              title="6. Imagerie Médicale"
              text={frenchDoc?.imagerieMedicale}
              onCopy={() => copyToClipboard(frenchDoc?.imagerieMedicale || "")}
            />
            <FrenchSection
              title="7. Référence Spécialistes"
              text={frenchDoc?.referenceSpecialistes}
              onCopy={() => copyToClipboard(frenchDoc?.referenceSpecialistes || "")}
            />
            <FrenchSection
              title="8. Work Leave Certificate"
              text={frenchDoc?.workLeaveCertificate}
              onCopy={() => copyToClipboard(frenchDoc?.workLeaveCertificate || "")}
            />
            <FrenchSection
              title="9. Workplace Modifications"
              text={frenchDoc?.workplaceModifications}
              onCopy={() => copyToClipboard(frenchDoc?.workplaceModifications || "")}
            />
            <FrenchSection
              title="10. Insurance Documentation"
              text={frenchDoc?.insuranceDocumentation}
              onCopy={() => copyToClipboard(frenchDoc?.insuranceDocumentation || "")}
            />
            <FrenchSection
              title="11. Telemedicine Needs In Person"
              text={frenchDoc?.telemedicineNeedsInPerson}
              onCopy={() => copyToClipboard(frenchDoc?.telemedicineNeedsInPerson || "")}
            />
            <FrenchSection
              title="12. Patient Message"
              text={frenchDoc?.patientMessage}
              onCopy={() => copyToClipboard(frenchDoc?.patientMessage || "")}
            />
          </div>

          {/* Footer Image */}
          <FooterImageRotator />
        </div>

        {/* Original 2-column layout for search and recent consultations */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          {/* LEFT MAIN CONTENT */}
          <div className="lg:col-span-2">
            {/* Search Section */}
            <Card className="mb-8 bg-gray-800 border-gray-700 shadow-sm">
              <CardHeader>
                <CardTitle className="text-white">Patient Search</CardTitle>
                <CardDescription className="text-gray-300">
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
                      className="uppercase font-mono border-gray-300 focus:border-blue-500"
                    />
                  </div>
                  <Button
                    onClick={handleSearch}
                    disabled={loading || !searchQuery.trim()}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Search className="h-4 w-4" />
                    Search
                  </Button>
                </div>

                {/* Search Results */}
                {searchResults.length > 0 && (
                  <div className="mt-6 space-y-3">
                    <h3 className="font-medium text-gray-800">Search Results</h3>
                    {searchResults.map((consultation) => (
                      <div
                        key={consultation.id}
                        className="p-4 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                        onClick={() => openPatientDetails(consultation)}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="font-mono font-bold text-lg text-gray-800">
                                {consultation.patient_id}
                              </span>
                              <Badge className={getTriageColor(consultation.triage_level)}>
                                {consultation.triage_level}
                              </Badge>
                              <Badge variant="outline" className="border-gray-300 text-gray-700">{consultation.status}</Badge>
                            </div>
                            <p className="text-sm text-gray-700 mb-1">
                              <strong>Chief Complaint:</strong> {consultation.chief_complaint}
                            </p>
                            <p className="text-xs text-gray-600">
                              {format(new Date(consultation.created_at), "PPpp")}
                            </p>
                          </div>
                          <ChevronRight className="h-5 w-5 text-gray-500" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Consultations */}
            <Card className="mb-8 bg-gray-800 border-gray-700 shadow-sm">
              <CardHeader>
                <CardTitle className="text-white">Recent Consultations</CardTitle>
                <CardDescription className="text-gray-300">Latest patient submissions</CardDescription>
              </CardHeader>
              <CardContent>
                {recentPatients.length === 0 ? (
                  <p className="text-sm text-gray-400">No recent consultations</p>
                ) : (
                  <div className="space-y-2">
                    {recentPatients.map((consultation) => (
                      <div
                        key={consultation.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors border border-gray-200"
                        onClick={() => openPatientDetails(consultation)}
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-semibold text-gray-800">{consultation.patient_id}</span>
                          <Badge
                            className={getTriageColor(consultation.triage_level)}
                            variant="secondary"
                          >
                            {consultation.triage_level}
                          </Badge>
                        </div>
                        <ChevronRight className="h-4 w-4 text-gray-500" />
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
              <Card className="bg-white border-gray-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-gray-800">Transcription Médicale</CardTitle>
                  <CardDescription className="text-gray-600">Cliquez sur un patient pour générer automatiquement 12+ sections en français</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value.toUpperCase())}
                      placeholder="ID Patient (A1B2C3D4E5)"
                      className="uppercase font-mono border-gray-300 focus:border-blue-500"
                    />
                    <Button
                      onClick={generateFrenchTranscription}
                      disabled={generating || !searchQuery}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
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
                      className="border-gray-300 text-gray-700 hover:bg-gray-50"
                    >
                      Tout Copier
                    </Button>
                  </div>

                  {/* Complete Patient Data Section - Always shown first */}
                  {searchResults.length > 0 && (
                    <div className="border border-gray-200 rounded-lg bg-gray-50">
                      <div 
                        className="flex items-center justify-between p-3 bg-gray-100 cursor-pointer hover:bg-gray-200 border-b border-gray-200"
                        onClick={() => setShowRawData(!showRawData)}
                      >
                        <h4 className="font-semibold text-sm text-gray-800">📋 Complete Patient Data</h4>
                        <span className="text-sm text-gray-600">
                          {showRawData ? '▼' : '▶'}
                        </span>
                      </div>
                      {showRawData && (
                        <div className="p-3 bg-white space-y-4">
                          {/* Patient Answers and HPI Confirmation */}
                          {searchResults[0].completeData?.patient_answers?.[0] && (
                            <div className="border rounded-lg p-3 bg-blue-50">
                              <h5 className="font-semibold text-sm mb-2">📝 Patient Q&A Responses</h5>
                              <div className="text-xs space-y-2">
                                <p><strong>HPI Confirmed:</strong> {searchResults[0].completeData.patient_answers[0].hpi_confirmed ? 'Yes' : 'No'}</p>
                                {searchResults[0].completeData.patient_answers[0].hpi_corrections && (
                                  <p><strong>Corrections:</strong> {searchResults[0].completeData.patient_answers[0].hpi_corrections}</p>
                                )}
                                <div>
                                  <strong>Answers to 10 Questions:</strong>
                                  <div className="mt-1 space-y-1">
                                    {Object.entries(searchResults[0].completeData.patient_answers[0].answers || {}).map(([q, a]) => (
                                      <div key={q} className="pl-2 border-l-2 border-blue-200">
                                        <span className="font-medium">Q{q}:</span> {a as string}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {/* Raw Data */}
                          <div className="text-xs text-gray-800 whitespace-pre-line bg-gray-50 rounded-md border p-2 font-mono max-h-60 overflow-y-auto">
                            <code className="block">
                              {JSON.stringify(searchResults[0], null, 2)}
                            </code>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Comprehensive Medical Report Section */}
                  {searchResults.length > 0 && (
                    <div className="border rounded-lg">
                      <div 
                        className="flex items-center justify-between p-3 bg-green-50 cursor-pointer hover:bg-green-100"
                        onClick={() => setShowComprehensiveReport(!showComprehensiveReport)}
                      >
                        <h4 className="font-semibold text-sm">🏥 Rapport Médical Complet</h4>
                        <span className="text-sm text-gray-500">
                          {showComprehensiveReport ? '▼' : '▶'}
                        </span>
                      </div>
                      {showComprehensiveReport && (
                        <div className="p-3 border-t bg-white space-y-4">
                          {/* Generate Comprehensive Report Button */}
                          <div className="flex gap-2 mb-4">
                            <Button
                              onClick={generateComprehensiveReport}
                              disabled={generatingComprehensive}
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                            >
                              {generatingComprehensive ? "Génération..." : "Générer Rapport Complet"}
                            </Button>
                          </div>

                          {/* Comprehensive Report Sections */}
                          {comprehensiveReport && (
                            <div className="space-y-4">
                              {/* 1. HPI Summary */}
                              {comprehensiveReport.hpi_summary && (
                                <div className="border rounded-lg p-3 bg-blue-50">
                                  <div className="flex justify-between items-center mb-2">
                                    <h5 className="font-semibold text-sm">1. Résumé de Confirmation HPI</h5>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => copyToClipboard(comprehensiveReport.hpi_summary)}
                                    >
                                      Copier
                                    </Button>
                                  </div>
                                  <div className="text-sm whitespace-pre-line">{comprehensiveReport.hpi_summary}</div>
                                </div>
                              )}

                              {/* 2. Follow-up Questions */}
                              {comprehensiveReport.follow_up_questions && (
                                <div className="border rounded-lg p-3 bg-yellow-50">
                                  <div className="flex justify-between items-center mb-2">
                                    <h5 className="font-semibold text-sm">2. Questions de Suivi (10 questions)</h5>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => copyToClipboard(comprehensiveReport.follow_up_questions.join('\n'))}
                                    >
                                      Copier
                                    </Button>
                                  </div>
                                  <div className="text-sm space-y-1">
                                    {comprehensiveReport.follow_up_questions.map((question, index) => (
                                      <div key={index} className="pl-2 border-l-2 border-yellow-200">
                                        {question}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* 3. SAP Note */}
                              {comprehensiveReport.sap_note && (
                                <div className="border rounded-lg p-3 bg-purple-50">
                                  <div className="flex justify-between items-center mb-2">
                                    <h5 className="font-semibold text-sm">3. Super Spartan SAP Note</h5>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => copyToClipboard(comprehensiveReport.sap_note)}
                                    >
                                      Copier
                                    </Button>
                                  </div>
                                  <div className="text-sm whitespace-pre-line">{comprehensiveReport.sap_note}</div>
                                </div>
                              )}

                              {/* 4. Medications */}
                              {comprehensiveReport.medications && comprehensiveReport.medications.length > 0 && (
                                <div className="border rounded-lg p-3 bg-green-50">
                                  <div className="flex justify-between items-center mb-2">
                                    <h5 className="font-semibold text-sm">4. Médicaments - Prescriptions Prêtes à Utiliser</h5>
                                  </div>
                                  <div className="space-y-3">
                                    {comprehensiveReport.medications.map((med, index) => (
                                      <div key={index} className="border rounded p-3 bg-white">
                                        <div className="flex justify-between items-center mb-2">
                                          <h6 className="font-semibold text-sm">{med.name}</h6>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => copyToClipboard(`${med.name}\n${med.dosage}\nQuantité: ${med.quantity} | Renouvellement: ${med.renewal}\nInstructions: ${med.instructions}`)}
                                          >
                                            Copier
                                          </Button>
                                        </div>
                                        <div className="text-sm space-y-1">
                                          <div><strong>Dosage:</strong> {med.dosage}</div>
                                          <div><strong>Quantité:</strong> {med.quantity} | <strong>Renouvellement:</strong> {med.renewal}</div>
                                          <div><strong>Instructions:</strong> {med.instructions}</div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* 5. Lab Work */}
                              {comprehensiveReport.lab_work && comprehensiveReport.lab_work.length > 0 && (
                                <div className="border rounded-lg p-3 bg-orange-50">
                                  <div className="flex justify-between items-center mb-2">
                                    <h5 className="font-semibold text-sm">5. Analyses de Laboratoire</h5>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => copyToClipboard(comprehensiveReport.lab_work.join('\n'))}
                                    >
                                      Copier
                                    </Button>
                                  </div>
                                  <div className="text-sm font-mono bg-gray-100 p-2 rounded">
                                    {comprehensiveReport.lab_work.join('\n')}
                                  </div>
                                </div>
                              )}

                              {/* 6. Imaging */}
                              {comprehensiveReport.imaging && comprehensiveReport.imaging.length > 0 && (
                                <div className="border rounded-lg p-3 bg-cyan-50">
                                  <div className="flex justify-between items-center mb-2">
                                    <h5 className="font-semibold text-sm">6. Imagerie Médicale</h5>
                                  </div>
                                  <div className="space-y-3">
                                    {comprehensiveReport.imaging.map((img, index) => (
                                      <div key={index} className="border rounded p-3 bg-white">
                                        <div className="flex justify-between items-center mb-2">
                                          <h6 className="font-semibold text-sm">{img.name}</h6>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => copyToClipboard(`${img.name}\n${img.patient_info}\nIndication: ${img.indication}\nDélai recommandé: ${img.timing}`)}
                                          >
                                            Copier
                                          </Button>
                                        </div>
                                        <div className="text-sm space-y-1">
                                          <div>{img.patient_info}</div>
                                          <div><strong>Indication:</strong> {img.indication}</div>
                                          <div><strong>Délai recommandé:</strong> {img.timing}</div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* 7. Referrals */}
                              {comprehensiveReport.referrals && comprehensiveReport.referrals.length > 0 && (
                                <div className="border rounded-lg p-3 bg-pink-50">
                                  <div className="flex justify-between items-center mb-2">
                                    <h5 className="font-semibold text-sm">7. Références Spécialisées</h5>
                                  </div>
                                  <div className="space-y-3">
                                    {comprehensiveReport.referrals.map((ref, index) => (
                                      <div key={index} className="border rounded p-3 bg-white">
                                        <div className="flex justify-between items-center mb-2">
                                          <h6 className="font-semibold text-sm">{ref.specialty}</h6>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => copyToClipboard(`${ref.specialty}\n${ref.patient_info}\nIndication: ${ref.indication}\nDélai recommandé: ${ref.timing}`)}
                                          >
                                            Copier
                                          </Button>
                                        </div>
                                        <div className="text-sm space-y-1">
                                          <div>{ref.patient_info}</div>
                                          <div><strong>Indication:</strong> {ref.indication}</div>
                                          <div><strong>Délai recommandé:</strong> {ref.timing}</div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* 8. Work Leave */}
                              {comprehensiveReport.work_leave && (
                                <div className="border rounded-lg p-3 bg-indigo-50">
                                  <div className="flex justify-between items-center mb-2">
                                    <h5 className="font-semibold text-sm">8. Arrêt de Travail et École</h5>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => copyToClipboard(comprehensiveReport.work_leave)}
                                    >
                                      Copier
                                    </Button>
                                  </div>
                                  <div className="text-sm whitespace-pre-line">{comprehensiveReport.work_leave}</div>
                                </div>
                              )}

                              {/* 9. Workplace Modifications */}
                              {comprehensiveReport.workplace_modifications && (
                                <div className="border rounded-lg p-3 bg-teal-50">
                                  <div className="flex justify-between items-center mb-2">
                                    <h5 className="font-semibold text-sm">9. Modifications du Poste de Travail</h5>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => copyToClipboard(comprehensiveReport.workplace_modifications)}
                                    >
                                      Copier
                                    </Button>
                                  </div>
                                  <div className="text-sm whitespace-pre-line">{comprehensiveReport.workplace_modifications}</div>
                                </div>
                              )}

                              {/* 10. Insurance Documentation */}
                              {comprehensiveReport.insurance_documentation && (
                                <div className="border rounded-lg p-3 bg-red-50">
                                  <div className="flex justify-between items-center mb-2">
                                    <h5 className="font-semibold text-sm">10. Documentation d'Assurance</h5>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => copyToClipboard(comprehensiveReport.insurance_documentation)}
                                    >
                                      Copier
                                    </Button>
                                  </div>
                                  <div className="text-sm whitespace-pre-line">{comprehensiveReport.insurance_documentation}</div>
                                </div>
                              )}

                              {/* 11. Telemedicine Limitations */}
                              {comprehensiveReport.telemedicine_limitations && (
                                <div className="border rounded-lg p-3 bg-amber-50">
                                  <div className="flex justify-between items-center mb-2">
                                    <h5 className="font-semibold text-sm">11. Télémédecine - Nécessite Évaluation en Personne</h5>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => copyToClipboard(comprehensiveReport.telemedicine_limitations)}
                                    >
                                      Copier
                                    </Button>
                                  </div>
                                  <div className="text-sm whitespace-pre-line">{comprehensiveReport.telemedicine_limitations}</div>
                                </div>
                              )}

                              {/* 12. Emergency Referral */}
                              {comprehensiveReport.emergency_referral && (
                                <div className="border rounded-lg p-3 bg-red-100">
                                  <div className="flex justify-between items-center mb-2">
                                    <h5 className="font-semibold text-sm">12. Référence pour l'Équipe d'Urgence</h5>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => copyToClipboard(comprehensiveReport.emergency_referral)}
                                    >
                                      Copier
                                    </Button>
                                  </div>
                                  <div className="text-sm whitespace-pre-line">{comprehensiveReport.emergency_referral}</div>
                                </div>
                              )}
                            </div>
                          )}
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

        {/* Footer Image Rotator */}
        <FooterImageRotator />

      </main>
    </div>
  );
}

// Professional Butler hero image at the top
function DashboardCarousel() {
  const [butlerImage, setButlerImage] = React.useState<string>("/instanthpi-hero.jpg");
  const [imageError, setImageError] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/assets/images", { headers: { "Cache-Control": "no-cache" } });
        const data = await res.json();
        const files: any[] = Array.isArray(data?.files) ? data.files : [];
        // Find Butler image specifically - look for the professional butler image
        const butler = files.find((f: any) => {
          const name = String(f?.name || "").toLowerCase();
          return /butler/i.test(name) || /hm8kcbkko/i.test(name) || /professional/i.test(name) || /doctor/i.test(name) || /medical/i.test(name);
        });
        if (butler) {
          setButlerImage(String(butler.url));
        } else {
          // If no butler found, use the largest high-quality image as hero
          const highQualityImages = files
            .filter((f: any) => f.size > 100000) // Larger than 100KB
            .sort((a: any, b: any) => b.size - a.size);
          if (highQualityImages.length > 0) {
            setButlerImage(String(highQualityImages[0].url));
          }
        }
      } catch {
        // Keep default fallback
      }
    })();
  }, []);
  
  return (
    <div className="mb-8 bg-white rounded-lg overflow-hidden border border-gray-200 shadow-sm">
      <div className="flex items-center justify-center p-6">
        <img
          src={butlerImage}
          alt="InstantHPI Butler"
          className="max-w-full max-h-[400px] object-contain"
          onError={(e) => {
            setImageError(true);
            const t = e.currentTarget as HTMLImageElement;
            if (!t.src.includes("instanthpi-hero.jpg")) t.src = "/instanthpi-hero.jpg";
          }}
        />
      </div>
    </div>
  );
}

// Random footer image (changes on page reload)
function FooterImageRotator() {
  const [randomImage, setRandomImage] = React.useState<string>("/instanthpi-beach.jpg");

  React.useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/assets/images", { headers: { "Cache-Control": "no-cache" } });
        const data = await res.json();
        const files: any[] = Array.isArray(data?.files) ? data.files : [];
        // Get all images except Butler and screenshots
        const otherImages = files
          .filter((f: any) => {
            const n = String(f?.name || "");
            return !/screenshot/i.test(n) && !/butler/i.test(n);
          })
          .map((f: any) => String(f.url));
        
        if (otherImages.length > 0) {
          // Pick a random image on page load
          const randomIndex = Math.floor(Math.random() * otherImages.length);
          setRandomImage(otherImages[randomIndex]);
        }
      } catch {
        setRandomImage("/instanthpi-beach.jpg");
      }
    })();
  }, []);

  return (
    <div className="mt-8 bg-gray-800 rounded-xl overflow-hidden border border-gray-700 shadow-sm">
      <div className="flex items-center justify-center p-4">
        <img
          src={randomImage}
          alt="InstantHPI"
          className="max-w-full max-h-[300px] object-contain rounded-lg"
          onError={(e) => {
            const t = e.currentTarget as HTMLImageElement;
            if (!t.src.includes("instanthpi-beach.jpg")) t.src = "/instanthpi-beach.jpg";
          }}
        />
      </div>
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
    <div className="bg-white border border-gray-200 rounded-lg mb-6 shadow-sm">
      {/* Professional medical header */}
      <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <h4 className="text-lg font-semibold text-gray-800">{title}</h4>
          <button
            onClick={handleCopy}
            disabled={!text}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              copied 
                ? 'bg-green-600 text-white border border-green-500' 
                : text 
                  ? 'bg-blue-600 text-white border border-blue-500 hover:bg-blue-700' 
                  : 'bg-gray-300 text-gray-500 border border-gray-400 cursor-not-allowed'
            }`}
          >
            {copied ? '✓ Copied' : 'Copy'}
          </button>
        </div>
      </div>
      
      {/* Main content area - ADAPTIVE SIZING, NO FIXED HEIGHTS */}
      <div className="p-6">
        {text ? (
          <div className="prose max-w-none">
            <div className="text-gray-800 leading-relaxed whitespace-pre-wrap font-mono text-sm bg-gray-50 p-4 rounded-md border border-gray-200 min-h-[100px] w-full">
              {text}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="text-gray-600 text-sm">
                Click "Generate" to create medical transcription
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
