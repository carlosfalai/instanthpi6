import React, { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { PhysicianSettings } from "./PhysicianSettings";

interface PhysicianPreferences {
  showClinicalStrategy: boolean;
  showHPI: boolean;
  showSOAP: boolean;
  showFollowUpQuestions: boolean;
  showMedications: boolean;
  showLaboratory: boolean;
  showImaging: boolean;
  showReferrals: boolean;
  showWorkLeave: boolean;
  showWorkModifications: boolean;
  showInsuranceDeclaration: boolean;
  includeRationale: boolean;
  includeDifferentialDiagnosis: boolean;
  includeRedFlags: boolean;
  medicationWarnings: boolean;
  language: "fr" | "en";
  medicalTerminology: "standard" | "simplified";
}

export function PhysicianDashboard() {
  const [activeTab, setActiveTab] = useState<"search" | "settings">("search");
  const [searchId, setSearchId] = useState("");
  const [loading, setLoading] = useState(false);
  const [generatedReport, setGeneratedReport] = useState<string>("");
  const [consultation, setConsultation] = useState<any>(null);
  const [preferences, setPreferences] = useState<PhysicianPreferences | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showPrintView, setShowPrintView] = useState(false);

  useEffect(() => {
    loadPreferences();
    loadRecentSearches();
  }, []);

  const loadPreferences = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("physician_preferences")
        .select("output_preferences")
        .eq("physician_id", user.id)
        .single();

      if (data?.output_preferences) {
        setPreferences(data.output_preferences);
      } else {
        // Default preferences
        setPreferences({
          showClinicalStrategy: true,
          showHPI: true,
          showSOAP: true,
          showFollowUpQuestions: true,
          showMedications: true,
          showLaboratory: true,
          showImaging: true,
          showReferrals: true,
          showWorkLeave: true,
          showWorkModifications: true,
          showInsuranceDeclaration: true,
          includeRationale: true,
          includeDifferentialDiagnosis: true,
          includeRedFlags: true,
          medicationWarnings: true,
          language: "fr",
          medicalTerminology: "standard",
        });
      }
    } catch (error) {
      console.error("Error loading preferences:", error);
    }
  };

  const loadRecentSearches = () => {
    const recent = localStorage.getItem("recentPatientSearches");
    if (recent) {
      setRecentSearches(JSON.parse(recent));
    }
  };

  const saveRecentSearch = (patientId: string) => {
    const recent = [patientId, ...recentSearches.filter((id) => id !== patientId)].slice(0, 10);
    setRecentSearches(recent);
    localStorage.setItem("recentPatientSearches", JSON.stringify(recent));
  };

  const handleSearch = async () => {
    if (!searchId || searchId.length !== 10) {
      alert("Veuillez entrer un ID patient valide (10 caractères)");
      return;
    }

    setLoading(true);
    setGeneratedReport("");
    setConsultation(null);

    try {
      // Save to recent searches
      saveRecentSearch(searchId.toUpperCase());

      // Call API to generate report
      const response = await fetch("/api/clinical-ai/generate-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: searchId.toUpperCase(),
          physicianPreferences: preferences,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setGeneratedReport(result.html);
        setConsultation(result.consultation);
      } else {
        alert("Patient non trouvé");
      }
    } catch (error) {
      console.error("Error generating report:", error);
      alert("Erreur lors de la génération du rapport");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(generatedReport);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleExport = () => {
    const blob = new Blob([generatedReport], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rapport_${searchId}_${new Date().toISOString().split("T")[0]}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopySection = (sectionId: string) => {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = generatedReport;
    const section = tempDiv.querySelector(`#${sectionId}`);
    if (section) {
      navigator.clipboard.writeText(section.textContent || "");
      alert("Section copiée dans le presse-papiers");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Tableau de Bord Médecin</h1>

          {/* Tab Navigation */}
          <div className="flex space-x-4 border-b">
            <button
              onClick={() => setActiveTab("search")}
              className={`pb-2 px-4 font-semibold transition-colors ${
                activeTab === "search"
                  ? "text-indigo-600 border-b-2 border-indigo-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Recherche Patient
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              className={`pb-2 px-4 font-semibold transition-colors ${
                activeTab === "settings"
                  ? "text-indigo-600 border-b-2 border-indigo-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Paramètres de Sortie
            </button>
          </div>
        </div>

        {/* Content */}
        {activeTab === "search" ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Search Panel */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold mb-4">Recherche Patient</h2>

                {/* Search Input */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ID Patient (10 caractères)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={searchId}
                      onChange={(e) => setSearchId(e.target.value.toUpperCase())}
                      placeholder="Ex: A1B2C3D4E5"
                      maxLength={10}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md font-mono text-lg"
                      onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                    />
                    <button
                      onClick={handleSearch}
                      disabled={loading || searchId.length !== 10}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {loading ? "⏳" : "🔍"}
                    </button>
                  </div>
                </div>

                {/* Recent Searches */}
                {recentSearches.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Recherches récentes</h3>
                    <div className="space-y-1">
                      {recentSearches.map((id) => (
                        <button
                          key={id}
                          onClick={() => {
                            setSearchId(id);
                            handleSearch();
                          }}
                          className="w-full text-left px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 rounded font-mono"
                        >
                          {id}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quick Stats */}
                {consultation && (
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <h3 className="font-semibold text-sm mb-2">Informations Patient</h3>
                    <div className="space-y-1 text-sm">
                      <p>
                        <span className="font-medium">ID:</span> {consultation.patient_id}
                      </p>
                      <p>
                        <span className="font-medium">Date:</span>{" "}
                        {new Date(consultation.created_at).toLocaleDateString("fr-CA")}
                      </p>
                      <p>
                        <span className="font-medium">Sévérité:</span> {consultation.severity}/10
                      </p>
                      <p>
                        <span className="font-medium">Statut:</span> {consultation.status}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Report Display */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm p-6">
                {/* Action Bar */}
                {generatedReport && (
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold">Rapport Clinique Généré</h2>
                    <div className="flex gap-2">
                      <button
                        onClick={handlePrint}
                        className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md"
                      >
                        🖨️ Imprimer
                      </button>
                      <button
                        onClick={handleExport}
                        className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md"
                      >
                        💾 Exporter
                      </button>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(generatedReport);
                          alert("Rapport copié");
                        }}
                        className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md"
                      >
                        📋 Copier
                      </button>
                      <button
                        onClick={() => setShowPrintView(!showPrintView)}
                        className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md"
                      >
                        {showPrintView ? "📄 HTML" : "👁️ Aperçu"}
                      </button>
                    </div>
                  </div>
                )}

                {/* Report Content */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  {loading ? (
                    <div className="p-12 text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto mb-4"></div>
                      <p className="text-gray-600">Génération du rapport en cours...</p>
                      <p className="text-sm text-gray-500 mt-2">
                        Utilisation de GPT-4o pour analyse clinique
                      </p>
                    </div>
                  ) : generatedReport ? (
                    showPrintView ? (
                      <div className="p-4 bg-gray-50">
                        <pre className="text-xs overflow-x-auto">{generatedReport}</pre>
                      </div>
                    ) : (
                      <iframe
                        srcDoc={generatedReport}
                        className="w-full h-[800px] border-0"
                        title="Clinical Report"
                      />
                    )
                  ) : (
                    <div className="p-12 text-center text-gray-500">
                      <p className="text-lg mb-2">Aucun rapport généré</p>
                      <p className="text-sm">Entrez un ID patient et cliquez sur rechercher</p>
                    </div>
                  )}
                </div>

                {/* Section Quick Actions */}
                {generatedReport && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Actions rapides par section:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {preferences?.showHPI && (
                        <button
                          onClick={() => handleCopySection("hpi")}
                          className="px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50"
                        >
                          Copier HPI
                        </button>
                      )}
                      {preferences?.showSOAP && (
                        <button
                          onClick={() => handleCopySection("soap")}
                          className="px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50"
                        >
                          Copier SOAP
                        </button>
                      )}
                      {preferences?.showMedications && (
                        <button
                          onClick={() => handleCopySection("medications")}
                          className="px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50"
                        >
                          Copier Médicaments
                        </button>
                      )}
                      {preferences?.showReferrals && (
                        <button
                          onClick={() => handleCopySection("referrals")}
                          className="px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50"
                        >
                          Copier Références
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <PhysicianSettings />
        )}
      </div>
    </div>
  );
}
