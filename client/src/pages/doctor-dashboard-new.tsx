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
import { AIPromptBox } from "../components/ai/AIPromptBox";

// Environment check with fallback
const SUPABASE_URL = (import.meta as any).env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(
  SUPABASE_URL || "",
  SUPABASE_ANON_KEY || ""
);

export default function DoctorDashboardNew() {
  const [, navigate] = useLocation();
  
  // Check for missing environment variables
  const [envError, setEnvError] = React.useState<string | null>(null);
  
  React.useEffect(() => {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      setEnvError("Missing Supabase configuration. Please check your environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY).");
    }
  }, []);
  
  // Show error message if environment is not configured
  if (envError) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-[#1a1a1a] border border-red-500/30 rounded-xl p-8 text-center">
          <div className="w-16 h-16 bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-[#e6e6e6] mb-3">Configuration Error</h2>
          <p className="text-[#999] mb-6">{envError}</p>
          <div className="bg-[#0d0d0d] border border-[#333] rounded-lg p-4 text-left">
            <p className="text-xs text-[#666] mb-2">Required environment variables:</p>
            <ul className="text-xs text-[#999] space-y-1 font-mono">
              <li>• VITE_SUPABASE_URL</li>
              <li>• VITE_SUPABASE_ANON_KEY</li>
            </ul>
          </div>
          <Button
            onClick={() => window.location.href = "/"}
            className="mt-6 bg-[#222] hover:bg-[#2a2a2a] text-[#e6e6e6] w-full"
          >
            Return to Home
          </Button>
        </div>
      </div>
    );
  }
  
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
  const [doctorApiKey, setDoctorApiKey] = React.useState<string>("");
  const [doctorApiProvider, setDoctorApiProvider] = React.useState<'claude' | 'openai'>('claude');
  const [docHeader, setDocHeader] = React.useState({
    name: "Dr. Carlos Faviel Font",
    specialty: "Médecine Générale",
    avatarUrl: null,
    clinicName: "",
    license: "",
    clinicLocation: "",
    signature: ""
  });

  // Load doctor profile on mount
  React.useEffect(() => {
    const loadDoctorProfile = () => {
      try {
        const savedProfile = localStorage.getItem('doctor_profile');
        if (savedProfile) {
          const profile = JSON.parse(savedProfile);
          setDocHeader({
            name: profile.name || "Dr. Carlos Faviel Font",
            specialty: profile.specialty || "Médecine Générale",
            avatarUrl: profile.avatarUrl || null,
            clinicName: profile.clinicName || "",
            license: profile.license || "",
            clinicLocation: profile.address || "",
            signature: profile.signature || ""
          });
          // Load AI credentials
          if (profile.ai_api_key) {
            setDoctorApiKey(profile.ai_api_key);
          }
          if (profile.ai_provider) {
            setDoctorApiProvider(profile.ai_provider);
          }
        }
      } catch (error) {
        console.error('Error loading doctor profile:', error);
      }
    };
    loadDoctorProfile();
  }, []);

  // PIN modal for PDF signing
  const [showPinModal, setShowPinModal] = React.useState(false);
  const [pinInput, setPinInput] = React.useState("");
  const [pendingPdf, setPendingPdf] = React.useState<{ title: string; content: string } | null>(null);

  // PIN Modal Component
  const PinModal = () => {
    if (!showPinModal) return null;
    
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowPinModal(false)}>
        <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-8 max-w-sm w-full mx-4" onClick={(e) => e.stopPropagation()}>
          <h3 className="text-xl font-bold text-[#e6e6e6] mb-2">Enter PIN to Sign</h3>
          <p className="text-sm text-[#999] mb-6">Enter your 4-digit PIN to electronically sign this document.</p>
          <Input
            type="password"
            maxLength={4}
            value={pinInput}
            onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
            placeholder="Enter 4-digit PIN"
            className="bg-[#2a2a2a] border-[#333] text-[#e6e6e6] text-center text-2xl tracking-widest mb-6"
            autoFocus
            onKeyPress={(e) => {
              if (e.key === 'Enter' && pinInput.length === 4) {
                handleGeneratePdfApproved();
              }
            }}
          />
          <div className="flex gap-3">
            <Button
              onClick={() => {
                setShowPinModal(false);
                setPinInput("");
                setPendingPdf(null);
              }}
              variant="outline"
              className="flex-1 border-[#333] text-[#999] hover:bg-[#2a2a2a]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleGeneratePdfApproved}
              disabled={pinInput.length !== 4}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
            >
              Sign & Print
            </Button>
          </div>
          <p className="text-xs text-[#666] mt-4 text-center">
            First time? Your PIN will be set with this entry.
          </p>
        </div>
      </div>
    );
  };

  const validatePin = () => {
    // Fetch saved pin from localStorage as a temporary store until profile stores it
    const saved = localStorage.getItem("doctor_signature_pin");
    if (!saved) {
      // If no PIN saved, first entry sets it (default to "1234" for first use)
      if (pinInput.length === 4) {
        localStorage.setItem("doctor_signature_pin", pinInput);
        return true;
      }
      return false;
    }
    return saved === pinInput;
  };

  const handleGeneratePdfApproved = () => {
    if (!pendingPdf) return;
    if (!validatePin()) {
      alert("Incorrect PIN. Please try again.");
      setPinInput("");
      return;
    }
    // Build print-ready HTML
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${pendingPdf.title}</title>
    <style>
      body{font-family:Arial,sans-serif;line-height:1.6;color:#111;max-width:860px;margin:0 auto;padding:24px;background:#fff}
      .hdr{background:#0d0d0d;color:#e6e6e6;padding:16px 20px;border-radius:10px;margin-bottom:24px}
      .hdr h2{margin:0 0 6px 0;font-size:20px}
      .meta{font-size:12px;color:#bbb}
      .sec{font-size:14px;color:#374151;border-bottom:2px solid #e5e7eb;padding-bottom:6px;margin-top:18px;margin-bottom:8px}
      pre{white-space:pre-wrap;font-family:inherit}
      .sig{margin-top:24px;padding-top:12px;border-top:1px solid #e5e7eb}
      .print{margin-top:16px}
      @media print{.print{display:none}}
    </style></head><body>
      <div class="hdr">
        <h2>${docHeader.name} — ${docHeader.specialty || ''}</h2>
        <div class="meta">${docHeader.clinicName || ''} ${docHeader.clinicLocation ? '· ' + docHeader.clinicLocation : ''} ${docHeader.license ? '· ' + docHeader.license : ''}</div>
        <div class="meta">${dateStr}</div>
      </div>
      <div class="sec">${pendingPdf.title}</div>
      <pre>${pendingPdf.content || ''}</pre>
      <div class="sig">
        <div><strong>Signature:</strong> ${docHeader.signature || docHeader.name}</div>
        <div class="meta">${docHeader.name} ${docHeader.specialty ? '· ' + docHeader.specialty : ''}</div>
        <div class="meta">${docHeader.clinicName || ''} ${docHeader.clinicLocation ? '· ' + docHeader.clinicLocation : ''}</div>
        <div class="meta">${docHeader.license ? 'License: ' + docHeader.license : ''}</div>
        <div class="meta">Signed electronically on ${dateStr}</div>
      </div>
      <div class="print"><button onclick="window.print()">Print</button></div>
    </body></html>`;
    const w = window.open("", "_blank");
    if (w) {
      w.document.open();
      w.document.write(html);
      w.document.close();
    }
    setShowPinModal(false);
    setPinInput("");
    setPendingPdf(null);
  };

  const requestPdf = (title: string, content?: string) => {
    setPendingPdf({ title, content: content || "" });
    setShowPinModal(true);
  };
  
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

  // Parse diagnosis from existing SAP note in medical report
  const parseDiagnosisFromSAP = (sapNote: string) => {
    try {
      // SAP format: "A: 1) Primary diagnosis 2) Diff diagnosis 2..."
      const assessmentMatch = sapNote.match(/A:\s*(.+?)(?:\nP:|$)/s);
      if (!assessmentMatch) return [];
      
      const assessmentLine = assessmentMatch[1];
      const diagnosisMatches = assessmentLine.match(/\d+\)\s*([^()]+?)(?:\s*\(|,|\s*\d+\)|$)/g);
      
      if (!diagnosisMatches) return [];
      
      return diagnosisMatches.map(d => 
        d.replace(/^\d+\)\s*/, '')
         .replace(/\s*\(.*?\)\s*$/, '')
         .trim()
      );
    } catch (error) {
      console.error("Error parsing SAP diagnosis:", error);
      return [];
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

  const applyTemplateToReport = () => {
    if (!frenchDoc || !selectedTemplate) return;
    
    // Get selected items from template
    const updatedReport = { ...frenchDoc };
    
    // Add selected medications to report
    if (selectedPlanItems.medications && selectedPlanItems.medications.length > 0) {
      const additionalMeds = selectedTemplate.plan_items
        .filter((item: any) => 
          item.category?.toLowerCase() === 'medications' && 
          selectedPlanItems.medications.includes(item.item)
        )
        .map((item: any) => `\n\n${item.item}${item.details ? `\n${item.details}` : ''}`)
        .join('');
      
      updatedReport.medications = (updatedReport.medications || '') + additionalMeds;
    }
    
    // Add selected lab tests
    if (selectedPlanItems.tests && selectedPlanItems.tests.length > 0) {
      const additionalTests = selectedTemplate.plan_items
        .filter((item: any) => 
          (item.category?.toLowerCase() === 'laboratory' || item.category?.toLowerCase() === 'tests') && 
          selectedPlanItems.tests.includes(item.item)
        )
        .map((item: any) => item.item)
        .join('\n');
      
      updatedReport.lab_tests = (updatedReport.lab_tests || '') + '\n' + additionalTests;
    }
    
    // Add selected referrals  
    if (selectedPlanItems.referrals && selectedPlanItems.referrals.length > 0) {
      const additionalReferrals = selectedTemplate.plan_items
        .filter((item: any) => 
          (item.category?.toLowerCase() === 'referrals' || item.category?.toLowerCase() === 'specialist') && 
          selectedPlanItems.referrals.includes(item.item)
        )
        .map((item: any) => `${item.item}${item.details ? ` - ${item.details}` : ''}`)
        .join('\n\n');
      
      updatedReport.referrals = (updatedReport.referrals || '') + '\n\n' + additionalReferrals;
    }
    
    // Update the report
    setFrenchDoc(updatedReport);
    
    // Close modal and reset
    setShowTemplateLibrary(false);
    setSelectedTemplate(null);
    setSelectedPlanItems({ medications: [], tests: [], referrals: [], lifestyle: [] });
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

  // Show initial loading skeleton
  const isInitializing = loading && searchResults.length === 0 && searchQuery === "";

  return (
    <>
      <PinModal />
      <div className="min-h-screen bg-[#0d0d0d] flex">
        {/* Sidebar - Linear Style */}
        <aside className="w-64 bg-[#1a1a1a] border-r border-[#333]">
        <div className="p-6">
          {/* Logo */}
          <div className="mb-8">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#8b5cf6] rounded-lg flex items-center justify-center">
                <Stethoscope className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-[#e6e6e6]">InstantHPI</h1>
                <p className="text-xs text-[#666]">Medical Platform</p>
              </div>
            </div>
          </div>

          {/* Navigation - Linear Style */}
          <nav className="space-y-1">
            <button onClick={() => navigate("/doctor-dashboard")} className="flex items-center gap-3 px-3 py-2.5 bg-[#222] text-[#e6e6e6] rounded-md w-full text-left transition-colors border border-[#2a2a2a]">
              <Home className="w-4 h-4" />
              <span className="text-sm font-medium">Dashboard</span>
            </button>
            <button onClick={() => navigate("/patients")} className="flex items-center gap-3 px-3 py-2.5 text-[#999] hover:text-[#e6e6e6] hover:bg-[#222]/50 rounded-md w-full text-left transition-colors">
              <Users2 className="w-4 h-4" />
              <span className="text-sm">Patients</span>
            </button>
            <button onClick={() => navigate("/documents")} className="flex items-center gap-3 px-3 py-2.5 text-[#999] hover:text-[#e6e6e6] hover:bg-[#222]/50 rounded-md w-full text-left transition-colors">
              <FileTextIcon className="w-4 h-4" />
              <span className="text-sm">Reports</span>
            </button>
            <button onClick={() => navigate("/messages")} className="flex items-center gap-3 px-3 py-2.5 text-[#999] hover:text-[#e6e6e6] hover:bg-[#222]/50 rounded-md w-full text-left transition-colors">
              <MessageSquare className="w-4 h-4" />
              <span className="text-sm">Messages</span>
            </button>
            <button onClick={() => navigate("/ai-billing")} className="flex items-center gap-3 px-3 py-2.5 text-[#999] hover:text-[#e6e6e6] hover:bg-[#222]/50 rounded-md w-full text-left transition-colors">
              <Database className="w-4 h-4" />
              <span className="text-sm">Analytics</span>
            </button>
            <button onClick={() => navigate("/doctor-profile")} className="flex items-center gap-3 px-3 py-2.5 text-[#999] hover:text-[#e6e6e6] hover:bg-[#222]/50 rounded-md w-full text-left transition-colors">
              <Settings className="w-4 h-4" />
              <span className="text-sm">Settings</span>
            </button>
          </nav>

          {/* Collaboration Section - Linear Style Separator */}
          <div className="border-t border-[#333] pt-6 mt-6">
            <p className="text-xs font-medium text-[#666] uppercase tracking-wider mb-3 px-3">
              Collaboration
            </p>
            <nav className="space-y-1">
              <button onClick={() => navigate("/association")} className="flex items-center gap-3 px-3 py-2.5 text-[#999] hover:text-[#e6e6e6] hover:bg-[#222]/50 rounded-md w-full text-left transition-colors">
                <Users className="w-4 h-4" />
                <span className="text-sm">Association</span>
              </button>
            </nav>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 bg-[#0d0d0d]">
        {isInitializing ? (
          // Loading skeleton
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center space-y-4">
              <div className="w-12 h-12 mx-auto">
                <div className="animate-spin">
                  <Activity className="w-12 h-12 text-[#8b5cf6]" />
                </div>
              </div>
              <p className="text-[#999]">Loading dashboard...</p>
            </div>
          </div>
        ) : (
          <div className="p-6">
            <div className="mb-6">
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Left Column - Search and Spruce (3/4 width) */}
              <div className="lg:col-span-3 space-y-6">
                {/* Patient Search - Linear Style */}
                <Card className="bg-[#1a1a1a] border-[#2a2a2a] shadow-none">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-[#e6e6e6] text-lg font-medium flex items-center gap-2">
                      <Search className="w-5 h-5 text-[#999]" />
                      Search Patients
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      <Input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Enter patient ID..."
                        className="bg-[#0d0d0d] border-[#333] text-[#e6e6e6] placeholder:text-[#666] focus:ring-2 focus:ring-[#8b5cf6] focus:border-transparent"
                      />
                      <Button
                        onClick={searchPatients}
                        disabled={loading}
                        className="bg-[#1a1a1a] border border-[#333] hover:bg-[#222] text-[#e6e6e6]"
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
                            className="p-3 bg-[#0d0d0d] rounded-md hover:bg-[#222] cursor-pointer transition-colors border border-[#2a2a2a]"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-[#e6e6e6] text-sm">{patient.patient_id}</p>
                                <p className="text-xs text-[#999] mt-0.5">{patient.chief_complaint}</p>
                              </div>
                              <Badge className="bg-[#222] text-[#999] border border-[#2a2a2a] text-xs">
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
                <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
                  <CardHeader>
                    <CardTitle className="text-[#e6e6e6] text-lg font-medium flex items-center gap-2">
                      <Phone className="w-5 h-5 text-[#999]" />
                      Spruce Integration
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {/* Spruce Search */}
                    <div className="mb-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#999] h-4 w-4" />
                        <Input
                          type="text"
                          placeholder="Search conversations..."
                          value={spruceSearchQuery}
                          onChange={(e) => setSpruceSearchQuery(e.target.value)}
                          className="pl-9 bg-[#0d0d0d] border-[#333] text-[#e6e6e6] placeholder:text-[#666] focus:ring-2 focus:ring-[#8b5cf6] focus:border-transparent"
                        />
                      </div>
                    </div>

                    {loadingSpruce ? (
                      <div className="text-center py-8">
                        <Activity className="w-12 h-12 text-[#999] mx-auto mb-4 animate-spin" />
                        <p className="text-[#999]">Loading Spruce cases...</p>
                      </div>
                    ) : filteredSpruceCases.length === 0 ? (
                      <div className="text-center py-8">
                        <Phone className="w-12 h-12 text-[#999] mx-auto mb-4" />
                        <p className="text-[#999]">No Spruce conversations found</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {filteredSpruceCases.slice(0, 5).map((conversation) => (
                          <div
                            key={conversation.id}
                            onClick={() => setSelectedSpruceConversation(conversation)}
                            className={`p-3 rounded-lg transition-colors cursor-pointer ${
                              selectedSpruceConversation?.id === conversation.id
                                ? 'bg-[#222] hover:bg-slate-750'
                                : 'bg-[#2a2a2a] hover:bg-[#333]'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-[#222] rounded-lg flex items-center justify-center">
                                  <Phone className="w-4 h-4 text-[#e6e6e6]" />
                                </div>
                                <div>
                                  <p className="font-semibold text-[#e6e6e6] text-sm">
                                    {conversation.patient_name || `Conversation ${conversation.id}`}
                                  </p>
                                  <p className="text-[#999] text-xs">
                                    {conversation.last_message || 'No messages yet'}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-[#999] text-xs">
                                  {conversation.updated_at ? 
                                    format(new Date(conversation.updated_at), 'MMM d, HH:mm') : 
                                    'Unknown time'
                                  }
                                </p>
                                <div className="flex items-center gap-1 mt-1">
                                  <div className="w-2 h-2 bg-emerald-800 rounded-full"></div>
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
                <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
                  <CardHeader>
                    <CardTitle className="text-[#e6e6e6] text-lg font-medium flex items-center gap-2">
                      <Zap className="w-5 h-5 text-[#999]" />
                      Quick Diagnosis Templates
                    </CardTitle>
                    <CardDescription className="text-[#999] text-sm">
                      Pre-built protocols for common conditions
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {/* Template Search */}
                    <div className="mb-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#999] h-4 w-4" />
                        <Input
                          type="text"
                          placeholder="Search diagnoses..."
                          value={templateSearchQuery}
                          onChange={(e) => setTemplateSearchQuery(e.target.value)}
                          className="pl-9 bg-[#0d0d0d] border-[#333] text-[#e6e6e6] placeholder:text-[#666] focus:ring-2 focus:ring-[#8b5cf6] focus:border-transparent"
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
                                <Stethoscope className="w-4 h-4 text-[#e6e6e6]" />
                                <span className="text-[#e6e6e6] text-sm font-medium">{template.name}</span>
                              </div>
                              <Badge className={
                                template.category === 'acute' ? 'bg-red-600' :
                                template.category === 'chronic' ? 'bg-[#222]' :
                                'bg-[#222]'
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
                      className="w-full mt-4 bg-[#1a1a1a] border border-[#333] hover:bg-[#222] text-[#e6e6e6]"
                    >
                      <Zap className="w-4 h-4 mr-2" />
                      View All Templates
                    </Button>
                  </CardContent>
                </Card>

                {/* Template Detail Builder */}
                {showTemplateLibrary && selectedDiagnosis && (
                  <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-[#e6e6e6] text-lg font-medium flex items-center gap-2">
                          <Brain className="w-5 h-5 text-[#8b5cf6]" />
                          Plan Builder: {diagnosisTemplates.find(d => d.id === selectedDiagnosis)?.name}
                        </CardTitle>
                        <Button
                          onClick={() => setShowTemplateLibrary(false)}
                          size="sm"
                          variant="ghost"
                          className="text-[#999]"
                        >
                          ✕
                        </Button>
                      </div>
                      <CardDescription className="text-[#999]">
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
                        <div className="bg-[#2a2a2a] border border-[#333] rounded-lg p-3">
                          <h4 className="text-[#e6e6e6] font-semibold mb-2">📝 Plan Preview:</h4>
                          <p className="text-[#999] text-sm whitespace-pre-wrap">
                            {buildPlanFromSelections() || "Select items above to build your plan..."}
                          </p>
                        </div>

                        {/* Apply Button */}
                        <Button
                          onClick={applyPlanToSAP}
                          className="w-full bg-[#8b5cf6] hover:bg-[#7c3aed] text-white"
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
                <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-[#e6e6e6] text-lg font-medium flex items-center gap-2">
                        <FileText className="w-5 h-5 text-[#999]" />
                        File Management
                      </CardTitle>
                      <div className="flex gap-2">
                        <Button
                          onClick={loadReports}
                          disabled={loadingReports}
                          size="sm"
                          variant="outline"
                          className="text-[#e6e6e6] border-[#333] hover:bg-[#2a2a2a]"
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
                        <Activity className="w-12 h-12 text-[#999] mx-auto mb-4 animate-spin" />
                        <p className="text-[#999]">Loading reports...</p>
                      </div>
                    ) : reports.length === 0 ? (
                      <div className="text-center py-8">
                        <FileText className="w-12 h-12 text-[#999] mx-auto mb-4" />
                        <p className="text-[#999]">No reports found</p>
                        <p className="text-[#666] text-sm">Generate medical reports to see them here</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {reports.map((report) => (
                          <div
                            key={report.filename}
                            className="p-3 bg-[#2a2a2a] rounded-lg hover:bg-[#333] transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                                  <FileText className="w-4 h-4 text-[#e6e6e6]" />
                                </div>
                                <div>
                                  <p className="font-semibold text-[#e6e6e6] text-sm">
                                    {report.filename}
                                  </p>
                                  <p className="text-[#999] text-xs">
                                    Created: {new Date(report.created).toLocaleDateString()} • Size: {report.size}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  onClick={() => window.open(report.url, '_blank')}
                                  size="sm"
                                  variant="outline"
                                  className="text-blue-300 border-[#2a2a2a] hover:bg-blue-900/20"
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
                <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
                  <CardHeader>
                    <CardTitle className="text-[#e6e6e6] text-lg font-medium flex items-center gap-2">
                      <Clock className="w-5 h-5 text-[#999]" />
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
                <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
                  <CardHeader>
                    <CardTitle className="text-[#e6e6e6] text-lg font-medium flex items-center gap-2">
                      <Brain className="w-5 h-5 text-[#999]" />
                      Patient Details & Medical Report
                    </CardTitle>
                    <CardDescription className="text-[#999] text-sm">
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
                              <div className="bg-[#2a2a2a] border border-[#333] rounded-lg p-3 max-h-40 overflow-y-auto">
                                <h4 className="text-[#e6e6e6] text-sm font-semibold mb-2">📝 Form Data:</h4>
                                <div className="text-xs text-[#999] space-y-1">
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
                          className="w-full bg-[#8b5cf6] hover:bg-[#7c3aed] text-white disabled:opacity-50"
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
                        {frenchDoc && frenchDoc.sap_note && (
                          <Dialog open={showTemplateLibrary} onOpenChange={setShowTemplateLibrary}>
                            <DialogTrigger asChild>
                              <Button
                                onClick={() => {
                                  const diagnoses = parseDiagnosisFromSAP(frenchDoc.sap_note || "");
                                  setSelectedDiagnosis(diagnoses[0] || "");
                                  setShowTemplateLibrary(true);
                                }}
                                variant="outline"
                                className="w-full border-[#2a2a2a] text-[#999] hover:bg-purple-50"
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
                                  <div className="text-center py-8 text-[#666]">
                                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                    <p>No templates found for this diagnosis.</p>
                                    <p className="text-sm mt-2">
                                      Create one in your <a href="/doctor-profile" className="text-[#999] underline">Profile Settings</a>
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
                                            <CheckCircle className="w-5 h-5 text-[#999]" />
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
                                                    <span className="font-medium text-[#999]">{item.category}:</span>{" "}
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
                                    onClick={applyTemplateToReport}
                                    className="bg-[#222] hover:bg-slate-750"
                                  >
                                    Apply Template to Report
                                  </Button>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <User className="w-12 h-12 text-[#999] mx-auto mb-4" />
                        <p className="text-[#999]">Select a patient to view details and generate report</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Medical Report Sections */}
                {frenchDoc && (
                  <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
                    <CardHeader>
                      <CardTitle className="text-[#e6e6e6] text-lg font-medium flex items-center gap-2">
                        <FileText className="w-5 h-5 text-[#999]" />
                        Medical Report
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <MedicalSection
                          title="HPI Summary"
                          content={frenchDoc.hpiSummary}
                          onCopy={() => copyToClipboard(frenchDoc.hpiSummary || "", "hpiSummary")}
                          onAIGenerate={(text) => setFrenchDoc({...frenchDoc, hpiSummary: text})}
                          onPdf={requestPdf}
                          icon={<FileText className="w-4 h-4" />}
                          color="blue"
                          copyCount={copiedSections.has("hpiSummary") ? 1 : 0}
                          sectionName="HPI Summary"
                          patientData={selectedPatientData}
                          writingStyleTemplate={{template_name: "Default"}}
                          doctorApiKey={doctorApiKey}
                          doctorApiProvider={doctorApiProvider}
                        />
                        <MedicalSection
                          title="Super Spartan SAP"
                          content={frenchDoc.superSpartanSAP}
                          onCopy={() => copyToClipboard(frenchDoc.superSpartanSAP || "", "superSpartanSAP")}
                          onAIGenerate={(text) => setFrenchDoc({...frenchDoc, superSpartanSAP: text})}
                          onPdf={requestPdf}
                          icon={<Stethoscope className="w-4 h-4" />}
                          color="green"
                          copyCount={copiedSections.has("superSpartanSAP") ? 1 : 0}
                          sectionName="Super Spartan SAP"
                          patientData={selectedPatientData}
                          writingStyleTemplate={{template_name: "Default"}}
                          doctorApiKey={doctorApiKey}
                          doctorApiProvider={doctorApiProvider}
                        />
                        <MedicalSection
                          title="Medications Ready to Use"
                          content={frenchDoc.medicationsReadyToUse}
                          onCopy={() => copyToClipboard(frenchDoc.medicationsReadyToUse || "", "medicationsReadyToUse")}
                          onAIGenerate={(text) => setFrenchDoc({...frenchDoc, medicationsReadyToUse: text})}
                          onPdf={requestPdf}
                          icon={<Heart className="w-4 h-4" />}
                          color="purple"
                          copyCount={copiedSections.has("medicationsReadyToUse") ? 1 : 0}
                          sectionName="Medications Ready to Use"
                          patientData={selectedPatientData}
                          writingStyleTemplate={{template_name: "Default"}}
                          doctorApiKey={doctorApiKey}
                          doctorApiProvider={doctorApiProvider}
                        />
                        <MedicalSection
                          title="Lab Works"
                          content={frenchDoc.labWorks}
                          onCopy={() => copyToClipboard(frenchDoc.labWorks || "", "labWorks")}
                          onAIGenerate={(text) => setFrenchDoc({...frenchDoc, labWorks: text})}
                          onPdf={requestPdf}
                          icon={<Activity className="w-4 h-4" />}
                          color="orange"
                          copyCount={copiedSections.has("labWorks") ? 1 : 0}
                          sectionName="Lab Works"
                          patientData={selectedPatientData}
                          writingStyleTemplate={{template_name: "Default"}}
                          doctorApiKey={doctorApiKey}
                          doctorApiProvider={doctorApiProvider}
                        />
                        <MedicalSection
                          title="Imagerie Médicale"
                          content={frenchDoc.imagerieMedicale}
                          onCopy={() => copyToClipboard(frenchDoc.imagerieMedicale || "", "imagerieMedicale")}
                          onAIGenerate={(text) => setFrenchDoc({...frenchDoc, imagerieMedicale: text})}
                          onPdf={requestPdf}
                          icon={<AlertTriangle className="w-4 h-4" />}
                          color="red"
                          copyCount={copiedSections.has("imagerieMedicale") ? 1 : 0}
                          sectionName="Imagerie Médicale"
                          patientData={selectedPatientData}
                          writingStyleTemplate={{template_name: "Default"}}
                          doctorApiKey={doctorApiKey}
                          doctorApiProvider={doctorApiProvider}
                        />
                        <MedicalSection
                          title="Référence Spécialistes"
                          content={frenchDoc.referenceSpecialistes}
                          onCopy={() => copyToClipboard(frenchDoc.referenceSpecialistes || "", "referenceSpecialistes")}
                          onAIGenerate={(text) => setFrenchDoc({...frenchDoc, referenceSpecialistes: text})}
                          onPdf={requestPdf}
                          icon={<Users className="w-4 h-4" />}
                          color="cyan"
                          copyCount={copiedSections.has("referenceSpecialistes") ? 1 : 0}
                          sectionName="Référence Spécialistes"
                          patientData={selectedPatientData}
                          writingStyleTemplate={{template_name: "Default"}}
                          doctorApiKey={doctorApiKey}
                          doctorApiProvider={doctorApiProvider}
                        />
                        <MedicalSection
                          title="Questions de Suivi"
                          content={frenchDoc.followUpQuestions}
                          onCopy={() => copyToClipboard(frenchDoc.followUpQuestions || "", "followUpQuestions")}
                          onAIGenerate={(text) => setFrenchDoc({...frenchDoc, followUpQuestions: text})}
                          onPdf={requestPdf}
                          icon={<MessageSquare className="w-4 h-4" />}
                          color="blue"
                          copyCount={copiedSections.has("followUpQuestions") ? 1 : 0}
                          sectionName="Questions de Suivi"
                          patientData={selectedPatientData}
                          writingStyleTemplate={{template_name: "Default"}}
                          doctorApiKey={doctorApiKey}
                          doctorApiProvider={doctorApiProvider}
                        />
                        <MedicalSection
                          title="Certificat d'Arrêt de Travail"
                          content={frenchDoc.workLeaveCertificate}
                          onCopy={() => copyToClipboard(frenchDoc.workLeaveCertificate || "", "workLeaveCertificate")}
                          onAIGenerate={(text) => setFrenchDoc({...frenchDoc, workLeaveCertificate: text})}
                          onPdf={requestPdf}
                          icon={<FileText className="w-4 h-4" />}
                          color="orange"
                          copyCount={copiedSections.has("workLeaveCertificate") ? 1 : 0}
                          sectionName="Certificat d'Arrêt de Travail"
                          patientData={selectedPatientData}
                          writingStyleTemplate={{template_name: "Default"}}
                          doctorApiKey={doctorApiKey}
                          doctorApiProvider={doctorApiProvider}
                        />
                        <MedicalSection
                          title="Modifications au Travail"
                          content={frenchDoc.workplaceModifications}
                          onCopy={() => copyToClipboard(frenchDoc.workplaceModifications || "", "workplaceModifications")}
                          onAIGenerate={(text) => setFrenchDoc({...frenchDoc, workplaceModifications: text})}
                          onPdf={requestPdf}
                          icon={<Settings className="w-4 h-4" />}
                          color="purple"
                          copyCount={copiedSections.has("workplaceModifications") ? 1 : 0}
                          sectionName="Modifications au Travail"
                          patientData={selectedPatientData}
                          writingStyleTemplate={{template_name: "Default"}}
                          doctorApiKey={doctorApiKey}
                          doctorApiProvider={doctorApiProvider}
                        />
                        <MedicalSection
                          title="Documentation Assurance"
                          content={frenchDoc.insuranceDocumentation}
                          onCopy={() => copyToClipboard(frenchDoc.insuranceDocumentation || "", "insuranceDocumentation")}
                          onAIGenerate={(text) => setFrenchDoc({...frenchDoc, insuranceDocumentation: text})}
                          onPdf={requestPdf}
                          icon={<FileText className="w-4 h-4" />}
                          color="green"
                          copyCount={copiedSections.has("insuranceDocumentation") ? 1 : 0}
                          sectionName="Documentation Assurance"
                          patientData={selectedPatientData}
                          writingStyleTemplate={{template_name: "Default"}}
                          doctorApiKey={doctorApiKey}
                          doctorApiProvider={doctorApiProvider}
                        />
                        <MedicalSection
                          title="Télémédecine vs En Personne"
                          content={frenchDoc.telemedicineNeedsInPerson}
                          onCopy={() => copyToClipboard(frenchDoc.telemedicineNeedsInPerson || "", "telemedicineNeedsInPerson")}
                          onAIGenerate={(text) => setFrenchDoc({...frenchDoc, telemedicineNeedsInPerson: text})}
                          onPdf={requestPdf}
                          icon={<AlertTriangle className="w-4 h-4" />}
                          color="red"
                          copyCount={copiedSections.has("telemedicineNeedsInPerson") ? 1 : 0}
                          sectionName="Télémédecine vs En Personne"
                          patientData={selectedPatientData}
                          writingStyleTemplate={{template_name: "Default"}}
                          doctorApiKey={doctorApiKey}
                          doctorApiProvider={doctorApiProvider}
                        />
                        <MedicalSection
                          title="Message au Patient"
                          content={frenchDoc.patientMessage}
                          onCopy={() => copyToClipboard(frenchDoc.patientMessage || "", "patientMessage")}
                          onAIGenerate={(text) => setFrenchDoc({...frenchDoc, patientMessage: text})}
                          onPdf={requestPdf}
                          icon={<MessageSquare className="w-4 h-4" />}
                          color="cyan"
                          copyCount={copiedSections.has("patientMessage") ? 1 : 0}
                          sectionName="Message au Patient"
                          patientData={selectedPatientData}
                          writingStyleTemplate={{template_name: "Default"}}
                          doctorApiKey={doctorApiKey}
                          doctorApiProvider={doctorApiProvider}
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
                                <Badge className="bg-emerald-900/30 text-emerald-300 border border-emerald-800/50">
                                  {savings.totalCopies} copies
                                </Badge>
                              </div>
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <span className="text-[#999]">Time Saved:</span>
                                  <span className="text-green-300 font-semibold ml-2">
                                    {savings.totalTimeSaved} minutes
                                  </span>
                                </div>
                                <div>
                                  <span className="text-[#999]">Money Saved:</span>
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
        )}
      </main>

        {/* Copy Toast */}
        {copyToast && (
          <div className="fixed bottom-4 right-4 bg-green-600 text-[#e6e6e6] px-4 py-2 rounded-lg shadow-lg">
            {copyToast}
          </div>
        )}
      </div>
    </>
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
    return "bg-gray-500/20 text-[#e6e6e6] border-gray-500/30";
  };

  const getStatusIcon = (level: string) => {
    return <CheckCircle className="w-4 h-4 text-[#999]" />;
  };

  return (
    <Card className="bg-[#0d0d0d] border-[#2a2a2a] hover:bg-[#1a1a1a] transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#333] rounded-full flex items-center justify-center">
              <span className="text-[#e6e6e6] font-bold text-lg">
                {patient.patient_id?.charAt(0) || "P"}
              </span>
            </div>
            <div>
              <h3 className="font-semibold text-[#e6e6e6] text-lg">{patient.patient_id}</h3>
              <p className="text-sm text-[#999]">{patient.chief_complaint}</p>
              <p className="text-xs text-[#666]">
                {format(new Date(patient.created_at), "MMM d, yyyy 'at' h:mm a")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatusIcon(patient.triage_level)}
            <Badge className="bg-[#222] text-[#999] border border-[#2a2a2a] text-xs">
              {patient.triage_level}
            </Badge>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-[#999]">
            <Calendar className="w-4 h-4" />
            <span>Last visit: {format(new Date(patient.created_at), "MMM d")}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-[#999]">
            <Heart className="w-4 h-4" />
            <span>Condition: {patient.chief_complaint}</span>
          </div>

          <div className="flex items-center gap-2 text-sm text-[#999]">
            <Activity className="w-4 h-4" />
            <span>Status: {patient.status || 'Active'}</span>
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <Button
            onClick={onView}
            size="sm"
            className="flex-1 bg-[#1a1a1a] border border-[#333] hover:bg-[#222] text-[#e6e6e6]"
          >
            <Eye className="w-4 h-4 mr-2" />
            View
          </Button>
          <Button
            onClick={onEdit}
            size="sm"
            className="bg-[#1a1a1a] border border-[#333] hover:bg-[#222] text-[#e6e6e6]"
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            onClick={onGenerateReport}
            size="sm"
            className="bg-[#1a1a1a] border border-[#333] hover:bg-[#222] text-[#e6e6e6]"
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
  onPdf,
  onAIGenerate,
  icon,
  color = "blue",
  copyCount = 0,
  sectionName,
  patientData,
  writingStyleTemplate,
  doctorApiKey,
  doctorApiProvider
}: {
  title: string;
  content?: string;
  onCopy: () => void;
  onPdf?: (title: string, content?: string) => void;
  onAIGenerate?: (generatedText: string) => void;
  icon: React.ReactNode;
  color?: string;
  copyCount?: number;
  sectionName?: string;
  patientData?: any;
  writingStyleTemplate?: any;
  doctorApiKey?: string;
  doctorApiProvider?: 'claude' | 'openai';
}) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    onCopy();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Elegant monochromatic palette - NO rainbow clown colors
  const colorClasses = {
    blue: "bg-[#222]/40 text-[#999] border-[#2a2a2a]/50",
    green: "bg-[#222]/40 text-[#999] border-[#2a2a2a]/50",
    purple: "bg-[#222]/40 text-[#999] border-[#2a2a2a]/50",
    orange: "bg-[#222]/40 text-[#999] border-[#2a2a2a]/50",
    red: "bg-[#222]/40 text-[#999] border-[#2a2a2a]/50",
    cyan: "bg-[#222]/40 text-[#999] border-[#2a2a2a]/50"
  };

  return (
    <div className="bg-[#0d0d0d] rounded-md border border-[#2a2a2a] p-4 hover:bg-[#1a1a1a] transition-colors">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${colorClasses[color as keyof typeof colorClasses]}`}>
            {icon}
          </div>
          <h4 className="text-sm font-semibold text-[#e6e6e6]">{title}</h4>
          {copyCount > 0 && (
            <Badge variant="secondary" className="bg-emerald-900/20 text-emerald-300 border-emerald-800/40 text-xs">
              {copyCount}×
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {sectionName && onAIGenerate && (
            <AIPromptBox
              sectionName={sectionName}
              patientData={patientData}
              writingStyleTemplate={writingStyleTemplate}
              onGenerate={onAIGenerate}
              doctorApiKey={doctorApiKey}
              doctorApiProvider={doctorApiProvider}
            />
          )}
          <Button
            onClick={handleCopy}
            disabled={!content}
            size="sm"
            variant="ghost"
            className={`text-xs ${
              copied 
                ? 'bg-emerald-800/20 text-green-300' 
                : content 
                  ? 'text-[#e6e6e6] hover:bg-[#333]' 
                  : 'text-[#666] cursor-not-allowed'
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
          <Button
            onClick={() => onPdf?.(title, content)}
            disabled={!content}
            size="sm"
            variant="outline"
            className="text-xs border-[#444] text-[#e6e6e6] hover:bg-[#333]"
          >
            PDF
          </Button>
        </div>
      </div>
      
      <div className="min-h-[80px]">
        {content ? (
          <div className="text-sm text-[#e6e6e6] leading-relaxed whitespace-pre-wrap bg-[#222] p-3 rounded border border-[#333] font-mono text-xs">
            {content}
          </div>
        ) : (
          <div className="flex items-center justify-center h-20">
            <div className="text-center">
              <div className="text-[#666] text-xs">
                Click "Generate" to create content
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}