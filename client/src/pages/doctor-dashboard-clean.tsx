import React from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, LogOut, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default function DoctorDashboard() {
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
    name: "Dr. Smith",
    specialty: "Internal Medicine",
    avatarUrl: null
  });

  // Load recent patients on mount
  React.useEffect(() => {
    loadRecentPatients();
  }, []);

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

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("consultations")
        .select("*")
        .eq("patient_id", searchQuery.toUpperCase())
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSearchResults(data || []);
    } catch (error) {
      console.error("Error searching patients:", error);
    } finally {
      setLoading(false);
    }
  };

  const openPatientDetails = (consultation: any) => {
    setSelectedPatient(consultation.patient_id);
    // Load cached transcription if available
    const cacheKey = `french_transcription_${consultation.patient_id}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        setFrenchDoc(JSON.parse(cached));
      } catch (e) {
        console.error("Error parsing cached data:", e);
      }
    } else {
      setFrenchDoc(null);
    }
  };

  const generateFrenchTranscription = async () => {
    if (!selectedPatient || generating) return;

    setGenerating(true);
    try {
      const response = await fetch("/api/medical-transcription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId: selectedPatient })
      });

      if (!response.ok) throw new Error("Failed to generate transcription");

      const data = await response.json();
      setFrenchDoc(data);

      // Cache the result
      const cacheKey = `french_transcription_${selectedPatient}`;
      localStorage.setItem(cacheKey, JSON.stringify(data));
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

  const copyAll = () => {
    const allText = Object.values(frenchDoc || {}).join("\n\n");
    copyToClipboard(allText);
  };

  const getTriageColor = (level: string) => {
    switch (level) {
      case "High": return "bg-red-900 text-red-300";
      case "Medium": return "bg-yellow-900 text-yellow-300";
      default: return "bg-green-900 text-green-300";
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("doctor_authenticated");
    navigate("/doctor-login");
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Linear-style Header */}
      <header className="bg-gray-900 border-b border-gray-800">
        <div className="flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-4">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">IH</span>
              </div>
              <div>
                <h1 className="text-lg font-semibold text-white">InstantHPI</h1>
                <p className="text-xs text-gray-400">Doctor's Lounge</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search patients..."
                className="pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
              />
            </div>

            {/* Doctor Profile */}
            <div className="flex items-center gap-3 px-3 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors cursor-pointer">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                {docHeader.avatarUrl ? (
                  <img src={docHeader.avatarUrl} alt="Avatar" className="w-full h-full object-cover rounded-full" />
                ) : (
                  <span className="text-sm font-medium text-white">
                    {(docHeader.name?.split(" ").map((s) => s[0]).join("") || "DR").slice(0, 2).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="text-sm">
                <p className="font-medium text-white">{docHeader.name}</p>
                <p className="text-gray-400 text-xs">{docHeader.specialty || "—"}</p>
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-gray-400 hover:text-white hover:bg-gray-800"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Linear-style Sidebar */}
        <aside className="w-64 bg-gray-900 border-r border-gray-800 h-screen sticky top-0">
          <div className="p-4">
            {/* Navigation */}
            <nav className="space-y-1">
              <div className="mb-6">
                <Button
                  className="w-full justify-start bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => navigate("/doctor-dashboard")}
                >
                  <div className="w-2 h-2 bg-blue-400 rounded-full mr-3"></div>
                  Dashboard
                </Button>
              </div>

              <div className="space-y-1">
                <div className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Patient Management</div>
                <Button variant="ghost" className="w-full justify-start text-gray-300 hover:text-white hover:bg-gray-800">
                  <div className="w-2 h-2 bg-gray-500 rounded-full mr-3"></div>
                  Active Patients
                </Button>
                <Button variant="ghost" className="w-full justify-start text-gray-300 hover:text-white hover:bg-gray-800">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mr-3"></div>
                  Pending Review
                </Button>
                <Button variant="ghost" className="w-full justify-start text-gray-300 hover:text-white hover:bg-gray-800">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  Completed
                </Button>
              </div>

              <div className="mt-6 space-y-1">
                <div className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Medical Tools</div>
                <Button variant="ghost" className="w-full justify-start text-gray-300 hover:text-white hover:bg-gray-800">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                  Transcription
                </Button>
                <Button variant="ghost" className="w-full justify-start text-gray-300 hover:text-white hover:bg-gray-800">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mr-3"></div>
                  Reports
                </Button>
                <Button variant="ghost" className="w-full justify-start text-gray-300 hover:text-white hover:bg-gray-800">
                  <div className="w-2 h-2 bg-pink-500 rounded-full mr-3"></div>
                  Analytics
                </Button>
              </div>
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 bg-gray-950">
          <div className="p-6">
            {/* Linear-style Project Header */}
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

            {/* Patient Search - Linear Style */}
            <div className="mb-8">
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                    <Search className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Patient Search</h3>
                    <p className="text-sm text-gray-400">Enter patient ID to access medical records</p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value.toUpperCase())}
                      onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                      placeholder="Patient ID (e.g., A1B2C3D4E5)"
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                    />
                  </div>
                  <Button
                    onClick={handleSearch}
                    disabled={loading || !searchQuery.trim()}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium"
                  >
                    {loading ? "Searching..." : "Search"}
                  </Button>
                </div>

                {/* Search Results */}
                {searchResults.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-sm font-medium text-gray-400 mb-3">Search Results</h4>
                    <div className="space-y-2">
                      {searchResults.map((consultation) => (
                        <div
                          key={consultation.id}
                          className="p-4 bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-750 cursor-pointer transition-colors"
                          onClick={() => openPatientDetails(consultation)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="font-mono font-bold text-lg text-white">
                                {consultation.patient_id}
                              </span>
                              <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                                consultation.triage_level === 'High' ? 'bg-red-900 text-red-300' :
                                consultation.triage_level === 'Medium' ? 'bg-yellow-900 text-yellow-300' :
                                'bg-green-900 text-green-300'
                              }`}>
                                {consultation.triage_level}
                              </div>
                              <div className="px-2 py-1 bg-gray-700 text-gray-300 rounded-full text-xs">
                                {consultation.status}
                              </div>
                            </div>
                            <ChevronRight className="h-4 w-4 text-gray-400" />
                          </div>
                          <p className="text-sm text-gray-300 mt-2">
                            <strong>Chief Complaint:</strong> {consultation.chief_complaint}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {format(new Date(consultation.created_at), "PPpp")}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Medical Sections - Linear Style Grid */}
            <div className="mb-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">M</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Medical Transcription</h3>
                  <p className="text-sm text-gray-400">AI-generated medical documentation</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <LinearSection
                  title="HPI Summary"
                  text={frenchDoc?.hpiConfirmationSummary}
                  onCopy={() => copyToClipboard(frenchDoc?.hpiConfirmationSummary || "")}
                  color="blue"
                />
                <LinearSection
                  title="Follow-up Questions"
                  text={frenchDoc?.followUpQuestions}
                  onCopy={() => copyToClipboard(frenchDoc?.followUpQuestions || "")}
                  color="green"
                />
                <LinearSection
                  title="SAP Note"
                  text={frenchDoc?.superSpartanSAP}
                  onCopy={() => copyToClipboard(frenchDoc?.superSpartanSAP || "")}
                  color="purple"
                />
                <LinearSection
                  title="Medications"
                  text={frenchDoc?.medicationsReadyToUse}
                  onCopy={() => copyToClipboard(frenchDoc?.medicationsReadyToUse || "")}
                  color="orange"
                />
                <LinearSection
                  title="Lab Works"
                  text={frenchDoc?.labWorks}
                  onCopy={() => copyToClipboard(frenchDoc?.labWorks || "")}
                  color="pink"
                />
                <LinearSection
                  title="Imaging"
                  text={frenchDoc?.imagerieMedicale}
                  onCopy={() => copyToClipboard(frenchDoc?.imagerieMedicale || "")}
                  color="cyan"
                />
                <LinearSection
                  title="Specialist Referrals"
                  text={frenchDoc?.referenceSpecialistes}
                  onCopy={() => copyToClipboard(frenchDoc?.referenceSpecialistes || "")}
                  color="indigo"
                />
                <LinearSection
                  title="Work Leave"
                  text={frenchDoc?.workLeaveCertificate}
                  onCopy={() => copyToClipboard(frenchDoc?.workLeaveCertificate || "")}
                  color="yellow"
                />
                <LinearSection
                  title="Workplace Mods"
                  text={frenchDoc?.workplaceModifications}
                  onCopy={() => copyToClipboard(frenchDoc?.workplaceModifications || "")}
                  color="red"
                />
                <LinearSection
                  title="Insurance"
                  text={frenchDoc?.insuranceDocumentation}
                  onCopy={() => copyToClipboard(frenchDoc?.insuranceDocumentation || "")}
                  color="emerald"
                />
                <LinearSection
                  title="Telemedicine"
                  text={frenchDoc?.telemedicineNeedsInPerson}
                  onCopy={() => copyToClipboard(frenchDoc?.telemedicineNeedsInPerson || "")}
                  color="violet"
                />
                <LinearSection
                  title="Patient Message"
                  text={frenchDoc?.patientMessage}
                  onCopy={() => copyToClipboard(frenchDoc?.patientMessage || "")}
                  color="teal"
                />
              </div>
            </div>

            {/* Recent Patients - Linear Style */}
            <div className="mb-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">R</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Recent Consultations</h3>
                  <p className="text-sm text-gray-400">Latest patient submissions</p>
                </div>
              </div>

              <div className="bg-gray-900 border border-gray-800 rounded-lg">
                {recentPatients.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-gray-400">No recent consultations</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-800">
                    {recentPatients.map((consultation) => (
                      <div
                        key={consultation.id}
                        className="p-4 hover:bg-gray-800 cursor-pointer transition-colors"
                        onClick={() => openPatientDetails(consultation)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="font-mono font-bold text-lg text-white">
                              {consultation.patient_id}
                            </span>
                            <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                              consultation.triage_level === 'High' ? 'bg-red-900 text-red-300' :
                              consultation.triage_level === 'Medium' ? 'bg-yellow-900 text-yellow-300' :
                              'bg-green-900 text-green-300'
                            }`}>
                              {consultation.triage_level}
                            </div>
                            <div className="px-2 py-1 bg-gray-700 text-gray-300 rounded-full text-xs">
                              {consultation.status}
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 text-gray-400" />
                        </div>
                        <p className="text-sm text-gray-300 mt-2">
                          <strong>Chief Complaint:</strong> {consultation.chief_complaint}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {format(new Date(consultation.created_at), "PPpp")}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

// Linear-style Section Component
function LinearSection({
  title,
  text,
  onCopy,
  color = "blue"
}: {
  title: string;
  text?: string;
  onCopy: () => void;
  color?: string;
}) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    onCopy();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const colorClasses = {
    blue: "bg-blue-600",
    green: "bg-green-600", 
    purple: "bg-purple-600",
    orange: "bg-orange-600",
    pink: "bg-pink-600",
    cyan: "bg-cyan-600",
    indigo: "bg-indigo-600",
    yellow: "bg-yellow-600",
    red: "bg-red-600",
    emerald: "bg-emerald-600",
    violet: "bg-violet-600",
    teal: "bg-teal-600"
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 hover:bg-gray-850 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${colorClasses[color as keyof typeof colorClasses]}`}></div>
          <h4 className="text-sm font-medium text-white">{title}</h4>
        </div>
        <button
          onClick={handleCopy}
          disabled={!text}
          className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
            copied 
              ? 'bg-green-600 text-white' 
              : text 
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                : 'bg-gray-800 text-gray-500 cursor-not-allowed'
          }`}
        >
          {copied ? '✓' : 'Copy'}
        </button>
      </div>
      
      <div className="min-h-[100px]">
        {text ? (
          <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap font-mono bg-gray-800 p-3 rounded border border-gray-700">
            {text}
          </div>
        ) : (
          <div className="flex items-center justify-center h-24">
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
