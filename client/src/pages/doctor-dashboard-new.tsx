import React from "react";
import { useLocation } from "wouter";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Search, LogOut, ChevronRight, User, Activity, Clock, AlertTriangle, CheckCircle, Copy, Brain, Stethoscope, FileText, Users, Settings, Bell, Eye, Edit, Download, Phone, Mail, Calendar, Heart, Zap, TrendingUp, BarChart3, PieChart, LineChart } from "lucide-react";
import { format } from "date-fns";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || "",
  import.meta.env.VITE_SUPABASE_ANON_KEY || ""
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
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Stethoscope className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">Dashboard</h1>
                  <p className="text-sm text-gray-400">Today, {format(new Date(), "MMMM d, yyyy")}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search patients..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && searchPatients()}
                  className="pl-10 pr-4 py-2 bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
                />
              </div>

              {/* Doctor Profile */}
              <div
                className="flex items-center gap-3 px-3 py-2 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors"
                onClick={() => navigate("/doctor-profile")}
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  {docHeader.avatarUrl ? (
                    <img src={docHeader.avatarUrl} alt="Avatar" className="w-full h-full object-cover rounded-full" />
                  ) : (
                    <User className="w-4 h-4 text-white" />
                  )}
                </div>
                <div className="text-sm">
                  <p className="font-medium text-white">{docHeader.name}</p>
                  <p className="text-gray-400 text-xs">{docHeader.specialty}</p>
                </div>
              </div>

              <Button
                onClick={handleLogout}
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white hover:bg-gray-700"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Navigation */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                className="text-gray-400 hover:text-white hover:bg-gray-700"
              >
                <Users className="w-4 h-4 mr-2" />
                All Patients
              </Button>
              <Button
                variant="ghost"
                className="text-gray-400 hover:text-white hover:bg-gray-700"
              >
                <Activity className="w-4 h-4 mr-2" />
                Active Cases
              </Button>
              <Button
                variant="ghost"
                className="text-gray-400 hover:text-white hover:bg-gray-700"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Completed
              </Button>
              <Button
                variant="ghost"
                className="text-gray-400 hover:text-white hover:bg-gray-700"
              >
                <Clock className="w-4 h-4 mr-2" />
                Pending
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white hover:bg-gray-700"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white hover:bg-gray-700"
              >
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Monthly Consultations */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white text-lg">Monthly Consultations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Total Patients</span>
                    <span className="text-2xl font-bold text-white">2.4k</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Active Cases</span>
                    <span className="text-2xl font-bold text-white">1.3k</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Completion Rate</span>
                      <span className="text-white">85%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full" style={{width: '85%'}}></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Enhanced Patient Cards */}
            {searchResults.length > 0 && (
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Search className="w-5 h-5" />
                    Patient Search Results
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {searchResults.map((patient) => (
                      <EnhancedPatientCard
                        key={patient.id}
                        patient={patient}
                        onView={() => openPatientDetails(patient)}
                        onEdit={() => console.log('Edit patient:', patient.id)}
                        onGenerateReport={() => {
                          openPatientDetails(patient);
                          setTimeout(() => generateFrenchTranscription(), 100);
                        }}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Analytics Dashboard */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Medical Analytics
                </CardTitle>
                <p className="text-sm text-gray-400">Real-time medical metrics and trends</p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Patient Flow Chart */}
                  <div className="space-y-4">
                    <h4 className="text-white font-semibold flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      Patient Flow
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400 text-sm">New Patients</span>
                        <span className="text-white font-semibold">24</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400 text-sm">Active Consultations</span>
                        <span className="text-white font-semibold">49</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400 text-sm">Completed Today</span>
                        <span className="text-white font-semibold">18</span>
                      </div>
                    </div>
                  </div>

                  {/* AI Processing Stats */}
                  <div className="space-y-4">
                    <h4 className="text-white font-semibold flex items-center gap-2">
                      <Brain className="w-4 h-4" />
                      AI Processing
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400 text-sm">Reports Generated</span>
                        <span className="text-white font-semibold">156</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400 text-sm">Accuracy Rate</span>
                        <span className="text-green-400 font-semibold">94.2%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400 text-sm">Avg Processing Time</span>
                        <span className="text-white font-semibold">2.3s</span>
                      </div>
                    </div>
                  </div>

                  {/* Common Conditions */}
                  <div className="space-y-4">
                    <h4 className="text-white font-semibold flex items-center gap-2">
                      <Heart className="w-4 h-4" />
                      Top Conditions
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400 text-sm">Respiratory</span>
                        <span className="text-white font-semibold">32%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400 text-sm">Cardiovascular</span>
                        <span className="text-white font-semibold">28%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400 text-sm">Gastrointestinal</span>
                        <span className="text-white font-semibold">24%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Revenue Summary */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white text-lg">Revenue Summary</CardTitle>
                <p className="text-sm text-gray-400">Last 30 Days</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Consultation Fees</span>
                    <span className="text-white font-semibold">$12,900</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">AI Processing</span>
                    <span className="text-white font-semibold">$9,950</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Subscription</span>
                    <span className="text-white font-semibold">$3,700</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Digital Reports</span>
                    <span className="text-white font-semibold">$3,700</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Medical Transcription */}
            {selectedPatient && (
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white flex items-center gap-2">
                      <Brain className="w-5 h-5" />
                      Medical Report
                    </CardTitle>
                    <Button
                      onClick={generateFrenchTranscription}
                      disabled={generating}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {generating ? (
                        <>
                          <Activity className="w-4 h-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Brain className="w-4 h-4 mr-2" />
                          Generate
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
                      <p className="text-gray-400">Click "Generate" to create medical report</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Real-time Activity */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white text-lg">Real-time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-4xl font-bold text-white mb-2">49</div>
                  <p className="text-gray-400 text-sm">Active Consultations</p>
                  <div className="mt-4 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg opacity-20"></div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Patients */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white text-lg">Recent Consultations</CardTitle>
              </CardHeader>
              <CardContent>
                {recentPatients.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-400">No recent consultations</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentPatients.slice(0, 5).map((patient) => (
                      <div
                        key={patient.id}
                        className="p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors cursor-pointer"
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
                              <p className="text-xs text-gray-400">{patient.chief_complaint}</p>
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

        {/* Bottom Row - Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                  <Activity className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Total Consultations</p>
                  <p className="text-2xl font-bold text-white">$59,304</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm">This Month Consultations</p>
                  <p className="text-2xl font-bold text-white">$12,661</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm">This Month Patients</p>
                  <p className="text-2xl font-bold text-white">759</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm">This Month Reports</p>
                  <p className="text-2xl font-bold text-white">166,543</p>
                </div>
              </div>
            </CardContent>
          </Card>
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
    switch (level) {
      case "High": return "bg-red-500/20 text-red-300 border-red-500/30";
      case "Medium": return "bg-yellow-500/20 text-yellow-300 border-yellow-500/30";
      default: return "bg-green-500/20 text-green-300 border-green-500/30";
    }
  };

  const getStatusIcon = (level: string) => {
    switch (level) {
      case "High": return <AlertTriangle className="w-4 h-4 text-red-400" />;
      case "Medium": return <Clock className="w-4 h-4 text-yellow-400" />;
      default: return <CheckCircle className="w-4 h-4 text-green-400" />;
    }
  };

  return (
    <Card className="bg-gray-700 border-gray-600 hover:bg-gray-600 transition-all duration-200">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">
                {patient.patient_id?.charAt(0) || "P"}
              </span>
            </div>
            <div>
              <h3 className="font-semibold text-white text-lg">{patient.patient_id}</h3>
              <p className="text-sm text-gray-400">{patient.chief_complaint}</p>
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
            <span>Condition: {patient.chief_complaint}</span>
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
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Eye className="w-4 h-4 mr-2" />
            View
          </Button>
          <Button
            onClick={onEdit}
            size="sm"
            variant="outline"
            className="border-gray-500 text-gray-300 hover:bg-gray-600"
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            onClick={onGenerateReport}
            size="sm"
            variant="outline"
            className="border-gray-500 text-gray-300 hover:bg-gray-600"
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
    <div className="bg-gray-700 rounded-lg border border-gray-600 p-4 hover:bg-gray-600 transition-all duration-200">
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
