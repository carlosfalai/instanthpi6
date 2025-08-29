import React, { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";

interface Consultation {
  id: string;
  patient_id: string;
  chief_complaint: string;
  severity: number;
  status: string;
  created_at: string;
  clinical_notes: any;
  form_data: any;
}

interface Clinic {
  id: string;
  name: string;
  code: string;
}

export function PhysicianPortal() {
  const [selectedClinic, setSelectedClinic] = useState<string>("");
  const [patientId, setPatientId] = useState("");
  const [consultation, setConsultation] = useState<Consultation | null>(null);
  const [aiCommand, setAiCommand] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [consultations, setConsultations] = useState<Consultation[]>([]);

  const clinics: Clinic[] = [
    { id: "1", name: "Clinique Centrale", code: "CLIN01" },
    { id: "2", name: "Centre Médical Nord", code: "CLIN02" },
    { id: "3", name: "Urgences Est", code: "CLIN03" },
  ];

  // Fetch consultations for selected clinic
  useEffect(() => {
    if (selectedClinic) {
      fetchClinicConsultations();
    }
  }, [selectedClinic]);

  const fetchClinicConsultations = async () => {
    const { data, error } = await supabase
      .from("consultations")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(20);

    if (data) {
      setConsultations(data);
    }
  };

  // Fetch consultation by patient ID
  const fetchConsultation = async () => {
    if (!patientId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("consultations")
        .select("*")
        .eq("patient_id", patientId.toUpperCase())
        .single();

      if (error) throw error;
      setConsultation(data);
    } catch (error) {
      console.error("Error:", error);
      alert("Patient non trouvé");
    } finally {
      setLoading(false);
    }
  };

  // Process AI command
  const processAiCommand = async () => {
    if (!consultation || !aiCommand) return;

    setLoading(true);
    try {
      // Call AI processing endpoint
      const response = await fetch("/api/ai/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          command: aiCommand,
          consultation: consultation,
          template: getTemplateForCommand(aiCommand),
        }),
      });

      const result = await response.json();
      setAiResponse(result.output);
    } catch (error) {
      console.error("AI Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const getTemplateForCommand = (command: string) => {
    const lowerCommand = command.toLowerCase();

    if (
      lowerCommand.includes("référence") ||
      lowerCommand.includes("pt") ||
      lowerCommand.includes("physiothérapie")
    ) {
      return "referral_pt";
    }
    if (lowerCommand.includes("ot") || lowerCommand.includes("ergothérapie")) {
      return "referral_ot";
    }
    if (lowerCommand.includes("travail social") || lowerCommand.includes("social")) {
      return "referral_social";
    }
    if (lowerCommand.includes("imagerie") || lowerCommand.includes("radiologie")) {
      return "imaging";
    }
    return "general";
  };

  const quickCommands = [
    { label: "Référence PT", command: "Prépare une référence en physiothérapie" },
    { label: "Référence OT", command: "Prépare une référence en ergothérapie" },
    { label: "Travail Social", command: "Prépare une référence au travail social" },
    { label: "Imagerie", command: "Prépare une demande d'imagerie médicale" },
    { label: "Plan de suivi", command: "Génère un plan de suivi détaillé" },
    { label: "Résumé SOAP", command: "Génère une note SOAP complète" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Portail Médecin</h1>

          {/* Clinic Selector */}
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sélectionner la clinique
              </label>
              <select
                value={selectedClinic}
                onChange={(e) => setSelectedClinic(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">-- Choisir une clinique --</option>
                {clinics.map((clinic) => (
                  <option key={clinic.id} value={clinic.id}>
                    {clinic.name} ({clinic.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Patient ID Search */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ID Patient (10 caractères)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value.toUpperCase())}
                  placeholder="Ex: A1B2C3D4E5"
                  maxLength={10}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md font-mono"
                />
                <button
                  onClick={fetchConsultation}
                  disabled={loading || patientId.length !== 10}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                >
                  Rechercher
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pending Consultations List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">
                Consultations en attente ({consultations.length})
              </h2>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {consultations.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setPatientId(c.patient_id);
                      setConsultation(c);
                    }}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      consultation?.id === c.id
                        ? "border-indigo-500 bg-indigo-50"
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-mono text-sm font-semibold">{c.patient_id}</p>
                        <p className="text-sm text-gray-600 truncate">{c.chief_complaint}</p>
                      </div>
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          c.severity >= 8
                            ? "bg-red-100 text-red-700"
                            : c.severity >= 5
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-green-100 text-green-700"
                        }`}
                      >
                        {c.severity}/10
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(c.created_at).toLocaleString("fr-CA")}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Consultation Details & AI Interface */}
          <div className="lg:col-span-2 space-y-6">
            {consultation ? (
              <>
                {/* Patient Details */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-lg font-semibold mb-4">Détails de la consultation</h2>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600">ID Patient</p>
                      <p className="font-mono font-bold">{consultation.patient_id}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Date</p>
                      <p>{new Date(consultation.created_at).toLocaleString("fr-CA")}</p>
                    </div>
                  </div>

                  {consultation.clinical_notes && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 p-4 rounded">
                        <h3 className="font-semibold text-sm mb-2">Note clinique</h3>
                        <pre className="whitespace-pre-wrap text-sm">
                          {consultation.clinical_notes.soapNote || "Aucune note"}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>

                {/* AI Assistant */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-lg font-semibold mb-4">Assistant IA Clinique</h2>

                  {/* Quick Commands */}
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-2">Commandes rapides:</p>
                    <div className="flex flex-wrap gap-2">
                      {quickCommands.map((cmd, idx) => (
                        <button
                          key={idx}
                          onClick={() => setAiCommand(cmd.command)}
                          className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md"
                        >
                          {cmd.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* AI Command Input */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Commande pour l'IA
                      </label>
                      <textarea
                        value={aiCommand}
                        onChange={(e) => setAiCommand(e.target.value)}
                        placeholder="Ex: Prépare une référence en physiothérapie pour ce patient..."
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>

                    <button
                      onClick={processAiCommand}
                      disabled={loading || !aiCommand}
                      className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {loading ? "Traitement..." : "Générer avec IA"}
                    </button>

                    {/* AI Response */}
                    {aiResponse && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold text-sm">Réponse IA</h3>
                          <button
                            onClick={() => navigator.clipboard.writeText(aiResponse)}
                            className="text-sm text-indigo-600 hover:text-indigo-700"
                          >
                            Copier
                          </button>
                        </div>
                        <pre className="whitespace-pre-wrap text-sm font-mono bg-white p-3 rounded border">
                          {aiResponse}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex gap-3">
                    <button
                      onClick={async () => {
                        await supabase
                          .from("consultations")
                          .update({ status: "in_progress" })
                          .eq("id", consultation.id);
                        alert("Statut mis à jour");
                      }}
                      className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
                    >
                      Marquer en cours
                    </button>
                    <button
                      onClick={async () => {
                        await supabase
                          .from("consultations")
                          .update({ status: "completed", completed_at: new Date() })
                          .eq("id", consultation.id);
                        alert("Consultation complétée");
                        setConsultation(null);
                        fetchClinicConsultations();
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                    >
                      Marquer complété
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <p className="text-gray-500">
                  Sélectionnez une consultation ou entrez un ID patient
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
