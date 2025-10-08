import React from "react";
import { useLocation } from "wouter";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Checkbox } from "../components/ui/checkbox";
import { Input } from "../components/ui/input";
import { Search, LogOut, User, Activity, Clock, AlertTriangle, CheckCircle, Copy, Brain, Stethoscope, FileText, Users, Heart, TrendingUp, BarChart3, PieChart, LineChart, RefreshCw, Trash2, Eye, Edit, Download, Phone, Calendar, Settings, Bell, Home, Users2, FileText as FileTextIcon, MessageSquare, Database, Zap } from "lucide-react";
import { format } from "date-fns";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  (import.meta as any).env.VITE_SUPABASE_URL || "",
  (import.meta as any).env.VITE_SUPABASE_ANON_KEY || ""
);

export default function DoctorDashboardNew() {
  const [, navigate] = useLocation();
  
  // State management
  const [searchQuery, setSearchQuery] = React.useState("");
  const [searchResults, setSearchResults] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [recentPatients, setRecentPatients] = React.useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = React.useState<string | null>(null);
  const [selectedPatientData, setSelectedPatientData] = React.useState<any>(null);
  const [frenchDoc, setFrenchDoc] = React.useState<any>(null);
  const [generating, setGenerating] = React.useState(false);
  const [copyToast, setCopyToast] = React.useState<string | null>(null);
  const [spruceCases, setSpruceCases] = React.useState<any[]>([]);
  const [loadingSpruce, setLoadingSpruce] = React.useState(false);
  const [reports, setReports] = React.useState<any[]>([]);
  const [loadingReports, setLoadingReports] = React.useState(false);
  const [authLoading, setAuthLoading] = React.useState(false);
  const [copiedSections, setCopiedSections] = React.useState<Set<string>>(new Set());
  const [docHeader, setDocHeader] = React.useState({
    name: "Dr. Carlos Faviel Font",
    specialty: "Médecine Générale",
    avatarUrl: null
  });
  
  // Spruce search state
  const [spruceSearchQuery, setSpruceSearchQuery] = React.useState("");
  const [selectedSpruceConversation, setSelectedSpruceConversation] = React.useState<any>(null);
  
  // Template library state
  const [showTemplateLibrary, setShowTemplateLibrary] = React.useState(false);
  const [selectedDiagnosis, setSelectedDiagnosis] = React.useState<string | null>(null);
  const [templateSearchQuery, setTemplateSearchQuery] = React.useState("");
  const [availableTemplates, setAvailableTemplates] = React.useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = React.useState<any>(null);
  
  // Plan builder state - tracks selected items from templates
  const [selectedPlanItems, setSelectedPlanItems] = React.useState<{
    medications: string[];
    tests: string[];
    referrals: string[];
    lifestyle: string[];
  }>({
    medications: [],
    tests: [],
    referrals: [],
    lifestyle: []
  });
  
  const [customPlanText, setCustomPlanText] = React.useState("");

  // Load initial data
  React.useEffect(() => {
    loadRecentPatients();
    loadSpruceCases();
    loadReports();
  }, []);

  // Load templates when diagnosis is selected
  React.useEffect(() => {
    if (selectedDiagnosis) {
      loadTemplatesForDiagnosis(selectedDiagnosis);
    }
  }, [selectedDiagnosis]);

  const loadRecentPatients = async () => {
    try {
      const { data, error } = await supabase
        .from("consultations")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) {
        console.error("Error loading patients:", error);
        // Set sample data if no real data
        setRecentPatients([
          {
            id: "1",
            patient_id: "P001",
            chief_complaint: "Chest pain",
            created_at: new Date().toISOString(),
            triage_level: "Urgent"
          },
          {
            id: "2", 
            patient_id: "P002",
            chief_complaint: "Headache",
            created_at: new Date().toISOString(),
            triage_level: "Moderate"
          }
        ]);
      } else {
        setRecentPatients(data || []);
      }
    } catch (error) {
      console.error("Error loading patients:", error);
    }
  };

  const loadSpruceCases = async () => {
    setLoadingSpruce(true);
    try {
      const response = await fetch('/api/spruce-conversations-all');
      const data = await response.json();
      setSpruceCases(data || []);
    } catch (error) {
      console.error("Error loading Spruce cases:", error);
      setSpruceCases([]);
    } finally {
      setLoadingSpruce(false);
    }
  };

  const loadReports = async () => {
    setLoadingReports(true);
    try {
      const response = await fetch('/api/file-management');
      const data = await response.json();
      setReports(data || []);
    } catch (error) {
      console.error("Error loading reports:", error);
      setReports([]);
    } finally {
      setLoadingReports(false);
    }
  };

  const searchPatients = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("consultations")
        .select("*")
        .ilike("patient_id", `%${searchQuery}%`)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) {
        console.error("Error searching patients:", error);
      } else {
        setSearchResults(data || []);
      }
    } catch (error) {
      console.error("Error searching patients:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateMedicalReport = async () => {
    if (!selectedPatient) return;
    
    setGenerating(true);
    try {
      const response = await fetch('/api/medical-transcription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: selectedPatient,
          variables: selectedPatientData
        })
      });
      
      const data = await response.json();
      setFrenchDoc(data);
      
      // Save report to Supabase database
      await saveReportToDatabase(selectedPatient, data);
    } catch (error) {
      console.error("Error generating report:", error);
    } finally {
      setGenerating(false);
    }
  };

  const saveReportToDatabase = async (patientId: string, reportData: any) => {
    try {
      const { error } = await supabase
        .from('medical_reports')
        .insert({
          patient_id: patientId,
          report_data: reportData,
          generated_at: new Date().toISOString(),
          report_type: 'comprehensive'
        });
      
      if (error) {
        console.error('Error saving report to database:', error);
      } else {
        console.log('✅ Report saved to database successfully');
      }
    } catch (error) {
      console.error('Error saving report:', error);
    }
  };

  const generateDiagnosisPrediction = async (consultation: any, patientAnswers: any) => {
    try {
      // Get physician's Claude API key
      const response = await fetch("/api/doctor/credentials");
      if (!response.ok) return null;
      
      const credentials = await response.json();
      if (!credentials.claude_api_key) return null;

      // Generate diagnosis prediction
      const diagnosisResponse = await fetch("/api/ai-diagnosis-prediction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hpi_summary: consultation.hpi_summary || consultation.chief_complaint,
          patient_answers: patientAnswers,
          api_key: credentials.claude_api_key,
        }),
      });

      const diagnosisData = await diagnosisResponse.json();
      if (!diagnosisData.success) return null;

      // Save diagnosis to consultation
      await supabase
        .from("consultations")
        .update({
          ai_diagnosis: diagnosisData.diagnoses,
          ai_diagnosis_generated_at: new Date().toISOString(),
        })
        .eq("id", consultation.id);

      return diagnosisData.diagnoses;
    } catch (error) {
      console.error("Error generating diagnosis:", error);
      return null;
    }
  };

  const loadTemplatesForDiagnosis = async (diagnosis: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("diagnostic_templates")
        .select("*")
        .or(`diagnosis_name.ilike.%${diagnosis}%,is_shared.eq.true`)
        .eq("physician_id", user.id);

      if (error) throw error;
      setAvailableTemplates(data || []);
    } catch (error) {
      console.error("Error loading templates:", error);
      setAvailableTemplates([]);
    }
  };

  const applyTemplate = (template: any) => {
    setSelectedTemplate(template);
    // Initialize all plan items as unselected
    if (template.plan_items) {
      setSelectedPlanItems({
        medications: [],
        tests: [],
        referrals: [],
        lifestyle: [],
      });
    }
  };

  const togglePlanItem = (category: string, item: string) => {
    setSelectedPlanItems((prev) => {
      const categoryItems = prev[category as keyof typeof prev] || [];
      const isSelected = categoryItems.includes(item);
      
      return {
        ...prev,
        [category]: isSelected
          ? categoryItems.filter((i) => i !== item)
          : [...categoryItems, item],
      };
    });
  };

  const openPatientDetails = async (patientId: string) => {
    setSelectedPatient(patientId);
    try {
      // Fetch patient answers
      const { data: patientAnswers, error: answersError } = await supabase
        .from("patient_answers")
        .select("*")
        .eq("patient_id", patientId)
        .single();

      // Fetch consultation data
      const { data: consultation, error: consultationError } = await supabase
        .from("consultations")
        .select("*")
        .eq("patient_id", patientId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      // Fetch any existing medical reports
      const { data: reports, error: reportsError } = await supabase
        .from("medical_reports")
        .select("*")
        .eq("patient_id", patientId)
        .order("generated_at", { ascending: false })
        .limit(1);

      if (answersError) {
        console.error("Error loading patient answers:", answersError);
      }

      // Generate AI diagnosis if not already done
      if (consultation && !consultation.ai_diagnosis) {
        const diagnoses = await generateDiagnosisPrediction(consultation, patientAnswers);
        if (diagnoses && consultation) {
          consultation.ai_diagnosis = diagnoses;
        }
      }

      // Combine all patient data
      const combinedData = {
        ...patientAnswers,
        consultation: consultation || null,
        lastReport: reports && reports.length > 0 ? reports[0] : null
      };

      setSelectedPatientData(combinedData);
      
      // If there's a saved report, load it automatically
      if (reports && reports.length > 0 && reports[0].report_data) {
        setFrenchDoc(reports[0].report_data);
      }
    } catch (error) {
      console.error("Error loading patient data:", error);
    }
  };

  const copyToClipboard = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopyToast("Copied to clipboard!");
    setTimeout(() => setCopyToast(null), 2000);
    
    setCopiedSections(prev => new Set([...prev, section]));
  };

  const calculateSavings = () => {
    const totalCopies = copiedSections.size;
    const timeSavedPerCopy = 2;
    const totalTimeSaved = totalCopies * timeSavedPerCopy;
    const hourlyRate = 150;
    const moneySaved = (totalTimeSaved / 60) * hourlyRate;
    
    return {
      totalCopies,
      totalTimeSaved,
      moneySaved: Math.round(moneySaved)
    };
  };

  const handleLogout = () => {
    navigate("/doctor-login");
  };

  const handleDeleteReport = async (filename: string) => {
    if (!confirm(`Delete report ${filename}?`)) return;
    
    try {
      const response = await fetch('/api/file-management/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename })
      });
      
      if (response.ok) {
        // Reload reports after deletion
        loadReports();
      } else {
        alert('Failed to delete report');
      }
    } catch (error) {
      console.error('Error deleting report:', error);
      alert('Error deleting report');
    }
  };

  const handleDeleteAllReports = async () => {
    if (!confirm('Delete ALL reports? This cannot be undone!')) return;
    
    try {
      const response = await fetch('/api/file-management/cleanup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        // Reload reports after cleanup
        loadReports();
      } else {
        alert('Failed to delete reports');
      }
    } catch (error) {
      console.error('Error deleting reports:', error);
      alert('Error deleting reports');
    }
  };

  const handleEditPatient = (patientId: string) => {
    // Open patient details in edit mode
    setSelectedPatient(patientId);
    openPatientDetails(patientId);
    // Could navigate to a dedicated edit page if needed
    // navigate(`/patients/${patientId}/edit`);
  };

  // Common diagnosis templates
  const diagnosisTemplates = [
    { id: "back-pain", name: "Acute Low Back Pain", category: "acute" },
    { id: "bronchitis", name: "Bronchitis", category: "acute" },
    { id: "asthma", name: "Asthma", category: "chronic" },
    { id: "copd", name: "COPD", category: "chronic" },
    { id: "herpes-zoster", name: "Herpes Zoster (Shingles)", category: "acute" },
    { id: "oral-herpes", name: "Oral Herpes", category: "acute" },
    { id: "uti", name: "Urinary Tract Infection", category: "acute" },
    { id: "pharyngitis", name: "Pharyngitis (Strep throat)", category: "acute" },
    { id: "pneumonia", name: "Pneumonia", category: "acute" },
    { id: "influenza", name: "Influenza", category: "acute" },
    { id: "anxiety", name: "Anxiety", category: "mental" },
    { id: "depression", name: "Depression", category: "mental" },
    { id: "adhd", name: "ADHD in Adults", category: "mental" },
    { id: "hypertension", name: "Hypertension", category: "chronic" },
    { id: "diabetes", name: "Diabetes Type 2", category: "chronic" },
    { id: "gerd", name: "GERD", category: "chronic" },
    { id: "migraine", name: "Migraine Headache", category: "chronic" },
    { id: "tension-headache", name: "Tension Headache", category: "acute" },
    { id: "eczema", name: "Eczema", category: "chronic" },
    { id: "conjunctivitis", name: "Conjunctivitis", category: "acute" },
  ];

  const handleUseTemplate = (templateId: string) => {
    setSelectedDiagnosis(templateId);
    setShowTemplateLibrary(true);
  };
  
  const buildPlanFromSelections = () => {
    let plan = "";
    
    if (selectedPlanItems.medications.length > 0) {
      plan += "Rx: " + selectedPlanItems.medications.join(", ") + ". ";
    }
    
    if (selectedPlanItems.tests.length > 0) {
      plan += "Labs: " + selectedPlanItems.tests.join(", ") + ". ";
    }
    
    if (selectedPlanItems.referrals.length > 0) {
      plan += "Ref: " + selectedPlanItems.referrals.join(", ") + ". ";
    }
    
    if (selectedPlanItems.lifestyle.length > 0) {
      plan += "Lifestyle: " + selectedPlanItems.lifestyle.join(", ") + ". ";
    }
    
    if (customPlanText) {
      plan += customPlanText;
    }
    
    return plan;
  };
  
  const applyPlanToSAP = () => {
    const builtPlan = buildPlanFromSelections();
    
    if (frenchDoc && frenchDoc.superSpartanSAP) {
      // Update the P: section in the SAP note
      const sapLines = frenchDoc.superSpartanSAP.split('\n');
      const updatedSap = sapLines.map(line => {
        if (line.trim().startsWith('P:')) {
          return `P: ${builtPlan}`;
        }
        return line;
      }).join('\n');
      
      setFrenchDoc({
        ...frenchDoc,
        superSpartanSAP: updatedSap
      });
    }
  };

  const filteredTemplates = templateSearchQuery
    ? diagnosisTemplates.filter(t => 
        t.name.toLowerCase().includes(templateSearchQuery.toLowerCase())
      )
    : diagnosisTemplates;

  // Get template options based on diagnosis and category
  const getTemplateOptions = (diagnosisId: string, category: string): string[] => {
    const templates: Record<string, Record<string, string[]>> = {
      "back-pain": {
        medication: [
          "Ibuprofen 400mg PO TID",
          "Naproxen 500mg PO BID",
          "Acetaminophen 1000mg PO QID PRN",
          "Cyclobenzaprine 10mg PO QHS",
          "Methocarbamol 500mg PO QID"
        ],
        testing: [
          "X-ray lumbar spine",
          "MRI lumbar spine without contrast",
          "CBC if fever",
          "ESR/CRP if inflammatory concern"
        ],
        referral: [
          "Physical therapy",
          "Orthopedics",
          "Pain management",
          "Chiropractor"
        ],
        lifestyle: [
          "Heat/ice therapy 20min",
          "Gentle stretching",
          "Avoid heavy lifting",
          "Activity modification"
        ]
      },
      "bronchitis": {
        medication: [
          "Dextromethorphan 20mg PO Q6H PRN",
          "Guaifenesin 400mg PO Q4H",
          "Ibuprofen 400mg PO TID PRN",
          "Salbutamol inhaler 2 puffs Q4H PRN",
          "Azithromycin 500mg day 1, then 250mg x4 days"
        ],
        testing: [
          "Chest X-ray",
          "Pulse oximetry",
          "Sputum culture if productive"
        ],
        referral: [
          "Pulmonology if chronic",
          "Emergency if severe dyspnea"
        ],
        lifestyle: [
          "Increase fluid intake 2-3L/day",
          "Rest",
          "Humidifier use",
          "Avoid irritants/smoking"
        ]
      },
      "asthma": {
        medication: [
          "Salbutamol inhaler 2 puffs Q4H PRN",
          "Fluticasone 250mcg inhaler 2 puffs BID",
          "Montelukast 10mg PO QHS",
          "Prednisone 50mg PO daily x5 days"
        ],
        testing: [
          "Spirometry",
          "Peak flow measurement",
          "Chest X-ray",
          "Allergy testing"
        ],
        referral: [
          "Pulmonology",
          "Allergy/Immunology",
          "Asthma educator"
        ],
        lifestyle: [
          "Identify and avoid triggers",
          "Daily peak flow monitoring",
          "Action plan education",
          "Smoking cessation"
        ]
      },
      "copd": {
        medication: [
          "Tiotropium 18mcg inhaler daily",
          "Salbutamol/Ipratropium 2 puffs QID",
          "Fluticasone/Salmeterol 250/50 2 puffs BID",
          "Prednisone 40mg PO daily x5 days (exacerbation)",
          "Azithromycin 500mg PO daily x5 days"
        ],
        testing: [
          "Spirometry",
          "Chest X-ray",
          "CBC",
          "Oxygen saturation",
          "ABG if severe"
        ],
        referral: [
          "Pulmonology",
          "Respiratory therapy",
          "Smoking cessation program",
          "Pulmonary rehabilitation"
        ],
        lifestyle: [
          "Smoking cessation",
          "Breathing exercises",
          "Oxygen therapy if indicated",
          "Vaccination (flu, pneumonia)"
        ]
      },
      "herpes-zoster": {
        medication: [
          "Valacyclovir 1000mg PO TID x7 days",
          "Gabapentin 300mg PO TID",
          "Acetaminophen 1000mg PO QID PRN",
          "Lidocaine 5% topical patch"
        ],
        testing: [
          "Clinical diagnosis (usually sufficient)",
          "Tzanck smear if uncertain",
          "PCR testing if immunocompromised"
        ],
        referral: [
          "Ophthalmology if eye involvement",
          "Pain management if severe",
          "Infectious disease if immunocompromised"
        ],
        lifestyle: [
          "Avoid scratching",
          "Keep lesions covered",
          "Avoid contact with pregnant women",
          "Cool compresses for comfort"
        ]
      },
      "oral-herpes": {
        medication: [
          "Valacyclovir 2000mg PO BID x1 day",
          "Acyclovir 400mg PO TID x5 days",
          "Docosanol 10% cream topical 5x/day",
          "Benzocaine gel PRN for pain"
        ],
        testing: ["Usually clinical diagnosis"],
        referral: ["Dermatology if recurrent/severe"],
        lifestyle: [
          "Avoid kissing/sharing utensils",
          "Sun protection (SPF lip balm)",
          "Stress management",
          "Lysine supplementation 1000mg daily"
        ]
      },
      "pharyngitis": {
        medication: [
          "Amoxicillin 500mg PO TID x10 days",
          "Penicillin V 500mg PO QID x10 days",
          "Azithromycin 500mg day 1, 250mg x4 days",
          "Acetaminophen 1000mg PO QID PRN",
          "Ibuprofen 400mg PO TID PRN"
        ],
        testing: [
          "Rapid strep test",
          "Throat culture",
          "Monospot test if suspected mono"
        ],
        referral: ["ENT if recurrent/chronic"],
        lifestyle: [
          "Warm salt water gargles",
          "Increase fluids",
          "Rest",
          "Avoid irritants"
        ]
      },
      "uti": {
        medication: [
          "Nitrofurantoin 100mg PO BID x5 days",
          "Trimethoprim-sulfamethoxazole DS PO BID x3 days",
          "Ciprofloxacin 250mg PO BID x3 days",
          "Phenazopyridine 200mg PO TID x2 days"
        ],
        testing: [
          "Urinalysis",
          "Urine culture",
          "Urine pregnancy test if applicable"
        ],
        referral: [
          "Urology if recurrent",
          "Nephrology if complicated"
        ],
        lifestyle: [
          "Increase fluid intake 2-3L/day",
          "Cranberry supplementation",
          "Void after intercourse",
          "Avoid irritants (caffeine, alcohol)"
        ]
      }
    };

    return templates[diagnosisId]?.[category] || [];
  };

  // Filter Spruce conversations based on search
  const filteredSpruceCases = spruceSearchQuery
    ? spruceCases.filter((conv) =>
        (conv.patient_name || `Conversation ${conv.id}`).toLowerCase().includes(spruceSearchQuery.toLowerCase())
      )
    : spruceCases;

  return (
    <div className="min-h-screen bg-gray-950 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 border-r border-gray-800">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Stethoscope className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-white">InstantHPI</h1>
              <p className="text-sm text-gray-400">Medical Platform</p>
            </div>
          </div>

          <nav className="space-y-2">
            <button onClick={() => navigate("/doctor-dashboard")} className="flex items-center gap-3 px-3 py-2 bg-blue-600 text-white rounded-lg w-full text-left">
              <Home className="w-5 h-5" />
              Dashboard
            </button>
            <button onClick={() => navigate("/patients")} className="flex items-center gap-3 px-3 py-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg w-full text-left">
              <Users2 className="w-5 h-5" />
              Patients
            </button>
            <button onClick={() => navigate("/documents")} className="flex items-center gap-3 px-3 py-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg w-full text-left">
              <FileTextIcon className="w-5 h-5" />
              Reports
            </button>
            <button onClick={() => navigate("/messages")} className="flex items-center gap-3 px-3 py-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg w-full text-left">
              <MessageSquare className="w-5 h-5" />
              Messages
            </button>
            <button onClick={() => navigate("/ai-billing")} className="flex items-center gap-3 px-3 py-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg w-full text-left">
              <Database className="w-5 h-5" />
              Analytics
            </button>
            <button onClick={() => navigate("/doctor-profile")} className="flex items-center gap-3 px-3 py-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg w-full text-left">
              <Settings className="w-5 h-5" />
              Settings
            </button>
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 bg-gray-950">
        <div className="p-6">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">IH</span>
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-white">Medical Dashboard</h1>
                <p className="text-gray-400">Patient management and medical transcription</p>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">Active Patients</span>
                <span className="text-sm font-medium text-white">12</span>
              </div>
              <div className="flex-1 bg-gray-800 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '75%' }}></div>
              </div>
              <span className="text-sm text-gray-400">75%</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left Column - Search and Spruce (3/4 width) */}
            <div className="lg:col-span-3 space-y-6">
              {/* Patient Search */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Search className="w-5 h-5" />
                    Search Patients
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Enter patient ID..."
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                    <Button
                      onClick={searchPatients}
                      disabled={loading}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {loading ? <Activity className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    </Button>
                  </div>
                  
                  {searchResults.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {searchResults.map((patient) => (
                        <div
                          key={patient.id}
                          onClick={() => openPatientDetails(patient.patient_id)}
                          className="p-3 bg-gray-700 rounded-lg hover:bg-gray-600 cursor-pointer"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold text-white">{patient.patient_id}</p>
                              <p className="text-sm text-gray-400">
                                {patient.chief_complaint}
                                {patient.ai_diagnosis && patient.ai_diagnosis.length > 0 && (
                                  <span className="ml-2 text-purple-300">
                                    → {patient.ai_diagnosis[0].diagnosis} ({patient.ai_diagnosis[0].confidence}%)
                                  </span>
                                )}
                              </p>
                            </div>
                            <Badge className="bg-blue-600 text-white">
                              {patient.triage_level}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Spruce Integration */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white text-lg flex items-center gap-2">
                    <Phone className="w-5 h-5 text-blue-500" />
                    Spruce Integration
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Spruce Search */}
                  <div className="mb-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        type="text"
                        placeholder="Search conversations..."
                        value={spruceSearchQuery}
                        onChange={(e) => setSpruceSearchQuery(e.target.value)}
                        className="pl-9 bg-gray-700 border-gray-600 text-white"
                      />
                    </div>
                  </div>

                  {loadingSpruce ? (
                    <div className="text-center py-8">
                      <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4 animate-spin" />
                      <p className="text-gray-400">Loading Spruce cases...</p>
                    </div>
                  ) : filteredSpruceCases.length === 0 ? (
                    <div className="text-center py-8">
                      <Phone className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-400">No Spruce conversations found</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredSpruceCases.slice(0, 5).map((conversation) => (
                        <div
                          key={conversation.id}
                          onClick={() => setSelectedSpruceConversation(conversation)}
                          className={`p-3 rounded-lg transition-colors cursor-pointer ${
                            selectedSpruceConversation?.id === conversation.id
                              ? 'bg-blue-600 hover:bg-blue-700'
                              : 'bg-gray-700 hover:bg-gray-600'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                                <Phone className="w-4 h-4 text-white" />
                              </div>
                              <div>
                                <p className="font-semibold text-white text-sm">
                                  {conversation.patient_name || `Conversation ${conversation.id}`}
                                </p>
                                <p className="text-gray-400 text-xs">
                                  {conversation.last_message || 'No messages yet'}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-gray-400 text-xs">
                                {conversation.updated_at ? 
                                  format(new Date(conversation.updated_at), 'MMM d, HH:mm') : 
                                  'Unknown time'
                                }
                              </p>
                              <div className="flex items-center gap-1 mt-1">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <span className="text-green-400 text-xs">Active</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Diagnosis Templates */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white text-lg flex items-center gap-2">
                    <Zap className="w-5 h-5 text-yellow-500" />
                    Quick Diagnosis Templates
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Pre-built protocols for common conditions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Template Search */}
                  <div className="mb-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        type="text"
                        placeholder="Search diagnoses..."
                        value={templateSearchQuery}
                        onChange={(e) => setTemplateSearchQuery(e.target.value)}
                        className="pl-9 bg-gray-700 border-gray-600 text-white"
                      />
                    </div>
                  </div>

                  {/* Template Categories */}
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {filteredTemplates.map((template) => {
                      const categoryColors = {
                        acute: "bg-red-900/20 border-red-500/30 hover:bg-red-900/30",
                        chronic: "bg-blue-900/20 border-blue-500/30 hover:bg-blue-900/30",
                        mental: "bg-purple-900/20 border-purple-500/30 hover:bg-purple-900/30"
                      };
                      
                      return (
                        <div
                          key={template.id}
                          onClick={() => handleUseTemplate(template.id)}
                          className={`p-3 rounded-lg cursor-pointer transition-all ${categoryColors[template.category as keyof typeof categoryColors]}`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Stethoscope className="w-4 h-4 text-gray-300" />
                              <span className="text-white text-sm font-medium">{template.name}</span>
                            </div>
                            <Badge className={
                              template.category === 'acute' ? 'bg-red-600' :
                              template.category === 'chronic' ? 'bg-blue-600' :
                              'bg-purple-600'
                            }>
                              {template.category}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  <Button
                    onClick={() => navigate("/knowledge-base")}
                    className="w-full mt-4 bg-yellow-600 hover:bg-yellow-700"
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    View All Templates
                  </Button>
                </CardContent>
              </Card>

              {/* Template Detail Builder */}
              {showTemplateLibrary && selectedDiagnosis && (
                <Card className="bg-gray-800 border-gray-700 border-2 border-yellow-500">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-white text-lg flex items-center gap-2">
                        <Brain className="w-5 h-5 text-yellow-500" />
                        Plan Builder: {diagnosisTemplates.find(d => d.id === selectedDiagnosis)?.name}
                      </CardTitle>
                      <Button
                        onClick={() => setShowTemplateLibrary(false)}
                        size="sm"
                        variant="ghost"
                        className="text-gray-400"
                      >
                        ✕
                      </Button>
                    </div>
                    <CardDescription className="text-gray-400">
                      Click items to add to your SAP Plan section
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Medications */}
                      <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-3">
                        <h4 className="text-green-300 font-semibold mb-2 flex items-center gap-2">
                          <Heart className="w-4 h-4" />
                          Medications
                        </h4>
                        <div className="space-y-1">
                          {getTemplateOptions(selectedDiagnosis, 'medication').map((med) => (
                            <label key={med} className="flex items-center gap-2 text-sm text-green-200 cursor-pointer hover:bg-green-900/30 p-1 rounded">
                              <input
                                type="checkbox"
                                checked={selectedPlanItems.medications.includes(med)}
                                onChange={() => togglePlanItem('medications', med)}
                                className="w-4 h-4"
                              />
                              <span>{med}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Tests/Labs */}
                      <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3">
                        <h4 className="text-blue-300 font-semibold mb-2 flex items-center gap-2">
                          <Activity className="w-4 h-4" />
                          Tests & Labs
                        </h4>
                        <div className="space-y-1">
                          {getTemplateOptions(selectedDiagnosis, 'testing').map((test) => (
                            <label key={test} className="flex items-center gap-2 text-sm text-blue-200 cursor-pointer hover:bg-blue-900/30 p-1 rounded">
                              <input
                                type="checkbox"
                                checked={selectedPlanItems.tests.includes(test)}
                                onChange={() => togglePlanItem('tests', test)}
                                className="w-4 h-4"
                              />
                              <span>{test}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Referrals */}
                      <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-3">
                        <h4 className="text-purple-300 font-semibold mb-2 flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          Referrals
                        </h4>
                        <div className="space-y-1">
                          {getTemplateOptions(selectedDiagnosis, 'referral').map((ref) => (
                            <label key={ref} className="flex items-center gap-2 text-sm text-purple-200 cursor-pointer hover:bg-purple-900/30 p-1 rounded">
                              <input
                                type="checkbox"
                                checked={selectedPlanItems.referrals.includes(ref)}
                                onChange={() => togglePlanItem('referrals', ref)}
                                className="w-4 h-4"
                              />
                              <span>{ref}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Lifestyle */}
                      <div className="bg-orange-900/20 border border-orange-500/30 rounded-lg p-3">
                        <h4 className="text-orange-300 font-semibold mb-2 flex items-center gap-2">
                          <Heart className="w-4 h-4" />
                          Lifestyle & Counseling
                        </h4>
                        <div className="space-y-1">
                          {getTemplateOptions(selectedDiagnosis, 'lifestyle').map((item) => (
                            <label key={item} className="flex items-center gap-2 text-sm text-orange-200 cursor-pointer hover:bg-orange-900/30 p-1 rounded">
                              <input
                                type="checkbox"
                                checked={selectedPlanItems.lifestyle.includes(item)}
                                onChange={() => togglePlanItem('lifestyle', item)}
                                className="w-4 h-4"
                              />
                              <span>{item}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Plan Preview */}
                      <div className="bg-gray-700 border border-gray-600 rounded-lg p-3">
                        <h4 className="text-gray-300 font-semibold mb-2">📝 Plan Preview:</h4>
                        <p className="text-gray-400 text-sm whitespace-pre-wrap">
                          {buildPlanFromSelections() || "Select items above to build your plan..."}
                        </p>
                      </div>

                      {/* Apply Button */}
                      <Button
                        onClick={applyPlanToSAP}
                        className="w-full bg-yellow-600 hover:bg-yellow-700"
                        disabled={!frenchDoc}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Apply to SAP Plan Section
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* File Management */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white text-lg flex items-center gap-2">
                      <FileText className="w-5 h-5 text-green-500" />
                      File Management
                    </CardTitle>
                    <div className="flex gap-2">
                      <Button
                        onClick={loadReports}
                        disabled={loadingReports}
                        size="sm"
                        variant="outline"
                        className="text-gray-300 border-gray-600 hover:bg-gray-700"
                      >
                        {loadingReports ? (
                          <Activity className="w-4 h-4 animate-spin" />
                        ) : (
                          <RefreshCw className="w-4 h-4" />
                        )}
                      </Button>
                      {reports.length > 0 && (
                      <Button
                        onClick={handleDeleteAllReports}
                        size="sm"
                        variant="outline"
                        className="text-red-300 border-red-600 hover:bg-red-900/20"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Clean All
                      </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {loadingReports ? (
                    <div className="text-center py-8">
                      <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4 animate-spin" />
                      <p className="text-gray-400">Loading reports...</p>
                    </div>
                  ) : reports.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-400">No reports found</p>
                      <p className="text-gray-500 text-sm">Generate medical reports to see them here</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {reports.map((report) => (
                        <div
                          key={report.filename}
                          className="p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                                <FileText className="w-4 h-4 text-white" />
                              </div>
                              <div>
                                <p className="font-semibold text-white text-sm">
                                  {report.filename}
                                </p>
                                <p className="text-gray-400 text-xs">
                                  Created: {new Date(report.created).toLocaleDateString()} • Size: {report.size}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                onClick={() => window.open(report.url, '_blank')}
                                size="sm"
                                variant="outline"
                                className="text-blue-300 border-blue-600 hover:bg-blue-900/20"
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                View
                              </Button>
                              <Button
                                onClick={() => handleDeleteReport(report.filename)}
                                size="sm"
                                variant="outline"
                                className="text-red-300 border-red-600 hover:bg-red-900/20"
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

            {/* Right Column - Recent Consultations and Medical Report (1/4 width) */}
            <div className="space-y-6">
              {/* Recent Consultations */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Recent Consultations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recentPatients.map((patient) => (
                      <EnhancedPatientCard
                        key={patient.id}
                        patient={patient}
                        onView={() => openPatientDetails(patient.patient_id)}
                        onEdit={() => handleEditPatient(patient.id)}
                        onGenerateReport={() => {
                          openPatientDetails(patient.patient_id);
                          generateMedicalReport();
                        }}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Patient Details & Medical Report Generation */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white text-lg flex items-center gap-2">
                    <Brain className="w-5 h-5 text-purple-500" />
                    Patient Details & Medical Report
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Complete patient information and AI-powered documentation
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {selectedPatient ? (
                    <div className="space-y-4">
                      {/* Patient Identifier */}
                      <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3">
                        <p className="text-blue-300 text-sm">
                          <strong>Patient ID:</strong> {selectedPatient}
                        </p>
                      </div>

                      {/* Patient Data Display */}
                      {selectedPatientData && (
                        <div className="space-y-3">
                          {/* Initial HPI Confirmation Summary */}
                          {selectedPatientData.consultation?.hpi_summary && (
                            <div className="bg-cyan-900/20 border border-cyan-500/30 rounded-lg p-3">
                              <h4 className="text-cyan-300 text-sm font-semibold mb-2">📋 Initial HPI Summary:</h4>
                              <p className="text-cyan-200 text-xs whitespace-pre-wrap">
                                {selectedPatientData.consultation.hpi_summary}
                              </p>
                            </div>
                          )}

                          {/* 10 Follow-Up Questions & Answers */}
                          {selectedPatientData.answers && Object.keys(selectedPatientData.answers).length > 0 && (
                            <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-3 max-h-60 overflow-y-auto">
                              <h4 className="text-green-300 text-sm font-semibold mb-2">❓ Follow-Up Questions & Answers:</h4>
                              <div className="space-y-2">
                                {Object.entries(selectedPatientData.answers).map(([index, answer]) => (
                                  <div key={index} className="text-xs">
                                    <p className="text-green-300 font-medium">Q{parseInt(index) + 1}:</p>
                                    <p className="text-green-200 ml-3">{String(answer)}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Enhanced HPI for Physician */}
                          {(selectedPatientData.doctor_hpi_summary || selectedPatientData.enhanced_soap_note) && (
                            <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-3">
                              <h4 className="text-purple-300 text-sm font-semibold mb-2">🩺 Enhanced HPI Summary:</h4>
                              <p className="text-purple-200 text-xs whitespace-pre-wrap">
                                {selectedPatientData.doctor_hpi_summary || selectedPatientData.enhanced_soap_note}
                              </p>
                            </div>
                          )}

                          {/* Original Form Data */}
                          {selectedPatientData.consultation?.form_data && (
                            <div className="bg-gray-700 border border-gray-600 rounded-lg p-3 max-h-40 overflow-y-auto">
                              <h4 className="text-gray-300 text-sm font-semibold mb-2">📝 Form Data:</h4>
                              <div className="text-xs text-gray-400 space-y-1">
                                {Object.entries(selectedPatientData.consultation.form_data).map(([key, value]) => (
                                  <div key={key}>
                                    <strong>{key}:</strong> {String(value)}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Generate Report Button */}
                      <Button
                        onClick={generateMedicalReport}
                        disabled={generating}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                      >
                        {generating ? (
                          <>
                            <Activity className="w-4 h-4 mr-2 animate-spin" />
                            Generating 12-Section Report...
                          </>
                        ) : (
                          <>
                            <Brain className="w-4 h-4 mr-2" />
                            Generate Complete Medical Report
                          </>
                        )}
                      </Button>

                      {/* Template Selection Button */}
                      {selectedPatientData?.consultation?.ai_diagnosis && 
                       selectedPatientData.consultation.ai_diagnosis.length > 0 && (
                        <Dialog open={showTemplateLibrary} onOpenChange={setShowTemplateLibrary}>
                          <DialogTrigger asChild>
                            <Button
                              onClick={() => {
                                setSelectedDiagnosis(selectedPatientData.consultation.ai_diagnosis[0].diagnosis);
                                setShowTemplateLibrary(true);
                              }}
                              variant="outline"
                              className="w-full border-purple-600 text-purple-600 hover:bg-purple-50"
                            >
                              <FileText className="w-4 h-4 mr-2" />
                              Select Plan Template
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Select Treatment Plan Template</DialogTitle>
                              <DialogDescription>
                                Choose a template for {selectedDiagnosis} and customize the plan items
                              </DialogDescription>
                            </DialogHeader>

                            {/* Templates List */}
                            <div className="space-y-4 mt-4">
                              {availableTemplates.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                  <p>No templates found for this diagnosis.</p>
                                  <p className="text-sm mt-2">
                                    Create one in your <a href="/doctor-profile" className="text-purple-600 underline">Profile Settings</a>
                                  </p>
                                </div>
                              ) : (
                                availableTemplates.map((template) => (
                                  <Card
                                    key={template.id}
                                    className={`cursor-pointer transition-all ${
                                      selectedTemplate?.id === template.id
                                        ? "ring-2 ring-purple-600 bg-purple-50"
                                        : "hover:bg-gray-50"
                                    }`}
                                    onClick={() => applyTemplate(template)}
                                  >
                                    <CardContent className="p-4">
                                      <div className="flex justify-between items-start mb-2">
                                        <div>
                                          <h4 className="font-semibold">{template.template_name}</h4>
                                          <p className="text-sm text-gray-600">
                                            {template.diagnosis_name} • {template.plan_items?.length || 0} items
                                          </p>
                                        </div>
                                        {selectedTemplate?.id === template.id && (
                                          <CheckCircle className="w-5 h-5 text-purple-600" />
                                        )}
                                      </div>

                                      {/* Plan Items with Checkboxes */}
                                      {selectedTemplate?.id === template.id && template.plan_items && (
                                        <div className="mt-4 space-y-2 border-t pt-4">
                                          <p className="text-sm font-medium mb-2">Select items to include:</p>
                                          {template.plan_items.map((item: any, idx: number) => {
                                            const category = item.category?.toLowerCase() || "other";
                                            const isSelected = selectedPlanItems[category as keyof typeof selectedPlanItems]?.includes(item.item) || false;
                                            
                                            return (
                                              <div key={idx} className="flex items-start gap-2 p-2 hover:bg-gray-50 rounded">
                                                <Checkbox
                                                  checked={isSelected}
                                                  onCheckedChange={() => togglePlanItem(category, item.item)}
                                                  id={`item-${idx}`}
                                                />
                                                <label htmlFor={`item-${idx}`} className="flex-1 text-sm cursor-pointer">
                                                  <span className="font-medium text-purple-600">{item.category}:</span>{" "}
                                                  {item.item}
                                                  {item.details && (
                                                    <div className="text-xs text-gray-600 mt-1">{item.details}</div>
                                                  )}
                                                </label>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      )}
                                    </CardContent>
                                  </Card>
                                ))
                              )}
                            </div>

                            {/* Apply Button */}
                            {selectedTemplate && (
                              <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    setShowTemplateLibrary(false);
                                    setSelectedTemplate(null);
                                  }}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  onClick={() => {
                                    setShowTemplateLibrary(false);
                                    // The selected plan items are now available for use in report generation
                                    console.log("Selected plan items:", selectedPlanItems);
                                  }}
                                  className="bg-purple-600 hover:bg-purple-700"
                                >
                                  Apply Template
                                </Button>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-400">Select a patient to view details and generate report</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Medical Report Sections */}
              {frenchDoc && (
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white text-lg flex items-center gap-2">
                      <FileText className="w-5 h-5 text-green-500" />
                      Medical Report
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <MedicalSection
                        title="HPI Summary"
                        content={frenchDoc.hpiSummary}
                        onCopy={() => copyToClipboard(frenchDoc.hpiSummary || "", "hpiSummary")}
                        icon={<FileText className="w-4 h-4" />}
                        color="blue"
                        copyCount={copiedSections.has("hpiSummary") ? 1 : 0}
                      />
                      <MedicalSection
                        title="Super Spartan SAP"
                        content={frenchDoc.superSpartanSAP}
                        onCopy={() => copyToClipboard(frenchDoc.superSpartanSAP || "", "superSpartanSAP")}
                        icon={<Stethoscope className="w-4 h-4" />}
                        color="green"
                        copyCount={copiedSections.has("superSpartanSAP") ? 1 : 0}
                      />
                      <MedicalSection
                        title="Medications Ready to Use"
                        content={frenchDoc.medicationsReadyToUse}
                        onCopy={() => copyToClipboard(frenchDoc.medicationsReadyToUse || "", "medicationsReadyToUse")}
                        icon={<Heart className="w-4 h-4" />}
                        color="purple"
                        copyCount={copiedSections.has("medicationsReadyToUse") ? 1 : 0}
                      />
                      <MedicalSection
                        title="Lab Works"
                        content={frenchDoc.labWorks}
                        onCopy={() => copyToClipboard(frenchDoc.labWorks || "", "labWorks")}
                        icon={<Activity className="w-4 h-4" />}
                        color="orange"
                        copyCount={copiedSections.has("labWorks") ? 1 : 0}
                      />
                      <MedicalSection
                        title="Imagerie Médicale"
                        content={frenchDoc.imagerieMedicale}
                        onCopy={() => copyToClipboard(frenchDoc.imagerieMedicale || "", "imagerieMedicale")}
                        icon={<AlertTriangle className="w-4 h-4" />}
                        color="red"
                        copyCount={copiedSections.has("imagerieMedicale") ? 1 : 0}
                      />
                      <MedicalSection
                        title="Référence Spécialistes"
                        content={frenchDoc.referenceSpecialistes}
                        onCopy={() => copyToClipboard(frenchDoc.referenceSpecialistes || "", "referenceSpecialistes")}
                        icon={<Users className="w-4 h-4" />}
                        color="cyan"
                        copyCount={copiedSections.has("referenceSpecialistes") ? 1 : 0}
                      />
                      <MedicalSection
                        title="Questions de Suivi"
                        content={frenchDoc.followUpQuestions}
                        onCopy={() => copyToClipboard(frenchDoc.followUpQuestions || "", "followUpQuestions")}
                        icon={<MessageSquare className="w-4 h-4" />}
                        color="blue"
                        copyCount={copiedSections.has("followUpQuestions") ? 1 : 0}
                      />
                      <MedicalSection
                        title="Certificat d'Arrêt de Travail"
                        content={frenchDoc.workLeaveCertificate}
                        onCopy={() => copyToClipboard(frenchDoc.workLeaveCertificate || "", "workLeaveCertificate")}
                        icon={<FileText className="w-4 h-4" />}
                        color="orange"
                        copyCount={copiedSections.has("workLeaveCertificate") ? 1 : 0}
                      />
                      <MedicalSection
                        title="Modifications au Travail"
                        content={frenchDoc.workplaceModifications}
                        onCopy={() => copyToClipboard(frenchDoc.workplaceModifications || "", "workplaceModifications")}
                        icon={<Settings className="w-4 h-4" />}
                        color="purple"
                        copyCount={copiedSections.has("workplaceModifications") ? 1 : 0}
                      />
                      <MedicalSection
                        title="Documentation Assurance"
                        content={frenchDoc.insuranceDocumentation}
                        onCopy={() => copyToClipboard(frenchDoc.insuranceDocumentation || "", "insuranceDocumentation")}
                        icon={<FileText className="w-4 h-4" />}
                        color="green"
                        copyCount={copiedSections.has("insuranceDocumentation") ? 1 : 0}
                      />
                      <MedicalSection
                        title="Télémédecine vs En Personne"
                        content={frenchDoc.telemedicineNeedsInPerson}
                        onCopy={() => copyToClipboard(frenchDoc.telemedicineNeedsInPerson || "", "telemedicineNeedsInPerson")}
                        icon={<AlertTriangle className="w-4 h-4" />}
                        color="red"
                        copyCount={copiedSections.has("telemedicineNeedsInPerson") ? 1 : 0}
                      />
                      <MedicalSection
                        title="Message au Patient"
                        content={frenchDoc.patientMessage}
                        onCopy={() => copyToClipboard(frenchDoc.patientMessage || "", "patientMessage")}
                        icon={<MessageSquare className="w-4 h-4" />}
                        color="cyan"
                        copyCount={copiedSections.has("patientMessage") ? 1 : 0}
                      />
                      
                      {/* Savings Summary */}
                      {(() => {
                        const savings = calculateSavings();
                        return savings.totalCopies > 0 && (
                          <div className="mt-6 bg-green-900/20 border border-green-500/30 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-semibold text-green-300 flex items-center gap-2">
                                <TrendingUp className="w-4 h-4" />
                                Time & Money Saved
                              </h4>
                              <Badge className="bg-green-600 text-white">
                                {savings.totalCopies} copies
                              </Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-gray-400">Time Saved:</span>
                                <span className="text-green-300 font-semibold ml-2">
                                  {savings.totalTimeSaved} minutes
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-400">Money Saved:</span>
                                <span className="text-green-300 font-semibold ml-2">
                                  ${savings.moneySaved} CAD
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Copy Toast */}
      {copyToast && (
        <div className="fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg">
          {copyToast}
        </div>
      )}
    </div>
  );
}

// Enhanced Patient Card Component
function EnhancedPatientCard({
  patient,
  onView,
  onEdit,
  onGenerateReport
}: {
  patient: any;
  onView: () => void;
  onEdit: () => void;
  onGenerateReport: () => void;
}) {
  const getTriageColor = (level: string) => {
    return "bg-gray-500/20 text-gray-300 border-gray-500/30";
  };

  const getStatusIcon = (level: string) => {
    return <CheckCircle className="w-4 h-4 text-gray-400" />;
  };

  return (
    <Card className="bg-gray-700 border-gray-600 hover:bg-gray-600 transition-all duration-200">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">
                {patient.patient_id?.charAt(0) || "P"}
              </span>
            </div>
            <div>
              <h3 className="font-semibold text-white text-lg">{patient.patient_id}</h3>
              <p className="text-sm text-gray-400">
                {patient.chief_complaint}
                {patient.ai_diagnosis && patient.ai_diagnosis.length > 0 && (
                  <span className="ml-2 text-purple-300 font-semibold">
                    → {patient.ai_diagnosis[0].diagnosis} ({patient.ai_diagnosis[0].confidence}%)
                  </span>
                )}
              </p>
              <p className="text-xs text-gray-500">
                {format(new Date(patient.created_at), "MMM d, yyyy 'at' h:mm a")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatusIcon(patient.triage_level)}
            <Badge className={`${getTriageColor(patient.triage_level)}`}>
              {patient.triage_level}
            </Badge>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Calendar className="w-4 h-4" />
            <span>Last visit: {format(new Date(patient.created_at), "MMM d")}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Heart className="w-4 h-4" />
            <span>
              Condition: {patient.chief_complaint}
              {patient.ai_diagnosis && patient.ai_diagnosis.length > 0 && (
                <span className="ml-2 text-purple-300">
                  → {patient.ai_diagnosis[0].diagnosis} ({patient.ai_diagnosis[0].confidence}%)
                </span>
              )}
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Activity className="w-4 h-4" />
            <span>Status: {patient.status || 'Active'}</span>
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <Button
            onClick={onView}
            size="sm"
            className="flex-1 bg-gray-600 hover:bg-gray-700 text-white"
          >
            <Eye className="w-4 h-4 mr-2" />
            View
          </Button>
          <Button
            onClick={onEdit}
            size="sm"
            className="bg-gray-600 hover:bg-gray-700 text-white"
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            onClick={onGenerateReport}
            size="sm"
            className="bg-gray-600 hover:bg-gray-700 text-white"
          >
            <Brain className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Medical Section Component
function MedicalSection({
  title,
  content,
  onCopy,
  icon,
  color = "blue",
  copyCount = 0
}: {
  title: string;
  content?: string;
  onCopy: () => void;
  icon: React.ReactNode;
  color?: string;
  copyCount?: number;
}) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    onCopy();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const colorClasses = {
    blue: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    green: "bg-green-500/20 text-green-300 border-green-500/30",
    purple: "bg-purple-500/20 text-purple-300 border-purple-500/30",
    orange: "bg-orange-500/20 text-orange-300 border-orange-500/30",
    red: "bg-red-500/20 text-red-300 border-red-500/30",
    cyan: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30"
  };

  return (
    <div className="bg-gray-700 rounded-lg border border-gray-600 p-4 hover:bg-gray-600 transition-all duration-200">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${colorClasses[color as keyof typeof colorClasses]}`}>
            {icon}
          </div>
          <h4 className="text-sm font-semibold text-white">{title}</h4>
          {copyCount > 0 && (
            <Badge variant="secondary" className="bg-green-900/20 text-green-300 border-green-600 text-xs">
              {copyCount}×
            </Badge>
          )}
        </div>
        <Button
          onClick={handleCopy}
          disabled={!content}
          size="sm"
          variant="ghost"
          className={`text-xs ${
            copied 
              ? 'bg-green-500/20 text-green-300' 
              : content 
                ? 'text-gray-300 hover:bg-gray-600' 
                : 'text-gray-500 cursor-not-allowed'
          }`}
        >
          {copied ? (
            <>
              <CheckCircle className="w-3 h-3 mr-1" />
              Copied
            </>
          ) : (
            <>
              <Copy className="w-3 h-3 mr-1" />
              Copy
            </>
          )}
        </Button>
      </div>
      
      <div className="min-h-[80px]">
        {content ? (
          <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap bg-gray-800 p-3 rounded border border-gray-600 font-mono text-xs">
            {content}
          </div>
        ) : (
          <div className="flex items-center justify-center h-20">
            <div className="text-center">
              <div className="text-gray-500 text-xs">
                Click "Generate" to create content
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}