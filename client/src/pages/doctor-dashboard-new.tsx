import React from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, LogOut, ChevronRight, User, Activity, Clock, AlertTriangle, CheckCircle, Copy, Brain, Stethoscope, FileText, Users, Settings, Bell } from "lucide-react";
import { format } from "date-fns";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default function DoctorDashboardNew() {
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [searchResults, setSearchResults] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [recentPatients, setRecentPatients] = React.useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = React.useState<string | null>(null);
  const [frenchDoc, setFrenchDoc] = React.useState<any>(null);
  const [generating, setGenerating] = React.useState(false);
  const [copyToast, setCopyToast] = React.useState<string | null>(null);
  const [docHeader, setDocHeader] = React.useState({
    name: "",
    specialty: "",
    avatarUrl: null
  });

  // Check authentication and load doctor profile on mount
  React.useEffect(() => {
    checkAuthAndLoadProfile();
  }, []);

  const checkAuthAndLoadProfile = async () => {
    // Check both localStorage auth and Supabase auth
    const isLocalAuth = localStorage.getItem("doctor_authenticated") === "true";
    
    // Check Supabase auth
    const { data: { session } } = await supabase.auth.getSession();
    const isSupabaseAuth = !!session;
    
    console.log("Doctor Dashboard - Auth Check:", {
      isLocalAuth,
      isSupabaseAuth,
      session: session?.user?.email
    });
    
    if (!isLocalAuth && !isSupabaseAuth) {
      console.log("User not authenticated, redirecting to login");
      navigate("/doctor-login");
      return;
    }

    // Load doctor profile from the actual system
    await loadDoctorProfile();
  };

  const loadDoctorProfile = async () => {
    try {
      // Check if we have Supabase session first
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        // Use Supabase auth
        const email = session.user.email;
        console.log("Loading profile for Supabase user:", email);
        
        // Try to get doctor info from database
        const { data, error } = await supabase
          .from("physicians")
          .select("*")
          .eq("email", email)
          .single();
          
        if (data) {
          setDocHeader({
            name: data.name || "Doctor",
            specialty: data.specialty || "",
            avatarUrl: ""
          });
        } else {
          // Fallback to email-based name
          const name = email === 'cff@centremedicalfont.ca' ? 'Dr. Carlos Faviel Font' : 'Doctor';
          setDocHeader({ name, specialty: "Médecine Générale", avatarUrl: "" });
        }
        return;
      }
      
      // Fallback to localStorage auth
      const doctorInfo = localStorage.getItem("doctor_info");
      if (doctorInfo) {
        const info = JSON.parse(doctorInfo);
        setDocHeader({
          name: info.name || "Doctor",
          specialty: info.specialty || "",
          avatarUrl: ""
        });
      } else {
        setDocHeader({ name: "Dr. Carlos Faviel Font", specialty: "Médecine Générale", avatarUrl: "" });
      }
    } catch (error) {
      console.error("Error loading doctor profile:", error);
      setDocHeader({ name: "Dr. Carlos Faviel Font", specialty: "Médecine Générale", avatarUrl: "" });
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

      if (error) throw error;
      setSearchResults(data || []);
    } catch (error) {
      console.error("Error searching patients:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadRecentPatients = async () => {
    try {
      const { data, error } = await supabase
        .from("consultations")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      setRecentPatients(data || []);
    } catch (error) {
      console.error("Error loading recent patients:", error);
    }
  };

  React.useEffect(() => {
    loadRecentPatients();
  }, []);

  const openPatientDetails = async (consultation: any) => {
    setSelectedPatient(consultation.patient_id);
    setSearchQuery(consultation.patient_id);
    setSearchResults([consultation]);

    // Auto-generate medical transcription
    setTimeout(() => {
      generateFrenchTranscription();
    }, 100);
  };

  const generateFrenchTranscription = async () => {
    if (!selectedPatient) return;
    
    setGenerating(true);
    try {
      const response = await fetch("/api/medical-transcription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patient_id: selectedPatient })
      });

      if (response.ok) {
        const data = await response.json();
        setFrenchDoc(data);
      }
    } catch (error) {
      console.error("Error generating transcription:", error);
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopyToast("Copied to clipboard!");
    setTimeout(() => setCopyToast(null), 2000);
  };

  const handleLogout = async () => {
    localStorage.removeItem("doctor_authenticated");
    localStorage.removeItem("doctor_info");
    navigate("/doctor-login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-md shadow-xl border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Stethoscope className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">InstantHPI</h1>
                  <p className="text-sm text-blue-200">Doctor's Lounge</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Rechercher un patient..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && searchPatients()}
                  className="pl-10 pr-4 py-2 bg-white/20 border-white/30 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64 backdrop-blur-sm"
                />
              </div>

              {/* Notifications */}
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20 relative"
              >
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
              </Button>

              {/* Doctor Profile */}
              <div
                className="flex items-center gap-3 px-4 py-2 bg-white/10 rounded-xl cursor-pointer hover:bg-white/20 transition-all duration-200 backdrop-blur-sm border border-white/20"
                onClick={() => navigate("/doctor-profile")}
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                  {docHeader.avatarUrl ? (
                    <img src={docHeader.avatarUrl} alt="Avatar" className="w-full h-full object-cover rounded-full" />
                  ) : (
                    <User className="w-5 h-5 text-white" />
                  )}
                </div>
                <div className="text-sm">
                  <p className="font-semibold text-white">{docHeader.name}</p>
                  <p className="text-blue-200 text-xs">{docHeader.specialty}</p>
                </div>
              </div>

              <Button
                onClick={handleLogout}
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Search Results */}
            {searchResults.length > 0 && (
              <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Search className="w-5 h-5" />
                    Résultats de Recherche
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {searchResults.map((patient) => (
                      <div
                        key={patient.id}
                        className="p-4 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-all duration-200 cursor-pointer"
                        onClick={() => openPatientDetails(patient)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                              <span className="text-white font-bold text-sm">
                                {patient.patient_id?.charAt(0) || "P"}
                              </span>
                            </div>
                            <div>
                              <p className="font-semibold text-white">{patient.patient_id}</p>
                              <p className="text-sm text-gray-300">{patient.chief_complaint}</p>
                            </div>
                          </div>
                          <Badge className={`${
                            patient.triage_level === 'High' ? 'bg-red-500/20 text-red-300 border-red-500/30' :
                            patient.triage_level === 'Medium' ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' :
                            'bg-green-500/20 text-green-300 border-green-500/30'
                          }`}>
                            {patient.triage_level}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Medical Transcription */}
            {selectedPatient && (
              <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-xl">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white flex items-center gap-2">
                      <Brain className="w-5 h-5" />
                      Rapport Médical Complet
                    </CardTitle>
                    <Button
                      onClick={generateFrenchTranscription}
                      disabled={generating}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {generating ? (
                        <>
                          <Activity className="w-4 h-4 mr-2 animate-spin" />
                          Génération...
                        </>
                      ) : (
                        <>
                          <Brain className="w-4 h-4 mr-2" />
                          Générer
                        </>
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {frenchDoc ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <MedicalSection
                        title="HPI Summary"
                        content={frenchDoc.hpiSummary}
                        onCopy={() => copyToClipboard(frenchDoc.hpiSummary || "")}
                        icon={<FileText className="w-4 h-4" />}
                        color="blue"
                      />
                      <MedicalSection
                        title="SAP Note"
                        content={frenchDoc.sapNote}
                        onCopy={() => copyToClipboard(frenchDoc.sapNote || "")}
                        icon={<Stethoscope className="w-4 h-4" />}
                        color="green"
                      />
                      <MedicalSection
                        title="Medications"
                        content={frenchDoc.medications}
                        onCopy={() => copyToClipboard(frenchDoc.medications || "")}
                        icon={<CheckCircle className="w-4 h-4" />}
                        color="purple"
                      />
                      <MedicalSection
                        title="Lab Work"
                        content={frenchDoc.labWork}
                        onCopy={() => copyToClipboard(frenchDoc.labWork || "")}
                        icon={<Activity className="w-4 h-4" />}
                        color="orange"
                      />
                      <MedicalSection
                        title="Imaging"
                        content={frenchDoc.imaging}
                        onCopy={() => copyToClipboard(frenchDoc.imaging || "")}
                        icon={<AlertTriangle className="w-4 h-4" />}
                        color="red"
                      />
                      <MedicalSection
                        title="Referrals"
                        content={frenchDoc.referrals}
                        onCopy={() => copyToClipboard(frenchDoc.referrals || "")}
                        icon={<Users className="w-4 h-4" />}
                        color="cyan"
                      />
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-400">Cliquez sur "Générer" pour créer le rapport médical</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-xl">
              <CardHeader>
                <CardTitle className="text-white text-lg">Statistiques Rapides</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                      <Users className="w-4 h-4 text-blue-400" />
                    </div>
                    <span className="text-white">Patients Actifs</span>
                  </div>
                  <span className="text-2xl font-bold text-white">{recentPatients.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    </div>
                    <span className="text-white">Consultations Aujourd'hui</span>
                  </div>
                  <span className="text-2xl font-bold text-white">12</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                      <Clock className="w-4 h-4 text-yellow-400" />
                    </div>
                    <span className="text-white">En Attente</span>
                  </div>
                  <span className="text-2xl font-bold text-white">3</span>
                </div>
              </CardContent>
            </Card>

            {/* Recent Patients */}
            <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-xl">
              <CardHeader>
                <CardTitle className="text-white text-lg">Consultations Récentes</CardTitle>
              </CardHeader>
              <CardContent>
                {recentPatients.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-400">Aucune consultation récente</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentPatients.slice(0, 5).map((patient) => (
                      <div
                        key={patient.id}
                        className="p-3 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-all duration-200 cursor-pointer"
                        onClick={() => openPatientDetails(patient)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                              <span className="text-white font-bold text-sm">
                                {patient.patient_id?.charAt(0) || "P"}
                              </span>
                            </div>
                            <div>
                              <p className="font-semibold text-white text-sm">{patient.patient_id}</p>
                              <p className="text-xs text-gray-300">{patient.chief_complaint}</p>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                          <Badge className={`text-xs ${
                            patient.triage_level === 'High' ? 'bg-red-500/20 text-red-300' :
                            patient.triage_level === 'Medium' ? 'bg-yellow-500/20 text-yellow-300' :
                            'bg-green-500/20 text-green-300'
                          }`}>
                            {patient.triage_level}
                          </Badge>
                          <span className="text-xs text-gray-400">
                            {format(new Date(patient.created_at), "MMM d")}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Copy Toast */}
      {copyToast && (
        <div className="fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50">
          {copyToast}
        </div>
      )}
    </div>
  );
}

// Medical Section Component
function MedicalSection({
  title,
  content,
  onCopy,
  icon,
  color = "blue"
}: {
  title: string;
  content?: string;
  onCopy: () => void;
  icon: React.ReactNode;
  color?: string;
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
    <div className="bg-white/5 rounded-lg border border-white/10 p-4 hover:bg-white/10 transition-all duration-200">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${colorClasses[color as keyof typeof colorClasses]}`}>
            {icon}
          </div>
          <h4 className="text-sm font-semibold text-white">{title}</h4>
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
                ? 'text-gray-300 hover:bg-white/10' 
                : 'text-gray-500 cursor-not-allowed'
          }`}
        >
          {copied ? (
            <>
              <CheckCircle className="w-3 h-3 mr-1" />
              Copié
            </>
          ) : (
            <>
              <Copy className="w-3 h-3 mr-1" />
              Copier
            </>
          )}
        </Button>
      </div>
      
      <div className="min-h-[80px]">
        {content ? (
          <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap bg-white/5 p-3 rounded border border-white/10 font-mono text-xs">
            {content}
          </div>
        ) : (
          <div className="flex items-center justify-center h-20">
            <div className="text-center">
              <div className="text-gray-500 text-xs">
                Cliquez sur "Générer" pour créer le contenu
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
